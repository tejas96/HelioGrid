import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { HueTile } from '../HueTile/HueTile.native';
import { AccessForm, FileNameForm, NotNeededForm } from './ProjectActForms.native';
import { formOf, type ProjectForms } from './ProjectActSheet.forms';
import { headOf } from './ProjectActSheet.logic';
import type { ProjectActSheetProps } from './ProjectActSheet.types';
import { CancelForm } from './ProjectCancelForm.native';
import { EarlyForm } from './ProjectEarlyForm.native';
import { InstallDayForm } from './ProjectInstallDayForm.native';
import { DispatchForm, ManagerForm } from './ProjectPeopleForms.native';
import { WaitForm } from './ProjectWaitForm.native';

/**
 * The project's acts, each in one sheet, on the phone: the form the act needs, its refusal said
 * inside it, and every way out — the drag, the backdrop, Back, *Keep it* — waiting while its send
 * is out. Each form keeps its own draft, so a closed sheet forgets it.
 */
export function ProjectActSheet({ form, onClose, sending, refusal, words }: ProjectActSheetProps) {
  const head = form === null ? null : headOf(form, words);
  const close = () => {
    if (!sending) onClose();
  };
  // A proof that came early is a moment (the picked design): its spark above, the title centred.
  const moment = form?.kind === 'earlyProof';
  return (
    <EditorSurface
      open={form !== null}
      onClose={close}
      closeLabel={words.close}
      showClose
      desktop="modal"
      title={head?.title}
      subtitle={head?.line ?? undefined}
      leading={moment ? <HueTile glyph="spark" hue="teal" size={56} /> : undefined}
      sheetProps={{ headerLook: moment ? 'moment' : 'row' }}
      /* A centred dialog (an iPad) has no header tile: the spark rides the dialog's own mark. */
      modalProps={{
        icon: moment ? <ShellGlyph name="spark" size="md" tone="accent" /> : undefined,
      }}
      dismissible={!sending}
    >
      {form === null ? null : (
        <View style={styles.body}>
          {formOf(FORMS, form, { sending, refusal, words, onClose: close })}
        </View>
      )}
    </EditorSurface>
  );
}

/** Each act's form on the phone. */
const FORMS: ProjectForms = {
  dispatch: DispatchForm,
  wait: WaitForm,
  earlyProof: EarlyForm,
  notNeeded: NotNeededForm,
  cancel: CancelForm,
  date: InstallDayForm,
  manager: ManagerForm,
  access: AccessForm,
  fileName: FileNameForm,
};

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
});
