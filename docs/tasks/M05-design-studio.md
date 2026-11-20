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

### T-M05-002 · The roof step — draw, type or set up the roof, with its walls, levels and checks
**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M04-07 (P0), M04-10 (P0), M04-13 (P0), M04-22 (P0), M04-29 (P0), M04-30 (P0), M04-34 (P0), M04-35 (P0), M04-53 (P0) — in V1 the roof step is the remote survey; the V2 survey tasks keep these rows' physical half
**DESIGN:** SCR-M05-02
**Why:** a rep or a designer gets the customer's real roof — its outline, heights, slopes, walls, stair rooms and what a remote look cannot see — in minutes, by AI, by drawing or by typing its size, so the later steps place panels on a roof that is right.
**Sample:** the Studio Journey sample, <https://claude.ai/artifact/Hfytfs3EZ1uKP63dLnXdf3> (v32) — paths A to J, phone and desktop, light and dark.
**Depends on:** migration 0071.

#### Parts

One branch and one PR hold the task. Each part is tested, shown to the owner, and committed on
their yes.

| Part | Holds | Status |
|---|---|---|
| `T-M05-002a` | the canvas: the design document, autosave and one editor, undo, the 3D scene on the picture, 2D and 3D, the picture chip, metres or feet, the phone's web view | open |
| `T-M05-002b` | draw and fix a roof: corners, close, lengths and their trust, one true length, edit after close with the magnet | open |
| `T-M05-002c` | type the size: a rectangle, edge by edge, no picture | open |
| `T-M05-002d` | your own picture: a photo, a drone map or a CAD plan, north, one length sizes both | open |
| `T-M05-002e` | many roofs, materials, roof shapes and walls: levels, openings, dormers, the switcher, walls in one setting, setback and path | open |
| `T-M05-002f` | the ready checks, site photos and versions | open |
| `T-M05-002g` | height data and the site: heights from the height map, the height view, the sun, neighbours and trees for shade, the picture's age, every data level | open |
| `T-M05-002h` | the AI setup and the AI count | open |
| `T-M05-002i` | the road view, the other places (carport, water, wall) and the pin | open |

**Roles.** `studio.create_edit_designs` — the EPC Owner, the Design Engineer, the Sales Manager and
the Sales Executive — edits, on leads they can see. Anyone else who can see the lead opens the
studio read-only, with no handle and no edit control, and a write answers 403. A lead outside my
scope, or of another company, answers 404 on every route of this task. The AI setup needs no key
of its own: it is editing, counted by the AI allowance.

**How it is built.** The studio is one page of the web app; the phone opens the same page in its
app, signed in, as the map under the pin already is, so the web, iOS and Android show one studio.
The scene is three.js with react-three-fiber and drei, added with `pnpm add`. The
roof maths (area, inside, cuts, the magnet, typed shapes, units) is pure code in
`packages/domain/src/studio`; the design document's shape is in `packages/contracts/src/studio`;
the height measuring and the AI run in `apps/worker`, with their kernel in `packages/domain`. The
screens compose `packages/ui`'s parts (Sheet, Menu, SegmentedControl, Stepper, Chip, StatusChip,
Provenance); a new part only when none of these can hold the job.

**Values.**
- Every value the system sets can be changed by a person — typed, dragged or tapped — and then
  shows as set by a person; a reset brings the system's value back.
- Each value keeps its source, its tier and who set it: the system, the AI or a person.
- A tier is one of `F8-02`'s four. Traced on a picture, or read from the height map, Google's
  roof faces, a drone map or a CAD plan: `derived`. Read by the AI from a picture or a road photo,
  or typed by a person: `estimated`. A length a person marks as measured on site: `measured`. A
  default from the market pack: `assumed`. A figure made from others takes the weakest of their
  tiers.
- Lengths are stored in metres and shown in the user's metres or feet (`F3-23`).

