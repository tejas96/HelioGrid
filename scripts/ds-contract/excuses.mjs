/**
 * CHECK (d) [+ (d·i)] — FALSE EXCUSES: a comment that talks its way out of a port, about a thing
 * that is already sitting in the tree.
 *
 * WHY. Fourteen porting agents each wrote a variant of "that component belongs to another family,
 * so this contract keeps the node form only" — and every one of the fourteen was FALSE. Cross-folder
 * imports happen roughly a hundred times in this package; `packages/ui/src/components/<Name>/` is a
 * flat neighbourhood, not a set of sealed rooms. The excuse is cheap to write, it reads as
 * engineering judgement, it survives review because checking it means opening another folder, and
 * it leaves a real prop flattened behind a sentence that sounds like a reason. Nothing else in the
 * lint chain reads prose, so nothing else can call the bluff.
 *
 * WHAT IT DOES. Over every comment in packages/ui/src:
 *   1. match the excuse vocabulary in excuse-vocabulary.mjs — the phrasings the audits actually
 *      found written;
 *   2. take the names mentioned within WINDOW characters of the phrase;
 *   3. resolve each against the package index in excuse-index.mjs: a `components/<Name>/` folder,
 *      or a symbol exported anywhere under packages/ui/src.
 *
 * A name that RESOLVES is a violation — the excuse is false, the thing exists, import it. A name
 * that does NOT resolve is reported as INFORMATIONAL rather than dropped: that comment is the only
 * record of a genuine gap, and a gate that silently swallowed it would make the gap invisible the
 * moment the folder does land.
 *
 * ONE EXEMPTION, and it is the only one. If the component folder ALREADY IMPORTS the name, the
 * sentence is attribution, not an excuse — "the spring on press belongs to the `Pressable`
 * primitive" is a true statement by a folder that imports `Pressable` and uses it. The excuse class
 * this check exists for is the opposite shape: a folder that names a thing precisely because it is
 * NOT reaching for it. Scoped to the FOLDER, not the file, because the import usually sits in
 * `<Name>.native.tsx` while the sentence sits in `<Name>.types.ts`.
 *
 * THE SECOND RESOLVER. Round seven's excuses named a CAPABILITY rather than a component — "the
 * primitive carries no checked state" — so the name index had nothing to answer and the exemption
 * above threw them all away. Those are resolved by capability-claims.mjs against the primitive's
 * own typings, and reported under the same (d) heading. Same check, second way of being wrong.
 *
 * WHAT IT CANNOT SEE. It reads COMMENTS, not code, so an excuse expressed as a shrug in a variable
 * name is invisible, and so is a false excuse written in words outside the vocabulary — which is
 * closed on purpose (the native-waiver vocabulary argues the same point: free-text matching turns
 * a gate into a grep). It cannot tell you an excuse is TRUE — resolving a name proves the thing
 * exists, not that this component should use it; a finding is a claim to CHECK, not a defect proved.
 * A phrase inside "double quotes" is treated as a citation, not an assertion, so a comment that
 * records a removed excuse does not re-raise it — which also means a real excuse someone quoted is
 * missed. Names are matched by spelling: `Checkbox` mentioned as English prose about ticking a box
 * resolves to the folder, and the reverse — a component referred to only as "the tick" — is
 * invisible. Candidate names must be Capitalised, so an excuse about a lowercase export (`useFormat`)
 * is never a candidate at all. Every one of those resolves toward under-reporting except the
 * spelling case, which is the one to widen if it bites. The folder-import exemption above is the
 * widest hole: a folder that imports a type and still writes an excuse about the value form goes
 * unseen.
 */
import { auditCapabilityClaims } from './capability-claims.mjs';
import { importsByScope, LOCAL_DECL, packageIndex } from './excuse-index.mjs';
import {
  candidates,
  EXCUSES,
  hitsIn,
  matchesOf,
  NOT_COMPONENTS,
  quoteAt,
  WINDOW,
} from './excuse-vocabulary.mjs';
import { comments, componentOf, lineOf, rel } from './lib.mjs';

/** Findings are keyed per (file, comment block, name) and accumulate the phrases that raised them,
 *  so one paragraph matching three phrasings about one name reports once. */
function record(store, key, seed, phrase) {
  if (!store.has(key)) store.set(key, { ...seed, phrases: new Set() });
  store.get(key).phrases.add(phrase);
}

/** The excuse is FALSE: the name resolves, and this folder is not already importing it. */
function addViolations(names, site, store) {
  for (const name of names) {
    const found = site.index.get(name);
    if (!found || name === site.owner) continue;
    if (site.owner !== null && found.folder === site.owner) continue;
    if (site.imported.has(name)) continue;
    record(store, site.key(name), { at: site.at, name, quote: site.quote, found }, site.label);
  }
}

/** The excuse names something genuinely absent. Not a failure — a gap worth keeping visible. */
function addInformational(names, site, store) {
  for (const name of names) {
    if (site.index.has(name) || NOT_COMPONENTS.has(name)) continue;
    if (site.imported.has(name) || site.declared.has(name) || name === site.owner) continue;
    record(store, site.key(name), { at: site.at, name, quote: site.quote }, site.label);
  }
}

function scanFile({ file, source }, context, out) {
  const owner = componentOf(file);
  const imported = context.scopes.get(owner ?? file) ?? new Set();
  const declared = new Set(matchesOf(source, LOCAL_DECL).map((m) => m[1]));
  for (const block of comments(source)) {
    for (const hit of hitsIn(block, EXCUSES)) {
      const line = lineOf(source, block.start) + lineOf(block.text, hit.index) - 1;
      const to = hit.index + hit.length + WINDOW;
      const { strong, weak } = candidates(block.text.slice(Math.max(0, hit.index - WINDOW), to));
      const site = {
        at: `${rel(file)}:${line}`,
        quote: quoteAt(block.text, hit.index),
        label: hit.label,
        key: (name) => `${rel(file)}|${block.start}|${name}`,
        index: context.index,
        owner,
        imported,
        declared,
      };
      addViolations([...strong, ...weak], site, out.violations);
      addInformational(strong, site, out.informational);
    }
  }
}

export function auditExcuses(files, componentFolders) {
  const context = {
    index: packageIndex(files, componentFolders),
    scopes: importsByScope(files),
  };
  const out = { violations: new Map(), informational: new Map() };
  for (const entry of files) scanFile(entry, context, out);
  const { violations, informational } = out;
  const capability = auditCapabilityClaims(files);
  return {
    findings: [
      ...[...violations.values()].map(
        (v) =>
          `(d) FALSE EXCUSE  ${v.at}: "${v.quote}" — but \`${v.name}\` EXISTS at ${v.found.file}. ` +
          `Cross-folder imports happen ~100× in this package; matched on ${[...v.phrases].join(', ')}.`,
      ),
      ...capability.findings,
    ],
    informational: [
      ...[...informational.values()].map(
        (v) =>
          `(d·i) REAL GAP    ${v.at}: "${v.quote}" — \`${v.name}\` resolves to nothing in ` +
          `packages/ui/src. Left visible on purpose; matched on ${[...v.phrases].join(', ')}.`,
      ),
      ...capability.informational,
    ],
  };
}
