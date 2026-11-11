'use client';
import type {
  FilePickTarget,
  FilePlace,
  LeadFiles,
  PickedFile,
  ProjectScreen,
} from '@heliogrid/data/react';
import { FILE_SUBJECT_RULES } from '@heliogrid/domain';

/** A photo's longest side once shrunk (`F8-36`): readable, and light on a slow network. */
const PHOTO_SIDE_PX = 2048;
const PHOTO_QUALITY = 0.8;

/** A lead's file — the bill, a roof photo, an ID (`M02-32`). */
export function pickLeadFile(files: LeadFiles): void {
  pickFile(files, FILE_SUBJECT_RULES.lead.contentTypes);
}

/** A project's file for a place — what the project page and the installer's job share. */
export function pickProjectFile(screen: ProjectScreen, place: FilePlace): void {
  const failed = screen.uploadFailed;
  pickFile(
    {
      upload: (file) => screen.upload(file, place),
      uploadFailed:
        failed !== null && failed.slot === place.slot && failed.slotKey === place.slotKey,
      retryUpload: screen.retryUpload,
    },
    FILE_SUBJECT_RULES.project.contentTypes,
  );
}

/**
 * The web's one file chooser: the pick that did not go up goes again, else the browser's chooser
 * opens for the types the record takes and the chosen file goes up, a photo shrunk first.
 */
function pickFile(target: FilePickTarget, accept: readonly string[]): void {
  if (target.uploadFailed) {
    target.retryUpload();
    return;
  }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept.join(',');
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file !== undefined) {
      void pickedOf(file).then(
        (picked) => target.upload(picked),
        () => undefined,
      );
    }
  });
  input.click();
}

/** A chosen file as a record takes it: a photo shrunk to a JPEG first, a PDF as it is. */
async function pickedOf(file: File): Promise<PickedFile> {
  if (file.type === 'application/pdf') {
    return {
      bytes: new Uint8Array(await file.arrayBuffer()),
      name: file.name,
      contentType: 'application/pdf',
    };
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_SIDE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', PHOTO_QUALITY),
  );
  if (blob === null) throw new Error('the photo could not be shrunk');
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    name: file.name,
    contentType: 'image/jpeg',
  };
}
