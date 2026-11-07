import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { HeroPanel } from '../HeroPanel/HeroPanel';
import { LottieMoment } from '../LottieMoment/LottieMoment';
import type { OnItsWayProps } from './OnItsWay.types';

/**
 * A coming page (`OnItsWay.types.ts`): the solar-glass hero with the name, the promise and the
 * sunrise; then what it will hold, as one glass tile; then the line for meanwhile and the way
 * home. One column on a phone; from the desktop width the hero's art and words, and the tile's
 * points, stand side by side.
 */
export function OnItsWay({ title, badge, line, points, meanwhile, action }: OnItsWayProps) {
  return (
    <article className="hg-on-its-way">
      <HeroPanel label={badge}>
        <div className="hg-on-its-way-hero">
          <div className="hg-on-its-way-words">
            <Text variant="display">{title}</Text>
            <Text variant="body-lg" color="secondary">
              {line}
            </Text>
          </div>
          <div className="hg-on-its-way-art">
            <LottieMoment name="sunrise" size={96} />
          </div>
        </div>
      </HeroPanel>
      <ul className="hg-on-its-way-points">
        {points.map((point) => (
          <li key={point} className="hg-on-its-way-point">
            <span className="hg-on-its-way-bead" aria-hidden="true">
              <ShellGlyph name="arrow-up-right" size="md" tone="accent" />
            </span>
            <Text variant="body">{point}</Text>
          </li>
        ))}
      </ul>
      <div className="hg-on-its-way-foot">
        <Text variant="body-sm" color="secondary" align="center">
          {meanwhile}
        </Text>
        {action === undefined ? null : <div className="hg-on-its-way-action">{action}</div>}
      </div>
    </article>
  );
}
