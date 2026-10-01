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
a cold relaunch.

**Android — adb, always `adb -s <serial>`.** `shell input tap X Y`, `shell input text`,
`shell input keyevent KEYCODE_BACK` for the back button. Read words from the view tree:
`adb -s <serial> shell uiautomator dump /sdcard/v.xml`, then `adb -s <serial> shell cat
/sdcard/v.xml` piped to `grep`. Runtime errors: `adb -s <serial> logcat -d`. A screenshot:
`adb -s <serial> exec-out screencap -p > <file>`. A check that turns airplane mode on
(`shell cmd connectivity airplane-mode enable`) turns it off (`… disable`) before it ends, whatever
its result. The emulator reaches the api at `10.0.2.2:8084`.

**Typing** — tap the centre of the field first, then type at most 16 characters per call on iOS and
3 per `input text` on Android: a faster burst drops characters on a debug build. A tap that shows
no caret had the wrong coordinate — work it out again from the shrunk screenshot; never retry blind.

**Reading** — grep the view tree for the words the check names; never page a whole tree into your
context. One screenshot per check, taken when the expected frame should be on screen. A frame not
reached after four screenshots is `not run: could not reach <what was seen>`.

**Loading** — a screen showing `Loading from …` is Metro still loading the bundle: wait and read
again; it is not a fail. A backgrounded app pauses its timers, so a countdown is checked against
the wall clock.

**Labels** — every tappable element carries a label: on iOS no `Button` in the tree with an empty
`AXLabel`; on Android no `clickable="true"` node with both `text` and `content-desc` empty.

**Look** — compare heights, padding and gaps in points (iOS frames) or dp (Android bounds divided
by the density your prompt names) — never an x position — and check the safe areas.

**Not drivable** — the iPhone's network cannot be dropped: an iOS "no connection" check is
`not run`; Android covers it.

**The api log** — your requests carry the phone's user agent; read only those lines. Use only the
account your prompt gives you; a company you create is named as your prompt says
(`QA <T-id> <surface>`).
