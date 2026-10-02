import type { Ref } from 'react';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import { Menu } from '../Menu/Menu';
import type { HomeHeadProps } from './HomeHead.types';

/** The home's head — the date, the title that switches homes, whose home this is, and an action. */
export function HomeHead({
  dateLine,
  title,
  switchName,
  switchLabel,
  entries,
  presetLine,
  switcherWidth,
  titleAnchor,
  action,
}: HomeHeadProps) {
  return (
    <div className="hg-home-head">
      <div className="hg-home-head-titles">
        <Text variant="overline" color="secondary">
          {dateLine}
        </Text>
        {/* Not a heading: the menu draws its open list inside this wrapper, and a list inside a
            heading names the heading with every home in it. */}
        <div className="hg-home-head-title" ref={elementRef(titleAnchor)}>
          <Menu
            label={switchLabel}
            align="start"
            selection="single"
            width={switcherWidth}
            trigger={
              <button type="button" className="hg-home-head-trigger" aria-label={switchName}>
                {title}
                <ShellGlyph name="chevron" size="md" tone="primary" />
              </button>
            }
            items={entries.map((entry) => ({
              key: entry.key,
              label: entry.label,
              meta: entry.meta,
              selected: entry.selected,
              onSelect: entry.onSelect,
            }))}
          />
        </div>
        <Text variant="body-sm" color="secondary">
          {presetLine}
        </Text>
      </div>
      {action === undefined ? null : <div className="hg-home-head-action">{action}</div>}
    </div>
  );
}

/** A coach mark reads the element this ref holds; a selector anchor needs no ref at all. */
function elementRef(anchor: CoachMarkAnchor | undefined): Ref<HTMLDivElement> | undefined {
  if (anchor === undefined || typeof anchor === 'string' || !('current' in anchor))
    return undefined;
  return anchor as Ref<HTMLDivElement>;
}
