import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ToolCommand } from './RichText.commands';
import { CMD, LINK_PATH } from './RichText.commands';
import type { RichTextTemplate } from './RichText.types';

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing['sp-2'],
  },
  tool: { minWidth: 44, height: 44, borderRadius: theme.radius['r-pill'] },
  toolWide: { paddingHorizontal: theme.spacing['sp-3'] },
  toolActive: { backgroundColor: theme.colors['accent-subtle'] },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors['canvas-sunken'],
    marginHorizontal: 6,
  },
  templates: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2 },
});

interface ToolButtonProps {
  active?: boolean;
  label: string;
  d?: string;
  word?: string;
  onPress: () => void;
}

/** Every toolbar target is a Pressable, so every one of them is 44px. */
function ToolButton({ active = false, label, d, word, onPress }: ToolButtonProps) {
  const tint = active ? theme.colors.accent : theme.colors['text-secondary'];
  return (
    <Pressable
      accessibilityLabel={label}
      /* WHETHER THE MARK IS ON, said rather than tinted (F7-12): the accent-subtle pill is the
         sighted channel and `selected` is the spoken one — the web half's `aria-pressed={active}`,
         which the primitive maps to `accessibilityState.selected` here. */
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.tool,
        word !== undefined ? styles.toolWide : null,
        active ? styles.toolActive : null,
      ]}
    >
      {word === undefined ? (
        <Icon size="sm" color={tint}>
          <Svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <Path d={d} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Icon>
      ) : (
        <Text variant="body-sm" color={active ? 'accent' : 'secondary'}>
          {word}
        </Text>
      )}
    </Pressable>
  );
}

interface RichTextToolbarProps {
  marks: Partial<Record<ToolCommand['key'], boolean>>;
  disabled: boolean;
  hasLogo: boolean;
  linking: boolean;
  templates?: RichTextTemplate[];
  saveTemplateLabel: string;
  onRun: (c: ToolCommand) => void;
  onToggleLink: () => void;
  onToggleLogo: () => void;
  onLoadTemplate?: (id: string) => void;
  onSaveAsTemplate?: () => void;
}

/**
 * The touch toolbar. Same closed mark set, same icons.
 *
 * The web half's `<select>` of saved templates has no RN equivalent that keeps a 44px target, so
 * the templates are a row of named Pressables — the same round trip, one tap instead of two.
 */
export function RichTextToolbar({
  marks,
  disabled,
  hasLogo,
  linking,
  templates,
  saveTemplateLabel,
  onRun,
  onToggleLink,
  onToggleLogo,
  onLoadTemplate,
  onSaveAsTemplate,
}: RichTextToolbarProps) {
  return (
    <View style={styles.bar} accessibilityRole="toolbar" accessibilityLabel="Formatting">
      {CMD.map((c) => (
        <ToolButton
          key={c.key}
          label={c.label}
          d={c.d}
          active={marks[c.key] === true}
          onPress={() => onRun(c)}
        />
      ))}
      <ToolButton label="Link" d={LINK_PATH} active={linking} onPress={onToggleLink} />
      <View style={styles.divider} />
      <ToolButton
        label={hasLogo ? 'Remove the logo' : 'Add the logo'}
        word={hasLogo ? 'Logo on' : 'Add logo'}
        active={hasLogo}
        onPress={onToggleLogo}
      />
      {templates !== undefined && templates.length > 0 ? (
        <View style={styles.templates}>
          {templates.map((t) => (
            <ToolButton
              key={t.id}
              label={`Load template: ${t.name}`}
              word={t.name}
              onPress={() => {
                if (!disabled) onLoadTemplate?.(t.id);
              }}
            />
          ))}
        </View>
      ) : null}
      {onSaveAsTemplate !== undefined ? (
        <ToolButton label={saveTemplateLabel} word={saveTemplateLabel} onPress={onSaveAsTemplate} />
      ) : null}
    </View>
  );
}
