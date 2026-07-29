import { theme } from '@heliogrid/tokens/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Factory, Home, Layers } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import {
  AppText,
  BloomLayer,
  Button,
  Card,
  Checkbox,
  Chip,
  IconButton,
  IconCircle,
  Input,
  OtpInput,
  ProgressBar,
  Radio,
  RadioCard,
  SegmentedControl,
  Spinner,
  StepIndicator,
  Switch,
  Tabs,
  TextLink,
  Wordmark,
} from '../../ui';
import {
  AvatarsSection,
  BadgesSection,
  ButtonsSection,
  DevanagariSection,
  EmptyStateSection,
  Glyph,
  IconButtonsSection,
  ListRowsSection,
  noop,
  OfflineBannerSection,
  Row,
  Section,
  StatCardsSection,
  StatusChipsSection,
  TONES,
  ToastsSection,
} from './components';

/**
 * Dev-only component gallery — every '../ui' export in every variant/state, mirroring the
 * web gallery coverage. Reached from the Home card's ghost chip; not part of product nav.
 * Hindi samples prove Devanagari rendering through AppText run-splitting on-device.
 * Stateless sections live in components.tsx (~450-line file limit).
 */

/** Border-drawn back chevron (same technique as the Checkbox check — no SVG dependency). */
function BackGlyph() {
  return <View style={styles.backGlyph} />;
}

const cardIcon = (Icon: typeof Home) => (
  <Icon color={theme.colors.accent} size={20} strokeWidth={1.5} absoluteStrokeWidth />
);

/** Auth composites — mirrors the web gallery states (login.md / whatyousell.md specs). */
function AuthCompositesSection() {
  const [otp, setOtp] = useState('');
  const [badOtp, setBadOtp] = useState('424241');
  const [badOtpError, setBadOtpError] = useState(true);
  const [segment, setSegment] = useState('res');
  return (
    <>
      <Section title="Auth — wordmark · bloom · links">
        <Row>
          <Wordmark />
          <Wordmark size="sm" />
        </Row>
        <View style={styles.bloomWell}>
          <BloomLayer />
        </View>
        <Row>
          <TextLink onPress={noop}>Change number</TextLink>
          <TextLink onPress={noop}>Resend code</TextLink>
          <TextLink onPress={noop}>Create an account</TextLink>
        </Row>
      </Section>

      <Section title="OTP input">
        <AppText weight="500" color={theme.colors['text-secondary']}>
          6 अंकों का कोड डालें
        </AppText>
        <OtpInput label="6 अंकों का कोड डालें" value={otp} onChange={setOtp} />
        <AppText weight="500" color={theme.colors['text-secondary']}>
          Error — digits retained, edit clears it
        </AppText>
        <OtpInput
          label="Wrong code — edit to clear the error"
          value={badOtp}
          error={badOtpError}
          onChange={(v) => {
            setBadOtp(v);
            setBadOtpError(false);
          }}
        />
        <AppText weight="500" color={theme.colors['text-secondary']}>
          Disabled
        </AppText>
        <OtpInput label="Disabled code entry" value="4242" disabled onChange={noop} />
      </Section>

      <Section title="Step indicator · spinner">
        <Row>
          <StepIndicator steps={2} current={1} label="Step 1 of 2" />
          <AppText color={theme.colors['text-secondary']}>Step 1 of 2</AppText>
        </Row>
        <Row>
          <StepIndicator steps={2} current={2} label="Step 2 of 2" />
          <AppText color={theme.colors['text-secondary']}>Step 2 of 2</AppText>
        </Row>
        <Row>
          <Spinner />
          <Spinner size="sm" />
          <View style={styles.darkWell}>
            <Spinner tone="onDark" />
          </View>
        </Row>
      </Section>

      <Section title="Radio cards">
        <RadioCard
          label="What do you install?"
          value={segment}
          onChange={setSegment}
          options={[
            {
              value: 'res',
              label: 'Residential rooftop',
              description: 'Homes · 1 to 15 kW',
              icon: cardIcon(Home),
            },
            {
              value: 'ci',
              label: 'Commercial & industrial',
              description: 'Factories and warehouses · 20 kW and above',
              icon: cardIcon(Factory),
            },
            {
              value: 'both',
              label: 'Both',
              description: 'Residential and C&I projects',
              icon: cardIcon(Layers),
            },
          ]}
        />
      </Section>
    </>
  );
}

