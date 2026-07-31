import { theme } from '@heliogrid/tokens/theme';
import { Factory, Home, Layers } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  BloomLayer,
  OtpInput,
  RadioCard,
  Spinner,
  StepIndicator,
  TextLink,
  Wordmark,
} from '../../../ui';
import { noop, Row, Section } from './GalleryChrome';

const cardIcon = (Icon: typeof Home) => (
  <Icon color={theme.colors.accent} size={20} strokeWidth={1.5} absoluteStrokeWidth />
);

/** Auth composites — mirrors the web gallery states (login.md / whatyousell.md specs). */
export function AuthSections() {
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

const styles = StyleSheet.create({
  bloomWell: {
    alignItems: 'center',
  },
  darkWell: {
    backgroundColor: theme.colors['action-primary'],
    borderRadius: theme.radius['r-sm'],
    padding: theme.spacing['sp-3'],
  },
});
