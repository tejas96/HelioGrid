import { Icon } from '../../primitives/Icon/Icon';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Button } from '../Button/Button';
import { DocumentPreview } from '../DocumentPreview/DocumentPreview';
import { IconButton } from '../IconButton/IconButton';
import { PreviewFrame } from '../PreviewFrame/PreviewFrame';
import type { PreviewFrameProps } from '../PreviewFrame/PreviewFrame.types';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { BrandingLinkPage } from './BrandingLinkPage';
import {
  BRANDING_SHEET,
  BRANDING_STAGE,
  brandingCoverProps,
  brandingStageShort,
} from './BrandingSettings.logic';
import type { BrandingPreview, BrandingSettingsProps } from './BrandingSettings.types';

const PREVIEWS: readonly BrandingPreview[] = ['proposal', 'link'];

type StageProps = BrandingSettingsProps & { wide: boolean };

/**
 * What the tenant's customers get, from its own values (`T-M01-029`): the proposal's cover or the
 * link page, and the switch between them. At 375 the window sits above its switch row and is cut
 * short (`STAGE-375`); at width the switch row leads and the whole 480-wide sheet follows
 * (`STAGE-1536`, a named region).
 */
export function BrandingStage(props: StageProps) {
  const { wide, words } = props;
  const frame = <StageFrame {...props} />;
  if (!wide) {
    return (
      <div className="hg-branding-stage">
        {frame}
        <SwitchRow {...props} />
      </div>
    );
  }
  return (
    <section className="hg-branding-stage" aria-label={words.stage}>
      <SwitchRow {...props} />
      <div className="hg-branding-sheet">{frame}</div>
    </section>
  );
}

/** The preview's switch, then Open full size: a round icon act at 375, a ghost pill at width. */
function SwitchRow({ wide, words, preview, onPreview, onOpenFullSize }: StageProps) {
  return (
    <div className="hg-branding-switch-row">
      <SegmentedControl
        className="hg-branding-preview-switch"
        ariaLabel={words.preview}
        options={[
          { value: 'proposal', label: words.proposal },
          { value: 'link', label: words.linkPage },
        ]}
        value={preview}
        onChange={(value) => {
          const chosen = PREVIEWS.find((option) => option === value);
          if (chosen !== undefined) onPreview(chosen);
        }}
      />
      <span className="hg-branding-spacer" />
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

/** The framed subject, or the frame's named wait while the reads are out (s18-j). */
function StageFrame(props: StageProps) {
  const { words, loading, unsaved, preview } = props;
  const geometry = frameGeometry(props);
  const note = unsaved ? { note: words.notSaved } : {};
  if (loading) {
    return <PreviewFrame {...geometry} {...note} loading loadingLabel={words.loadingCover} />;
  }
  return (
    <PreviewFrame {...geometry} {...note}>
      {preview === 'proposal' ? (
        <Cover {...props} />
      ) : (
        <BrandingLinkPage
          words={props.words}
          document={props.document}
          colour={props.colour}
          fullHeight={props.wide}
        />
      )}
    </PreviewFrame>
  );
}

/**
 * The window's size: at width the whole sheet; at 375 the cover cut to its window, shorter while
 * the colour's offered ink or the logo's refusal must stay in view. The link page is a live page
 * with no height of its own at 375; at width it keeps the sheet's height (d18-h).
 */
function frameGeometry({
  wide,
  preview,
  part,
  colour,
  logoRefusal,
}: StageProps): Pick<
  PreviewFrameProps,
  'surface' | 'designWidth' | 'designHeight' | 'minScale' | 'maxHeight'
> {
  const surface = preview === 'proposal' ? 'sheet' : 'page';
  if (wide) {
    return {
      surface,
      designWidth: BRANDING_SHEET.width,
      designHeight: BRANDING_SHEET.height,
    };
  }
  const short = brandingStageShort(part, colour, logoRefusal);
  return {
    surface,
    designWidth: BRANDING_SHEET.width,
    ...(preview === 'proposal' ? { designHeight: BRANDING_SHEET.height } : {}),
    minScale: BRANDING_STAGE.minScale,
    maxHeight: short ? BRANDING_STAGE.shortHeight : BRANDING_STAGE.maxHeight,
  };
}

function Cover({ document, colour, words }: StageProps) {
  return (
    <DocumentPreview
      {...brandingCoverProps(document, colour, words)}
      width={BRANDING_SHEET.width}
    />
  );
}
