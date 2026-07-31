import type { WorkflowStatus } from '@heliogrid/contracts';
import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, type ChipTone } from '../../../ui';

/**
 * Shared gallery scaffolding — Section/Row wrappers, the back chevron (moved from
 * GalleryScreen.tsx), the placeholder icon dot, and the tone/status/people demo data every
 * section file draws from (apps/mobile/CLAUDE.md §Local conventions — screen-folder
 * satellites). Stateful/stateless section bodies live in the sibling `*Sections.tsx` files.
 */

/** Keyed by the shared tone type: a new tone is a compile error here until the gallery
 * renders it. A bare `as const` array is only subset-assignable, so it would compile green
 * while the new tone silently never appeared — and "a state not in the gallery does not
 * exist" (packages/ui CLAUDE.md). */
const ALL_TONES: Record<ChipTone, null> = {
  neutral: null,
  success: null,
  warning: null,
  danger: null,
  info: null,
  accent: null,
};
export const TONES = Object.keys(ALL_TONES) as ChipTone[];

/**
 * Gallery-local demo copy, keyed by the contract enum: adding a workflow status is a
 * compile error here until the gallery renders it (a state not in the gallery does not
 * exist — packages/ui CLAUDE.md). Product screens translate via Lingui instead.
 */
export const STATUS_LABEL: Record<WorkflowStatus, string> = {
  lead: 'Lead',
  'survey-scheduled': 'Survey scheduled',
  'design-in-progress': 'Design in progress',
  approved: 'Approved',
  installing: 'Installing',
  commissioned: 'Commissioned',
  'on-hold': 'On hold',
};

export const PEOPLE = [
  { name: 'Asha Patil' },
  { name: 'Ravi Kumar' },
  { name: 'Meera Joshi' },
  { name: 'Arjun Singh' },
  { name: 'Neha Kulkarni' },
  { name: 'Vikram Rao' },
];

export const noop = () => undefined;

/** Placeholder icon dot — Lucide RN icons are not bundled yet (mobile CLAUDE.md landmine). */
export function Glyph({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius['r-pill'],
        backgroundColor: color,
      }}
    />
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText
        role="overline"
        weight="700"
        color={theme.colors['text-secondary']}
        style={styles.overline}
      >
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function Row({ children, stretch = false }: { children: ReactNode; stretch?: boolean }) {
  return <View style={[styles.row, stretch && styles.rowStretch]}>{children}</View>;
}

/** Border-drawn back chevron (same technique as the Checkbox check — no SVG dependency). */
export function BackGlyph() {
  return <View style={styles.backGlyph} />;
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing['sp-3'],
  },
  overline: {
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  rowStretch: {
    alignItems: 'stretch',
  },
  // Border-drawn ‹ chevron: L rotated 45° (ghost IconButton → text-secondary per its doc).
  backGlyph: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors['text-secondary'],
    transform: [{ rotate: '45deg' }, { translateX: 1 }],
  },
});
