import { type ReactNode, useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { AvatarGroup } from '../Avatar/Avatar';
import { IconCircle } from '../Card/Card';
import { TEAM_STATUS_TONE } from '../Chip/Chip.logic';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { PRESET_GLYPH } from '../SettingsList/SettingsList.logic';
import { StatusChip } from '../StatusChip/StatusChip';
import { linesOn, ROLES_PANEL_ABOVE, ROLES_PANEL_WIDTH } from './RolesReference.logic';
import type {
  RolesReferenceCounts,
  RolesReferencePreset,
  RolesReferenceSide,
  RolesReferenceWordsProp,
} from './RolesReference.types';

interface RoleDetailsProps {
  /** The role last opened — kept while the details close, so they leave with their own words. */
  preset: RolesReferencePreset | null;
  open: boolean;
  /** Holders are named only once the roster is read: before, *Nobody* would be a guess. */
  counts: RolesReferenceCounts;
  words: RolesReferenceWordsProp;
  side: RolesReferenceSide;
  onSide: (side: RolesReferenceSide) => void;
  onClose: () => void;
}

/**
 * One role's details: the sheet at 375, the non-modal side panel at 1536, so another tile swaps
 * the role in place. The head, the holders and *Show* stay; only the list scrolls.
 */
export function RoleDetails({
  preset,
  open,
  counts,
  words,
  side,
  onSide,
  onClose,
}: RoleDetailsProps) {
  if (preset === null) return null;
  const { label, lines } = linesOn(preset, side);
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      title={preset.name}
      closeLabel={words.close}
      showClose
      modal={false}
      side="right"
      width={ROLES_PANEL_WIDTH}
      panelAbove={ROLES_PANEL_ABOVE}
      leading={
        <IconCircle size={44}>
          <ShellGlyph name={PRESET_GLYPH[preset.value]} size="md" tone="accent" />
        </IconCircle>
      }
      sheetProps={{ subtitle: preset.summary, size: 'half', bodyScrolls: false }}
      panelProps={{ density: 'functional' }}
      meta={({ panel }) => (
        <div className="hg-role-details-meta">
          {panel ? (
            <Text variant="body-sm" color="secondary">
              {preset.summary}
            </Text>
          ) : null}
          {counts === 'ready' ? <Holders preset={preset} nobody={words.nobody} /> : null}
          <SegmentedControl
            label={words.show}
            value={side}
            onChange={(value) => onSide(value === 'cant' ? 'cant' : 'can')}
            options={[
              { value: 'can', label: preset.canTab },
              { value: 'cant', label: preset.cantTab },
            ]}
          />
        </div>
      )}
    >
      {({ panel }) => (
        <ListRoom key={`${preset.value}-${side}`} panel={panel} label={label}>
          <ul className="hg-role-details-list">
            {lines.map((line) => (
              <li key={line.key} className="hg-role-details-line" data-side={side}>
                <ShellGlyph
                  name={side === 'can' ? 'tick' : 'minus'}
                  size="md"
                  tone={side === 'can' ? 'success' : 'secondary'}
                />
                <span className="hg-role-details-text">
                  {line.text}
                  {line.scope === null ? null : (
                    <span className="hg-role-details-scope"> · {line.scope}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </ListRoom>
      )}
    </EditorSurface>
  );
}

/**
 * The list's named tab stop, so the keyboard can scroll the rows. In the sheet only the list
 * scrolls, under the held head, and once it has moved a hairline marks where it is cut
 * (`m-open-cant`); in the side panel the panel scrolls whole, and this stop is what the keyboard
 * scrolls it from.
 */
function ListRoom({
  panel,
  label,
  children,
}: {
  panel: boolean;
  label: string;
  children: ReactNode;
}) {
  const [cut, setCut] = useState(false);
  return (
    /* It names the list, which then names none. */
    // biome-ignore lint/a11y/useSemanticElements: a scrolling list of rows, not a page landmark.
    <div
      role="region"
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region must take focus to scroll.
      tabIndex={0}
      className={panel ? undefined : 'hg-role-details-scroll'}
      data-cut={panel ? undefined : String(cut)}
      onScroll={panel ? undefined : (event) => setCut(event.currentTarget.scrollTop > 0)}
    >
      {children}
    </div>
  );
}

/** Who holds it — active people by face and name — and who is named but not counted. */
function Holders({ preset, nobody }: { preset: RolesReferencePreset; nobody: string }) {
  return (
    <>
      <div className="hg-role-details-holders">
        {preset.holders.length === 0 ? (
          <Text variant="body-sm">{nobody}</Text>
        ) : (
          <>
            <AvatarGroup size={32} people={preset.holders.map((name) => ({ name }))} />
            <Text variant="body-sm">{preset.holders.join(', ')}</Text>
          </>
        )}
      </div>
      {preset.others.map((other) => (
        <div key={other.id} className="hg-role-details-other">
          <StatusChip
            status={other.status}
            label={other.word}
            tone={TEAM_STATUS_TONE[other.status]}
            density="functional"
          />
          <Text variant="body-sm">{other.name}</Text>
        </div>
      ))}
    </>
  );
}
