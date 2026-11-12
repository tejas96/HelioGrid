import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Avatar } from '../Avatar/Avatar.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Menu } from '../Menu/Menu.native';
import { firstNameOf, installFactOf, projectMenuOf } from './ProjectDetail.logic';
import type { ProjectHeadProps } from './ProjectDetail.parts.types';

/** The project's facts as pills under its title: who manages it, and where its install stands. */
export function ProjectFacts({ project, words }: Pick<ProjectHeadProps, 'project' | 'words'>) {
  const install = installFactOf({ project, words });
  return (
    <View style={styles.facts}>
      <View style={[styles.fact, styles.person]}>
        <Avatar name={project.manager.name} size={24} />
        <Text variant="caption" bold style={styles.factText}>
          {words.manager(firstNameOf(project.manager.name))}
        </Text>
      </View>
      <View style={styles.fact}>
        <ShellGlyph name={install.glyph} size="sm" tone="secondary" />
        <Text variant="caption" bold style={styles.factText}>
          {install.label}
        </Text>
      </View>
    </View>
  );
}

/**
 * The project's acts on the phone, icons only: *Call* the customer and the ⋯ of acts on the whole
 * project — drawn only for a reader who moves stages, on a live one.
 */
export function ProjectHeadActs(props: ProjectHeadProps) {
  const { form, project, words, onCall, sending } = props;
  const items = projectMenuOf(props, menuGlyph);
  const name = project.customer.name ?? project.number;
  const phone = <ShellGlyph name="phone" size="md" tone="primary" />;
  return (
    <View style={styles.acts}>
      {form === 'bar' ? (
        <IconButton label={words.call(name)} onClick={onCall}>
          {phone}
        </IconButton>
      ) : null}
      {items === null ? null : (
        <Menu label={words.menu} items={items} disabled={sending} triggerLook="surface" />
      )}
    </View>
  );
}

const menuGlyph = (name: ShellGlyphName) => <ShellGlyph name={name} size="sm" tone="secondary" />;

const styles = StyleSheet.create({
  facts: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: theme.spacing['sp-8'],
    paddingLeft: theme.spacing['sp-2'],
    paddingRight: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['neutral-bg'],
  },
  person: { paddingLeft: theme.spacing['sp-1'] },
  factText: { color: colors['neutral-text'] },
  acts: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
