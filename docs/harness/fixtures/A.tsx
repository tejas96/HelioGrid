'use client';
import * as UI from '@heliogrid/ui';
import type { Fixture } from '../types';

export const FIXTURES_A: Fixture[] = [
  {
    name: 'Accordion',
    node: (
      <UI.Accordion
        multiple
        defaultOpen={['system']}
        items={[
          {
            key: 'system',
            title: 'System',
            meta: '8.4 kWp · 14 panels',
            total: '₹4,52,471',
            state: 'done',
            marks: [
              <UI.StatusChip key="stage" status="design-in-progress" />,
              <UI.Badge key="roof" tone="info">
                RCC roof
              </UI.Badge>,
            ],
            action: (
              <UI.Button variant="ghost" size="sm" onClick={() => undefined}>
                Refresh from design
              </UI.Button>
            ),
            provenance: { tier: 'derived', source: 'MSEDCL LT-I tariff, Apr 2026' },
            content: (
              <UI.Block flat title="Bill of materials">
                14 × Waaree 600 Wp mono PERC · Growatt MIN 6000TL-X · Pune, Maharashtra.
              </UI.Block>
            ),
          },
          {
            key: 'answers',
            title: 'Answers · warranty',
            meta: '9 of 14 answered',
            state: 'errors',
            errorCount: 3,
            content: <p>Product warranty, performance warranty and workmanship all disagree.</p>,
          },
          {
            key: 'escalation',
            title: 'Escalation',
            meta: 'Owner sign-off',
            state: 'done',
            stateLabel: 'Approved',
            content: <p>Approved by Ramesh Patil on 2026-08-11.</p>,
          },
          {
            key: 'brands',
            title: 'Preferred brands',
            state: 'empty',
            stateLabel: 'Empty',
            content: <p>No preferred inverter brand recorded for this tenant.</p>,
          },
        ]}
      />
    ),
  },
  {
    name: 'ActionReason',
    node: (
      <UI.ActionReason
        id="reason-generate-proposal"
        reason="Draw a roof first — the proposal needs a shaded layout before it can be generated."
        align="left"
      />
    ),
  },
  {
    name: 'ActivityStream',
    node: (
      <div style={{ width: 640 }}>
        <UI.ActivityStream
          total={38}
          countLabel="entries"
          entries={[
            {
              id: 'e-412',
              kind: 'payment',
              at: '2026-08-14T16:12:00+05:30',
              actorClass: 'customer',
              actor: 'Anil Kulkarni',
              summary: 'Advance tranche paid — ₹1,20,000',
              detail: 'UPI · reference 4471QF20',
              marks: [
                <UI.Badge key="rec" tone="success">
                  Reconciled
                </UI.Badge>,
              ],
              provenance: { tier: 'measured', source: 'ICICI bank feed' },
              action: (
                <UI.Button size="sm" onClick={() => undefined}>
                  Open receipt
                </UI.Button>
              ),
              onOpen: () => undefined,
            },
            {
              id: 'e-411',
              kind: 'stage',
              at: '2026-08-14T11:40:00+05:30',
              actorClass: 'person',
              actor: 'Priya Sharma',
              summary: 'Moved HG-4812 from design-in-progress to approved',
              detail: 'Structure survey cleared; string layout unchanged.',
            },
            {
              id: 'e-410',
              kind: 'agent-call',
              at: '2026-08-13T09:05:00+05:30',
              actorClass: 'agent',
              actor: 'Meera',
              summary: 'Called Anil Kulkarni about the Nashik site visit',
              detail: 'Slot confirmed for 2026-08-18, 10:30 am.',
            },
            {
              id: 'e-409',
              kind: 'system',
              at: '2026-08-12T00:05:00+05:30',
              actorClass: 'system',
              actor: 'dunning ladder',
              summary: 'Reminder 2 of 4 sent for invoice INV-2026-0771',
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'ActorClass',
    node: (
      <UI.ActorClass
        actorClass="system"
        form="origin"
        verb="Resurfaced by"
        rule="no contact in 3 days"
        actor="lead nudge"
      />
    ),
  },
  {
    name: 'AllocationMeter',
    node: (
      <div style={{ width: 640 }}>
        <UI.AllocationMeter
          label="Payment schedule"
          targetLabel="Total allocation must = 100%"
          enforcement="at-generate"
          showLegend
          parts={[
            { label: 'On signing', value: 30 },
            { label: 'On delivery', value: 40 },
            { label: 'On commissioning', value: 18 },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'AppRail',
    node: (
      <div style={{ height: 480 }}>
        <UI.AppRail
          value="leads"
          onChange={() => undefined}
          items={[
            { key: 'day', label: 'My day', icon: <UI.Icon>⌂</UI.Icon> },
            { key: 'leads', label: 'Leads', icon: <UI.Icon>☰</UI.Icon> },
            { key: 'sites', label: 'Sites', icon: <UI.Icon>⌖</UI.Icon> },
            { key: 'docs', label: 'Documents', icon: <UI.Icon>▤</UI.Icon> },
            { key: 'apps', label: 'Modules', icon: <UI.Icon>▦</UI.Icon> },
          ]}
          footer={[
            { key: 'alerts', label: 'Notifications', icon: <UI.Icon>⚑</UI.Icon>, badge: 7 },
            { key: 'settings', label: 'Settings', icon: <UI.Icon>⚙</UI.Icon> },
          ]}
          avatar={<UI.Avatar name="Amit Rane" size={32} />}
        />
      </div>
    ),
  },
  {
    name: 'AppShell',
    node: (
      <div style={{ height: 480 }}>
        <UI.AppShell
          rail={
            <UI.AppRail
              value="sites"
              onChange={() => undefined}
              items={[
                { key: 'day', label: 'My day', icon: <UI.Icon>⌂</UI.Icon> },
                { key: 'leads', label: 'Leads', icon: <UI.Icon>☰</UI.Icon> },
                { key: 'sites', label: 'Sites', icon: <UI.Icon>⌖</UI.Icon> },
              ]}
              avatar={<UI.Avatar name="Amit Rane" size={32} />}
            />
          }
          header={
            <UI.AppHeader
              title="HG-4812 · Kulkarni residence"
              subtitle="Nashik, Maharashtra · 8.4 kWp"
              tenant={<UI.Badge tone="neutral">Suryodaya Solar</UI.Badge>}
              notifications={7}
              onNotificationsClick={() => undefined}
              avatar={<UI.Avatar name="Amit Rane" size={32} />}
              breadcrumb={
                <UI.Breadcrumb
                  items={[
                    { key: 'home', label: 'Sites', onClick: () => undefined },
                    { key: 'nashik', label: 'Nashik', onClick: () => undefined },
                    { key: 'hg4812', label: 'HG-4812' },
                  ]}
                />
              }
            />
          }
        >
          <UI.Block title="Today" meta="Quote v4 · 2026-08-12" count={6} countLabel="tasks">
            Six site visits scheduled across Pune and Nashik.
          </UI.Block>
        </UI.AppShell>
      </div>
    ),
  },
  {
    name: 'AudioPlayer',
    node: (
      <div style={{ width: 640 }}>
        <UI.AudioPlayer
          state="ready"
          src="/recordings/hg-4812-2026-08-13.mp3"
          duration={412}
          title="Agent call · Anil Kulkarni"
          meta="Outbound · Nashik site visit"
          consentAt="13 Aug 2026, 9:05 am"
          retentionUntil="11 Nov 2026"
          retentionBound="Growth pack · 90-day retention"
          transcriptLabel="Open transcript"
          onOpenTranscript={() => undefined}
          speeds={[1, 1.25, 1.5, 2]}
        />
      </div>
    ),
  },
  {
    name: 'Avatar',
    node: (
      <UI.AvatarGroup
        size={40}
        max={4}
        people={[
          { name: 'Ramesh Patil' },
          { name: 'Priya Sharma' },
          { name: 'Anil Kulkarni' },
          { name: 'Amit Rane' },
          { name: 'Sunita Deshmukh' },
        ]}
      />
    ),
  },
  {
    name: 'BandedFigure',
    node: (
      <div style={{ width: 640 }}>
        <UI.BandedFigure
          variant="box"
          label="Maximum system voltage"
          value={1043}
          unit="V"
          bound="Limit 1000 V · IEC 62548 · at −2 °C record low"
          bands={[
            { label: 'Passing', tone: 'success', max: 1000 },
            {
              label: 'Fault',
              tone: 'danger',
              min: 1000,
              remedy: 'Shorten the string — drop one panel from string 3.',
            },
          ]}
          provenance={{ tier: 'derived', source: 'Module Voc × 1.14 temperature factor' }}
        />
      </div>
    ),
  },
  {
    name: 'Banner',
    node: (
      <div style={{ width: 640 }}>
        <UI.BannerStack mode="stack">
          <UI.Banner
            kind="dunning"
            title="₹1,20,000 is 14 days overdue"
            action={<UI.BannerAction onClick={() => undefined}>Pay now</UI.BannerAction>}
          >
            Work on HG-4812 pauses at 30 days. Any advance already paid is not forfeited if the
            balance is settled within 90 days.
          </UI.Banner>
          <UI.Banner kind="below-cost" title="This quote is below cost">
            ₹4,12,000 against a ₹4,38,000 bill of materials. Approval from the owner is required.
          </UI.Banner>
          <UI.Banner kind="preliminary">
            Preliminary quote — the structure survey has not been done.
          </UI.Banner>
        </UI.BannerStack>
      </div>
    ),
  },
  {
    name: 'Block',
    node: (
      <div style={{ width: 640 }}>
        <UI.Block
          overline="DOCUMENTS"
          title="Sanction & subsidy"
          meta="Quote v4 · 12 Aug 2026"
          count={14}
          countLabel="documents"
          badge={<UI.StatusChip status="approved" />}
          action={
            <UI.Button variant="ghost" size="sm" onClick={() => undefined}>
              Upload
            </UI.Button>
          }
          footer="Sourced from the MSEDCL portal at 2026-08-12T09:00:00+05:30."
          provenance={{ tier: 'measured', source: 'MSEDCL portal' }}
        >
          Feasibility letter, net-metering application and the DISCOM sanction are on file for the
          Kulkarni residence, Nashik.
        </UI.Block>
      </div>
    ),
  },
  {
    name: 'BrandColorField',
    node: (
      <div style={{ width: 640 }}>
        <UI.BrandColorField
          value="#1F5FA9"
          onChange={() => undefined}
          label="Primary brand colour"
          specimenLabel="On the proposal"
          companyName="Suryodaya Solar Pvt Ltd"
          showSuggestion
        />
      </div>
    ),
  },
  {
    name: 'Breadcrumb',
    node: (
      <UI.Breadcrumb
        maxItems={4}
        onNavigate={() => undefined}
        items={[
          { key: 'root', label: 'Suryodaya Solar', onClick: () => undefined },
          { key: 'sites', label: 'Sites', onClick: () => undefined },
          { key: 'nashik', label: 'Nashik', onClick: () => undefined },
          { key: 'project', label: 'HG-4812 · Kulkarni residence', onClick: () => undefined },
          { key: 'design', label: 'Design v4' },
        ]}
      />
    ),
  },
  {
    name: 'Button',
    node: (
      <UI.Button variant="primary" size="lg" icon={<UI.Icon>⚡</UI.Icon>} onClick={() => undefined}>
        Generate proposal · ₹4,52,471
      </UI.Button>
    ),
  },
  {
    name: 'Card',
    node: (
      <div style={{ width: 640 }}>
        <UI.Card interactive selected onClick={() => undefined}>
          <UI.IconCircle color="accent" size={40}>
            <UI.Icon>☀</UI.Icon>
          </UI.IconCircle>
          <p>Kulkarni residence · Nashik</p>
          <p>8.4 kWp · commissioned 2026-06-28 · 11,240 kWh generated to date</p>
        </UI.Card>
      </div>
    ),
  },
  {
    name: 'Charts',
    node: (
      <div style={{ width: 640 }}>
        <UI.Charts.BarChart
          overline="GENERATION"
          title="Monthly yield · Kulkarni residence"
          value="11,240 kWh"
          provenance={{ tier: 'measured', source: 'Inverter telemetry · Growatt' }}
          standing="confirmed"
          note="Nashik, 8.4 kWp, first six months after commissioning."
          height={220}
          format={(n) => `${n} kWh`}
          data={[
            { label: 'Jan', value: 1020 },
            { label: 'Feb', value: 1180 },
            { label: 'Mar', value: 1410 },
            { label: 'Apr', value: 1520 },
            { label: 'May', value: 1490 },
            { label: 'Jun', value: 980 },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Checkbox',
    node: (
      <UI.Checkbox
        id="net-metering-applied"
        checked
        onChange={() => undefined}
        label="Net-metering application filed with MSEDCL"
      />
    ),
  },
  {
    name: 'Checklist',
    node: (
      <div style={{ width: 640 }}>
        <UI.Checklist
          label="Installation steps · HG-4812"
          noun="steps"
          progressNote="Two phases left. Ticks are saved to the project, so the next person sees them."
          phases={[
            { id: 'prep', label: 'Preparation' },
            { id: 'mount', label: 'Mounting' },
            { id: 'wire', label: 'Wiring' },
          ]}
          onToggle={() => undefined}
          items={[
            {
              id: 1,
              phase: 'prep',
              title: 'Confirm roof access',
              detail: 'Ladder point at the north wall of the Kulkarni residence.',
              materials: ['Ladder', 'Harness'],
              done: true,
              doneBy: { actorClass: 'person', actor: 'Priya Sharma' },
              doneAt: '2026-08-18 09:12',
            },
            {
              id: 2,
              phase: 'mount',
              title: 'Set out rail 3',
              detail: '400 mm from the ridge.',
              materials: ['Rail 3', 'L-feet ×6'],
              done: false,
              pending: { label: 'Marking “Set out rail 3” done' },
            },
            {
              id: 3,
              phase: 'wire',
              title: 'String 2 continuity check',
              done: false,
              evidence: {
                label: 'See the string calculation',
                href: '#string-2',
                onOpen: () => undefined,
              },
            },
          ]}
        />
      </div>
    ),
  },
];
