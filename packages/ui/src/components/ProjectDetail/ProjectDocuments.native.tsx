import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { useFormat } from '../MarketProvider';
import { documentsBlockOf, filesBlockOf } from './ProjectDetail.blocks';
import { provingRowOf, samePlace } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { DetailCard } from './ProjectDetailParts.native';

/** The checklist on the phone: three rows still waiting with the way to all, or every row. */
export function ProjectDocuments(props: ProjectDetailProps & { rows: 'waiting' | 'all' }) {
  const block = documentsBlockOf(props, props.rows, useFormat());
  return <DetailCard block={block} words={props.words} onOpenFile={props.onOpenFile} />;
}

/** The other files on the phone: each by name with who added it; on the checklist's screen, *Show to customer*. */
export function ProjectFiles(props: ProjectDetailProps & { switches: boolean }) {
  return (
    <DetailCard
      block={filesBlockOf(props, props.switches)}
      words={props.words}
      onOpenFile={props.onOpenFile}
    />
  );
}

/** The checklist screen's one hero: the row whose file moves the stage by itself, and its upload. */
export function ProjectDocumentsHero(props: ProjectDetailProps) {
  const { project, view, words, onUpload, sending, uploading, heroFocus } = props;
  const proving = provingRowOf(view);
  if (proving === null) return null;
  const place = { slot: 'document' as const, slotKey: proving.row };
  return (
    <HeroPanel label={words.movesTheStage}>
      <View style={styles.words}>
        <Text variant="body-lg" bold>
          {words.row(proving.row)}
        </Text>
        <Text variant="body-sm" color="secondary">
          {words.movesByItself(proving.to)}
        </Text>
      </View>
      {project.acts.documents ? (
        <Button
          ref={heroFocus}
          size="lg"
          fullWidth
          icon={<ShellGlyph name="camera" size="md" tone="inverse" />}
          loading={samePlace(uploading, place)}
          spokenName={words.uploadRow(proving.row)}
          onClick={() => {
            if (!sending) onUpload(place);
          }}
        >
          {words.photoOrFile}
        </Button>
      ) : null}
    </HeroPanel>
  );
}

const styles = StyleSheet.create({
  words: { gap: theme.spacing['sp-1'] },
});
