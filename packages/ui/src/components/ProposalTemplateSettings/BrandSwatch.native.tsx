import { StyleSheet } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { CustomerSurface } from '../CustomerSurface/CustomerSurface.native';
import { TenantMark } from '../TenantHeader/TenantHeader.native';
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
      style={styles.swatch}
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

/* The swatch sits on its tile: the colour's scope paints no ground of its own here. */
const styles = StyleSheet.create({
  swatch: { backgroundColor: 'transparent' },
});
