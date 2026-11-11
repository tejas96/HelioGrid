/** A file the device picked, as the app's chooser hands it over — a photo already shrunk. */
export interface PickedFile {
  readonly bytes: Uint8Array;
  readonly name: string;
  readonly contentType: 'image/png' | 'image/jpeg' | 'application/pdf';
}

/**
 * What a device's file chooser hands its pick to — a lead's files, a project's place for one. The
 * pick that came back undone is sent again before a new one is chosen, so a person who taps *Add*
 * after *Not sent* never loses the file they picked.
 */
export interface FilePickTarget {
  upload(file: PickedFile): void;
  /** The last pick came back undone and waits to be sent again. */
  readonly uploadFailed: boolean;
  retryUpload(): void;
}
