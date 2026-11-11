import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Banner } from '../Banner/Banner.native';
import { Card } from '../Card/Card.native';
import { IconButton } from '../IconButton/IconButton.native';
import { InstallerSteps } from '../InstallerJob/InstallerSteps.native';
import { useFormat } from '../MarketProvider';
import { NamedGap } from '../NamedGap/NamedGap.native';
import type { ProjectStepsProps } from './ProjectDetail.parts.types';
import { CardHead, DetailCard } from './ProjectDetailParts.native';
import { installerStepsOf, isClosedProject, stepsReadOf } from './ProjectInstallSteps.logic';

/**
 * A project's install steps on their own phone screen (`SCR-M08-04`): who is on the crew, how to get
 * in with its edit, then the installer's own steps — a large tick, who ticked it when, a photo each.
 */
export function ProjectInstallSteps(props: ProjectStepsProps) {
  const { project, words, onAccess, sending, onOpenFile } = props;
  const format = useFormat();
  const mayEdit = project.acts.stages && !isClosedProject(project);
  return (
    <View style={styles.page}>
      {props.refusal === null ? null : (
        <Banner kind="validation" tone="warning" title={props.refusal} density="functional" />
      )}
      <Card density="functional" style={styles.card}>
        <CardHead title={words.crew} aside={null} />
        {project.crew.length === 0 ? (
          <View style={styles.pad}>
            <Text variant="body-sm" color="secondary">
              {words.noCrew}
            </Text>
          </View>
        ) : (
          project.crew.map((member, index) => (
            <View key={member.userId} style={[styles.row, index === 0 ? undefined : styles.rule]}>
              <Avatar name={member.name} size={32} />
              <View style={styles.main}>
                <Text variant="body-sm">{member.name}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
      <Card density="functional" style={styles.card}>
        <CardHead
          title={words.accessNote}
          aside={null}
          act={
            mayEdit ? (
              <IconButton
                label={words.changeAccess}
                variant="ghost"
                onClick={() => {
                  if (!sending) onAccess();
                }}
              >
                <ShellGlyph name="pencil" size="md" tone="primary" />
              </IconButton>
            ) : null
          }
        />
        <View style={styles.pad}>
          {project.accessNote === null ? (
            <NamedGap gap={words.noAccessNote} scale="field" />
          ) : (
            <Text variant="body">{project.accessNote}</Text>
          )}
        </View>
      </Card>
      {project.acts.steps && !isClosedProject(project) ? (
        <InstallerSteps {...installerStepsOf(props)} />
      ) : (
        <DetailCard block={stepsReadOf(props, format)} words={words} onOpenFile={onOpenFile} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  pad: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-3'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
  },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  main: { flex: 1, minWidth: 0 },
});