/**
 * Props are the ROUTE's props — no `onBack` callback (ADR-0020). Going back is
 * `navigation.goBack()`, which also gives the native swipe gesture for free.
 */
type GalleryScreenProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

export function GalleryScreen({ navigation }: GalleryScreenProps) {
  const onBack = () => navigation.goBack();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('asha@');
  const [whatsapp, setWhatsapp] = useState(true);
  const [siteType, setSiteType] = useState('residential');
  const [syncOn, setSyncOn] = useState(false);
  const [cardSelected, setCardSelected] = useState(false);
  const [filter, setFilter] = useState('All');
  const [progress, setProgress] = useState(40);
  const [period, setPeriod] = useState('week');
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('overview');

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing['sp-2'] }]}>
        <IconButton label="Back to home" variant="ghost" onClick={onBack}>
          <BackGlyph />
        </IconButton>
        <AppText role="h3" weight="700">
          Component gallery
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing['sp-12'] },
        ]}
      >
        <ButtonsSection />
        <IconButtonsSection />

        <Section title="Inputs">
          <Input label="Customer name" placeholder="Asha Patil" value={name} onChange={setName} />
          <Input
            label="Phone (mono)"
            mono
            type="tel"
            value={phone}
            onChange={setPhone}
            helper="MSG91 OTP will verify this number"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error="Enter a valid email address"
          />
          <Input
            label="PIN code (success)"
            mono
            success
            value="411045"
            helper="Pune — MSEDCL zone"
          />
          <Input
            label="Site ID (functional density)"
            density="functional"
            mono
            value="HG-2214"
            helper="Functional density — 40dp field"
          />
          <Input label="Disabled" disabled value="Not editable" />
        </Section>

        <Section title="Checkbox · radio · switch">
          <Checkbox label="Send WhatsApp updates" checked={whatsapp} onChange={setWhatsapp} />
          <Checkbox label="Checked + disabled" checked disabled />
          <Checkbox label="Disabled" disabled />
          <Radio
            label="Residential"
            checked={siteType === 'residential'}
            onChange={() => setSiteType('residential')}
          />
          <Radio
            label="Commercial"
            checked={siteType === 'commercial'}
            onChange={() => setSiteType('commercial')}
          />
          <Radio label="Disabled" disabled />
          <Switch label="Offline sync" checked={syncOn} onChange={setSyncOn} />
          <Switch label="Checked + disabled" checked disabled />
        </Section>

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
            <IconCircle
              color={theme.colors.success}
              icon={<Glyph color={theme.colors.success} />}
            />
            <IconCircle
              color={theme.colors.warning}
              icon={<Glyph color={theme.colors.warning} />}
            />
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

        <BadgesSection />
        <AvatarsSection />
        <ListRowsSection />
        <StatCardsSection />
        <StatusChipsSection />
        <EmptyStateSection />
        <OfflineBannerSection />

        <Section title="Progress">
          <ProgressBar value={progress} />
          <ProgressBar value={progress} gradient />
          <Row>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setProgress((p) => (p + 10) % 110)}
            >
              Advance
            </Button>
          </Row>
        </Section>

        <ToastsSection />

        <Section title="Segmented control">
          <SegmentedControl
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
            value={period}
            onChange={setPeriod}
          />
          <SegmentedControl
            density="functional"
            options={[
              { value: 'list', label: 'List' },
              { value: 'map', label: 'Map' },
            ]}
            value={view}
            onChange={setView}
          />
        </Section>

        <Section title="Tabs">
          <Tabs
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'design', label: 'Design' },
              { value: 'payments', label: 'Payments' },
            ]}
            value={tab}
            onChange={setTab}
          />
          <AppText color={theme.colors['text-secondary']}>
            {'Selected: '}
            {tab}
          </AppText>
        </Section>

        <AuthCompositesSection />

        <DevanagariSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingBottom: theme.spacing['sp-3'],
  },
  content: {
    padding: theme.layout['screen-pad-mobile'],
    gap: theme.spacing['sp-8'],
  },
  bloomWell: {
    alignItems: 'center',
  },
  darkWell: {
    backgroundColor: theme.colors['action-primary'],
    borderRadius: theme.radius['r-sm'],
    padding: theme.spacing['sp-3'],
  },
  // Border-drawn ‹ chevron: L rotated 45° (ghost IconButton → text-secondary per its doc).
  backGlyph: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors['text-secondary'],
    transform: [{ rotate: '45deg' }, { translateX: 1 }],
  },
});
