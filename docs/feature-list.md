# What is built today

A plain list of what the app can do now. Web, iPhone and Android have the same features. Three pages are web only: the public pricing page, the customer page, and the proposal PDF page.

Each feature gives its goal, its forms (with the field names), and its flow.

---

## 1. Sign in and company setup

### Sign in
**Goal:** Let a person with an account get in with their mobile number and a code, or with Google.

**Forms**
- **Sign in:** Mobile number, Language.
- **Enter the code:** 6-digit code. You can also get the code by call, resend it, or change the number.
- **Confirm your mobile number** (first Google sign-in only): Mobile number.

**Flow:** Open sign in → Type mobile number → Send code → Enter code → Home.
With Google: Continue with Google → Pick Google account → Confirm mobile number (first time only) → Enter code → Home.

If another person's photos on this device are not uploaded yet, the app warns you before you sign in.

**Not ready yet:** the "Upload them first" choice on that warning waits for survey capture.

### Company sign-up
**Goal:** Let a new owner check their number and create their company.

**Forms**
- **Your number:** Mobile number, Language.
- **Code:** 6-digit code.
- **Your company:** Company name, Your name, City.

**Flow:** Open sign-up → Type mobile number → Enter code → Fill company name, your name and city → Create company → Home → Setup steps.
If a company with the same name and city exists, you can ask to join it or create a new one.

### Owner setup steps
**Goal:** Walk a new owner through basic setup before they start.

**Forms**
- **Choose your language:** Language (English, Hindi, Marathi).
- **What do you sell?:** Who you sell to (Residential, Commercial, Both), Typical system size.
- **Your company profile:**
  - Logo, Company name
  - Street address, City, PIN code
  - GSTIN (optional)
  - Bank name, Account holder, Account number, IFSC
  - Who you sell to, Typical system size
- **Invite your first teammate:** Their name, Their phone number, Roles.

**Flow:** Choose language → What do you sell → Company profile → Invite a teammate (or skip) → "You're ready" → Create your first lead.

**Not ready yet:** the "Open the demo project" button does nothing.

### Join by invite
**Goal:** Let an invited person accept and join the company.

**Forms**
- **Invite:** Code from the SMS.
- **How your team sees you:** Your name, Profile photo (optional).

**Flow:** Open invite link → Enter code → Join → Check name and photo → Read your role card → Home.
You can also decline the invite.

### Role card
**Goal:** Show a new member what their role can and cannot do.

**Forms:** None.

**Flow:** After joining → Read "What you can do" and "What you cannot do" → Go to Home.

### Public pricing page
**Goal:** Show visitors the four plans and let them start a free trial.

**Forms**
- **Plans:** Monthly or Yearly, Compare two plans (Plan, Against), Show (Limits, Included, Extra charges), Language.

**Flow:** Open pricing → Pick Monthly or Yearly → Compare plans → Start free trial → Company sign-up.

---

## 2. Home and the app frame

### Home
**Goal:** Show each person the work that matters for their role today.

**What each role sees**
- **Owner and Sales Manager:** a dashboard. It shows what needs you now, money collected, deals won against the target, the forecast, the pipeline, and why deals were lost.
- **Sales Executive:** My Day. It shows the next call, then tasks for Overdue, Today and This week.
- **Finance:** Money due. It shows late payments, payments due today, and part-paid projects.
- **Installer:** Today's job. It shows how to get in, directions, a call button, and a photo and tick for each step.
- **Other roles:** a greeting, the main button for their role, and a setup checklist.

**Forms**
- **Monthly target** (owner): Target for this month.
- **After a call** (My Day): How did the call go (Picked up, No answer, Not now).
- **Install step** (installer): Done by someone else? Name them.
- **Account menu:** Theme (Device, Light, Dark).
- **Home switcher** (people with more than one role): Which home to show.
- **Lead with no owner** (owner dashboard): Assign to (one tap, or pick someone).

**Flow:** Sign in → Home opens for your role → Do the top task → Mark it done or move it to tomorrow.

The owner can also export the dashboard as a CSV file. On the first visit, short tips point at the main parts.

