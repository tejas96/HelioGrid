---
paths:
  - "biome.json"
  - "packages/config/biome/**"
---

# Biome — traps

- **An `overrides` entry REPLACES a rule's options for the files it matches; it never merges.** A new
  override that adds one import ban to some files switches OFF every ban an earlier entry set for
  those same files, and lint stays green. Fold a new ban into the EXISTING override for those paths,
  repeating the full list, and put a legitimate exemption at its call site as a `biome-ignore` that
  names the reason.
- **A `biome-ignore` is ONE comment line directly above the code:** a reason wrapped onto a second
  `//` line detaches it ("Suppression comment has no effect"). Between JSX elements write it as
  `{/* biome-ignore … */}`; in CSS put it above the property, not inside a multi-line value. A
  plugin's diagnostic is silenced with `lint/plugin/<plugin file name>`.
- **A plugin's `includes` glob must start with `**/`:** a root-anchored glob matches nothing, and no
  check catches it.
