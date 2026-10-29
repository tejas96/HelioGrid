import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import type { FormActionBarProps } from './FormActionBar.types';

type NativeFormActionBarProps = FormActionBarProps & {
  style?: StyleProp<ViewStyle>;
  /**
   * The device's bottom inset the app measured, which the sticky band paints under so its acts
   * stand clear of the home indicator (`F7-50`). The web band reads the browser's own. Default 0.
   */
  bottomInset?: number;
};

/**
 * Same contract, same order as the web half: the consequence, then Save, then Discard. The app
 * places the sticky band at the foot of its screen in the bottom nav's place; the band paints
 * under the device's bottom inset the app measured (`bottomInset`), so its acts stand clear of the
 * home indicator. It shows and hides at once — nothing animates it in.
 */
export function FormActionBar({
  consequence,
  saveLabel,
  onSave,
  discardLabel,
  onDiscard,
  focusAfter,
  saving = false,
  placement = 'sticky',
  align = 'start',
  bottomInset = 0,
  style,
}: NativeFormActionBarProps) {
  const centred = align === 'center';
  const leaving = useFocusAfter(focusAfter);
  return (
    <View
      style={[
        styles.bar,
        placement === 'sticky' ? styles.sticky : styles.footer,
        placement === 'sticky' ? { paddingBottom: theme.spacing['sp-4'] + bottomInset } : undefined,
        centred ? styles.centred : undefined,
        style,
      ]}
    >
      {consequence === undefined || consequence === null ? null : (
        <Text variant="caption" color="secondary" align={align}>
          {consequence}
        </Text>
      )}
      <View style={[styles.acts, centred ? styles.actsCentred : undefined]}>
        <Button
          variant="primary"
          size="md"
          loading={saving}
          onClick={onSave === undefined ? undefined : leaving(onSave)}
        >
          {saveLabel}
        </Button>
        <Button
          variant="ghost"
          size="md"
          disabled={saving}
          onClick={onDiscard === undefined ? undefined : leaving(onDiscard)}
        >
          {discardLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: theme.spacing['sp-2'],
    // biome-ignore lint/plugin/raw-white: panel — a sheet, a modal, a detail panel: a page ground over the page
    backgroundColor: theme.colors.surface,
  },
  sticky: {
    paddingTop: theme.spacing['sp-4'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    ...theme.elevation.e4,
  },
  /* The foot of the settings editor card (s18-r): it reaches through the card's --sp-5 padding to
     the card's edges, its hairline above and the card's corners below — see the web half. */
  footer: {
    marginHorizontal: -theme.spacing['sp-5'],
    marginBottom: -theme.spacing['sp-5'],
    padding: theme.spacing['sp-4'],
    borderTopWidth: 1,
    borderTopColor: theme.colors['line-soft'],
    borderBottomLeftRadius: theme.radius['r-tile'],
    borderBottomRightRadius: theme.radius['r-tile'],
  },
  centred: { alignItems: 'center' },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  actsCentred: { justifyContent: 'center' },
});
