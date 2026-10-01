---
paths:
  - "biome.json"
  - "packages/config/biome/**"
---

# Biome — three traps that fail silently

- **An `overrides` entry REPLACES a rule's options for the files it matches; it never merges.** A new
  override that adds one import ban to some files switches OFF every ban an earlier entry set for
  those same files, and lint stays green. Fold a new ban into the EXISTING override for those paths,
  repeating the full list, and put a legitimate exemption at its call site as a `biome-ignore` that
  names the reason.
- **A `biome-ignore` is the comment line IMMEDIATELY above the code it silences.** A reason wrapped
  onto a second `//` line breaks the adjacency, and the suppression silently does nothing. Keep the
  reason on one line. Between JSX elements write it as `{/* biome-ignore … */}`; in CSS put it above
  the property, not inside a multi-line value. A plugin's diagnostic is silenced with
  `lint/plugin/<plugin file name>`, and a suppression that silences nothing fails lint.
- **Biome ignores a misspelled option without an error.** The Tailwind CSS option is
  `css.parser.tailwindDirectives`; a wrong name leaves `@theme` unparsed and nothing reports it.
  Read Biome's schema before renaming any option. A plugin's `includes` glob must start with `**/` —
  a glob anchored at the root matches nothing, which the `biome-plugin-scopes` invariant catches.
