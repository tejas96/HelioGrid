import type { ProjectPayments } from '@heliogrid/contracts';
import { StatusMark } from '../../primitives/StatusMark/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import { useFormat } from '../MarketProvider';
import { barOf, dueForOf, heroActsOf, nextUpOf, nowDueOf } from './ProjectMoney.logic';
import type { ProjectMoneyProps } from './ProjectMoney.types';

/**
 * The hero (design A): what to collect now — the part due longest, exactly what it still owes, how
 * long it has waited — the money bar of received, due and still to come, and the two acts. With
 * nothing due it says when the next part falls due, or that every part is paid.
 */
export function MoneyHero(props: ProjectMoneyProps & { readonly payments: ProjectPayments }) {
  const { payments, words } = props;
  const format = useFormat();
  const now = nowDueOf(payments);
  const next = nextUpOf(payments);
  return (
    <HeroPanel
      label={words.toCollectNow}
      labelAside={
        now?.part.dueOn ? (
          <StatusMark tone="warning" label={dueForOf(now.part.dueOn, payments.today, words)} />
        ) : undefined
      }
    >
      {now === null ? (
        <div className="hg-money-hero-quiet">
          <span className="hg-money-hero-figure-words">
            {next === null ? words.allIn : words.nothingDue}
          </span>
          {next === null ? null : (
            <span className="hg-money-on-panel">
              {words.nothingDueLine(format.word('stage', next.dueOnStage))}
            </span>
          )}
        </div>
      ) : (
        <div className="hg-money-hero-now">
          <div className="hg-money-hero-figure-row">
            <span className="hg-money-hero-figure">{format.money(now.request.amount)}</span>
          </div>
          <span className="hg-money-on-panel">
            {Number(now.part.received) > 0
              ? words.partOfWithIn(
                  now.part.label,
                  now.part.position,
                  payments.parts.length,
                  format.money(now.part.received),
                )
              : words.partOf(now.part.label, now.part.position, payments.parts.length)}
          </span>
        </div>
      )}
      <MoneyBar {...props} />
      {now === null ? null : <HeroActs {...props} partId={now.part.id} />}
    </HeroPanel>
  );
}

/** Received, due and still to come, one bar, each segment its own colour and named below it. */
function MoneyBar({ payments, words }: ProjectMoneyProps & { readonly payments: ProjectPayments }) {
  const format = useFormat();
  const { money } = payments;
  const segments = barOf(payments);
  if (segments.length === 0) return null;
  const legend = {
    in: words.legendIn(format.money(money.collected)),
    due: words.legendDue(format.money(money.toCollect)),
    next: words.legendNext(format.money(money.next)),
  };
  return (
    <div className="hg-money-bar-frame">
      <div
        className="hg-money-bar"
        role="img"
        aria-label={words.moneyBar(
          format.money(money.collected),
          format.money(money.toCollect),
          format.money(money.next),
        )}
      >
        {segments.map((segment) => (
          <span
            key={segment.key}
            className="hg-money-bar-segment"
            data-part={segment.key}
            style={{ flexGrow: segment.weight }}
          />
        ))}
      </div>
      <div className="hg-money-legend" aria-hidden="true">
        {segments.map((segment) => (
          <span key={segment.key} className="hg-money-legend-item">
            <span className="hg-money-legend-swatch" data-part={segment.key} />
            {legend[segment.key]}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroActs(
  props: ProjectMoneyProps & { readonly payments: ProjectPayments; readonly partId: string },
) {
  const { collect, record } = heroActsOf(props, props.partId);
  return (
    <div className="hg-money-hero-acts">
      {collect === null ? null : (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<ShellGlyph name="rupee" size="md" tone="inverse" />}
          onClick={collect.onClick}
        >
          {collect.label}
        </Button>
      )}
      {record === null ? null : (
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={record.disabled}
          disabledReason={record.disabledReason}
          icon={<ShellGlyph name="plus" size="md" />}
          onClick={record.onClick}
        >
          {record.label}
        </Button>
      )}
    </div>
  );
}
