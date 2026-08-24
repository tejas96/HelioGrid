'use client';
import * as UI from '@heliogrid/ui';
import type { Fixture } from '../types';

export const FIXTURES_E: Fixture[] = [
  {
    name: 'SourceDocument',
    node: (
      <div style={{ width: 640 }}>
        <UI.SourceDocument
          name="waaree-mono-perc-545.pdf"
          meta="PDF · 2.4 MB · uploaded 12 Mar 2026"
          state="ready"
          page={1}
          onPageChange={() => undefined}
          fit="width"
          onFitChange={() => undefined}
          height={420}
          originalUrl="/render-check/assets/waaree-mono-perc-545.pdf"
          onOpenOriginal={() => undefined}
          onRetry={() => undefined}
          label="Manufacturer datasheet"
          pages={[
            {
              url: '/render-check/assets/waaree-545-p1.png',
              width: 794,
              height: 1123,
              label: 'Page 1 · Mechanical characteristics',
            },
            {
              url: '/render-check/assets/waaree-545-p2.png',
              width: 794,
              height: 1123,
              label: 'Page 2 · Electrical characteristics',
            },
            {
              url: '/render-check/assets/waaree-545-p3.png',
              width: 794,
              height: 1123,
              label: 'Page 3 · Warranty and certification',
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'StatCard',
    node: (
      <UI.StatCard
        label="Pipeline value"
        value={4520000}
        money
        compact
        delta="12%"
        deltaDir="up"
        deltaSentiment="good"
        provenance={{ tier: 'derived', source: 'Open quotes · 42 leads, Pune & Nashik' }}
        onClick={() => undefined}
        ariaLabel="Open the pipeline breakdown"
      />
    ),
  },
  {
    name: 'StatusChip',
    node: <UI.StatusChip status="design-in-progress" dot />,
  },
  {
    name: 'Stepper',
    node: (
      <div style={{ width: 360 }}>
        <UI.Stepper
          variant="rail"
          label="Proposal · Kothrud rooftop"
          current={4}
          reachability="entered"
          onStepClick={() => undefined}
          steps={[
            { label: 'Site details', state: 'done' },
            { label: 'Roof photos', state: 'done' },
            { label: 'Design', state: 'errors', errorCount: 2 },
            { label: 'Bill of materials', state: 'done' },
            { label: 'Subsidy & finance', state: 'in-progress', optional: true },
            { label: 'Review & send' },
            { label: 'Sign-off', reachable: true },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Switch',
    node: (
      <UI.Switch
        id="site-visit-consent"
        checked={false}
        onChange={() => undefined}
        label="Customer agreed to the site visit"
        error="Required before a proposal can be shared with Ramesh Patil."
      />
    ),
  },
  {
    name: 'Tabs',
    node: (
      <div style={{ width: 640 }}>
        <UI.Tabs
          value="payments"
          onChange={() => undefined}
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'proposals', label: 'Proposals', count: 12 },
            {
              value: 'payments',
              label: 'Payments',
              count: 3,
              marks: [
                <UI.Badge key="overdue" tone="danger">
                  2 overdue
                </UI.Badge>,
              ],
            },
            {
              value: 'install',
              label: 'Installation',
              disabled: true,
              disabledReason: 'Installation opens once the advance is received.',
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'TenantHeader',
    node: (
      <div style={{ width: 640 }}>
        <UI.TenantHeader
          name="Suryodaya Solar Pvt Ltd"
          caption="Your solar proposal · 8.4 kWp · Kothrud, Pune"
          size={48}
          align="left"
          actions={
            <UI.Button size="sm" onClick={() => undefined}>
              Accept proposal
            </UI.Button>
          }
        />
      </div>
    ),
  },
  {
    name: 'Textarea',
    node: (
      <div style={{ width: 480 }}>
        <UI.Textarea
          label="Site notes"
          name="site-notes"
          value="Shading from the water tank after 3 PM. Roof access from the rear stairs; the meter board is on the ground floor, MSEDCL consumer no. 170014582391."
          onChange={() => undefined}
          rows={5}
          maxLength={280}
          placeholder="What the surveyor should know before they arrive."
          helper="Visible to the surveyor and the installation crew."
          attribution={{
            level: 'inherited',
            layerName: 'Falling back to Hindi',
            source: 'Primary agent language',
            fieldName: 'Site notes',
            onOverride: () => undefined,
            overrideLabel: 'Write Marathi wording',
          }}
        />
      </div>
    ),
  },
  {
    name: 'TimeField',
    node: (
      <div style={{ width: 360 }}>
        <UI.TimeField
          id="calling-window-opens"
          label="Auto-dial resumes at"
          value="09:30"
          onCommit={() => undefined}
          min="09:00"
          max="19:00"
          windowName="Maharashtra"
          helper="Calls route to Priya Sharma until then."
          presets={[
            { value: '13:00', label: 'After lunch' },
            '17:00',
            { value: '18:30', label: 'End of day' },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Timeline',
    node: (
      <div style={{ width: 560 }}>
        <UI.Timeline
          variant="page"
          state="ready"
          items={[
            {
              id: 'captured',
              label: 'Lead captured',
              meta: '10 Mar 2026',
              status: 'done',
              actor: 'Anjali Verma',
            },
            {
              id: 'surveyed',
              label: 'Site surveyed',
              meta: '11 Mar 2026 · 12 photos',
              status: 'done',
              actor: 'Priya Sharma',
              description: 'Tape-measured roof area 68 sq m, south face, no parapet obstruction.',
            },
            {
              id: 'design',
              label: 'Design in progress',
              meta: '13 Mar 2026',
              status: 'current',
              actor: 'Ramesh Patil',
              description:
                '8.4 kWp, 16 modules on the south face. Shared for approval by 14 Mar 2026.',
            },
            {
              id: 'discom',
              label: 'DISCOM approval',
              meta: 'Docs pending',
              status: 'blocked',
              description: 'MSEDCL needs the signed net-metering application and the latest bill.',
            },
            {
              id: 'install',
              label: 'Installation',
              status: 'upcoming',
              description: 'Crew scheduled out of the Nashik depot once approval lands.',
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Toast',
    node: (
      <UI.Toast
        tone="success"
        title="Survey scheduled"
        description="12 Mar 2026, 10:30 AM · Ramesh Patil, Kothrud, Pune"
        action={
          <UI.Button variant="ghost" size="sm" onClick={() => undefined}>
            View
          </UI.Button>
        }
      />
    ),
  },
  {
    name: 'ToastHost',
    node: (
      <UI.ToastHost
        position="bottom-right"
        max={3}
        offset={96}
        duration={4000}
        onDismiss={() => undefined}
        toasts={[
          {
            id: 'survey',
            tone: 'success',
            title: 'Survey scheduled',
            description: '12 Mar 2026, 10:30 AM · Kothrud, Pune',
          },
          {
            id: 'subsidy',
            tone: 'info',
            title: 'Subsidy figures refreshed',
            description: 'MSEDCL rooftop scheme · Q1 2026 rates applied to 3 open quotes.',
          },
          {
            id: 'send-failed',
            tone: 'danger',
            title: "Couldn't send the proposal",
            description: "The request didn't reach the server. Open it and send again.",
            duration: 8000,
            action: (
              <UI.Button variant="ghost" size="sm" onClick={() => undefined}>
                Open
              </UI.Button>
            ),
          },
        ]}
      />
    ),
  },
  {
    name: 'Tooltip',
    node: (
      <UI.Tooltip label="Call Priya Sharma" placement="top" delay={300}>
        <UI.IconButton label="Call" onClick={() => undefined}>
          <UI.Icon size="md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <title>Call</title>
              <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
            </svg>
          </UI.Icon>
        </UI.IconButton>
      </UI.Tooltip>
    ),
  },
  {
    name: 'Transcript',
    node: (
      <div style={{ width: 640 }}>
        <UI.Transcript
          title="Transcript"
          meta="12 Mar 2026, 4:12 pm · 4 min 12 sec · outbound"
          language="Hindi"
          agentName="Suryodaya agent"
          customerName="Anil Kulkarni"
          currentAt={98}
          onSeek={() => undefined}
          visibleCount={40}
          total={4}
          state="ready"
          retainedNote="Recording deleted 14 Jun 2026 · Growth pack, 90-day retention · transcript retained"
          turns={[
            {
              id: 1,
              party: 'agent',
              at: 0,
              text: 'नमस्ते, मैं सूर्योदय सोलर से बोल रहा हूँ। आपने 5 kWp रूफटॉप सिस्टम के बारे में पूछा था।',
            },
            { id: 2, party: 'customer', at: 9, text: 'हाँ, कीमत क्या रहेगी?' },
            {
              id: 3,
              party: 'agent',
              at: 14,
              text: '5 kWp का सिस्टम ₹3,25,000 से शुरू होता है, सब्सिडी के बाद।',
              marks: (
                <UI.Badge tone="neutral" density="functional">
                  Subsidy questions · Hindi
                </UI.Badge>
              ),
            },
            {
              id: 4,
              party: 'customer',
              at: 158,
              language: 'English',
              text: 'Can you send this on WhatsApp?',
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'UnavailableNote',
    node: (
      <div style={{ width: 560 }}>
        <UI.UnavailableNote
          variant="region"
          align="center"
          title="No tile coverage for this pin"
          message="This rooftop in Nashik has no map imagery from our provider. The address and the coordinates are still exact."
          detail="Recorded 12 Mar 2026 · ±40 m"
          action={
            <UI.Button variant="ghost" size="sm" onClick={() => undefined}>
              See where imagery is available
            </UI.Button>
          }
        />
      </div>
    ),
  },
  {
    name: 'UsageMeter',
    node: (
      <div style={{ width: 480 }}>
        <UI.UsageMeter
          label="Proposal sends"
          value={2340}
          limit={2000}
          unit="sends"
          state="overage-accruing"
          period="1–31 Aug 2026"
          provenance="Actual usage"
          standing="confirmed"
          bundleName="Growth bundle"
          thresholdPercent={80}
          note="Overage is billed at ₹4 per send on the 1 Sep 2026 invoice."
        />
      </div>
    ),
  },
  {
    name: 'ValueSource',
    node: (
      <UI.ValueSource
        level="inherited"
        layerName="Platform catalogue"
        source="Platform catalogue · SKU MP-545"
        fieldName="Module wattage"
        onOverride={() => undefined}
        overrideLabel="Override for this tenant"
        size={13}
      />
    ),
  },
  {
    name: 'VersionDiff',
    node: (
      <div style={{ width: 640 }}>
        <UI.VersionDiff
          mode="versions"
          caption="Proposal versions · Kothrud rooftop"
          changeNote="Customer asked for a 5 kWh battery and a 3-tranche schedule."
          changeNoteLabel="What changed and why"
          before={{ label: 'v1', stamp: 'v1', note: '12 Aug 2026, Priya' }}
          after={{ label: 'v2', stamp: 'v2', note: '14 Aug 2026, Priya' }}
          showUnchanged
          addedLabel="New in this version"
          removedLabel="Not in this version"
          rows={[
            {
              key: 'capacity',
              group: 'Step 3 · System',
              label: 'Capacity',
              before: '5.4',
              after: '6.2',
              unit: 'kWp',
              beforeTier: 'estimated',
              afterTier: 'derived',
            },
            {
              key: 'battery',
              group: 'Step 3 · System',
              label: 'Battery',
              after: '5',
              unit: 'kWh',
              afterTier: 'derived',
              note: 'Added after the 14 Aug call with Anil Kulkarni.',
            },
            {
              key: 'payable',
              group: 'Money',
              label: 'Payable',
              before: '₹4,86,000',
              after: '₹5,41,200',
              beforeTier: 'derived',
              afterTier: 'derived',
            },
            {
              key: 'discount',
              group: 'Money',
              label: 'Dealer discount',
              before: '₹12,000',
              gapLabel: 'Withdrawn in v2',
            },
            {
              key: 'subsidy',
              group: 'Money',
              label: 'Subsidy',
              before: '₹78,000',
              after: '₹78,000',
              afterTier: 'assumed',
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Wordmark',
    node: <UI.Wordmark size={44} tone="default" />,
  },
];
