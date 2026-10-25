import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button.native';
import { CustomerSurface } from '../CustomerSurface/CustomerSurface.native';
import { ImageFrame } from '../Image/Image.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { TenantHeader } from '../TenantHeader/TenantHeader.native';
import { BRANDING_LINK_MARK, brandingColourShown } from './BrandingSettings.logic';
import type { BrandingLinkPageProps } from './BrandingSettings.types';

/** The board's least height for the link page at 375 (`custSurface`, minHeight 360). */
const LINK_PAGE_MIN_HEIGHT = 360;

/**
 * The customer's link page as it opens, in the tenant's colour: the mark and name with what the
 * page is, the proposal's state, and the two acts — drawn, never pressed (the frame holds it inert).
 */
export function BrandingLinkPage({
  words,
  document,
  colour,
  fullHeight = false,
}: BrandingLinkPageProps) {
  const { linkPreview } = words;
  return (
    <CustomerSurface
      brandColor={brandingColourShown(colour)}
      tenantName={document.companyName}
      fullHeight={fullHeight}
      style={styles.linkPage}
    >
      <TenantHeader
        logo={
          document.logoSrc === undefined ? undefined : (
            <ImageFrame
              src={document.logoSrc}
              alt={words.logoAlt}
              missingLabel={words.logoUnavailable}
              missingDetail=""
              width={BRANDING_LINK_MARK.width}
              height={BRANDING_LINK_MARK.height}
              fit="contain"
              density="functional"
            />
          )
        }
        size={BRANDING_LINK_MARK.height}
        name={document.companyName}
        caption={linkPreview.ready}
      />
      <StatusChip status="proposal-sent" label={linkPreview.awaiting} tone="accent" />
      <View style={styles.linkActs}>
        <Button variant="primary" size="sm">
          {linkPreview.accept}
        </Button>
        <Button variant="ghost" size="sm">
          {linkPreview.ask}
        </Button>
      </View>
    </CustomerSurface>
  );
}

const styles = StyleSheet.create({
  /** The link page at its design width: `sp-5` in, its parts `sp-4` apart, at least 360 tall. */
  linkPage: {
    padding: theme.spacing['sp-5'],
    gap: theme.spacing['sp-4'],
    minHeight: LINK_PAGE_MIN_HEIGHT,
  },
  /** *Accept proposal* and *Ask a question*, `sp-3` apart, wrapping when a language runs long. */
  linkActs: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-3'] },
});