**Not ready yet:**
- Operations, Project Manager, Marketing, HR/Admin, Design Engineer, Survey Engineer and Field Technician see only a general home.
- The Grievance officer page in the account menu says "Not published yet".

### Search
**Goal:** Find any lead, customer, proposal, person or catalog item from one box.

**Forms**
- **Search:** Name, phone or city.

**Flow:** Press Ctrl K (or tap Search) → Type → Pick a result → It opens.

### Notifications
**Goal:** Show in one panel everything that needs you.

**Forms**
- **Filters:** Unread only, Group (Sales, Delivery, Payments, Team, Billing).

**Flow:** Tap the bell → Tap an item → It is marked read and opens.

### Not built yet
These open an "On its way" page only:
- People
- Campaigns
- Start survey
- Agent & voice (in Settings)

---

## 3. Leads (CRM)

### Leads list
**Goal:** Find any lead fast and see where each deal stands.

**Forms**
- **Filters:**
  - Whose leads (Mine, Team, All, Inbox)
  - Search (name, phone or city)
  - Sort (Newest, Bill largest, Bill smallest, Latest activity)
  - Source (Quick add, Import, Referral)
  - Only dormant leads
  - Stage (New, Contacted, Qualified, Survey, Design, Proposal, Negotiating, Won)

**Flow:** Open Leads → Search or filter → Tap a lead → The lead opens.

### Add a lead
**Goal:** Save a new enquiry in seconds. Only the phone is required.

**Forms**
- **New lead:** Phone, Name, City, Type (Residential, Commercial).
- **Number already here:** pick Open existing, Log enquiry on it, Ask the owner to share it, or Keep both. Keep both asks: Why keep both?

**Flow:** Tap Add lead → Type phone → Add name, city and type → Save lead → Open it.

### Lead page
**Goal:** Give the rep everything for a call: call, take notes, qualify, book a visit, and close the deal.

**Forms**
- **Qualify:** Monthly bill, Roof (Owned, Rented), Roof type, Shading, When to buy, Decision maker.
- **Edit details:** Name, City.
- **Log activity:** What to log (Call, Note), How did the call end, Note.
- **Message to copy:** Which message (Follow-up, Visit confirmation).
- **Book a site visit:** Date, Time, Surveyor, Confirmed address.
- **Add a call-back:** Date, Time.
- **Snooze:** Wake on.
- **Disqualify:** Reason.
- **Mark lost:** Reason, Bring it back in (for "Postponed"), Comes back on.
- **Add a contact:** Name, Phone, Role, A role of your own.
- **Contact settings:** Do not call, Language, Make primary.
- **Assign:** Give to (team member).
- **Mark won:** Final value, Expected install date, Project manager.
- **New proposal:** How to build it (Quick or Full), or copy a recent proposal.
- **Add a referral:** opens Add a lead, marked "Came from" this lead.
- **Junk, Withdraw proposal:** confirm only, no fields.

**Tabs:** Timeline (all history), Site (the visit), Designs, Proposals, Tasks (call-backs), Files (add and open files).

**Flow:** Open lead → Call → Log the call and a note → Qualify → Book a site visit → Create proposal → Mark won → Project starts.
Other endings: Mark lost, Disqualify, Snooze, Junk, or Reopen later. A snoozed lead has "Wake up now".

**Not ready yet:** "Create design" and the Designs tab wait for the design studio.

### Lead inbox
**Goal:** Help the owner give each new lead to a person, or bin it.

**Forms**
- **Give to:** Team member (one tap).
- **Select many:** a tick on each lead, then Assign.

**Flow:** Open Leads → Inbox → See the newest lead → Tap a team face (or Junk) → The next lead shows.

### Import leads
**Goal:** Bring an old spreadsheet of leads in once, with no copies. Only for owners and sales managers.

**Forms**
- **Upload:** File, Sheet in the file, Header row.
- **Map columns:** each column becomes Name, Phone, City, Type, Monthly bill, or Don't import.
- **Preview:** For numbers already here: Skip, or Log as enquiry on the existing lead.

**Flow:** Open Leads → Import → Drop the file → Check columns → Read preview → Import → Read the report.

