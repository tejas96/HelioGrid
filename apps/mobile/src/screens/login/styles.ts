import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet } from 'react-native';

/**
 * Shared layout for the login screen and its step components (apps/mobile/CLAUDE.md
 * §Local conventions — screen-folder satellites). Each file imports only the keys it
 * renders with. `BloomBackdrop`'s `bloom` style stays colocated with that component's
 * own `BLOOM_*` geometry constants instead of living here — pulling it in would make
 * this module import from `components/`, which `components/` also imports (circular).
 * Off-token mockup spacing is snapped to the 4px scale per the spec's C3/C4 rulings.
 */

// ds-ref LoginFlow mobile geometry (login.md §2 component-spec constants).
const COL_MAX = 620;

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas, overflow: 'hidden' },
  flex: { flex: 1 },
  scroller: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
  column: { width: '100%', maxWidth: COL_MAX },
  wordmark: { marginBottom: theme.spacing['sp-8'] },
  offline: { marginBottom: theme.spacing['sp-6'] },
  lede: { marginTop: theme.spacing['sp-3'] },
  fieldGroup: { marginTop: theme.spacing['sp-6'] },
  continueBtn: { marginTop: theme.spacing['sp-6'] },
  footerLink: { alignSelf: 'center', marginTop: theme.spacing['sp-6'] },
  changeNumber: { marginTop: theme.spacing['sp-2'] },
  otp: { marginTop: theme.spacing['sp-6'] },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-4'],
  },
  resendRow: { marginTop: theme.spacing['sp-6'], flexDirection: 'row' },
  callCard: { marginTop: theme.spacing['sp-4'], borderRadius: theme.radius['r-md'] },
  callRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-4'] },
  callBody: { flex: 1, gap: theme.spacing['sp-1'] },
  successDisc: {
    width: theme.spacing['sp-16'],
    height: theme.spacing['sp-16'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['success-bg'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { marginTop: theme.spacing['sp-6'] },
  small: { flexShrink: 1 },
  step: { width: '100%' },
});
