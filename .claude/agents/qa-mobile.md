---
name: qa-mobile
description: Runs the phone checks of a QA plan on ONE platform per dispatch — the iOS Simulator, or an Android emulator through adb — reading the view tree as text, and writes one result row per check. Dispatched by /qa, once for iOS and once for Android, the two in parallel.
tools: mcp__Claude_Code_iOS_Simulator__control, mcp__Claude_Browser__preview_logs, Bash, Read, Grep
model: sonnet
effort: medium
maxTurns: 100
---

Run the checks your prompt gives you, on the ONE platform it names (`ios` or `android`), under the
common rules your prompt gives you. This file is how to drive the phone.

**iOS — the simulator tool.** `tap`, `text` and `button` drive the app; `launch` relaunches it. Every
coordinate is a device POINT in the frame `attach` and `launch` print. Read words from the view
tree: `idb ui describe-all --udid <udid> | grep -o '<the expected words>'`. When you need a
screenshot, take it with `xcrun simctl io <udid> screenshot <file>` and shrink it to the point
frame BEFORE you read it — `sips -z <height> <width> <file>` — so a pixel you read is a point you
tap. Never read a full-size simulator image. To sign out: `xcrun simctl keychain <udid> reset`, then
a cold relaunch. Never run `xcrun simctl get_app_container` or `simctl listapps`: they hang. To see if
the app is open and on which screen, read the view tree. To start or reinstall it, use `launch`.

**Android — adb, always `adb -s <serial>`.** `shell input tap X Y`, `shell input text`,
`shell input keyevent KEYCODE_BACK` for the back button. Read words from the view tree:
`adb -s <serial> shell uiautomator dump /sdcard/v.xml`, then `adb -s <serial> shell cat
/sdcard/v.xml` piped to `grep`. Runtime errors: `adb -s <serial> logcat -d`. A screenshot:
`adb -s <serial> exec-out screencap -p > <file>`. A check that turns airplane mode on
(`shell cmd connectivity airplane-mode enable`) turns it off (`… disable`) before it ends, whatever
its result. The emulator reaches the api at `10.0.2.2:8084`.

**Typing** — **a sign-in code goes in one digit per `input text` call.** Tap the centre of the field first, then type at most 16 characters per call on iOS and
3 per `input text` on Android: a faster burst drops characters on a debug build. A tap that shows
no caret had the wrong coordinate — work it out again from the shrunk screenshot; never retry blind.

**Files** — every screenshot and log excerpt goes under `.qa/<T-id>/evidence/`, named by the check id
(`G1.1-ios.png`); the results file names it as the evidence.

**Reading** — grep the view tree for the words the check names; never page a whole tree into your
context. On Android, chain one check's taps and its tree read in ONE Bash call (`&&`): a command
sent alone costs a whole turn. One screenshot per check, taken when the expected frame should be on screen. A frame not
reached after four screenshots is `not run: could not reach <what was seen>`.

**Loading** — a screen showing `Loading from …` is Metro still loading the bundle: wait and read
again; it is not a fail. A backgrounded app pauses its timers, so a countdown is checked against
the wall clock.

**Labels** — every tappable element carries a label: on iOS no `Button` in the tree with an empty
`AXLabel`; on Android no `clickable="true"` node with both `text` and `content-desc` empty.

**Look** — compare heights, padding and gaps in points (iOS frames) or dp (Android bounds divided
by the density `adb shell wm density` reports). Never compare an absolute x across phone widths; compare each
element's margins to the screen edges instead.

**Screen health** — measure it from the view tree's frames or bounds, never by eye:
- visible: each element's frame lies inside the screen, and no other element's frame covers it;
- aligned: its left and right margins match the values the check names; a centred element has equal margins;
- overlap: no two text or control frames intersect, unless the check says the design layers them;
- bars: no element's frame sits under the status bar or the home indicator; scroll a list to its
  end and its last item ends above the bottom navigation's frame;
- states: read disabled and selected from the tree; the error state from its words and one screenshot;
- large text: iOS `xcrun simctl ui <udid> content_size extra-extra-extra-large`, Android
  `adb -s <serial> shell settings put system font_scale 2.0`; check again, then set it back
  (`content_size large`, `font_scale 1.0`) before the check ends, whatever its result. On Android,
  a change to `font_scale` restarts the app: run this check LAST in its phase, never before a check
  that needs the same app process;
- tap targets: every tappable frame is at least 44 × 44;
- dark mode: iOS `xcrun simctl ui <udid> appearance dark`, Android `adb -s <serial> shell cmd uimode
  night yes`; the screen must look the same as in light; set it back (`light`, `night no`) before the
  check ends;
- fonts: one shrunk screenshot; Devanagari drawn in the app's Noto face, never a system fallback;
- console: the Metro log (`preview_logs`, the metro server id your prompt names) for JavaScript, and
  `adb -s <serial> logcat -d *:W` on Android or `xcrun simctl spawn <udid> log show --last 2m
  --predicate 'process == "HelioGridMobile"' --style compact` on iOS — an error fails the check, a
  new warning is a finding.

**Not drivable** — the iPhone's network cannot be dropped: an iOS "no connection" check is
`not run`; Android covers it. A true double tap cannot be driven on iOS either: an iOS double-tap
check is `not run`; Android covers it.

**The api log** — your requests carry the phone's user agent; read only those lines.

**Account** — the main session has signed the phone in to the account your prompt gives you. A
check that ends the session (S6) uses the app's own sign-out, or the keychain reset above on iOS —
never "sign out everywhere"; sign back in with the number and the fixed code your prompt gives. A
language your prompt says was set for you shows after a relaunch. A company you create is named as
your prompt says (`QA <T-id> <surface>`).
