# @heliogrid/theme

Every visual value HelioGrid draws, from one typed source in `src/tokens/`. What each file is and
the rules for changing it: `CLAUDE.md` in this folder.

| export | what |
|---|---|
| `@heliogrid/theme` | the phone's `theme` object, the palettes, the token constants and the contrast pairs |
| `@heliogrid/theme/tokens.css` | the web faces and every token, light, dark (device or `data-theme`) and field (`data-field-mode`) |
| `@heliogrid/theme/base.css` · `print.css` | the element base and the print surface |
| `@heliogrid/theme/android-res/*` | the palette as Android colour resources, light and night |
| `@heliogrid/theme/fonts/*` | Newsreader, Noto Serif Devanagari, Geist, Noto Sans Devanagari, Geist Mono |

The fonts are under the SIL Open Font License 1.1 (`assets/fonts/OFL-*.txt`).
