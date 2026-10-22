# SCR-M01-09 · First-Run Profile

Minimal profile capture: name and optional photo.

**Module:** M01 · **Personas:** Invited Employee · **Context of use:** the second step of invited-user first-run — mobile-first, "Phone, almost always" (M01 §2). Part of the under-two-minutes path from invite tap to useful role home (M01 §M01.2 context, M01-17).

## Entry & exit

Reached from: Invite Landing (SCR-M01-08) after OTP verification — "the next screen is name/photo, then the role card, then their role's home with their real assigned work" (M01 §M01.2 acceptance). Leads to: the Role Explainer (SCR-M01-10).

## Requirements (verbatim)

### From `docs/prd/modules/M01-onboarding-and-tenant-config.md`

- **M01-14** (P0) — **Profile capture is minimal: name, photo (optional). That is all.**

## States

Base: **loading** · **empty** · **error**.

- **loading** — placeholders for the label line, the field, the helper lines and the photo helper, so
  the photo act and the act stay where `normal` puts them; the act waits,
  its `disabledReason` *Your name is still arriving.*, which opens in a bubble on a tap, click, focus or hover — no line is drawn under the button (owner ruling 2026-10-17, design-system change 5).
- **empty** — the person has cleared the pre-filled name. The field never arrives blank: an invite
  always carries a name (`M01-12`; `inviteeNameSchema` is `min(1)` in
  `packages/contracts/src/invitation.ts`).
- **error** comes in two forms. `error-save` — the save was refused: a danger `Banner` says so, the
  name stays in the field, and the act tries again. `error-photo` — the name saved and the photo did
  not: the field says the name is saved, and the act reads *Continue without a photo*.

Screen-specific:

- **normal** — name plus optional photo; nothing else (M01-14).
- **photo-skipped** — the photo is optional; skipping it proceeds (M01-14).
- **photo-added** — the chosen photo fills the circle, with *Replace* and *Remove* beside it;
  *Remove* brings the initials back.

Drawn at 375 only (at 1536 the phone's answer holds at width): `loading`, `photo-skipped` (it is
`normal`), `photo-added`, and `empty` after the act is pressed.

**Decisions made in design (2026-08-31) — later screens inherit them.**

1. **The name is pre-filled, because the inviter already typed it.** `SCR-M01-07` has the inviter
   enter *Their name*, keyed to the invite just accepted. A blank field throws that away and makes a
   person retype what the product knows, on the screen whose promise is under two minutes (`M01-17`).
   One sentence beneath says who wrote it and that it is theirs to change.
2. **The photo is the repo's `PhotoField` (`packages/ui/src/components/PhotoField/`) — a circle
   with one act, never a `Dropzone`.** `Dropzone` is built for many files where this is exactly one,
   a dashed rectangle promises a rectangle when the crop is circular, and its held-on-device queue
   is wrong for an ordinary server write. On the phone the act opens the system photo library (ruling 19).
   `PhotoField` is extended to what the board draws:
   - the act is medium size and carries its icon;
   - a refused photo shows as the danger `Banner` inside the photo group, so a name that saved is
     not put in doubt;
   - at 1536 a photo can also be dropped onto the circle. Nothing drags on a phone, so the drop
     exists only there.
3. **The fallback is on screen, which is what makes *optional* honest.** Initials on `--accent-subtle`
   show the exact result of skipping. That is also why **no `Skip` control exists** — the photo has no
   gate to skip past, and a second act would invent a decision nobody has to make.
4. **The act is never gated on the field** (inherited from `SCR-M01-01`). Pressing it with the name
   cleared answers on the field that caused it; a greyed button on arrival offers neither reason nor
   route. The one exception is `loading`, where there is nothing to save yet.
5. **No shell, no step counter, no back control.** The person is two screens short of the
   role-decided home both shell forms are built around. *1 of 2* would misdescribe a corridor the
   product tells you rather than one you perform, and the only honest "back" would be un-joining.
6. **The language control is corridor chrome, not profile capture** — so it does not spend
   `M01-14`'s *that is all* ceiling. It is also **the invitee's whole language step** (owner ruling
   2026-08-31): `SCR-M01-03` is the signing-up owner's first-run screen and an invited
   employee never reaches it, because `F3-03` asks that a picker be REACHABLE at first run, not
   that every user be given a screen for it.
7. **At 1536 the name field takes initial focus, and Enter commits.**

**Rulings at the M01 board check (owner, 2026-10-16).**

8. **The sentence under the name is `Input`'s `helper`, in secondary text.** It is load-bearing, and
   `F7-11` keeps tertiary text off load-bearing words; the design system's `Input` draws `helper` in
   secondary text (a design-system change, as `PhotoField` already does for its message).
9. **The circle with no name is a plain disc** on `--canvas-sunken` — `PhotoField`'s own nameless
   form, no glyph.
10. **The heading stays *How your team sees you* in every state.** A state changes the data, the
    chip and the one act, never the heading.
11. **At 1536 the photo act reads *Choose a photo* with the upload icon** (a file is chosen there,
    not taken), and in `error-save` the refusal banner spans the task column, just above the act.
12. **At 1536 the screen is the onboarding two-pane** (owner ruling 2026-10-17, M01 design), the pattern
    `SCR-M01-07` and `SCR-M01-10` draw: the brand pane — wordmark, heading, and the three lines of decision 14 — on columns 1–4
    with the bloom, and the task pane on columns 5–12. The language control sits at the task pane's
    top right.
13. **On the phone the act sits right under the photo group**, never pinned to the frame's foot;
    on a short screen nothing fills the space below it.
14. **At 1536 the brand pane says why, and the task is one centred column** (owner pick "A + L2",
    2026-10-17, canvas comment). Under the heading, three lines replace the information button, each
    with an accent icon: *Suryodaya Solar sees this name beside everything you do.* · *A photo helps
    teammates recognise you.* · *You can change both later in Profile & preferences.* The task is
    one 440 px column in the exact middle of the task pane, as `SCR-M01-08` draws it: the photo,
    then the name, then the act at full width. The phone keeps its information button. The three lines
    never change by state, as the heading does not (decision 10), so the photo error at 1536 does not
    repeat where to add one later: it reads *Try again, or add one later.* The drop onto the circle
    needs no words: `PhotoField` highlights the circle while a file is dragged over it.

**Rulings at `T-M01-009` (owner, 2026-10-22).**

15. **The inviter is named, never given a pronoun** (`SCR-M01-08` ruling 15): the helper reads *{first} typed this when inviting you — change it if you like.*, and the empty form *{first} had typed {name}; type the name your team should use.*
16. **The photo is the company's view of you:** one per company membership, never one shared across companies.
17. **The step follows the join and is not stored:** a reload or a later visit goes to the home; name and photo are changed later in Profile & preferences (`SCR-M01-11`).
18. **A person whose account already had a name skips this step** — the name is their own, and the helper would be false.
19. **The phone's act opens the photo library** — no camera prompt; the act keeps the camera glyph the board draws.

## Data volume

One profile record: one name field, one optional photo. That is all (M01-14).

## Numbers carrying provenance

None — this screen shows no user-visible number, money amount or date.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` base state. It is deleted.*
