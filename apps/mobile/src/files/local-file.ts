/**
 * The bytes of a file the app holds, read from its local address. Not the wire — no request leaves
 * the phone — so it takes the platform's local read, never `packages/data`'s transport. Asked as a
 * blob: Android reads a local file only for a blob (`BlobModule`), never for an `arraybuffer`.
 */
export function bytesOfLocalFile(localUri: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const read = new XMLHttpRequest();
    read.responseType = 'blob';
    read.onerror = () => reject(new Error('the picked file could not be read'));
    read.onload = () => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('the picked file could not be read'));
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(read.response as Blob);
    };
    read.open('GET', localUri);
    read.send();
  });
}
