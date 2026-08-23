Four capabilities the voice-agent screens need. They belong together because they are all the same
owner, at the same desk, configuring the thing that will talk to their customers unsupervised —
and three of the four are about **making the machine's behaviour legible before it runs**.

Two of them are largely already built and need one leg. I have said which.

**Don't ask me how it should look.** The system owns that.

## Patterns already settled — compose with these, don't re-answer them

- **`ReorderList`** — an authored list with arrow reorder, delete, and focus rules. **§2 is mostly
  this.**
- **`ValueSource`** — which layer supplied a value. **§4 is mostly this.**
- **`ActivityStream`** — typed entries with `actorClass`, filtered through `FilterSet`.
- **`Tabs` / `SegmentedControl`** — took `count` and `disabled` last round.
- **`ActionReason` / `ScopeNote`**, **`NamedGap`**, **`UnavailableNote`**, **`FieldOverride`**.

## 1 · A transcript has a door and nothing behind it

`AudioPlayer.d.ts` declares the door and says why it matters:

```ts
onOpenTranscript?: () => void;
```

> *"The transcript survives in all three states — **always give it somewhere to point**."*

`AudioPlayer.jsx` renders that as a `TextAction` whose target is the caller's problem. **No
component renders turns.**

This is not optional chrome. `M07-38` makes the transcript **the artefact that outlives the
recording**: *"Recording is purged at the pack's retention bound; **the transcript is retained**."*
So on any call older than the retention window, the transcript is the only record of what the
agent said to a customer.

What it has to carry:

> `SCR-M07-13`, state `transcript-on-tap`: *"the full transcript open, **in the call's language,
> labelled**."* Data volume: *"Design the transcript for **a full conversation's length on a
> phone**."*
>
> `SCR-M07-19`, state `transcript-open`: the same, reachable from the call log.

`Timeline` is the nearest thing and is wrong on its API rather than its name — a conversation has
no current step, no completion and no alternating-speaker concept, and `TimelineItem` has **no
language slot**.

`ActivityStream` is the closer relative now, and it is a real question whether this composes with
it or is distinct. A transcript **is** turn-by-turn with two parties, which looks like
`actorClass`. But it has no `kind`, no filtering, no day grouping, and its "actors" are two fixed
participants rather than four classes. Decide and say which — reusing `actorClass`'s vocabulary
while being its own component is a legitimate third answer.

One thing to get right: **the language label is per transcript, not per turn** — the call happened
in one language — but `M07-25` allows an agent to switch language mid-call, so the label has to be
able to say that rather than assert one language falsely.

## 2 · A rules list where one row is protected by law

**Most of this is `ReorderList`.** It already does an authored list a person adds to, reorders and
deletes, with the focus rules worked out. What it does not have is the one thing this screen turns
on:

> `M07-11` (P0), `SCR-M07-05`: *"Hand-over rules are a list the owner **edits, adds to or
> removes** — price questions · angry customer · asks for the owner · a question it can't answer ·
> asks to stop — each with what the agent says as it hands over. Sensible defaults, none forced —
> **except 'asks to stop', which is the statutory opt-out and cannot be removed**."*
>
> State `floor-blocked-save`: *"deleting 'asks to stop' **refuses the save with the floor
> named**."*

So: a row that cannot be deleted, **because law requires it** — not because an admin switched it
off, and not because the user lacks permission. Nothing in the system expresses that. `Menu` has
`destructive?: boolean` on an action, which is a delete affordance, not a row lifecycle.

Three things make this more than a `disabled` flag:

- **The reason is a compliance floor, and it has to be sayable.** You built `ActionReason` for
  exactly this shape last round — a control that stays and explains. The question is whether a
  locked row reuses it or needs its own wording, since *"this is the statutory opt-out"* is a
  different class of reason from *"draw a roof first"*.
- **`floor-blocked-save` refuses at save, not at click.** So the delete may be attemptable and the
  save is what refuses — or the delete is unavailable up front. Either is defensible; pick one and
  say why, because the brief names the state at the save.
