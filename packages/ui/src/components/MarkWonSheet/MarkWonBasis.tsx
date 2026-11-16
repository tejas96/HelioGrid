import { Text } from '../../primitives/Text';
import { HueTile } from '../HueTile';
import { LottieMoment } from '../LottieMoment';
import { AfterHint } from '../ProposalAfterParts';
import type { MarkWonBasisView } from './MarkWonSheet.types';

/** The acceptance as the win's proof — or, with none to stand on, why the value is typed. */
export function MarkWonProof({ basis }: { basis: MarkWonBasisView }) {
  return (
    <div className="hg-mark-won-proof" data-tone={basis.locked ? undefined : 'warning'}>
      {basis.locked ? (
        <LottieMoment name="success" size={48} />
      ) : (
        <HueTile glyph="alert-triangle" hue="warning" size={40} />
      )}
      <span className="hg-mark-won-proof-words">
        <b>{basis.proofTitle}</b>
        <span>{basis.proofLine}</span>
      </span>
    </div>
  );
}

/** The accepted version's payable: shown, locked, with the line that says where it came from. */
export function MarkWonLockedValue({ basis }: { basis: MarkWonBasisView }) {
  return (
    <div className="hg-mark-won-value">
      <Text as="span" variant="overline" color="secondary">
        {basis.lockedLabel}
      </Text>
      <b>{basis.lockedValue}</b>
      <AfterHint glyph="lock">{basis.lockedNote}</AfterHint>
    </div>
  );
}

/** The plan the project starts with, row for row, and the call that comes before the tap. */
export function MarkWonPlan({ basis }: { basis: MarkWonBasisView }) {
  return (
    <>
      {basis.plan.length === 0 ? null : (
        <>
          <Text as="h3" variant="overline" color="secondary">
            {basis.planTitle}
          </Text>
          <ul className="hg-mark-won-plan">
            {basis.plan.map((part, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a plan's parts keep their order and may repeat a name
              <li key={index}>
                <span className="hg-mark-won-plan-share">{part.share}</span>
                <span className="hg-mark-won-plan-words">
                  <b>{part.name}</b>
                  <span>{part.due}</span>
                </span>
                {part.amount === null ? null : (
                  <span className="hg-mark-won-plan-amount">{part.amount}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {basis.sibling === null ? null : <AfterHint glyph="people">{basis.sibling}</AfterHint>}
      {basis.callFirst === null ? null : <AfterHint>{basis.callFirst}</AfterHint>}
    </>
  );
}
