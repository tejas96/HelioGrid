import type { RefObject } from 'react';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { HeroPanel } from '../HeroPanel/HeroPanel';
import { LottieMoment } from '../LottieMoment/LottieMoment';
import type { CatalogStrip } from './CatalogItems.types';
import { useJustPublished } from './use-just-published';

/**
 * The panel's one hero: what is in force — the release on *Items*, the price-book version on
 * *Rates* — its tag large, a dot that says whether anything is live, the line under it, the way
 * into the past list and the panel's act. The words are the caller's.
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
    <HeroPanel
      label={strip.title}
      labelAside={
        <span
          className="hg-cat-strip-dot"
          data-live={strip.tag === null ? undefined : 'true'}
          aria-hidden="true"
        />
      }
    >
      <div ref={focusRef} tabIndex={-1} className="hg-cat-strip-row">
        <div className="hg-cat-strip-words">
          {published ? <LottieMoment name="celebrate" size={48} /> : null}
          {strip.tag === null ? null : strip.tagAs === 'chip' ? (
            <Chip density="functional">{strip.tag}</Chip>
          ) : (
            <span className="hg-cat-strip-tag">{strip.tag}</span>
          )}
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
            <Button variant="primary" size="md" onClick={strip.onAction}>
              {strip.action}
            </Button>
          )}
        </div>
      </div>
    </HeroPanel>
  );
}
