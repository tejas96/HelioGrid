import type {
  ProjectDetail as ProjectDetailFacts,
  ProjectFile,
  TranslatedText,
} from '@heliogrid/contracts';
import type { ProjectDetailView } from '@heliogrid/domain';
import type { InstallerJobWords } from '../InstallerJob/InstallerJob.types';
import type { ProjectFilePlace, ProjectMenuAct } from './ProjectDetail.types';

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

/** The words over the project — its facts as pills, and its acts beside the title. */
export interface ProjectHeadWords {
  readonly manager: (name: string) => TranslatedText;
  readonly installBy: (date: string | null) => TranslatedText;
  readonly installing: (ticked: number, total: number) => TranslatedText;
  readonly installedOn: (date: string) => TranslatedText;
  readonly call: (name: string) => TranslatedText;
  readonly menu: TranslatedText;
  readonly changeDate: TranslatedText;
  readonly changeManager: TranslatedText;
  readonly changeAccess: TranslatedText;
  readonly moveBack: TranslatedText;
  readonly cancel: TranslatedText;
}

/**
 * Over the project, under its title (the picked design): its manager and its install as pills, and
 * its acts — *Call* the customer and the ⋯ of acts on the whole project, drawn only for a reader who
 * moves stages, on a live project.
 */
/**
 * `header` — the wide web's: the ⋯ alone beside the title. A desk has no dial pad to hand a call
 * to, and the Deal card shows the number. `bar` — the phone's top bar and the narrow web's way-back
 * row: Call, which opens the dial pad, and the ⋯ as round icons, as every record page's bar draws
 * its acts.
 */
export type ProjectHeadForm = 'header' | 'bar';

export interface ProjectHeadProps {
  readonly form: ProjectHeadForm;
  readonly project: ProjectDetailFacts;
  readonly view: ProjectDetailView;
  readonly words: ProjectHeadWords;
  readonly onCall: () => void;
  readonly onMenu: (act: ProjectMenuAct) => void;
  /** Any act is out: the ⋯ waits for its answer. */
  readonly sending: boolean;
}

/** The install steps' screen words: the installer's, and the crew and the way in beside them. */
export interface ProjectStepsWords extends InstallerJobWords {
  readonly noCrew: TranslatedText;
  readonly accessNote: TranslatedText;
  readonly changeAccess: TranslatedText;
  readonly done: TranslatedText;
}

/**
 * A project's install steps on their own screen (`SCR-M08-04`), opened from the hero's *Steps and
 * photos*: who is on the crew, how to get in with its edit, and the steps — the installer's own list,
 * each ticked with its photo — for a reader whose grant reaches the steps; read only for another.
 */
export interface ProjectStepsProps {
  readonly project: ProjectDetailFacts;
  readonly words: ProjectStepsWords;
  readonly onTick: (step: string, doneBy: string | null) => void;
  readonly onUntick: (step: string) => void;
  readonly onPhoto: (step: string) => void;
  readonly onRetryPhoto: (step: string) => void;
  /** How to get in, edited — for a reader who moves stages, on a live project. */
  readonly onAccess: () => void;
  readonly onOpenFile: (file: ProjectFile) => void;
  /** Why the last act came back refused, worded; or null. */
  readonly refusal: TranslatedText | null;
  readonly sending: boolean;
  readonly uploading: ProjectFilePlace | null;
  readonly uploadFailed: ProjectFilePlace | null;
}
