'use client';
import * as UI from '@heliogrid/ui';
import type { Fixture } from '../types';

/** One line of the proposal's bill of materials — the only section the page cut may break. */
interface BomRow {
  item: string;
  make: string;
  qty: string;
  amount: string;
}

const BOM_ROWS: BomRow[] = [
  { item: 'Mono PERC module 545 Wp', make: 'Waaree WSMD-545', qty: '16 nos', amount: '₹3,48,800' },
  { item: 'String inverter 8 kW', make: 'Sungrow SG8.0RT', qty: '1 no', amount: '₹72,400' },
  {
    item: 'RCC elevated MMS, 15° tilt',
    make: 'Nuevosol galvanised',
    qty: '8.7 kWp',
    amount: '₹58,800',
  },
  { item: 'DC cable 4 sq mm', make: 'Polycab solar', qty: '180 m', amount: '₹14,760' },
  { item: 'AC combiner box with SPD', make: 'Havells', qty: '1 no', amount: '₹11,200' },
  {
    item: 'Earthing kit and lightning arrestor',
    make: 'JMV chemical earthing',
    qty: '3 sets',
    amount: '₹18,600',
  },
  { item: 'Net-metering liaison, MSEDCL', make: 'Suryodaya Solar', qty: '1 job', amount: '₹9,500' },
];

