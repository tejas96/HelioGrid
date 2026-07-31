import { workflowStatusSchema } from '@heliogrid/contracts';
import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet } from 'react-native';
import { AppText, Avatar, Badge, ListRow, StatCard, StatusChip } from '../../../ui';
import { Glyph, noop, Row, Section, STATUS_LABEL } from './GalleryChrome';

export function RowsSections() {
  return (
    <>
      <Section title="List rows">
        <ListRow
          icon={<Glyph color={theme.colors.accent} />}
          title="Asha Patil"
          subtitle="Baner, Pune · 5.2 kWp"
          trailing={<StatusChip status="approved" label="Approved" density="functional" />}
          onClick={noop}
        />
        <ListRow
          avatar={<Avatar name="Ravi Kumar" />}
          title="आधार तैयार है — 5.2 kWp"
          subtitle="Site survey v2 · ₹4,52,471"
          onClick={noop}
        />
        <ListRow
          density="functional"
          icon={<Glyph color={theme.colors.info} size={8} />}
          iconColor={theme.colors.info}
          title="Functional row"
          trailing={
            <Badge tone="info" density="functional">
              3
            </Badge>
          }
        />
      </Section>

      <Section title="Stat cards">
        <Row stretch>
          <StatCard
            style={styles.flexOne}
            label="Pipeline value"
            value="₹4.5L"
            delta="+12% this month"
            deltaDir="up"
          />
          <StatCard
            style={styles.flexOne}
            label="Site visits"
            value="18"
            unit="this week"
            delta="−8%"
            deltaDir="down"
          />
        </Row>
      </Section>

      <Section title="Status chips — all 7 workflow states">
        <Row>
          {workflowStatusSchema.options.map((status) => (
            <StatusChip key={status} status={status} label={STATUS_LABEL[status]} />
          ))}
        </Row>
        <StatusChip status="commissioned" label="Functional density" density="functional" />
      </Section>
    </>
  );
}

/** RN-only — proves Devanagari rendering through AppText run-splitting on-device; web has
 * no equivalent (no run-splitting needed in the DOM). Kept as its own export so it stays
 * last on screen, matching its original position (mobile CLAUDE.md landmine). */
export function DevanagariSection() {
  return (
    <Section title="Devanagari — AppText run-splitting">
      <AppText weight="700">आधार तैयार है — Foundations ready</AppText>
      <AppText>सर्वेक्षण शेड्यूल करें · Schedule survey · 5.2 kWp</AppText>
      <AppText mono color={theme.colors['text-secondary']}>
        ₹4,52,471 · +91 98765 43210
      </AppText>
    </Section>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
});
