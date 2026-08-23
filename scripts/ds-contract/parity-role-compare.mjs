/**
 * (h) role comparison — "do the two halves name the same ROLE?"
 *
 * Split out of semantic-parity.mjs, which owns the STATE and NAME comparison. Roles need their
 * own module because they carry the exemption logic no other member does: implicit roles absorbed
 * by a semantic element, the primitive's default `button`, and the indeterminate-progressbar case
 * where checks (g) and (h) would otherwise contradict each other on the same node.
 */
import { byName, tally } from './lib.mjs';
import { satisfying } from './parity-declarations.mjs';

export function compareRoles({ from, to, fromSide, at, partnerLabel, exemptions }, out) {
  const toSide = fromSide === 'web' ? 'native' : 'web';
  if (from.roles.noPartner.size > 0) {
    tally(
      exemptions,
      fromSide === 'web' ? 'NO_RN_ROLE' : 'NO_WEB_ROLE',
      `${at} [${[...from.roles.noPartner].sort(byName).join(', ')}]`,
    );
  }
  const carried = satisfying(to);
  const missing = [...from.roles.canonical].filter((role) => !carried.has(role));
  const absorbed = [...from.roles.canonical].filter(
    (role) => !to.roles.canonical.has(role) && to.implicit.has(role),
  );
  if (absorbed.includes('button') && to.primitive) {
    tally(exemptions, 'PRIMITIVE_DEFAULT_ROLE', at);
  }
  const byElement = absorbed.filter((role) => role !== 'button' || !to.primitive);
  if (toSide === 'web' && byElement.length > 0) {
    tally(exemptions, 'ROLE_IN_ELEMENT', `${at} [${byElement.sort(byName).join(', ')}]`);
  }
  if (missing.length === 0) return;
  // An INDETERMINATE progressbar is the one place two of this gate's own checks contradict each
  // other: (h) would demand the native partner role, and (g) refuses a native `progressbar` that
  // carries no `accessibilityValue`. ARIA reads a missing `aria-valuenow` as indeterminate and
  // that is what the design system spells; TalkBack and VoiceOver instead announce a percentage
  // for the role, so the native partner would promise a number it has nothing to put behind.
  // A REAL meter carries `aria-valuenow` and is NOT excused here — it still owes its native half
  // a role plus an `accessibilityValue`.
  const indeterminate = fromSide === 'web' && missing.includes('progressbar') && !from.hasValueNow;
  if (indeterminate) {
    tally(exemptions, 'INDETERMINATE_PROGRESS', `${at} [progressbar]`);
    const rest = missing.filter((role) => role !== 'progressbar');
    if (rest.length === 0) return;
    missing.length = 0;
    missing.push(...rest);
  }
  if (to.roles.opaque) {
    tally(exemptions, 'OPAQUE_ROLE', `${at} [${missing.sort(byName).join(', ')}]`);
    return;
  }
  const spelled = [...from.roles.written].sort(byName).join(', ');
  out.findings.push(
    `(h) SEMANTIC DRIFT  ${at}: the ${fromSide} half declares role(s) \`${spelled}\` ` +
      `(canonically ${missing.sort(byName).join(', ')}) and the ${toSide} half (${partnerLabel}) ` +
      `declares no matching role — not as an attribute` +
      (toSide === 'web' ? ', and not implicitly through a semantic element either' : '') +
      '. The control announces as whatever its container happens to be. Roles go through the ' +
      '`Pressable` primitive on both halves (`accessibilityRole`), which maps the ARIA-side ' +
      "vocabulary to RN's — `menuitemradio` becomes `menuitem` plus " +
      '`accessibilityState.checked`. THIS IS A LEXICAL CHECK: it compares declared role VALUES, ' +
      'not the nodes they sit on. See THE (h) SEMANTIC SPLIT below.',
  );
}

/** A folder with no `*.native.tsx` at all. Waived by marker, or handed to `ds:check` list 3. */
