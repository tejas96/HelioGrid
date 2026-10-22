'use client';
import type { ChosenPicture } from '@heliogrid/data/react';
import { FILE_SUBJECT_RULES } from '@heliogrid/domain';
import { type PickedFile, pickedFileOf } from '@heliogrid/ui';
import { useEffect, useRef } from 'react';

/**
 * A file chosen or dropped in the browser, as the company logo and the profile photo take an image:
 * its type and size as the browser reports them, its width as the browser decodes it, its bytes,
 * and a picture to draw at once. A file the browser cannot decode has no width, which the logo's
 * rule reads as not an image.
 */
export function useImageFile(choose: (image: ChosenPicture) => void): (picked: PickedFile) => void {
  const pictures = useRef<string[]>([]);
  // An object URL holds its file in memory until it is revoked, and a held image's picture is
  // drawn until the screen goes: all are let go together, then.
  useEffect(
    () => () => {
      for (const picture of pictures.current) URL.revokeObjectURL(picture);
    },
    [],
  );
  return (picked) => {
    const file = picked.source;
    if (!(file instanceof File)) return;
    void Promise.all([file.arrayBuffer(), widthOf(file)]).then(([buffer, widthPx]) => {
      const picture = URL.createObjectURL(file);
      pictures.current.push(picture);
      choose({
        contentType: file.type,
        byteSize: file.size,
        widthPx,
        bytes: new Uint8Array(buffer),
        picture,
      });
    });
  };
}

async function widthOf(file: Blob): Promise<number | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width } = bitmap;
    bitmap.close();
    return width;
  } catch {
    return null;
  }
}

/** The browser's own file chooser, for a control that is not a file input itself (`PhotoField`'s act). */
export function openImagePicker(onPicked: (picked: PickedFile) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = FILE_SUBJECT_RULES.user_account.contentTypes.join(',');
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file !== undefined) onPicked(pickedFileOf(file));
  });
  input.click();
}
