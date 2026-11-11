import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { ProjectDocuments, ProjectDocumentsHero, ProjectFiles } from './ProjectDocuments.native';
import { ProjectHero } from './ProjectHero.native';
import { ProjectActivity, ProjectJourney } from './ProjectSide.native';
import { ProjectWait } from './ProjectWait.native';

/**
 * One project on the phone (the picked design), one column: any refusal, the hero, the wait, the
 * journey, the documents still waiting, the other files and the latest activity. Or the checklist's
 * own screen: the row that moves the stage, every row, a caption and the files with *Show to
 * customer*. The screen's scroll view holds it.
 */
export function ProjectDetail(props: ProjectDetailProps) {
  const { refusal, words } = props;
  const said =
    refusal === null ? null : (
      <Banner kind="validation" tone="warning" title={refusal} density="functional" />
    );
  if (props.documents === 'all') {
    return (
      <View style={styles.page}>
        {said}
        <ProjectDocumentsHero {...props} />
        <ProjectDocuments {...props} rows="all" />
        <View style={styles.caption}>
          <Text variant="caption" color="secondary">
            {words.docsCaption}
          </Text>
        </View>
        <ProjectFiles {...props} switches />
      </View>
    );
  }
  return (
    <View style={styles.page}>
      {said}
      <ProjectHero {...props} />
      <ProjectWait {...props} />
      <ProjectJourney {...props} />
      <ProjectDocuments {...props} rows="waiting" />
      <ProjectFiles {...props} switches={false} />
      <ProjectActivity {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  caption: { paddingHorizontal: theme.spacing['sp-1'] },
});
