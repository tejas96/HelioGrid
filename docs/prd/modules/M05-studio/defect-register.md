# Studio defect register — POC-DEFECT rows with owner rulings

Seeded empty at Task 0. Each sitting's authoring appends its rows.

| defect (CODE key) | code-faithful behavior | evidence | owner ruling (date) |
|---|---|---|---|
| CODE.step1-setup.11 | Ground Mount PRO-locked, dead toggle | Step1Setup.tsx:154-170 | S1-1: un-gate, every plan (2026-08-05) → MS1-09 |
| CODE.step1-setup.21 | 5 MB logo cap advertised, never enforced | Step1Setup.tsx:298-313 | S1-2: enforce for real + logo from tenant branding (2026-08-05) → MS1-11/12 |
| CODE.step2-roof-drawing.87 | pinch-zoom/two-finger pan absent | SatCanvas.tsx:139-223 | S2-1: touch pack added (2026-08-05) → MS2-03 |
| CODE.step2-roof-ai.62 | photo-mode endpoint has no in-app caller | gemini/route.ts:98-114 | S2-2: wired at P1, survey/drone photos (2026-08-05) → MS2-42 |
| CODE.step2-roof-ai.72 | cross-check tested but unreachable (ladder exclusivity) | gemini-client.ts:103-145 | S2-3: second-opinion button wires it (2026-08-05) → MS2-37 |
| CODE.step3-obstructions.32 | Casts-shadow toggle dead for all factory objects (live repro) | Step3Obstructions.tsx:617-621 + capabilities.ts | S3-1: switch made real (2026-08-05) → MS3-28 |
| CODE.step3-obstructions.8 | No undo/redo trigger on the step | grep: dispatch undo only Steps 2/6 | S3-2: buttons+shortcuts added (2026-08-05) → MS3-05 |
| CODE.step3-obstructions.29 | Typed dims unclamped (0/negative commit) + keystroke undo | Step3Obstructions.tsx:528-601 | S3-3: commit-on-blur + floors (2026-08-05) → MS3-26 |
| CODE.step3-obstructions.30 | Slider drag floods undo stack | ui.tsx:144-208 | S3-3: one gesture = one entry (2026-08-05) → MS3-27 |
| CODE.step3-obstructions.12 | Rect obstruction edge labels missing | Step3Obstructions.tsx:425-434 | S3-5.2 (2026-08-05) → MS3-09 |
| CODE.step3-obstructions.17 | Label numbering collides after deletion | roof-factory.ts:213 | S3-5.1: next-free-number (2026-08-05) → MS3-14 |
| CODE.step4-components.8 | pickers bypass resolved catalog envelope | Step4Components.tsx:18-19 | S4-1: DD12 alignment (2026-08-05) → MS4-05 |
| CODE.step4-components.20 | panel swap silently resizes placed modules | Step4Components.tsx:135-141 | S4-2: guard dialog both paths (2026-08-05) → MS4-12 |
| CODE.step4-components.23/.24 | datasheet + manual entry paths are dead captions | Step4Components.tsx:765-779 | S4-1: all three paths real + Excel (2026-08-05) → MS4-06 |
| CODE.step4-components.37 | no-fit inverter state renders nothing | Step4Components.tsx (absence) | S4-3: explain + nearest fits (2026-08-05) → MS4-19 |
| CODE.step4-components.5/.13/.21/.22/.26/.28/.39 | input & state hygiene (7) | Step4Components.tsx various | S4-4 batch (2026-08-05) → MS4-02/10/11/14/15/21 |
| CODE.step4-components.29/.32/.42 + availability | polish (4) | Step4Components.tsx various | S4-5 batch (2026-08-05) → MS4-17/16/20/08 |
| BATTERY (absent entirely) | no battery section/type/catalog in POC | grep: 0 hits | S4-1: first-class section (2026-08-05) → MS4-24/25 |
| CODE.step6-layout.65 | structure disclaimer absent on flush tables | Step6Editor.tsx:2168 | S5-1a: always shown (2026-08-05) → MS6-22 |
| CODE.step6-structures.52/.68 | foundation buttons bypass allowed-options; silent clamp | structure.ts + Step6Editor | S5-1b: offered ⊆ allowed (2026-08-05) → MS6-39/47/51 |
| CODE.step6-layout.32 | Clear strings leaves cable routes → phantom routed cable | Step6Editor.tsx:2394-2406 | S5-1c: routes cleared too (2026-08-05) → MS6-25 |
| CODE.step6-layout.80 | hardcoded 10 kW studio plan cap + demo upgrade | Step6Editor.tsx | S5-2: removed, entitlements at save (2026-08-05) → MS6-29 |
| CODE.step6-scene3d.6 | no visible orbit/zoom controls in 3D | Scene3D.tsx (absence) | S5-3: control cluster added (2026-08-05) → MS6-30 |
| CODE.step6-layout.18 | Copilot suggestions have no accept/dismiss | Step6Editor.tsx | S5-4: wired (2026-08-05) → MS6-05 |
| CODE.step6-layout.46/.29 + scene3d.8/.19 + structures.41/.51 (+2) | consistency & polish (8) | various | S5-5 batch (2026-08-05) → MS6-15/06/31/32/49/21/10 |
| CODE.step7-proposal.90/.152 | never-paying system reports "25 years"; ranking sorts the sentinel | finance.ts + comparison.ts | S6-1a: no-payback state (2026-08-05) -> MS7-32/50 |
| CODE.step7-proposal.33/.27/.34 | cover staleness laundered + invisible | Step7Proposal.tsx | S6-2 (2026-08-05) -> MS7-09/10 |
| CODE.step7-proposal.38/.39/.138 | provenance/freshness missing at customer exits; undefined leak | Step7Proposal + narrative | S6-1b (2026-08-05) -> MS7-14/44 |
| CODE.step7-proposal.139 | "% of available sunlight" misstates a floored score | proposal-narrative.ts | S6-1c (2026-08-05) -> MS7-45 |
| CODE.step7-proposal.88/.92/.98/.87 | money: rounded energy, gross lifetime, lease basis, 100% offset | finance.ts + financing.ts | S6-3 (2026-08-05) -> MS7-30/31/33/34 |
| CODE.step7-proposal.91/.60/.66/.53 | escalation/degradation/climate/fallback hardcoded | finance.ts + solar.ts | S6-4: pack-driven (2026-08-05) -> MS7-19 |
| CODE.step7-proposal.109/.24 | commercial + data-quality analyzers missing; implicit registry | insights/registry.ts | S6-5 (2026-08-05) -> MS7-36/12 |
| CODE.step7-proposal.65 | no inverter clipping in the energy chain | solar.ts | S6-6 (2026-08-05) -> MS7-20 |
| CODE.step7-proposal.2/.9/.17/.58/.68/.127/.128/.132 | report & UI batch (8) | various | S6-7 (2026-08-05) -> MS7-01/03/06/21/23/42 |
| CODE.step8-sld.35 | SLD prints legacy 10/6 mm2 AC cable while BOM sizes properly | sld.ts | S7-1a: one source of truth (2026-08-05) -> MS8-12 |
| CODE.step8-sld.30 | earth-pit count hardcoded 3 vs BOM's derived 2(+1) | Step8Sld.tsx | S7-1b (2026-08-05) -> MS8-13 |
| CODE.step8-sld.16/.84 | Step 8 auto-string uses degraded legacy shim, swallows refusals | stringing.ts | S7-1c (2026-08-05) -> MS8-07 |
| CODE.step8-sld.52 | rating dialogs cannot represent legally derived values | Step8Sld.tsx | S7-1d (2026-08-05) -> MS8-21 |
| CODE.step8-sld.2/.13/.37/.39/.41/.42/.43 | drawing accuracy (7): fake zoom, contradictory paper/scale, wrong footprints, phantom legend, static detail, numbering | Step8Sld.tsx | S7-2 batch (2026-08-05) -> MS8-02/16/17 |
| CODE.share.109/.92/.94/.44 | proposal has no number/date/version/validity; internal name printed; bad pagination | ProposalView.tsx | S8-1 (2026-08-05) -> MS9-01/02 |
| CODE.share.107/.108/.14 | no readiness gate; inconsistent status marking; any design served | ProposalView + routes | S8-2a (2026-08-05) -> MS9-06/07 |
| CODE.share.101 | issued proposal mutates with later edits (no pinning) | ShareViewer.tsx | S8-2b (2026-08-05) -> MS9-08 |
| CODE.share.98/.99/.100/.11 | one permanent unnamed link; no revoke/attribution/acceptance | store + routes | S8-2c (2026-08-05) -> MS9-09/10 |
| CODE.share.35/.62/.63 | staleness stripped from print; no per-capture badge; wrong caption | ProposalView.tsx | S8-3a (2026-08-05) -> MS9-16 |
| CODE.share.80/.24 | structure disclaimer conditional/absent on customer surfaces | ProposalView + ShareViewer | S8-3b (2026-08-05) -> MS9-17 |
| CODE.share.59/.75/.83/.73 | false no-estimates claim; ineligible subsidy text; no BOM provenance; -Rs0 | ProposalView.tsx | S8-3c/d/e (2026-08-05) -> MS9-18/19/20 |
| CODE.share.106 | anonymous share hydrates operator's entire project store | app layout | S8-4.1 (2026-08-05) -> MS9-12 |
| CODE.share.4/.5/.7/.8/.13/.16/.27/.28/.29/.37/.41/.53/.54/.61/.64/.70/.97 | robustness/privacy/polish batch (17) | various | S8-4 (2026-08-05) -> MS9-11/13/15/21/22/23/24/25/27 |
| CODE.step9-bom.41 | flat discount re-clamped per section — sections don't reconcile to total | BomSection | S9-2 (2026-08-05) -> MS10-11 |
| CODE.step9-bom.151/.153-.157/.28 | prices, tax, subsidy, constants, wind, checklist India-hardcoded | data/* + rules/india.ts | S9-1: pack-driven (2026-08-05) -> MS10-39/32/10 |
| CODE.step9-bom.24/.39/.71 | wind only in high zones; discount control desync; tooltip-only derivations | various | S9-3 (2026-08-05) -> MS10-08/03/19 |
| CODE.step10-done.132/.131/.117/.59 | NO engineer sign-off queue/review/return anywhere; approval survives duplication; unapproved designs served | src/features/solar-studio (absence) | S10-1: full flow built (2026-08-05) -> MS11-13..17 |
| CODE.installation.9/.11/.14/.16/.35/.36/.51/.56/.60/.61/.62/.64/.18/.53/.4/.7/.24/.29/.30 | installation sheet: wrong derivation, missing materials, no identity, no print CSS, device-local ticks, no attribution (19) | InstallationSheet + installation.ts | S10-2: rebuilt as field document (2026-08-05) -> MS11-28..37 |
| CODE.step10-done.21/.22/.122/.8/.37/.52 | copy silent; duplicate hijacks session/undo; capture rule vs stated law; open-insight count; cover staleness | Step10Done + review.ts | S10-3 (2026-08-05) -> MS11-04/26/25/09/11 |
| CODE.shell.1/.2 | phantom Step 5: named, counted, URL-reachable with no page | Wizard.tsx | S11-1: nine visible steps (2026-08-05) -> MS12-01 |
| CODE.shell.55/.51/.102/.83 | dead forgot-password; misleading delete copy; legacy dead route + export | Login/Dashboard/router | S11-2 (2026-08-05) -> MS12-17/14/27 |
| CODE.shell.52-.56/.37/.65-.83/.20 | mock auth, placeholder languages, browser-only storage, no lead scoping | shell area | S11-3: platform-native (2026-08-05) -> MS12-17/18/20/10 |
