import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { ASSIGN_ROLES_PANEL_WIDTH } from './AssignRoles.logic';
import type { AssignRolesProps } from './AssignRoles.types';
import { GrantCard } from './GrantCard';

/**
 * The editor over Team: the head stays in view — the name and its status, the phone, then
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
}: AssignRolesProps) {
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
        <span className="hg-assign-roles-heading" data-form={panel ? 'panel' : 'sheet'}>
          {words.presets}
        </span>
      )}
      footer={
        <div className="hg-assign-roles-foot">
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
        </div>
      }
    >
      <div className="hg-assign-roles-body">
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
      </div>
    </EditorSurface>
  );
}
