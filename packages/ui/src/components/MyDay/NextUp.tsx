import type { MyDay, MyDayItem } from '@heliogrid/contracts';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import { IconButton } from '../IconButton';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance';
import { leadActOf, nameOf, positionOf, whenOf, whyFirstOf } from './MyDay.logic';
import type { MyDayProps } from './MyDay.types';

type HeroProps = MyDayProps & { readonly day: MyDay };

/**
 * The one task to do now (sample B, *Next up*): who, what and why, then *Call* — or *Directions* to
 * a visit — *Message* and the tick, with *Move to tomorrow* under them. After a call it asks how the
 * call went instead.
 */
export function NextUp(props: HeroProps) {
  const { asking, next } = props;
  if (asking !== null) return <AskingHero {...props} item={asking} />;
  if (next === null) return null;
  return <NextHero {...props} item={next} />;
}

function NextHero(props: HeroProps & { readonly item: MyDayItem }) {
  const { item, day, words, sending } = props;
  const format = useFormat();
  const name = nameOf(item, words);
  const when = whenOf(item, day, words, format);
  const position = positionOf(day, words);
  const act = leadActOf(item, props);
  const why = words.why(item);
  const bill = item.lead.monthlyBill;
  const whyFirst = whyFirstOf(item, day, words);
  return (
    <HeroPanel
      label={words.nextUp}
      labelAside={
        <span className="hg-my-day-hero-aside">
          <StatusMark tone={when.tone} label={when.label} />
          {position === null ? null : <span className="hg-my-day-position">{position}</span>}
        </span>
      }
    >
      <Who name={name} line={[words.task(item), item.lead.city]} />
      {bill === null && why === null ? null : (
        <div className="hg-my-day-chips">
          {bill === null ? null : (
            <span className="hg-my-day-chip">
              <ShellGlyph name="rupee" size="sm" tone="secondary" />
              {words.bill(format.money(bill.amount))}
              <ProvenanceTier tier={bill.tier} />
            </span>
          )}
          {why === null ? null : (
            <span className="hg-my-day-chip">
              <ShellGlyph name="spark" size="sm" tone="accent" />
              {why}
            </span>
          )}
        </div>
      )}
      <div className="hg-my-day-acts">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<ShellGlyph name={act.glyph} size="sm" tone="inverse" />}
          disabled={act.off !== null}
          disabledReason={act.off ?? undefined}
          onClick={act.onPress}
        >
          {act.label}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          icon={<ShellGlyph name="chat" size="sm" tone="primary" />}
          onClick={() => props.onMessage(item)}
        >
          {words.message}
        </Button>
        <IconButton
          size={48}
          label={words.doneName(name)}
          disabled={sending}
          onClick={() => props.onDone(item)}
        >
          <ShellGlyph name="tick" size="md" tone="success" />
        </IconButton>
      </div>
      <div className="hg-my-day-later">
        {whyFirst === null ? null : <p className="hg-my-day-why-first">{whyFirst}</p>}
        <Button
          variant="ghost"
          size="sm"
          icon={<ShellGlyph name="calendar-clock" size="sm" tone="secondary" />}
          disabled={sending}
          onClick={() => props.onMoveToTomorrow(item)}
        >
          {words.moveToTomorrow}
        </Button>
      </div>
    </HeroPanel>
  );
}

/** After *Call*: how did it go — answered or no answer — or not now. Inert while the answer is out. */
function AskingHero(props: HeroProps & { readonly item: MyDayItem }) {
  const { item, words, sending } = props;
  const name = nameOf(item, words);
  return (
    <HeroPanel label={words.nextUp}>
      <Who name={name} line={[words.task(item), item.lead.city]} />
      <p className="hg-my-day-ask" aria-live="polite">
        {words.howDidItGo(name)}
      </p>
      <div className="hg-my-day-answers">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={sending}
          icon={<ShellGlyph name="phone" size="sm" tone="inverse" />}
          onClick={() => props.onAnswer('answered')}
        >
          {words.answered}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={sending}
          onClick={() => props.onAnswer('no_answer')}
        >
          {words.noAnswer}
        </Button>
      </div>
      <div className="hg-my-day-later">
        <Button variant="secondary" size="md" disabled={sending} onClick={props.onSkipAnswer}>
          {words.notNow}
        </Button>
      </div>
    </HeroPanel>
  );
}

/** The lead's face and name as the hero's title, and what the task is and where, under it. */
function Who({ name, line }: { name: string; line: readonly (string | null)[] }) {
  return (
    <div className="hg-my-day-who">
      <Avatar name={name} size={48} />
      <div className="hg-my-day-who-words">
        <h2 className="hg-my-day-name">{name}</h2>
        <p className="hg-my-day-task">
          {line.map((part) =>
            part === null ? null : (
              <span key={part} className="hg-my-day-task-part">
                {part}
              </span>
            ),
          )}
        </p>
      </div>
    </div>
  );
}
