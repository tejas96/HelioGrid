import type { RefObject } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { Chip } from '../Chip';
import type { CatalogStrip } from './CatalogItems.types';

/**
 * The versioning strip that opens each panel: the release in force on *Items*, the price-book
 * version on *Rates*. The whole text block opens the past list when there is one; the act sits at
 * the right for the grant. A strip with nothing published yet carries the quiet dot.
 */
export function CatalogStripBar({
  strip,
  focusRef,
}: {
  strip: CatalogStrip;
  /** Where focus lands when the panel comes back after *Try again*: the strip. */
  focusRef?: RefObject<HTMLDivElement | null>;
}) {
  const words = (
    <>
      <span className="hg-cat-strip-line">
        <Text as="span" variant="body-sm" bold>
          {strip.title}
        </Text>
        {strip.tag === null ? null : strip.tagAs === 'chip' ? (
          <Chip density="functional">{strip.tag}</Chip>
        ) : (
          <Text as="span" variant="mono" bold>
            {strip.tag}
          </Text>
        )}
      </span>
      <span className="hg-cat-strip-line">
        <Text as="span" variant="caption" color="secondary">
          {strip.link === null ? strip.detail : `${strip.detail} · ${strip.link}`}
        </Text>
        {strip.link === null ? null : <ShellGlyph name="chevron-right" size="sm" />}
      </span>
    </>
  );
  return (
    <Card density="functional" className="hg-cat-strip">
      {/* The row takes focus back after a retry: it is no control itself, so the button it holds
          is never nested in another focusable. */}
      <div ref={focusRef} tabIndex={-1} className="hg-cat-strip-row">
        <span
          className="hg-cat-strip-dot"
          data-live={strip.tag === null ? undefined : 'true'}
          aria-hidden="true"
        />
        {strip.link === null ? (
          <span className="hg-cat-strip-words">{words}</span>
        ) : (
          <Pressable className="hg-cat-strip-words hg-cat-strip-open" onPress={strip.onLink}>
            {words}
          </Pressable>
        )}
        {strip.action === null ? null : (
          <span className="hg-cat-strip-act">
            <Button variant="secondary" size="sm" onClick={strip.onAction}>
              {strip.action}
            </Button>
          </span>
        )}
      </div>
    </Card>
  );
}
