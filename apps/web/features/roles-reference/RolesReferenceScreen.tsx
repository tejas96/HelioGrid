'use client';
import { useAssignRolesDraftHeld, useRolesReference, useSession } from '@heliogrid/data/react';
import { OPENED_FROM_ASSIGN_ROLES, opensSettingsRow, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { rolesReferenceWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { RolesReference } from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { settingsRowPath } from '../settings';

/**
 * The Roles reference behind `More` on the web (`SCR-M01-14`): the twelve roles, who holds each and
 * what each can do. Only a person whose presets open the row reaches it (`F7-48`); a link that
 * names another page is not found. Opened from Assign Roles, its way back returns there, where Team
 * opens the editor again with the ticks it kept (`useAssignRoles`' `resume`).
 */
export function RolesReferenceScreen({ from }: { from: string | null }) {
  const { user } = useSession();
  if (!opensSettingsRow(user?.tenant?.roles ?? [], 'roles')) notFound();
  return <RolesReferenceIn fromAssign={from === OPENED_FROM_ASSIGN_ROLES} />;
}

function RolesReferenceIn({ fromAssign }: { fromAssign: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const reference = useRolesReference(locale);
  const held = useAssignRolesDraftHeld();
  const words = rolesReferenceWords(t, reference.holdings);
  /* Team is behind this page only while it keeps the ticks; a link or a reload has none: push it. */
  const backToAssign = () => {
    if (held) router.back();
    else router.push(settingsRowPath(SETTINGS_SEGMENT.team));
  };
  return (
    <div className="hg-shell-page">
      <RolesReference
        words={words}
        counts={reference.load}
        onRetry={reference.retry}
        title="page"
        back={fromAssign ? { label: words.backToAssign, onPress: backToAssign } : null}
      />
    </div>
  );
}
