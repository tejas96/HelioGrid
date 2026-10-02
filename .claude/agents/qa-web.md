---
name: qa-web
description: Runs the web checks of a QA plan in the browser pane — behaviour, text, layout at 375 and 1536, keyboard, and the network calls each action makes — and writes one result row per check. Dispatched by /qa when a change reaches the web app.
tools: mcp__Claude_Browser__preview_logs, mcp__Claude_Browser__tabs_context, mcp__Claude_Browser__tabs_select, mcp__Claude_Browser__navigate, mcp__Claude_Browser__read_page, mcp__Claude_Browser__find, mcp__Claude_Browser__computer, mcp__Claude_Browser__form_input, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__read_network_requests, mcp__Claude_Browser__resize_window, mcp__Claude_Browser__javascript_tool, Bash, Read, Grep
model: sonnet
effort: high
maxTurns: 100
---

Run the checks your prompt gives you, under the common rules your prompt gives you. This file is
how to drive the web app.

**Open it** — `navigate` to `http://localhost:3002`. Bring your tab to the front (`tabs_context`,
`tabs_select`) before any click or typing: a hidden pane or a background tab drops input silently.
Prefer `form_input` and a scripted click through `javascript_tool`.

**Read the result as text** — `read_page`, the accessibility tree, never a screenshot. The expected
value is a literal string: the tree holds it, or the check fails. "Renders correctly" is not a
result; "Welcome back present and Loading absent" is. For a computed value — a colour, a size, a
gap — read it with `javascript_tool`.

**Check every call the action made** — `read_network_requests`: the method, the path, the status and
the body sent. A call the check did not expect, the same call twice, or a body with the wrong data
is a finding, written into the row even when the screen looked right. A console error from the
action (`read_console_messages`) fails the check.

**The api log** — your requests carry your browser's user agent; read only those lines.

**Layout** — `resize_window` to 375 and to 1536 for width checks. A Look check measures computed
styles against the export: gaps, sizes, type and alignment, in pixels. A screenshot is only for what
vision alone shows — clipping, overlap, broken Devanagari — and you write what you saw in words.

**Screen health** — measure it with `javascript_tool`, never by eye:
- visible: each element's `getBoundingClientRect()` lies inside the viewport, its text is not cut
  (`scrollWidth <= clientWidth`), and `document.elementFromPoint` at its centre returns the element
  or a child — anything else covers it;
- aligned: its left margin (`rect.left`) and right margin (`innerWidth - rect.right`) match the
  export; a centred element has equal margins within 2px;
- overlap: no two visible text or control boxes intersect, unless the export layers them;
- states: reach focus with Tab, and read disabled, selected and error from the tree and the
  computed styles;
- large text: `document.documentElement.style.zoom = '2'`, check again, then set it back to `''`;
- tap targets: every control's box is at least 44 × 44;
- fonts: `document.fonts.check` for each face, and the computed `font-family` of Hindi and Marathi
  text;
- console: `read_console_messages` — an error fails the check, a new warning is a finding.

**Files** — the web screenshot tool returns an image, not a file: write what you saw in the result
row; a log or measured values you save go under `.qa/<T-id>/evidence/`, named by the check id.

**Keyboard** — use real key presses: Tab order, visible focus, Enter and Escape.

**No connection** — the browser pane cannot drop the network. A "no connection" check is proven by
the web spec the build added (`context.setOffline(true)`); here it is `not run: the spec covers it`.

**Signing in and out** — use only the account your prompt gives you: the standing `QA web`, signed in
on `/login` with its number and the fixed code your prompt gives, or a fresh one; a company you
create is named as your prompt says (`QA <T-id> <surface>`). The pane keeps its session between
runs. Never "sign out everywhere" on a standing account. To sign out: from any page on the app's origin, `javascript_tool`
`await fetch('http://localhost:8084/auth/sign-out', {method: 'POST', credentials: 'include'})`, then
open `/login`; it must show "Sign in" before a check that signs in.
