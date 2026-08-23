import { theme } from '@heliogrid/theme';
import { Image, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { DocumentSlot, docStyles } from './DocumentSheet.native';
import type { ResolvedDocument } from './document-model';

/** The band's fade ladder — the same two sets the web half applies through `data-band-ok`. */
const FADE = {
  tagline: { on: 0.9, off: 0.7 },
  address: { on: 0.85, off: 0.6 },
  lines: { on: 0.8, off: 0.55 },
};

/** The widest a logo may run in the band, as a multiple of its height. */
const LOGO_MAX_RATIO = 3;

/**
 * The letterhead band. It takes the brand fill ONLY if something can be read on it; otherwise
 * the document keeps a white header and demotes the brand to a rule — the honest consequence,
 * previewed, because a preview that flatters a failing colour is worse than no preview.
 */
export function DocumentBandHeader({ doc }: { doc: ResolvedDocument }) {
  const fade = doc.bandOk ? 'on' : 'off';
  const bandColour = doc.bandOk ? doc.brandHex : theme.colors.surface;
  const bandText = doc.bandOk ? doc.bandTextColor : theme.colors['text-primary'];
  const lines = doc.letterhead?.lines;
  return (
    <View
      style={[
        docStyles.band,
        { backgroundColor: bandColour },
        doc.bandOk ? undefined : { borderBottomWidth: 3, borderBottomColor: doc.brandHex },
      ]}
    >
      <View style={docStyles.bandWords}>
        <Text style={[docStyles.company, { color: bandText }]}>{doc.companyName}</Text>
        {doc.letterhead?.tagline === undefined ? null : (
          <Text style={[docStyles.tagline, { color: bandText, opacity: FADE.tagline[fade] }]}>
            {doc.letterhead.tagline}
          </Text>
        )}
        <Text style={[docStyles.address, { color: bandText, opacity: FADE.address[fade] }]}>
          {doc.address}
        </Text>
        {lines === undefined || lines.length === 0 ? null : (
          <Text style={[docStyles.lines, { color: bandText, opacity: FADE.lines[fade] }]}>
            {lines.join(' · ')}
          </Text>
        )}
        {doc.letterheadNode === null ? null : (
          <View style={docStyles.letterheadNode}>{doc.letterheadNode}</View>
        )}
      </View>
      {doc.logoSrc === undefined ? (
        <DocumentSlot label={doc.logoLabel} />
      ) : (
        <Image
          source={{ uri: doc.logoSrc }}
          resizeMode="contain"
          style={[docStyles.logo, { width: 34 * LOGO_MAX_RATIO }]}
        />
      )}
    </View>
  );
}

/** Who the document is for, and what it is. */
export function DocumentCover({ doc }: { doc: ResolvedDocument }) {
  return (
    <View style={docStyles.cover}>
      <View>
        <Text style={docStyles.overline}>Prepared for</Text>
        <Text style={docStyles.customerName}>{doc.customerName}</Text>
        <Text style={docStyles.customerMeta}>{doc.customerMeta}</Text>
      </View>
      <View style={docStyles.metaBlock}>
        <Text style={[docStyles.docTitle, { color: doc.ink }]}>{doc.docTitle}</Text>
        <Text style={docStyles.docNumber}>{doc.docNumber}</Text>
        <Text style={docStyles.docDate}>{doc.docDateText}</Text>
      </View>
    </View>
  );
}

/** The line that runs along the bottom of every page (`M01-50`). */
export function DocumentFooter({ doc }: { doc: ResolvedDocument }) {
  return (
    <View style={docStyles.footer}>
      <Text style={docStyles.footerTax}>
        {doc.taxLabel} {doc.taxId}
      </Text>
      {doc.letterhead?.footerNote === undefined ? null : (
        <Text style={docStyles.footerNote}>{doc.letterhead.footerNote}</Text>
      )}
      <Text style={docStyles.footerText}>{doc.phone}</Text>
    </View>
  );
}
