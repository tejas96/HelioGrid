import { daysFrom } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { IconButton } from '../IconButton/IconButton.native';
import { useFormat } from '../MarketProvider';
import { CardHead } from '../ProjectDetail/ProjectDetailParts.native';
import type { MoneyCardProps } from './ProjectMoney.types';

/**
 * The project's Money card on the phone (`M11-52`'s one mirror on the project page): collected of
 * total, the part due now and how long it has waited, who shared its request last, and the one
 * act that writes no money — share the request. Everything else is on the payments screen.
 */
export function MoneyCard({ money, today, words, onShare, onOpen }: MoneyCardProps) {
  const format = useFormat();
  const due = money.duePart;
  return (
    <Card density="functional" style={styles.card}>
      <CardHead
        title={words.money}
        aside={null}
        act={
          <IconButton label={words.openPayments} variant="ghost" onClick={onOpen}>
            <ShellGlyph name="chevron-right" size="md" />
          </IconButton>
        }
      />
      <View style={styles.glance}>
        {Number(money.total) === 0 ? (
          <Text variant="body">{words.noScheduleTitle}</Text>
        ) : (
          <Text variant="body">
            {words.collectedOf(format.money(money.collected), format.money(money.total))}
          </Text>
        )}
        {due === null ? (
          <Text variant="body-sm" color="secondary">
            {words.nothingDue}
          </Text>
        ) : (
          <View style={styles.due}>
            <Text variant="body">
              {words.duePartLine(due.label, format.money(due.outstanding))}
            </Text>
            <StatusMark
              tone="warning"
              label={words.dueFor(words.days(daysFrom(due.dueOn, today)))}
            />
            {due.lastShared === null ? null : (
              <Text variant="body-sm" color="secondary">
                {words.sharedBy(due.lastShared.by.name, format.date(due.lastShared.at))}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.acts}>
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
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  glance: {
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
  },
  due: { alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-3'],
  },
});
