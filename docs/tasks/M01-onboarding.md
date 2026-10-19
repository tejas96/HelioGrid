# M01 · Onboarding & tenant configuration — engineering tasks

This file covers module M01 — company signup and authentication, team invites and user onboarding, the role-administration screens, progressive setup and the business profile, the two-tier catalog and price book, branding and document templates, payment-term templates, message templates, capture settings, locale defaults and integration credentials. Task-id prefix: `T-M01-`. Source docs: `docs/prd/modules/M01-onboarding-and-tenant-config.md` (all M01 rows), plus the foreign rows riding M01-owned screens per `docs/prd/registers/screens.md`: `docs/prd/foundations/F2-roles-and-permissions.md`, `docs/prd/foundations/F3-localization.md`, `docs/prd/foundations/F6-notifications-and-search.md`, `docs/prd/foundations/F7-design-language.md`, `docs/prd/modules/M02-crm-and-leads.md`, `docs/prd/modules/M05-studio/11-shell-and-platform.md`. Rules per `docs/tasks/README.md`: acceptance criteria are copied verbatim from the PRD, never rewritten; `DESIGN: PENDING` blocks build, not start.

---

## Screen tasks

### T-M01-001 · Sign In — mobile
**Type:** screen · **Tier:** P0
**Status:** shipped (#53)
**Why:** Every installer and every field hand enters through this one door with a phone and a code, never a password, and a shared field phone signs the next person in within a minute without handing them a colleague's unuploaded photographs; without it nobody reaches a tenant, a role or a home — and today nothing signs a person in on either platform, so no other screen can be proven. The phone lands first (`M01` §2: employees arrive "phone, almost always"); the desktop door is `T-M01-033`, the Google door `T-M01-032`.
**PRD rows:** M01-03 (P0), M01-04 (P0), M01-05 (P0), MS12-17 (P0)
**DESIGN:** SCR-M01-01 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Depends on:** `T-M01-025` (shipped, #40 — the OTP, session and tenant routes; the F4-37 switch state) · `T-M13-006` (shipped, #52 — `homeFor`, the destination the dwell names) · `packages/ui` `PhoneField`, `OtpInput`, `Button`, `Banner`, `Sheet`, `LogoTile`, `EmptyState` (landed).

**DONE WHEN:**
- Given an OTP that fails to deliver by SMS, when the failure occurs, then no automatic fallback to any other channel fires, login fails loudly with a plain retry-later message, and the resend control and the user-initiated "call me instead" voice option are the visible ways forward (M01-03, owner ruling 2026-08-06). *(This criterion previously read "when 30 s elapse or delivery fails, then the fallback channel fires automatically and resend + voice options are visible" — the ruling removes the automatic fallback it tested; copied verbatim from the amended §M01.1 acceptance block.)* → proof: qa-mobile with the development adapter's failing number the frame reads "The code did not send", no channel fires, the resend is live with no countdown and Get the code by call sits beside it; the 502 is `T-M01-025`'s
- Given a sent OTP, when the resend control is under its cooldown, then it becomes available again after 30 s (M01-04, owner ruling 2026-08-06). *(Line added when that ruling closed: this block previously asserted no cooldown length at all, because the value was the recorded 30 s vs 45 s divergence M01-04 carried; the ruling supplies it.)* → proof: qa-mobile after Send code the resend line counts down from 30 s and unlocks at 30 s
- Given a confirmed hard SMS delivery failure, when the failure state renders, then the resend cooldown is released immediately — the resend control is available with no countdown left to wait out — and the user-initiated "call me instead" voice option is offered in that same state (M01-03, M01-04, owner ruling 2026-08-06); given that an M01-04 cap is already reached at that moment, then the cap still governs and the message says so honestly (M01-04). *(Line added when that ruling closed and copied verbatim from the amended §M01.1 acceptance block: that block previously asserted nothing about the resend control inside the failure state — the 0–30 s hard-failure gap, now closed.)* → proof: qa-mobile the failing number's frame shows no countdown; with three requests already made in 15 minutes the cap frame renders instead and names 3 per 15 minutes and 8 a day
- Given 5 failed verify attempts, when the fifth fails, then that OTP is invalid and the user is told to request a fresh one; given 3 consecutive invalidations, then the number is locked 15 min with an explanation (M01-04). → proof: qa-mobile five wrong codes render tries left on each, then the used-up frame with Send a new code; three used-up codes render the locked frame with no entry, no resend and no primary; the API halves are proven at `T-M01-025` (qa-api) and the Google sentence at `T-M01-032`
- Given any sign-in surface, when it renders, then no password field exists anywhere (M01-05) and Google Login is offered alongside Mobile OTP (M01-02). → proof: qa-mobile the frame carries phone and code and no password field at 375px; the Google control is proven at `T-M01-032`
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → proof: qa-mobile sign in by OTP and land on the home route with the session projection populated; Google is proven at `T-M01-032`, language and units at `T-M01-011`, sign-out at `T-SHELL-001`
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-mobile every base and brief-listed state at 375px — normal, number-not-accepted, loading, otp-sent, otp-entry, otp-auto-read, wrong-code, expired-code, resend-cooldown, call-me-instead, delivery-failed-retry-later, cap-already-reached, number-locked-15min, error/auth-error, verified-success-dwell (1.2 s, naming the home) — the colour-literal lint clean; `google-link-first-sign-in` at `T-M01-032`, `switch-discards-held-work`'s trigger with M04's queue; parity with 1536px at `T-M01-033`

### T-M01-033 · Sign In — web
**Type:** screen · **Tier:** P0
**Status:** shipped (#55)
**Why:** The owner is often on a laptop: the same phone-and-code door, drawn as the two-field desktop composition, over the same flow the phone uses; without it the web product has no way in and the phone and the desktop would drift on the one screen every person passes through.
**PRD rows:** M01-03 (P0), M01-04 (P0), M01-05 (P0), MS12-17 (P0)
**BRIEF:** docs/ux/briefs/SCR-M01-01-sign-in.md
**Design:** the same canvas as `T-M01-001`'s DESIGN line — Frame 2 (the 1536 two-field composition) and the desktop arrangement of the code family and of the switch dialog; one screen, one DESIGN line, kept on the phone slice (`M111` split by platform).
**Depends on:** `T-M01-001` (the shared flow, the outcomes, the home titles) · `T-M01-025` (shipped, #40) · `T-M13-006` (shipped, #52).

**DONE WHEN:**
- Given an OTP that fails to deliver by SMS, when the failure occurs, then no automatic fallback to any other channel fires, login fails loudly with a plain retry-later message, and the resend control and the user-initiated "call me instead" voice option are the visible ways forward (M01-03, owner ruling 2026-08-06). *(This criterion previously read "when 30 s elapse or delivery fails, then the fallback channel fires automatically and resend + voice options are visible" — the ruling removes the automatic fallback it tested; copied verbatim from the amended §M01.1 acceptance block.)* → proof: qa-web as `T-M01-001`'s line, at 1536px
- Given a sent OTP, when the resend control is under its cooldown, then it becomes available again after 30 s (M01-04, owner ruling 2026-08-06). *(Line added when that ruling closed: this block previously asserted no cooldown length at all, because the value was the recorded 30 s vs 45 s divergence M01-04 carried; the ruling supplies it.)* → proof: qa-parity the resend control counts down `RESEND_SECONDS` and unlocks at 30 s on both platforms
- Given a confirmed hard SMS delivery failure, when the failure state renders, then the resend cooldown is released immediately — the resend control is available with no countdown left to wait out — and the user-initiated "call me instead" voice option is offered in that same state (M01-03, M01-04, owner ruling 2026-08-06); given that an M01-04 cap is already reached at that moment, then the cap still governs and the message says so honestly (M01-04). *(Line added when that ruling closed and copied verbatim from the amended §M01.1 acceptance block: that block previously asserted nothing about the resend control inside the failure state — the 0–30 s hard-failure gap, now closed.)* → proof: qa-web as `T-M01-001`'s line, at 1536px
- Given 5 failed verify attempts, when the fifth fails, then that OTP is invalid and the user is told to request a fresh one; given 3 consecutive invalidations, then the number is locked 15 min with an explanation (M01-04). → proof: qa-web as `T-M01-001`'s line, at 1536px
- Given any sign-in surface, when it renders, then no password field exists anywhere (M01-05) and Google Login is offered alongside Mobile OTP (M01-02). → proof: qa-parity both frames carry phone and code and no password field at 375px and 1536px; the Google control on both is `T-M01-032`'s
- Given sign-in, Then mobile OTP and Google work and establish tenant/role context with no dead controls (MS12-17); language and units persist per user with real catalogs (MS12-18); sign-out preserves work (MS12-19). → proof: qa-web sign in by OTP and land on the home route with the session projection populated; a signed-in visitor to `/login` is sent to the home route and an anonymous visitor to `/home` is sent to `/login`
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-web every base and brief-listed state at 1536px · qa-parity every state against `T-M01-001`'s at 375px — the same outcomes from the same store and the same copy

### T-M01-036 · Company Signup — the flow
**Type:** engine · **Tier:** P0
**Status:** shipped (#57)
**Why:** Company signup's decisions — which panel a door shows, a known number held back for the person's own choice, the one company write that moves a session under its new tenant — authored once, so the phone and the web render one flow and never two; without it each screen would hold its own copy of the door and the two would drift on the one screen every company passes through.
**PRD rows:** M01-01 (P0), M01-08 (P0)
**Depends on:** `T-M01-025` (migration 0002; POST /tenants, the OTP routes) · `T-M01-001` (the door's reducer and `useSignIn`).
**DONE WHEN:**
- Given a new phone number, when signup completes, then exactly phone, OTP, company name, owner name and city were required, a tenant exists with the signer as EPC Owner, and no billing or payment step occurred (M01-01, M01-11). → proof: qa-api drive the flow through `packages/data`'s own client against the running API: a new number verifies at the signup door onto the company step, `createCompany` with the three fields moves the session under a tenant the signer holds as `epc_owner`, and `GET /auth/session` names it
- Given an existing account's phone at signup, when the OTP verifies, then the user is logged in to the existing account and no second company exists (M01-08). → proof: qa-api the same drive with a known number: the store holds it as `known` and nothing of the account loads; `enterKnownAccount` signs it in to the existing tenant and the tenant count is unchanged; `leaveKnownAccount` ends that session on the server
- Given a signup abandoned after OTP verification, when the person returns, then setup resumes where it stopped (M01-10). → proof: qa-api verify, drop the layer, boot a new one on the same jar: the session comes back `restored` with no company and the signup view is the company step, no code requested · qa-mobile + qa-web the sign-in door still signs in and lands home on both platforms, because the shared verify path changed
### T-M01-002 · Company Signup — mobile
**Type:** screen · **Tier:** P0
**Status:** shipped (#58)
**Why:** An owner types a phone, a code, a company name, their name and a city and owns a workspace in under a minute with no plan, card or tax number in the way; without it there is no tenant for anything else to happen in. The phone lands first, as the sign-in door did (`T-M01-001`); the desktop composition is `T-M01-034`, the join steer `T-M01-035`.
**PRD rows:** M01-01 (P0), M01-08 (P0)
**DESIGN:** SCR-M01-02 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Depends on:** `T-M01-036` (the flow, the words, the known-number hold) · `T-M01-025` (migration 0002; POST /tenants, the OTP routes, the public marking of the signup path) · `T-M01-026` (migration 0006; the seeded `onboarding_progress` row) · `T-M01-001` (the door's flow, the code family and its limit states, drawn once on the front door) · `T-FCORE-016` (migration 0001; the market the server assigns from).
**DONE WHEN:**
- Given a new phone number, when signup completes, then exactly phone, OTP, company name, owner name and city were required, a tenant exists with the signer as EPC Owner, and no billing or payment step occurred (M01-01, M01-11). → proof: qa-mobile complete signup on both simulators: five inputs and no plan, card or tax step · qa-api `GET /auth/session` then names the new tenant with the `epc_owner` preset
- Given an existing account's phone at signup, when the OTP verifies, then the user is logged in to the existing account and no second company exists (M01-08). → proof: qa-api verify a known phone through signup: the response is the existing account's session, `GET /tenants/me` names the existing tenant and the tenant count is unchanged · qa-mobile the known-number frame offers *Sign in with this number* and *Use a different number*, and the first lands on the account's home
- Given a signup abandoned after OTP verification, when the person returns, then setup resumes where it stopped (M01-10). → proof: qa-mobile abandon after the code step and return: the company step renders with the verified number as a fact and no code is requested again
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-mobile every base and brief-listed state at 375px less `M01-09`'s two (`T-M01-035`) — normal, loading, error, duplicate-phone-login-offered, resume-after-abandon, number-invalid, fields-invalid — the colour-literal lint clean; 1536 and parity are `T-M01-034`'s
### T-M01-034 · Company Signup — web
**Type:** screen · **Tier:** P0
**Status:** shipped (#59)
**Why:** The owner signs the company up "usually on a laptop, often with a salesperson on a call": the same five inputs, drawn as the two-field desktop composition over the flow the phone runs; without it the web product has no way to make a tenant, and the two doors would drift on the one screen every company passes through.
**PRD rows:** M01-01 (P0), M01-08 (P0)
**BRIEF:** docs/ux/briefs/SCR-M01-02-company-signup.md
**Design:** the same canvas as `T-M01-002`'s DESIGN line — the `d-*` frames at 1536 (`d-step1-number`, `d-step2-code`, `d-step3-filled`, `d-duplicate-phone`) and the phone arrangement at 375 on the web; one screen, one DESIGN line, kept on the phone slice (`M111` split by platform).
**Depends on:** `T-M01-036` (the flow, the words, the known-number hold) · `T-M01-002` (the phone screen, the states as first drawn) · `T-M01-033` (the door's two-field composition and its breakpoint) · `T-M01-025`.
**DONE WHEN:**
- Given a new phone number, when signup completes, then exactly phone, OTP, company name, owner name and city were required, a tenant exists with the signer as EPC Owner, and no billing or payment step occurred (M01-01, M01-11). → proof: qa-web complete signup at 1536px and at 375px: five inputs and no plan, card or tax step; `GET /auth/session` names the new tenant with the `epc_owner` preset
- Given an existing account's phone at signup, when the OTP verifies, then the user is logged in to the existing account and no second company exists (M01-08). → proof: qa-web a known phone's code verifies into the existing account: the finding in the identity half at 1536px, both roads full-size, *Sign in with this number* landing on the home; a signed-in owner opening `/company-signup` is sent home
- Given a signup abandoned after OTP verification, when the person returns, then setup resumes where it stopped (M01-10). → proof: qa-web abandon after the code step and reopen `/company-signup`: the company step renders with the verified number in the identity half and no code is requested again
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: qa-web every base and brief-listed state at 1536px less `M01-09`'s two, measured against the `d-*` frames from disk; parity with `T-M01-002` is by construction — one store (`signupView`, `useSignIn`), one copy (`COMPANY_SIGNUP`) — shown by the import list, never re-driven
### T-M01-035 · Company Signup — request to join
**Type:** screen · **Tier:** P1
**Status:** shipped
**Why:** A second person from a company that already has a workspace is steered to join it rather than opening a second one that splits the company's leads, designs and money; without it every colleague who signs up makes a duplicate company nobody can merge.
**PRD rows:** M01-09 (P1)
**BRIEF:** docs/ux/briefs/SCR-M01-02-company-signup.md
**Design:** the same canvas as `T-M01-002`'s DESIGN line — `m-request-to-join`, `m-request-sent` and `m-request-failed` at 375, `d-request-to-join`, `d-request-sent` and `d-request-failed` at 1536; one screen, one DESIGN line, kept on the phone slice.
**Depends on:** `T-FPLAT-017` (the registry and the record the request is) · `T-M01-002` and `T-M01-034` (the screens the states are drawn on) · `T-M01-025` (GET /tenants/similar).
**DONE WHEN:**
- (M01-09 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text quoted above is the binding criterion.) → proof: QA (web and phone) a company name and city matching an existing workspace renders the steer with both roads full-size, "Create a new company anyway" still creates, and "Request to join" leaves the matched tenant's EPC Owner a request naming the asker and lands the asker on the `request-sent` state · QA (api) the Owner's notification carries the registered type

### T-M01-038 · The web door at phone width matches the phone board
**Type:** screen · **Tier:** P0 (`F7-43`)
**Status:** shipped
**Why:** At 375 the web door (`/login`, `/company-signup`) is laid out as the 1536 two-field composition stacked, not as the phone board: the heading sits above the step header and at `h1`, an off-flow state's content is centred low on the page, and the action flows under the column instead of being pinned. The boards draw one phone layout for both the app and the web at 375 (`F7-43` item 1, parity).
**PRD rows:** none of its own — `F7-43` item 1 (375 and 1536, parity by capability); the boards `SCR-M01-01` and `SCR-M01-02` are the reference.
**Design:** the existing boards' 375 frames (`SCR-M01-01`, `SCR-M01-02`) — no new drawing.
**Depends on:** `T-M01-035` (the web frames it rebuilds at 375).
**DONE WHEN:**
- At 375 every web door frame lays out as its phone board: the step header above the heading, the heading in the `--fs-h2` role, the gap under the header or the step header the board's token, the front door's column centred between the header and its foot where `SCR-M01-01` centres it and the signup frames top-aligned, and the action pinned at the bottom where the board pins it. → proof: a side-by-side of every web door frame at 375 against its board frame, and the e2e door specs green.

Corrected before approval (2026-10-08): the line read "an off-flow title `sp-8` under the header". The boards' 375 tables put `m-request-sent`'s heading `sp-8` under the header and `m-duplicate-phone`'s `sp-6`, and draw the step header on `m-request-to-join` and `m-request-failed`; the front door centres its column and the signup frames do not.

### T-M01-039 · The door and the web when the network or the session fails
**Type:** screen · **Tier:** P0 (`F8-36`)
**Status:** shipped
**Why:** The door blames the server for the person's own connection (D1), a boot during a deploy or a timeout signs a signed-in person out (D7), a person whose access was removed lands on the door with no reason (D6), the company step says *nothing was created* after a request that got no answer (D39), the web has no offline state and loads forever (D80), both apps render API failures each their own way (D68), and the phone's dev build shows an unread debugger warning (D78).
**PRD rows:** `F8-36` (a failure says what happened, plainly); `M01-07` (sessions end only by their own rules).
**DESIGN:** SCR-M01-01 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN · SCR-M01-02 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN — each board holds every frame.
**Depends on:** `T-M01-038`.
**DONE WHEN:**
- A request that got no answer reads as *could not be reached*, never *something on our side failed*; a server refusal keeps its own words. → proof: unit test of `loginFrame`; QA web and phone with the network off.
- A boot that fails for anything but a lost session keeps the person signed in and offers a retry over the loading frame. → proof: unit test of the session store; QA with the api stopped during boot.
- A person whose access was removed sees the board's access-removed frame on the door, cleared by the next sign-in. → proof: QA web and phone; side-by-side with the board.
- After a create that got no answer, the company step says the company may have been made and trying again is safe; a server refusal keeps *nothing was created*. → proof: unit test of the words; QA with the api stopped mid-create; side-by-side with the redrawn `SCR-M01-02` frame.
- With no connection the web shows the shared no-connection screen instead of loading forever. → proof: a Playwright case that drops the network.
- Both apps render an API failure through one `ApiErrorText` in `packages/ui` (one `.types.ts`, words from `packages/i18n`). → proof: typecheck; QA web and phone.
- The phone dev build's debugger warning is read and its source fixed, or recorded with why it stays. → proof: QA on a cold start.
- A path no route serves shows a drawn not-found frame in the reader's language, with a way home (D87). → proof: e2e web; side-by-side with the board.
- `SCR-M01-02`'s frames meet the words law after the board's copy pass, and the app's words follow (D133). → proof: the design check's word inventory; side-by-side.
- `m-google-failed` is drawn and measured in Hindi and Marathi (D139), and four small web-door differences are ruled and built — the board wins unless a law says otherwise (D142). → proof: side-by-side, web and phone.

### T-M01-040 · Signing in returns the person to where they were going
**Type:** screen · **Tier:** P1 (`M01-61`)
**Status:** shipped
**Why:** A deep link opened while signed out lands on home after sign-in (D20); the owner ruled the person returns to the link.
**PRD rows:** `M01-61` (P1).
**Design:** none — no new frame; the door is `SCR-M01-01` as drawn.
**Depends on:** `T-M01-039`.
**DONE WHEN:**
- `M01-61` → proof: e2e web (a signed-out deep link returns to it after sign-in; a route the roles cannot open shows the not-found frame); QA phone with a deep link.

### T-M01-041 · The door's parts lifted into packages/ui
**Type:** screen · **Tier:** P1
**Status:** shipped
**Why:** Twelve door parts exist once per platform, drawn the same from the same hooks and words (D24), and the phone's code step lacks the language control the web keeps (D23).
**PRD rows:** none of its own — Law 7 (one prop contract per shared component); `SCR-M01-01`, `SCR-M01-02` as drawn.
**Design:** none — the existing boards.
**Depends on:** `T-FPLAT-082` (part c), `T-M01-040`.
**DONE WHEN:**
- Each door part lives in `packages/ui` with one `<Name>.types.ts` and both halves; the apps render them; ~~the phone's code step carries the language control.~~ → proof: typecheck and the e2e door specs; side-by-side of every door frame against its board. *(The struck clause: owner ruling on finding 3, 2026-10-10 — the board stands, and `docs/ux/briefs/SCR-M01-01-sign-in.md` records where the control sits.)*

### T-M01-003 · Onboarding — Language
**Type:** screen · **Tier:** P0
**Status:** shipped
**Why:** A surveyor whose phone runs in Marathi opens the app in Marathi before anyone explains a setting, and the choice follows them to every screen; without it the first minute is in the wrong language for the people who live on the phone.
**PRD rows:** F3-03 (P0)
**DESIGN:** SCR-M01-03 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Depends on:** `T-M01-025` (migration 0002; the profile write above) · `T-M01-026` (migration 0006; the onboarding step) · `T-M01-002` (the step this one follows) · `T-FPLAT-005` (the runtime language resolution that redraws the screen in the language just touched) · `T-FPLAT-007` (the Devanagari face on mobile and per-script line height).
**DONE WHEN:**
- Given any user of any preset, when they open onboarding for the first time and when they open their profile afterwards, then a language picker is available on both platforms, listing each language in its own script and name (`F3-03`). → proof: QA web · ios · android the first-run picker and the profile picker list English · हिन्दी · मराठी in their own scripts on both platforms, and choosing one redraws the screen in it with no Save
- Given a user whose device language is in the set, when they first run the app, then the app renders in that language without their intervention (`F3-03`). → proof: QA (web and phone) a device (or browser) locale of Hindi opens first run in Hindi with the device pill on हिन्दी; a locale outside the set opens in English with the picker fully available
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-004 · Setup — What You Sell
**Type:** screen · **Tier:** P0
**Status:** shipped
**Why:** The owner says whether they sell residential, C&I or both and their typical system size in kWp, and the first proposal opens close to a real job instead of at zero; without it every seeded default is a guess nobody declared.
**PRD rows:** M01-23 (P0)
**DESIGN:** SCR-M01-04 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Depends on:** `T-M01-025` (migration 0002; `tenantSegmentSchema`) · `T-M01-026` (migration 0006; the business-profile routes and the step write) · `T-M01-003` (the step before).
**DONE WHEN:**
- Given the onboarding sequence, when it runs, then segment + typical size are asked (M01-23), company profile and invites are skippable (M01-24, M01-12), and the final screen offers exactly the two doors (M01-26). → proof: QA (web and phone) run onboarding end to end: this step asks the two questions and draws no Skip, the profile and invite steps skip, and the landing shows exactly two doors; the size renders `estimated · Declared by you` and an undeclared size is empty, never 0
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-005 · Business Profile
**Type:** screen · **Tier:** P0
**Status:** shipped
**Why:** The owner enters the company's logo, tax registration, address and bank details once — or skips them until the first proposal needs them — and every proposal, agent script, customer link and invoice reads the same facts; without it each surface asks again and the documents disagree.
**PRD rows:** M01-24 (P0), M01-25 (P0), M01-31 (P0)
**DESIGN:** SCR-M01-05 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Depends on:** `T-M01-026` (migration 0006 and every settings route above) · `T-FCORE-016` (migration 0001; the pack read) · `T-FCORE-001` (`IN_FORMATS`, the tax-format validators — landed) · `T-M01-025` (the guard for `onboarding.manage_tenant_settings`) · `T-M01-004` (the step before, whose Finish-later route lands here) · the first `file` slice (the logo upload; no task id yet — the logo part waits on it, the other four parts do not).
**DONE WHEN:**
- Given a skipped company profile, when the first proposal is about to be sent, then the prompt to complete it fires there, inline (M01-24, M01-29). → proof: QA (web and phone) skip the step, build a proposal to its send: the tax-registration field set opens over the proposal, do-it-now saves and keep-skipping leaves the default in place; the send itself is `T-M06-022`'s
- Given a malformed tax registration, when it is typed, then validation is live against the market pack's format, the format is explained, and skip remains available (M01-25). → proof: QA (web and phone) a malformed registration is answered on the field against the market format with the format explained, and the forward act stays live
- Given the business profile, when any consumer surface needs company identity facts, then it reads the one profile and the user is never asked to re-enter them (M01-31). → proof: QA (api) `GET /settings/effective` carries the profile's facts and no consumer route re-asks them; the document renders are proven with `T-M06-017`'s first render
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-006 · Setup — You're Ready
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** Onboarding ends on a real choice — add the first lead or open the finished demo rooftop — so an owner is quoting or learning within a minute of signing up; without it setup ends on a blank dashboard.
**PRD rows:** M01-26 (P0)
**DESIGN:** SCR-M01-06 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-06-setup-ready.md`; they are the specification.
**Data model:** none — reads `tenant` (`T-M01-025`, migration 0002 — the company name read back), `onboarding_progress` (`T-M01-026`, migration 0006) and the demo instance `T-M01-029` seeds from `demo_project_content`.
**Contract:** `packages/contracts/src/tenant.ts` — GET /tenants/me (the company name) · `packages/contracts/src/onboarding.ts` — PUT /onboarding/progress/{step} (the corridor closed; the screen is never reachable again) · the demo door reads the demo lead through M02's lead read shape carrying `isDemo` (`T-M01-029`, added in M02's contract file when that slice begins) — `error-demo-unavailable` is that read not existing yet (before M02's slice) or failing while the workspace answers.
**Depends on:** `T-M01-025` (migration 0002) · `T-M01-026` (migration 0006) · `T-M01-007` (the step before).
**Out of scope:** quick-add — `T-M02-001`; the demo content, its seeding and door two opening the labelled demo — `T-M01-029`, which builds in block 8 and proves that door: until it lands, door two renders its `error-demo-unavailable` card honestly, so this task does not wait on it; the demo label on every surface — the owning modules read the marker; the shell the doors open into — `T-SHELL-001`.
**DONE WHEN:**
- Given the onboarding sequence, when it runs, then segment + typical size are asked (M01-23), company profile and invites are skippable (M01-24, M01-12), and the final screen offers exactly the two doors (M01-26). → proof: QA (web and phone) the landing shows exactly two doors and nothing else; door one routes to Leads, door two shows its `error-demo-unavailable` card while no demo exists (opening the labelled demo is `T-M01-029`'s proof), and no shell route leads back here; the empty Leads screen door one lands on is `T-M02-003`'s own empty state, proven there
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-007 · Invite Teammate
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner invites a surveyor by name and phone with the presets they need in one tap, from onboarding or from Team, and the invite reaches that phone as a message; without it a company stays one person.
**PRD rows:** M01-12 (P0), F2-21 (P1)
**DESIGN:** SCR-M01-07 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-07-invite-teammate.md`; they are the specification.
**Data model:** none — reads `invitation` and `invitation_role` authored by `T-M01-028` (migration 0005); the per-tenant daily invite count (M01-04) is derived from `invitation.sent_at` there, never a counter; the twelve presets are `ROLE_PRESETS` in `packages/domain/src/authz/roles.ts`, never a table.
**Contract:** `packages/contracts/src/invitation.ts` — POST /invitations (name, phone, ≥1 preset → pending; zero roles refused before anything sends; an already-member phone and the daily cap refused with the reason the surface renders) · `packages/contracts/src/onboarding.ts` — PUT /onboarding/progress/{step} (skip during onboarding). `rolePresetSchema` (`common.ts`); preset display names and clauses are `packages/i18n` copy.
**Depends on:** `T-M01-028` (migration 0005; POST /invitations) · `T-M01-025` (migration 0002; the guard for `onboarding.manage_team`, the invite cap) · `T-FPLAT-003` (the zero-role guard, F2-21) · `T-M01-026` (the onboarding step write) · `T-M01-012` (the Team screen it is one tap from outside onboarding).
**Out of scope:** the invite record, the send on the platform rail, expiry and the cap value — `T-M01-028`; the guard — `T-FPLAT-003`; the invitee's side — `T-M01-008`; revocation and the pending list — `T-M01-012`; the invite message's language — the tenant default on `tenant` (`T-M01-025`) rendered by `packages/i18n`.
**Carried from `T-M01-035`:** the `join_requested` notice's act — *invite this person*, opening this screen with the asker's name and number filled in (`M01-09`). The notice's subject is the asker's `user_account`; a notification carries no link yet, so the act lands with this screen.
**DONE WHEN:**
- Given the Team screen, when it renders, then *Invite teammate* opens this screen — at the top of the list at 375, in the page header at 1536 — and the teaching state's *Invite your first teammate* does the same (`T-M01-012` ruling D1 A: Team ships without both, and this task adds them). → proof: QA (web and phone) each opens this screen from Team, at 375 and 1536
- Given an invite with zero roles, when it is submitted, then it is blocked before sending (M01-12, F2-21). → proof: QA (web and phone) submit with no preset: the refusal renders on the role group and no request leaves the client; QA (api) a zero-role body is refused by `POST /invitations` before any message is sent
- Given an invite composed with zero roles, when it is submitted, then it is blocked before sending (F2-21). → proof: QA (api) `POST /invitations` with an empty role list answers the refusal and sends nothing — the guard's own unit is `T-FPLAT-003`'s
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-008 · Invite Landing
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** A new hire taps the message, sees who invited them and to which company, enters the code that arrived with the page, and is a member with their roles in one act — never half-joined; without it the second first-impression is a form.
**PRD rows:** M01-13 (P0)
**DESIGN:** SCR-M01-08 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-08-invite-landing.md`; they are the specification.
**Data model:** none — reads `invitation` and `invitation_role` authored by `T-M01-028` (migration 0005) and `otp_challenge` authored by `T-M01-025` (migration 0002); the accept writes `user_account`, `tenant_membership` and `membership_role` through `T-M01-028`'s one transaction.
**Contract:** `packages/contracts/src/invitation.ts` — GET /invitations/landing/{token} (public: inviter, company, the prefilled phone, the role names) · POST /invitations/{id}/accept (the verified challenge → the `sessionProjectionSchema`) · POST /invitations/{id}/decline (confirmed; voids and notifies the Owner) · POST /invitations/{id}/request-reinvite (expired only) · `packages/contracts/src/auth.ts` — POST /auth/otp/request (sent on arrival, keyed to the invite's phone — never typed here) · POST /auth/otp/verify. `RESEND_SECONDS` is read from domain — the same 30 s the front door draws.
**Depends on:** `T-M01-028` (migration 0005; the landing, accept, decline and re-invite routes) · `T-M01-025` (migration 0002; the OTP routes the landing sends through, the session the accept returns) · `T-FPLAT-017` (the Owner and inviter notifications decline and re-invite raise) · `T-M01-007` (the send that mints the link).
**Out of scope:** the atomic accept and the invite lifecycle — `T-M01-028`; the resend cooldown, caps and lock states — `T-M01-001`, inherited; the next two screens — `T-M01-009`, `T-M01-010`; the role-decided home — `T-SHELL-001`, `T-M13-006`.
**DONE WHEN:**
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17). → proof: QA (web and phone) open a live link on both platforms: the code arrives without a tap, one act verifies, and the corridor runs name/photo → role card → the role's home with assigned work in it; the atomicity is `T-M01-028`'s unit
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-009 · First-Run Profile
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The invited person confirms the name the inviter typed, adds a photo or keeps their initials, and is two taps from real work; without it a two-minute first run becomes a form nobody finishes on a phone.
**PRD rows:** M01-14 (P0)
**DESIGN:** SCR-M01-09 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-09-first-run-profile.md`; they are the specification.
**Data model:** none — reads `user_account` (name, photo, interface_language) authored by `T-M01-025` (migration 0002) and the invitee name from `invitation` (`T-M01-028`, migration 0005), which the accept already wrote onto an unnamed account.
**Contract:** `packages/contracts/src/session.ts` — GET /auth/session (the actor's display name, pre-filled from the invite). **Gap filled at `T-M01-025`'s `/start`:** `PATCH /users/me` (`user.ts`, `T-M01-025`) writes name, `interface_language` and `unit_preference`; the photo goes to the one `file` table through the presigned upload — the first file slice, no task id yet.
**Depends on:** `T-M01-028` (the accept that lands here with the invite's name) · `T-M01-025` (migration 0002; the profile write above) · `T-M01-008` (the step before) · `T-FPLAT-005` (the language control's immediate redraw) · the first `file` slice (the photo; until it lands the circle shows initials and the act still saves the name).
**Out of scope:** the accept — `T-M01-028`; the language set and the picker's own rules — `T-M01-003`; where name and photo are edited later — this screen, re-entered from `T-M01-011`; the role card — `T-M01-010`.
**DONE WHEN:**
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17). → proof: QA (web and phone) after accept the name field is pre-filled with the inviter's spelling, saving with the photo skipped shows initials and moves to the role card; the whole corridor is proven at `T-M01-008`
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-010 · Role Explainer
**Type:** screen · **Tier:** P1
**Status:** designed
**Why:** A new Sales Executive reads, in one card, what they will see and do and what they will not, and can reopen that card from their profile whenever a screen refuses them; without it a refusal reads as a bug.
**PRD rows:** M01-15 (P1)
**DESIGN:** SCR-M01-10 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-10-role-explainer.md`; they are the specification.
**Data model:** none — reads the held presets from `membership_role` authored by `T-M01-025` (migration 0002) through the session projection; the grants are `CAPABILITY_MATRIX` in `packages/domain/src/authz/capabilities.ts`, never a table.
**Contract:** `packages/contracts/src/session.ts` — GET /auth/session (`membership.roles`); the inviter's name from `T-M01-028`'s landing read. Domain type this task adds (Law 11): a role-card view-model in `packages/domain/src/authz/` — the union of grants across the held presets and the complement of that union as limits, one function both platforms render; every clause and preset display name is `packages/i18n` copy.
**Depends on:** `T-M01-025` (migration 0002; the session projection) · `T-FPLAT-001` (`ROLE_PRESETS`, `CAPABILITY_MATRIX` — landed) · `T-M01-009` (the step before) · `T-M01-011` (the profile it re-opens from) · `T-SHELL-001`, `T-M13-006` (the role-decided home its act names).
**Out of scope:** the home itself — `T-SHELL-001`, `T-M13-006`; the presets and matrix — `T-FPLAT-001`; the grant line on Assign Roles, composed from the same matrix — `T-M01-013`.
**DONE WHEN:**
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17). → proof: QA (web and phone) the card renders between profile capture and the home, its act names the destination, and the same card opens as a sheet from Profile & preferences
- (M01-15 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text in the brief is the binding criterion.) → proof: unit packages/domain/tests/authz/role-card.test.ts — a stacked pair yields the union of grants and no limit either preset lifts; `sales_executive` alone names selling and no money cell beyond its scope
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-011 · Profile & Preferences
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** A field technician switches the app to Marathi and metres from one place and mutes the push groups they do not need, and the whole app follows without a reload; without it those settings have no home.
**PRD rows:** F3-03 (P0), F3-23 (P1), F6-15 (P2)
**DESIGN:** SCR-M01-11 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-11-profile-preferences.md`; they are the specification.
**Data model:** none — reads `user_account.interface_language` and `unit_preference` authored by `T-M01-025` (migration 0002) and the per-user push mutes (`notification_preference`) that `T-FPLAT-018` owns (F6-15).
**Contract:** `packages/contracts/src/session.ts` — GET /auth/session. The writes of `interface_language` and `unit_preference` are `T-M01-025`'s `PATCH /users/me` (landed, #40); a language choice goes through `useI18n().setLocale`, which `T-FPLAT-005` persists and every mount follows. **Gap recorded, not filled:** the push-mute read and write per type-group have no route — owed to `T-FPLAT-018` beside `notification_preference`, with F6's type-groups replacing the five drawn ones, settled before the build. `uiLanguageSchema` (`locale.ts`) and `unitsPrefSchema` (`common.ts`) exist.
**Depends on:** `T-M01-025` (migration 0002; the profile write) · `T-FPLAT-018` (the type-group registry and the per-user mute) · `T-FPLAT-005` (the immediate re-render, F3-04) · `T-FPLAT-008` (`resolveMeasurementSystem`, `PROCUREMENT_SYSTEM` — landed) · `T-FPLAT-007` (Devanagari on mobile).
**Out of scope:** the first-run picker — `T-M01-003`, `T-M01-009`; the role card it re-opens — `T-M01-010`; name and photo — `T-M01-009`; sign-out — `T-SHELL-001`; the metric law on procurement surfaces — the BOM and procurement screens read `PROCUREMENT_SYSTEM`; the notification records and delivery — `T-FPLAT-018`.
**DONE WHEN:**
- Given any user of any preset, when they open onboarding for the first time and when they open their profile afterwards, then a language picker is available on both platforms, listing each language in its own script and name (`F3-03`). → proof: QA web · ios · android More → Profile on mobile and the sidebar on web both list the languages in their own scripts, and choosing one redraws the screen in it with no Save
- Given a user with a non-default measurement preference, when they open a procurement or BOM quantity, then it is metric (`F3-23`). → proof: unit packages/domain/tests/format/measurement.test.ts — `PROCUREMENT_SYSTEM` is a constant, not a preference (existing case); QA (web and phone) a BOM quantity renders metric with `ft` chosen once the studio's BOM lands
- (F6-15 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text in the brief is the binding criterion.) → proof: QA (web and phone) muting a type-group stops its push while its in-app record still lands; the Owner's billing and compliance group renders locked and cannot be muted
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-012 · Team
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner sees everyone with the presets they hold, when they were last active and whether an invite is still pending, and ends a leaver's access from one tap that also kills their sessions within ten minutes; without it there is no way to run the team or revoke a device.
**PRD rows:** M01-19 (P0), F2-10 (P0), F2-19 (P0)
**DESIGN:** SCR-M01-12 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-12-team.md`; they are the specification.
**Data model:** none — reads `tenant_membership`, `membership_role`, `user_account` and `session` authored by `T-M01-025` (migration 0002) and `invitation` authored by `T-M01-028` (migration 0005).
**Contract:** `packages/contracts/src/invitation.ts` — GET /invitations (pending and expired) · POST /invitations/{id}/revoke · `packages/contracts/src/auth.ts` — POST /auth/sign-out-everywhere (the actor's own) · `packages/contracts/src/session.ts` — GET /auth/session. **Gap filled at `T-M01-025`'s `/start`:** the roster is `GET /tenants/me/members` (`tenant.ts`, `T-M01-025`) over the `(tenant_id, status, last_active)` index; the deactivate transition is `POST /tenants/me/members/{membershipId}/deactivate` (`tenant.ts`, `T-FPLAT-003`).
**Depends on:** `T-M01-025` (migration 0002; the roster read, the guard for `onboarding.manage_team`, the revocation sweep) · `T-M01-028` (migration 0005; the invite list and revoke) · `T-FPLAT-003` (the last-Owner, last-Manage-team and deactivation transitions) · `T-FPLAT-004` (the audit entry a blocked attempt writes).
**Out of scope:** the guards and the deactivation transition — `T-FPLAT-003`; session revocation — `T-M01-025`; the audit row — `T-FPLAT-004`; reassignment of open work on deactivation — the owning modules' pickers (M02, M08); reactivation — no row of this slice, reported by the brief and not invented here; the assignment pickers that exclude the deactivated — each module's own picker over the roster read; the Invite screen and a person's Assign-roles screen — `T-M01-007`, `T-M01-013` — which open from here, land after this one and each wire their own entry, so neither is a build dependency of this screen.
**DONE WHEN:**
- Given an attempt to deactivate the last EPC Owner, when it is submitted, then it is blocked with an explanation and the blocked attempt is audit-logged (M01-19, M01-18, F2-19/F2-22). → proof: QA (web and phone) in a one-owner tenant the owner's own row keeps *Deactivate* as the danger row pill, disabled, `aria-disabled` and focusable, at both widths, with no line under it, and a tap or keyboard focus opens its `disabledReason` *Only EPC Owner* in the reason bubble; QA (api) the write is refused with the F2-19 reason and an audit row exists — the guard's unit is `T-FPLAT-003`'s
- Given a deactivated person, when the Team screen is read, then their history remains attributed to them, their role chips and status render, and they are absent from assignment pickers (M01-19, M01-18, F2-20). → proof: QA (web and phone) a deactivated row keeps name, chips, status and last-active undimmed, their lead history still names them, and a lead-assignment picker omits them
- Given a deactivation or "sign out everywhere", when it is issued, then every session of that user ends within 10 minutes (M01-07). → proof: QA (api) deactivate a member holding a live mobile token: `/auth/refresh` on that device is refused within the revocation window `T-M01-025` fixes; the sweep itself is `T-M01-025`'s unit
- Given a tenant with one EPC Owner, when anyone attempts to remove that person's Owner preset or deactivate them, then the attempt is blocked with an explanation and the blocked attempt is audit-logged (F2-19, F2-22). → proof: QA (api) removing the sole Owner's preset and deactivating them are both refused with the explanation and both attempts appear in the audit log
- (F2-10 carries no Team-screen Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief — all held presets shown as chips — is the binding criterion.) → proof: QA web · ios · android a person holding three presets shows them in F2's order, every held preset a whole chip that wraps — no cap and no *+1* — at 375 and at 1536
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

#### RFC

**RFC approved:** 2026-10-19 — D1 A, D2 A, D3 A, D4 A (owner rulings)

**1. Title** — `T-M01-012` — the owner sees the whole team in one list and ends a leaver's access in one tap.

**2. User impact** — Today More → Team opens a "coming later" page, so an EPC Owner cannot see who is on the team, whose invite is waiting, or stop a leaver's phone. After this task the owner opens Team on the phone or at 1536, sees every person with their role chips, status and last-active, finds a person by name or status, deactivates a leaver (every device signed out within 10 minutes), revokes a waiting invite and re-sends an expired one. The sole EPC Owner can never lock the company out.

**3. Analysis**

| line | finding | source | fix |
|---|---|---|---|
| Contract, Depends on (also `T-M01-007`, `-013`, `-014`) | **Wrong** — the capability is `onboarding.manage_team`; m01.manage_team (as written in those tasks) does not exist; only `epc_owner` holds it | `packages/domain/src/authz/onboarding.ts:10` | corrected in all four tasks in this change |
| Contract | **Wrong** — the roster route is guarded `member`, not by the capability; the screen is reached through the settings row `onboarding.manage_team` opens | `apps/api/src/modules/tenant/tenant.controller.ts:25`; `packages/domain/src/shell/settings-rows.ts:36` | the screen gates on `opensSettingsRow`, as `apps/mobile/src/screens/settings/SettingsRowScreen.tsx:30` does |
| AC-2 proof | **Wrong** — "their lead history still names them" and "a lead-assignment picker omits them" cannot run: no lead record and no picker exist before block 3 | `packages/domain/src/authz/crm.ts:37` is the only `assign_leads` fact | history → the audit log still names them as actor; picker → the roster read returns `status: deactivated`, the field a picker filters on; a deferred row for the first M02 picker (§14) |
| brief, States | **Missing** — the locked boards draw states the brief does not list: *Find in this list* and the Status chips with counts (`m-query`, `m-filter`, `d-query`, `d-filter`), the pending invite's *Day N of 7* bar at 375, the head count at 1536, the *You* badge, the revoke confirm and both toasts, the refused write's banner, *Expired* in `warning` | `.design/M01/SCR-M01-12-Team-Mobile.dc.html:43`, `:64`, `:432`, `:578`, `:769`; `-Desktop.dc.html:464`, `:544` | the brief gains these states in build step 1 (the locked board is the source for the look) |
| brief, States | **Missing** — no frame shows a search with no match | both boards | D2 |
| board copy | **Wrong** — three sentences guess a pronoun from a name (*her history stays hers*, *invite her again*, *Inviting her again*); the product holds no gender | `-Mobile.dc.html:334`, `:433`, `:770` | D3 |
| brief, States | **Missing** — no words for: an active member never seen (`lastActiveAt` null), a deactivate that answers 409 (already deactivated elsewhere), *Invite again* refused (409 `ALREADY_MEMBER`/`ALREADY_INVITED`, 429 `INVITE_CAP_REACHED`, 422), one of the two reads failing, a second Owner deactivating themself | `packages/contracts/src/tenant.ts:66`, `:224`; `packages/contracts/src/invitation.ts:110-113` | §5 *Edges* — each reuses words that exist, or drops a part of a line; no new copy |
| Contract | **Missing** — "Invite again" has no route of its own; `POST /invitations` with the expired invite's name, phone and roles sends a new one, because an expired invite is not live | `apps/api/src/modules/invitation/invitation.repository.ts:103` (`hasLiveInvite` at `act.now`) | reuse `create` with a creation key; no new route |
| Contract | **Missing** — `GET /invitations` returns every expired invite ever sent, repeats for one phone and phones now on the team | `apps/api/tests/invitations/lifecycle.test.ts:156-167` | the view-model keeps the newest invite per phone and drops a phone that is on the team (AC-10) |
| Contract | **Missing** — the 422 refusal carries only `LAST_OWNER`; the refused banner names who stopped being an Owner | `packages/contracts/src/tenant.ts:97`; `packages/domain/src/authz/administration.ts:15` | on the refusal the screen re-reads the roster; `ownerLostBetween(before, after)` names the one Owner present before and gone after; not exactly one → the banner shows its title only |
| Reuse | **Missing** — `formatDate` always prints the year; the boards print *30 Aug*, *Expires 5 Sept*, *Today, 08:47* | `packages/domain/src/format/datetime.ts:73-77`; `-Desktop.dc.html:475-483` | add `formatDayMonth` and `isTenantToday` beside it, unit-tested (part b) |
| Contract comment | **Wrong** — `expiresAt` "rendered with its provenance tier"; a date carries none | `packages/contracts/src/invitation.ts:50`; `F8-01` | fix the comment (Law 8, part b) |
| deferred D264, D259 | **Wrong trigger** — written for `T-M01-007` and `T-M01-011`, but Team, earlier in the walk, draws the reason bubble (`m-guard`) and the side list (`d-default`) first | build order walk 006 → 007 → 012 | D259 joins part a, D264 part c |
| Out of scope | holds — *Invite teammate*, the teaching state's action and the active row's open to Assign Roles are wired by `T-M01-007` and `T-M01-013` | task *Out of scope* | D1 |
| Over-built | none — the acts reuse every route `T-M01-028` and `T-FPLAT-003` shipped; no migration, no api route |

Assumptions:
- A team fits in a few pages: the screen reads every page of `GET /tenants/me/members` and `GET /invitations?status=pending` and `?status=expired` at `limit=100` (`packages/contracts/src/common.ts:184`). `assumed` — no PRD team size.
- A second Owner who deactivates themself loses the session on the server (`apps/api/src/modules/tenant/tenant.service.ts:144`). The screen then calls the store's `signOut()` (`packages/data/src/session/store.ts:249`), which lands on the sign-in door — no reliance on the next call's refusal.

**4. Scope**
- In: the Team screen on web (`/more/team`) and phone (More → Team), every board state, search and the Status chips, deactivate with its confirm and refusal, the sole Owner's resting guard, revoke with confirm and toast, invite again; the settings side list at 1536 on every built settings page; the phone sub-page bar; the design-system ports Team draws (§7).
- Out: the Invite screen and its entry (`T-M01-007`), Assign Roles and the row open (`T-M01-013`), reactivation (no PRD row), reassigning open work (D220 → `T-M02-011`), `DataTable`'s per-row open (→ `T-M01-013`).
- Targets: `M01-07` ≤10 minutes, held by `API_TOKEN_MINUTES = 10` (`packages/domain/src/auth/session-policy.ts:19`).

**5. Proposal**
- Read: More → Team → `useTeam()` reads members and both invite statuses → `teamRoster(members, invites, viewerUserId, now, pack)` returns rows → `teamRosterView(rows, query, status)` returns the visible rows, the chip counts (each over the rows matching the search) and the head count. Order (AC-10): pending invites by name, expired invites by name, active members by name, deactivated by name; names compare with `Intl.Collator` in the reader's language (`assumed` acceptable for Devanagari names).
- Row: status, line, role chips in F2 order with their kind, the one act and whether it is off (sole EPC Owner: `keepsControl`, `administration.ts:15`), *You* when `userId` equals the session's `actor.userId` (`packages/contracts/src/session.ts:25`).
- Acts: Deactivate → confirm (sheet at 375, modal at 1536, not dismissible) → `POST …/deactivate` → 200: the roster refreshes, the row moves last, toast. 422 `LAST_OWNER`: the confirm turns into the refused form. Revoke → confirm → `POST /invitations/{id}/revoke` → toast. Invite again → `POST /invitations` with a creation key → the roster refreshes, the row reads *Invited*.
- Edges: deactivate 409 → refresh, the row shows *Deactivated*, no toast. Invite again 409 → refresh; 429 and 422 → a danger toast with the shipped words for the code (`packages/i18n/src/copy/api-error.ts:55-65`). A read fails, or one of the two → the error state; *Try again* re-reads both. `lastActiveAt` null → the line reads *Active* alone; the 1536 cell is empty. Self-deactivate → `signOut()` → the sign-in door.
- Law 11: one view-model in `packages/domain/src/tenancy/team-roster.ts`; role kind is `Record<RolePreset, RoleKind>` in `packages/domain/src/authz/role-kinds.ts` (D265), so a new preset fails typecheck until it has a kind.
- Twin: web `apps/web/features/team/` ↔ phone `apps/mobile/src/screens/team/`. Shared: the view-model, the words (`packages/i18n/src/copy/team.ts`), the member card (D4 — the web draws it below 768, the phone always), the confirm (`EditorSurface`), `Avatar`, `Badge`, `StatusChip`, `SearchField`, `FilterChips`, `Banner`, `ToastHost`. Web only: the 1536 table, `DataTable` with `head="quiet"` (its stacked form is not used; the card is D4's).
- Reused: `TenantRepository`, `InvitationRepository` (`packages/data/src/tenant/repository.ts:24`, `invitation/repository.ts:18`), `presetName` (`packages/i18n/src/copy/shell.ts:127`), `INVITATION_EXPIRY_DAYS` (`packages/domain/src/auth/invitation-policy.ts:21`), `formatClockAt` (`datetime.ts:102`), `EditorSurface`, `ToastHost`, `Banner`, `LoadingBars`, `FilterChips` (`packages/ui/src/components/FilterBar/FilterBar.types.ts:27`).

**6. Frame map** (`.design/M01/`, lock `1792385892-ae04`). *Invite teammate* on m-default, m-query, m-filter, m-loading, m-error, m-deactivate and every d-frame, and the teaching action, are **not built here** (D1).

| frame | state | element → component + props + copy + tokens |
|---|---|---|
| m-default | normal, 375 | `MobileTopBar` title *Team*, leading round `ShellAction` *Back to settings* chevron-left, search; body pad `--sp-1 --screen-pad-mobile --sp-6`, gap `--sp-4` (built: the held head carries `--sp-2` above and `--sp-4` below as its own padding — owner ruling 2026-10-19, D287); list head sticky, gap `--tile-gap`: `SearchField` 50 tall *Find in this list*, `FilterChips` label *Status*, `scroll`, All · Invited · Expired · Active · Deactivated with counts; card (D4): `--fill`, `--r-tile`, pad `--sp-4`, gap `--sp-3`; `Avatar` 48 `hue`, status mark 11 px in an 18 px `--canvas` ring (invited `--info`, expired `--warning`, active `--success`, deactivated `--neutral`); name `--fs-body` bold + `Badge` accent functional *You*; line `--fs-body-sm` `--text-secondary`; roles `Badge` functional, kind tone, gap `calc(--sp-3/2)`; foot `Button` md fullWidth |
| m-default | invited row | line *Invited* (the role badges carry the roles; owner ruling 2026-10-19); `ProgressBar` 6 px, value day/7·100; *Day N of 7* secondary, *Expires 5 Sept* primary; *Revoke invite* secondary + undo glyph |
| m-default | expired row | *Expired 27 Aug*; *Invite again* primary + send glyph |
| m-default | active row | *Active · last seen today* / *Active · last seen 30 Aug*; *Deactivate* secondary `tone="danger"` + user-minus glyph |
| m-query | search | `SearchField` *Kulkarni* with clear; counts of matches; section label *Everyone at <company> matching <query>* |
| m-filter | Expired chip | only expired rows |
| m-filter-empty | a chip with nobody under it | no frame: the no-match form (owner ruling 2026-10-19) — `EmptyState` icon people xl, *No open invites* · *No expired invites* · *No one active* · *No one deactivated* by the chip, `Button` secondary lg *Show all* back to *All*, focus to the *All* chip on the web; the same at 1536 in place of the table |
| m-loading | loading | chips without counts; three placeholder cards (avatar 48, two bars `--sp-3`, chip bar `--sp-6`, 44 act bar), shimmer 1.4 s; `role=status` *Loading your team* |
| m-teaching | only the reader | the reader's card, then `EmptyState` icon people xl, *It's just you so far*, *Invite the people who sell, survey, design and install.*; no list head |
| m-error | a read failed | `Banner` state functional *The team list didn't load*, `BannerAction` *Try again*; no roster |
| m-deactivate | confirm | `EditorSurface` inset, `desktop="modal"`, not dismissible, no close, no handle, modal danger sm; title *Deactivate Anjali Kulkarni?*; body `--fs-body-sm` secondary (D3); `SheetActions`: `destructive` lg *Deactivate Anjali*, ghost lg *Cancel* |
| m-deactivated | after | bar `scrolled`; row last, *Deactivated · last seen …*, no act, not dimmed; toast neutral *Anjali Kulkarni deactivated* |
| m-revoke | revoke confirm | as m-deactivate; *Revoke Priya Deshmukh's invite?*; go *Revoke invite*; body (D3) |
| m-revoked | after | row gone; toast neutral *Invite to Priya Deshmukh revoked* + line (D3) |
| m-guard | sole Owner at rest | own card's *Deactivate* danger pill `disabled`, `disabledReason` *Only EPC Owner* in the `Explainer` bubble on tap, focus or hover; no line under it |
| m-refused | 422 `LAST_OWNER` | `Banner` validation *Not done — <company> must keep one EPC Owner*, body *<name> stopped being an EPC Owner on another device.*; `destructive` *Deactivate Rajesh* off, reason *Make someone else an EPC Owner first*; ghost *Close* |
| d-default | normal, 1536 | `AppShell`; side list 248 px, current row `--accent-subtle` `--accent` bold, rows 44, group overlines; content gap `--sp-6`; *Team* `--fs-h2` bold + *9 people · 2 invites* `--fs-body-sm` secondary (people = active + deactivated, invites = pending + expired, each singular or plural); list head sticky: `SearchField` to `--form-max`, `FilterChips` wrapping; `DataTable` `head="quiet"`: 2.2 : 2.4 : 1.2 : 160 px, head `--fs-caption` secondary, *Actions* visually hidden; one `--surface` card radius 20 `--e2`; rows min 82, pad `14px --sp-5`, hairline `--line-soft`; Person = `Avatar` 40 + name + `StatusChip` functional; Roles = `Badge`s; Last active = *Today, 08:47* / *30 Aug, 19:12* / *Expires 5 Sept* (no bar) / *Expired 27 Aug*; act `Button` sm right-aligned |
| d-query, d-filter | search, chip | as at 375 |
| d-loading | loading | head row kept; three placeholder rows 82 tall; no head count |
| d-deactivate | confirm | centred modal sm, as m-deactivate |

Hindi and Marathi drafted in part b, for a native review: every word in `packages/i18n/src/copy/team.ts` (the Team words, row words, status and empty-chip words) and *Show all* — written by hand in both `.po` files. The month stays the locale's own: *Expires 5 Sept* in English (owner ruling 2026-10-19; the boards now print it).

**7. Changes**
- Packages: domain exports `ROLE_KINDS`, `RoleKind`, `roleKind`, `teamRoster`, `teamRosterView`, `ownerLostBetween`, `inviteAgainOf`, `formatDayMonth`, `isTenantToday`; ui extends `RecordCard` (D4), `Avatar.hue`, `Badge` tones `violet`/`blue`/`magenta`, `Button.tone="danger"`, `Explainer.trigger` (D264), `DataTable.head="quiet"`, `MobileTopBar.scrolled`, `SettingsList`'s side form, `SearchField` and `FilterChips` in the open page's look (D145), glyphs undo, user-minus, send; i18n adds `copy/team.ts`; data adds `queryKeys.team.*`, `useTeam`, `useTeamActs`. Direction unchanged.
- Law 12: `ROLE_KINDS` → `Record<RolePreset, RoleKind>` (typecheck) and invariant `vocabulary-copies`; the iris tones → the adherence lint; the new web route `/more/team` and phone screen `team` → invariant `e2e-flow-per-screen` (`.claude/protections.md:137`). No api route, table or error code.
- Data and schema: none. API and contracts: none (reads `members`, `invitations.list`; writes `deactivateMember`, `invitations.revoke`, `invitations.create`); one comment fixed. Jobs: none.
- Files:

| part | action | path | purpose |
|---|---|---|---|
| a | modify | `packages/theme/src/_generated/contracts/{navigation/AppShell,forms/SearchField,data/FilterBar}.d.ts.txt` | `ds:pull` at the lock, only the typings part a ports; parts b and c pull their own (Avatar, Chip, NextAction, DataTable; Button, IconButton, Explainer) |
| a | modify | `packages/ui/src/components/SettingsList/{SettingsList.types.ts,SettingsList.tsx,SettingsList.css}` | side form (D259) |
| a | modify | `packages/ui/src/components/AppShell/{AppShell.types.ts,AppShell.css,MobileTopBar.tsx,MobileTopBar.native.tsx}`, add `MobileTopBar.css`, modify `packages/ui/src/styles.css` | `scrolled` (D255); the bar's rules move to their own sheet so `AppShell.css` stays under 300 lines |
| a | modify | `packages/ui/src/components/SearchField/*`, `FilterBar/*` (`FilterChips`, `FacetChips`, `FiltersButton`, `FilterPill.native`, types) | the open page's look (D145). Added as they landed: the pulled `SearchField` typing declares `onFilterClick`, `filterCount`, `filterLabel`, which `design-system-props` makes the repo declare, so the 50×50 filter square beside the pill (`FiltersButton`) is ported with it; `FacetChips` shares the chip pill, so it takes the near-black chosen look too; `FilterOption` takes the design system's `icon`. No screen draws the square yet |
| a | modify | `apps/mobile/src/screens/shell/components/ShellPage.tsx` | round back, search, scroll lift (D252, D255) |
| a | add | `tests/e2e/components/SettingsList.spec.tsx` + `SettingsList.story.tsx` (extend), `SearchField.spec.tsx`, `MobileTopBar.spec.tsx` (extend); modify `packages/ui/src/primitives/Ground/Ground.css` (the search pill is a ground, so its clear button is white) | specs; ground |
| a | modify | `tests/e2e/web/more-company-profile.spec.ts` + snapshots | regression |
| a | modify | `packages/ui/src/components/CompanyProfile/{CompanyProfile.tsx,CompanyProfile.css}`, `tests/e2e/components/CompanyProfile.settings.spec.tsx` | found live after QA: beside the side list the profile's two columns were sized from the window, so at a 1015 window the column was 103 px; the settings pair now measures its own room (a container) and below 976 px the column takes it and the letterhead steps aside |
| a | modify | `packages/domain/src/tenancy/{company-profile-life.ts,index.ts}` (`announcesSave`) + `tests/tenancy/company-profile-life.test.ts`, `packages/data/src/react/use-company-profile.ts` (`onSaved`), `packages/i18n/src/copy/company-profile.ts` + `src/locales/{en,hi,mr}/messages.{po,ts}`, `apps/web/features/onboarding/CompanyProfileScreen.tsx`, `apps/mobile/src/screens/company-profile/components/ProfileEditor.tsx`, `docs/ux/briefs/SCR-M01-05-business-profile.md` (ruling 59, `## Redesign owed`) | AC-20 (owner ruling after QA): a save that lands in the settings life says so in a toast |
| a | modify | `packages/domain/src/shell/{settings-rows.ts,index.ts}` + `tests/shell/settings-rows.test.ts` (`firstSettingsPageBeside`); add `packages/ui/src/components/AppShell/use-desktop-shell{,.native}.ts` (exported; the one desktop-width hook, read from the theme's `--bp-desktop`); modify `apps/web/features/settings/{SettingsScreen.tsx,SettingsLayout.tsx,hooks/use-settings-list.ts}`, `apps/web/features/shell/ShellScreen.tsx` (a rail press closes the notification centre); `packages/ui/src/components/SettingsList/{SettingsList.tsx,.native.tsx,.css,.logic.ts,.types.ts}`; `tests/e2e/web/{more.spec.ts,more-[row].spec.ts}`, `tests/e2e/components/SettingsList.spec.tsx`; `docs/ux/briefs/SCR-SHELL-01-app-shell.md` (ruling + `## Redesign owed`), `SCR-SHELL-03` brief | AC-19 (owner ruling after QA): `More` at the desktop width opens the first settings page beside the side list; the list page's three-column desktop form it orphans is removed; a rail press closes the centre, so `More` never lands on a page whose side list the open centre hides |
| a | modify | `tests/e2e/web/more-[row].spec.ts` desktop look; add `apps/web/app/(inside)/more/layout.tsx`, `apps/web/features/settings/{SettingsLayout.tsx,settings.css}`; modify `packages/ui/src/primitives/Pressable/*` (`current` → `aria-current="page"`), add `packages/ui/src/components/SettingsList/SettingsSideList{,.native}.tsx` | added as they landed: one layout gives every page under `/more` the side list, so every settings page's 1536 look changes; the side rows announce the page in view through `Pressable` |
| b | modify | `docs/ux/briefs/SCR-M01-12-team.md`, `docs/tasks/M01-onboarding.md` (`T-M01-007` AC, D1 A) | brief states; task lines |
| b | add | `packages/domain/src/authz/role-kinds.ts`, `src/tenancy/team-roster.ts`; modify `src/format/datetime.ts`, both indexes; add `tests/authz/role-kinds.test.ts`, `tests/tenancy/team-roster.test.ts`, extend `tests/format/datetime.test.ts` | kinds, view-model, day-month |
| b | add | `packages/i18n/src/copy/team.ts`, index line, `tests/team.test.ts`; `src/locales/{en,hi,mr}/messages.{po,ts}` | words |
| b | modify | `packages/data/src/cache/keys.ts`; add `src/react/use-team.ts`; `src/react/index.ts` | the read |
| b | modify | `packages/ui/src/components/{Avatar,Chip,NextAction,DataTable}/*` | hue, iris tones, the card (D4), quiet head |
| b | modify | `packages/contracts/src/invitation.ts` | the `expiresAt` comment |
| b | add | `apps/web/app/(inside)/more/team/page.tsx`, `apps/web/features/team/{TeamScreen.tsx,components/TeamTable.tsx,team.css,index.ts}` | web screen |
| b | add | `apps/mobile/src/screens/team/{TeamScreen.tsx,styles.ts,index.ts}`; modify `screens/settings/SettingsRowScreen.tsx` | phone screen, `BUILT_ROW.team` |
| b | add | `tests/e2e/web/more-team.spec.ts` + `landing-{phone,desktop}-linux.png`, `tests/e2e/mobile/team.yaml`, `tests/e2e/mobile/run.sh`, `tests/e2e/components/NextAction.spec.tsx` (extend); modify `tests/e2e/web/more-[row].spec.ts` (+ snapshots) to an unbuilt row (`roles`) | proof, regression |
| b | modify | `packages/theme/src/_generated/contracts/data/{Avatar,Chip,NextAction,DataTable}.d.ts.txt`, add `TileActions.d.ts.txt`, `.design/M01/design-system.version` | added as they landed: the typings pulled at design-system changes 7, 19 and 20 (change 20, `DataTable` `head="quiet"`, on the owner's yes during the build — the RFC had not named it a design-system change); the M01 lock moves to the new version on the markup proof (owner ruling 2 A); version `1792423921-7279` only renumbers changes 19 and 20 in comments, and both Team boards equal a fresh canvas read at it |
| b | add | `packages/ui/src/components/TileActions/*`, `NextAction/{RecordCard,RecordCardSlots}*`, `RecordCard.css` | added as they landed: `RecordCard`'s typing declares `actions`, so `TileActions` is ported with it (D145); `RecordCard` leaves the `NextAction` files, which went over 300 lines |
| b | add | `packages/ui/src/components/MemberCard/*` (`MemberCard`, `MemberCardsLoading`, `MemberList`, `MemberPerson`, `memberCardOf`), `packages/i18n/src/copy/team-list.ts` (`teamListWords`), `packages/domain` `teamSurface`, `packages/ui/src/utils/format.ts` (`dayMonth`, `isToday`) | added as they landed: the phone and the web below the table's width draw the same card, list body and words, so each is authored once (`.claude/rules/screen-parts.md`); the table's person cell holds the avatar's size, which a screen may not write |
| b | modify | `packages/ui/src/components/DataTable/*` (+ `DataTableQuiet{.tsx,.native.tsx,.css}`, `DATA_TABLE_STACK_BELOW`), `tests/e2e/components/DataTable.spec.tsx` | the quiet head, both halves; the web Team page switches to its cards at the width the table stacks at |
| b | modify | `apps/mobile/src/screens/shell/{components/ShellFrame.tsx,components/ShellPage.tsx,styles.ts}` | added as it landed: the board's list head stays put while the list scrolls (`stickyHead`) |
| b | modify | `tests/invariants/src/e2e-flow-per-screen.ts` (`team` held) | in place of `tests/e2e/mobile/team.yaml` and its `run.sh` line: no Maestro flow reaches a screen behind a company (the reason `shell`, `settings` and `company-profile` are held); the phone side is proven by the qa-ios and qa-android rows |
| b | add | `tests/e2e/components/{MemberList.spec.tsx,MemberList.story.tsx,Badge.spec.tsx}`, `tests/e2e/support/iris.ts`; modify `SearchField.spec.tsx`, `packages/ui/src/index.ts` (names the iris values the component tests read) | added at QA: the list's five states and the empty chip on the web half (the live web cannot show `m-error`), the iris parity, one clear button |
| b | modify | `packages/ui/src/components/SearchField/SearchField.css`, `apps/web/features/team/TeamScreen.tsx` | added at QA: the browser's own search cancel hidden; focus returns to the search or the *All* chip when *Clear search* or *Show all* leaves |
| b | modify | `packages/domain/src/tenancy/team-roster.ts` (`empty-chip`), `packages/i18n/src/copy/{team.ts,team-list.ts,closed-vocabularies.ts}` (`TEAM_EMPTY_CHIP`, *Show all*), `MemberCard/{MemberCard.logic.ts,MemberList*.tsx}` (`memberListEmptyOf`), both screens (`onShowAll`) | owner ruling 2026-10-19: a chip with nobody under it says so, with *Show all* |
| b | add | `packages/config/biome/folded-region.grit`, `biome.json`; modify `Checklist`, `DataTableChrome`, `DateSet`, `SourceDocument` native halves, `.claude/protections.md`, `docs/engineering/17-ui-architecture-v2.md` | added at QA: Android folded the list's named region; the rule makes every native region keep its name |
| b | modify | `.claude/agents/code-reviewer.md`, `docs/tasks/deferred.md` (D285) | added at QA: a control that removes itself hands focus on; the web's narrow settings page has no way back |
| b | modify | `.design/M01/SCR-M01-12-Team-{Desktop,Mobile}.dc.html` | owner ruling 2026-10-19: the boards print *Expires 5 Sept*, a fresh canvas read |
| b | modify | `tests/invariants/src/ui-colour-pairs.ts` (`hg-iris` named) | added at the gate: the iris tint is two `color-mix` values no single token measures; `Badge.spec.tsx` holds each hue's words at 4.5:1 or more |
| b | modify | `apps/mobile/src/screens/shell/{components/ShellFrame.tsx,styles.ts}`, `apps/mobile/CLAUDE.md` (Traps), `.claude/agents/{qa-android,qa-ios}.md`, `.claude/skills/task/SKILL.md` | found by the owner after QA: React Native moved the held head's style to its wrapper, so search and chips sat flush and the list met the chips on scroll; the head's parts take the 10 `--tile-gap` from an inner view, and the head holds `sp-2` above and `sp-4` below as its own white padding (owner ruling: the search never meets the bar when held, so it rests 4 lower than the frame). The phone helpers now compare held parts at rest and after a scroll, and a report that skipped its board compare is sent back |
| c | modify | `packages/ui/src/components/{Button,IconButton,Explainer,ActionReason}/*`, `AppShell/ShellGlyph.logic.ts` | danger tone, glyphs (D265), reason bubble (D264) |
| c | add | `packages/data/src/react/use-team-acts.ts`, index line | deactivate, revoke, invite again |
| c | modify | `packages/domain/src/tenancy/team-roster.ts` + test | `ownerLostBetween` |
| c | modify | `packages/i18n/src/copy/team.ts` + locales | confirm, toast, refusal words |
| c | add | `apps/web/features/team/components/TeamConfirm.tsx`, `apps/mobile/src/screens/team/components/TeamConfirm.tsx`; modify both screens | the acts |
| c | add | `tests/e2e/components/{Explainer,TeamConfirm}.spec.tsx`; extend `more-team.spec.ts`, `team.yaml` | proof |

**8. Diagram** — No boundary change.

**9. Build steps**

| step | part | files | AC | done when |
|---|---|---|---|---|
| 1 | a | `ds:pull` of the three typings part a ports | — | typings at the lock |
| 2 | a | `SettingsList` side form, Business profile at desktop | AC-8 | spec green EN/HI/MR; 1536 shows the side list, no breadcrumb |
| 3 | a | `MobileTopBar.scrolled`, `ShellPage`, `SearchField`/`FilterChips` look | AC-9 | specs green; Business profile on iOS: round back, search, lift |
| 4 | b | brief, task lines | — | brief lists every board state |
| 5 | b | domain kinds, view-model, day-month (tests first) | AC-10, AC-11, AC-15 | tables green; order seen red once |
| 6 | b | i18n `team.ts`, data `useTeam` | — | extract clean; every page read |
| 7 | b | ui `Avatar`, `Badge`, `RecordCard`, `DataTable` head — `parallel` with step 6 | AC-5s | the owner's design-system yes for D4 A is in; specs green at 375/1536, EN/HI/MR |
| 8 | b | both screens, route, flows | AC-5w … AC-7, AC-14 | both match the frame map's read frames |
| 9 | c | ui `Button` tone + glyphs, `Explainer.trigger` | AC-1s | spec: announced, opens, stays after hover then click, closes |
| 10 | c | `useTeamActs`, `ownerLostBetween`, both confirms — a permission path, not parallel | AC-1 … AC-4, AC-12, AC-13, AC-16 … AC-18 | live rows pass |

**10. Risks**
- Tenancy: only the shipped tenant-scoped routes; a foreign `membershipId` answers 404 (P3).
- Permission: the client hides acts, the server decides (`onboarding.manage_team`, `keepsControl`); a stale read meets the refused form.
- Release: no stored or wire shape changes.
- Part c: the list keeps the newest pending or expired invite per phone and never reads revoked ones, so revoking a pending invite for a phone that also has an older expired one brings the expired one back as *Expired · Invite again* (AC-12 says the row leaves). Part c rules it: read revoked invites too and let the newest of any status decide, or write the return into the brief.
- Performance: one read per 100 members per status.

**11. Regression**
- Settings list and Business profile: `tests/e2e/web/more.spec.ts`, `more-company-profile.spec.ts`; qa-web P10 and qa-ios P11 (no phone settings flow exists, so the phone side is qa-ios only).
- Looks: `Avatar`'s `hue` now defaults to `auto` (design-system change 7), so every initials avatar takes its iris tint — the rail's account, the settings list's person row and side list — and the `e2e-web` baselines of `home`, `[door]`, `more`, `more-company-profile` and `more-[row]` (now on the Roles row) change with it; `more-team`'s two are new, its desktop one with the owner's *Last active* cell masked (it reads the run's clock). Each is copied from CI's run and listed in the PR body.
- Other settings rows' placeholder: `more-[row].spec.ts`, moved to `roles`.
- The four native regions that now keep their name on Android (`Checklist`, `DataTableChrome`'s selection band, `DateSet`, `SourceDocument`): `collapsable={false}` changes no layout; `Checklist.spec.tsx`, `DateSet.spec.tsx`, `SourceDocument.spec.tsx` and `DataTable.spec.tsx` run whole for their web halves, and the `folded-region` rule holds the native ones.
- `Button`, `Explainer`, `Avatar`, `Badge`, `DataTable`, `SearchField`, `FilterChips` callers: their component specs, run whole. `RecordCard`'s callers `NotificationCard.tsx` and `ListRow.tsx`: `NextAction.spec.tsx` and the notification centre's spec, run whole, and a qa-web row on the notification centre.

**12. Acceptance criteria** — `w` web, `i` iOS, `a` Android, `s` component spec or unit, `u` unit: one line proven on several surfaces is one AC per surface, each with one owner.

- AC-1 Given an attempt to deactivate the last EPC Owner, when it is submitted, then it is blocked with an explanation and the blocked attempt is audit-logged (M01-19, M01-18, F2-19/F2-22). → proof: QA (web and phone) in a one-owner tenant the owner's own row keeps *Deactivate* as the danger row pill, disabled, `aria-disabled` and focusable, at both widths, with no line under it, and a tap or keyboard focus opens its `disabledReason` *Only EPC Owner* in the reason bubble; QA (api) the write is refused with the F2-19 reason and an audit row exists — the guard's unit is `T-FPLAT-003`'s
- AC-2 Given a deactivated person, when the Team screen is read, then their history remains attributed to them, their role chips and status render, and they are absent from assignment pickers (M01-19, M01-18, F2-20). → proof: QA (web and phone) a deactivated row keeps name, chips, status and last-active undimmed, their lead history still names them, and a lead-assignment picker omits them
- AC-3 Given a deactivation or "sign out everywhere", when it is issued, then every session of that user ends within 10 minutes (M01-07). → proof: QA (api) deactivate a member holding a live mobile token: `/auth/refresh` on that device is refused within the revocation window `T-M01-025` fixes; the sweep itself is `T-M01-025`'s unit
- AC-4 Given a tenant with one EPC Owner, when anyone attempts to remove that person's Owner preset or deactivate them, then the attempt is blocked with an explanation and the blocked attempt is audit-logged (F2-19, F2-22). → proof: QA (api) removing the sole Owner's preset and deactivating them are both refused with the explanation and both attempts appear in the audit log
- AC-5 (F2-10 carries no Team-screen Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief — all held presets shown as chips — is the binding criterion.) → proof: QA web · ios · android a person holding three presets shows them in F2's order, every held preset a whole chip that wraps — no cap and no *+1* — at 375 and at 1536
- AC-6 Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both
- AC-7 Given people and invites, when the owner types in *Find in this list* or picks a Status chip, then only matching rows show and each chip's count counts the rows matching the search.
- AC-8 Given a built settings page at 1536, when it opens, then the person's settings list stands beside it, 248 px, the current row marked, and no breadcrumb shows.
- AC-9 Given a phone settings page opened from More, when it shows, then its bar has the round way back and the search button, and lifts once content scrolls under it.
- AC-10 Given members and invites in any arrival order, with repeats for one phone and an expired invite for a phone now on the team, when the list renders, then it shows pending invites, then expired, then active members, then deactivated, each by name, one invite per phone, and none for a phone on the team.
- AC-11 Given a pending invite at 375, when its row renders, then it shows *Day N of 7* on a bar and its expiry date; at 1536 it shows *Expires <date>* alone; an expired one shows *Expired <date>* and *Invite again*.
- AC-12 Given a pending invite, when the owner confirms *Revoke invite*, then the invite is revoked, its row leaves the list and the toast names the person; a second revoke answers 200, the status stays revoked and the log holds one `team.invite_revoked`.
- AC-13 Given an expired invite, when the owner taps *Invite again*, then one new pending invite with the same name, phone and roles exists and the row reads *Invited*; the same key twice makes one invite.
- AC-14 Given a reader without `onboarding.manage_team`, when they open `/more/team` or `heliogrid://more/team`, then the page says it does not exist (`F7-48`), as other unopened rows do.
- AC-15 Given a roster, when the 1536 heading renders, then it reads *<n> people · <m> invites* — people active plus deactivated, invites pending plus expired — singular at one, and nothing while loading.
- AC-16 Given a deactivate answered 409 or an *Invite again* answered 409, 422 or 429, when the answer lands, then a 409 refreshes the list with no error, and a 422 or 429 shows a danger toast in the shipped words for its code (`packages/i18n/src/copy/api-error.ts`); a code with no words of its own takes the `INTERNAL` words (`:43`) — `IDEMPOTENCY_KEY_REUSED` cannot arise here, since each tap mints one key for one fixed body.
- AC-19 Given a person whose settings list holds more than one row, when they open `More` on the web at the shell's desktop width, then their first settings page opens beside the settings side list, the browser's Back never returns to `/more`, and below that width and on the phone `More` stays the list page (owner ruling 2026-10-19).
- AC-20 Given the Business profile in settings on the web or the phone, when a save lands, then the page stays as it is and a neutral toast says *Business profile saved*; a failed save keeps its *Not saved* line and no toast; in setup no toast shows (owner ruling 2026-10-19, `SCR-M01-05` ruling 59).
- AC-18 Given the confirm open on a stale read, when another device has already left the reader the only EPC Owner, then the write is refused and the confirm shows the refused form, naming the Owner who stopped being one when exactly one did.
- AC-17 Given a second EPC Owner, when they deactivate themself and confirm, then the deactivation lands and their app goes to the sign-in door.

**13. Proof** — one owner per AC.

| row | AC | owner | surface | action → expected | data, setup, cleanup |
|---|---|---|---|---|---|
| P1 | AC-1 | qa-api | live | sole Owner deactivated → 422 `LAST_OWNER`; `GET /tenants/me/audit-log` holds a `team.member_deactivated` entry with `blocked: true` | `…904` |
| P1w | AC-1w | qa-web | live | one-owner tenant, 375 and 1536: own *Deactivate* is the danger pill, disabled, `aria-disabled`, focusable; click, focus or hover opens *Only EPC Owner*; no line under it | `…901` |
| P1i | AC-1i | qa-ios | live | the same on the phone, tap opens the bubble | `…902` |
| P1s | AC-1s | main-dev | spec | `tests/e2e/components/Explainer.spec.tsx` — the reason is announced, opens, stays after hover then click, closes on a second tap, outside, scroll, Escape | — |
| P2 | AC-2 | qa-api | live | deactivate a member → `GET /tenants/me/members` returns them `status: deactivated`; the audit log still names them as actor of their accept | a member invited and accepted through the app |
| P2w | AC-2w | qa-web | live | the row moves last, *Deactivated · last seen …*, name, chips and dates at ≥ 4.5:1, no act; toast | same |
| P2i | AC-2i | qa-ios | live | the same on the phone | same |
| P3 | AC-3 | qa-api | live | deactivate a member holding a live mobile token: their next call is refused, ≤ `API_TOKEN_MINUTES` = 10 (`session-policy.ts:19`, refused at `admission.ts:6-9`); their web cookie is refused on its next call; *sign out everywhere* (`auth.ts:208`) does the same for the actor's own two sessions; a foreign `membershipId` → 404 | `…904`, `…905` |
| P4 | AC-4 | qa-api | live | `PUT …/roles` dropping the sole Owner's `epc_owner` → 422 `LAST_OWNER`; deactivating them → 422; both logged `blocked: true` | `…904` |
| P5w | AC-5w | qa-web | live | a person holding three presets shows them in F2 order, whole chips that wrap, no cap, no *+1*, at 375 and 1536 | member with three presets |
| P5i | AC-5i | qa-ios | live | the same on iOS | same |
| P5a | AC-5a | qa-android | live | the same on Android (no phone settings flow of its own before this task) | `…903` |
| P5s | AC-5s | main-dev | spec | `NextAction.spec.tsx` three presets wrap whole at 375, EN/HI/MR | — |
| P6w | AC-6w | qa-web | live | every frame of §6 at 375 and 1536 except m-refused (part b: the read frames without row acts; part c: the acts and the act frames); m-error with the api stopped; the colour-literal lint clean | api stopped for m-error, last |
| P6i | AC-6i | qa-ios | live | every m-frame except m-refused (split by part as P6w); m-error with the api stopped; Hindi and Marathi layout: chips wrap, nothing clips | same |
| P6s | AC-6s | main-dev | spec | `TeamConfirm.spec.tsx` m-refused at 375 and 1536, EN/HI/MR | — |
| P7 | AC-7 | qa-web | live | type a surname → matching rows, counts follow; Expired chip → expired rows only | two invites, two Kulkarnis |
| P8 | AC-8 | qa-web | live | `/more/company-profile` and `/more/team` at 1536: side list 248 px, current row marked, no breadcrumb | `…901` |
| P19w | AC-19 | qa-web | live | at 1536 the rail's `More` → `/more/profile` with the side list, *Profile & preferences* current; Back leaves `More` instead of returning to `/more`; at 375 `/more` is the list page | `…901` |
| P20w | AC-20w | qa-web | live | `/more/company-profile`: change a field, *Save changes* → `PUT /settings/business-profile` 200 and the toast *Business profile saved*; a save made to fail in the browser → *Not saved* line, no toast; `more-company-profile.spec.ts` asserts the toast in CI; `company-profile.spec.ts` keeps a no-toast regression line for web setup | `…901` |
| P20u | AC-20u | main-dev | unit | `packages/domain/tests/tenancy/company-profile-life.test.ts` — `announcesSave`: settings and written → yes; settings with the logo refused → no; setup → no, both ways; both decisions seen red once | — |
| P20i | AC-20i | qa-ios | live | Business profile: change a field, *Save changes* → the toast; in Hindi the toast's words are the catalog's | `…902` |
| P9 | AC-9 | qa-ios | live | Business profile and Team: round back, search opens Search, bar lifts on scroll | `…902` |
| P10 | AC-10 | main-dev | unit | `packages/domain/tests/tenancy/team-roster.test.ts` — every arrival order, repeats per phone, a phone on the team, Devanagari names; seen red once | — |
| P11 | AC-11 | main-dev | unit | same file — day 0, 1, 6, 7, expired; `formatDayMonth` and `isTenantToday` at midnight either side in the tenant's zone | — |
| P12 | AC-12 | qa-api | live | revoke → 200 revoked; again → 200, one `team.invite_revoked` | invite sent through the app |
| P13s | AC-13u | main-dev | unit | `team-roster.test.ts` — `inviteAgainOf(row)` gives the expired invite's name, phone and roles in F2 order, and nothing for any other row; `useTeamActs` sends exactly that body with one creation key per tap (read in review) | — |
| P13 | AC-13 | main-dev | unit | `apps/api/tests/invitations/lifecycle.test.ts` — a send for a phone whose invite expired makes one new pending invite; one key twice makes one (a case added if missing). Live: not reachable — an invite expires after 7 days and QA cannot move the api's clock | test database |
| P14 | AC-14 | qa-web | live | a Sales Executive opens `/more/team` → not-found state | a Sales Executive invited into `…901`'s company — a new number outside `DEV_OTP_PHONES`, its code read from `.qa/api.log` |
| P15 | AC-15 | main-dev | unit | `team-roster.test.ts` — counts 0, 1, 2 of each, words singular and plural through `packages/i18n/tests/team.test.ts` | — |
| P16w | AC-16w | qa-web | live | open the confirm on a member; Main deactivates them through the api; confirm → no error, the row reads *Deactivated* | a member |
| P16 | AC-16 | main-dev | unit | `packages/i18n/tests/team.test.ts` and `team-roster.test.ts` — each code's words and the refresh decision | — |
| P17 | AC-17 | qa-web | live | a second Owner deactivates themself → their tab lands on the sign-in door | two Owners in `…901`'s tenant |
| P18 | AC-18 | qa-web | live | open the confirm on your own row with two Owners; Main drops the other Owner's preset through `PUT …/roles`; confirm → the refused form: banner *Not done — <company> must keep one EPC Owner*, *<name> stopped being an EPC Owner on another device.*, the act off with its reason, *Close* | two Owners in `…901`'s tenant |
| P18u | AC-18u | main-dev | unit | `team-roster.test.ts` — `ownerLostBetween`: one lost, none, two, the reader's own; seen red once | — |
| P19 | flows | ci | `e2e-web` | `more-team.spec.ts` (the reader's own card: the teaching state, since CI's company has no team) runs and passes; the phone has no Maestro flow behind a company (`team` is held in `e2e-flow-per-screen`), so its read frames are P5i, P5a, P6i and P9 | — |

**14. Deferred rows**
- Join and delete: D252, D255, D259 (part a; the settings section card moves to a new row, `T-M01-011 starts`), D145 (part a, the `SearchField`, filter square and chips look; the row stays for `TileActions` and the open-page `RecordCard`, `reopens when T-M01-012b starts`, which extends `RecordCard` under D4), D242 (part b, the quiet head; the per-row open moves to a new row, `T-M01-013 starts`), D264 (part c), D265 (parts b and c: `Avatar` hue, `Badge` tones, `Button` danger, role kinds, three glyphs; `IconButton` tone and the other six glyphs move to a new row, `T-M01-020 starts`), D257 (part b: Team renders no tiered date and the `expiresAt` comment is fixed; the two template comments move to a new row, `T-M01-019 starts`).
- Stay: D220 → `reopens when T-M02-011 starts`; D233 → owner only (drops `T-M01-012 starts`); D238 → `T-M01-015 starts` (Team draws no pressable `ListRow`).
- New: the first M02 assignment picker omits deactivated members — `T-M02-011 starts`.

**15. Size** — about 100 changed files: part a ~28, part b ~44, part c ~27; ~2,800 code lines, ~1,500 test lines. Part b is over 30: the read view cannot split again without shipping half a screen, and three parts is the cap.

**16. Decisions for the owner**
- D1 · Invite acts before `T-M01-007`: (A, recommended) Team ships without *Invite teammate* and the teaching state's action; `T-M01-007`, the next screen in the walk, adds both, and its DONE WHEN gains that line in this change. (B) Build `T-M01-007` first, so Team ships with them — two `Depends on:` lines change.
- D2 · A search with no match: (A, recommended) I draw a no-match frame (375 and 1536) on the M01 canvas before part b, and you lock it. (B) The build uses the system `EmptyState` with *No one matches "<text>"* and *Clear search*, shown to you at QA.
- D3 · Pronouns: (A, recommended) the name, never a pronoun — *Anjali loses access to Suryodaya Solar. Everything Anjali did stays in Anjali's name.* · *The invite link stops working now. You can invite Priya again any time.* · *Inviting Priya again sends a new link.* (B) keep the board's words.
- D4 · The member card: (A, recommended) extend `RecordCard` — it already holds the name, avatar, one status chip, wrapping marks and a bottom act — with a sub-line, a badge beside the name, the avatar's status mark and a detail slot (the invite bar); the design system's `RecordCard` gets the same props as a design-system change, which needs your yes on the canvas before part b builds. (B) a new `PersonCard`, which adds a second card shape.

#### Parts

| part | what | AC | depends on | status |
|---|---|---|---|---|
| a | Settings pages: the side list at 1536, and `More` opening the first settings page there; the phone sub-page bar (round back, search, lift); the open page's search and chips | AC-8, AC-9, AC-19, AC-20w, AC-20i, AC-20u | — | shipped |
| b | Team — read the whole team on web and phone: rows, every read state, search, Status chips, head count; no row act yet — the card's and the table's act slot stays empty until part c | AC-5w/i/a/s, AC-6w/i (read frames), AC-7, AC-10, AC-11, AC-14, AC-15 | a | shipped |
| c | Team — deactivate, the sole Owner's guard and the refusal, revoke, invite again, self-deactivate | AC-1, AC-1w/i/s, AC-2, AC-2w/i, AC-3, AC-4, AC-6w/i/s (act frames), AC-12, AC-13, AC-13u, AC-16, AC-16w, AC-17, AC-18, AC-18u | b | planned |

### T-M01-013 · Assign Roles
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner ticks the presets a person holds and reads, live, one sentence saying what that person can now do — stacking is the only way to widen access; without it a role change is a guess about a matrix nobody can see.
**PRD rows:** M01-20 (P0)
**DESIGN:** SCR-M01-13 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-13-assign-roles.md`; they are the specification.
**Data model:** none — reads `membership_role` authored by `T-M01-025` (migration 0002); presets and grants are `ROLE_PRESETS` and `CAPABILITY_MATRIX` in `packages/domain/src/authz/`, never tables.
**Contract:** `packages/contracts/src/session.ts` — GET /auth/session. The role-set write is `PUT /tenants/me/members/{membershipId}/roles` (`tenant.ts`, `T-FPLAT-003`): the whole set, old → new, refused with `LAST_OWNER` when it would remove the last EPC Owner. Domain type this task adds (Law 11): the grant-line view-model in `packages/domain/src/authz/` — the set of grants a preset combination yields, rendered through a whole translated sentence with slots and a per-language list joiner in `packages/i18n`, never name + "can" + phrases.
**Depends on:** `T-M01-025` (migration 0002; the guard for `onboarding.manage_team`) · `T-FPLAT-001` (the matrix — landed) · `T-FPLAT-003` (the role-set transition and the last-Owner guard it applies) · `T-FPLAT-004` (the old → new audit entry) · `T-M01-012` (the person's row it opens from).
**Out of scope:** the transition, its guards and audit — `T-FPLAT-003`, `T-FPLAT-004`; the role card that explains the same grants to their holder — `T-M01-010`; the read-only reference — `T-M01-014`.
**DONE WHEN:**
- Given the Assign-roles screen, when presets are toggled, then the plain-English grant line updates live to describe exactly the resulting grants (M01-20). → proof: QA web · ios · android toggling a preset updates the sentence before any save on both platforms; unit packages/domain/tests/authz/grant-line.test.ts — each combination yields exactly the grants the matrix ORs, and the Hindi and Marathi templates place the verb after the list
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-014 · Roles Reference
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** Before inviting, the owner reads what each of the twelve presets grants and how many people hold each — including none — and finds no way to edit a role, because none exists; without it every invite is composed from memory.
**PRD rows:** M01-21 (P0)
**DESIGN:** SCR-M01-14 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-14-roles-reference.md`; they are the specification.
**Data model:** none — reads holder counts over `membership_role` authored by `T-M01-025` (migration 0002, the `(tenant_id, role_preset)` index); descriptions and matrices are `CAPABILITY_MATRIX` and `packages/i18n` copy, never tables.
**Contract:** **Gap recorded, not filled:** the per-preset holder count has no route in any engine ticket — owed to `T-M01-025` (`tenant.ts`, the read its `membership_role` index exists for); settled before the build. Everything else on the screen is static: `ROLE_PRESETS`, `CAPABILITY_MATRIX`, `packages/i18n` descriptions.
**Depends on:** `T-M01-025` (migration 0002; the holder-count read, the guard for `onboarding.manage_team`) · `T-FPLAT-001` (the matrix — landed) · `T-M01-012` (the Team family it sits beside).
**Out of scope:** role editing — does not exist (F2-02, F2-16); the assignment surface — `T-M01-013`; the matrix's content — `T-FPLAT-001`, extended only by a product release.
**DONE WHEN:**
- Given the Roles reference, when it renders, then it is read-only, shows per-preset holder counts, and no role-editing action exists (M01-21). → proof: QA web · ios · android all twelve presets render in F2's order with a holder count that carries no tier (`F8-01`), a preset held by nobody shows 0, and no create, edit, duplicate or delete control exists on either platform
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px, and at 1536px except the brief's *Drawn at 375 only* list, where the phone's answer holds at width (owner ruling 2026-10-16), the colour-literal lint clean on both

### T-M01-015 · Catalog Settings
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner browses their market's panels and inverters beside their own SKUs in one list, sets their price and tax on a platform item, hides what they never stock, publishes a named release and keeps every past price-book version readable; without it the studio and the builder resolve against nothing and a rate edit rewrites history.
**PRD rows:** M01-32 (P0), M01-34 (P0), M01-35 (P0), M01-37 (P0), M01-38 (P0), M01-43 (P0), M01-48 (P0)
**DESIGN:** SCR-M01-15 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-15-catalog-settings.md`; they are the specification.
**Data model:** none — reads the eight catalog tables authored by `T-M01-027` (migration 0015) and `price_book_version`, `price_book_rate` authored by `T-M01-031` (migration 0016); the schemes it badges are `pack.certificationSchemes` (`T-FCORE-016`, migration 0001).
**Contract:** `packages/contracts/src/catalog.ts` — GET /catalog/items (the unified search with its filters) · GET /catalog/items/{id} (tier attribution, the open-draft count) · PUT /catalog/items/{id} · POST /catalog/items/{id}/archive · POST /catalog/items/{id}/unarchive · PUT, DELETE /catalog/items/{id}/override · POST, GET /catalog/items/{id}/rate-entries · GET /catalog/releases · GET /catalog/releases/{id} · POST /catalog/releases (the publish act with its label) · `packages/contracts/src/price-book.ts` — GET /price-book/active · GET /price-book/versions · GET /price-book/versions/{id} · POST /price-book/versions (the rates-panel publish) · `packages/contracts/src/market.ts` — GET /market-packs/{marketCode} (the declared schemes). Domain read: `resolveCatalogItem` / `ResolvedCatalogItem`, `CATALOG_PROVENANCE_LABELS`, `PRICE_BOOK_RATE_BASES` (`packages/domain/src/catalog/`); the price-book view-model is the wire's `priceBookActiveSchema` and `priceBookVersionSchema` (`packages/contracts/src/price-book.ts`).
**Depends on:** `T-M01-027` (migration 0015 and the catalog routes; the publisher ruling its release table waits on) · `T-M01-031` (migration 0016 and the price-book routes) · `T-FCORE-016` (migration 0001; the pack read) · `T-FCORE-001` (`badgedSchemes`, `holdsScheme` — landed) · `T-M01-025` (the guard for `onboarding.manage_catalog`; Finance's read-only money grant).
**Out of scope:** the resolver, the tables, the rate ledger and the release write — `T-M01-027`; the version structure — `T-M01-031`; the pinned-design staleness comparison and the "N designs will show as out of date" count — `T-FPLAT-028` and the studio's `design` pin columns (the count renders as absent until they land, per F8-01); the add sheet — `T-M01-016` and the import wizard — `T-M01-017`, which open from here, land after this screen and each wire their own entry and return, so neither is a build dependency; the DD12 pickers that share the search — `T-MS-201`, `T-MS-202`; audit of publishes — `T-FPLAT-004`.
**DONE WHEN:**
- Given a tenant with an override on a platform item, when any surface resolves that item, then the override's set fields win, an unset tax rate falls through to the pack's category rate and an unset price to nothing — the item's rate is absent unless an own SKU carries one — and own SKUs shadow nothing (M01-32, M01-37). → proof: QA web · ios · android the rates panel attributes each field to its tier on both platforms — the override price plain, the pack's tax struck under a tax override, a missing rate where neither tier supplies one; the resolution itself is `T-M01-027`'s unit
- Given a market whose pack declares certification schemes, when the picker or search renders an item, then compliance badges for exactly those schemes appear; given an empty scheme set, then no badges and no errors (M01-34). → proof: QA (web and phone) an IN tenant's list badges the two declared schemes per item, and a tenant on a pack with no schemes renders no badge column and no error
- Given any catalog item, when it renders in detail or picker, then its provenance label (verified-datasheet / tenant-provided / representative) is visible (M01-35). → proof: QA web · ios · android every row and every detail carries verified-datasheet, tenant-provided or representative on both platforms
- Given a search query with the source filter set to "own", when results render, then only tenant SKUs appear; given no source filter, then platform-slice items and own SKUs rank in one list with preferred items first (M01-38). → proof: QA (web and phone) source = own lists only the tenant's SKUs; no filter ranks preferred items first in one list; archived items appear only under the archived filter
- Given a catalog release publish, when designs pinned to an older label are next read, then they read as stale per F8 — visibly, never silently recomputed — and sent proposals are untouched (M01-43). → proof: QA (web) publishing a named release lists it append-only with its before-and-after and the sent proposal is untouched; the pinned designs turning stale is `T-FPLAT-028`'s and the studio's proof
- Given any rate change, when it is saved, then a new price-book version exists, the old one is untouched and browsable, and exactly one version is active (M01-48). → proof: QA (web and phone) saving the rates panel creates a new version, the previous one opens read-only from the versions list, and the panel marks exactly one active; the immutability is `T-M01-031`'s unit
- Given a person without `F2.M01.manage-catalog`, when they open Catalog settings, then administration actions are absent; given a person with `F2.M01.add-own-catalog-items` in the picker, then inline add is present (permissions). → proof: QA (web) an Operations member sees the administration acts, a Finance member sees prices and margin with none of them, and a Sales Executive opening a picker sees inline add
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px, and at 1536px except the brief's *Drawn at 375 only* list, where the phone's answer holds at width (owner ruling 2026-10-16), the colour-literal lint clean on both

### T-M01-016 · Add Catalog Item
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** A rep mid-proposal adds the panel the supplier just quoted — by typing it, by dropping the datasheet PDF, or through the spreadsheet path — and it is selected in place before the customer notices a pause; without it a missing product means leaving the builder for settings, or waiting on the platform.
**PRD rows:** M01-36 (P0), M01-39 (P0), M01-40 (P0)
**DESIGN:** SCR-M01-16 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-16-add-catalog-item.md`; they are the specification.
**Data model:** none — reads `tenant_catalog_item`, `catalog_item` and `catalog_rate_entry` authored by `T-M01-027` (migration 0015); the source datasheet attaches through the one `file` table (its slice has no task id yet).
**Contract:** `packages/contracts/src/catalog.ts` — POST /catalog/items (the single form and the datasheet-review save; a picker pre-fill carries brand, model and specs only — the server copies no certification and no price) · GET /catalog/items/{id} (the selected item the pre-filled sheet reads) · POST /catalog/items/{id}/rate-entries (the rate entered afresh) · `packages/contracts/src/market.ts` — GET /market-packs/{marketCode} (the scheme flags the tenant enters). Domain read: the per-kind spec envelopes and gates in `packages/domain/src/catalog/specs.ts` (field-addressable `details[]` on a gate failure). **Gap recorded, not filled:** the datasheet-PDF extraction has no route and no engine ticket — `T-M01-027` assigns the extraction engine and its `file` row to this task, which Law 11 forbids a screen to build; it needs an engine task of its own (an extraction job on the worker returning typed fields with the page each was read from, over the `file` slice), settled before the build.
**Depends on:** `T-M01-027` (migration 0015; the routes and spec gates) · `T-M01-025` (the guard for `onboarding.add_own_catalog_items` and `onboarding.manage_catalog`) · `T-FCORE-016` (the pack read) · `T-M01-015` (the settings entry and the return landing) · `T-M01-017` (the spreadsheet path it hands to) · the first `file` slice and the extraction engine recorded above.
**Out of scope:** the tables, the resolver and the gates — `T-M01-027`; the spreadsheet import — `T-M01-017`, `T-M01-030`; the pickers themselves — `T-M06-010`, `T-MS-201`, `T-MS-202`; the extraction engine — the gap above; a platform request queue — does not exist (M01-46).
**DONE WHEN:**
- Given a missing product mid-proposal, when the person invokes add-in-flow, then single-form, datasheet-PDF and spreadsheet paths are all available, and completing any of them selects the new SKU in place without leaving the builder (M01-36, M01-39). → proof: QA (web and phone) from the catalog settings entry each of the three paths opens in the sheet, and a saved SKU is in the catalog with the settings screen still open; the in-flow open from the builder's picker and the studio's picker, with the SKU selected in place, is proven at `T-M06-010` (M06-28) and `T-MS-201` (MS4-06)
- Given a datasheet PDF upload, when extraction completes, then every extracted field is shown for review and nothing is created until the person confirms (M01-40). → proof: QA (web and phone) an uploaded datasheet renders every extracted field with its page named, only the rated power `estimated` and creates nothing until save; a failed extraction lands on the form with what was salvaged and the datasheet still attached
- Given a picker with a component already selected, when Enter specs manually is invoked, then the sheet opens pre-filled with that item's brand, model and typed specs, its certification flags and rate fields are blank, and saving creates a new own SKU selected in place with the platform item unchanged (M01-39). → proof: QA (api) a create carrying a picker's pre-fill body is saved with brand, model and specs only, and the created SKU carries no certification and no rate entry it was not given, and the platform item is byte-identical; Enter specs manually on a selected platform item in the picker, opening with scheme flags and rate blank, is proven at `T-MS-201` (MS4-06)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-017 · Catalog Import Wizard
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner drops the supplier's price list in, sees how many rows match the platform book, how many are new and how many need attention, fixes those in the grid and watches the import run with the report kept to reopen; without it hundreds of products are typed one by one.
**PRD rows:** M01-41 (P0)
**DESIGN:** SCR-M01-17 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-17-catalog-import-wizard.md`; they are the specification.
**Data model:** none — reads `catalog_import_job` and `catalog_import_row` authored by `T-M01-030` (migrations 0019, 0020 and 0021) and the overrides, SKUs and rate entries the run writes through `T-M01-027` (migration 0015); the uploaded file is the one `file` table's row (no task id yet).
**Contract:** `packages/contracts/src/catalog-import.ts` — POST /catalog/imports (from an uploaded file id, the entry point, and the file's name and saved date as the device's picker gives them — the step 1 subtitle names no supplier, since no source holds one: `T-M01-030c` decision 8) · GET /catalog/imports (the re-openable reports) · GET /catalog/imports/{id} (the one read the wizard polls — its state, mapping and counts) · PUT /catalog/imports/{id}/mapping · GET /catalog/imports/{id}/rows (the preview grid, paged and narrowed by outcome; `T-M01-030d` decision 11) · PUT /catalog/imports/{id}/rows/{rowNumber} · POST /catalog/imports/{id}/run (the job then reads `run: { done, total, at, by }` while it runs and `results` once completed; each row its `result` and `failure` — `T-M01-030f`). The matching pass shows a short wait, not a counted "256 of 412 rows" — the run carries the counted progress (owner ruling R1 at `T-M01-030d`; the brief's decision 24 follows it, and the board is redrawn to match). A row judged again at the run can fail as `changed_since_preview` — its product changed in the catalog since the preview — and the report says so (`T-M01-030f` D2); that row keeps the verdict it was judged by, so the grid asks its question. The report pages `GET …/rows?result=…` (one result per read — the *Left out* and *Failed* chips are two reads) and renders each row's `priceBefore` and `priceApplied` as *Price before* and *Price now* — null `priceApplied` is *Unchanged*; *Fix the N rows* takes N from domain's `importRowsToFix(results)`, fixes the open rows with the same `PUT …/rows/{rowNumber}` on the completed job, and presses the same `POST …/run`, which writes only those rows (`T-M01-030g`). Domain read: `CATALOG_IMPORT_STATES`, `CATALOG_IMPORT_ENTRY_POINTS`, the target-field vocabulary of `import-columns.ts`, `importRunProgress`, `CATALOG_IMPORT_ROW_RESULTS`, `importRowsToFix`.
**Depends on:** `T-M01-030` (migrations 0019, 0020 and 0021 and the routes; the workflow on `heliogrid-catalog`) · `T-M01-027` (migration 0015) · `T-M01-025` (the guard for `onboarding.manage_catalog`) · the first `file` slice (the presigned upload the first step needs — no task id yet; the wizard cannot start before it) · `T-M01-015` (the settings entry; onboarding is another).
**Out of scope:** matching, the async run, idempotency and the report's storage — `T-M01-030`; the tables it writes — `T-M01-027`; the file bytes path — the first file slice; M02's lead import, the same pattern — `T-M02-005`; the outbox and dispatcher — `T-M01-030`, `infra/temporal`; the entry from the add sheet — `T-M01-016`, which lands after this wizard and wires that hand-off itself.
**DONE WHEN:**
- Given an import file with platform-matching rows, unknown rows and broken rows, when the preview renders, then it states the three counts, matched rows become price overrides and unknown rows tenant SKUs on import, and broken rows are fixable inline; the import runs async with progress and produces a per-row report (M01-41). → proof: QA (web and phone) one file with the three row kinds renders the counts in plain numbers, a row fixed in the grid moves the counts and the act's number, the run shows progress and the report reopens from the list; the matching and the writes are `T-M01-030`'s units
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-018 · Branding Settings
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner uploads a logo and picks the brand colour, sees the proposal cover and the customer-link header exactly as the customer will — a too-pale colour darkened rather than refused — and the app they work in stays unbranded; without it a customer document goes out unreadable or unbranded.
**PRD rows:** M01-50 (P0), F7-07 (P0)
**DESIGN:** SCR-M01-18 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-18-branding-settings.md`; they are the specification.
**Data model:** none — reads `branding_settings` and `business_profile` authored by `T-M01-026` (migration 0006); logo and letterhead are rows of the one `file` table (no task id yet).
**Contract:** `packages/contracts/src/tenant-settings.ts` — GET, PUT /settings/branding (the response carries the derived compliant shades the preview draws) · GET /settings/business-profile (company details shown as they print, written once on `T-M01-005`). The preview is the `DocumentPreview` component (`docs/tasks/UI.md`) fed every prop from the tenant's own values — no sample value (`T-M01-029`).
**Depends on:** `T-M01-026` (migration 0006 and the branding routes) · `T-FPLAT-022` (the contrast re-verification that derives the shades) · `T-M01-025` (the guard for `onboarding.manage_tenant_settings`) · the first `file` slice (logo and letterhead upload).
**Out of scope:** the derivation — `T-FPLAT-022`; the settings table — `T-M01-026`; the proposal document and link page that carry the branding — `T-M06-017`, `T-F5-001`, whose renders the preview stands in for and whose own proofs show the branding carries, so neither is a build dependency; the `DocumentPreview` component and its recorded gaps — `docs/tasks/UI.md`; audit — `T-FPLAT-004`.
**DONE WHEN:**
- Given any branding save, when it completes, then the operator app is visually unchanged and only customer documents carry the branding (M01-50). → proof: QA web · ios · android after a branding save the shell, Team and Leads screens carry no tenant colour or logo on either platform, and the two framed previews carry both
- Given a branding or template edit, when it is saved, then a live preview of the affected customer document was available before saving (M01-50, M01-30). → proof: QA (web and phone) changing colour or logo redraws the proposal cover and link-header previews before Save is pressed
- **Given** a tenant has saved a brand colour and logo, **when** a proposal document and a customer-link page render, **then** both carry that branding and the operator application carries none; and **when** the saved colour would fail contrast, **then** a compliant shade is derived and previewed rather than the palette being refused (`F7-07`). → proof: QA (web and phone) a low-contrast colour shows the derived darker shade offered in the preview and saves, never refused; the document and link renders are proven at `T-M06-017` and `T-F5-001`, the derivation is `T-FPLAT-022`'s unit
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-019 · Proposal Template Settings
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner decides once which sections a proposal carries, the standard terms and the bank details that print, and the phases a project timeline shows, so every quote — Quick mode's included — comes out complete; without it each rep re-types terms and the documents disagree.
**PRD rows:** M01-51 (P0), M01-52 (P1)
**DESIGN:** SCR-M01-19 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-19-proposal-template-settings.md`; they are the specification.
**Data model:** none — reads `proposal_template_settings`, `timeline_template` and `business_profile` authored by `T-M01-026` (migration 0006).
**Contract:** `packages/contracts/src/tenant-settings.ts` — GET, PUT /settings/proposal-template · GET, PUT /settings/timeline-template · GET /settings/business-profile (bank details as they print, written on `T-M01-005`) · GET /settings/effective (the defaults filled where the tenant set nothing). Domain read: `commerce/proposal-template-defaults.ts`, `commerce/timeline-template-defaults.ts`; the default T&C and phase descriptions are `packages/i18n` copy; the document name is F3-11's copy.
**Depends on:** `T-M01-026` (migration 0006 and the routes) · `T-M01-025` (the guard for `onboarding.manage_tenant_settings`) · `T-M01-005` (bank details' write-point).
**Out of scope:** the builder's use of the defaults, Quick mode and the T&C round-trip — `T-M06-027`, `T-M06-011`, `T-M06-008`; the live preview's real document render — `T-M06-017`; the settings tables and their defaults — `T-M01-026`; the several-T&C-templates condition — `T-M01-026` at `/start` with M06's owner; audit — `T-FPLAT-004`.
**DONE WHEN:**
- Given the proposal-template settings, when the builder generates a document, then cover, included sections, default terms and bank details come from these settings (or their platform defaults), and the document is titled with the ruled name in every locale (M01-51). → proof: QA (web and phone) save a cover, section set, terms and the printed bank details, and each reads back after a reload; QA (api) `GET /settings/effective` returns what was saved; a generated proposal showing each, titled with the ruled name in all three languages, is proven at `T-M06-027`
- Given a tenant with untouched template settings, when Quick mode builds a proposal, then the platform defaults fill the hidden steps and the result is generable (M01-53, M01-28). → proof: QA (api) `GET /settings/effective` for a tenant that never saved carries every default marked default — `T-M01-026`'s unit; Quick mode's build is `T-M06-027`'s
- (M01-52 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text in the brief is the binding criterion.) → proof: QA (web and phone) phases add, edit in a sheet and reorder with the 44px controls, and the saved order reads back after a reload; the builder's timeline step opening with it is proven at `T-M06-027` (M06-12)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px, and at 1536px except the brief's *Drawn at 375 only* list, where the phone's answer holds at width (owner ruling 2026-10-16), the colour-literal lint clean on both

### T-M01-020 · Payment Terms Settings
**Type:** screen · **Tier:** P0
**Status:** designed
**Why:** The owner names the payment splits customers are asked for — 10/60/20/10 on the stages a job passes through — and every proposal, and the collection schedule at Won, uses the same numbers to the minor unit; without it each rep invents a split and the money paths diverge.
**PRD rows:** M01-54 (P0)
**DESIGN:** SCR-M01-20 → https://claude.ai/artifact/6B4UBcKiJsHoreFjiKUSLN
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-20-payment-terms-settings.md`; they are the specification.
**Data model:** none — reads `tranche_template` and `tranche_template_line` authored by `T-M01-026` (migration 0006) and the stage labels of the tenant's pack (`T-FCORE-016`, migration 0001).
**Contract:** `packages/contracts/src/tenant-settings.ts` — GET, POST /settings/tranche-templates · PUT /settings/tranche-templates/{id} (a save whose lines do not sum to 100.00 is refused with the unallocated remainder) · POST /settings/tranche-templates/{id}/archive · POST /settings/tranche-templates/{id}/make-default · `packages/contracts/src/market.ts` — GET /market-packs/{marketCode} (the market's real stages and their labels). Domain read: `commerce/tranche-template-defaults.ts`; the allocation verdict is ONE domain rule both the `AllocationMeter` and the save read — exact 100.00 in two-decimal percentages, no tolerance (`M01-54`): the meter shows the remainder and the save refuses until it is zero, never computed twice.
**Depends on:** `T-M01-026` (migration 0006 and the routes; the two seeded templates) · `T-FCORE-016` (the pack's stage labels) · `T-M01-025` (the guard for `onboarding.manage_tenant_settings`) · `PROJECT_STAGES` (`packages/domain/src/projects/stages.ts`, `T-M01-026` — `M08-08`'s chain; M08's slice mirrors it as the pgEnum).
**Out of scope:** the builder's payment step and Quick mode — `T-M06-009`; the collection schedule at Won — `T-M11-005`; the seeding and the sum refusal — `T-M01-026`; the skippable-stage due-derivation — `T-M11-006`; audit — `T-FPLAT-004`; the sample contract value the preview prices from — a policy number in domain, its tier `assumed`.
**DONE WHEN:**
- Given a new tenant, when settings are first opened, then the two seeded templates exist and one is marked default (M01-54). → proof: QA (web and phone) a new tenant's first open lists 10/60/20/10 and 30/60/10 with one marked default; the seed is `T-M01-026`'s unit
- Given a template whose tranches sum to anything but 100.00, when save is attempted, then it is blocked with the unallocated remainder stated (M01-54). → proof: QA (web and phone) a 10/60/20 split shows the 10% unallocated on the meter and the save is refused naming it; unit packages/domain/tests/commerce/tranche-allocation.test.ts — 10/60/20/10 and 30/60/10 are met, 10/60/20 states 10.00, and the meter and the save share the verdict
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-021 · Message Template Settings
**Type:** screen · **Tier:** P0
**Status:** planned
**Why:** The owner writes the proposal-share, follow-up and reminder messages in Hindi, Marathi and English the way their customers are spoken to, sees each composed with a real name and amount, and reps send that text — never a raw placeholder; without it every rep improvises the message a customer reads.
**PRD rows:** M01-55 (P0)
**DESIGN:** SCR-M01-21 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-21-message-template-settings.md`; they are the specification.
**Data model:** authors `message_template` itself — `T-FPLAT-021` ruled no table in V1, because this V2 editor is the first and only writer of a tenant's own template (per key × language, `F6-26`), and a table with no writer is storage for no need. `T-FPLAT-021` supplies the closed key list and the composer.
**Contract:** settled at `T-FPLAT-021`'s `/start`: the read and write of a template per key and language, and the composed preview over a sample context, are THIS task's (a `packages/contracts/src/message-template.ts`), landing with their first writer. Domain read: the placeholder rule (resolved or safely omitted) `T-FPLAT-021`'s composer holds; the missing-language note is `packages/i18n` copy.
**Depends on:** `T-FPLAT-021` (the closed key list and the composer) · `T-FPLAT-006` (the per-language content class, F3-10) · `T-M01-025` (the guard for `onboarding.manage_tenant_settings`) · `T-M02-013` (the transactional send and copy path the composed text goes through).
**Out of scope:** the closed key list and the composer — `T-FPLAT-021`; each key's starter words — the task that first sends it; the send and the copy-paste path — `T-M02-013`, `T-M06-018`; campaign templates — M03; the amount's money format — `packages/domain` formatters (`T-FPLAT-008`).
**DONE WHEN:**
- Given a tenant in any launch language, when a rep invokes the share message, then the composed text uses the tenant's template for the recipient-appropriate language, with every variable resolved or safely omitted (M01-55). → proof: QA (web and phone) a share invoked by a rep in each launch language composes the tenant's template for the recipient's language with every variable resolved or omitted, and a missing language shows the original with the note; the composition is `T-FPLAT-021`'s unit
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-022 · Capture Settings
**Type:** screen · **Tier:** P0
**Status:** planned
**Why:** The owner sees which lead channels actually bring leads in — manual, import, inbound call, referral — switches one off without touching the leads it already brought, and sees website forms and business messaging as later, not as a promise; without it the settings advertise channels the product does not have.
**PRD rows:** M01-58 (P0), M02-17 (P0), M02-64 (P0), M02-65 (P0)
**DESIGN:** SCR-M01-22 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-22-capture-settings.md`; they are the specification.
**Data model:** none — reads the channel registry and `lead_channel_setting` that `T-M02-017` builds behind this surface (M02-64: M02 owns the channel set and the toggle, M01 the surface); the closed source set is `T-M02-009`'s. `T-M01-026` defers the table to this screen's slice, where its engine — `T-M02-017`, never this screen (Law 11) — authors it.
**Contract:** **Gap recorded, not filled:** `T-M02-017` declares no contract file — the channel list with each channel's true state and the toggle write are owed there, in M02's contract area, settled before the build.
**Depends on:** `T-M02-017` (the policy and its routes) · `T-M02-009` (the source set and the inbound-call intake) · `T-M01-025` (the guard for `onboarding.manage_tenant_settings`) · `T-M07-005` (the agent's own configuration the inbound-call toggle is distinct from).
**Out of scope:** the channel set, toggle semantics and later-card facts — `T-M02-017`; the capture flows — M02; the agent's configuration — `T-M07-005`; M03's channels — M03.
**DONE WHEN:**
- Given the capture-settings screen, when it renders, then every live channel shows a working toggle and every not-yet channel is a "later" card with no toggle (M01-58). → proof: QA (web and phone) every live channel renders a working toggle and each not-yet channel a later card without one, on both platforms
- Given capture settings, when it renders, then website and business-messaging appear as later cards with no toggle and no capture path exists for them anywhere in this module (M02-17). → proof: QA (web and phone) website and business-messaging render as later cards, and no route, screen or control in M02 captures through them
- Given a live channel toggled off, when the leads already captured through it are inspected, then they are unchanged and still carry their source badge, and no new capture arrives through that channel (M02-64). → proof: QA (api) toggle a live channel off: existing leads and their source badge are byte-identical and a new capture through that channel is refused — `T-M02-017`'s unit
- Given capture settings, when it renders, then deferred channels appear as later cards with no toggle, no snippet and no number field (M02-65). → proof: QA web · ios · android the later cards carry no toggle, no snippet and no number field at 375px and 1536px
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-023 · Locale Defaults
**Type:** screen · **Tier:** P1
**Status:** planned
**Why:** The owner sets the language customer documents and new invites default to, and adds the company's own holidays on top of the market's, so the agent never calls and no reminder lands on a day the office is shut; without it the calendar is the statutory floor alone and every document defaults to the platform's language.
**PRD rows:** M01-59 (P1)
**DESIGN:** SCR-M01-23 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-23-locale-defaults.md`; they are the specification.
**Data model:** none — reads `tenant.default_language` and `tenant.timezone` authored by `T-M01-025` (migration 0002), `tenant_holiday` authored by `T-M01-026` (migration 0006), and the pack's holiday calendar (`T-FCORE-016`, migration 0001).
**Contract:** `packages/contracts/src/tenant-settings.ts` — GET, PUT /settings/holidays (tenant additions only; the pack calendar is never written) · GET /settings/effective (the language and timezone in force) · `packages/contracts/src/tenant.ts` — GET /tenants/me · `packages/contracts/src/market.ts` — GET /market-packs/{marketCode} (the pack calendar and its labels). **Settled at `T-M01-026`'s `/start`:** the write of `default_language` and `timezone` on `tenant` is this task's own route — PUT /settings/locale in `tenant-settings.ts`, authored when this task begins; `T-M01-026` seeds both and reads them back. Domain read: `holidaysInForce`, `isHoliday` (`packages/domain/src/format/holidays.ts`).
**Depends on:** `T-M01-026` (migration 0006; the holiday routes) · `T-M01-025` (migration 0002; the tenant write above; the guard for `onboarding.manage_tenant_settings`) · `T-FCORE-016` (the pack read) · `T-FCORE-001` (`holidaysInForce` — landed).
**Out of scope:** the per-user interface language — `T-M01-011`, never overridden here; the consumers of the calendar — `T-M07-005`'s calling window, M02's snooze wake-ups; the pack calendar's content — `T-FCORE-001`; the narrowing law's enforcement in the agent gate — M07.
**DONE WHEN:**
- (M01-59 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text in the brief is the binding criterion.) → proof: QA (web and phone) the default language saved here changes a new invite's message and a new document's default and no user's interface language; a holiday added renders tenant-added beside the pack's entries and never removes one; unit packages/domain/tests/format/holidays.test.ts — the tenant adds and never subtracts (existing cases)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

### T-M01-024 · Integration Credentials
**Type:** screen · **Tier:** P0
**Status:** planned
**Why:** The owner sees every connected credential — the payment gateway's, the messaging and voice ones — as last-4 with a probe verdict, and a failed one nags until it is rotated, so a customer's payment link never fails silently; without it a dead key is discovered by a customer.
**PRD rows:** M01-60 (P0)
**DESIGN:** SCR-M01-24 → PENDING
**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M01-24-integration-credentials.md`; they are the specification.
**Data model:** none — reads the credential rows their owning modules author: `T-M11-010`'s collections-account connection (M11) and M07's messaging and voice credentials; `integration_credential` as the one settings-level row has no author yet — the data model marks it V2 and `T-M01-026` defers it to this screen's slice, where an engine, never this screen (Law 11), takes it.
**Contract:** **Gap recorded, not filled:** no engine ticket declares a credential read or rotation route — `T-M11-010` states the product-level handling (write-only, last-4, probe, audited decrypt) with no contract file; the last-4 list, the probe-status read and the rotation write are owed to the owning modules' contract areas, and the one-place health read to the engine that takes `integration_credential`, settled before the build.
**Depends on:** `T-M11-010` (the gateway credential's handling and probe) · M07's messaging and voice credential handling (no task names it yet) · `T-FPLAT-004` (the decrypt audit entries) · `T-FPLAT-017` (the alert a failed probe raises) · `T-M01-025` (the guard for `onboarding.manage_tenant_settings`).
**Out of scope:** storage, encryption, probes and rotation — `T-M11-010` and M07; the connect flows this screen links to — `T-M11-004` and M07's number and BYO flows; the audit entries — `T-FPLAT-004`; the alert — `T-FPLAT-017`.
**DONE WHEN:**
- Given a stored credential, when any settings surface renders it, then at most last-4 is visible and no read-back exists (M01-60). → proof: QA (api) the credential read returns at most last-4 and no route returns the secret; QA web · ios · android the row shows last-4 and its probe verdict on both platforms
- Given a failing credential, when the scheduled probe detects it, then an alert fires and a settings nag persists until rotation (M01-60). → proof: QA (web and phone) with a probe forced to fail the alert arrives, the settings nag renders on every settings entry and clears only after rotation; the probe is `T-M11-010`'s
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values. → proof: QA (web and phone) every base and brief-listed state drawn at 375px and 1536px, the colour-literal lint clean on both

---

## Laws (enforced through screens and review, no standalone build)

- **M01-11** (P0) — **Signup contains no plan selection, no billing prompt and no payment instrument.** The trial starts without a card (`04-business-model.md` `BM-28`); every billing surface — plan pick, mandate, invoices, trial state — belongs to `modules/M12-platform-billing.md`. The deferred-era wording of the source ("billing is deferred… no trial gate anywhere") is superseded — billing **is** in v1 (OD-4) — but its signup-shaped consequence survives intact: nothing about money interrupts the front door. — *Enforced by:* the T-M01-002 signup flow containing no plan, billing or payment step (its DONE WHEN line cites M01-11), plus review; billing surfaces are `docs/prd/modules/M12-platform-billing.md`'s.
- **M01-22** (P0) — **The minimum-first law.** The product asks for the minimum to produce one real proposal and collects the rest when it is actually needed. The named trap is a requirement: the product never demands catalog, tax registration, logo, price book or team up front — "most B2B SaaS asks for everything up front… and people abandon." Goal: from "I signed up" to "my team can quote a job" without a training session. — *Enforced by:* the onboarding sequence tasks (T-M01-002, T-M01-004, T-M01-005, T-M01-006, T-M01-007) asking only the minimum, the platform defaults of T-M01-026, and review.
- **M01-29** (P0) — **Configure in context, not in a settings maze.** The moment a person needs a thing that is not configured — a component they stock, a logo about to print, a bank detail about to render — the product offers to set it **there**. "Settings screens exist for revisiting, not for setup." The sharpest instance is the catalog's inline add (M01-39). — *Enforced by:* the prompt-points built in T-M01-005 (first-proposal-send prompt) and T-M01-016 (inline add in-flow), consumer prompt-points in `docs/prd/modules/M06-proposals.md`, and review.
- **M01-30** (P1) — **Every config screen shows the effect.** Live preview is the norm: the proposal with your logo, the agent's opening line spoken aloud (M07 surface), the payment tranches as the customer sees them. — *Enforced by:* the live previews required on T-M01-018, T-M01-019, T-M01-020 and T-M01-021 (their DONE WHEN lines), the M07 test surface (`docs/prd/modules/M07-sales-execution.md`), and review.
- **M01-46** (P0) — **No tenant request queue exists, and platform-book population is never a tenant dependency.** A tenant never files a ticket, emails support, or waits on the platform to be able to quote — the self-serve paths (M01-36/39/40/41) are the whole answer. Populating and curating the platform master book (datasheet ingestion at scale) is **internal platform operations** — noted here as context, not a tenant-facing feature of this module. — *Enforced by:* the self-serve paths of T-M01-016 and T-M01-017 and the absence of any request-queue surface (review; acceptance line: "Given any missing-product moment anywhere in the product, when the person looks for a way to request the platform add it, then no request queue, ticket or support path exists — the self-serve paths are the whole answer (M01-46).").
- **M01-49** (P0) — **Sent proposals keep the rate versions they were built with — always.** A price-book update after a proposal is sent changes nothing about the sent document: it pins its price-book version and catalog release at generation (F8-15's law; this module supplies the versioned structures that make the pin possible). Publishing a new version self-stales unsent outputs per F8-13/F8-14; it never rewrites anything. — *Enforced by:* generation-time pinning in `docs/prd/modules/M06-proposals.md` under `docs/prd/foundations/F8-data-honesty.md` (F8-13…F8-15), over the versioned structures built in T-M01-031 (M01-48) and T-M01-027 (M01-44); acceptance lines: "Given a sent proposal and a subsequent version publish, when the sent document is viewed by anyone, then every figure equals the figures at send time (M01-49)." and "Given a draft pinned to an older version, when it is opened after a publish, then it is visibly stale and requires an explicit re-price — never a silent recompute (M01-49, F8-13)."
- **M01-56** (P0) — **The governing principle of agent configuration: fully tenant-owned, within the statutory floor.** Nothing about the agent is platform-locked *except* the market's statutory ruleset, which is **enforced** by the product's compliance gate — never merely surfaced: "Tenants configure within the law, not around it." The floor's content is market-pack data (`pack.calling-rules`, F1-15…F1-17; IN instance F1-36); everything above the floor — tone, topics including price talk, hand-over shaping, a narrower calling window, holidays — is the owner's. The gate also refuses a narrowing of the messaging window that would leave the scheduled send hour (`F1-15`) outside the window in force, so a send hour never sits outside the tenant's own window by the tenant's own hand (owner ruling 2026-09-07). The shipped defaults are safe out of the box (guided, pre-filled; a free-text box so the owner is never boxed in). — *Enforced by:* M07's compliance gate (`docs/prd/modules/M07-sales-execution.md`) over the pack floor data of `docs/prd/foundations/F1-global-market-framework.md`; the settings surfaces are SCR-M07-05's (`docs/ux/briefs/SCR-M07-05-agent-setup-settings.md`); acceptance line: "Given any agent-config attempt that violates the market floor, when it is saved, then the gate blocks it with the rule named (M01-56; enforcement M07)."

---

## Realized elsewhere

- **M01-16** (P1) — **First-run coach marks: maximum three, on the screen they actually landed on, dismissible. Never a carousel.**
  *realized-by:* `docs/tasks/SHELL.md` T-SHELL-001 (SCR-SHELL-01; `docs/ux/briefs/SCR-SHELL-01-app-shell.md`). Coach marks render on the shell's role home; SHELL owns the screen task and quotes the row in full.
- **M01-57** (P0) — **Tenant configuration lists the agent & voice surfaces; their behaviour is specified in `modules/M07-sales-execution.md`.** The surfaces: **Agent setup — guided** (name · voice · languages · tone · opening line · what to say when it doesn't know · hand-over rules · calling window, within the floor · free-text "anything else") · **Opening line** (pre-filled disclosure, editable per its floor status) · **Hand-over rules** (editable list; the statutory opt-out is floor) · **Calling window** (days, hours, holiday calendar — narrower than the floor only) · **Business knowledge base** (structured, eight sections, seeded per market — never an empty page; the unanswered-questions one-tap loop) · **Test the agent** ("the most important screen here" — call yourself or run a typed conversation) · **Change history** (versioned config, kept quietly) · **Number provisioning** and **inbound call routing (IVR)** (UXG-16/UXG-17 — M07's slices). M01 owns their presence in the settings information architecture and the M01-28/M01-30 laws applying to them; M07 owns every behaviour.
  *realized-by:* SCR-M07-05 screen task in the M07 tasks file (`docs/ux/briefs/SCR-M07-05-agent-setup-settings.md`; behaviour `docs/prd/modules/M07-sales-execution.md`). M01 owns only the surfaces' presence in the settings information architecture; the screens register places that surface list on SCR-M07-05.

---

## Engine tasks

### T-M01-025 · Identity, sessions and tenant creation
**Type:** engine · **Tier:** P0
**Status:** shipped (#40)
**Why:** An installer signs up with a phone and one OTP and owns a workspace on the spot, and any teammate's access can be ended from one place within ten minutes; without this spine no tenant, no session and no role exists for any other module to build on.
**PRD rows:** M01-05, M01-06, M01-07, M01-10, M01-18, F4-37

**Depends on:** `T-FCORE-016` (migration 0001 — `market_pack`, `market_pack_version`; `tenant.market_key` references it and the currency is read from the pack payload) · `T-FCORE-001` (`pack.formats` phone spec and OTP destination allowlist) · `packages/contracts/src/session.ts`, `ports/session.ts`, `packages/domain/src/authz/` and `auth/` (landed).
**DONE WHEN:**
- Given any sign-in surface, when it renders, then no password field exists anywhere (M01-05) and Google Login is offered alongside Mobile OTP (M01-02). → proof: qa-api no password route, field or column exists in `packages/contracts/src/auth.ts`, migration 0002 or either sign-in surface; the Google half is proven where it lands — the engine at `T-M01-032`, the control at `T-M01-001`
- Given a deactivation or "sign out everywhere", when it is issued, then every session of that user ends within 10 minutes (M01-07). → proof: unit `packages/domain/tests/auth/admission.test.ts` — a token carrying a stale `authorizationVersion` is refused and the current one admitted; qa-api — after `POST /auth/sign-out-everywhere` every `session` row of the actor is revoked in one write and a request with the old token answers 401 within the token's life
- Given a route that declares no capability and is not marked public, when it is called, then it is denied — silence is denial (F2-25; `M15` closes here). → proof: qa-api — `GET /market-packs/IN` and `/health` answer without a session because they are marked public; a capability-bearing route answers 401 without a token and 403 with a token whose roles lack the capability
- Given a signup abandoned after OTP verification, when the person returns, then setup resumes where it stopped (M01-10). → proof: qa-api verify an OTP, abandon before the company step, sign in again: the same account exists with no tenant and signup continues at the company step — never a restart, never a duplicate
- (M01-06 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text quoted above is the binding criterion.) → proof: unit `packages/domain/tests/calling/platform-message.test.ts` — every composed OTP message, in each launch language, carries the product name and the never-call line, and the code slot is filled exactly once
- (M01-18's Team-screen lines are `T-M01-012`'s and its guard lines `T-FPLAT-003`'s; here the requirement text quoted above is the binding criterion — phone E.164 and unique globally, status invited / active / deactivated, never deleted.) → proof: qa-api — a second signup with the same E.164 resolves to the existing account and no second company; migration 0002 grants no DELETE on `user_account` or `tenant_membership` to any role the API uses; the deactivation transition itself is `T-FPLAT-003`'s and is proven there
- Given migration 0002, when the tenancy scan runs, then `tenant_membership` and `membership_role` pass as tenant-scoped (tenant_id, composite index, fail-closed RLS, grants), `tenant` and `user_account` pass as armed platform tables (RLS enabled and forced, one canonical SELECT policy each), and `otp_challenge` and `session` as unreachable — all four listed in `GLOBAL_TABLES` with a written reason. → proof: invariant table-tenancy-scan and tenancy-rls — cross-tenant isolation exercised on real rows for the first time — seen red on an injected policy-less `tenant_membership`
- Given work held on a shared device for one user, when a different user signs in, then the held work is discarded and the outgoing user is warned before it happens (`F4-37`). → proof: qa-mobile — sign a second user in on a device holding the first user's session: nothing of the first user — session, cookie jar, cache — survives into the second user's data load; the warning over un-uploaded captures is proven by the first task that holds a capture on the device (none in V1: `F4-21` is M04's), through the `HeldWork` reader this task lands

*(`F4-37` moved here from struck `T-FPLAT-034`: the switch happens at sign-in, and its screen half is already `SCR-M01-01` (Law 9).)*

### T-M01-032 · Google sign-in engine — the linking door onto the phone account
**Type:** engine · **Tier:** P0
**Status:** shipped
**Why:** An owner who lives in Google taps once and is in, and a locked SMS rail never locks them out; without it Google Login is a button with nothing behind it, and a first Google sign-in could mint a second account for a phone that already has one.
**PRD rows:** M01-02 (P0) — the whole Google-login row, engine AND the control that renders it: a Google button with no engine behind it is a dead control (the no-dead-controls law the brief carries), so `T-M01-001` ships the phone door without one and this task lands the control, the `google-link-first-sign-in` state and the locked state's "Google still works" sentence on both platforms, over `T-M01-001`'s frame (its DESIGN line). Split from `T-M01-025` at its `/start`: the spine ships without an external account, and a Google OAuth client is the owner's to create.
**Depends on:** `T-M01-025` (migration 0002 — `user_account`, the OTP challenge the linking flow verifies, the session the route answers) · the owner's Google OAuth client ids for web and mobile (an external account — owner action).
**DONE WHEN:**
- Given a Google token whose subject is bound, when it is presented, then the phone account's session is returned and no account is created (M01-02). → proof: qa-api — a bound subject answers 200 with the session projection of the phone account, and the `user_account` count is unchanged
- Given a Google token whose subject is unbound, when it is presented without a verified challenge, then the answer names the phone step; when it is presented with a verified challenge, then the subject binds to that phone's account and never mints a second one (M01-02). → proof: qa-api — 409 `GOOGLE_NOT_LINKED`, then a bound sign-in after the OTP flow; a second binding attempt for a different phone is refused
- Given a phone under its 15-minute SMS lock, when its account signs in through Google, then it is admitted (M01-04). → proof: qa-api — the locked phone's Google sign-in answers a session while `POST /auth/otp/request` for it answers 429
- Given any sign-in surface, when it renders, then no password field exists anywhere (M01-05) and Google Login is offered alongside Mobile OTP (M01-02). → proof: QA web · ios · android both sign-in frames carry the text-only Continue with Google control beside phone and code at 375px and 1536px; the no-password half is `T-M01-001`'s
- Given 5 failed verify attempts, when the fifth fails, then that OTP is invalid and the user is told to request a fresh one; given 3 consecutive invalidations, then the number is locked 15 min with an explanation (M01-04). → proof: QA web · ios · android the locked frame keeps Continue with Google live and says so, on both platforms; the lock and the invalidation are `T-M01-025`'s and the frames `T-M01-001`'s
- Given a first Google sign-in, when the subject is unbound, then the linking flow runs onto the same phone-identity account and never mints a second one (M01-02). → proof: QA web · ios · android the `google-link-first-sign-in` frame confirms the mobile number, sends the code and, on verification, lands on the home of the phone's account; the binding is proven by this task's qa-api lines

### T-M01-028 · Invitations and the atomic accept
**Type:** engine · **Tier:** P0
**Status:** shipped (#47)
**Why:** A teammate taps an invite, enters one OTP and lands on their role's home with real work in it, never half-joined; without it a company stays one owner and the Team screen has nothing to manage.
**PRD rows:** M01-17

**Depends on:** `T-M01-025` (migration 0002 — `user_account`, `tenant_membership`, `membership_role`, `otp_challenge`, `session`; the guard; `adoptTenant`) · `T-FPLAT-003` (the zero-role invite guard, F2-21) · `T-FPLAT-004` (the audit writer the three invite acts ride).
**DONE WHEN:**
- Given a valid invite, when the invitee verifies the OTP, then user + membership + roles exist atomically and the next screen is name/photo, then the role card, then their role's home with their real assigned work (M01-13, M01-14, M01-17). → proof: unit apps/api/tests/invitations/accept.test.ts — a failure after the join's writes leaves no membership, no role row and the invitation still pending; a phone that already has an account gains a membership and no second account; an answered, run-out or withdrawn link admits nobody; the screen sequence is proven at `T-M01-008`, `T-M01-009`, `T-M01-010` and `T-SHELL-001`
- (The invite lifecycle — pending / accepted / expired / revoked, decline voids, the daily cap — has no Given/When/Then of its own; the M01-12 text quoted at `T-M01-007` is the binding criterion for the states this migration stores.) → proof: unit apps/api/tests/invitations/lifecycle.test.ts — each transition at its edges: the send with its three refusals and the message inside the transaction, the list by state, the revoke once, the decline once, the re-invite ask stamped once, the cap refusing the fiftieth-plus send (seen red on one send too few); an expired invite accepts nothing and a revoked one lands nowhere are `accept.test.ts`'s; qa-api — the owner invites a second person, that person verifies and accepts, holds a preset without `onboarding.manage_tenant_settings`, and `GET /tenants/me/audit-log` answers 403 `FORBIDDEN`; a second person verifying on a device carrying the first person's `hg_session` cookie leaves the first session revoked
- Given migration 0005, when the tenancy scan runs, then `invitation` and `invitation_role` pass as tenant-scoped. → proof: invariant table-tenancy-scan, tenancy-rls (the invite tables seeded and driven as `app_user`: own-tenant insert accepted, the cross-tenant one refused) and enum-parity on `invitation_status` — each seen red on an injected break

### T-M01-026 · Tenant settings and defaults engine
**Type:** engine · **Tier:** P0
**Status:** shipped (#49)
**Why:** An owner who never opens settings still sends a real proposal on day one, and every setting they do touch has one home that every document reads; without it the first proposal demands a settings maze and a skipped fact has nowhere to be asked for later.
**PRD rows:** M01-28, M01-53

**Depends on:** `T-M01-025` (migration 0002 — `tenant`, the tenant-creation transaction this seed joins, the guard for `onboarding.manage_tenant_settings`) · `T-FCORE-016` (migration 0001 — `pack.tax`, `pack.formats` holiday calendar, timezone and stage labels) · `T-FCORE-001` (`IN_FORMATS`, `holidaysInForce`; the `format` label this task adds to `TaxRegistrationType` is republished with `pack:publish`) · `T-FPLAT-004` (the log every settings write appends to) · `T-FPLAT-022` (planned — this task authors the derivation in domain and `T-FPLAT-022` imports it).
**DONE WHEN:**
- Given a fresh tenant that skipped every skippable step, when the owner builds and sends a real proposal, then no settings screen was ever required and platform defaults carried it (M01-22, M01-28). → proof: unit apps/api/tests/settings/effective-settings.test.ts — a tenant with no settings rows resolves every setting, each marked `platform`; the identity facts read absent with their prompt-point pending, and nothing is undefined; the send itself is proven with M06's first send
- Given a tenant with untouched template settings, when Quick mode builds a proposal, then the platform defaults fill the hidden steps and the result is generable (M01-53, M01-28). → proof: unit apps/api/tests/settings/effective-settings.test.ts — the effective read carries the timeline template, the default tranche template, the default T&C and the bank details (absent → omitted, prompt-point pending) for a tenant that never opened settings; Quick mode's consumption is M06's
- (The seeding this task performs at tenant creation — an `onboarding_progress` row, the empty business profile, the two tranche templates with exactly one default — has its Given/When/Then at `T-M01-020` (M01-54); here the M01-28 text quoted above is the binding criterion.) → proof: unit apps/api/tests/settings/tenant-seed.test.ts — a new tenant holds exactly those rows, the default template's lines sum to 100.00, and a second seed call for the same tenant seeds nothing twice
- Given a template whose tranches sum to anything but 100.00, when save is attempted, then it is blocked with the unallocated remainder stated (M01-54). → proof: unit packages/domain/tests/commerce/tranche-allocation.test.ts — 10/60/20/10 and 30/60/10 are met, 10/60/20 states 10.00, 33.33 × 3 states 0.01; unit apps/api/tests/settings/tranche-templates.test.ts — the save answers `TRANCHES_NOT_WHOLE` naming the remainder and writes nothing, make-default moves the one default, archiving the default is refused, archive never deletes
- Given a malformed tax registration, when it is saved, then the refusal explains the market's format and a well-formed one is stored (M01-25). → proof: unit packages/domain/tests/tax/registration.test.ts — the IN pattern at its edges and the format sentence per language; unit apps/api/tests/settings/settings-writes.test.ts — 422 with the sentence in `details[].issue`
- Given a brand colour that fails contrast, when branding is saved, then it is never refused and the response carries a same-hue shade that passes (F7-07, M01-50). → proof: unit packages/domain/tests/branding/compliant-shades.test.ts — a passing colour returns itself, a failing one returns a darker same-hue shade at ≥ 4.5:1, ink or white is chosen for text on the raw colour, and no input is refused
- Given a skipped step, when its fact is needed, then exactly one prompt-point fires, and declining leaves the default in place (M01-29). → proof: unit packages/domain/tests/tenancy/onboarding-steps.test.ts — the resume step after each completed or skipped step, a second fire refused, declined keeps the default; unit apps/api/tests/settings/onboarding-progress.test.ts — the row moves as the rule says
- Given any settings write, when it commits, then one audit entry records it with the change (F2-22). → proof: unit apps/api/tests/settings/settings-writes.test.ts — every write above leaves exactly one entry under its event type; a refused write leaves none
- Given migration 0006, when the tenancy scan runs, then all nine tables pass as tenant-scoped. → proof: invariant table-tenancy-scan

### T-M01-029 · Demo project seed per market pack
**Type:** engine · **Tier:** P0
**Status:** planned
**Why:** A new owner opens a finished rooftop of their market's kind — survey, design, proposal — and learns the studio on it without fear of breaking a real quote; without it every first session begins on an empty state.
**PRD rows:** M01-27
**Requirements (verbatim):**
- **M01-27** (P0) — **A demo project ships per market pack, ready on day one.** Every new tenant starts with a finished, realistic demo project supplied as market-pack demo content — a real rooftop of that market's kind, pre-loaded through survey, design and proposal — so new users learn by opening something finished, not an empty state, and the demo is the safe place to learn the design studio "without fear of breaking a real quote". The IN pack's demo content is the source's Pune-class residential rooftop; every other market authors its own. **Placement ruled (owner ruling 2026-08-04):** the demo project ships as **pack content** — versioned with the pack per `F1-11`, beside the eight rules keys, not a ninth key (`F1-02` carries the note).
  *Also owned here:* the `DocumentPreview` sample defaults — a fake tenant, tax registration, customer,
  document number and date, line items, subsidy and their English labels — are demo content of this
  kind and move to the pack with this task; the labels are copy and move to i18n; the settings screens
  that preview a real tenant pass every prop, so no sample value can print on a real document.
**Data model:** `demo_project_content` — readable global reference data, as `market_pack`: no `tenant_id`, SELECT held and no write privilege for `app_user`, no RLS, listed in `GLOBAL_READABLE_TABLES` with its reason. Its migration number is taken when its slice begins — after the first migrations that author `lead` (M02), `design` (the studio) and `proposal` / `proposal_version` (M06) — because seeding writes rows into those tables and a migration cannot reference a table that does not exist; no number is reserved. Whether the seed runs inside the tenant-creation transaction or through the outbox (the orchestration-handoff rule in `docs/engineering/forward-compat.md`) is settled before the build.

| entity | key fields | rules | rows |
|---|---|---|---|
| demo_project_content | market_code; pack_version_pin; localized design and proposal content (the survey chapter is added with M04) | One finished, realistic demo project per market pack — pack content versioned with the pack (F1-11), beside the eight rules keys and never a ninth key; the IN content is the Pune-class residential rooftop, every other market authors its own. Instantiated for every new tenant at creation; V1 seeds lead → design → proposal, and the survey chapter joins the pack content when M04 lands — a demo with no survey chapter is a complete demo, not a truncated one, and never a survey-shaped row faked to satisfy a parent. Tenant instances are labelled demo on every surface they reach, never count in pipeline, forecast or reports, and are resettable. Fictional content, no personal data (sensitive-data register). Index (market_code). Conditions settled before the build: the content's shape and seeding format (deferred to this row by F1-02); whether reset restores the creation-time pack version or the current one; the per-tenant demo marker's shape — a stored marker on the instantiated lead, design and proposal rows, owed here and never discovered at seed time. | F1-02, M01-27 |

**Contract:** `packages/contracts/src/demo.ts` (new) — POST /demo/reset — re-seeds the tenant's demo project from the pack content, replacing the instance. The demo marker: an `isDemo` field on the lead, design and proposal read shapes, added in their own contract files when this slice begins (Law 9; the contract change's sweep of every typed client). Domain types: the `DemoProjectContent` envelope in `packages/domain` — market, pack version pin, chapter names — with each chapter parsed by its owning module's reader; the demo label is `packages/i18n` copy. The `DocumentPreview` sample defaults move into this content, their English labels into `packages/i18n`, and the settings previews of a real tenant pass every prop.
**Depends on:** `T-FCORE-016` (migration 0001 — `pack_version_pin` re-minted through `packVersion`) · `T-M01-025` (migration 0002 — the tenant-creation hook the seed runs from) · `T-M01-026` (migration 0006 — the defaults the demo proposal is generated with) · the first migration of M02 (`lead`), of the studio (`design` and its geometry payload) and of M06 (`proposal`, `proposal_version`) — none of which has a task id yet — and, for the survey chapter, M04's first migration (`survey`, `survey_version`), which is V2. Plainly: this task cannot start until the lead, design and proposal tables exist, so its slot is after block 8's first proposal migration, and the survey chapter is added when M04 lands.
**Out of scope:** pack storage and the eight rules keys — `T-FCORE-016`; the studio's behaviour on the demo design — the MS tasks; reports and dashboards excluding the demo — M13 reads the marker; the survey chapter — M04; the `DocumentPreview` component itself — `docs/tasks/UI.md`; the onboarding screen's two doors and the shell they open into — `T-M01-006` and `T-SHELL-001` (door two opening this demo is proven here).
**DONE WHEN:**
- Given any new tenant, when they land after onboarding, then the market-pack demo project exists, opens complete (survey → design → proposal), and is labelled demo everywhere (M01-27). → proof: QA web · ios · android a new tenant on web and mobile opens the demo lead, design and proposal, each carrying the demo label, and no pipeline, forecast or report counts them; door two of `SCR-M01-06` (`T-M01-006`) opens that labelled demo project on web and both phones; the survey chapter is proven when M04 lands
- (The `DocumentPreview` sample defaults quoted above carry no Given/When/Then; the binding criterion is that no sample value can print on a real document.) → proof: QA (web) every settings preview of a real tenant renders that tenant's own values or platform defaults, and the sample content is reachable only from the demo project
- Given `demo_project_content`, when the tenancy scan runs, then it passes as readable global reference data — SELECT held, no write privilege, no RLS. → proof: invariant table-tenancy-scan
- Given a reset, when it runs, then the tenant's demo instance is replaced from the pack content and nothing outside the demo rows changes. → proof: unit apps/api/tests/demo/reset.test.ts

### T-M01-037 · Catalog vocabulary, spec envelopes and the item resolver
**Type:** engine · **Tier:** P1
**Status:** shipped (#195)
**Why:** One place decides what a catalog item is — its kind, whether its datasheet figures are physically possible, and which price, tax and flags are in force for a tenant on a date. Split from `T-M01-027` at /start (owner ruling: past the size line, two tasks at the domain seam), so the routes, the pickers, BOM and M06 all read one resolver that was tested first.
**PRD rows:** M01-45 (P1)

**Depends on:** `T-FCORE-001` (`badgedSchemes`, `holdsScheme` — landed) · `T-FPLAT-070` (the `./server` entry — landed).
**DONE WHEN:**
- **D1** · (M01-45 carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text quoted above is the binding criterion.) → packages/domain/tests/catalog/specs.test.ts › "micro_inverter and optimiser are component kinds, each parsing and gating its own envelope"
- **D2** · Given the resolver, when the pickers, the settings screen, BOM or a proposal line read an item, then each reads `resolveCatalogItem` and gets the same fields, tier attribution and rate — fixed and tested before M06 consumes it (M01-32, M01-37). → packages/domain/tests/catalog/resolve.test.ts › "an override's set fields win" (money — proven red) · "an unset tax falls through to the pack rate (%s)" · "an unset price resolves to no rate (%s)" · C6
- **D3** · M01-42's Given/When/Then stays on `T-M01-027`; its domain half is proven here → C7

### T-M01-027 · Platform catalog, tenant items, overrides and rate history
**Type:** engine · **Tier:** P0
**Status:** shipped
**Why:** An installer picks a real panel, inverter or optimiser from their market's list — the scheme badge on it, their own price under it — and a proposal from last year still prices the product they archived since; without it every picker is empty, every BOM line is unpriced, and the studio, the proposal builder and the price book have nothing to resolve against.
**PRD rows:** M01-33 (P0), M01-42 (P0), M01-44 (P0)

**Depends on:** `T-M01-037` (the catalog vocabularies, spec envelopes and resolver) · `T-FCORE-016` (migration 0001 — `market_pack.market_code` the availability junction references; the stored `pack.certificationSchemes` and `pack.tax`) · `T-M01-025` (migration 0002 — `tenant`, `user_account` for `entered_by` and `published_by`, the guard for `onboarding.manage_catalog` and `onboarding.add_own_catalog_items`) · `T-FCORE-001` (`certificationScheme`, `badgedSchemes`, `holdsScheme` — landed) · `T-FPLAT-001` (`M01_CAPABILITIES` — landed).
**DONE WHEN:**
- Given a tenant in market A, when they browse or search the catalog, then only market A's platform slice plus their own SKUs appear (M01-33). → proof: unit apps/api/tests/catalog/market-slice.test.ts — an item available only in market B never reaches a market-A tenant's list or item route, another tenant's SKU never appears, and the tenant's own SKU does
- Given an archived product referenced by an old proposal, when that proposal renders, then every line still resolves and prices are unchanged (M01-42, M01-43). → proof: `T-M01-037`'s packages/domain/tests/catalog/resolve.test.ts — an archived item resolves identically apart from its archived flag — and this task's proof that no route or grant deletes a catalog row; the proposal render itself is proven with M06's first render
- Given a rate change on a tenant SKU or override, when it is saved, then a new dated rate entry exists and every prior output can still name the rate it used (M01-44). → proof: unit apps/api/tests/catalog/rate-entries.test.ts — a change appends one row, the earlier row is byte-identical after it, and rate-at-date for the earlier date returns the earlier amount
- Given the catalog migration, when the tenancy scan runs, then the five tenant tables pass as tenant-scoped, the three platform tables pass as readable global reference data, and `catalog_rate_entry` holds no UPDATE or DELETE grant. → proof: invariant table-tenancy-scan, seen red on an injected INSERT grant on `catalog_item` for `app_user`

### T-M01-030 · Catalog spreadsheet import job
**Type:** engine · **Tier:** P0
**Status:** shipped
**Why:** An owner drops the supplier's price list in and every product they stock carries their price minutes later — hundreds of rows matched against the platform book, unknown ones made their own SKUs, broken ones fixed in place (M01-41); without it the first quote waits on typing every product by hand, which is the abandonment M01-22 names.
**PRD rows:** none of its own — the import row is quoted and dispositioned at `T-M01-017` (the wizard), and this task is the job beneath that screen; quoting it a second time here would be the duplicate this suite forbids.

**Depends on:** `T-M01-027` (migration 0015 — the tables the job writes into, the spec gates, the rate-entry append and the catalog repositories) · `T-M01-031` (migration 0016 — the migration order) · the outbox table — the orchestration-handoff rule above · the one `file` table and the presigned direct-to-storage upload (`docs/engineering/data-model.md` §2.12 `file`; `docs/engineering/forward-compat.md` "file transfer (presigned)") — no task id yet; the first file slice authors them and this task cannot start before it · `T-M01-025` (migration 0002 — `started_by`, the guard) · the Temporal stack and the dispatcher protocol `infra/temporal/README.md` proves.
**DONE WHEN:**
- Given an import file with platform-matching rows, unknown rows and broken rows, when the preview renders, then it states the three counts, matched rows become price overrides and unknown rows tenant SKUs on import, and broken rows are fixable inline; the import runs async with progress and produces a per-row report (M01-41). → proof: unit apps/worker/tests/catalog/import-run.test.ts — over one file the matching pass yields the three counts, the run creates an override with a dated rate entry and no SKU per matched row, a SKU per unknown row, and a report line per broken row; the wizard's rendering is proven at `T-M01-017`
- Given the same file imported twice, when the second run completes, then each unknown row exists as exactly one SKU and each matched override carries two dated rate entries; given an activity retried after a partial apply, then no row is created twice (§M01.4 edge cases; M01-44). → proof: unit apps/worker/tests/catalog/import-idempotency.test.ts
- Given a run is started, when the API commits the status change, then the outbox row is in the same transaction and a dispatcher that retries after a crash starts exactly one workflow. → proof: unit apps/api/tests/catalog/import-handoff.test.ts — an injected failure after the job update leaves no outbox row, and two dispatches of one event yield one workflow id
- Given a file whose headers are in Hindi or Marathi, when the mapping auto-guesses, then the same target fields are proposed as for the English headers, and the header text itself is returned untranslated (§M01.4 localization notes). → proof: unit packages/domain/tests/catalog/import-columns.test.ts
- Given a row matching a platform product at a different spec, when the matching pass runs, then it is a needs-attention row and no platform spec changes (§M01.4 edge cases). → proof: unit packages/domain/tests/catalog/import-matching.test.ts
- Given migration 0019, when the tenancy scan runs, then `catalog_import_job` passes as tenant-scoped. → proof: invariant table-tenancy-scan

### T-M01-031 · Price book
**Type:** engine · **Tier:** P0
**Status:** shipped
**Why:** An installer quotes installation, engineering and per-kW charges from one active rate card, and a proposal sent last month still shows last month's rates (M01-48, M01-49); without it every non-component line is typed by hand on every proposal, and a rate edit silently reprices work already sent.
**PRD rows:** none of its own — the price-book row is quoted and dispositioned at `T-M01-015` (the rates panel of the one catalog surface) and the sent-proposals law sits in this file's Laws section; this task is the versioned structure beneath both, and quoting either again would be the duplicate this suite forbids.

**Depends on:** `T-M01-025` (migration 0002 — `tenant`, the creation transaction a seeded version joins, `user_account` for `published_by`, the guard for `onboarding.manage_catalog`) · `T-M01-027` (migration 0015 — the migration order and the catalog contract area the rates panel shares; component rates resolve there, never here) · `T-FPLAT-006` (the per-language shape of tenant-authored names).
**DONE WHEN:**
- Given any rate change, when it is saved, then a new price-book version exists, the old one is untouched and browsable, and exactly one version is active (M01-48). → proof: unit apps/api/tests/price-book/publish.test.ts — a publish inserts one version and its rows, the prior version and its rows are byte-identical after it, the versions list still serves it, and the active read returns exactly the new one
- Given a draft pinned to an older version, when it is opened after a publish, then it is visibly stale and requires an explicit re-price — never a silent recompute (M01-49, F8-13). → proof: unit apps/api/tests/price-book/active.test.ts — the active read names the version id and number a draft compares its pin against; the comparison and the stale rendering are proven at `T-FPLAT-028` and with M06's builder
- Given two people publishing at the same moment, when both requests land, then two versions exist in server order with distinct numbers, exactly one is active, and both attempts are recorded (§M01.5 edge cases). → proof: unit apps/api/tests/price-book/publish.test.ts — two concurrent publishes serialize, and the audit write is issued for each once `T-FPLAT-004` lands
- Given a fresh tenant, when the active version is read before anyone publishes, then no version answers, with zero rates and the platform default margin, and its first publish is version 1 (M01-28, F8-14; owner ruling 1A). → proof: unit apps/api/tests/price-book/active.test.ts — a new company reads no version, no rates and the platform default margin, and its first publish is version 1
- Given a Finance session, when it reads the active version and then publishes, then the read answers with prices and margin and the publish is refused (§M01.5 permissions). → proof: QA (api) a Finance member reads `/price-book/active` in full and receives the permission refusal on `POST /price-book/versions`
- Given migration 0016, when the tenancy scan runs, then both tables pass as tenant-scoped and neither holds an UPDATE or DELETE grant. → proof: invariant table-tenancy-scan

## Disposition index

| Row | Disposition |
|---|---|
| M01-01 | T-M01-002, T-M01-034, T-M01-036 |
| M01-02 | T-M01-001 |
| M01-03 | T-M01-001 |
| M01-04 | T-M01-001 |
| M01-05 | T-M01-025 |
| M01-06 | T-M01-025 |
| M01-07 | T-M01-025 |
| M01-08 | T-M01-002, T-M01-034, T-M01-036 |
| M01-09 | T-M01-035 |
| M01-10 | T-M01-025 |
| M01-11 | LAW |
| M01-12 | T-M01-007 |
| M01-13 | T-M01-008 |
| M01-14 | T-M01-009 |
| M01-15 | T-M01-010 |
| M01-16 | realized-by: docs/tasks/SHELL.md T-SHELL-001 |
| M01-17 | T-M01-028 (non-UI handoff half — the atomic accept; surface half docs/tasks/SHELL.md T-SHELL-001) |
| M01-18 | T-M01-025 |
| M01-19 | T-M01-012 |
| M01-20 | T-M01-013 |
| M01-21 | T-M01-014 |
| M01-22 | LAW |
| M01-23 | T-M01-004 |
| M01-24 | T-M01-005 |
| M01-25 | T-M01-005 |
| M01-26 | T-M01-006 |
| M01-27 | T-M01-029 |
| M01-28 | T-M01-026 |
| M01-29 | LAW |
| M01-30 | LAW |
| M01-31 | T-M01-005 |
| M01-32 | T-M01-015 |
| M01-33 | T-M01-027 |
| M01-34 | T-M01-015 |
| M01-35 | T-M01-015 |
| M01-36 | T-M01-016 |
| M01-37 | T-M01-015 |
| M01-38 | T-M01-015 |
| M01-39 | T-M01-016 |
| M01-40 | T-M01-016 |
| M01-41 | T-M01-017 (the wizard; the job beneath it — T-M01-030) |
| M01-42 | T-M01-027 |
| M01-43 | T-M01-015 |
| M01-44 | T-M01-027 |
| M01-45 | T-M01-037 |
| M01-46 | LAW |
| M01-48 | T-M01-015 (the rates panel; the versioned structure beneath it — T-M01-031) |
| M01-49 | LAW |
| M01-50 | T-M01-018 |
| M01-51 | T-M01-019 |
| M01-52 | T-M01-019 |
| M01-53 | T-M01-026 |
| M01-54 | T-M01-020 |
| M01-55 | T-M01-021 |
| M01-56 | LAW |
| M01-57 | realized-by: T-M07-005 — docs/ux/briefs/SCR-M07-05-agent-setup-settings.md (SCR-M07-05 screen task, M07 tasks file) |
| M01-58 | T-M01-022 |
| M01-59 | T-M01-023 |
| M01-60 | T-M01-024 |
| F4-37 | T-M01-025 |
