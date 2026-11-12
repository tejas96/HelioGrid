import { useState } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { HeroPanel } from '../HeroPanel';
import { HueTile } from '../HueTile';
import { useFormat } from '../MarketProvider';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import { type NeedItem, needItemsOf, nextNeedAt } from './OwnerDashboard.logic';
import './NeedsYouHero.css';

/**
 * What needs you now — the screen's one hero. Where the room is narrow it holds one item at a time
 * with *Next* to the one after; where it is wide every item stands in a row with its own act
 * (`OwnerDashboard.css`, the container's width). Nothing waiting: the hero says so, calmly.
 */
export function NeedsYouHero({ view, words, needsYou, onNeed }: DashboardPartProps) {
  const format = useFormat();
  const items = needItemsOf(view.needsYou, needsYou, words, (amount) => format.money(amount));
  const [chosen, setChosen] = useState(0);
  const at = chosen < items.length ? chosen : 0;
  if (items.length === 0) {
    return (
      <HeroPanel label={words.needsYouNow}>
        <div className="hg-owner-need-clear">
          <HueTile glyph="check-check" hue="success" size={48} stroke={1.75} />
          <div className="hg-owner-need-words">
            <span className="hg-owner-need-title">{words.allClearTitle}</span>
            <span className="hg-owner-on-panel">{words.allClearBody}</span>
          </div>
        </div>
      </HeroPanel>
    );
  }
  return (
    <HeroPanel
      label={words.needsYouNow}
      labelAside={
        <span className="hg-owner-need-nav" data-many={items.length > 1 ? 'true' : undefined}>
          <span className="hg-owner-need-position">{words.position(at + 1, items.length)}</span>
          <span className="hg-owner-need-count">{format.number(items.length)}</span>
          {items.length > 1 ? (
            <span className="hg-owner-need-next">
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ShellGlyph name="chevron-right" size="sm" tone="primary" />}
                onClick={() => setChosen(nextNeedAt(at, items.length))}
              >
                {words.nextNeed}
              </Button>
            </span>
          ) : null}
        </span>
      }
    >
      <ul className="hg-owner-needs" aria-live="polite">
        {items.map((item, index) => (
          <NeedCard
            key={item.kind}
            item={item}
            current={index === at}
            onAct={() => onNeed(item.open)}
          />
        ))}
      </ul>
    </HeroPanel>
  );
}

function NeedCard({
  item,
  current,
  onAct,
}: {
  item: NeedItem;
  current: boolean;
  onAct: () => void;
}) {
  return (
    <li className="hg-owner-need" data-current={current ? 'true' : 'false'}>
      <div className="hg-owner-need-head">
        <HueTile glyph={item.glyph} hue={item.hue} size={44} stroke={1.75} />
        <div className="hg-owner-need-words">
          <span className="hg-owner-need-title">{item.title}</span>
          <span className="hg-owner-on-panel">{item.line}</span>
        </div>
      </div>
      <span className="hg-owner-need-act">
        <Button variant={current ? 'primary' : 'secondary'} size="md" onClick={onAct}>
          {item.act}
        </Button>
      </span>
    </li>
  );
}
