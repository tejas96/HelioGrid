'use client';
import {
  BloomLayer,
  OtpInput,
  RadioCard,
  Spinner,
  StepIndicator,
  TextLink,
  Wordmark,
} from '@heliogrid/ui';
import { useState } from 'react';
import { Demo, FactoryIcon, HomeIcon, LayersIcon, Section } from './support';

/** The 3-option segment group from whatyousell.md §3 — icons per §7 (home/factory/layers). */
const SEGMENT_OPTIONS = [
  {
    value: 'res',
    label: 'Residential rooftop',
    description: 'Homes · 1 to 15 kW',
    icon: <HomeIcon size={20} />,
  },
  {
    value: 'ci',
    label: 'Commercial & industrial',
    description: 'Factories and warehouses · 20 kW and above',
    icon: <FactoryIcon size={20} />,
  },
  {
    value: 'both',
    label: 'Both',
    description: 'Residential and C&I projects',
    icon: <LayersIcon size={20} />,
  },
];

export function AuthSections() {
  const [otpLive, setOtpLive] = useState('42');
  const [otpCompleted, setOtpCompleted] = useState('');
  const [otpError, setOtpError] = useState('424241');
  const [otpErrorOn, setOtpErrorOn] = useState(true);
  const [otpHindi, setOtpHindi] = useState('4242');
  const [segment, setSegment] = useState('res');

  return (
    <>
      <Section title="OtpInput — empty · partial (live) · filled · error · disabled · Hindi label">
        <div className="ds-demo-grid">
          <Demo label="empty">
            <OtpInput label="One-time code" value="" onChange={() => undefined} />
          </Demo>
          <Demo
            label={
              otpCompleted
                ? `live — onComplete fired: ${otpCompleted}`
                : 'live — type, paste, backspace walks back'
            }
          >
            <OtpInput
              label="One-time code"
              value={otpLive}
              onChange={setOtpLive}
              onComplete={setOtpCompleted}
            />
          </Demo>
          <Demo label="filled">
            <OtpInput label="One-time code" value="424242" onChange={() => undefined} />
          </Demo>
          <Demo
            label={
              otpErrorOn ? 'error (live — digits retained, edit clears)' : 'live — error cleared'
            }
          >
            <OtpInput
              label="One-time code"
              value={otpError}
              error={otpErrorOn}
              onChange={(next) => {
                setOtpError(next);
                setOtpErrorOn(false);
              }}
            />
          </Demo>
          <Demo label="disabled">
            <OtpInput label="One-time code" value="4242" disabled onChange={() => undefined} />
          </Demo>
          <Demo hindi label="Hindi label (live — digits never translate)">
            <OtpInput label="वन-टाइम कोड" value={otpHindi} onChange={setOtpHindi} />
          </Demo>
        </div>
      </Section>

      <Section title="TextLink — link · button · inline in prose · Hindi">
        <div className="ds-row">
          <Demo label="href — renders <a>">
            <TextLink href="/design">Create an account</TextLink>
          </Demo>
          <Demo label="onClick — renders <button>">
            <TextLink onClick={() => undefined}>Resend code</TextLink>
          </Demo>
          <Demo label="inline in prose (inherits size)">
            <p>
              New company? <TextLink href="/design">Create an account</TextLink>
            </p>
          </Demo>
          <Demo hindi label="Hindi">
            <TextLink onClick={() => undefined}>नंबर बदलें</TextLink>
          </Demo>
        </div>
      </Section>

      <Section title="Wordmark — sizes (brand — never translated)">
        <div className="ds-row">
          <Demo label="md (auth screens, 22px)">
            <Wordmark />
          </Demo>
          <Demo label="sm (compact shell)">
            <Wordmark size="sm" />
          </Demo>
        </div>
      </Section>

      <Section title="BloomLayer — ambient --glow-brand backdrop (atmosphere, never information)">
        <div className="ds-demo-stack">
          <Demo label="size 320 behind a Wordmark — breathes 8s, off under reduced motion">
            <div className="ds-bloom-stage">
              <BloomLayer size={320} />
              <Wordmark />
            </div>
          </Demo>
        </div>
      </Section>

      <Section title="StepIndicator — 1 of 2 · 2 of 2">
        <div className="ds-row">
          <Demo label="step 1 of 2">
            <StepIndicator steps={2} current={1} label="Step 1 of 2" />
          </Demo>
          <Demo label="step 2 of 2">
            <StepIndicator steps={2} current={2} label="Step 2 of 2" />
          </Demo>
        </div>
      </Section>

      <Section title="Spinner — sizes × tones">
        <div className="ds-row">
          <Demo label="neutral md">
            <Spinner />
          </Demo>
          <Demo label="neutral sm">
            <Spinner size="sm" />
          </Demo>
          <Demo label="onDark md · sm (on --action-primary)">
            <span className="ds-on-dark">
              <Spinner tone="onDark" />
              <Spinner tone="onDark" size="sm" />
            </span>
          </Demo>
        </div>
      </Section>

      <Section title="RadioCard — 3-option group (live — click or arrow keys)">
        <div className="ds-demo-grid">
          <Demo label={`selected: ${segment} — radiogroup semantics, accent ring`}>
            <RadioCard
              label="What do you install?"
              options={SEGMENT_OPTIONS}
              value={segment}
              onChange={setSegment}
            />
          </Demo>
        </div>
      </Section>
    </>
  );
}
