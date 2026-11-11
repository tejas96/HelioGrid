/**
 * **One stored file by its own name** (`M02-32`, `M08-30`): a sheet glyph before it, and the
 * target opens it — a lead's paper, a project's document, a step's photo.
 */
export interface FileLinkProps {
  /** The file's own name, as its picker gave it: a fact, never translated. */
  readonly name: string;
  readonly onOpen: () => void;
}
