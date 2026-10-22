import type { PickedFile } from './Dropzone.types';

/** What a browser `File` reports, typed by shape so the phone's typecheck never meets the DOM. */
interface BrowserFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

/** A browser file as both halves hand it over: its facts, and the file itself as the handle. */
export function pickedFileOf(file: BrowserFile): PickedFile {
  return { name: file.name, size: file.size, type: file.type, source: file };
}
