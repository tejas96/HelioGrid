'use client';
import { PHONE_NSN_LENGTH } from '@heliogrid/domain';
import { Button, Input, TextLink } from '@heliogrid/ui';
import { Trans, useLingui } from '@lingui/react';
import type { FormEvent } from 'react';

interface PhoneStepProps {
  phone: string;
  sending: boolean;
  sendError: boolean;
  online: boolean;
  onPhoneChange(v: string): void;
  onSubmitPhone(e: FormEvent): void;
}

export function PhoneStep({
  phone,
  sending,
  sendError,
  online,
  onPhoneChange,
  onSubmitPhone,
}: PhoneStepProps) {
  const { i18n } = useLingui();

  return (
    <form className="lg-step" onSubmit={onSubmitPhone} aria-busy={sending || undefined}>
      <h1 className="lg-h1">
        <Trans id="Welcome back" />
      </h1>
      <p className="lg-body">
        <Trans id="Sign in with your phone number. No password — we'll text you a one-time code." />
      </p>
      <div className="lg-field">
        <Input
          label={i18n._('Mobile number')}
          mono
          type="tel"
          inputMode="tel"
          name="phone"
          autoComplete="tel-national"
          placeholder="98765 43210"
          value={phone}
          disabled={sending}
          onChange={(event) => onPhoneChange(event.target.value)}
          leading={<span className="lg-prefix">+91</span>}
          helper={i18n._('Sent by SMS to your registered number.')}
          error={sendError ? i18n._("Couldn't send the code. Try again.") : undefined}
        />
      </div>
      <div className="lg-cta">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={sending}
          disabled={phone.length !== PHONE_NSN_LENGTH || sending || !online}
        >
          <Trans id="Continue" />
        </Button>
      </div>
      <p className="lg-footer">
        <Trans id="New company?" />{' '}
        <TextLink href="/signup">
          <Trans id="Create an account" />
        </TextLink>
      </p>
    </form>
  );
}
