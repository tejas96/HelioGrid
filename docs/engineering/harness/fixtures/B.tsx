'use client';
import * as UI from '@heliogrid/ui';
import type { Fixture } from '../types';

export const FIXTURES_B: Fixture[] = [
  {
    name: 'Chip',
    node: (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <UI.Chip active onClick={() => undefined}>
          All
        </UI.Chip>
        <UI.Chip onClick={() => undefined}>Official</UI.Chip>
        <UI.Chip dot tone="warning">
          Subsidy pending
        </UI.Chip>
        <UI.Chip dot tone="success" density="functional">
          Net metered
        </UI.Chip>
        <UI.Badge tone="info">Maharashtra</UI.Badge>
        <UI.Badge tone="danger" density="functional">
          Design changed
        </UI.Badge>
      </div>
    ),
  },
  {
    name: 'ChipGroup',
    node: (
      <UI.ChipGroup label="roles" max={3} density="functional" defaultExpanded={false}>
        <UI.Chip density="functional">Surveyor</UI.Chip>
        <UI.Chip density="functional">Designer</UI.Chip>
        <UI.Chip density="functional">Installer</UI.Chip>
        <UI.Chip density="functional">Accounts</UI.Chip>
        <UI.Chip density="functional">Owner</UI.Chip>
      </UI.ChipGroup>
    ),
  },
  {
    name: 'CoachMark',
    node: (
      <div style={{ position: 'relative', width: 640, padding: 24 }}>
        <span id="hg-fixture-coachmark-anchor" style={{ display: 'inline-block' }}>
          <UI.Button variant="secondary" onClick={() => undefined}>
            Confirm the pin
          </UI.Button>
        </span>
        <UI.CoachMark
          open
          autoFocus={false}
          anchor="#hg-fixture-coachmark-anchor"
          step={2}
          total={3}
          title="Confirm the pin"
          body="Shading and the satellite tile are measured from the confirmed pin. Move it before you confirm — not after."
          nextLabel="On to the roof"
          onNext={() => undefined}
          onDismiss={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'CompareGrid',
    node: (
      <UI.CompareGrid
        caption="Compare variants · Kothrud, Pune"
        selectedKey="b"
        onSelect={() => undefined}
        selectLabel="Move to this variant"
        note="Figures refresh when the design is re-run."
        provenance={{ tier: 'derived', source: 'PVGIS · 2024 typical year' }}
        attributes={[
          { key: 'kwp', label: 'System size', unit: 'kWp', better: 'higher' },
          {
            key: 'gen',
            label: 'Annual generation',
            unit: 'kWh',
            better: 'higher',
            provenance: 'estimated',
          },
          { key: 'price', label: 'Price', money: true, strong: true, better: 'lower' },
          { key: 'payback', label: 'Payback', unit: 'years', better: 'lower' },
          { key: 'modules', label: 'Modules' },
          {
            key: 'shade',
            label: 'Shading loss',
            unit: '%',
            better: 'lower',
            gapLabel: 'Not measured on this variant',
          },
        ]}
        options={[
          {
            key: 'a',
            name: 'Variant A',
            subtitle: 'South face only',
            current: true,
            values: {
              kwp: 6.4,
              gen: 9120,
              price: 452471,
              payback: 5.8,
              modules: '12 × 545 W',
              shade: 4,
            },
          },
          {
            key: 'b',
            name: 'Variant B',
            subtitle: 'South + west',
            marks: [
              <UI.Badge key="survey" tone="warning">
                Needs survey re-check
              </UI.Badge>,
            ],
            values: {
              kwp: 8.2,
              gen: 11480,
              price: 561200,
              payback: 6.1,
              modules: '15 × 545 W',
              shade: 7,
            },
          },
          {
            key: 'c',
            name: 'Variant C',
            subtitle: 'Full roof + carport',
            values: {
              kwp: 10.4,
              gen: 14260,
              price: 698400,
              payback: 6.4,
              modules: '19 × 545 W',
            },
          },
        ]}
      />
    ),
  },
  {
    name: 'ComplianceFloor',
    node: (
      <UI.ComplianceFloor
        variant="refusal"
        subject="“Asks to stop”"
        act="removed"
        floor="Statutory opt-out"
        authority="India · DoT commercial-communications rules"
        message="Every other change in this rule set was saved. Put the rule back to save this one too."
        action={
          <UI.Button variant="secondary" size="sm" onClick={() => undefined}>
            Put the rule back
          </UI.Button>
        }
      />
    ),
  },
  {
    name: 'CustomerSurface',
    node: (
      <UI.CustomerSurface brandColor="#C2410C" tenantName="Suryodaya Solar Pvt Ltd">
        <div style={{ padding: 24, display: 'grid', gap: 12 }}>
          <UI.Chip dot tone="accent">
            Suryodaya Solar · Pune
          </UI.Chip>
          <p style={{ color: 'var(--tenant-brand)', fontWeight: 700 }}>
            Your solar proposal · 8.4 kWp · Kothrud, Pune
          </p>
          <UI.Button onClick={() => undefined}>Accept proposal</UI.Button>
        </div>
      </UI.CustomerSurface>
    ),
  },
  {
    name: 'DataTable',
    node: (
      <UI.DataTable
        caption="Pipeline · Pune West · 12 Mar 2026"
        rowKey="id"
        rows={[
          {
            id: 'HG-4812',
            name: 'Rajesh Kumar',
            city: 'Kothrud, Pune',
            kwp: 8.4,
            status: 'design-in-progress',
            amount: 452471,
          },
          {
            id: 'HG-4818',
            name: 'Sunita Iyer',
            city: 'Baner, Pune',
            kwp: 6.4,
            status: 'survey-scheduled',
            amount: 341900,
          },
          {
            id: 'HG-4823',
            name: 'Ramesh Patil',
            city: 'Nashik Road, Nashik',
            kwp: 12.1,
            status: 'approved',
            amount: 812000,
          },
          {
            id: 'HG-4831',
            name: 'Priya Menon',
            city: 'Hinjawadi, Pune',
            kwp: 5.2,
            status: 'installing',
            amount: 298450,
          },
          {
            id: 'HG-4840',
            name: 'Sharma Residency',
            city: 'Wakad, Pune',
            kwp: 18.6,
            status: 'on-hold',
            amount: 1184300,
          },
        ]}
        columns={[
          { key: 'name', label: 'Customer', primary: true, strong: true },
          { key: 'id', label: 'Job ID', mono: true, muted: true },
          { key: 'city', label: 'City', secondary: true, muted: true },
          {
            key: 'kwp',
            label: 'Capacity',
            numeric: true,
            provenance: 'derived',
            render: (row) => `${row.kwp} kWp`,
          },
          {
            key: 'status',
            label: 'Status',
            align: 'center',
            sortable: false,
            render: (row) => <UI.StatusChip status={row.status} density="functional" />,
          },
          {
            key: 'amount',
            label: 'Value',
            numeric: true,
            trailing: true,
            provenance: 'estimated',
          },
        ]}
        selectable
        selected={['HG-4818']}
        onSelectionChange={() => undefined}
        bulkActions={
          <UI.Button size="sm" variant="secondary" onClick={() => undefined}>
            Assign rep
          </UI.Button>
        }
        sortable
        sort={{ key: 'amount', dir: 'desc' }}
        onSortChange={() => undefined}
        onRowClick={() => undefined}
        rowLabel={(row) => `${row.name}, ${row.city}`}
        isRowMuted={(row) => row.status === 'on-hold'}
        rowIssue={(row) =>
          row.id === 'HG-4840'
            ? 'Sanctioned load letter is missing — the DISCOM file cannot be filed.'
            : null
        }
        rowIssueAction={(row) =>
          row.id === 'HG-4840' ? (
            <UI.Button size="sm" variant="ghost" onClick={() => undefined}>
              Upload letter
            </UI.Button>
          ) : null
        }
        rowPending={(row) => (row.id === 'HG-4831' ? { label: 'Assigning to Meera Joshi' } : null)}
        rowProvenance={(row) => (row.id === 'HG-4823' ? { tier: 'reported' } : null)}
        summary="5 records · 1 needs attention · 1 waiting"
        provenance={{ tier: 'derived', source: 'Locked rate card · 12 Aug 2026' }}
        totalRow={{
          label: 'Pipeline value',
          values: { kwp: 50.7, amount: 3089121 },
          amount: 3089121,
          reconcile: { label: 'Forecast board', amount: 3089121 },
          provenance: { tier: 'derived', source: 'Locked rate card · 12 Aug 2026' },
        }}
        page={0}
        pageSize={5}
        rowCount={74}
        onPageChange={() => undefined}
        density="comfortable"
      />
    ),
  },
  {
    name: 'DatePicker',
    node: (
      <div style={{ width: 640 }}>
        <UI.DatePicker
          label="Survey date"
          value="2026-03-18"
          onChange={() => undefined}
          min="2026-03-12"
          max="2026-03-31"
          helper="Surveys run 9 AM – 5 PM, Monday to Saturday."
          markers={{
            '2026-03-14': { tone: 'scheduled', label: 'Survey · Sunita Iyer, Baner' },
            '2026-03-17': { tone: 'holiday', label: 'Gudi Padwa' },
            '2026-03-20': { tone: 'scheduled', label: 'Survey · Ramesh Patil, Nashik' },
            '2026-03-22': { tone: 'holiday', label: 'Sunday' },
          }}
          disabledDates={['2026-03-17', '2026-03-22']}
        />
      </div>
    ),
  },
  {
    name: 'DateSet',
    node: (
      <div style={{ width: 640 }}>
        <UI.DateSet
          label="Holidays observed"
          packName="India market pack"
          entries={[
            { date: '2026-01-26', name: 'Republic Day', origin: 'pack' },
            { date: '2026-03-04', name: 'Holi', origin: 'pack' },
            {
              date: '2026-04-18',
              name: "Founder's day",
              origin: 'tenant',
              addedBy: 'Added by Priya Menon, 12 Feb 2026',
            },
            { date: '2026-11-08', name: 'Diwali', origin: 'pack' },
          ]}
          onAdd={() => undefined}
          onRemove={() => undefined}
          onFormChange={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'Derivation',
    node: (
      <UI.DerivationGroup>
        <UI.Derivation
          label="Annual generation · 8.2 kWp"
          variant="block"
          defaultOpen
          onToggle={() => undefined}
          parts={[
            {
              kind: 'formula',
              text: '1,412 kWh/kWp × 8.2 kWp × 0.84 system losses = 9,725 kWh a year.',
            },
            {
              kind: 'assumption',
              text: 'Shading is modelled from the traced Kothrud roof only; no trees are surveyed.',
            },
            {
              kind: 'boundary',
              text: 'The model stops at the meter. Self-consumption is not estimated here.',
            },
            {
              kind: 'exclusion',
              text: 'Excludes future load growth, battery cycling and DISCOM outage hours.',
            },
          ]}
        />
        <UI.Derivation
          label="Mounting rail · line 12"
          summary="How ₹68,400 is worked out"
          onToggle={() => undefined}
          parts={[
            {
              kind: 'formula',
              text: '38 m of rail × ₹1,800 per m = ₹68,400, at the locked rate card of 12 Aug 2026.',
            },
            { kind: 'note', text: 'Ballast blocks are quoted separately on line 13.' },
          ]}
        />
      </UI.DerivationGroup>
    ),
  },
  {
    name: 'DetailPanel',
    node: (
      <div style={{ position: 'relative', width: 640, height: 420, overflow: 'hidden' }}>
        <UI.DetailPanel
          open
          inset
          modal={false}
          width={360}
          onClose={() => undefined}
          overline="PIPELINE"
          title="Rajesh Kumar"
          subtitle="HG-4812 · Kothrud, Pune"
          meta={<UI.StatusChip status="design-in-progress" />}
          footer={
            <UI.SheetActions>
              <UI.Button variant="secondary" onClick={() => undefined}>
                Edit design
              </UI.Button>
              <UI.Button onClick={() => undefined}>Send over WhatsApp</UI.Button>
            </UI.SheetActions>
          }
        >
          <p>8.4 kWp rooftop · 15 × 545 W modules · ₹4,52,471 indicative.</p>
          <p>Survey booked with Sanjay Pawar for 18 Mar 2026.</p>
        </UI.DetailPanel>
      </div>
    ),
  },
  {
    name: 'Disclosure',
    node: (
      <UI.Disclosure
        kind="indicative-basis"
        detail="8.4 kWp and ₹4,52,471 are both indicative. Sanjay Pawar will confirm both after the design."
      />
    ),
  },
  {
    name: 'DocumentPreview',
    node: (
      <UI.DocumentPreview
        brandColor="#C2410C"
        companyName="Suryodaya Solar Pvt Ltd"
        logoLabel="Suryodaya"
        taxId="27AABCS1429P1ZQ"
        address="12 Karve Road, Kothrud, Pune 411038"
        phone="+91 98220 41188"
        letterhead={{
          tagline: 'Rooftop solar since 2011',
          lines: ['CIN U40106PN2011PTC141298', 'hello@suryodayasolar.in'],
          footerNote: 'Thank you for choosing Suryodaya Solar.',
        }}
        customerName="Rajesh Kumar"
        customerMeta="Kothrud, Pune · 8.4 kWp rooftop"
        docTitle="Proposal"
        docNumber="HG-4812-P1"
        docDate="2026-08-16"
        parts={['cover', 'items', 'sections', 'tranches', 'terms']}
        lineItems={[
          ['15 × 545 W mono PERC modules', 245700],
          ['8 kW string inverter', 78400],
          ['Ballasted mounting frame · 38 m rail', 68400],
          ['AC/DC boxes, cabling and earthing', 41200],
          ['Installation and commissioning', 18771],
        ]}
        subsidyAmount={78000}
        subsidyLabel="PM Surya Ghar subsidy"
        sections={[
          { label: 'Scope of work', meta: '2 pages' },
          { label: 'Generation estimate', meta: 'PVGIS · 2024 typical year' },
          { label: 'Warranty schedule' },
          { label: 'Site photographs', included: false },
        ]}
        tranches={[
          { label: 'Advance', when: 'On signing', share: '30%', amount: 135741 },
          { label: 'Before dispatch', when: 'On material readiness', share: '50%', amount: 226236 },
          {
            label: 'On commissioning',
            when: 'After net-meter approval',
            share: '20%',
            amount: 90494,
          },
        ]}
        terms={{
          version: 1,
          blocks: [
            {
              type: 'h',
              spans: [{ text: 'Terms and conditions' }],
            },
            {
              type: 'p',
              spans: [
                { text: 'Prices hold for 30 days from ' },
                { text: '16 Aug 2026', b: true },
                { text: '. GST is charged at the rate in force on the date of dispatch.' },
              ],
            },
            {
              type: 'ul',
              items: [
                [
                  {
                    text: 'Net-meter application is filed by Suryodaya Solar on the customer’s behalf.',
                  },
                ],
                [{ text: 'Scaffolding beyond the second floor is quoted separately.' }],
              ],
            },
          ],
        }}
        width={480}
        caption="Preview · what the customer receives as a PDF"
      />
    ),
  },
  {
    name: 'DrawingSheet',
    node: (
      <UI.DrawingSheetGroup
        scale="1:100"
        paper="a4"
        titleBlock={{
          project: 'Kumar residence · Kothrud, Pune',
          client: 'Rajesh Kumar',
          revision: 'Rev C',
          issueDate: '2026-08-16',
          drawnBy: 'Sanjay Pawar',
          checkedBy: 'Meera Joshi',
        }}
      >
        <UI.DrawingSheet
          drawingLabel="Roof layout"
          titleBlock={{ drawingTitle: 'Roof layout', drawingNumber: 'HG-4812-01' }}
          north
          drawing={
            <div
              style={{
                height: 240,
                border: '1px solid currentColor',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              15 × 545 W modules · south face
            </div>
          }
          symbols={[
            { code: 'PV', label: '545 W mono module', shape: 'square' },
            { code: 'MMS', label: 'Ballasted mounting frame', shape: 'square' },
            { code: 'INV', label: '8 kW string inverter', shape: 'circle' },
          ]}
        />
      </UI.DrawingSheetGroup>
    ),
  },
  {
    name: 'Dropzone',
    node: (
      <div style={{ width: 640 }}>
        <UI.Dropzone
          label="Add roof photos"
          hint="At least 4: full roof, shading, meter, sanctioned load board"
          accept="image/*"
          capture="environment"
          multiple
          density="functional"
          state="uploading"
          progress={62}
          files={[
            { id: 'p1', name: 'roof-south-face.jpg', progress: 100 },
            { id: 'p2', name: 'shading-northwest.jpg', progress: 62 },
            { id: 'p3', name: 'meter-board.jpg', progress: 0 },
          ]}
          onFiles={() => undefined}
          onRemove={() => undefined}
          onRetry={() => undefined}
          heldOnDevice
          heldCount={11}
          heldNoun="photo"
          maxSizeMB={10}
        />
      </div>
    ),
  },
  {
    name: 'EditorSurface',
    node: (
      <div style={{ position: 'relative', width: 640, height: 420, overflow: 'hidden' }}>
        <UI.EditorSurface
          open
          inset
          modal={false}
          onClose={() => undefined}
          overline="PIPELINE"
          title="Assign lead"
          subtitle="Sharma Residency · HG-4840"
          width={360}
          footer={
            <UI.SheetActions>
              <UI.Button variant="ghost" onClick={() => undefined}>
                Cancel
              </UI.Button>
              <UI.Button onClick={() => undefined}>Assign</UI.Button>
            </UI.SheetActions>
          }
        >
          <p>Wakad, Pune · 18.6 kWp · ₹11,84,300 indicative.</p>
          <p>Currently unassigned since 09 Mar 2026.</p>
        </UI.EditorSurface>
      </div>
    ),
  },
  {
    name: 'EmptyState',
    node: (
      <UI.EmptyState
        title="No leads yet"
        description="Assigned leads appear here. Add your first to start quoting."
        action={<UI.Button onClick={() => undefined}>Add lead</UI.Button>}
      />
    ),
  },
  {
    name: 'FieldModeToggle',
    node: (
      <div style={{ width: 640 }}>
        <UI.FieldModeToggle
          label="Sunlight mode"
          hint="Turn this on when screen glare makes readings hard to read on a Pune rooftop."
        />
      </div>
    ),
  },
  {
    name: 'FieldOverride',
    node: (
      <div style={{ display: 'grid', gap: 16, width: 640 }}>
        <UI.FieldOverride
          state="overridden"
          fieldName="System size"
          autoValue="8.2 kWp"
          autoSource="platform"
          onReset={() => undefined}
        />
        <UI.FieldOverride
          state="stale"
          fieldName="Module count"
          autoValue="16"
          newValue="19"
          onReset={() => undefined}
          onTake={() => undefined}
        />
      </div>
    ),
  },
];
