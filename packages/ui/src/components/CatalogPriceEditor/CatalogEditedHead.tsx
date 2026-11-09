import type { ReactNode } from 'react';
import { Text } from '../../primitives/Text/Text';
import { CATALOG_KIND_LEADING } from '../CatalogItems/CatalogItems.rows';
import { Badge, Chip } from '../Chip';
import { HueTile } from '../HueTile/HueTile';
import type { CatalogEditedItem } from './CatalogPriceEditor.types';

/**
 * The item at the detail's head (direction A): its kind tile, *Panel · Platform item* and the
 * explainer over the name in the display face; then the marks it carries — the data's
 * source and the schemes it holds — and its spec as a two-column grid with hairlines between.
 */
export function CatalogEditedHead({ item, ask }: { item: CatalogEditedItem; ask: ReactNode }) {
  const lead = CATALOG_KIND_LEADING[item.kind];
  return (
    <div className="hg-cat-edited">
      <div className="hg-cat-edited-head">
        <HueTile glyph={lead.glyph} hue={lead.hue} size={40} stroke={1.5} />
        <div className="hg-cat-edited-title">
          <span className="hg-cat-edited-whose">
            <Text as="span" variant="caption" color="secondary">
              {item.kindWord}
            </Text>
            <Text as="span" variant="caption" color="secondary">
              {item.overline}
            </Text>
            {/* The ask rides the line it explains, clear of the sheet's close in the corner. */}
            <span className="hg-cat-edited-ask">{ask}</span>
          </span>
          <Text as="h2" variant="figure">
            {item.name}
          </Text>
        </div>
      </div>
      <span className="hg-cat-edited-marks">
        {item.provenance === 'representative' ? (
          <Badge tone="warning" density="functional">
            {item.provenanceWord}
          </Badge>
        ) : item.provenance === 'verified_datasheet' ? (
          <Badge tone="success" density="functional">
            {item.provenanceWord}
          </Badge>
        ) : (
          <Chip density="functional">{item.provenanceWord}</Chip>
        )}
        {item.held.map((scheme) => (
          <Badge key={scheme} tone="success" density="functional">
            {scheme}
          </Badge>
        ))}
      </span>
      {item.specs.length === 0 ? null : (
        <dl className="hg-cat-edited-specs">
          {item.specs.map((spec) => (
            <div key={spec.label} className="hg-cat-edited-spec">
              <dt>
                <Text as="span" variant="caption" color="secondary">
                  {spec.label}
                </Text>
              </dt>
              <dd>
                <Text as="span" variant="mono">
                  {spec.value}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
