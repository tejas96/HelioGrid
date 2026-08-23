> ## ⛔ ALREADY SENT — DO NOT RE-SEND
>
> This prompt was sent to the HelioGrid Design System (`c8aa4326-21bf-453a-8d11-749cc81dee12`)
> and **every change in it landed**, verified against the live project on 2026-08-16. It is kept
> as the record of what was asked and why, not as an instruction.
>
> Re-pasting it would ask Claude Design to rebuild components that already exist, and it reasons
> from an inventory that has since changed. If you need a change to the design system, write a
> new numbered prompt.

# Prompt for Claude Design — round three (small)

Paste everything below the line into the same **HelioGrid Design System** chat.

---

`Banner` came out well — the per-kind precedence rank, `BannerStack`'s `single` mode for "the
broadest true fact speaks", and making `dismissible` a no-op for the kinds `F4-26` protects are all
exactly right. `Slider`'s `onInput`/`onCommit` split and `NumberField` are both correct; I checked
`NumberField.jsx` and its clamp, restore-on-invalid, Escape and arrow-key handling all behave.

Three small things left, all in `components/forms/Input.jsx` and its `.d.ts`, plus one question.

## 1. The new props aren't typed

`commitOnBlur`, `onCommit`, `min`, `max`, `precision`, `unit` and `correctionMessage` are fully
implemented in `Input.jsx`, but in `Input.d.ts` they're described in a comment block *below* the
`InputProps` interface rather than declared inside it. A TypeScript consumer passing `commitOnBlur`
gets a compile error on a prop that works fine at runtime. `NumberField.d.ts` declares the same
props properly — match that.

## 2. `onCommit` returns two different types

In `Input.jsx`'s `commit()`:

- with no `min`/`max`/`precision` set, it calls `onCommit(raw)` — a **string**
- as soon as any one of them is set, it calls `onCommit(v)` — a **number**

Same prop, and the type flips based on unrelated configuration. `Input` is a text field, so the
clean answer is for it to always hand back a string and leave numeric commit to `NumberField`,
which is already consistently numeric. If you'd rather keep the numeric clamp on `Input`, then the
type has to be `string | number` and say so — but I'd drop it.

## 3. The unchanged-value guard doesn't fire in the numeric path

Also in `commit()`:

```
if (v !== value && onCommit) onCommit(v);
```

`v` is a number and `InputProps` types `value` as a string, so `0.3 !== "0.3"` is always true — a
field the user focused and left without editing still commits. `MS3-26` (P0) requires *"one undo
entry per committed change"*, so this writes an undo entry for a no-op. The string path guards
correctly with `raw !== String(value)`; the numeric path needs the same normalisation. (`NumberField`
is fine — its `value` is a number on both sides, so its identical-looking guard actually works.)

## 4. A question about `QRCode`'s capacity

`QRCode.d.ts` documents a ceiling of *"~106 bytes (QR version 6, EC level M)"*. The payload it
exists to carry is the tokenised customer proposal link — a URL on a tenant domain with an opaque,
revocable token in it. That is exactly the kind of string likely to run past 106 bytes.

Failing visibly is the right behaviour and I don't want it changed. But if it fails on a *typical*
link rather than an unusual one, then the honest failure fires every time and the QR is decorative.
Please raise the supported version ceiling so an ordinary tokenised URL encodes comfortably, and
keep the visible failure for genuinely oversized payloads. Say in `QRCode.prompt.md` what length is
now safe, so whoever designs the proposal page knows the budget they're working against.

Nothing else — the rest of the round-two work is good as it stands.
