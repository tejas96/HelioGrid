'use client';
import {
  Button,
  EmptyState,
  OfflineBanner,
  ProgressBar,
  SegmentedControl,
  Tabs,
  Toast,
} from '@heliogrid/ui';
import { useState } from 'react';
import { Demo, PlusIcon, Section, SunIcon } from './support';

const TOAST_TONES = ['success', 'warning', 'danger', 'info', 'neutral'] as const;
const PROGRESS_VALUES = [0, 25, 67, 100] as const;

export function FeedbackNavSections() {
  const [range, setRange] = useState('week');
  const [hindiRange, setHindiRange] = useState('din');
  const [tab, setTab] = useState('overview');
  const [hindiTab, setHindiTab] = useState('sarvekshan');

  return (
    <>
      <Section title="EmptyState — glow · action · plain">
        <div className="ds-demo-grid">
          <Demo label="glow + action (default glow)">
            <EmptyState
              icon={<SunIcon size={28} />}
              title="No leads yet"
              description="Leads you add or import appear here, ready for a survey visit."
              action={
                <Button size="md" icon={<PlusIcon />}>
                  Add lead
                </Button>
              }
            />
          </Demo>
          <Demo label="glow off, no action">
            <EmptyState
              icon={<SunIcon size={28} />}
              title="No designs for this site"
              description="Run a survey first — the studio starts from measured geometry."
              glow={false}
            />
          </Demo>
          <Demo hindi label="Hindi">
            <EmptyState
              icon={<SunIcon size={28} />}
              title="अभी कोई लीड नहीं"
              description="नई लीड जोड़ें — सर्वेक्षण से प्रस्ताव तक यहीं दिखेगा।"
              action={<Button size="md">लीड जोड़ें</Button>}
            />
          </Demo>
        </div>
      </Section>

      <Section title="OfflineBanner — count · singular · custom message">
        <div className="ds-row">
          <Demo label="count 3">
            <OfflineBanner count={3} />
          </Demo>
          <Demo label="count 1 (singular)">
            <OfflineBanner count={1} />
          </Demo>
          <Demo label="custom message">
            <OfflineBanner message="3 surveys waiting · will upload on Wi-Fi" />
          </Demo>
          <Demo hindi label="Hindi message">
            <OfflineBanner message="ऑफ़लाइन — 3 सर्वेक्षण Wi-Fi पर अपलोड होंगे" />
          </Demo>
        </div>
      </Section>

      <Section title="ProgressBar — values · gradient (AI/long-running only)">
        <div className="ds-demo-stack">
          {PROGRESS_VALUES.map((value) => (
            <Demo key={value} label={`value ${value}`}>
              <ProgressBar value={value} />
            </Demo>
          ))}
          <Demo label="gradient 67 — brand gradient, AI ops only">
            <ProgressBar value={67} gradient />
          </Demo>
        </div>
      </Section>

      <Section title="Toast — all 5 tones · description · action">
        <div className="ds-demo-stack">
          {TOAST_TONES.map((tone) => (
            <Demo key={tone} label={tone}>
              <Toast
                tone={tone}
                title={
                  tone === 'success'
                    ? 'Proposal sent'
                    : tone === 'warning'
                      ? 'Quote is provisional'
                      : tone === 'danger'
                        ? 'Upload failed'
                        : tone === 'info'
                          ? 'Sync complete'
                          : 'Draft saved'
                }
                description={
                  tone === 'warning' ? 'Design changed — recompute before sending.' : undefined
                }
                action={
                  tone === 'danger' ? (
                    <Button size="sm" variant="ghost">
                      Retry
                    </Button>
                  ) : undefined
                }
              />
            </Demo>
          ))}
          <Demo hindi label="Hindi">
            <Toast
              tone="success"
              title="प्रस्ताव भेजा गया"
              description="ग्राहक को WhatsApp पर लिंक मिला।"
            />
          </Demo>
        </div>
      </Section>

      <Section title="SegmentedControl — live value · densities">
        <div className="ds-row">
          <Demo label={`expressive (live — ${range})`}>
            <SegmentedControl
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
              ]}
              value={range}
              onChange={setRange}
            />
          </Demo>
          <Demo label="functional density">
            <SegmentedControl
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
              ]}
              value={range}
              onChange={setRange}
              density="functional"
            />
          </Demo>
          <Demo hindi label={`Hindi (live — ${hindiRange})`}>
            <SegmentedControl
              options={[
                { value: 'din', label: 'दिन' },
                { value: 'saptah', label: 'सप्ताह' },
                { value: 'maah', label: 'माह' },
              ]}
              value={hindiRange}
              onChange={setHindiRange}
            />
          </Demo>
        </div>
      </Section>

      <Section title="Tabs — live value · Hindi">
        <div className="ds-demo-stack">
          <Demo label={`live — active: ${tab}`}>
            <Tabs
              items={[
                { value: 'overview', label: 'Overview' },
                { value: 'surveys', label: 'Surveys' },
                { value: 'designs', label: 'Designs' },
                { value: 'payments', label: 'Payments' },
              ]}
              value={tab}
              onChange={setTab}
            />
          </Demo>
          <Demo hindi label={`Hindi (live — ${hindiTab})`}>
            <Tabs
              items={[
                { value: 'sarvekshan', label: 'सर्वेक्षण' },
                { value: 'design', label: 'डिज़ाइन' },
                { value: 'bhugtan', label: 'भुगतान' },
              ]}
              value={hindiTab}
              onChange={setHindiTab}
            />
          </Demo>
        </div>
      </Section>
    </>
  );
}
