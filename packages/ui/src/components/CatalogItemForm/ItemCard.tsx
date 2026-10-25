import { useId } from 'react';
import { IrisTile } from '../IrisTile/IrisTile';
import './ItemCard.css';
import type { ItemCardProps, WideProps } from './CatalogItemForm.parts.types';

/**
 * One raised card of the add sheet (`SCR-M01-16`): its glyph on its iris, its title as the
 * section's heading, then its fields. A page ground over the sheet, so a field in it takes the well.
 */
export function ItemCard({
  glyph,
  iris,
  title,
  trailing,
  wide,
  children,
}: ItemCardProps & WideProps) {
  const titleId = useId();
  return (
    <section className="hg-item-card" data-wide={wide} aria-labelledby={titleId}>
      <div className="hg-item-card-head">
        <IrisTile glyph={glyph} iris={iris} size={32} stroke={1.6} />
        <h3 className="hg-item-card-title" id={titleId}>
          {title}
        </h3>
        {trailing}
      </div>
      {children}
    </section>
  );
}