**Look and motion.** Hyper-real, never toy-like: the picture lies on the ground, the materials
are real, the sky has the real sun for the place, the date and the hour, and soft shadows follow
it. Models such as trees and tanks are made in the local Blender. Each render is judged beside a
real photo of the site. Each change of state moves; the camera flies and never cuts; a number
counts to its new value; a touch answers at once and a snap bounces; Reduce Motion turns each move
into a short fade. A weak phone shows less detail and the same numbers.

**Every place in the world.** The screens are the same with rich data (Google Solar HIGH), thin
data (BASE) and none (for example Dubai); only the source chips, the tiers and the questions
change. When a service does not answer, the studio says which, in plain words, and goes on with
what it has; drawing and typing the size always work, and nothing waits on a third party. Each
source the scene uses shows its credit line.

**DONE WHEN — every part:**
- Each new route names who may call it and what the other roles get, and an api test proves the other-company 404.
- The part's screens follow the sample at phone and desktop width, light and dark, in English, Hindi and Marathi.
- A web spec and a phone flow cover the part's main job, on one site of each data level (rich, thin, none; test pins from Solar's `findClosest`).
- The main job's taps are counted by a test.
- A check taps every state at phone and desktop width and fails on labels touching, a part leaving its card, or sideways scroll. Every new screen is looked at by eye beside the sample before the owner sees it.
- `code-reviewer` has reviewed it; CI is green.

**DONE WHEN — part a:**
- When I open a design, then the studio shows the site in 3D on the picture with the pin, on web, iOS and Android. The roof and its tools load first, the surroundings after. The first view takes under 2 seconds on a desktop and on a mid phone (the test runs it at 4× slower CPU).
- One canvas: a 2D top view and the 3D view of the same model, both editable, with a switch between them. On the phone a two-finger drag tilts; side views are in the view menu. The camera fits the roof into the free space above an open panel. On the phone a roof's settings open as a short sheet.
- The picture is picked by itself: Google's sky picture first, then the company's own, then the typed size. The picture chip names the picture, its source, its sharpness and the provider's credit line, and offers Sky picture, Your picture and No picture. No panel ever covers the credit line.
- Google's picture is fetched again each time the design opens and is never stored or put in a file; the roof is stored in the site's ground coordinates. When the picture fetched is newer than the one the roof was drawn on, the chip says once "Picture updated · check the outline".
- Given a confirmed building, when the survey is later reopened or opened by the designer, then the roof keeps its place and the date of the picture it was drawn on is shown (M04-10).
- With no picture to be had, the studio opens on a 1 m grid, says why, and offers Your picture and Type the size; the roof top is plain. Nothing waits.
- The design document is one stored document per design, with a schema version, in its own migration.
- Each change is saved the moment it is made; a save answers in under 0.3 seconds and the pill says Saved. A change that was saved is never lost when the app closes. With no connection the pill says "No connection · not saved", the change waits and is sent when the connection returns; nothing is kept on the device (`F4`).
- One editor at a time: while another person has the design open, I see it view-only with their name. A save carries the design's version: when someone saved first, mine is refused and the studio says who and when and offers to open theirs; nothing merges (`F4-15`).
- Undo and Redo walk back and forward through every change I made since the design opened, with no limit.
- Every length field has a metres-or-feet switch. The pick is the user's and follows them to every device (`F3-23`); the market pack sets the first pick (feet in the US); every length and area on the step follows it.
- The step rail shows Roof first; Objects, Panels, Wiring and Result are locked with their reason. "Add roof objects" stays off, with its reason, until one roof is closed; then it opens a placeholder until the Objects step is built.
- The empty scene keeps to the budget: under 150 draw calls and 300,000 triangles, 60 frames a second on a desktop and 30 on a mid phone; it draws only when something changes.
- The studio's contract and domain files import no CRM, proposal or project code, and the check fails on a planted bad import.

