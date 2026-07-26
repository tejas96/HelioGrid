'use client';
import { Avatar, IconButton, ListRow, StatCard, StatusChip } from '@heliogrid/ui';
import {
  ALL_STATUSES,
  ChevronRightIcon,
  Demo,
  FileTextIcon,
  HINDI_STATUS,
  PhoneIcon,
  Section,
  SunIcon,
} from './support';

export function RowsSections() {
  return (
    <>
      <Section title="ListRow — icon · avatar · trailing · densities · interactive">
        <div className="ds-demo-stack">
          <Demo label="icon + subtitle + trailing StatusChip">
            <ListRow
              icon={<SunIcon />}
              title="Aarav Patil"
              subtitle="Baner, Pune · 3 BHK rooftop"
              trailing={<StatusChip status="survey-scheduled" density="functional" />}
            />
          </Demo>
          <Demo label="iconColor success + trailing amount">
            <ListRow
              icon={<FileTextIcon />}
              iconColor="var(--success)"
              title="Proposal PRO-2026-0042"
              subtitle="Sent 2 days ago"
              trailing={<span className="ds-num">₹4,52,471</span>}
            />
          </Demo>
          <Demo label="avatar leading (wins over icon)">
            <ListRow
              avatar={<Avatar name="Sneha Kulkarni" size={40} />}
              icon={<SunIcon />}
              title="Sneha Kulkarni"
              subtitle="Surveyor · 4 visits today"
              trailing={
                <IconButton label="Call Sneha Kulkarni" variant="ghost" size={32}>
                  <PhoneIcon size={16} />
                </IconButton>
              }
            />
          </Demo>
          <Demo label="functional density + interactive (live)">
            <ListRow
              density="functional"
              icon={<SunIcon size={16} />}
              title="Rohan Deshmukh"
              subtitle="5.2 kWp · design in progress"
              trailing={<ChevronRightIcon size={16} />}
              onClick={() => {}}
            />
          </Demo>
          <Demo label="title only (no subtitle, no leading)">
            <ListRow title="Unassigned lead" trailing={<ChevronRightIcon size={16} />} />
          </Demo>
          <Demo hindi label="Hindi row">
            <ListRow
              icon={<SunIcon />}
              title="आरव पाटील"
              subtitle="बाणेर, पुणे · 5.2 kWp प्रस्ताव भेजा गया"
              trailing={
                <StatusChip status="approved" label={HINDI_STATUS.approved} density="functional" />
              }
            />
          </Demo>
        </div>
      </Section>

      <Section title="StatCard — delta up/down · unit · bare">
        <div className="ds-demo-grid">
          <Demo label="delta up + unit">
            <StatCard
              label="Generation this month"
              value="1,284"
              unit="kWh"
              delta="+12%"
              deltaDir="up"
            />
          </Demo>
          <Demo label="delta down + unit">
            <StatCard label="Open leads" value="42" unit="leads" delta="-8%" deltaDir="down" />
          </Demo>
          <Demo label="value only (no delta, no unit)">
            <StatCard label="Pipeline value" value="₹92L" />
          </Demo>
          <Demo hindi label="Hindi label + unit kept in Latin">
            <StatCard
              label="इस माह का उत्पादन"
              value="1,284"
              unit="kWh"
              delta="+12%"
              deltaDir="up"
            />
          </Demo>
        </div>
      </Section>

      <Section title="StatusChip — all 7 statuses × both densities">
        <div className="ds-row">
          {ALL_STATUSES.map((status) => (
            <Demo key={status} label={status}>
              <StatusChip status={status} />
            </Demo>
          ))}
        </div>
        <div className="ds-row">
          {ALL_STATUSES.map((status) => (
            <Demo key={status} label={`${status} functional`}>
              <StatusChip status={status} density="functional" />
            </Demo>
          ))}
        </div>
        <div className="ds-row" lang="hi">
          {ALL_STATUSES.map((status) => (
            <Demo hindi key={status} label={`${status} Hindi`}>
              <StatusChip status={status} label={HINDI_STATUS[status]} />
            </Demo>
          ))}
        </div>
      </Section>
    </>
  );
}
