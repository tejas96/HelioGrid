import type { PickedFile } from '@heliogrid/data/react';
import { bytesOfBase64 } from '@heliogrid/domain';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { bytesOfLocalFile } from './local-file';

/**
 * A photo's longest side once shrunk (`F8-36`): a site photo or a scanned page stays readable,
 * and a slow network carries it — never the camera's full size.
 */
const PHOTO_SIDE_PX = 2048;
const PHOTO_QUALITY = 0.8;

/**
 * One file for a lead or a project, from where the person chose: a photo taken now or picked —
 * shrunk first as a JPEG, and stored under the name the caller gives it, since the camera's own is
 * a temporary one — or a PDF from the files under its own name, read from a copy kept in the app's
 * cache. Each answers `null` when the person closed the picker.
 */
export const takePhoto = (name: string): Promise<PickedFile | null> => pickPhoto(true, name);
export const choosePhoto = (name: string): Promise<PickedFile | null> => pickPhoto(false, name);

/** A receipt photo (`M11-37`), with the address the phone shows it from before it goes up. */
export async function pickReceiptPhoto(
  fromCamera: boolean,
  name: string,
): Promise<{ readonly file: PickedFile; readonly preview: string } | null> {
  const picked = await photoOf(fromCamera, name);
  return picked === null || picked.uri === undefined
    ? null
    : { file: picked.file, preview: picked.uri };
}

async function pickPhoto(fromCamera: boolean, name: string): Promise<PickedFile | null> {
  return (await photoOf(fromCamera, name))?.file ?? null;
}

async function photoOf(
  fromCamera: boolean,
  name: string,
): Promise<{ readonly file: PickedFile; readonly uri: string | undefined } | null> {
  const options = {
    mediaType: 'photo',
    includeBase64: true,
    maxWidth: PHOTO_SIDE_PX,
    maxHeight: PHOTO_SIDE_PX,
    quality: PHOTO_QUALITY,
  } as const;
  const { assets } = fromCamera
    ? await launchCamera({ ...options, saveToPhotos: false })
    : await launchImageLibrary({ ...options, selectionLimit: 1 });
  const asset = assets?.[0];
  if (asset?.base64 === undefined) return null;
  const png = asset.type === 'image/png';
  return {
    file: {
      bytes: bytesOfBase64(asset.base64),
      name: `${name}.${png ? 'png' : 'jpg'}`,
      contentType: png ? 'image/png' : 'image/jpeg',
    },
    uri: asset.uri,
  };
}

export async function choosePdf(): Promise<PickedFile | null> {
  try {
    const [picked] = await pick({ type: [types.pdf], allowMultiSelection: false });
    const name = picked.name ?? 'document.pdf';
    const [copy] = await keepLocalCopy({
      files: [{ uri: picked.uri, fileName: name }],
      destination: 'cachesDirectory',
    });
    if (copy.status !== 'success') return null;
    return { bytes: await bytesOfLocalFile(copy.localUri), name, contentType: 'application/pdf' };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return null;
    throw error;
  }
}