### Merge customers
**Goal:** Join two records of the same family into one. This cannot be undone.

**Forms**
- **Find the other record:** Search.
- **Which record stays?:** Stays or Merges in.
- **Pick one of each:** Name, City, Primary contact.

**Flow:** Open lead → Merge duplicate → Find the other record → Pick which stays → Pick values → Merge.

---

## 4. Proposals

### Proposals list
**Goal:** Find any proposal and do its next step.

**Forms**
- **Filters:** All, Waiting, Draft, Accepted, Closed.
- **New customer** (for a new person): Phone, Name, City, Type.
- **Copy for which customer?:** Search your leads.
- **Start a proposal:** How to build it (Quick 4 steps or Full 11 steps), or copy an old one.

**Flow:** Open Proposals → New proposal → Pick or add the customer → Pick Quick or Full → Builder.

Each row also has Copy (for another customer) and Make a new version.

### Proposal builder
**Goal:** Build a proposal step by step while you see what the customer will see. It saves as you type.

**Forms (one per step)**
1. **Your company:** Proposal type (customer owns it, or pays for power), Cover picture.
2. **Your track record:** kW installed, Happy customers, Cities served, About your company.
3. **System and price:**
   - System size, Type (Residential, Commercial), System type (On-grid, Hybrid, Off-grid), System price
   - Discount (amount or percent), Subsidy claimed
   - Sanctioned load, Supply (1-phase, 3-phase)
   - Yearly maintenance (None, Free, Paid), Years
   - EMI example: Interest rate, Term
   - Battery: Battery size, Battery price, Cell chemistry, Which chemistry (for Custom)
   - Our cost (never printed)
4. **What it will generate:** System efficiency, Generation for each month.
5. **What it will save:** Monthly bill, Tariff, Tariff rise, Years.
6. **How the work goes:** Steps, each with Name, What happens, How long.
7. **How it is paid:** Payment plan, each part with Share (%), Name, Falls due (stage).
8. **What goes on the roof:**
   - Pick brands for Solar panels, Inverter, Cables, Electrical, Structure, Battery
   - Panels: Panels count, Watt peak, Panel type, Warranty
   - Inverter: Units, Capacity, Inverter type, Phases, Warranty
   - Other parts: Type or Specification, Standard, Warranty
   - One line for the customer
   - Add a new part (cables, electrical, structure): Brand, Specification, Warranty. New panels, inverters and batteries use the Catalog's Add an item form.
9. **Terms and conditions:** Terms, Save as company default.
10. **Who it is for:** Site address, State, District.
11. **Where to pay:** Print bank details, Bank, Account name, Account number, IFSC.
- **Generate check** (version 2 and later): What changed, and why.

Quick mode shows only steps 1, 3, 8 and 10. The other steps use the company defaults.

**Flow:** Start proposal → Fill each step → Generate → Fix any red items → Proposal is ready → See it and share.

### Proposal status page
**Goal:** Show where a proposal stands and do the next step.

**Forms**
- **Share:** no fields. Share on WhatsApp, Copy link, or Get PDF.
- **New link:** Who is it for, Name of the link.
- **Put a new version in force** (after Won): no fields.
- **Withdraw:** no fields.
- **Thank message** and **Installation message:** no fields. A ready message to share or copy.

**Flow:** Open proposal → Share on WhatsApp → A follow-up call is added for 2 days later → See Opened and Answered → Customer accepts → Confirm won.

The page also shows the versions (what changed), the links, and the document as the customer sees it.

### Customer page (the link the homeowner opens)
**Goal:** Let the customer read the proposal and answer, with no login, in their own language. After Won, it shows the project progress and payments.

**Forms**
- **Accept:** no fields.
- **Ask a question:** Your question.
- **Request a call:** Time.
- **Ask for a change:** What to change (Bigger system, Lower price, Another brand, Easier payment plan), Your request.
- **Decline:** Why (Price, Not now, Another company, My roof).
- **Language** picker.

**Flow:** Customer opens link → Reads proposal → Accepts (or asks, requests a call, asks for a change, or declines) → After Won, sees progress and payments → After handover, gets their solar file.