const PROPOSAL_SECTIONS: UI.DocumentSection<BomRow>[] = [
  {
    id: 'system',
    content: (
      <div>
        <h2>System summary</h2>
        <p>8.7 kWp rooftop, on-grid, east-west split across two roof planes at Kothrud, Pune.</p>
        <p>Estimated generation 12,180 kWh a year · first-year bill saving ₹1,09,620.</p>
      </div>
    ),
  },
  {
    id: 'bom',
    rows: BOM_ROWS,
    keepWithLast: 3,
    renderRows: (chunk, { continued, last }) => (
      <table>
        <caption>{continued ? 'Bill of materials (continued)' : 'Bill of materials'}</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Make</th>
            <th scope="col">Quantity</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {chunk.map((row) => (
            <tr key={row.item} data-flow-row="">
              <td>{row.item}</td>
              <td>{row.make}</td>
              <td>{row.qty}</td>
              <td>{row.amount}</td>
            </tr>
          ))}
        </tbody>
        {last ? (
          <tfoot data-flow-foot="">
            <tr>
              <td colSpan={3}>Total, inclusive of GST</td>
              <td>₹5,34,060</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    ),
  },
  {
    id: 'sld',
    startsPage: true,
    when: true,
    content: (
      <div>
        <h2>Single-line diagram</h2>
        <p>Array → string inverter → AC combiner → net meter → MSEDCL LT feeder.</p>
      </div>
    ),
  },
  {
    id: 'workings',
    screenOnly: true,
    label: 'Costing workings',
    content: <p>Landed module cost ₹21.4 per Wp; structure at ₹6,760 per kWp.</p>,
  },
  {
    id: 'margin',
    audience: 'internal',
    content: <p>Gross margin ₹78,400 (14.7%) at the quoted price.</p>,
  },
];

/** The proposal's terms body — the same value the document and the customer link both render. */
const TERMS: UI.RichTextValue = {
  version: 1,
  blocks: [
    { type: 'h', spans: [{ text: 'Terms and conditions' }] },
    {
      type: 'p',
      spans: [
        { text: 'This proposal is valid until ' },
        { text: '15 September 2026', b: true },
        { text: '. All amounts are in INR and include GST on the ' },
        { text: 'composite supply', i: true },
        { text: ' of goods and services.' },
      ],
    },
    {
      type: 'ul',
      items: [
        [{ text: '30% on order, 60% on delivery of material at site, 10% on commissioning.' }],
        [{ text: 'Net-metering liaison with MSEDCL is handled by Suryodaya Solar Pvt Ltd.' }],
        [{ text: 'Modules carry a 25-year performance warranty; the inverter carries 7 years.' }],
      ],
    },
    {
      type: 'ol',
      start: 1,
      items: [
        [{ text: 'Scaffolding above the second floor is billed at actuals.' }],
        [
          { text: 'Civil work for a ground mount is excluded — see ' },
          { text: 'Annexure B', href: 'https://suryodaya.example.in/annexure-b' },
          { text: '.' },
        ],
      ],
    },
    { type: 'logo' },
  ],
};

interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  statutory: boolean;
}

const TIMELINE_PHASES: TimelinePhase[] = [
  {
    id: 'survey',
    title: 'Site survey and structural check',
    description: 'Roof measured at Kothrud, Pune. Shadow readings taken at 09:00, 12:00 and 15:00.',
    statutory: false,
  },
  {
    id: 'design',
    title: 'Design and DISCOM application',
    description: 'Layout frozen at 8.7 kWp and the net-metering file lodged with MSEDCL.',
    statutory: false,
  },
  {
    id: 'structure',
    title: 'Structure mounting',
    description: 'RCC elevated MMS at 15° tilt, 6-leg, chemically anchored.',
    statutory: false,
  },
  {
    id: 'safety-signoff',
    title: 'Electrical safety inspection',
    description: 'CEIG inspection before the meter is exchanged.',
    statutory: true,
  },
];

export const FIXTURES_D: Fixture[] = [
  {
    name: 'OperationProgress',
    node: (
      <UI.OperationProgress
        gradient
        label="Computing solar access · Kumar residence, Kothrud"
        value={62}
        count={{ done: 248, total: 400 }}
        unit="module positions"
        stage="Tracing shadows across the year"
        stageIndex={2}
        stageTotal={3}
        stages={[
          { label: 'Reading the roof outline', state: 'done' },
          { label: 'Tracing shadows across the year', state: 'active' },
          { label: 'Scoring each module position', state: 'waiting' },
        ]}
        state="running"
        leaveNote="You can leave this screen — the computation keeps running and the heatmap waits for you."
        onCancel={() => undefined}
        cancelEffect="stops-the-work"
      />
    ),
  },
  {
    name: 'OptionCardGroup',
    node: (
      <UI.OptionCardGroup
        label="Racking type"
        value="rcc"
        columns={2}
        currentLabel="Quoted today"
        onChange={() => undefined}
        options={[
          {
            value: 'rcc',
            title: 'RCC elevated',
            description:
              'Standard for the concrete rooftops around Kothrud. 6-leg MMS at 15° tilt.',
            price: '₹58,800',
            meta: 'Per 8.7 kWp',
            current: true,
            content: (
              <ul>
                <li>Galvanised, 25-year structural warranty</li>
                <li>Chemically anchored — no slab penetration</li>
                <li>Walkway clearance kept at 900 mm</li>
              </ul>
            ),
            marks: ['Most quoted in Pune'],
          },
          {
            value: 'tin',
            title: 'Tin-shed rail',
            description: 'Clamps to the existing purlins. No roof penetration.',
            price: '₹41,200',
            meta: 'Per 8.7 kWp',
          },
          {
            value: 'ground',
            title: 'Ground mount',
            description: 'Needs a civil foundation and 1.5× the panel area.',
            price: '₹1,12,000',
            meta: 'Per 8.7 kWp',
            disabled: true,
            disabledReason: 'This site has 210 m² of clear ground — a ground mount needs 630 m².',
          },
        ]}
      />
    ),
  },
  {
    name: 'OtpInput',
    node: (
      <UI.OtpInput
        length={6}
        value="4821"
        label="Enter the code sent to +91 98200 41123"
        helper="The code is valid for 10 minutes."
        onChange={() => undefined}
        onComplete={() => undefined}
      />
    ),
  },
  {
    name: 'PagedDocument',
    node: (
      <div style={{ width: 840 }}>
        <UI.PagedDocument<BomRow>
          paper="a4"
          orientation="portrait"
          rendering="paged"
          audience="customer"
          label="Solar proposal · Kumar residence, Kothrud"
          titleBlock={{
            docTitle: 'Rooftop solar proposal',
            projectName: 'Rooftop solar · Kumar residence, Kothrud',
            internalName: 'HG-4812 · variant C (8.7 kWp, 545 W mono)',
            customer: { name: 'Rajesh Kumar', meta: 'Kothrud, Pune · 8.7 kWp rooftop' },
            proposalNumber: 'PRO-2026-0418',
            issueDate: '2026-08-16',
            version: 'Rev C',
            validUntil: '2026-09-15',
            preparedBy: {
              company: 'Suryodaya Solar Pvt Ltd',
              person: 'Sanjay Pawar',
              role: 'Senior consultant',
              lines: ['Shop 14, Laxmi Complex, Baner Road, Pune 411045', 'GSTIN 27AABCS1429P1ZQ'],
            },
          }}
          disclosures={[
            'indicative-basis',
            { kind: 'remote-survey', detail: 'Satellite imagery, 14 August 2026.' },
            {
              kind: 'structure',
              detail: 'RCC elevated MMS quoted without a structural stability certificate.',
            },
          ]}
          footNote="Suryodaya Solar Pvt Ltd · Pune · +91 98200 41123"
          sections={PROPOSAL_SECTIONS}
          onCut={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'PendingAction',
    node: (
      <div style={{ display: 'grid', gap: 12, width: 480 }}>
        <UI.PendingAction
          state="waiting"
          label="Assigning to Priya Sharma"
          slowNote="Taking longer than usual."
        />
        <UI.PendingAction
          state="returned"
          label="Moving to Installation"
          reason="Not moved — the job is locked by the commissioning check."
          onRetry={() => undefined}
          onDismiss={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'PreviewFrame',
    node: (
      <UI.PreviewFrameGroup>
        <UI.PreviewFrame
          label="Proposal cover"
          caption="Preview · what the customer receives as a PDF"
          note="The tenant orange fails contrast on white, so cover text stays near-black."
          designWidth={480}
          designHeight={640}
          surface="sheet"
          action={
            <UI.Button variant="ghost" size="sm" onClick={() => undefined}>
              Open full preview
            </UI.Button>
          }
        >
          <div style={{ padding: 32, fontFamily: 'inherit' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Suryodaya Solar Pvt Ltd
            </p>
            <h1 style={{ fontSize: 26, margin: '12px 0' }}>Rooftop solar · Kumar residence</h1>
            <p style={{ fontSize: 13 }}>Kothrud, Pune · 8.7 kWp on-grid · Proposal PRO-2026-0418</p>
            <p style={{ fontSize: 34, marginTop: 28 }}>₹5,34,060</p>
            <p style={{ fontSize: 11 }}>Inclusive of GST · valid until 15 September 2026</p>
          </div>
        </UI.PreviewFrame>
        <UI.PreviewFrame
          label="Customer link page"
          caption="Preview · the page the WhatsApp link opens"
          designWidth={480}
          designHeight={640}
          surface="page"
        >
          <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: 20 }}>Your solar proposal is ready</h2>
            <p style={{ fontSize: 13 }}>12,180 kWh a year · ₹1,09,620 saved in year one</p>
          </div>
        </UI.PreviewFrame>
      </UI.PreviewFrameGroup>
    ),
  },
  {
    name: 'ProgressBar',
    node: (
      <div style={{ display: 'grid', gap: 12, width: 320 }}>
        <UI.ProgressBar value={68} />
        <UI.ProgressBar value={41} gradient />
      </div>
    ),
  },
  {
    name: 'Provenance',
    node: (
      <div style={{ display: 'grid', gap: 12 }}>
        <UI.Provenance
          tier="estimated"
          standing="provisional"
          source="Real · PVGIS (SARAH3)"
          projection="25-year horizon · 4% tariff inflation"
          note="Supersedes quote v3 for the Kumar residence."
          size={13}
        />
        <UI.Provenance
          tier={{ label: 'Installer pricebook', tone: 'measured' }}
          standing="confirmed"
          source="Suryodaya pricebook, 01 Aug 2026"
        />
        <UI.ProvenanceTier tier="derived" withLabel />
      </div>
    ),
  },
  {
    name: 'QRCode',
    node: (
      <UI.QRCode
        value="https://proposals.suryodaya.co.in/p/8fK2xQ-4d1c9b7a2e6f/kumar-kothrud"
        size={168}
        quietZone={4}
        showValue
        label="QR code for the proposal for Rajesh Kumar"
        caption="Scan to open the 3D design and the quote"
      />
    ),
  },
  {
    name: 'Radio',
    node: (
      <div style={{ display: 'grid', gap: 4 }}>
        <UI.Radio
          name="mounting"
          value="rcc"
          label="RCC elevated"
          checked
          onChange={() => undefined}
        />
        <UI.Radio name="mounting" value="tin" label="Tin-shed rail" onChange={() => undefined} />
        <UI.Radio
          name="mounting"
          value="ground"
          label="Ground mount"
          disabled
          onChange={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'RangeField',
    node: (
      <div style={{ width: 480 }}>
        <UI.RangeField
          label="Module wattage"
          min={100}
          max={800}
          step={5}
          value={[440, 585]}
          unit="W"
          boxes
          boxLabels={['From', 'To']}
          hint="Filters the catalogue to modules Suryodaya stocks in Pune."
          anyLabel="Any wattage"
          format={(v) => `${v} W`}
          onInput={() => undefined}
          onCommit={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'ReorderList',
    node: (
      <div style={{ width: 560 }}>
        <UI.ReorderList<TimelinePhase>
          items={TIMELINE_PHASES}
          label="Project phases"
          itemNoun="phases"
          minItems={1}
          density="functional"
          controls="row"
          keyOf={(phase) => phase.id}
          labelOf={(phase) => phase.title}
          renderItem={(phase) => (
            <div style={{ display: 'grid', gap: 4 }}>
              <strong>{phase.title}</strong>
              <span>{phase.description}</span>
            </div>
          )}
          canDelete={(phase) => !phase.statutory}
          lockOf={(phase) =>
            phase.statutory
              ? {
                  floor: 'Electrical safety inspection',
                  authority: 'India · CEA Measures for Safety and Electric Supply, 2010',
                  subject: 'Electrical safety inspection',
                  act: 'removed',
                  variant: 'line',
                }
              : null
          }
          onMove={() => undefined}
          onDelete={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'RichText',
    node: (
      <div style={{ width: 720 }}>
        <UI.RichText
          label="Terms and conditions"
          helper="Printed after the payment schedule. Up to three pages."
          value={TERMS}
          minHeight={320}
          maxLength={6000}
          logo
          templates={[
            { id: 'std-residential', name: 'Standard residential — Maharashtra' },
            { id: 'ci-rooftop', name: 'C&I rooftop with PPA' },
          ]}
          saveTemplateLabel="Save as template"
          pageEstimate={
            <UI.PageEstimate
              metrics={UI.measure(TERMS)}
              max={3}
              paper="a4"
              contentWidth={698}
              fontSize={16}
            />
          }
          onChange={() => undefined}
          onCommit={() => undefined}
          onLogoChange={() => undefined}
          onLoadTemplate={() => undefined}
          onSaveAsTemplate={() => undefined}
          onMeasure={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'ScopeNote',
    node: (
      <UI.ScopeNote
        variant="panel"
        holder="Priya Menon (owner)"
        acts={['approve pricing', 'record a payment', 'write off a balance']}
        message="Everything on this screen stays readable — the ledger, the invoices and the export."
        size={13}
        action={
          <UI.Button variant="secondary" size="sm" onClick={() => undefined}>
            Ask Priya to approve
          </UI.Button>
        }
      />
    ),
  },
  {
    name: 'SearchField',
    node: (
      <div style={{ width: 420 }}>
        <UI.SearchField
          value="Ramesh Patil"
          placeholder="Search name, phone or city"
          ariaLabel="Search leads"
          density="functional"
          onChange={() => undefined}
          onClear={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'SegmentedControl',
    node: (
      <div style={{ display: 'grid', gap: 20, width: 520 }}>
        <UI.SegmentedControl
          value="mine"
          onChange={() => undefined}
          options={[
            { value: 'mine', label: 'Mine', count: 8 },
            { value: 'all', label: 'All', count: 214 },
            {
              value: 'unassigned',
              label: 'Unassigned',
              count: 12,
              disabled: true,
              disabledReason: 'Only an owner sees unassigned leads across Pune and Nashik.',
            },
          ]}
        />
        <UI.SegmentedControl
          label="Connection type"
          value="ONGRID"
          onChange={() => undefined}
          options={['ONGRID', 'OFFGRID', 'HYBRID']}
          error="Pick a connection type — the bill of materials depends on it."
        />
      </div>
    ),
  },
  {
    name: 'Select',
    node: (
      <div style={{ width: 420 }}>
        <UI.Select
          label="Assign to"
          value="priya"
          density="functional"
          name="assignee"
          helper="An unassigned lead never gets called."
          options={[
            { value: 'priya', label: 'Priya Sharma' },
            { value: 'amit', label: 'Amit Rane' },
            {
              value: 'rahul',
              label: 'Rahul Patil',
              disabled: true,
              disabledReason: 'On leave until 24 August — reassign after that.',
            },
          ]}
          onChange={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'Sheet',
    node: (
      <div style={{ position: 'relative', height: 460, width: 420, overflow: 'hidden' }}>
        <UI.Sheet
          open
          inset
          size="half"
          density="expressive"
          handle
          showClose
          dismissible
          overline="LEAD"
          title="Ramesh Patil"
          subtitle="Nashik Road, Nashik · 6.4 kWp rooftop · survey-scheduled"
          footer={
            <UI.SheetActions stackBelow={360} onFormChange={() => undefined}>
              <UI.Button variant="secondary" onClick={() => undefined}>
                Keep editing
              </UI.Button>
              <UI.Button onClick={() => undefined}>Schedule survey</UI.Button>
            </UI.SheetActions>
          }
          onClose={() => undefined}
        >
          <p>Quoted ₹3,41,200 on 12 August 2026 · valid until 11 September 2026.</p>
          <p>DISCOM: MSEDCL · sanctioned load 5 kW · expected generation 8,960 kWh a year.</p>
        </UI.Sheet>
      </div>
    ),
  },
  {
    name: 'Slider',
    node: (
      <div style={{ width: 480 }}>
        <UI.Slider
          label="Setback"
          min={0}
          max={3}
          step={0.1}
          value={1.2}
          unit="m"
          steppers
          density="expressive"
          hint="Fire-safety setback from every roof edge."
          provenance={{ tier: 'derived', source: 'From the roof outline traced on 14 Aug 2026' }}
          onInput={() => undefined}
          onCommit={() => undefined}
        />
      </div>
    ),
  },
];
