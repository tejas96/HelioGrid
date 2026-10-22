import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Badge } from '../Chip/Chip.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { useFormat } from '../MarketProvider/market-context';
import type { InviteLandingWords } from './InviteLanding.types';

/* The board's inviter row: a 40 disc at 375. */
const DISC = 40;

/** Who invited: the disc, the name and *EPC Owner · {company}* (`SCR-M01-08` m-normal). */
export function InviterRow({ inviter }: { inviter: NonNullable<InviteLandingWords['inviter']> }) {
  return (
    <View style={styles.inviter}>
      <Avatar name={inviter.name} size={DISC} />
      <View style={styles.inviterName}>
        <Text variant="body-sm" bold>
          {inviter.name}
        </Text>
        <Text variant="caption" color="secondary">
          {inviter.label}
        </Text>
      </View>
    </View>
  );
}

/**
 * The invite's facts: the overline, the roles the inviter set and the number the code went to —
 * a stated value, never a field (brief decision 2) — and the line that names the way out.
 */
export function InviteFactsBlock({
  facts,
  phone,
}: {
  facts: NonNullable<InviteLandingWords['facts']>;
  phone: string;
}) {
  const format = useFormat();
  return (
    <View style={styles.facts}>
      <Text variant="overline" color="secondary">
        {facts.label}
      </Text>
      <FactRows label={facts.label} density="expressive">
        <FactRow
          label={facts.rolesLabel}
          values={facts.roles.map((role) => (
            <Badge key={role} tone="violet" density="functional">
              {role}
            </Badge>
          ))}
          stack={false}
        />
        <FactRow
          label={facts.phoneLabel}
          value={<Text variant="mono">{format.phone(phone)}</Text>}
        />
      </FactRows>
      <Text variant="caption" color="secondary">
        {facts.line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inviter: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  inviterName: { flexShrink: 1, gap: theme.spacing['sp-0-5'] },
  facts: { gap: theme.spacing['sp-3'] },
});