**DONE WHEN — part b:**
- When I tap Draw myself, then the camera flies to the top view. Each tap places a corner; the line stretches to my finger with its live length; a corner snaps square; after three square corners a ghost fourth corner is offered; a tap on the first corner or Close shape closes it. On the phone a loupe shows under my finger. While I draw, a corner snaps to a building corner or edge, to the design's other roofs and to a neighbour's wall. An edge that would cross another is refused with the reason. Cancel and Esc leave the roof as it was.
- When the shape closes, then the walls rise from the ground, the area counts up, the one small celebration plays once, the camera tilts to 3D from the side with the clearest view, and one note says where the height came from and that a corner can be dragged. Until part g, a roof's height is the market pack's storey height, `assumed`. The length labels come back when the walls have risen.
- Each edge shows its length: dashed from the picture, solid when typed, with a tick when measured on site. The longest length from the picture pulses: type it first.
- A tap on a length opens a field at the top, clear of the phone keyboard. The first length I type sizes the picture and every roof on it; a later one fixes its own edge; one more than 25% off the picture asks me once to confirm it. A "Measured on site" switch in the field, off at first, marks the length `measured`. What I am typing is never lost when a note runs out. A typed length holds while other corners move.
- After the close I drag any corner: within 0.5 m it snaps (the magnet) to a square corner, a building corner or a building edge, with a small label saying which, and lets go when my finger moves on. The + in a length adds a corner there; a tap on a corner removes it (three stay). The move and turn handles inside the roof move and turn it, lining up with a building edge within 3°; on a small roof the move handle wins over the turn handle, and labels keep off every handle. There are no tool modes: a drag on empty ground turns the camera. A drag that crosses edges goes back and the bar says why; Esc cancels a drag; each change has Undo.
- The roof's area carries its tier (`F8-01`): the weakest of its edges' tiers.
- A four-corner roof is drawn and sized in 7 taps (four corners, close, one length, Continue), and any roof in under 2 minutes; a test counts the taps.
- The error colour is a token that passes AA in light and dark.
- Given a confirmed building, when the operator draws the roof by hand on the picture, then the survey can be completed with no AI step, and nothing is metered for it (M04-22).

**DONE WHEN — part c:**
- With No picture and nothing drawn, Type the size opens at once with the caret in Length; from Draw myself before the first corner it is one tap away. After Cancel, Type the size is the main button and Draw on the grid takes taps on a 1 m grid.
- Rectangle comes first. When I type the length and the width (or "13.2x8.6" in one box), then the rectangle shows as I type: it grows from the pin onto the building there, its long side along the building's longest wall, and the bar shows its size and area. Enter or Place roof places it: 3 taps and 2 numbers. On a roof that is open, a small one lands on it and a large one moves beside it.
- Edge by edge: I type an edge and pick Left or Right (the last pick stays); the corner is 90° unless I type another (15° to 165°). The edge being typed is dashed, a dashed line back to the start shows what is left, and the bar says how far the end is from the start. Back at the start within 0.3 m the shape closes by itself with every length typed; otherwise Close shape works out the last edge and marks it not typed. An edge that would cross another is refused and the panel names which. Remove (↶) or Undo takes the last edge off.
- Switching between Rectangle and Edge by edge keeps what was typed.
- In feet there is a feet box and an inch box, since a phone's number pad has no ' or "; 40'6" typed in the feet box also works; new feet clear the inches the field filled in. Letters, 0 and more than 999 m are refused with the reason.

**DONE WHEN — part d:**
- Your picture opens the file picker: a photo, a drone map or a CAD plan. A JPG, PNG or WebP lies under the roof at once. A drone GeoTIFF, a PDF, a DXF or a DWG is read on our server with its own scale and north; a DXF's units come from the file and are asked once when the file has none; a DWG or a binary DXF is converted only on our server. A file we cannot read says why.
- A plan lands on the building, matched to Google's building outline, and a tap on its outline makes the roof with the plan's lengths, `derived`; corners snap to the plan's lines; the plan has opacity, lock and hide.
- North turns in 5° steps for a photo or a plan; then I draw the roof on it, and one typed length sizes the picture and the roof together.
- The picture is stored with the design (`design_picture`), named and credited as mine on the chip, and it never changes.
- Given a phone's photograph, when it is read anywhere in the product, then it is presented as reference and no dimension, height, area or pitch is attributed to it; and given a figure read from the sky picture, a drone map or a height map, then it carries `derived` until a person changes it (M04-53). — here a photograph is a site photo; a photo chosen as Your picture is the picture a roof is drawn on.

