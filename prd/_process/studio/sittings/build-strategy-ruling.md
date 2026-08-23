# Studio build-strategy ruling (owner, 2026-08-05)

S12-1 — THE POC CODEBASE IS THE STARTING POINT, NOT A REFERENCE.

V2's studio is built by PORTING and RESHAPING `3d_design_studio/`, never by re-implementing it
from scratch. The owner's words: "since we already done the work of 3d design studio we have to
use same codebase instead of re-invent from scratch — place the codebase according to the rules
and structure the project will have, but the logic and things are already there; we have to
re-shape the UI based on the new UX, and the bugs or additional features we added have to be
updated/added accordingly."

What this means concretely:

1. PRESERVE (port as-is where its tests pass): the engineering core — geometry helpers and
   robust inset/outset, roof conversion engines (gable, hip, straight-skeleton, wavefront),
   the roof-AI pipeline and its artifact doorway, layout/fill and spacing, panel pose and the
   canonical footprint, the shading engine and worker protocol, the structure/member/foundation
   model, electrical sizing, stringing, DRC, routing, the six BOM emitters and money engine,
   the energy and finance models, the insight substrate, the five-layer fingerprint system,
   drawing/DXF generation. ~1,000 passing tests port WITH the code as the regression net that
   proves the port did not break the engines.

2. RESHAPE: the UI/UX of every screen per the new design (F7 laws + the 54 sitting rulings),
   the shell (platform-native auth, tenancy, server-side designs per S11-3), and the extraction
   of market data into packs (S1-6, S6-4, S9-1). Rendering, interaction and layout are redesigned;
   the maths beneath them is not re-derived.

3. RESTRUCTURE: the code is placed according to the V2 project's architecture and conventions
   (the main suite's stack, module boundaries and design system) — file layout and naming change;
   algorithm behavior does not.

4. FIX + ADD: the 56 defect-register entries are the correction list, and the 115 owner-ruled
   fixes/additions across the 11 sittings are the change list. Each carries its target
   requirement id, so "port, then apply this list" is a complete instruction.

5. PORT MAP: `prd/_process/studio/inventory/file-claims.md` maps all 287 POC source files to
   their owning studio area, and every requirement's `CODE.*` pointer resolves to the ledger row
   naming the exact file and line the behavior lives at today. The ledgers are therefore the
   port's working map, not just PRD evidence.

Consequence for planning: studio effort is a PORT + UI REBUILD + defect/feature application —
not a green-field build of the engineering core.
