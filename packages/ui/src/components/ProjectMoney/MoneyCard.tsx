import { daysFrom } from '@heliogrid/domain';
import { StatusMark } from '../../primitives/StatusMark/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { IconButton } from '../IconButton';
import { useFormat } from '../MarketProvider';
import { CardHead } from '../ProjectDetail/ProjectDetailParts';
import type { MoneyCardProps } from './ProjectMoney.types';

/**
 * The project's Money card (`M11-52`'s one mirror on the project page): collected of total, the
 * part due now and how long it has waited, who shared its request last, and the one act that
 * writes no money — share the request. Everything else is on the payments screen it opens.
 */
export function MoneyCard({ money, today, words, onShare, onOpen }: MoneyCardProps) {
  const format = useFormat();
  const due = money.duePart;
  return (
    <section aria-label={words.money}>
      <Card density="functional" className="hg-money-card">
        <CardHead
          title={words.money}
          aside={null}
          act={
            <IconButton label={words.openPayments} variant="ghost" onClick={onOpen}>
              <ShellGlyph name="chevron-right" size="md" />
            </IconButton>
          }
        />
        <div className="hg-money-glance">
          {Number(money.total) === 0 ? (
            <span className="hg-money-glance-line">{words.noScheduleTitle}</span>
          ) : (
            <span className="hg-money-glance-line">
              {words.collectedOf(format.money(money.collected), format.money(money.total))}
            </span>
          )}
          {due === null ? (
            <span className="hg-money-quiet">{words.nothingDue}</span>
          ) : (
            <div className="hg-money-glance-due">
              <span className="hg-money-glance-line">
                {words.duePartLine(due.label, format.money(due.outstanding))}
              </span>
              <StatusMark
                tone="warning"
                label={words.dueFor(words.days(daysFrom(due.dueOn, today)))}
              />
              {due.lastShared === null ? null : (
                <span className="hg-money-quiet">
                  {words.sharedBy(due.lastShared.by.name, format.date(due.lastShared.at))}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="hg-money-glance-acts">
          {due !== null && onShare !== undefined ? (
            <Button
              variant="primary"
              size="md"
              icon={<ShellGlyph name="send" size="sm" tone="inverse" />}
              onClick={() => onShare(due.id)}
            >
              {words.shareRequest}
            </Button>
          ) : null}
          <Button variant="secondary" size="md" onClick={onOpen}>
            {words.openPayments}
          </Button>
        </div>
      </Card>
    </section>
  );
}
