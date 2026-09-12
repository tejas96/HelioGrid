import type { PendingSwitch } from '@heliogrid/data';
import { SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, Icon, Text, TintedBlock, useFormat } from '@heliogrid/ui';

/**
 * The one deliberately unrecoverable act in the product (`F4-37`): what will be lost is named
 * BEFORE the switch, upload is offered first, and the words say it cannot be undone. On the
 * desktop it is the task column's content (`d-switch-discards`), not an overlay.
 */
export function SwitchPanel({
  pending,
  onConfirm,
}: {
  pending: PendingSwitch;
  onConfirm: () => void;
}) {
  const t = useTranslate();
  const { date } = useFormat();
  const { heldWork, next } = pending;
  return (
    <section className="hg-door-switch" aria-live="assertive">
      <div className="hg-door-switch-head">
        <span className="hg-door-switch-mark">
          <Icon size="md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
          </Icon>
        </span>
        <Text variant="h3" align="center">
          {t(SIGN_IN.switchTitle, { name: next.name, count: heldWork.count })}
        </Text>
        <Text variant="body-sm" color="secondary" align="center">
          {t(SIGN_IN.switchSubtitle, { date: date(heldWork.capturedAt) })}
        </Text>
      </div>
      <TintedBlock
        tone="danger"
        title={t(SIGN_IN.switchBlockTitle)}
        body={t(SIGN_IN.switchBlockBody)}
      />
      <div className="hg-door-switch-actions">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled
          disabledReason={t(SIGN_IN.uploadArrivesLater)}
        >
          {t(SIGN_IN.uploadFirst)}
        </Button>
        <Button variant="destructive" size="lg" fullWidth onClick={onConfirm}>
          {t(SIGN_IN.signInAndDiscard)}
        </Button>
      </div>
    </section>
  );
}
