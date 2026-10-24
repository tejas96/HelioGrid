import { ShellGlyph } from '../AppShell/ShellGlyph';
import { AvatarGroup } from '../Avatar/Avatar';
import { PRESET_GLYPH } from '../SettingsList/SettingsList.logic';
import { GRANT_DISC_SIZE, GRANT_DISCS_SHOWN } from './AssignRoles.logic';
import type { AssignRolesGrant } from './AssignRoles.types';

/**
 * The grant line's card: the held capabilities' glyphs as a quiet cluster, then the overline and the
 * sentence. The cluster is decoration and hidden from a screen reader; the sentence is the meaning,
 * read again whenever it changes. Nothing in it looks like a control.
 */
export function GrantCard({ grant, label }: { grant: AssignRolesGrant; label: string }) {
  return (
    <section className="hg-grant-card" aria-label={label}>
      {grant.speakers.length === 0 ? null : (
        <span className="hg-grant-card-cluster" aria-hidden="true">
          <AvatarGroup
            people={grant.speakers.map((preset) => ({
              name: preset,
              glyph: <ShellGlyph name={PRESET_GLYPH[preset]} size="sm" tone="accent" />,
            }))}
            size={GRANT_DISC_SIZE}
            max={GRANT_DISCS_SHOWN}
            ring="var(--accent-subtle)"
          />
        </span>
      )}
      <div className="hg-grant-card-words">
        <span className="hg-grant-card-overline" aria-hidden="true">
          {label}
        </span>
        <p className="hg-grant-card-sentence" aria-live="polite">
          {grant.parts.map((part, index) =>
            part.strong ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: the parts are one sentence, rebuilt whole on every change
              <strong key={index}>{part.text}</strong>
            ) : (
              part.text
            ),
          )}
        </p>
      </div>
    </section>
  );
}
