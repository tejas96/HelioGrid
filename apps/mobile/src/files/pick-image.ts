import type { ChosenLogo } from '@heliogrid/data/react';
import { bytesOfBase64 } from '@heliogrid/domain';
import { launchImageLibrary } from 'react-native-image-picker';

/**
 * One image from the system's photo picker, which asks for no permission: its type, its width, its
 * bytes and the address the phone draws it from. `null` when the person closed the picker. The
 * size is the bytes' own, never the picker's report: the store holds an upload to what is sent.
 */
export async function pickImage(): Promise<ChosenLogo | null> {
  const { assets } = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeBase64: true,
  });
  const asset = assets?.[0];
  if (asset?.base64 === undefined) return null;
  const bytes = bytesOfBase64(asset.base64);
  return {
    contentType: asset.type === 'image/jpg' ? 'image/jpeg' : (asset.type ?? ''),
    byteSize: bytes.byteLength,
    widthPx: asset.width ?? null,
    bytes,
    picture: asset.uri ?? null,
  };
}
