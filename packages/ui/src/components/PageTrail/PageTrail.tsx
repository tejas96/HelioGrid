import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { backCrumbOf } from './PageTrail.logic';
import type { PageTrailProps } from './PageTrail.types';
import './PageTrail.css';

/**
 * The way back above a page's title: on the desktop every page above it, then the page itself; in
 * a narrow room the last crumb alone, as one back. The page's acts close the row.
 */
export function PageTrail({ trail, here, label, narrow = false, acts }: PageTrailProps) {
  const back = backCrumbOf(trail);
  return (
    <div className="hg-page-trail-row">
      {narrow ? (
        back === null ? (
          <span />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={<ShellGlyph name="chevron-left" size="sm" />}
            onClick={back.onOpen}
          >
            {back.label}
          </Button>
        )
      ) : (
        <nav className="hg-page-trail" aria-label={label}>
          <ol>
            {trail.map((crumb, at) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a trail is a path in order; two pages above may share a name (a lead and its design), never a place
              <li key={at}>
                <Pressable className="hg-page-trail-crumb" onPress={crumb.onOpen}>
                  {crumb.label}
                </Pressable>
                <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
              </li>
            ))}
            <li>
              <span className="hg-page-trail-here" aria-current="page">
                {here}
              </span>
            </li>
          </ol>
        </nav>
      )}
      {acts}
    </div>
  );
}
