import type { RefObject } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Badge } from '../Chip';
import { HeroPanel } from '../HeroPanel/HeroPanel';
import { LottieMoment } from '../LottieMoment/LottieMoment';
import { RollingNumber } from '../RollingNumber';
import type { CatalogStrip } from './CatalogItems.types';
import { useJustPublished } from './use-just-published';

/**
 * The panel's one hero (direction A): its title with what is live beside it — the release's tag as
 * a success badge, a quiet dot before the first — then the catalog's figures, the first in the hero
 * face, each over its label; the line under them; and the panel's act with the way into the past
 * list. A fresh publish lands with the `published` moment. The words are the caller's.
 */
export function CatalogStripBar({
  strip,
  focusRef,
}: {
  strip: CatalogStrip;
  /** Where focus lands when the panel comes back after *Try again*: the hero's head. */
  focusRef?: RefObject<HTMLDivElement | null>;
}) {
  const published = useJustPublished(strip.tag);
  return (
    <HeroPanel label={strip.title} labelAside={<Live strip={strip} />}>
      <div ref={focusRef} tabIndex={-1} className="hg-cat-strip-row">
        <div className="hg-cat-strip-words">
          {published ? <LottieMoment name="published" size={72} /> : null}
          <Figures figures={strip.figures} />
          <Text variant="body" color="secondary">
            {strip.detail}
          </Text>
        </div>
        <div className="hg-cat-strip-acts">
          {strip.link === null ? null : (
            <Button
              variant="ghost"
              size="md"
              onClick={strip.onLink}
              iconRight={<ShellGlyph name="chevron-right" size="sm" />}
            >
              {strip.link}
            </Button>
          )}
          {strip.action === null ? null : (
            <Button
              variant="primary"
              size="lg"
              onClick={strip.onAction}
              icon={<ShellGlyph name="upload" size="sm" tone="inverse" />}
            >
              {strip.action}
            </Button>
          )}
        </div>
      </div>
    </HeroPanel>
  );
}

/** What is in force, beside the title: the tag as a badge, or a quiet dot before the first. */
function Live({ strip }: { strip: CatalogStrip }) {
  if (strip.tag === null) return <span className="hg-cat-strip-dot" aria-hidden="true" />;
  return (
    <Badge tone={strip.tagAs === 'mono' ? 'success' : 'neutral'} density="functional">
      <span className="hg-cat-strip-tag">{strip.tag}</span>
    </Badge>
  );
}

/** The figures: the first in the hero face, the rest in the figure face, each over its label. */
function Figures({ figures }: { figures: CatalogStrip['figures'] }) {
  if (figures === undefined || figures.length === 0) return null;
  return (
    <dl className="hg-cat-strip-figures">
      {figures.map((figure, index) => (
        <div
          key={figure.label}
          className="hg-cat-strip-figure"
          data-lead={index === 0 ? 'true' : undefined}
        >
          <dt className="hg-cat-strip-figure-label">
            <Text as="span" variant="caption" color="secondary">
              {figure.label}
            </Text>
          </dt>
          <dd className="hg-cat-strip-figure-value">
            <RollingNumber value={figure.value} variant={index === 0 ? 'hero' : 'figure'} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