The page also lists the customer's questions and their answers. The solar file has the documents and a referral number to share. If a link is turned off, the page says so and shows who to call.

### Proposal PDF
**Goal:** Make a PDF that matches the proposal exactly.

**Forms:** None.

**Flow:** Tap Generate or PDF → The PDF is made → Download or share it.

### Proposal becomes Won
**Goal:** Turn an accepted proposal into a project in one step.

**Forms**
- **Mark won:** Final value (filled from the proposal), Expected install date, Project manager.

**Flow:** Customer accepts → Rep calls them → Confirm won → Fill install date and manager → Mark won → The project starts with the proposal's price and payment plan.

---

## 5. Projects

### Projects board
**Goal:** Show every live project, what needs you now, and what waits on others.

**Forms**
- **Filters:** Search, Sort (Longest in stage, Install date soonest), Manager, Stage.

**Flow:** Open Projects → See To do and Waiting → Tap a row → The project opens.

### Project page
**Goal:** Move one project from Won to Handed over.

**Forms**
- **Send it to site:** Which crew goes, Left the warehouse.
- **Who are we waiting on?:** Party (Us, Customer, DISCOM, Material), Why, Since, Team note.
- **Installation day:** Install date, Crew arrives at, Days on site, Crew lead, What to expect.
- **Change manager:** Manager.
- **How to get in:** Note.
- **Document not needed:** Reason.
- **Cancel project:** Reason, Note.
- **Add file:** File name, Show to customer.

- **Proof came early:** no fields. Move the stage now, or keep the file only.

**Flow:** Open project → Tap the next step → Fill the sheet → Save → The stage moves on.

The ⋯ menu also has Move back a stage. A wait has "Wait is over" and "Remind" (copies a reminder).

### Documents
**Goal:** Show the full checklist of papers for the project.

**Forms:** None. Each paper has Upload, Not needed, or Needed after all.

**Flow:** Open project → See all documents → Upload each one.

### Install steps
**Goal:** Let the crew tick each install step with a photo.

**Forms**
- **Install step:** Photo, Done by someone else? Name them.

**Flow:** Open project → Steps and photos → Take a photo → The step is ticked → The stage moves on by itself.

### Payments
**Goal:** See what is due, ask the customer for it, and record money that came in.

**Forms**
- **Collect:** UPI QR or Bank transfer.
- **Record payment:** Amount, Paid by (UPI, Bank transfer, Cheque, Cash), UTR or reference, Received on, Receipt photo.
- **Reverse a payment:** Why.
- **Waive a part:** Why.

**Flow:** Open project → Payments → Collect → Send on WhatsApp → Money comes in → Record payment → The balance updates and a receipt is made.

Each part also has Share request. Each receipt has Receipt PDF, Share receipt, and Add receipt photo.

### Handover
**Goal:** Hand the system to the customer and ask for a referral.

**Forms**
- **Ask for a referral:** Name, Mobile.

**Flow:** Open project → Start handover → Finish any missing papers → Hand over → Download the pack → Add a referral as a new lead.

---

## 6. Settings (More)

### Profile and preferences
**Goal:** Let each person set their own name, photo, language, units, theme and alerts.

**Forms**
- **Edit name:** Your name, Profile photo.
- **Preferences:** Language, Measurements (Metres, Feet), Theme (Device, Light, Dark), Push notifications (Sales, Delivery, Payments, Team).

**Flow:** Open More → Profile and preferences → Change a setting → It saves.

### Team
**Goal:** Invite people, set their roles, and remove access.

**Forms**
- **Invite someone:** Their name, Their phone number, What can they do (roles).
- **Assign roles:** Roles.
- **Deactivate:** Move their open leads to.
- **List:** Search, Status (Invited, Expired, Active, Deactivated).

**Flow:** Open More → Team → Invite teammate → Fill name, phone and roles → Send invite.

An invite can also be revoked or sent again.

### Roles reference
**Goal:** Show what each of the 12 roles can and cannot do.

**Forms:** None.

**Flow:** Open More → Roles reference → Tap a role → Read its lists.