- **Each rule carries what the agent says.** These are not label-only rows; each has an authored
  response, which makes the row a small editor rather than a line of text. `M01-57` needs the same
  shape for message templates.

## 3 · A six-language switcher cannot show which languages are actually written

Half of this is expressible today and half is not, so I am asking only for the half that is not.

> `SCR-M07-09`, state `language-fallback`: *"content is editable per agent language where the owner
> wants distinct wording; a section answered in one language **falls back to the tenant's primary
> agent language rather than silence** — the design must show **which language a section's content
> actually comes from**."*
>
> Data volume: *"Eight fixed sections… each holding owner-written content, potentially per agent
> language (**up to the six agent languages**, `M07-15`), with fallback to the tenant's primary."*

**The per-section statement is fine** — `Textarea`'s `helper` can carry *"Falling back to Hindi"*,
and `ValueSource` is arguably the better answer since "inherited from the primary" is precisely
which-layer-supplied-this.

**The switcher is the gap.** `Tabs` and `SegmentedControl` took `count` and `disabled` last round,
but neither has per-item state, so a six-language switcher cannot distinguish *authored here* from
*inherited*. The owner sits down to write agent copy in six languages across eight sections — 48
cells — and **cannot see the shape of the work**: which languages are done, which are empty, which
are riding on the fallback.

`Accordion`'s `meta` sits on the **section**, not on the language, so it cannot answer this either.

Worth noting the interaction with §2 and with `SCR-M07-05`: the hand-over rules also carry
per-language responses, so whatever the switcher becomes is used in at least two places on this
screen pair.

## 4 · Two kinds of holiday, and only one of them is the tenant's to delete

**This is `ValueSource` applied to dates**, plus a set `DatePicker` cannot hold.

> `SCR-M07-06`, state `holiday-calendar`: *"the market's **pack-supplied** holiday calendar plus
> **tenant-added** extra holidays."*
>
> `M07-12` permits *"narrower windows and extra holidays only, **never wider**"* — so the tenant
> may add and may remove their own, and may never remove a pack-supplied one, because that would
> widen the calling window past what the market allows.

Live, `DatePicker` is `mode?: "single" | "range"` — **a set of unrelated dates cannot be held,
added to or removed at all.** `markers?: Record<string, DayMarker>` is display-only, and
`DayMarker` is `{tone?: …; label?: string}` where the label is documented *"read out by screen
readers and used as the tooltip"*.

So both origins collapse onto the single `holiday` tone, **their only differentiator is a
tooltip** — which `F8-07` rules out for exactly this kind of provenance, and which never fires on
the phone this is configured from.

Three things to carry: a **set** mode that holds unrelated dates; the **origin** shown as
persistent content, not a tone or a tooltip; and **deletability following origin** — which is a
permission-shaped fact, so `ScopeNote` / `ActionReason` may already be the right renderer for *"the
market supplies this one."*

`F1-48` is where pack-supplied holidays come from, so the origin is a real data distinction the
application will hand you, not a display convention.

---

## Deliverables

Same conventions: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` with realistic Indian solar
content, and the cards updated so changed parts render with real content.

> **Do not judge for yourself which files teach a behaviour.** For each item, **search the whole
> project for the old form** — the literal string or prop you just replaced — and paste the list
> of every file that still contains it. Fix every one, then search again until the list is empty.
>
> Search all of it: `.jsx`, `.d.ts`, `.prompt.md`, every `*.card.html`, everything under
> `templates/`, `readme.md`, `SKILL.md`, `_ds_manifest.json`. **Include the unused half of a
> file.** If a search comes back empty, say so — that is the evidence, not the claim.

Tell me:

- for **§1**, whether the transcript composes with `ActivityStream` or is its own component, and
  how a mid-call language switch is labelled;
- for **§2**, how a row says it is locked by law, and whether the refusal happens at delete or at
  save;
- for **§3**, how the switcher shows authored-versus-inherited per language, and whether the
  per-section statement is `ValueSource` or `helper` text;
- for **§4**, how a date set is held, how origin renders as persistent content, and what a tenant
  sees when they try to remove a pack-supplied date.

If any item is already fixed since my read, say so plainly rather than redoing it.
