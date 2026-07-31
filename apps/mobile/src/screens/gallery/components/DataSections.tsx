import { theme } from '@heliogrid/tokens/theme';
import { useState } from 'react';
import { AppText, Avatar, AvatarGroup, Badge, Card, Chip, IconCircle } from '../../../ui';
import { Glyph, PEOPLE, Row, Section, TONES } from './GalleryChrome';

export function DataSections() {
  const [cardSelected, setCardSelected] = useState(false);
  const [filter, setFilter] = useState('All');

  return (
    <>
      <Section title="Card · icon circle">
        <Card>
          <AppText weight="500">Expressive card — e2, 24dp radius</AppText>
        </Card>
        <Card density="functional">
          <AppText>Functional card — 12dp radius</AppText>
        </Card>
        <Card interactive selected={cardSelected} onClick={() => setCardSelected(!cardSelected)}>
          <AppText>Tap to toggle the selected accent ring</AppText>
        </Card>
        <Row>
          <IconCircle icon={<Glyph color={theme.colors.accent} />} />
          <IconCircle color={theme.colors.success} icon={<Glyph color={theme.colors.success} />} />
          <IconCircle color={theme.colors.warning} icon={<Glyph color={theme.colors.warning} />} />
          <IconCircle
            color={theme.colors.danger}
            density="functional"
            icon={<Glyph color={theme.colors.danger} size={8} />}
          />
        </Row>
      </Section>

      <Section title="Chips — tones + dot">
        <Row>
          {TONES.map((tone) => (
            <Chip key={tone} tone={tone} dot>
              {tone}
            </Chip>
          ))}
        </Row>
        <Row>
          {['All', 'Residential', 'Commercial'].map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
        </Row>
        <Row>
          <Chip density="functional" dot tone="info">
            Functional chip
          </Chip>
        </Row>
      </Section>

      <Section title="Badges">
        <Row>
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
          <Badge density="functional" tone="success">
            Functional
          </Badge>
        </Row>
      </Section>

      <Section title="Avatars">
        <Row>
          <Avatar name="Asha Patil" size={24} />
          <Avatar name="Ravi Kumar" size={32} />
          <Avatar name="Meera Joshi" />
          <Avatar name="Arjun Singh" size={56} />
        </Row>
        <AvatarGroup people={PEOPLE} max={4} />
      </Section>
    </>
  );
}
