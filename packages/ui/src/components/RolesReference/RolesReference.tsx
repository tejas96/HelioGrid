import type { RolePreset } from '@heliogrid/domain';
import { type CSSProperties, useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellAction } from '../AppShell/ShellAction';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner/Banner';
import { BannerAction } from '../Banner/BannerAction';
import { Explainer } from '../Explainer/Explainer';
import { RoleDetails } from './RoleDetails';
import { ROLES_PANEL_WIDTH } from './RolesReference.logic';
import type { RolesReferenceProps, RolesReferenceSide } from './RolesReference.types';
import { RoleTile } from './RoleTile';
import './RolesReference.css';

/** The open panel's width, which the page keeps clear of (`RolesReference.css`). */
const PANEL_RESERVE = { '--hg-roles-panel': `${ROLES_PANEL_WIDTH}px` } as CSSProperties;

/**
 * The Roles reference on the web: the head, the counts' banner when they did not load, the twelve
 * tiles — two across in a narrow room, four in a wide one, three beside the open side panel — and
 * the opened role's details. Read-only: no act here changes a role (`M01-21`).
 */
export function RolesReference({ words, read, title, back = null }: RolesReferenceProps) {
  const [open, setOpen] = useState<RolePreset | null>(null);
  const [last, setLast] = useState<RolePreset | null>(null);
  const [side, setSide] = useState<RolesReferenceSide>('can');
  const shown = words.presets.find((each) => each.value === last) ?? null;
  const about = (
    <Explainer
      label={words.about.label}
      title={words.about.label}
      density="functional"
      placement="bottom"
      inset
      pages={words.about.pages}
      nextLabel={words.about.nextLabel}
      backLabel={words.about.backLabel}
      positionLabel={words.about.positionLabel}
    />
  );
  return (
    <div
      className="hg-roles-reference"
      data-open={open === null ? undefined : 'true'}
      style={PANEL_RESERVE}
    >
      <div className="hg-roles-reference-body">
        {title === 'page' ? (
          <div className="hg-roles-reference-head">
            <div className="hg-roles-reference-title">
              {back === null ? null : (
                <ShellAction
                  round
                  label={back.label}
                  onClick={back.onPress}
                  icon={<ShellGlyph name="chevron-left" size="md" tone="primary" />}
                />
              )}
              <Text as="h1" variant="h2">
                {words.title}
              </Text>
              {about}
            </div>
            <Lede words={words} />
          </div>
        ) : (
          <div className="hg-roles-reference-lede-row">
            <Lede words={words} />
            {about}
          </div>
        )}
        {read.kind === 'failed' ? (
          <Banner
            kind="data-integrity"
            density="functional"
            title={words.countsFailed}
            action={<BannerAction onClick={read.retry}>{words.retry}</BannerAction>}
          />
        ) : null}
        <ul aria-label={words.roles} className="hg-roles-reference-tiles">
          {words.presets.map((each) => (
            <li key={each.value} className="hg-roles-reference-tile">
              <RoleTile
                preset={each}
                counts={read.kind}
                countGap={words.countGap}
                open={each.value === open}
                onOpen={() => {
                  setOpen(each.value);
                  setLast(each.value);
                  setSide('can');
                }}
              />
            </li>
          ))}
        </ul>
      </div>
      <RoleDetails
        preset={shown}
        open={open !== null}
        counts={read.kind}
        words={words}
        side={side}
        onSide={setSide}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

/** *Tap one…* below the editor's panel width, *Choose one…* at it — the window's, as the editor's own switch. */
function Lede({ words }: Pick<RolesReferenceProps, 'words'>) {
  return (
    <>
      <Text variant="body-sm" color="secondary" className="hg-roles-reference-lede">
        {words.lede}
      </Text>
      <Text variant="body-sm" color="secondary" className="hg-roles-reference-lede-wide">
        {words.ledeWide}
      </Text>
    </>
  );
}
