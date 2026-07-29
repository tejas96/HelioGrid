'use client';
import { Avatar, AvatarGroup, Badge, Card, Chip, IconCircle } from '@heliogrid/ui';
import { useState } from 'react';
import { Demo, FileTextIcon, Section, SunIcon, ZapIcon } from './GalleryChrome';

const TONES = ['neutral', 'success', 'warning', 'danger', 'info', 'accent'] as const;
const AVATAR_SIZES = [24, 32, 40, 56, 80] as const;

const TEAM = [
  { name: 'Aarav Patil' },
  { name: 'Sneha Kulkarni' },
  { name: 'Rohan Deshmukh' },
  { name: 'Priya Joshi' },
  { name: 'Vikram Shinde' },
  { name: 'Meera Kadam' },
];

export function DataSections() {
  const [clicks, setClicks] = useState(0);
  const [selectedCard, setSelectedCard] = useState('5.2');
  const [filters, setFilters] = useState<Record<string, boolean>>({ residential: true });

  const toggleFilter = (key: string) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <Section title="Card — densities · interactive · selected">
        <div className="ds-demo-grid">
          <Demo label="expressive (default)">
            <Card>
              <p className="hg-overline">Site survey</p>
              <p>Rooftop measured at 96 m² — 12 obstructions marked.</p>
            </Card>
          </Demo>
          <Demo label="functional density">
            <Card density="functional">
              <p className="hg-overline">System capacity</p>
              <p className="ds-num">5.2 kWp · 13 panels</p>
            </Card>
          </Demo>
          <Demo label={`interactive (live — ${clicks} clicks)`}>
            <Card interactive onClick={() => setClicks((n) => n + 1)}>
              <p>Open proposal PRO-2026-0042</p>
            </Card>
          </Demo>
          <Demo hindi label="Hindi content">
            <Card>
              <p className="hg-overline">सिस्टम क्षमता</p>
              <p>5.2 kWp सौर प्रणाली — 13 पैनल, अनुमानित उत्पादन 7,600 kWh/वर्ष</p>
            </Card>
          </Demo>
        </div>
        <div className="ds-demo-grid">
          {(['3.3', '5.2'] as const).map((kwp) => (
            <Demo
              key={kwp}
              label={selectedCard === kwp ? 'interactive + selected (live)' : 'interactive (live)'}
            >
              <Card
                interactive
                selected={selectedCard === kwp}
                onClick={() => setSelectedCard(kwp)}
              >
                <p className="hg-overline">Option {kwp === '3.3' ? 'A' : 'B'}</p>
                <p className="ds-num">{kwp} kWp</p>
              </Card>
            </Demo>
          ))}
        </div>
      </Section>

      <Section title="IconCircle — tints · sizes · densities">
        <div className="ds-row">
          <Demo label="accent (default)">
            <IconCircle icon={<SunIcon />} />
          </Demo>
          <Demo label="success">
            <IconCircle icon={<SunIcon />} color="var(--success)" />
          </Demo>
          <Demo label="warning">
            <IconCircle icon={<ZapIcon />} color="var(--warning)" />
          </Demo>
          <Demo label="danger">
            <IconCircle icon={<ZapIcon />} color="var(--danger)" />
          </Demo>
          <Demo label="info">
            <IconCircle icon={<FileTextIcon />} color="var(--info)" />
          </Demo>
          <Demo label="functional (32px)">
            <IconCircle icon={<SunIcon size={16} />} color="var(--success)" density="functional" />
          </Demo>
          <Demo label="size 56">
            <IconCircle icon={<SunIcon size={28} />} size={56} />
          </Demo>
        </div>
      </Section>

      <Section title="Chip — tones · dot · active · densities">
        <div className="ds-row">
          {TONES.map((tone) => (
            <Demo key={tone} label={tone}>
              <Chip tone={tone}>{tone}</Chip>
            </Demo>
          ))}
        </div>
        <div className="ds-row">
          {TONES.map((tone) => (
            <Demo key={tone} label={`${tone} dot`}>
              <Chip tone={tone} dot>
                {tone}
              </Chip>
            </Demo>
          ))}
        </div>
        <div className="ds-row">
          {(['residential', 'commercial', 'industrial'] as const).map((key) => (
            <Demo key={key} label={filters[key] ? 'active (live)' : 'inactive (live)'}>
              <Chip active={Boolean(filters[key])} dot onClick={() => toggleFilter(key)}>
                {key}
              </Chip>
            </Demo>
          ))}
          <Demo label="functional density">
            <Chip density="functional" tone="accent">
              functional
            </Chip>
          </Demo>
          <Demo hindi label="Hindi">
            <Chip tone="success" dot>
              सर्वेक्षण पूर्ण
            </Chip>
          </Demo>
        </div>
      </Section>

      <Section title="Badge — tones · densities">
        <div className="ds-row">
          {TONES.map((tone) => (
            <Demo key={tone} label={tone}>
              <Badge tone={tone}>{tone}</Badge>
            </Demo>
          ))}
          <Demo label="functional density">
            <Badge tone="info" density="functional">
              functional
            </Badge>
          </Demo>
          <Demo hindi label="Hindi">
            <Badge tone="warning">भुगतान बाकी</Badge>
          </Demo>
        </div>
      </Section>

      <Section title="Avatar — sizes · initials fallback">
        <div className="ds-row">
          {AVATAR_SIZES.map((size) => (
            <Demo key={size} label={`${size}px fallback`}>
              <Avatar name="Aarav Patil" size={size} />
            </Demo>
          ))}
          <Demo label="single-word name">
            <Avatar name="Priya" />
          </Demo>
          <Demo hindi label="Devanagari initials">
            <Avatar name="आरव पाटील" />
          </Demo>
        </div>
      </Section>

      <Section title="AvatarGroup — overlap · max overflow">
        <div className="ds-row">
          <Demo label="6 people, max 4 (+2)">
            <AvatarGroup people={TEAM} />
          </Demo>
          <Demo label="size 24, max 3">
            <AvatarGroup people={TEAM} size={24} max={3} />
          </Demo>
          <Demo label="size 40, all shown">
            <AvatarGroup people={TEAM.slice(0, 3)} size={40} />
          </Demo>
        </div>
      </Section>
    </>
  );
}