**DONE WHEN — part e:**
- A roof drawn or typed inside another and higher becomes an upper level (a stair room when under 20 m²); inside and lower, an opening; inside a sloped roof, a dormer; beside the others, its own roof. Inside means strictly inside and smaller; touching is beside; the same spot is a cut; each rule has its own test. With no step in the heights, an upper level is 2.6 m higher, `assumed`, marked to check. I can change what it is and its height in the bar; then it is mine.
- An opening is a hole with walls down to its floor; the area leaves it out; it has no walls of its own to set. A dormer goes up to the ridge, `assumed`, with its own faces.
- A roof that would cut another is refused with the reason, drawn or dragged; a typed one that would cut moves beside. A stair room dragged half out goes back and the bar says why; dragged fully out, it becomes its own roof with its height from the height map. The first roof is the main roof. Moving or turning a roof moves what sits on it.
- With more than one roof, the roof name in the bar opens a list: each roof with what it is and its area (the main roof without its openings), Copy and Delete on each row (a copy goes beside the others with what sits on it and cuts nothing; Delete takes what sits on it; both have Undo), and Add a roof. A tap on a roof or its name on the model opens it. The + circle offers Draw a roof, Type the size and Copy this roof; with no roof yet, it starts drawing at once.
- Each roof has a material from the roof types, shown amber with Confirm until a person confirms it; the material picks the mounting, and the installer packet waits for it. The full grouped list of roof types lives in the code — concrete, metal, tiles, sheets and covers, other, and not for panels — and the market pack only orders and names them.
- A sloped roof's shape is proposed from Google's roof faces where they exist: one face a shed, two facing apart a gable, four a hip, an L or T any shape, under 5° flat; curved sheds as 4 to 8 faces. The chips are Flat, Shed, Gable, Hip and Any shape; sawtooth, curved, butterfly, mansard and gambrel are in the list. Ridges and valleys follow the outline, and a corner drag rebuilds the faces at once. A tap on a face sets its slope; on a shed roof a tap on a side sets the low side.
- Walls in one setting: Wall all round, one wall height and one setback for the roof. The edge wall comes from the roof type: concrete (RCC) a 1.0 m wall, `assumed`; sheet and tile none. A tap on a side of the model, or on its dot, adds or removes its wall; a shared side has none and says why. On the model a solid line has a wall and a dashed line has none; no text sits on every side. A wall all round takes 2 taps; two sides off take 3.
- The setback comes from the market pack, else 0.5 m, `assumed`, drawn as an orange dashed line. The clear path is 0.75 m from the stair door (India: CEA Reg 121(1)(i)), drawn as a green strip. Plinth, storey and parapet heights come from the market pack and are `assumed` until a person sets them.

**DONE WHEN — part f:**
- Given a completed remote outline, when the flow continues, then the gaps screen renders with all five items present (M04-29, M04-30).
- The list also holds every `assumed` value, a fragile roof and a water level. An AC sheet roof shows a Fragile roof chip in the bar and puts "Fragile roof. Do not walk. Crawl boards needed." in the installer packet. The sanctioned load from Site details, and a tall neighbour the height map measured, resolve their items by themselves; a person can open them again.
- Each item takes Ask customer, On site, Done or Waive, and a site photo that stays with it; a site photo can also be pinned to any part of the model.
- The bar says "Ready for a quote · N of M for install"; the first Continue opens the list once; later it opens from the bar; nothing on it blocks a quote.
- Given a completed remote survey, when its figures are read anywhere in the product, then they carry `derived`; and given a completed physical survey, then they carry `measured` (M04-34). — its remote half here.
- Given a physical survey containing an estimated height, when that field is read, then it carries `estimated` while the survey's other captured dimensions carry `measured` (M04-35). — here: each figure of the roof carries its own tier, and a figure a person sets carries theirs.
- Each time the step is finished, a named version is saved; the saved pill lists the versions; Restore brings one back, with Undo.

