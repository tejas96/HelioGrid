# SCR-M07-09 · Knowledge Base

Eight-section structured KB editor in the owner's words with live preview.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner only (`F2.M01.configure-agent` — including every promotion into the KB, R10) · **Context of use:** web emphasis for setup (M07 §2) — a writing task in the owner's own words, revisited as real calls surface gaps.

## Entry & exit

Reached from: tenant configuration's agent & voice surface list — M01-57 names "Business knowledge base (structured, eight sections, seeded per market — never an empty page; the unanswered-questions one-tap loop)". The unanswered-questions screen's one-tap answer writes into a named section here (M07-18, SCR-M07-10), and the corrections review queue's owner promotion lands here too (M07-26, SCR-M07-11). Leads to: the KB preview (this screen's slice, M07-21) and Test Agent (SCR-M07-07) to hear the knowledge before it goes live. Not otherwise pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-16** (P0) — **The knowledge base is structured and reviewable, in the owner's own words — not a document upload.** Eight sections: About us · Products · Warranty · Process & timeline · Pricing & offers (what the agent may say about price is the owner's call, D36) · Subsidy/incentive (market-pack colour, F1-33) · Financing · Common objections. Brand and model names are never translated (F3 law, cited).
- **M07-19** (P0) — **A knowledge base that contradicts itself is flagged on save** (two different warranty answers), before the agent can speak either. _(non-UI half, build-side: contradiction detection runs at save, before agent can speak either — for awareness, not for drawing)_
- **M07-21** (P1) — **The KB preview shows the agent using the knowledge** — the same live-preview law as every config screen (`M01-30`), here specifically so a tone/knowledge mismatch is caught before it goes live.

## States

- **Loading** (base) — opening the eight sections with their current content.
- **Empty** (base) — no true empty: every new tenant starts seeded with a solar-industry default pack — never an empty page (M01-57; M07 §M07.4 behavior context — *"Day one it works; week four it sounds like them."*).
- **Error** (base) — save failure acknowledged honestly; the owner's writing preserved.
- **seeded-default** — the day-one state: all eight sections holding seeded, generic-but-correct content the owner has not yet made their own.
- **contradiction-flagged-on-save** — a save that gives two different answers to the same question (two different warranty answers) is flagged at save time, before the agent can speak either (M07-19) — including when two owners answer the same question differently (M07 §M07.4 edge cases).
- **live-preview** — the KB preview shows the agent using the knowledge, so a tone/knowledge mismatch is caught before it goes live (M07-21).
- **language-fallback** — content is editable per agent language where the owner wants distinct wording; a section answered in one language falls back to the tenant's primary agent language rather than silence (M07 §M07.4 behavior detail) — the design must show which language a section's content actually comes from.

## Data volume

Eight fixed sections — About us · Products · Warranty · Process & timeline · Pricing & offers · Subsidy/incentive · Financing · Common objections — each holding owner-written content, potentially per agent language (up to the six agent languages, M07-15), with fallback to the tenant's primary agent language. Design for a KB that has grown for weeks through the unanswered-questions loop, not just the seed.

## Numbers carrying provenance

- None computed by the product on this surface: KB content is tenant data in the owner's own words. What the agent may say about price is the owner's call (M07-16), but any figure the agent actually speaks remains a rendering of the product's computed values under F8 law (F8-24/F8-06 as consumed by M07) — the KB never becomes a side-channel for numbers.
- Brand and model names are never translated (M07-16) — identity data, not figures.
