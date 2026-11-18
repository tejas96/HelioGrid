# M05 · Design studio — engineering tasks

This file carries the 3D Design Studio, rebuilt from scratch. Task ids use the prefix **`T-M05-`**.

**Source docs.** The studio has no PRD file. Each task's acceptance lines are written here and
approved by the owner before its build. Where a task meets a live PRD row it cites the row.

**The design.** A screen in this file is built to match its approved sample. Each task names it.

**The wall.** The studio is a box that other products can use later. Three rules hold in every
task of this file:

1. The studio's wire shapes (`packages/contracts/src/studio/`) and its pure logic
   (`packages/domain/src/studio/`) name no lead, customer, proposal or project. A
   dependency-cruiser rule refuses the import.
2. The host gives the site. In HelioGrid the site facts live on the lead; the api's studio module
   turns them into the studio's site and back, and reaches the lead only through the CRM module's
   public surface.
3. `design.lead_id` is the one place a design points at CRM.

---

## Screen tasks

### T-M05-001 · Open a design — the lead door, Site details and the Proposals door
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** none
**DESIGN:** SCR-M05-01 · SCR-M05-02
**Why:** a rep at the customer's house starts a design from the lead in one tap, with the site facts the lead already holds, and finds each design again on the lead and in Proposals.
**Sample:** the approved Studio Entry Screens, <https://claude.ai/artifact/EgsuiBXq9of4g7u2P62wPA> — the lead page, Proposals and Site details, at phone and desktop width, light and dark.

It also changes two built screens: the lead page (the dock's Create design and the Designs
section) and the Proposals list with its start sheet (`M06-05`, entry 1).

#### Parts

| Part | Holds | Status |
|---|---|---|
| `T-M05-001a` | the `design` record, the roles, Create design on the lead, the Designs section, Site details with the address search and the pin map, the design page | done |
| `T-M05-001b` | the Proposals list's 3D chip and 3D row, and With 3D design in the start sheet | done |

**Roles.** `studio.create_edit_designs` is held by the EPC Owner, the Design Engineer, the Sales
Manager and the Sales Executive. Reading a design follows the lead's visibility, with no grant of
its own.

**Site facts.** The address, the area, the supply phase and the sanctioned load are the lead's
already. This task adds the site name, the pin's coordinates and the utility operator beside them.
Where the panels go (roof or ground) is the design's. The states and their operators are the
market pack's utility directory (`F1-53`).

**The map under the pin** is one page of the web app, `/embed/site-map`. The web draws it in
place; the phone shows the same page in a web view, so the three platforms draw one map. It is
Google's map now.

**DONE WHEN — part a:**
- Given a lead I can see and the right to design, when I tap Create design, then "Design N" is made with the next number for that lead, and Site details opens with the lead's address, state, phase and load filled. On web, iOS and Android.
- When I pick a suggested address, or type or paste coordinates, then the map shows the place with a pin, State is filled from the place, and the DISCOM is picked when the state has only one. Wrong coordinates are refused with the reason.
- When I tap the map, drag the pin or use the bigger map, then the pin's coordinates show under the map, and Put it back returns the pin.
- Start design is off, with its reason, until a location is set; nothing else is required. When I tap it, the site facts are saved on the lead, each as a timeline entry, roof or ground is saved on the design, and the design page opens.
- The Designs section shows one card per design, newest first, with Continue on a draft. Copy as a variant makes a new draft. At most one design of a lead is Recommended.
- The four roles above can create and edit on leads they can see. Any other person who can see the lead gets view-only, and a write answers 403. A lead outside my scope, or of another company, answers 404 on each design route.
- With the address search or the map down, typed coordinates still let me start. Each failed read says what happened and offers Try again.
- The studio's contract and domain files import no CRM, proposal or project code, and the check fails on a planted bad import.

**DONE WHEN — part b:**
- The Proposals list has a 3D chip first in its filter row, with its count. One chip is on at a time; with 3D on, the list holds 3D rows only.
- A design with no proposal shows as a 3D row: the customer, the 3D mark, the design's size or "No panels yet", a dash for the number and the price, the design's status, who and when. A tap opens the design.
- The start sheet has a third option, With 3D design, after Quick and Full, offered to who may design; the first pick stays the lead's own (Quick for a home, Full for any other, `T-M06-001`). Start makes a design and opens Site details; Back returns to Proposals with the new draft first. The option shows where the sheet opens: the Proposals list and the lead's Proposals section.
- An app version from before this part still reads the Proposals list.
- Roles and the other-company 404 are as in part a.

**Settle before the sign-off step:** a person who holds the Design Engineer preset alone reaches
no lead today — its lead visibility is "assigned", which the code reads as a booked visit that
names the person, and only a surveyor is booked. Such a person can open no design. The owner rules
how a design reaches its engineer (`F2.M02.lead-visibility`, `F2.M05.approve-designs`).

**Not in this task:** the canvas, the design document, undo, autosave and versions — they start
with the roof step. The card's picture, kWp and kWh join it in the steps that make them; until
then a card says "No panels yet". Sign-off and its three later statuses come with the result step.
A second map beside Google's (Apple's, with "Use this map") is the owner's wish for later: it
joins the one map page, after its own sample and the owner's Apple Maps keys.
