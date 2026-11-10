import { useQuickAddScreen } from '@heliogrid/data/react';
import { quickAddDoneToast, quickAddWords, toastHostWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  EditorSurface,
  QuickAddForm,
  quickAddFormPropsOf,
  quickAddSurfaceOf,
  ToastHost,
  useFormat,
  useToasts,
} from '@heliogrid/ui';
import type { StaticScreenProps } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeadsListPage } from '../leads-list';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';
import { underPill } from '../shell/styles';
import { QuickAddDuplicateSheet } from './components/QuickAddDuplicateSheet';
import { useQuickAddMoves } from './hooks/use-quick-add-moves';

/** A referral opens quick add naming the referring lead (`M02-16`): `heliogrid://add-lead?referredBy=…`. */
type Props = StaticScreenProps<{ referredBy?: string } | undefined>;

/**
 * Quick add on the phone (`SCR-M02-01`, `M02-06`): the pill's add action opens the four fields as a
 * sheet over the leads page, lifted over the keyboard so Save stays in reach, with the duplicate
 * sheet above it. Closing it goes back to where the action was pressed; a saved capture closes the
 * sheet and leaves its toast over the leads page, where the add action opens a fresh one in place.
 * Everything it reads, checks and sends is `useQuickAddScreen`'s, the web's too; this composes.
 */
export function QuickAddLeadScreen({ route }: Props) {
  const t = useTranslate();
  const format = useFormat();
  const insets = useSafeAreaInsets();
  const toasts = useToasts();
  const moves = useQuickAddMoves();
  /* A closed toast hands the screen reader back to the page the capture stood over. */
  const page = useRef<View>(null);
  const screen = useQuickAddScreen({
    pack: format.pack,
    referredBy: route.params?.referredBy ?? null,
    onClosed: moves.back,
    onOpenLead: moves.openLead,
    onDone: (done) => toasts.push(quickAddDoneToast(t, done, screen.openLead)),
  });

  if (!screen.allowed) {
    return (
      <ShellPage inView="leads">
        <ShellNotFoundState />
      </ShellPage>
    );
  }
  const { referrer } = screen;
  const words = quickAddWords(t, {
    check: screen.check,
    phoneRefusal: screen.phoneRefusal,
    saveFailure: screen.saveFailure,
    referrer: referrer === null ? null : (referrer.name ?? format.phone(referrer.phoneE164)),
  });
  return (
    <ShellPage inView="leads" onAction={screen.reopen}>
      <View ref={page}>
        <LeadsListPage onAdd={screen.reopen} />
      </View>
      <EditorSurface {...quickAddSurfaceOf(screen, words)}>
        <QuickAddForm {...quickAddFormPropsOf(screen, words)} />
      </EditorSurface>
      <QuickAddDuplicateSheet screen={screen} />
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        {...toastHostWords(t)}
        focusAfter={page}
        offset={underPill(insets.bottom) + theme.spacing['sp-6']}
      />
    </ShellPage>
  );
}
