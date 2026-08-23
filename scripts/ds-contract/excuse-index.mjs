/**
 * CHECK (d)'s RESOLVER — what the package actually contains, and what each folder actually binds.
 *
 * WHY IT IS ITS OWN FILE. Deciding whether a NAME exists is a different job from deciding whether a
 * SENTENCE is an excuse. The vocabulary next door changes every audit round; this does not, and the
 * one time it did change — round six's narrowing of the import exemption — it was the change that
 * actually closed the miss, not the twenty phrases added beside it.
 *
 * TWO ANSWERS LIVE HERE:
 *   · `packageIndex`  — name → where it lives. A `components/<Name>/` folder, or the file exporting
 *                       the symbol. A name that resolves means the excuse is FALSE: the thing
 *                       exists, import it. Cross-folder imports happen ~100× in this package.
 *   · `importsByScope` — the EXEMPTION set. A folder that already binds the name is attributing,
 *                       not excusing: "the spring on press belongs to the `Pressable` primitive" is
 *                       a true statement by a folder that imports and uses `Pressable`.
 */

import { matchesOf } from './excuse-vocabulary.mjs';
import { componentOf, rel, UI } from './lib.mjs';

const EXPORT_DECL =
  /export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/g;
const EXPORT_LIST = /export\s+(?:type\s+)?\{([^}]*)\}/g;
/** Group 1 is the BINDING CLAUSE only — everything between `import` and `from`. The module
 *  specifier is deliberately excluded; see `importsByScope`. */
const IMPORT_LIST = /import\s+([^;]*?)\s+from\s*['"][^'"]+['"]/g;
const WORD = /([A-Za-z0-9_$]+)/g;
export const LOCAL_DECL =
  /\b(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/g;

/** name → where it lives: a component folder, or the file exporting the symbol. */
export function packageIndex(files, componentFolders) {
  const index = new Map();
  for (const name of componentFolders)
    index.set(name, { folder: name, file: `${rel(UI)}/${name}/` });
  for (const { file, source } of files) {
    const folder = componentOf(file);
    const names = [
      ...matchesOf(source, EXPORT_DECL).map((m) => m[1]),
      ...matchesOf(source, EXPORT_LIST).flatMap((m) =>
        m[1].split(',').map(
          (part) =>
            part
              .split(/\s+as\s+/)
              .at(-1)
              ?.trim() ?? '',
        ),
      ),
    ];
    for (const name of names) {
      if (!/^[A-Z][A-Za-z0-9_$]*$/.test(name) || index.has(name)) continue;
      index.set(name, { folder, file: rel(file) });
    }
  }
  return index;
}

/** Every identifier BOUND by an import, keyed by component folder (files outside `components/` are
 *  their own scope). This is the exemption set: a folder that imports a name is not excusing it.
 *
 *  ROUND SIX NARROWED THIS, and the narrowing is what actually closed the miss. It used to read
 *  every word of the whole import STATEMENT, module specifier included — so
 *  `import { useFormat } from '../MarketProvider/market-context'` exempted the word
 *  `MarketProvider`, a path segment nobody bound, throughout the TimeField folder. That is why
 *  "that provider is not in this folder" sailed through a check whose vocabulary already contained
 *  the phrase "is not in this folder": the phrase matched, the name resolved, and the exemption
 *  then threw the finding away. A folder that imports a SIBLING'S FILE is not thereby excused from
 *  every sentence about that sibling. Only bound names exempt now.
 *
 *  ROUND SEVEN FOUND ITS OTHER EDGE, and did NOT narrow it further. A folder that imports
 *  `Pressable` and then writes "the primitive carries no checked state" IS exempted here, and
 *  correctly so by this rule's own logic — it is talking about a thing it uses. That family of
 *  false comment is caught by capability-claims.mjs instead, which asks the primitive's typings
 *  rather than the name index. Narrowing this exemption to catch them would have re-broken every
 *  honest attribution sentence in the package. */
export function importsByScope(files) {
  const scopes = new Map();
  for (const { file, source } of files) {
    const key = componentOf(file) ?? file;
    if (!scopes.has(key)) scopes.set(key, new Set());
    for (const statement of matchesOf(source, IMPORT_LIST)) {
      for (const word of matchesOf(statement[1], WORD)) scopes.get(key).add(word[1]);
    }
  }
  return scopes;
}
