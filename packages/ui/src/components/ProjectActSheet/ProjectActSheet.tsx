import { EditorSurface } from '../EditorSurface';
import { AccessForm, DateForm, FileNameForm, NotNeededForm } from './ProjectActForms';
import { formOf, type ProjectForms } from './ProjectActSheet.forms';
import { headOf } from './ProjectActSheet.logic';
import type { ProjectActSheetProps } from './ProjectActSheet.types';
import { CancelForm } from './ProjectCancelForm';
import { EarlyForm } from './ProjectEarlyForm';
import { DispatchForm, ManagerForm } from './ProjectPeopleForms';
import { WaitForm } from './ProjectWaitForm';
import './ProjectActSheet.css';

/**
 * The project's acts, each in one sheet, on the web: below the editor breakpoint a sheet, above it
 * a decision centred over the page. While a send is out its fields are inert and every way out
 * waits; a refusal is said inside the sheet, above its send. Each form starts afresh when opened.
 */
export function ProjectActSheet({ form, onClose, sending, refusal, words }: ProjectActSheetProps) {
  const head = form === null ? null : headOf(form, words);
  const close = () => {
    if (!sending) onClose();
  };
  return (
    <EditorSurface
      open={form !== null}
      onClose={close}
      closeLabel={words.close}
      showClose
      title={head?.title}
      subtitle={head?.line ?? undefined}
      dismissible={!sending}
      desktop="modal"
    >
      {form === null ? null : (
        <div className="hg-project-act" aria-busy={sending ? true : undefined}>
          {formOf(FORMS, form, { sending, refusal, words, onClose: close })}
        </div>
      )}
    </EditorSurface>
  );
}

/** Each act's form on the web. */
const FORMS: ProjectForms = {
  dispatch: DispatchForm,
  wait: WaitForm,
  earlyProof: EarlyForm,
  notNeeded: NotNeededForm,
  cancel: CancelForm,
  date: DateForm,
  manager: ManagerForm,
  access: AccessForm,
  fileName: FileNameForm,
};
