import { type WorkflowStatus, workflowStatusSchema } from '@heliogrid/contracts';
import { theme } from '@heliogrid/tokens/theme';
import { Inbox } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  EmptyState,
  IconButton,
  ListRow,
  OfflineBanner,
  StatCard,
  StatusChip,
  Toast,
} from '../../ui';

/**
 * Stateless sections + shared scaffolding for the dev-only GalleryScreen (CLAUDE.md
 * satellite; split keeps both files under the ~450-line cap). Stateful sections live in
 * GalleryScreen.tsx.
 */

export const TONES = ['neutral', 'success', 'warning', 'danger', 'info', 'accent'] as const;

/**
 * Gallery-local demo copy, keyed by the contract enum: adding a workflow status is a
 * compile error here until the gallery renders it (a state not in the gallery does not
 * exist — packages/ui CLAUDE.md). Product screens translate via Lingui instead.
 */
const STATUS_LABEL: Record<WorkflowStatus, string> = {
  lead: 'Lead',
  'survey-scheduled': 'Survey scheduled',
  'design-in-progress': 'Design in progress',
  approved: 'Approved',
  installing: 'Installing',
  commissioned: 'Commissioned',
  'on-hold': 'On hold',
};

const PEOPLE = [
  { name: 'Asha Patil' },
  { name: 'Ravi Kumar' },
  { name: 'Meera Joshi' },
  { name: 'Arjun Singh' },
  { name: 'Neha Kulkarni' },
  { name: 'Vikram Rao' },
];

export const noop = () => undefined;

/** Placeholder icon dot — Lucide RN icons are not bundled yet (mobile CLAUDE.md landmine). */
export function Glyph({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius['r-pill'],
        backgroundColor: color,
      }}
    />
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {/* biome-ignore lint/a11y/useValidAriaRole: AppText `role` is the typography role (TypeRole), not ARIA — RN has no DOM roles */}
      <AppText
        role="overline"
        weight="700"
        color={theme.colors['text-secondary']}
        style={styles.overline}
      >
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function Row({ children, stretch = false }: { children: ReactNode; stretch?: boolean }) {
  return <View style={[styles.row, stretch && styles.rowStretch]}>{children}</View>;
}

export function ButtonsSection() {
  return (
    <Section title="Buttons — variants">
      <Row>
        <Button size="md" onClick={noop}>
          Schedule survey
        </Button>
        <Button size="md" variant="secondary" onClick={noop}>
          Save draft
        </Button>
        <Button size="md" variant="ghost" onClick={noop}>
          Skip for now
        </Button>
        <Button size="md" variant="destructive" onClick={noop}>
          Delete lead
        </Button>
      </Row>
      <Row>
        <Button size="lg" onClick={noop}>
          Large 48
        </Button>
        <Button size="md" onClick={noop}>
          Medium 40
        </Button>
        <Button size="sm" onClick={noop}>
          Small 32
        </Button>
      </Row>
      <Row>
        <Button size="md" disabled>
          Disabled
        </Button>
        <Button size="md" loading>
          Sending
        </Button>
        <Button size="md" variant="secondary" disabled>
          Disabled secondary
        </Button>
      </Row>
      <Button fullWidth onClick={noop}>
        सर्वेक्षण शेड्यूल करें
      </Button>
    </Section>
  );
}

export function IconButtonsSection() {
  return (
    <Section title="Icon buttons">
      <Row>
        <IconButton label="Add" onClick={noop}>
          <Glyph color={theme.colors['text-primary']} />
        </IconButton>
        <IconButton label="Confirm" variant="dark" onClick={noop}>
          <Glyph color={theme.colors.surface} />
        </IconButton>
        <IconButton label="More options" variant="ghost" onClick={noop}>
          <Glyph color={theme.colors['text-secondary']} />
        </IconButton>
        <IconButton label="Locked" disabled>
          <Glyph color={theme.colors['text-disabled']} />
        </IconButton>
        <IconButton label="Compact" size={32} onClick={noop}>
          <Glyph color={theme.colors['text-primary']} size={8} />
        </IconButton>
      </Row>
    </Section>
  );
}

export function BadgesSection() {
  return (
    <Section title="Badges">
      <Row>
        {TONES.map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
        <Badge density="functional" tone="success">
          Functional
        </Badge>
      </Row>
    </Section>
  );
}

export function AvatarsSection() {
  return (
    <Section title="Avatars">
      <Row>
        <Avatar name="Asha Patil" size={24} />
        <Avatar name="Ravi Kumar" size={32} />
        <Avatar name="Meera Joshi" />
        <Avatar name="Arjun Singh" size={56} />
      </Row>
      <AvatarGroup people={PEOPLE} max={4} />
    </Section>
  );
}

export function ListRowsSection() {
  return (
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
  );
}

export function StatCardsSection() {
  return (
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
  );
}

export function StatusChipsSection() {
  return (
    <Section title="Status chips — all 7 workflow states">
      <Row>
        {workflowStatusSchema.options.map((status) => (
          <StatusChip key={status} status={status} label={STATUS_LABEL[status]} />
        ))}
      </Row>
      <StatusChip status="commissioned" label="Functional density" density="functional" />
    </Section>
  );
}

export function EmptyStateSection() {
  return (
    <Section title="Empty state">
      <EmptyState
        icon={
          <Inbox
            color={theme.colors['iris-violet']}
            size={28}
            strokeWidth={1.5}
            absoluteStrokeWidth
          />
        }
        title="No leads yet"
        description="Leads you add or import appear here."
        action={
          <Button size="md" onClick={noop}>
            Add first lead
          </Button>
        }
      />
    </Section>
  );
}

export function OfflineBannerSection() {
  return (
    <Section title="Offline banner">
      <OfflineBanner count={3} />
      <OfflineBanner message="ऑफ़लाइन — 3 सर्वेक्षण अपलोड की प्रतीक्षा में" />
    </Section>
  );
}

export function ToastsSection() {
  return (
    <Section title="Toasts">
      <Toast tone="success" title="Proposal sent" description="Asha Patil · over WhatsApp" />
      <Toast tone="warning" title="Sync pending" description="3 surveys waiting for Wi-Fi" />
      <Toast
        tone="danger"
        title="Upload failed"
        action={
          <Button size="sm" variant="ghost" onClick={noop}>
            Retry
          </Button>
        }
      />
      <Toast tone="info" title="New assignment" description="Site visit tomorrow 10:00" />
      <Toast tone="neutral" title="Draft saved" />
    </Section>
  );
}

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
  section: {
    gap: theme.spacing['sp-3'],
  },
  overline: {
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  rowStretch: {
    alignItems: 'stretch',
  },
  flexOne: {
    flex: 1,
  },
});
