'use client';
import { Button, Checkbox, IconButton, Input, Radio, Switch } from '@heliogrid/ui';
import { useState } from 'react';
import { ArrowRightIcon, Demo, PhoneIcon, PlusIcon, SearchIcon, Section } from './GalleryChrome';

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const BUTTON_SIZES = ['lg', 'md', 'sm'] as const;
const ICONBTN_VARIANTS = ['surface', 'dark', 'ghost'] as const;
const ICONBTN_SIZES = [32, 40, 48] as const;

export function FormsSections() {
  const [agree, setAgree] = useState(true);
  const [notify, setNotify] = useState(false);
  const [hindiCheck, setHindiCheck] = useState(true);
  const [inverter, setInverter] = useState('string');
  const [hindiPhase, setHindiPhase] = useState('single');
  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [hindiSwitch, setHindiSwitch] = useState(true);

  return (
    <>
      <Section title="Button — variant × size × disabled × loading">
        {BUTTON_VARIANTS.map((variant) => (
          <div className="ds-row" key={variant}>
            {BUTTON_SIZES.map((size) => (
              <Demo key={size} label={`${variant} ${size}`}>
                <Button variant={variant} size={size}>
                  Schedule survey
                </Button>
              </Demo>
            ))}
            <Demo label={`${variant} disabled`}>
              <Button variant={variant} size="md" disabled>
                Schedule survey
              </Button>
            </Demo>
            <Demo label={`${variant} loading`}>
              <Button variant={variant} size="md" loading>
                Schedule survey
              </Button>
            </Demo>
          </div>
        ))}
        <div className="ds-row">
          <Demo label="icon leading">
            <Button icon={<PlusIcon />}>Add lead</Button>
          </Demo>
          <Demo label="iconRight">
            <Button variant="secondary" iconRight={<ArrowRightIcon />}>
              Continue
            </Button>
          </Demo>
        </div>
        <div className="ds-demo-stack">
          <Demo label="fullWidth">
            <Button fullWidth>Send over WhatsApp</Button>
          </Demo>
        </div>
        <div className="ds-row" lang="hi">
          <Demo hindi label="primary — Hindi">
            <Button>सर्वेक्षण शेड्यूल करें</Button>
          </Demo>
          <Demo hindi label="secondary — Hindi">
            <Button variant="secondary">प्रस्ताव भेजें</Button>
          </Demo>
          <Demo hindi label="destructive — Hindi">
            <Button variant="destructive" size="md">
              डिज़ाइन हटाएँ
            </Button>
          </Demo>
        </div>
      </Section>

      <Section title="IconButton — variant × size × disabled">
        {ICONBTN_VARIANTS.map((variant) => (
          <div className="ds-row" key={variant}>
            {ICONBTN_SIZES.map((size) => (
              <Demo key={size} label={`${variant} ${size}`}>
                <IconButton label="Add lead" variant={variant} size={size}>
                  <PlusIcon />
                </IconButton>
              </Demo>
            ))}
            <Demo label={`${variant} disabled`}>
              <IconButton label="Add lead" variant={variant} disabled>
                <PlusIcon />
              </IconButton>
            </Demo>
          </div>
        ))}
      </Section>

      <Section title="Input — rest · helper · error · success · mono · leading/trailing · densities">
        <div className="ds-demo-grid">
          <Demo label="rest (focus is live — click for the ring)">
            <Input label="Customer name" placeholder="e.g. Aarav Patil" />
          </Demo>
          <Demo label="helper hint">
            <Input
              label="Phone"
              type="tel"
              placeholder="+91"
              helper="WhatsApp messages go to this number"
            />
          </Demo>
          <Demo label="error">
            <Input label="Pincode" defaultValue="4110" error="Enter the 6-digit pincode" />
          </Demo>
          <Demo label="success">
            <Input label="GSTIN" defaultValue="27AAPFU0939F1ZV" success />
          </Demo>
          <Demo label="disabled">
            <Input label="Tenant slug" defaultValue="surya-epc" disabled />
          </Demo>
          <Demo label="mono — numerics as data">
            <Input label="System size" defaultValue="5.2 kWp" mono />
          </Demo>
          <Demo label="leading icon">
            <Input label="Search leads" placeholder="Name or phone" leading={<SearchIcon />} />
          </Demo>
          <Demo label="trailing icon">
            <Input
              label="Phone"
              type="tel"
              defaultValue="+91 98765 43210"
              trailing={<PhoneIcon />}
              mono
            />
          </Demo>
          <Demo label="functional density">
            <Input label="Discom" placeholder="MSEDCL" density="functional" />
          </Demo>
          <Demo hindi label="Hindi label + helper">
            <Input label="ग्राहक का नाम" placeholder="जैसे आरव पाटील" helper="प्रस्ताव इसी नाम से बनेगा" />
          </Demo>
        </div>
      </Section>

      <Section title="Checkbox — on · off · disabled">
        <div className="ds-row">
          <Demo label="checked (live)">
            <Checkbox checked={agree} onChange={setAgree} label="DCR modules only" />
          </Demo>
          <Demo label="unchecked (live)">
            <Checkbox checked={notify} onChange={setNotify} label="Notify on site visit" />
          </Demo>
          <Demo label="disabled off">
            <Checkbox disabled label="Net metering" />
          </Demo>
          <Demo label="disabled on">
            <Checkbox checked disabled label="Subsidy applied" />
          </Demo>
          <Demo hindi label="Hindi (live)">
            <Checkbox checked={hindiCheck} onChange={setHindiCheck} label="सब्सिडी लागू करें" />
          </Demo>
        </div>
      </Section>

      <Section title="Radio — group · disabled">
        <div className="ds-row">
          {(['string', 'micro', 'hybrid'] as const).map((value) => (
            <Demo key={value} label={inverter === value ? 'checked (live)' : 'unchecked (live)'}>
              <Radio
                name="gallery-inverter"
                value={value}
                checked={inverter === value}
                onChange={(event) => setInverter(event.target.value)}
                label={
                  value === 'string'
                    ? 'String inverter'
                    : value === 'micro'
                      ? 'Microinverter'
                      : 'Hybrid'
                }
              />
            </Demo>
          ))}
          <Demo label="disabled off">
            <Radio disabled label="Off-grid" />
          </Demo>
          <Demo label="disabled on">
            <Radio checked disabled label="On-grid" />
          </Demo>
        </div>
        <div className="ds-row" lang="hi">
          {(['single', 'three'] as const).map((value) => (
            <Demo
              hindi
              key={value}
              label={hindiPhase === value ? 'Hindi checked' : 'Hindi unchecked'}
            >
              <Radio
                name="gallery-phase-hi"
                value={value}
                checked={hindiPhase === value}
                onChange={(event) => setHindiPhase(event.target.value)}
                label={value === 'single' ? 'सिंगल फेज़' : 'थ्री फेज़'}
              />
            </Demo>
          ))}
        </div>
      </Section>

      <Section title="Switch — on · off · disabled">
        <div className="ds-row">
          <Demo label="on (live)">
            <Switch checked={wifiOnly} onChange={setWifiOnly} label="Upload on Wi-Fi only" />
          </Demo>
          <Demo label="off (live)">
            <Switch checked={autoSync} onChange={setAutoSync} label="Auto-sync photos" />
          </Demo>
          <Demo label="disabled off">
            <Switch disabled label="Beta features" />
          </Demo>
          <Demo label="disabled on">
            <Switch checked disabled label="Offline mode" />
          </Demo>
          <Demo hindi label="Hindi (live)">
            <Switch checked={hindiSwitch} onChange={setHindiSwitch} label="ऑफ़लाइन मोड" />
          </Demo>
        </div>
      </Section>
    </>
  );
}
