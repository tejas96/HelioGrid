import { theme } from '@heliogrid/tokens/theme';
import { useState } from 'react';
import { Button, Checkbox, IconButton, Input, Radio, Switch } from '../../../ui';
import { Glyph, noop, Row, Section } from './GalleryChrome';

export function FormsSections() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('asha@');
  const [whatsapp, setWhatsapp] = useState(true);
  const [siteType, setSiteType] = useState('residential');
  const [syncOn, setSyncOn] = useState(false);

  return (
    <>
      <Section title="Buttons — variants">
        <Row>
          <Button size="md" onClick={noop}>
            Schedule survey
          </Button>
          <Button size="md" variant="secondary" onClick={noop}>
            Save draft
          </Button>
          <Button size="md" variant="ghost" onClick={noop}>
            Skip for now
          </Button>
          <Button size="md" variant="destructive" onClick={noop}>
            Delete lead
          </Button>
        </Row>
        <Row>
          <Button size="lg" onClick={noop}>
            Large 48
          </Button>
          <Button size="md" onClick={noop}>
            Medium 40
          </Button>
          <Button size="sm" onClick={noop}>
            Small 32
          </Button>
        </Row>
        <Row>
          <Button size="md" disabled>
            Disabled
          </Button>
          <Button size="md" loading>
            Sending
          </Button>
          <Button size="md" variant="secondary" disabled>
            Disabled secondary
          </Button>
        </Row>
        <Button fullWidth onClick={noop}>
          सर्वेक्षण शेड्यूल करें
        </Button>
      </Section>

      <Section title="Icon buttons">
        <Row>
          <IconButton label="Add" onClick={noop}>
            <Glyph color={theme.colors['text-primary']} />
          </IconButton>
          <IconButton label="Confirm" variant="dark" onClick={noop}>
            <Glyph color={theme.colors.surface} />
          </IconButton>
          <IconButton label="More options" variant="ghost" onClick={noop}>
            <Glyph color={theme.colors['text-secondary']} />
          </IconButton>
          <IconButton label="Locked" disabled>
            <Glyph color={theme.colors['text-disabled']} />
          </IconButton>
          <IconButton label="Compact" size={32} onClick={noop}>
            <Glyph color={theme.colors['text-primary']} size={8} />
          </IconButton>
        </Row>
      </Section>

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
        <Input label="PIN code (success)" mono success value="411045" helper="Pune — MSEDCL zone" />
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
    </>
  );
}
