import { Text } from '../../primitives/Text/Text';
import { useOwnWidth } from '../../primitives/use-own-width';
import { Banner, BannerAction } from '../Banner';
import { FormActionBar } from '../FormActionBar/FormActionBar';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import type { BrandingAct, BrandingSettingsProps } from './BrandingSettings.types';
import { BrandingPart, BrandingPartSwitch, BrandingProfile } from './BrandingSettingsParts';
import { BrandingStage } from './BrandingSettingsStage';
import { useFocusAfterGone } from './use-focus-after-gone';

/**
 * The room from which the page stands as the board's 1536 pair: the stage holding the whole
 * 480-wide sheet inside its `--sp-8` sides (544), the `--sp-8` gap (32) and the 380 editor card.
 * Below it the stage would scale the sheet, so the page is the 375 column.
 */
const BRANDING_WIDE_FROM = 956;

/**
 * The Branding page body (`SCR-M01-18`): what the tenant's customers get, drawn from its own
 * values, and the one part being edited. It measures the room the shell gives it, never the
 * window: below the pair's room it is the phone's column (the 375 frames) — the stage, its
 * switch, the part's switch and fields, the profile row, then the closing line or the sticky act
 * bar; from it the stage and the sticky editor card stand side by side (the 1536 frames).
 */
export function BrandingSettings(props: BrandingSettingsProps) {
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= BRANDING_WIDE_FROM;
  useFocusAfterGone(room, {
    act: props.act !== undefined,
    failure: props.saveFailure !== undefined,
    logo: props.document.logoSrc !== undefined,
  });
  return (
    <div ref={room} className="hg-branding" data-layout={wide ? 'wide' : 'narrow'}>
      {wide ? <WidePage {...props} /> : <NarrowPage {...props} />}
    </div>
  );
}

/** The 375 column: every block one under the other, `--sp-4` apart. */
function NarrowPage(props: BrandingSettingsProps) {
  const { words, loading, unsaved, act } = props;
  return (
    <>
      <PageHead {...props} />
      <SaveFailure {...props} />
      <BrandingStage {...props} wide={false} />
      <div className="hg-branding-editor">
        <EditorBody {...props} wide={false} />
      </div>
      {/* A held change raises the act bar, whose own line says the same; the page end gives way. */}
      {loading || unsaved || act !== undefined ? null : <ClosingLine words={words} />}
      {act === undefined ? null : <ActBar act={act} words={words} placement="sticky" />}
    </>
  );
}

/** The 1536 pair: the heading row, a failed save across both columns, the stage and the card. */
function WidePage(props: BrandingSettingsProps) {
  const { words, loading, unsaved, act } = props;
  return (
    <>
      <PageHead {...props} />
      <SaveFailure {...props} />
      <BrandingStage {...props} wide />
      <section className="hg-branding-card" aria-label={words.editor}>
        <EditorBody {...props} wide />
        {act === undefined ? null : <ActBar act={act} words={words} placement="footer" />}
        {loading || unsaved || act !== undefined ? null : <ClosingLine words={words} />}
      </section>
    </>
  );
}

/** The title, when the page draws it, and the standing line, absent while the reads are out. */
function PageHead({ title, standing, loading }: BrandingSettingsProps) {
  const standingShown = loading ? undefined : standing;
  if (title === undefined && standingShown === undefined) return null;
  return (
    <div className="hg-branding-head" data-titled={title === undefined ? undefined : 'true'}>
      {title === undefined ? null : (
        <Text as="h1" variant="h2" bold>
          {title}
        </Text>
      )}
      {standingShown === undefined ? null : (
        <Text variant="caption" color="secondary" className="hg-branding-standing">
          {standingShown}
        </Text>
      )}
    </div>
  );
}

/** A save that did not land: said once, above the stage, with its retry (s18-l). */
function SaveFailure({ words, saveFailure, onRetry }: BrandingSettingsProps) {
  if (saveFailure === undefined) return null;
  return (
    <div className="hg-branding-failure">
      <Banner
        kind="validation"
        title={words.saveFailed}
        density="functional"
        action={<BannerAction onClick={onRetry}>{words.retry}</BannerAction>}
      >
        {saveFailure}
      </Banner>
    </div>
  );
}

/** The part's switch, the part and the profile row — or, while the reads are out, their bars. */
function EditorBody(props: BrandingSettingsProps & { wide: boolean }) {
  const { words, loading } = props;
  if (loading) return <LoadingBars label={words.loading} bars={['control', 'panel', 'row']} />;
  return (
    <>
      <BrandingPartSwitch {...props} />
      <BrandingPart {...props} />
      <BrandingProfile {...props} />
    </>
  );
}

function ClosingLine({ words }: Pick<BrandingSettingsProps, 'words'>) {
  return (
    <Text as="p" variant="caption" color="secondary" align="center" className="hg-branding-closing">
      {words.sentKeep}
    </Text>
  );
}

/** The act bar while a change is held: the page's sticky foot, or the editor card's foot. */
function ActBar({
  act,
  words,
  placement,
}: {
  act: BrandingAct;
  words: BrandingSettingsProps['words'];
  placement: 'sticky' | 'footer';
}) {
  return (
    <FormActionBar
      placement={placement}
      align="center"
      consequence={words.sentKeep}
      saveLabel={words.save}
      discardLabel={words.discard}
      saving={act.saving}
      onSave={act.onSave}
      onDiscard={act.onDiscard}
    />
  );
}
