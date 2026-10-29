import { useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import {
  DocumentItemsBand,
  DocumentSectionsBand,
  DocumentTranchesBand,
} from './DocumentBands.native';
import { DocumentBandHeader, DocumentCover, DocumentFooter } from './DocumentHeader.native';
import { shownBands } from './DocumentPreview.logic';
import type { DocumentPreviewProps } from './DocumentPreview.types';
import { DOCUMENT_DESIGN_WIDTH } from './DocumentPreview.types';
import { docStyles } from './DocumentSheet.native';
import { DocumentTermsBand } from './DocumentTerms.native';
import { bandFails, resolveDocument } from './document-model';

type NativeDocumentPreviewProps = DocumentPreviewProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * The customer-facing document, drawn with the tenant's brand — the subject a settings screen's
 * `PreviewFrame` hosts.
 *
 * WEB → RN MAPPING: the sheet is drawn at its 480dp design width and scaled as a whole, exactly
 * as on the web. RN scales about the CENTRE, so the top-left origin is restored by the
 * compensating translate below; when `fit="content"` the sheet has no stated height, so it is
 * measured with `onLayout` and the window follows.
 */
export function DocumentPreview({ style, ...props }: NativeDocumentPreviewProps) {
  const doc = resolveDocument(props, useFormat());
  const bands = shownBands(doc);
  const captionNote = doc.bandOk ? undefined : doc.bandFailsNote;
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const sheetHeight = doc.sheetHeight ?? measuredHeight ?? 0;

  return (
    <View style={style}>
      <View
        style={[
          docStyles.window,
          { width: doc.width, ...(sheetHeight > 0 ? { height: sheetHeight * doc.scale } : {}) },
        ]}
      >
        <View
          onLayout={(event: LayoutChangeEvent) =>
            setMeasuredHeight(event.nativeEvent.layout.height)
          }
          style={[
            docStyles.sheet,
            {
              width: DOCUMENT_DESIGN_WIDTH,
              ...(doc.sheetHeight === undefined ? {} : { height: doc.sheetHeight }),
              transform: [
                { translateX: -(DOCUMENT_DESIGN_WIDTH * (1 - doc.scale)) / 2 },
                { translateY: -(sheetHeight * (1 - doc.scale)) / 2 },
                { scale: doc.scale },
              ],
            },
          ]}
        >
          <DocumentBandHeader doc={doc} />
          {bands.cover ? <DocumentCover doc={doc} /> : null}
          <View style={docStyles.body}>
            {bands.items ? <DocumentItemsBand doc={doc} /> : null}
            {bands.sections ? <DocumentSectionsBand doc={doc} /> : null}
            {bands.tranches ? <DocumentTranchesBand doc={doc} /> : null}
            {bands.terms ? (
              <DocumentTermsBand
                title={doc.termsTitle}
                value={props.terms}
                logoSrc={doc.logoSrc}
                logoLabel={doc.logoLabel}
                emptyText={doc.termsEmptyText}
                brandColour={doc.brandHex}
                ruleOpaque={doc.ruleOpaque}
              />
            ) : null}
          </View>
          <DocumentFooter doc={doc} />
        </View>
      </View>
      {doc.caption === undefined ? null : (
        <View style={docStyles.caption}>
          <Text variant="caption" color="tertiary">
            {doc.caption}
          </Text>
          {captionNote === undefined ? null : (
            <Text variant="caption" style={docStyles.captionNote}>
              {captionNote}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/** Does this colour force the white-header consequence? A frame's `note` can say so above the sheet. */
DocumentPreview.bandFails = bandFails;
