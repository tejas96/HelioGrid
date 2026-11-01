# SCR-M04-04 · Coverage Failure

State that no usable satellite imagery exists for this address and offer a manual outline or a booked visit.

**Module:** M04 · Survey · **Personas:** Sales Executive, Design Engineer, Sales Manager, EPC Owner, Survey Engineer · **Context of use:** mid-remote-survey, at a desk or on a phone; written as information, not as an apology or an error (M04 §M04.4 behavior detail). Coverage gaps are real and expected in the launch market — this screen is designed, not handled.

## Entry & exit

Reached from: the remote survey when the tile fetch finds no usable imagery for the address (mode rule 3, fired reactively — M04 §M04.1/§M04.4). Leads to: **outline the roof manually** continues the survey on a blank canvas (SCR-M04-03's blank-canvas calibration); **book a physical survey** opens visit booking (`F2.M04.schedule-survey-visits`; the visit produces a survey version per M04-57). A retry of the same address is allowed and costs nothing; nothing about the address is cached as permanently uncovered (M04 §M04.4 edge cases).

## Requirements (verbatim)

### docs/prd/modules/M04-survey.md

- **M04-26** (P0) — **Coverage failure has its own screen, and it is not a dead end.** The message is plain and blames nothing: *"No satellite imagery available for this address."* Two ways forward are offered on that screen — **outline the roof on a blank canvas** (known-distance calibration, M04-11; it costs nothing and always works, M04-22) or **book a physical survey** (M04-57's visit). The survey continues from either.

Supporting behavior from the same doc (M04 §M04.4 behavior detail): it states what is not available for this address, offers the two ways forward with equal weight, and — where the lead is residential and simple — recommends the manual outline first, because it keeps the ten-minute path (`M04-07`) alive. Where the lead is commercial & industrial, it recommends booking the visit first, because rule 2 requires the visit before quoting anyway (`M04-05`). No market-level coverage claim is ever made (M04-25, build-side of this flow).

## States

- loading
- empty
- error
- residential-recommends-manual (manual outline recommended first)
- ci-recommends-visit (visit recommended first, rule 2 stated)
- retry (retry after coverage failure; costs nothing)

## Data volume

One message and two routes. No lists.

## Numbers carrying provenance

None — the screen carries the coverage-failure message verbatim and two routes; no figures, money or dates render here. (A survey completed by manual outline after this failure still yields a fully labelled energy figure downstream — that figure and its F8 source label belong to design/proposal surfaces, not this screen.)
