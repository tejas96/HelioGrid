import { theme } from '@heliogrid/tokens/theme';
import { Inbox } from 'lucide-react-native';
import { useState } from 'react';
import {
  AppText,
  Button,
  EmptyState,
  OfflineBanner,
  ProgressBar,
  SegmentedControl,
  Tabs,
  Toast,
} from '../../../ui';
import { noop, Row, Section } from './GalleryChrome';

export function FeedbackNavSections() {
  const [progress, setProgress] = useState(40);
  const [period, setPeriod] = useState('week');
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('overview');

  return (
    <>
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

      <Section title="Offline banner">
        <OfflineBanner count={3} />
        <OfflineBanner message="ऑफ़लाइन — 3 सर्वेक्षण अपलोड की प्रतीक्षा में" />
      </Section>

      <Section title="Progress">
        <ProgressBar value={progress} />
        <ProgressBar value={progress} gradient />
        <Row>
          <Button size="sm" variant="secondary" onClick={() => setProgress((p) => (p + 10) % 110)}>
            Advance
          </Button>
        </Row>
      </Section>

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

      <Section title="Segmented control">
        <SegmentedControl
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          value={period}
          onChange={setPeriod}
        />
        <SegmentedControl
          density="functional"
          options={[
            { value: 'list', label: 'List' },
            { value: 'map', label: 'Map' },
          ]}
          value={view}
          onChange={setView}
        />
      </Section>

      <Section title="Tabs">
        <Tabs
          items={[
            { value: 'overview', label: 'Overview' },
            { value: 'design', label: 'Design' },
            { value: 'payments', label: 'Payments' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <AppText color={theme.colors['text-secondary']}>
          {'Selected: '}
          {tab}
        </AppText>
      </Section>
    </>
  );
}
