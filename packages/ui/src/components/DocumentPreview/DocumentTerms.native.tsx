import { View } from 'react-native';
import { RichTextView } from '../RichText/RichTextView.native';
import type { DocumentRichTextValue } from './DocumentPreview.types';
import { DocumentOverline, DocumentRule, docStyles } from './DocumentSheet.native';
import { TERMS_FONT_SIZE } from './DocumentTerms.logic';

interface DocumentTermsBandProps {
  title: string;
  value: DocumentRichTextValue | undefined;
  logoSrc: string | undefined;
  logoLabel: string;
  emptyText: string | undefined;
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
  emptyText,
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
        emptyText={emptyText}
      />
    </View>
  );
}
