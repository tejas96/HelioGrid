import { View } from 'react-native';
import { RichTextView } from '../RichText/RichTextView.native';
import type { DocumentRichTextValue } from './DocumentPreview.types';
import { DocumentOverline, DocumentRule, docStyles } from './DocumentSheet.native';

/** The sheet is drawn at its 480dp design width, so the terms body sets at 10dp there. */
const TERMS_FONT_SIZE = 10;

const EMPTY_TEXT = 'No terms are attached to this template yet.';

interface DocumentTermsBandProps {
  title: string;
  value: DocumentRichTextValue | undefined;
  logoSrc: string | undefined;
  logoLabel: string;
  brandColour: string;
  ruleOpaque: boolean;
}

/**
 * The authored T&C body, read-only — rendered through `RichTextView`, the ONE read-only renderer
 * (`M06-51`), exactly as the web half does. The band around it is the document's and stays here.
 *
 * WEB → RN MAPPING: a link is drawn as a link and is NOT tappable — `RichTextViewProps` carries no
 * press handler, and inside a `PreviewFrame` the subject is non-interactive by law.
 */
export function DocumentTermsBand({
  title,
  value,
  logoSrc,
  logoLabel,
  brandColour,
  ruleOpaque,
}: DocumentTermsBandProps) {
  return (
    <View>
      <DocumentRule colour={brandColour} opaque={ruleOpaque} />
      <DocumentOverline spaced>{title}</DocumentOverline>
      <RichTextView
        style={docStyles.terms}
        value={value}
        logoSrc={logoSrc}
        logoLabel={logoLabel}
        fontSize={TERMS_FONT_SIZE}
        emptyText={EMPTY_TEXT}
      />
    </View>
  );
}
