import { Button } from '../Button/Button';
import { CustomerSurface } from '../CustomerSurface/CustomerSurface';
import { ImageFrame } from '../Image';
import { StatusChip } from '../StatusChip/StatusChip';
import { TenantHeader } from '../TenantHeader/TenantHeader';
import { BRANDING_LINK_MARK, brandingColourShown } from './BrandingSettings.logic';
import type { BrandingLinkPageProps } from './BrandingSettings.types';

/** The customer's link page as it will open: its header, its state and its two acts — drawn, never pressed. */
export function BrandingLinkPage({
  words,
  document,
  colour,
  fullHeight = false,
}: BrandingLinkPageProps) {
  const { linkPreview } = words;
  return (
    <CustomerSurface
      className="hg-branding-link"
      brandColor={brandingColourShown(colour)}
      tenantName={document.companyName}
      fullHeight={fullHeight}
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
      <div className="hg-branding-link-acts">
        <Button variant="primary" size="sm">
          {linkPreview.accept}
        </Button>
        <Button variant="ghost" size="sm">
          {linkPreview.ask}
        </Button>
      </div>
    </CustomerSurface>
  );
}
