import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { EmptyScene } from '../EmptyScene/EmptyScene.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { LeadDesignCard } from './LeadDesignCard.native';
import {
  leadDesignsNoneLineOf,
  leadDesignsNoteOf,
  leadDesignsOf,
  mayChangeDesigns,
} from './LeadSections.designs';
import { leadDesignsFailedOf } from './LeadSections.logic';
import type { LeadDesignsPanel } from './LeadSections.types';

interface LeadDesignListProps {
  readonly panel: LeadDesignsPanel;
}

/**
 * The Designs section, on the phone (`T-M05-001`): the lead's designs, one card a row, or the
 * empty scene with *Create design*. One frame holds every state, so the screen reader sent to it
 * after *Try again* stays while the designs read again.
 */
export function LeadDesignList({ panel }: LeadDesignListProps) {
  const frame = useRef<View>(null);
  return (
    <View ref={frame} style={styles.designs}>
      <Designs panel={panel} frame={frame} />
    </View>
  );
}

function Designs({ panel, frame }: LeadDesignListProps & { frame: RefObject<View | null> }) {
  const { read, words } = panel;
  if (read.kind === 'loading') return <LoadingBars bars={['panel']} label={words.loading} />;
  if (read.kind === 'failed') {
    return <FailedRead {...leadDesignsFailedOf(read.retry, words, frame)} />;
  }
  const designs = leadDesignsOf(panel);
  if (designs.length === 0) return <None panel={panel} />;
  const note = leadDesignsNoteOf(panel);
  return (
    <>
      {note === null ? null : (
        <Text variant="body-sm" color="secondary">
          {note}
        </Text>
      )}
      <Undone panel={panel} />
      <View style={styles.cards}>
        {designs.map((design) => (
          <LeadDesignCard key={design.id} design={design} panel={panel} />
        ))}
      </View>
    </>
  );
}

/** No design yet: the scene, what the section is for — or why a closed lead takes none — and the create. */
function None({ panel }: LeadDesignListProps) {
  const { words } = panel;
  const line = leadDesignsNoneLineOf(panel);
  return (
    <View style={styles.none}>
      <EmptyScene name="settle" size="compact" />
      <Text variant="body" bold align="center">
        {words.noneTitle}
      </Text>
      {line === null ? null : (
        <Text variant="body-sm" color="secondary" align="center">
          {line}
        </Text>
      )}
      {mayChangeDesigns(panel) ? (
        <Button
          variant="primary"
          size="md"
          icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
          loading={panel.busy}
          onClick={panel.onCreate}
        >
          {words.create}
        </Button>
      ) : null}
      <Undone panel={panel} />
    </View>
  );
}

/** The act that came back undone, said in the section it was made in. */
function Undone({ panel }: LeadDesignListProps) {
  return panel.failure === null ? null : <PendingAction state="returned" reason={panel.failure} />;
}

const styles = StyleSheet.create({
  designs: { gap: theme.spacing['sp-3'] },
  cards: { gap: theme.spacing['sp-4'] },
  none: { alignItems: 'center', gap: theme.spacing['sp-3'], padding: theme.spacing['sp-4'] },
});