### Business profile
**Goal:** Keep the company details that print on every proposal and receipt.

**Forms**
- **Business profile:**
  - Logo, Company name
  - Street address, City, PIN code
  - GSTIN
  - Bank name, Account holder, Account number, IFSC
  - What you mostly sell, Typical system size

**Flow:** Open More → Business profile → Open a section → Edit → Save changes.

### Branding
**Goal:** Set the logo, colour and letterhead on proposals and the customer page.

**Forms**
- **Branding:** Logo, Primary brand colour, Hex, Tagline, Lines under your address, Note along the foot of every page.

**Flow:** Open More → Branding → Edit → See the live preview → Save branding.

### Proposal defaults
**Goal:** Set what every new proposal starts with.

**Forms**
- **Look:** Cover picture.
- **Track record:** About your company, kW installed, Happy customers, Cities served.
- **Pages:** a Print switch for each page.
- **Timeline:** Phases, each with Name, What happens, How long.
- **Payment:** Payment plan.
- **Terms:** Terms.
- **Bank:** Print bank details, Bank, Account name, Account number, IFSC.

**Flow:** Open More → Proposal defaults → Edit a part → See the sample → Save defaults.

### Payment terms
**Goal:** Set the payment plans that proposals and projects use.

**Forms**
- **Payment terms:** Name of these terms, then each part with Name, Share (%), When is it due.

**Flow:** Open More → Payment terms → Add payment terms → Add parts until they total 100% → Save terms.

### Catalog
**Goal:** Keep the panels, inverters and other parts with their prices, and the price book.

**Forms**
- **Filters:** Search, Source, Kind, Wattage, Technology, Certification, Preferred only, Archived.
- **Edit price:** Price, Tax rate, Hide from pickers, Preferred.
- **Add an item:**
  - Kind (Panel, Inverter, Battery, Micro-inverter, Optimiser), Brand, Model
  - Specs for that kind (for example Rated power, Cell technology, AC power, Usable energy)
  - Certification, Your price
- **Import a price list:** File, Sheet, Header row, Column matching.
- **Fix an import row:** Which product is it, Kind, Your price. Or leave the row out, or import it as your own item.
- **Publish a release:** Release name.
- **New price book version:** Default margin, What changed, Rates (Rate name, How it is charged, Amount).

**Flow:** Open More → Catalog → Tap an item → Set its price → Save price.

### Collections
**Goal:** Set the company's UPI ID so payment requests carry a QR code.

**Forms**
- **How customers pay you:** UPI ID, Name shown.

**Flow:** Open More → Collections → Type UPI ID → Save → Test the QR with ₹1.

### Billing, plans and usage
**Goal:** Let the owner see and pay for the HelioGrid plan.

**Forms**
- **Change plan:** Billing cycle (Monthly, Yearly), Plan.
- **Cancel subscription:** Why are you leaving (optional).
- **Ask for a refund:** confirm only, no fields.
- **Invoices:** Search, Status.

**Flow:** Open More → Billing → Change plan → Pick a plan → Pay.

The Billing page also shows payment reminders, plan history, and the payment method (Update opens the payment company's page).
Usage shows this month's limits used. Tap a meter to see what used it.

---

## 7. What the app does by itself

These have no screen of their own.

- **Every morning at 9:00 (company time):**
  - Marks a lead "dormant" after 30 days with no activity.
  - Wakes snoozed leads that are due, with a follow-up task.
  - Brings back "Postponed" lost leads that are due, with a follow-up task.
  - Tells the owner, once, about each lead with no owner for more than a day.
- **After a proposal is shared:** adds a follow-up call for 2 days later.
- **On the 1st of each month:** sends the owner a short summary of last month in the app.
- **Makes PDFs:** proposals, payment receipts, the handover pack, and plan invoices and credit notes.
- **Sends messages:** the invite SMS, and push notifications. A push is held until a good hour. Old notifications are cleared.
- **Imports:** lead and price-list imports run in the background, then show a report.
- **Plan billing:** sends trial and payment reminders, checks payments every 6 hours, and counts usage and storage.
