import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { ICON_SIZE } from '../../primitives/Icon/Icon.types';
import { Text } from '../../primitives/Text/Text.native';
import { ShellAction } from '../AppShell/ShellAction.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { InfoGlyph } from '../Explainer/ExplainerParts.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { TeamConfirm } from '../MemberCard/TeamConfirm.native';
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
  removal = null,
  person,
  words,
  read,
  picked,
  onPick,
  grant,
  saveOffReason,
  saving,
  onSave,
  onReference,
  refusal = null,
}: AssignRolesProps) {
  /* The editor opens only from a list already read, so a read with no rows draws the skeleton. */
  const rows = read.kind === 'ready' ? read.value : null;
  /* The screen reader's place after the confirm's Cancel: the web's overlay returns it on its own. */
  const save = useRef<FocusHandle>(null);
  return (
    <>
      <EditorSurface
        open={open}
        onClose={onClose}
        dismissible={removal === null}
        closeLabel={words.close}
        overline={words.overline}
        title={person.name}
        status={person.status}
        subtitleFace="mono"
        showClose
        density="functional"
        width={ASSIGN_ROLES_PANEL_WIDTH}
        // The phone is a fact: each form's own subtitle takes one; the editor's is a modal's words.
        sheetProps={{ size: 'full', subtitle: person.phone }}
        panelProps={{ subtitle: person.phone }}
        meta={({ panel }) => (
          <View style={[styles.heading, panel ? styles.headingInPanel : undefined]}>
            <Text variant="overline" color="tertiary">
              {words.presets}
            </Text>
            <ShellAction
              round
              label={words.reference}
              onClick={onReference}
              icon={<InfoGlyph size={ICON_SIZE.md} color={theme.colors['text-primary']} />}
            />
          </View>
        )}
        footer={
          rows === null ? undefined : (
            <View style={styles.foot}>
              {refusal === null ? null : (
                <Banner kind="validation" title={refusal.title ?? undefined}>
                  {refusal.body}
                </Banner>
              )}
              <GrantCard grant={grant} label={words.gives} />
              <Button
                ref={save}
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
        {rows === null ? (
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
      <TeamConfirm
        look="roles"
        words={removal?.words ?? null}
        busy={false}
        onGo={() => removal?.onGo()}
        onLeave={() => {
          removal?.onLeave();
          save.current?.focus();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
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
