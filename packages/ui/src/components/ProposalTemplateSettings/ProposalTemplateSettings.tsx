import { Text } from '../../primitives/Text/Text';
import { useOwnWidth } from '../../primitives/use-own-width';
import { Banner } from '../Banner';
import { FormActionBar } from '../FormActionBar/FormActionBar';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { TemplateLinks, TemplatePart, TemplatePartSwitch } from './ProposalTemplateParts';
import { TEMPLATE_WIDE_FROM } from './ProposalTemplateSettings.logic';
import type { ProposalTemplateSettingsProps, TemplateAct } from './ProposalTemplateSettings.types';
import { ProposalTemplateStage } from './ProposalTemplateStage';
import { useFocusAfterGone } from './use-focus-after-gone';

type BodyProps = ProposalTemplateSettingsProps & { wide: boolean };

/**
 * The Proposal template page body (`SCR-M01-19`): the PDF the customer opens, the one part being
 * edited and the rows to the write-points it prints from. It measures the room the shell gives
 * it, never the window: below the pair's room it is the phone's column (the 375 frames); from it
 * the stage and the 420 editor card stand side by side (the 1536 frames).
 */
export function ProposalTemplateSettings(props: ProposalTemplateSettingsProps) {
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= TEMPLATE_WIDE_FROM;
  useFocusAfterGone(room, props.act !== undefined);
  return (
    <div ref={room} className="hg-template" data-layout={wide ? 'wide' : 'narrow'}>
      <PageHead {...props} wide={wide} />
      {wide ? <WidePage {...props} wide /> : <NarrowPage {...props} wide={false} />}
    </div>
  );
}

/** The 375 column: every block one under the other, `--sp-4` apart, the act bar its sticky foot. */
function NarrowPage(props: BodyProps) {
  const { act } = props;
  return (
    <>
      <ProposalTemplateStage {...props} />
      <Teaching {...props} />
      <div className="hg-template-editor">
        <EditorBody {...props} />
      </div>
      <PageEnd {...props} />
      {act === undefined ? null : (
        <div className="hg-template-foot">
          <SaveFailed {...props} />
          <ActBar act={act} words={props.words} placement="sticky" />
        </div>
      )}
    </>
  );
}

/** The 1536 pair: the stage and the editor card, whose foot is the act bar or the page end. */
function WidePage(props: BodyProps) {
  const { act, words } = props;
  return (
    <>
      <Teaching {...props} />
      <ProposalTemplateStage {...props} />
      <section className="hg-template-card" aria-label={words.editor}>
        <EditorBody {...props} />
        <PageEnd {...props} />
        {act === undefined ? null : (
          <>
            <SaveFailed {...props} />
            <ActBar act={act} words={words} placement="footer" />
          </>
        )}
      </section>
    </>
  );
}

/**
 * The title when the page draws it, then the standing line (absent while loading or never saved)
 * and the Quick line. With the title in the phone's bar, the lines sit under the bar's title.
 */
function PageHead({ title, standing, read, words }: BodyProps) {
  const standingShown = read.kind === 'ready' ? standing : undefined;
  return (
    <div className="hg-template-head" data-titled={title === undefined ? undefined : 'true'}>
      {title === undefined ? null : (
        <Text as="h1" variant="h2" bold>
          {title}
        </Text>
      )}
      {standingShown === undefined ? null : (
        <Text variant="caption" color="secondary" className="hg-template-pretty">
          {standingShown}
        </Text>
      )}
      <Text variant="caption" color="secondary" className="hg-template-pretty">
        {words.intro}
      </Text>
    </div>
  );
}

/** Every part is HelioGrid's: the one line that says so and what to do (m19-n2, D267). */
function Teaching({ teaching, read, words }: BodyProps) {
  if (!teaching || read.kind !== 'ready') return null;
  return (
    <div className="hg-template-teaching">
      <Banner kind="info" title={words.teachTitle} density="functional">
        {words.teachBody}
      </Banner>
    </div>
  );
}

/** The part's switch, the part and the two rows — or, while the reads are out, their bars. */
function EditorBody(props: BodyProps) {
  const { words, read } = props;
  if (read.kind !== 'ready')
    return <LoadingBars label={words.loading} bars={['control', 'panel', 'row']} />;
  return (
    <>
      <TemplatePartSwitch {...props} />
      <TemplatePart {...props} />
      <TemplateLinks {...props} />
    </>
  );
}

/** *Proposals already sent keep…*: gone while the reads are out or a change is held (the bar says it). */
function PageEnd({ words, read, held, act }: BodyProps) {
  if (read.kind !== 'ready' || held || act !== undefined) return null;
  return (
    <Text
      as="p"
      variant="caption"
      color="secondary"
      align="center"
      className="hg-template-end hg-template-pretty"
    >
      {words.pageEnd}
    </Text>
  );
}

/** The save did not land (m19-n4): over the act bar, the change kept. */
function SaveFailed({ saveFailed, words }: BodyProps) {
  if (!saveFailed) return null;
  return (
    <div className="hg-template-failure">
      <Banner kind="state" tone="danger" title={words.saveFailed} density="functional">
        {words.saveFailedBody}
      </Banner>
    </div>
  );
}

function ActBar({
  act,
  words,
  placement,
}: {
  act: TemplateAct;
  words: ProposalTemplateSettingsProps['words'];
  placement: 'sticky' | 'footer';
}) {
  return (
    <FormActionBar
      placement={placement}
      align="center"
      consequence={words.consequence}
      saveLabel={words.save}
      discardLabel={words.discard}
      saving={act.saving}
      onSave={act.onSave}
      onDiscard={act.onDiscard}
    />
  );
}
