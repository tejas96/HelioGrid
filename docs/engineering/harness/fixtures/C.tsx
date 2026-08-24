'use client';
import * as UI from '@heliogrid/ui';
import type { Fixture } from '../types';

/**
 * Render fixtures, chunk C. Fixed, hand-written data — no `Date.now()`, no `new Date()`,
 * no `Math.random()` — so two runs of the render check draw the same pixels.
 */

/** A 320×180 rooftop-array SVG, inlined so `Image` can reach the "present" state with no network. */
const ROOF_PHOTO =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMzIwIDE4MCI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNjZmUzZjUiLz48cGF0aCBkPSJNMCAxMjggTDE2MCA2MCBMMzIwIDEyOCBMMzIwIDE4MCBMMCAxODAgWiIgZmlsbD0iIzhhNmE1MiIvPjxnIGZpbGw9IiMxZjM1NTAiPjxyZWN0IHg9IjcwIiB5PSIxMTYiIHdpZHRoPSI1NiIgaGVpZ2h0PSIzNCIgcng9IjMiLz48cmVjdCB4PSIxMzQiIHk9IjExNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjM0IiByeD0iMyIvPjxyZWN0IHg9IjE5OCIgeT0iMTE2IiB3aWR0aD0iNTYiIGhlaWdodD0iMzQiIHJ4PSIzIi8+PC9nPjxjaXJjbGUgY3g9IjI3MiIgY3k9IjQwIiByPSIyMCIgZmlsbD0iI2Y1YzQ1MSIvPjwvc3ZnPg==';

