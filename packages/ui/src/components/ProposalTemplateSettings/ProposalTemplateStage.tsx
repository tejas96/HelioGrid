import { Icon } from '../../primitives/Icon/Icon';
import { Text } from '../../primitives/Text/Text';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { BRANDING_SHEET } from '../BrandingSettings/BrandingSettings.logic';
import { Button } from '../Button/Button';
import { DocumentPreview } from '../DocumentPreview/DocumentPreview';
import { IconButton } from '../IconButton/IconButton';
import { PreviewFrame } from '../PreviewFrame/PreviewFrame';
import {
  TEMPLATE_STAGE_MIN_SCALE,
  templateDocumentProps,
  templateStageHeight,
} from './ProposalTemplateSettings.logic';
import type { ProposalTemplateSettingsProps } from './ProposalTemplateSettings.types';

type StageProps = ProposalTemplateSettingsProps & { wide: boolean };

/**
 * The PDF the customer opens, on the sunken desk (`Stage 375`, `Stage 1536`). At 375 the window
 * leads, cut to 186 or 120 by the part open, with the caption row under it; at width the caption
 * row leads and the whole 480-wide sheet follows, in a named region.
 */
export function ProposalTemplateStage(props: StageProps) {
  const { wide, words } = props;
  if (!wide) {
    return (
      <div className="hg-template-stage">
        <StageFrame {...props} />
        <CaptionRow {...props} />
      </div>
    );
  }
  return (
    <section className="hg-template-stage" aria-label={words.stage}>
      <CaptionRow {...props} />
      <div className="hg-template-sheet">
        <StageFrame {...props} />
      </div>
    </section>
  );
}

/** What the window shows and *Open full size*: a round icon act at 375, a ghost pill at width. */
function CaptionRow({ wide, words, onOpenFullSize }: StageProps) {
  return (
    <div className="hg-template-caption-row">
      <Text variant="caption" color="secondary" className="hg-template-caption">
        {words.stageCaption}
      </Text>
      {wide ? (
        <Button variant="ghost" size="sm" onClick={onOpenFullSize}>
          {words.openFullSize}
        </Button>
      ) : (
        <IconButton label={words.openFullSize} size={40} variant="surface" onClick={onOpenFullSize}>
          <Icon size="sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={glyphStroke('sm')}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <ShellGlyphMarks name="expand" />
            </svg>
          </Icon>
        </IconButton>
      )}
    </div>
  );
}

/**
 * The framed document, or the frame's named wait while the reads are out (m19-n1). *Not saved yet*
 * only while the template record differs from the saved one — a phase change leaves it off.
 * The document hugs its bands (`fit: content`), so at width the window is the whole sheet; the
 * wait keeps an A4 sheet's footprint there, having no document to measure.
 */
function StageFrame({ wide, words, read, unsaved, part, document }: StageProps) {
  const note = unsaved ? { note: words.notSaved } : {};
  const geometry = wide
    ? { designWidth: BRANDING_SHEET.width }
    : {
        designWidth: BRANDING_SHEET.width,
        minScale: TEMPLATE_STAGE_MIN_SCALE,
        maxHeight: templateStageHeight(part),
      };
  if (read.kind !== 'ready') {
    return (
      <PreviewFrame
        surface="sheet"
        {...geometry}
        {...(wide ? { designHeight: BRANDING_SHEET.height } : {})}
        loading
        loadingLabel={words.loadingPreview}
      />
    );
  }
  return (
    <PreviewFrame surface="sheet" {...geometry} {...note}>
      <DocumentPreview {...templateDocumentProps(document, words, BRANDING_SHEET.width)} />
    </PreviewFrame>
  );
}