**DONE WHEN — part g:**
- Heights, slopes and facing come from Google's height map and roof faces, at quality BASE and never with `experiments=EXPANDED_COVERAGE`; the studio reads the quality that comes back. They are fetched again when the design opens and never stored; the values we make from them stay with the design. Each is `derived`. The height map wins over a face's height. A roof's height above the ground is the height map inside the roof minus the ground level, taken as a low percentile of the ground around it, since trees lift the median. The picture is first moved onto the height map (0.5 to 3 m, by matching edges).
- The height view shows the height surface in 3D, coloured by height and see-through, with an opacity slider; no plan limits it.
- The sun circle opens from any step: Winter, Summer, Equinox or Today and the hour, in the site's own time zone; the shadows follow it. Shade numbers come with panels.
- Neighbour buildings are plain blocks at their measured height, drawn only when they can shade the roof: the sun is checked on 21 Dec, 21 Mar and 21 Jun, every hour from 8:00 to 17:00, at the site's latitude. Trees are real models at their measured height: the 6 that shade most in full, the rest by their shadow only. Nothing else is drawn.
- A place with no Google height data uses OpenStreetMap outlines; the start bar says so in plain words; each height is built from the market pack's plinth, storey and parapet heights and is `estimated`; the studio asks for one measured height.
- Given a fetched picture, when the roof step shows it, then the picture's capture date is shown, and when it is a year old or more the changed-roof question is asked once; and given a "yes", then the result is marked remote-unreliable, a site check is put on the gaps list, and a physical visit is offered where one can be booked (M04-13). — in V1 no visit can be booked; after a yes the bar offers "Draw what is there now". The height data's own date shows beside it.
- Where Google's picture is a year old or more and Esri's is newer, the chip offers Esri's picture.
- The magnet also snaps to the measured eaves.
- With the full site the scene keeps to the budget of part a; the heavy maths runs in a Web Worker.
- The credit line "Includes solar data from Google" shows where its data is used, and OpenStreetMap's where its outlines are.

**DONE WHEN — part h:**
- Set up roof with AI and Draw myself are side by side; Draw myself never needs the AI. While the AI works, the part it reads glows, one line says what it is doing, found things rise into place, each of its steps is one tap away, and Stop is always there: Stop keeps what is already in place, marked to check. The camera ends on the main shade risk.
- The AI never draws. Google's roof faces fitted to the height map give the faces and slopes; ridges and hips are the straight lines where the fitted planes meet, valleys where a face lies above its neighbour, and an overlap goes to the plane that fits the heights better; the outline is squared. Anything 0.3 m or more above a face is an object with its real size and height; a tree over the roof is told by its height, not by green alone. With no height data, the outline comes from OpenStreetMap, else from an image segmentation model.
- Claude picks the building, names each object from a picture crop, and reads up to 4 road photos along the street. It checks itself with three tools: the heights inside its outline, Google's building shape with its roof levels, and the heights at points. It reads a house as a local surveyor in the site's country would. It asks at most three questions, each answered by a tap: for joined houses, "Which part is yours?"; with no building at the pin, where it is. An edge moves onto the measured eave only where the eave is straight and the height drops to the ground just outside it: in open ground the measured edge wins; among trees Claude's edge wins. The grid and the pin cross Claude reads on are never shown to people.
- The result says "AI set N things · M to check". See all lists each thing with its value and its tier; Next flies to the next one; Accept all and Use this roof close the review, and the tiers stay `estimated` until a person measures. Each thing has a mark with a sure (green) or check (amber) ring; marks keep 6 px apart and a to-check mark always shows. A tap opens Why — the picture, road photo or height it came from, with dates — with Keep (the ring turns green, the tier stays), Fix (gives the choices) and Photo (adds a site photo for the AI to read again). A person's change turns the mark into theirs, and the AI checks again only what depends on it. Undo all AI. A short history says "AI did N · you changed M". Manual mode looks the same without the marks.
- What the AI says shows in the user's language.
- The AI reaches its model through one port with a provider-neutral answer. The 10-roof test and its scorer are rebuilt in the repo and run before any change of model; they pass with no wrong building and the roof height within 0.5 m on 9 roofs of 10. A roof costs about ₹16 and takes 30 to 50 seconds.
- The AI count — the AI designs left — shows on the AI button; at 0 the AI says so and Draw myself is the main button. The count is an entitlement, never a feature flag: the `ai_roof_detections` meter comes back (`D398`).
- Given a lead with a confirmed address, when a remote survey is run and a proposal generated from it with no physical visit, then the elapsed path is measured against the ten-minute budget and no step in this module blocks on a spinner wall or on a decision the product could have pre-filled (M04-07). — here its first segment, address in to reviewed roof out, is timed by a test; the whole path is timed with the result step.

