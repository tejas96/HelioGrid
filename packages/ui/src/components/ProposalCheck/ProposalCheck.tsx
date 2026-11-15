import { Fragment } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { labelRunsOf } from '../Button/Button.logic';
import { Badge } from '../Chip/Chip';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { HueTile } from '../HueTile/HueTile';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { IndeterminateRail } from '../PendingAction/IndeterminateRail';
import { riseOrder } from '../ProposalBuilder/rise';
import { Textarea } from '../Textarea/Textarea';
import { type CheckFound, checkActOf, checkFoundOf } from './ProposalCheck.logic';
import type {
  CheckFinding,
  CheckSummary,
  ProposalCheckSheetProps,
  ProposalCheckWords,
} from './ProposalCheck.types';
import './ProposalCheck.css';

function Findings({
  findings,
  tone,
  from,
}: {
  findings: readonly CheckFinding[];
  tone: 'danger' | 'warning';
  from: number;
}) {
  return (
    <div className="hg-pchk-finds">
      {findings.map((finding, index) => (
        <Pressable key={finding.key} className="hg-pchk-find" onPress={finding.onFix}>
          <span className="hg-pchk-find-in hg-pchk-tile" style={riseOrder(from + index)}>
            <HueTile
              glyph={tone === 'danger' ? 'alert-circle' : 'alert-triangle'}
              hue={tone}
              size={40}
              stroke={1.7}
            />
            <span className="hg-pchk-words">
              <span className="hg-pchk-find-title">{finding.title}</span>
              <span className="hg-pchk-line">{finding.line}</span>
            </span>
            <ShellGlyph name="chevron-right" size="sm" />
          </span>
        </Pressable>
      ))}
    </div>
  );
}

function Summary({ summary }: { summary: CheckSummary }) {
  return (
    <div className="hg-pchk-summary">
      <div className="hg-pchk-thumb">{summary.cover}</div>
      <span className="hg-pchk-words">
        <span className="hg-pchk-name">{summary.name}</span>
        <span className="hg-pchk-line">
          {labelRunsOf(summary.line, [summary.amount]).map((run) =>
            run.mono ? (
              <span key={run.text} className="hg-pchk-money">
                {run.text}
              </span>
            ) : (
              run.text
            ),
          )}
        </span>
        <span className="hg-pchk-line">{summary.facts}</span>
      </span>
    </div>
  );
}

function Limit({ words }: { words: ProposalCheckWords }) {
  const { limit } = words;
  return (
    <>
      <div className="hg-pchk-used">
        <HueTile glyph="gauge" hue="warning" size={40} stroke={1.7} />
        <span className="hg-pchk-words">
          <span className="hg-pchk-find-title">{limit.used}</span>
          <span className="hg-pchk-used-line">{limit.resets}</span>
        </span>
      </div>
      <div className="hg-pchk-works hg-pchk-tile">
        {limit.works.map((work) => (
          <div className="hg-pchk-work" key={work}>
            <Badge tone="success" glyph="tick-small">
              {limit.stillWorks}
            </Badge>
            <span className="hg-pchk-work-words">{work}</span>
          </div>
        ))}
      </div>
      <p className="hg-pchk-hint">
        <ShellGlyph name="info-circle" size="sm" />
        <span>{limit.who}</span>
      </p>
    </>
  );
}

function Found({ found }: { found: CheckFound }) {
  const { summary, changeNote, groups, hint } = found;
  return (
    <>
      {summary === null ? null : <Summary summary={summary} />}
      {changeNote === null ? null : (
        <Textarea
          label={changeNote.label}
          helper={changeNote.hint}
          value={changeNote.value}
          onChange={changeNote.onChange}
          rows={3}
          maxLength={changeNote.maxLength}
          {...(changeNote.error === undefined ? {} : { error: changeNote.error })}
        />
      )}
      {groups.map((group) => (
        <Fragment key={group.tone}>
          {group.over === undefined ? null : <span className="hg-pchk-over">{group.over}</span>}
          <Findings findings={group.findings} tone={group.tone} from={group.from} />
        </Fragment>
      ))}
      {hint === undefined ? null : (
        <p className="hg-pchk-hint">
          <ShellGlyph name="info-circle" size="sm" />
          <span>{hint}</span>
        </p>
      )}
    </>
  );
}

/** The check before Generate: what stops it, what to look at, or what is about to be made. */
export function ProposalCheckSheet({ open, onClose, words, state }: ProposalCheckSheetProps) {
  const generating = state.kind === 'clear' && state.generating;
  const act = checkActOf(state, words, onClose);
  const found = checkFoundOf(state, words);
  return (
    <EditorSurface
      open={open}
      onClose={() => {
        if (!generating) onClose();
      }}
      closeLabel={words.closeLabel}
      showClose
      dismissible={!generating}
      title={words.title}
      desktop="modal"
      footer={
        <div className="hg-pchk-foot">
          {generating ? (
            <span role="status" aria-label={words.generating}>
              <IndeterminateRail width="100%" thickness={3} />
            </span>
          ) : null}
          {state.kind === 'clear' && state.failure !== undefined ? (
            <p className="hg-pchk-failure" role="alert">
              {state.failure}
            </p>
          ) : null}
          {act === null ? null : (
            <Button
              {...act.button}
              {...(act.forward
                ? { iconRight: <ShellGlyph name="arrow-right" size="sm" tone="inverse" /> }
                : {})}
            >
              {act.label}
            </Button>
          )}
          <span className="hg-pchk-note">{words.note}</span>
        </div>
      }
    >
      <div className="hg-pchk" aria-busy={generating ? true : undefined}>
        {state.kind === 'checking' ? (
          <LoadingBars label={words.checking} bars={['row', 'row', 'row']} />
        ) : null}
        {state.kind === 'limit' ? <Limit words={words} /> : null}
        {found === null ? null : <Found found={found} />}
      </div>
    </EditorSurface>
  );
}
