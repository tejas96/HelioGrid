import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { startModeChoice } from './ProposalStart.logic';
import type { ProposalStartSheetProps } from './ProposalStart.types';
import './ProposalStart.css';

function Sources({ props }: { props: ProposalStartSheetProps }) {
  const { sources, words } = props;
  if (sources === null) return <LoadingBars label={words.loading} bars={['row', 'row']} />;
  if (sources.length === 0) return null;
  return (
    <>
      <div className="hg-pstart-or">{words.or}</div>
      <div className="hg-pstart-rows hg-pstart-tile">
        {sources.map((source) => (
          <Pressable
            key={source.id}
            className="hg-pstart-row"
            disabled={props.starting}
            onPress={() => props.onCopy(source.id)}
          >
            <span className="hg-pstart-row-in">
              <ShellGlyph name="layers" size="md" />
              <span className="hg-pstart-row-words">
                <span className="hg-pstart-row-title">{source.title}</span>
                <span className="hg-pstart-row-line">{source.line}</span>
              </span>
              <ShellGlyph name="chevron-right" size="sm" />
            </span>
          </Pressable>
        ))}
      </div>
      <span className="hg-pstart-note">{words.copyLine}</span>
    </>
  );
}

/** The start of a proposal on a lead: how to build it, or which proposal to copy. */
export function ProposalStartSheet(props: ProposalStartSheetProps) {
  const { words, starting } = props;
  const choice = startModeChoice(props);
  return (
    <EditorSurface
      open={props.open}
      onClose={() => {
        if (!starting) props.onClose();
      }}
      closeLabel={words.closeLabel}
      showClose
      dismissible={!starting}
      title={words.title}
      desktop="modal"
      footer={
        <div className="hg-pstart-foot">
          {props.failure == null ? null : (
            <p className="hg-pstart-failure" role="alert">
              {props.failure}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={starting}
            iconRight={<ShellGlyph name="arrow-right" size="sm" tone="inverse" />}
            onClick={props.onStart}
          >
            {words.start}
          </Button>
        </div>
      }
    >
      <div className="hg-pstart" aria-busy={starting ? true : undefined}>
        <OptionCardGroup
          {...choice.group}
          options={choice.options.map(({ glyph, ...option }) => ({
            ...option,
            icon: <ShellGlyph name={glyph} size="md" />,
          }))}
        />
        <Sources props={props} />
      </div>
    </EditorSurface>
  );
}