export const FIXTURES_C: Fixture[] = [
  {
    name: 'FilterBar',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UI.FilterBar.ScopeToggle
            options={[
              { value: 'mine', label: 'My leads' },
              { value: 'all', label: 'All leads' },
            ]}
            value="mine"
            onChange={() => undefined}
          />
          <div style={{ flex: 1 }} />
          <UI.FilterBar.SortPills
            label="Sort by"
            options={[
              { value: 'due', label: 'Next due' },
              { value: 'value', label: 'Quote value' },
              { value: 'new', label: 'Newest' },
            ]}
            value="due"
            onChange={() => undefined}
          />
          <UI.FilterBar.FiltersButton count={3} onClick={() => undefined} />
        </div>
        <UI.FilterBar.FilterChips
          label="Stage"
          options={[
            { value: 'all', label: 'All' },
            { value: 'lead', label: 'Lead' },
            { value: 'survey-scheduled', label: 'Survey scheduled' },
            { value: 'design-in-progress', label: 'Design in progress' },
            { value: 'approved', label: 'Approved' },
            { value: 'installing', label: 'Installing' },
            { value: 'commissioned', label: 'Commissioned' },
            { value: 'on-hold', label: 'On hold' },
          ]}
          value="design-in-progress"
          counts={{
            all: 128,
            lead: 41,
            'survey-scheduled': 22,
            'design-in-progress': 18,
            approved: 14,
            installing: 19,
            commissioned: 11,
            'on-hold': 3,
          }}
          onChange={() => undefined}
        />
        <UI.FilterBar.FacetChips
          label="Certification scheme"
          options={['BIS', 'ALMM', 'IEC 61215', 'IEC 61730']}
          values={['ALMM', 'BIS']}
          counts={{ BIS: 812, ALMM: 640, 'IEC 61215': 511, 'IEC 61730': 498 }}
          onChange={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'FilterPanel',
    node: (
      <div style={{ position: 'relative', width: 720, height: 560, overflow: 'hidden' }}>
        <UI.FilterPanel
          open
          inset
          title="Filter components"
          dimensions={[
            {
              key: 'source',
              kind: 'one-of',
              label: 'Source',
              allValue: 'any',
              options: [
                { value: 'any', label: 'All sources' },
                { value: 'platform', label: 'Platform catalogue' },
                { value: 'own', label: 'Own SKUs' },
              ],
              counts: { any: 1508, platform: 1204, own: 304 },
            },
            {
              key: 'kind',
              kind: 'facet',
              label: 'Component kind',
              options: ['Module', 'Inverter', 'Mounting', 'Cable', 'Meter'],
              counts: { Module: 812, Inverter: 143, Mounting: 288, Cable: 191, Meter: 74 },
            },
            {
              key: 'watt',
              kind: 'range',
              label: 'Wattage',
              min: 100,
              max: 800,
              step: 5,
              unit: 'W',
              hint: 'DC nameplate per module.',
            },
            {
              key: 'scheme',
              kind: 'facet',
              label: 'Certification scheme',
              options: ['BIS', 'ALMM', 'IEC 61215', 'IEC 61730'],
              counts: { BIS: 812, ALMM: 640 },
            },
            {
              key: 'preferred',
              kind: 'flag',
              label: 'Preferred suppliers',
              optionLabel: 'Suryodaya Solar approved suppliers only',
            },
          ]}
          value={{
            source: 'platform',
            kind: ['Module', 'Inverter'],
            watt: [400, 600],
            scheme: ['ALMM'],
            preferred: true,
          }}
          onChange={() => undefined}
          onClear={() => undefined}
          onClose={() => undefined}
          resultCount={24}
          resultNoun="components"
        />
      </div>
    ),
  },
  {
    name: 'FindingList',
    node: (
      <div style={{ width: 640 }}>
        <UI.FindingList
          actionLabel="share the proposal"
          verdict
          readyMode="listed"
          jumpLabel="Open the step"
          note="The gate re-runs every time you press Generate — nothing here is remembered."
          findings={[
            {
              id: 'strings',
              status: 'blocking',
              family: '(c) Stringing',
              title: 'Three panels are not on a string',
              meaning:
                'Panels 18, 19 and 24 are drawn on the Pune roof but not wired to an MPPT, so the 8.4 kWp system size is wrong.',
              step: 'step 4 — Panels & strings',
              onJump: () => undefined,
              fix: { label: 'Auto-string now', onFix: () => undefined },
            },
            {
              id: 'mppt',
              status: 'blocking',
              family: '(c) Stringing',
              title: 'MPPT 2 is over capacity',
              meaning: 'MPPT 2 carries 6.1 kWp against a 5.0 kWp limit on the Sungrow SG5.0RT.',
              step: 'step 4 — Panels & strings',
              onJump: () => undefined,
              pending: { label: 'Re-balancing strings', slowNote: 'Taking longer than usual.' },
            },
            {
              id: 'price',
              status: 'attention',
              family: 'below-cost warning',
              title: 'Price is below cost',
              meaning:
                'The payable of ₹4,55,480 is ₹18,200 under the bill of materials for Ramesh Patil’s roof.',
              step: 'step 8 — Price',
              onJump: () => undefined,
            },
            {
              id: 'shadow',
              status: 'attention',
              family: '(e) Shading',
              title: 'Shading study is from the old roof outline',
              meaning: 'The parapet moved on 14 Mar 2026 and the solar-access run predates it.',
              step: 'step 5 — Shading',
              onJump: () => undefined,
              fix: { label: 'Re-run solar access', onFix: () => undefined },
            },
            {
              id: 'addr',
              status: 'ready',
              family: '(a) Site',
              title: 'Address confirmed',
              meaning: 'Plot 12, Baner, Pune 411045 — pin confirmed on 12 Mar 2026.',
            },
            {
              id: 'meter',
              status: 'ready',
              family: '(b) Metering',
              title: 'Net-metering application on file',
              meaning: 'MSEDCL application NM-2026-88431, submitted 15 Mar 2026.',
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'IconButton',
    node: (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, width: 480 }}>
        <UI.IconButton label="Close the design" onClick={() => undefined}>
          ×
        </UI.IconButton>
        <UI.IconButton label="Search leads" variant="dark" size={44} onClick={() => undefined}>
          ⌕
        </UI.IconButton>
        <UI.IconButton label="Share the proposal" variant="ghost" onClick={() => undefined}>
          ↗
        </UI.IconButton>
        <UI.IconButton
          label="Delete survey photo"
          disabled
          disabledReason="Survey photos stay for 90 days once a design is signed off."
        >
          🗑
        </UI.IconButton>
      </div>
    ),
  },
  {
    name: 'Image',
    node: (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <UI.Image
          src={ROOF_PHOTO}
          alt="Ramesh Patil residence, south-facing roof in Baner, Pune"
          status="present"
          ratio="wide"
          width={360}
          caption="Ramesh Patil residence · 8.4 kWp proposed"
          credit="Priya Sharma"
          meta="12 Mar 2026, 10:24"
          referenceOnly
          referenceNote="Survey photographs are reference only and are never measured from."
          onClick={() => undefined}
        />
        <UI.Image
          alt="Meter board at the Nashik site"
          status="missing"
          missingReason="not-captured"
          ratio="photo"
          width={220}
          caption="Meter board"
          missingLabel="Not captured"
          missingDetail="The surveyor did not photograph the meter board on 12 Mar 2026."
        />
      </div>
    ),
  },
  {
    name: 'Input',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 420 }}>
        <UI.Input
          label="Customer name"
          value="Ramesh Patil"
          placeholder="e.g. Rajesh Kumar"
          helper="Appears on the proposal and the invoice."
          onChange={() => undefined}
        />
        <UI.Input
          label="System size"
          value="8.4"
          mono
          density="functional"
          trailing={<span>kWp</span>}
          helper="DC capacity at standard test conditions."
          onChange={() => undefined}
        />
        <UI.Input
          label="Company name on the proposal"
          value="Suryodaya Solar Pvt Ltd"
          onChange={() => undefined}
          attribution={{
            level: 'inherited',
            layerName: 'Workspace default',
            source: 'Tenant settings',
            fieldName: 'Company name',
            onOverride: () => undefined,
          }}
        />
        <UI.Input
          label="GSTIN"
          value="27AABCS1429B1Z"
          mono
          error="Enter a valid 15-character GSTIN."
          onChange={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'JobTray',
    node: (
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: 520 }}>
        <UI.JobTray
          open
          label="Background work"
          onOpenChange={() => undefined}
          onClear={() => undefined}
          jobs={[
            {
              id: 'imp-88',
              label: 'Importing leads · Nashik list.csv',
              value: 42,
              count: { done: 168, total: 400 },
              unit: 'rows',
              stage: 'Matching against existing customers',
              state: 'running',
              leaveNote: 'You can leave this screen; it keeps running.',
              onCancel: () => undefined,
              cancelEffect: 'stops-watching',
            },
            {
              id: 'gen-41',
              label: 'Generating proposal · Ramesh Patil, 8.4 kWp',
              value: null,
              stage: 'Rendering the drawing sheet',
              state: 'running',
            },
            {
              id: 'imp-87',
              label: 'Importing leads · Pune list.csv',
              state: 'done',
              message: '382 rows added, 18 rejected.',
              destination: (
                <UI.Button size="sm" variant="ghost" onClick={() => undefined}>
                  Open the failure report
                </UI.Button>
              ),
            },
            {
              id: 'exp-12',
              label: 'Exporting commissioned sites · Q1 FY26',
              state: 'failed',
              message: 'The export stopped at row 214 — the MSEDCL reference was blank.',
              onRetry: () => undefined,
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Kanban',
    node: (
      <div style={{ width: 960 }}>
        <UI.Kanban
          onCardClick={() => undefined}
          onMove={() => undefined}
          onFormChange={() => undefined}
          onStackedColumnChange={() => undefined}
          stageFilterLabel="Stage"
          columns={[
            {
              key: 'lead',
              label: 'Lead',
              status: 'lead',
              items: [
                {
                  id: 'HG-4801',
                  title: 'Joshi bungalow',
                  meta: 'Pune · 5.4 kWp',
                  value: '₹3,20,000',
                  owner: 'Amit Rane',
                  provenance: 'estimated',
                  standing: 'provisional',
                },
                {
                  id: 'HG-4802',
                  title: 'Mehta duplex',
                  meta: 'Nashik · 6.0 kWp',
                  value: '₹3,64,000',
                  owner: 'Priya Sharma',
                  provenance: 'estimated',
                },
              ],
            },
            {
              key: 'survey-scheduled',
              label: 'Survey scheduled',
              status: 'survey-scheduled',
              limit: 4,
              items: [
                {
                  id: 'HG-4810',
                  title: 'Kulkarni farmhouse',
                  meta: 'Satara · 10.2 kWp · 22 Mar 2026',
                  value: '₹6,10,000',
                  owner: 'Priya Sharma',
                  provenance: { tier: 'derived', source: 'Signed quote' },
                  standing: 'confirmed',
                },
              ],
            },
            {
              key: 'design-in-progress',
              label: 'Design in progress',
              status: 'design-in-progress',
              items: [
                {
                  id: 'HG-4812',
                  title: 'Ramesh Patil residence',
                  meta: 'Baner, Pune · 8.4 kWp',
                  value: '₹5,12,000',
                  owner: 'Amit Rane',
                  provenance: { tier: 'derived', source: 'Locked rate card · 12 Aug 2026' },
                  standing: 'provisional',
                },
              ],
            },
            {
              key: 'approved',
              label: 'Approved',
              status: 'approved',
              items: [],
              emptyLabel: 'Nothing approved this week',
            },
            {
              key: 'installing',
              label: 'Installing',
              status: 'installing',
              items: [
                {
                  id: 'HG-4790',
                  title: 'Deshmukh Textiles',
                  meta: 'Bhiwandi · 110 kWp',
                  value: '₹58,40,000',
                  owner: 'Rahul Patil',
                  provenance: 'derived',
                  standing: 'confirmed',
                },
              ],
            },
            {
              key: 'commissioned',
              label: 'Commissioned',
              status: 'commissioned',
              items: [
                {
                  id: 'HG-4712',
                  title: 'Nashik Agro Cold Store',
                  meta: 'Nashik · 46 kWp · 1 Feb 2026',
                  value: '₹24,80,000',
                  owner: 'Sneha Kulkarni',
                  provenance: 'measured',
                  standing: 'confirmed',
                },
              ],
            },
          ]}
          cardPending={(item) => (item.id === 'HG-4812' ? { label: 'Moving to Approved' } : null)}
        />
      </div>
    ),
  },
  {
    name: 'LanguageSwitcher',
    node: (
      <div style={{ width: 640 }}>
        <UI.LanguageSwitcher
          label="Agent language"
          value="mr"
          onChange={() => undefined}
          sections={8}
          sectionNoun="sections"
          languages={[
            { code: 'hi', label: 'Hindi', written: 8, primary: true },
            { code: 'en', label: 'English', written: 8 },
            { code: 'mr', label: 'Marathi', written: 5 },
            { code: 'gu', label: 'Gujarati', written: 2 },
            { code: 'ta', label: 'Tamil', written: 0 },
            { code: 'bn', label: 'Bengali', written: 0 },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'ListRow',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', width: 560 }}>
        <UI.ListRow
          icon={<span aria-hidden="true">☀</span>}
          iconColor="var(--warning-text)"
          title="Ramesh Patil residence"
          subtitle="8.4 kWp · Baner, Pune · design in progress"
          provenance={{ tier: 'derived', source: 'Locked rate card · 12 Aug 2026' }}
          trailing={<UI.StatusChip status="design-in-progress" density="functional" />}
          onClick={() => undefined}
        />
        <UI.ListRow
          avatar={<UI.Avatar name="Rajesh Kumar" size={40} />}
          title="Rajesh Kumar"
          subtitle="Lead · Nagpur · ₹6,20,000"
          provenance={{ tier: 'estimated', source: 'Rooftop area from satellite' }}
          trailing={<UI.StatusChip status="lead" density="functional" />}
          onClick={() => undefined}
        />
        <UI.ListRow
          avatar={<UI.Avatar name="Sunita Deshpande" size={40} />}
          title="Sunita Deshpande"
          gap={{
            gap: 'No city yet',
            onFill: () => undefined,
            fillLabel: 'Add city',
            fieldName: 'City',
          }}
          pending={{ label: 'Assigning to Priya Sharma' }}
          trailing={<UI.StatusChip status="new-lead" density="functional" />}
          onClick={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'MapSurface',
    node: (
      <div style={{ width: 640 }}>
        <UI.MapSurface
          height={360}
          controls
          showZoomLevel
          zoom={18}
          minZoom={12}
          maxZoom={20}
          firstPinZoom={20}
          onZoomChange={() => undefined}
          onRecenter={() => undefined}
          placement={{ input: 'auto', pill: 'Drag map to adjust' }}
          onPlace={() => undefined}
          onPinMove={() => undefined}
          pin={{ x: 48, y: 52, state: 'pending', placed: true }}
          imagery={{ capturedAt: '2026-03-12', source: 'Bhuvan', pinned: true }}
          attribution="Imagery © Bhuvan / NRSC"
          markers={[
            { id: 'm1', x: 34, y: 42, live: true, label: 'Priya Sharma' },
            { id: 'm2', x: 61, y: 58, lastSeen: '10:42', label: 'Rahul Patil' },
            { id: 'm3', x: 48, y: 71, tone: 'success', label: 'Ramesh Patil residence' },
          ]}
          geofences={[{ id: 'g1', x: 48, y: 71, r: 9, label: 'Site geofence' }]}
          route={[
            { x: 22, y: 30 },
            { x: 34, y: 42 },
            { x: 48, y: 52 },
            { x: 61, y: 58 },
            { x: 74, y: 64 },
          ]}
          accuracy={{ x: 48, y: 52, r: 6 }}
          overlay={
            <UI.Button size="sm" onClick={() => undefined}>
              Confirm location
            </UI.Button>
          }
        />
      </div>
    ),
  },
  {
    name: 'MarketProvider',
    node: (
      <div style={{ display: 'flex', gap: 16, width: 640 }}>
        <UI.MarketProvider>
          <UI.StatCard label="Pipeline value · India pack" value={452471} money />
        </UI.MarketProvider>
        <UI.MarketProvider
          pack={{
            locale: 'en-KE',
            currency: 'KES',
            currencySymbol: 'KSh',
            currencyFractionDigits: 0,
            taxIdLabel: 'KRA PIN',
          }}
        >
          <UI.StatCard label="Pipeline value · Kenya pack" value={452471} money />
        </UI.MarketProvider>
      </div>
    ),
  },
  {
    name: 'Menu',
    node: (
      <div style={{ position: 'relative', width: 320, height: 120 }}>
        <UI.Menu
          label="Design actions"
          align="start"
          trigger={
            <UI.Button variant="secondary" size="sm">
              Design actions
            </UI.Button>
          }
          onSelect={() => undefined}
          items={[
            { key: 'open', label: 'Open design', onSelect: () => undefined },
            { key: 'dup', label: 'Duplicate', meta: '⌘D', onSelect: () => undefined },
            { key: 'share', label: 'Copy proposal link', onSelect: () => undefined },
            {
              key: 'merge',
              label: 'Merge into…',
              disabled: true,
              disabledReason: 'Pick a second lead first.',
            },
            { separator: true },
            {
              key: 'delete',
              label: 'Delete design',
              destructive: true,
              onSelect: () => undefined,
            },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Modal',
    node: (
      <div style={{ position: 'relative', width: 720, height: 420, overflow: 'hidden' }}>
        <UI.Modal
          open
          inset
          tone="danger"
          size="sm"
          dismissible={false}
          overline="HG-4812"
          title="Cancel this job?"
          description="Ramesh Patil residence moves to Lost. The 8.4 kWp design and the ₹5,12,000 quote stay on file for 90 days."
          onClose={() => undefined}
          footer={
            <UI.ModalActions>
              <UI.Button variant="secondary" onClick={() => undefined}>
                Keep job
              </UI.Button>
              <UI.Button variant="destructive" onClick={() => undefined}>
                Cancel job
              </UI.Button>
            </UI.ModalActions>
          }
        />
      </div>
    ),
  },
  {
    name: 'MoneySummary',
    node: (
      <div style={{ width: 480 }}>
        <UI.MoneySummary
          overline="Proposal HG-4812 · Ramesh Patil"
          payableLabel="Payable"
          surface="screen"
          note="Payable in three tranches — see the payment schedule."
          provenance={{ tier: 'derived', source: 'Locked rate card · 12 Aug 2026' }}
          lines={[
            { key: 'cost', label: 'System cost · 8.4 kWp', amount: 452471 },
            { key: 'battery', label: '5 kWh LFP battery', amount: 214000 },
            { key: 'gst', label: 'GST 13.8%', amount: 92009 },
            {
              key: 'subsidy',
              label: 'PM Surya Ghar subsidy',
              kind: 'deduct',
              amount: 78000,
              note: 'Credited by the National Portal, not by us.',
            },
            { key: 'discount', label: 'Festive discount', kind: 'deduct', amount: 25000 },
          ]}
          reconcile={{ label: 'Bill of materials', amount: 452471, against: 'cost' }}
        />
      </div>
    ),
  },
  {
    name: 'NamedGap',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 420 }}>
        <UI.NamedGap scale="headline" gap="No survey yet" />
        <UI.NamedGap
          scale="field"
          gap="No city yet"
          onFill={() => undefined}
          fillLabel="Add city"
          fieldName="City"
        />
        <UI.NamedGap scale="field" gap="No schedule yet — nothing is due until one is agreed." />
        <UI.NamedGap scale="cell" align="right" gap="No reading yet" />
      </div>
    ),
  },
  {
    name: 'NextAction',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 480 }}>
        <UI.NextAction
          label="Follow up Deshmukh Textiles"
          meta="3 days overdue"
          tone="overdue"
          origin={{
            actorClass: 'system',
            verb: 'Resurfaced by',
            rule: 'Snooze expired 16 Aug 2026',
          }}
        />
        <UI.NextAction
          label="Qualify — warm"
          meta="Kothrud, Pune"
          tone="due"
          origin={{ actorClass: 'person', verb: 'Corrected by', actor: 'Priya Sharma' }}
          correction={{
            autoValue: 'Cold',
            autoSource: 'HelioGrid agent',
            autoLabel: 'the agent read it as',
            fieldName: 'lead temperature',
            onReset: () => undefined,
          }}
        />
        <UI.RecordCard
          name="Priya Sharma"
          avatarTone="var(--accent)"
          density="functional"
          chip={<UI.StatusChip status="proposal-sent" density="functional" />}
          meta={['Nashik', '8.2 kWp', '₹4,52,000']}
          provenance={{ tier: 'assumed', standing: 'reported', source: 'Recorded by the rep' }}
          pending={{ label: 'Recording the payment' }}
          action={
            <UI.NextAction
              tone="soon"
              label="Collect tranche 2"
              meta="due 22 Mar 2026"
              size={12}
              origin={{ actorClass: 'agent', rule: 'No contact in 3 days' }}
            />
          }
          onClick={() => undefined}
        />
      </div>
    ),
  },
  {
    name: 'NoConnection',
    node: (
      <div style={{ position: 'relative', width: 640, height: 480, overflow: 'hidden' }}>
        <UI.NoConnection
          inset
          animate={false}
          autoFocusRetry={false}
          status="failed"
          title="No connection"
          message="HelioGrid cannot reach anything right now. Move to where the signal is better and try again."
          failedMessage="Still nothing. The signal on this roof in Bhiwandi may be too weak."
          onRetry={() => undefined}
        >
          <UI.Button variant="secondary" onClick={() => undefined}>
            Open today’s schedule
          </UI.Button>
        </UI.NoConnection>
      </div>
    ),
  },
  {
    name: 'NumberField',
    node: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 420 }}>
        <UI.NumberField
          label="Eave height"
          value={4.2}
          unit="m"
          min={2}
          max={30}
          step={0.1}
          precision={1}
          hint="Measured from ground level to the gutter."
          onCommit={() => undefined}
          provenance={{ tier: 'measured', source: 'Site survey · 12 Mar 2026' }}
        />
        <UI.NumberField
          label="Amount received"
          value={182000}
          currency
          min={1}
          max={512000}
          outOfRange="refuse"
          refusalPath="A wrong amount is not edited and not typed negative — record what was received, then reverse it."
          hint="Defaulted to the tranche’s outstanding — ₹1,82,000. Always editable."
          onCommit={() => undefined}
          provenance={{
            standing: 'reported',
            tier: 'assumed',
            source: 'Recorded by Priya Sharma',
          }}
        />
        <UI.NumberField
          label="Battery capacity"
          value={0.4}
          min={1}
          max={100}
          unit="kWh"
          density="functional"
          error="Below the 1 kWh minimum a battery quote can be built from."
          onCommit={() => undefined}
          override={{
            autoValue: '5 kWh',
            autoSource: 'the sizing engine',
            fieldName: 'Battery capacity',
            onReset: () => undefined,
          }}
        />
      </div>
    ),
  },
];
