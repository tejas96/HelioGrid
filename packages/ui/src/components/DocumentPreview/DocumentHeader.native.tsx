import { theme } from '@heliogrid/theme';
import type { TextStyle } from 'react-native';
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
 * The tax number as printed: its label in the document's face, the number in mono (`F7-09`).
 * The number is a nested run of the line it sits in, so it keeps that line's size and colour.
 */
function TaxNumber({ doc, line }: { doc: ResolvedDocument; line: TextStyle[] }) {
  return (
    <>
      {doc.taxLabel}{' '}
      <Text variant="mono" style={[...line, docStyles.figure]}>
        {doc.taxId}
      </Text>
    </>
  );
}

/**
 * The band prints the tax number ITSELF, from `taxId`, so its number can take the mono face;
 * `letterhead.lines` holds only what the company writes (phone, email, website), printed as typed.
 */
function BandLines({
  doc,
  colour,
  fade,
}: {
  doc: ResolvedDocument;
  colour: string;
  fade: 'on' | 'off';
}) {
  const lines = doc.letterhead?.lines ?? [];
  if (doc.taxId === '' && lines.length === 0) {
    return null;
  }
  const line: TextStyle[] = [docStyles.lines, { color: colour }];
  return (
    <Text style={[...line, { opacity: FADE.lines[fade] }]}>
      {doc.taxId === '' ? null : <TaxNumber doc={doc} line={line} />}
      {doc.taxId !== '' && lines.length > 0 ? ' · ' : null}
      {lines.join(' · ')}
    </Text>
  );
}

/** A logo, the specimen's slot, or — on a real cover with none — nothing: the name stands alone. */
function BandMark({ doc }: { doc: ResolvedDocument }) {
  if (doc.logoSrc !== undefined) {
    return (
      <Image
        source={{ uri: doc.logoSrc }}
        resizeMode="contain"
        style={[docStyles.logo, { width: 34 * LOGO_MAX_RATIO }]}
      />
    );
  }
  return doc.sample ? <DocumentSlot label={doc.logoLabel} /> : null;
}

/**
 * The letterhead band. It takes the brand fill ONLY if something can be read on it; otherwise
 * the document keeps a white header and demotes the brand to a rule — the honest consequence,
 * previewed, because a preview that flatters a failing colour is worse than no preview.
 */
export function DocumentBandHeader({ doc }: { doc: ResolvedDocument }) {
  const fade = doc.bandOk ? 'on' : 'off';
  // biome-ignore lint/plugin/raw-white: paper — a document, a drawing sheet, a QR code's quiet zone, a brand specimen
  const bandColour = doc.bandOk ? doc.brandHex : theme.colors.surface;
  const bandText = doc.bandOk ? doc.bandTextColor : theme.colors['text-primary'];
  const tagline = doc.letterhead?.tagline;
  return (
    <View
      style={[
        docStyles.band,
        { backgroundColor: bandColour },
        doc.bandOk ? undefined : { borderBottomWidth: 3, borderBottomColor: doc.brandHex },
      ]}
    >
      <View style={docStyles.bandWords}>
        {doc.companyName === '' ? null : (
          <Text style={[docStyles.company, { color: bandText }]}>{doc.companyName}</Text>
        )}
        {tagline === undefined || tagline === '' ? null : (
          <Text style={[docStyles.tagline, { color: bandText, opacity: FADE.tagline[fade] }]}>
            {tagline}
          </Text>
        )}
        {doc.address === '' ? null : (
          <Text style={[docStyles.address, { color: bandText, opacity: FADE.address[fade] }]}>
            {doc.address}
          </Text>
        )}
        <BandLines doc={doc} colour={bandText} fade={fade} />
        {doc.letterheadNode === null ? null : (
          <View style={docStyles.letterheadNode}>{doc.letterheadNode}</View>
        )}
      </View>
      <BandMark doc={doc} />
    </View>
  );
}

/** Who the document is for, and what it is. A blank recipient line reads as a missing value. */
export function DocumentCover({ doc }: { doc: ResolvedDocument }) {
  const named = doc.customerName !== '';
  const titled = doc.docTitle !== '' || doc.docNumber !== '' || doc.docDateText !== '';
  if (!named && !titled) {
    return null;
  }
  return (
    <View style={docStyles.cover}>
      {named ? (
        <View>
          {doc.preparedForLabel === '' ? null : (
            <Text style={docStyles.overline}>{doc.preparedForLabel}</Text>
          )}
          <Text style={docStyles.customerName}>{doc.customerName}</Text>
          {doc.customerMeta === '' ? null : (
            <Text style={docStyles.customerMeta}>{doc.customerMeta}</Text>
          )}
        </View>
      ) : (
        <View />
      )}
      {titled ? (
        <View style={docStyles.metaBlock}>
          {doc.docTitle === '' ? null : (
            <Text style={[docStyles.docTitle, { color: doc.ink }]}>{doc.docTitle}</Text>
          )}
          {doc.docNumber === '' ? null : <Text style={docStyles.docNumber}>{doc.docNumber}</Text>}
          {doc.docDateText === '' ? null : <Text style={docStyles.docDate}>{doc.docDateText}</Text>}
        </View>
      ) : null}
    </View>
  );
}

/** The line that runs along the bottom of every page (`M01-50`); its figures in mono (`F7-09`). */
export function DocumentFooter({ doc }: { doc: ResolvedDocument }) {
  const footerNote = doc.letterhead?.footerNote;
  const line: TextStyle[] = [docStyles.footerText];
  return (
    <View style={docStyles.footer}>
      <Text style={line}>{doc.taxId === '' ? null : <TaxNumber doc={doc} line={line} />}</Text>
      {footerNote === undefined || footerNote === '' ? null : (
        <Text style={docStyles.footerNote}>{footerNote}</Text>
      )}
      <Text variant="mono" style={[...line, docStyles.figure]}>
        {doc.phone}
      </Text>
    </View>
  );
}
