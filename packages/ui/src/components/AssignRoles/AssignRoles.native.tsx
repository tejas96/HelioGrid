import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { ASSIGN_ROLES_PANEL_WIDTH, OPTION_BARS } from './AssignRoles.logic';
import type { AssignRolesProps } from './AssignRoles.types';
import { GrantCard } from './GrantCard.native';

/**
 * The editor over Team, as the web half draws it: the head stays in view — the name and its status, the phone, then
 * *Presets* — while the rows scroll; the grant card and *Save roles* are pinned under them.
 */
export function AssignRoles({
  open,
  onClose,
  person,
  words,
  rows,
  picked,
  onPick,
  grant,
  saveOffReason,
  saving,
  onSave,
  state = 'ready',
  refusal = null,
}: AssignRolesProps) {
  const loading = state === 'loading';
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      overline={words.overline}
      title={person.name}
      status={person.status}
      subtitle={person.phone}
      subtitleFace="mono"
      showClose
      density="functional"
      width={ASSIGN_ROLES_PANEL_WIDTH}
      sheetProps={{ size: 'full' }}
      meta={({ panel }) => (
        <View style={[styles.heading, panel ? styles.headingInPanel : undefined]}>
          <Text variant="overline" color="tertiary">
            {words.presets}
          </Text>
        </View>
      )}
      footer={
        loading ? undefined : (
          <View style={styles.foot}>
            {refusal === null ? null : (
              <Banner kind="validation" title={refusal.title ?? undefined}>
                {refusal.body}
              </Banner>
            )}
            <GrantCard grant={grant} label={words.gives} />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              disabled={saveOffReason !== null}
              disabledReason={saveOffReason ?? undefined}
              onClick={onSave}
            >
              {words.save}
            </Button>
          </View>
        )
      }
    >
      {loading ? (
        <View style={styles.body}>
          <LoadingBars label={words.loading} bars={OPTION_BARS} />
        </View>
      ) : (
        <View style={styles.body}>
          <OptionCardGroup
            mode="multiple"
            ariaLabel={words.presets}
            density="functional"
            options={rows.map((row) => ({
              value: row.value,
              title: row.title,
              description: row.description,
              disabled: row.lockReason !== null,
              disabledReason: row.lockReason ?? undefined,
            }))}
            value={picked}
            onChange={(next) =>
              onPick(rows.filter((row) => next.includes(row.value)).map((row) => row.value))
            }
          />
          <Text variant="caption" color="secondary">
            {words.recorded}
          </Text>
        </View>
      )}
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-2'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors['line-soft'],
  },
  /* The side panel draws the line closer to the head (`SCR-M01-13` d-default, `--sp-1`). */
  headingInPanel: { marginTop: theme.spacing['sp-1'] },
  body: { gap: theme.spacing['sp-4'], paddingTop: theme.spacing['sp-3'] },
  foot: { gap: theme.spacing['sp-3'] },
});
