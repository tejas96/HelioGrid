# SCR-M09-07 · Site Geofence

Set or override a site's fence radius on an existing anchor (project site, survey site, confirmed visit address).

**Module:** M09 · Field workforce · **Personas:** Project Manager, Operations, Sales Manager, EPC Owner · **Context of use:** coordinator surface — desktop-first and fully functional on mobile; the people who run a project site run its fence (the holder set of `F2.M09.manage-geofences`). Geofencing is a prompting capability, never enforcement, and the fence exists only for tracked employees.

## Entry & exit

Reached from: the anchor site's own record — the anchors are `modules/M08`'s project sites and the confirmed addresses of survey visits and booked site visits (`M09-49`); a geofence is a property attached to one of them. The tenant **default** radius is a tenant setting and lives on Tracking Settings (SCR-M09-01). Leads to: a fence in the wrong place is an address problem — the user is directed to the module that owns the site to correct the address, and the geofence follows (`M09-49`); creating a geofence never creates a place. Other exits are not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M09-field-workforce.md

- **M09-49** (P0) — **A geofence is anchored to a place the product already holds, never to a place it invented.** The anchors are `modules/M08`'s **project sites**, and the confirmed addresses of survey visits and booked site visits (`M04-12`'s corrected site record, `M02-46`'s confirmed address). Creating a geofence never creates a place: if the product does not already know where the site is, the fix is to correct the site — in the module that owns it — and the geofence follows. _(non-UI half, build-side: no place creation; anchors are M08/M04/M02 sites; wrong fence = fix address in owning module — for awareness, not for drawing)_
- **M09-50** (P0) — **A geofence is a radius around its anchor, set per site by the tenant, with a stated default and an honest minimum.** The default radius is a tenant setting; a site may override it; and the surface states what the radius means in the market's units (`pack.formats`). A radius smaller than the typical accuracy of a consumer position fix is refused with the reason named, because a fence the product cannot reliably tell you have crossed is a fence that generates false events (`M09-46`'s accuracy law applied). **P0 because two P0 rows depend on it:** `M09-51`'s prompt-never-acts law is only meaningful if the fence that raised the prompt is one the product can reliably tell was crossed, and `M09-49`'s anchor rule assumes a radius exists on the anchor it names — a geofence with no defined radius is not a narrower feature, it is a source of false events on a privacy-sensitive surface. _(non-UI half, build-side: radius below typical fix accuracy refused with reason named — for awareness, not for drawing)_

## States

- **loading**
- **empty** (site with no fence yet: a site with no radius has no fence)
- **error**
- **default-inherited** — the site carries the tenant default radius, stated as the default it inherits (`M09-50`).
- **site-override** — the site's own radius overriding the tenant default (`M09-50`).
- **radius-refused-below-minimum** — a radius smaller than the typical accuracy of a consumer position fix is refused with the reason named (`M09-50`).
- **no-anchor-redirect** — an attempt to create a geofence where no anchor exists: no new place is created and the user is directed to the module that owns the site (`M09-49`).

## Data volume

One site, one anchor, one radius — plus the tenant default it inherits or overrides. Design against the anchor kinds the PRD names: a project site, a corrected survey site record, a confirmed visit address.

## Numbers carrying provenance

- **The site's fence radius** — stated in the market's units, with what the radius means (`M09-50`).
- **The tenant default radius** it inherits or overrides (`M09-50`).
- **The honest minimum** — the refusal threshold tied to typical consumer fix accuracy, with the reason named when a smaller radius is refused (`M09-50`).

Each user-visible number carries its F8 provenance tier in the design.