**DONE WHEN — part i:**
- The road view opens on the street photo facing the selected roof, with its date and credit, and a camera cone on the map. The nearest clear photo for each side (N, E, S, W) is found; a tap on a wall turns to the photo that faces it, and Next shows the other. Where Google has none, I add my own photo, with its GPS and compass, or a 360° photo. View only: nothing is measured from it. Beside a map that is not Google's, it opens full screen.
- From the + circle a carport is drawn like a roof. Its bays come from the market pack (India: 2.5 × 5 m, IRC SP 12), in one row or two by its width, and are counted; posts stand on the bay lines (every 5 m, `assumed`); the canopy height comes from a vehicle chip (cars 2.5 m, SUVs 3.0 m, trucks 4.5 m; 3.0 m first, `assumed`); the canopy tilts 5° with a gutter at the low edge; EV charger posts can be marked.
- A water area is drawn like a roof; floats and anchor ropes fill it; its water level goes on the list, never blocks a quote, and the installation packet waits for it.
- On a wall the sides show as dots, and a tap makes that wall an area: its height measured, its facing from the edge, its size on the model and in the roof list, with Delete and Undo. A side view shows windows and doors as gaps, repeated across the floors, and a glass-wall choice; a balcony takes rows along its railing on each floor. The installer packet notes work at height and that an engineer checks the wall fixing.
- One design holds roofs, carports, water areas and walls together.
- I drag the pin onto the customer's building; the AI and a typed size start there. Moving the pin to another building also fixes the site's place on the lead.

**Settle before the part starts** — each is the owner's:
- part a: the Map Tiles API on the server key, in dev and prod, with billing and a budget alert.
- part d: a lawyer check that the GPL DWG reader may run on our server, before launch.
- part g: the Solar API on the server key, in dev and prod, with a budget alert; a lawyer check on keeping the values we make from Solar data beyond 30 days, before launch.
- part h: the Claude key's budget; the AI allowance per tier and for the trial; whether a stopped or failed AI setup uses one (my pick: no).
- part i: Street View on the server key.
- Google test data: refreshed or deleted — Pune by 13 Dec; Sangli and the 10 AI roofs by 18 Dec; the 19 Nov tests by 19 Dec.

**Not in this task:** the Objects, Panels, Wiring and Result steps; the block-8 tasks parked for the
studio and the `M08-41` and `F6-10` proofs (they need panels and wiring); ground-mount designs;
the laser meter (a button only if the Bosch or Leica kit lets an app read the length); the 100 MW
scale test, the shade numbers, the planned panels in the road view, and the panels an edit cuts
(with the panels step); Google's 3D city (a later step). Before the sign-off step the owner rules
how a design reaches its engineer (a person who holds the Design Engineer preset alone reaches no
lead today: `F2.M02.lead-visibility`, `F2.M05.approve-designs`). A second map beside Google's
(Apple's) joins later, after its own sample and the owner's Apple Maps keys.
