# SCR-M07-07 · Test Agent

Owner calls themself or types a conversation against the current draft config.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner only — test-the-agent rides the same grant as configuration (`F2.M01.configure-agent`, M07 §M07.3) · **Context of use:** web emphasis for setup (M07 §2), with the self-call landing on the owner's own phone; used immediately after editing config, before publish.

## Entry & exit

Reached from: tenant configuration's agent & voice surface list — M01-57 names "Test the agent ('the most important screen here' — call yourself or run a typed conversation)"; naturally follows any edit in guided setup (SCR-M07-05) or the knowledge base (SCR-M07-09 — the tone/knowledge mismatch is caught here and in the KB preview, M07 §M07.3 edge cases). Leads to: back to the draft config to keep editing, or on to publish (versioned-append, M07-14 — SCR-M07-08's slice). Not otherwise pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-13** (P0) — **Test the agent — "the most important screen here."** The owner calls themself, or runs a typed conversation, and hears exactly what a customer hears before anyone else does. The test renders the *current draft* config so a change is heard before it is published.

## States

- **Loading** (base) — preparing the test against the current draft config.
- **Empty** (base) — no conversation yet: the two ways in (call yourself · typed conversation) presented; never a blank.
- **Error** (base) — a test call or typed run that fails is acknowledged honestly; no customer-facing call is ever affected (M07 §M07.3 acceptance).
- **typed-conversation** — the owner runs a typed conversation against the draft config (M07-13).
- **self-call** — the owner calls themself and hears exactly what a customer hears before anyone else does (M07-13).
- **draft-config** — the test always renders the *current draft* config, so a change is heard before it is published — the design must make it unmistakable that what plays is the draft, not the published version (M07-13; §M07.3 acceptance: "it uses the draft configuration and no customer-facing call is affected").

## Data volume

One test at a time: a single typed conversation or a single self-call against the draft config. No lists on this screen.

## Numbers carrying provenance

- None pinned by the PRD for this surface. (Any figures the agent speaks in a test are renderings of the product's computed values under the same provenance law that governs real calls — F8-24/F8-06 as consumed by M07; nothing on this screen invents a number.)
