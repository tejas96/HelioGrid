# SCR-M01-21 · Message Template Settings

Per-language templates for share, follow-up nudge and reminder, with variables and live preview.

**Module:** M01 · Onboarding & tenant config · **Personas:** EPC Owner · **Context of use:** owner-only settings work, web-emphasis at a desk (M01 §2), fully mobile-capable — the templates it authors are consumed by reps on phones at share/follow-up moments. Permission: `F2.M01.manage-tenant-settings` (EPC Owner; M01 §M01.8 permissions).

## Entry & exit

Reached from: the tenant-config settings surface map — *Message templates* is a named surface in M01 §4's stable vocabulary; a deeper entry path is not pinned by PRD — designer decides, note the decision. Leads to: not pinned by PRD — designer decides, note the decision. What the screen feeds: the share and follow-up surfaces of M06 / M07 consume the composed output; the campaign lane (M03) remains a separate surface (§M01.8 behavior detail).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-55** (P0) — **Message templates are tenant data, authored per language, for the transactional moments the product composes:** the proposal share message, the follow-up nudge, the reminder. Templates exist in all launch languages as authored content — never translation-catalog strings (F3-10). The composed message **sends from the tenant's connected transactional channel where one exists, and is copy-paste for a person to send where none is** (owner ruling 2026-08-04, Q33 — `M03-03`; on the fallback path the app claims no delivery, D32's surviving discipline). Missing-language behaviour follows the ruled fallback: show the original language with a small note (owner ruling 2026-08-04, Q10; `F3-10`). _(non-UI half, build-side: per-language tenant content class; sends via connected transactional channel where one exists, else copy-paste with no delivery claim — for awareness, not for drawing)_

## States

- **Loading** — templates and language variants loading.
- **Empty** — a tenant that has not authored templates: working platform defaults apply per M01-28's zero-config law; teaching treatment per F7's empty-state contract.
- **Error** — a save fails; what happened and what to do next.
- **per-language-authoring** — each of the three transactional templates (proposal share message, follow-up nudge, reminder) authored per launch language as tenant content, never translation-catalog strings (M01-55).
- **variable-preview** — each template shows its variables (customer name, proposal link, amount) and a live preview per language (§M01.8 behavior detail; M01-30's law).
- **missing-variable-gap-visible** — a template referencing a variable the context lacks previews with the gap visible and composes with a safe omission, never a raw placeholder in a customer's message (§M01.8 edge cases).
- **missing-language-fallback-note** — the missing-language case shows the original language with a small note per Q10's ruled fallback (M01-55; §M01.8 edge cases).

## Data volume

Three template moments (share, follow-up nudge, reminder) × all launch languages — the committed scope is tenant message templates in 3 languages (M01-55 source pointer, `DOC14.message-templates`). Each template is a short message body with a small variable set; the preview renders one composed message per language.

## Numbers carrying provenance

- **The "amount" variable in the preview** — amount rendering obeys F8's staleness and F3's money format (§M01.8 behavior detail); it carries its F8 provenance tier in the design.
- No other user-visible money/date/computed numbers originate on this screen; customer name and proposal link are non-numeric variables.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `Offline` state and a matching online-only sentence in Context of use (`F4-09`). Both are deleted.*
