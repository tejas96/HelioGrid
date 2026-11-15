import { ShellGlyph } from '../AppShell/ShellGlyph';
import { CustomerSurface } from '../CustomerSurface/CustomerSurface';
import { TenantMark } from '../TenantHeader/TenantHeader';
import type { DefaultsLookView } from './ProposalTemplateSettings.types';

const SWATCH = 36;

/**
 * The brand row's swatch: the company's own mark, drawn inside its colour's scope so it shows the
 * shade the customer's pages derive — the glyph alone until the page is read.
 */
export function BrandSwatch({ brand }: { brand: DefaultsLookView['brand'] }) {
  const { mark } = brand;
  if (mark === undefined) return <ShellGlyph name={brand.glyph} size="md" />;
  return (
    <CustomerSurface
      as="span"
      className="hg-pdf-swatch"
      {...(mark.colour === null ? {} : { brandColor: mark.colour })}
    >
      <TenantMark
        name={mark.name}
        size={SWATCH}
        showName={false}
        {...(mark.logo === undefined ? {} : { logo: mark.logo })}
      />
    </CustomerSurface>
  );
}
