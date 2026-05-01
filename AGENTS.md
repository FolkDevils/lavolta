<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# La Volta Business Card Generator — Agent Reference

> This file is the authoritative source of truth for AI agents working on this codebase. Read it in full before making any changes.

## Quick-start commands

```bash
npm run dev      # start dev server on http://localhost:3000
npm run build    # production build (must pass before committing)
npx tsc --noEmit # type-check only
npx eslint src --ext .ts,.tsx --max-warnings 0  # lint (zero warnings policy)
```

**Always run `tsc --noEmit` + `eslint` after edits. The build must stay green.**

---

## Project overview

A Next.js 16 / React 19 web app that lets La Volta staff design and export print-ready business cards. Each person gets independently configurable front and back card faces. State is persisted to `localStorage`. Export targets: SVG, 300-DPI PNG, and MOO-compatible full-bleed PDF.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS (Newsreader + Red Hat Text on card SVG)
- **Key deps:** `jspdf` (PDF export), `qrcode` (QR generation), no Redux/Zustand — state lives in a single custom hook

---

## Source layout

```
src/
├── app/
│   ├── layout.tsx        # root layout, Rubik font, dark bg
│   ├── page.tsx          # renders <Editor />
│   └── globals.css       # global CSS — slider styles, flip animation, drawer utils
│
├── components/
│   ├── Editor.tsx        # ← main shell; layout only, no business logic
│   ├── PatternLayer.tsx  # SVG flower pattern renderer (seeded RNG)
│   ├── QrModule.tsx      # SVG QR code renderer
│   │
│   ├── card/             # card SVG face components
│   │   ├── shared.tsx    # CardShell, Txt, clampBox, layout geometry (PAD, CONTENT_*)
│   │   ├── CardFront.tsx # front face — all 7 layout variants
│   │   ├── CardBack.tsx  # back face — all 5 layout variants
│   │   └── index.ts      # re-exports CardFront, CardBack
│   │
│   └── controls/         # all editor UI controls
│       ├── index.ts      # barrel — import everything from here
│       ├── FrontPanel.tsx     # all front-face control sections composed
│       ├── BackPanel.tsx      # all back-face control sections composed
│       ├── Section.tsx        # collapsible accordion with localStorage persistence
│       ├── Primitives.tsx     # FDRange (slider + editable number), ChipRow, SectionLabel
│       ├── ColorSelect.tsx    # color swatch picker (palette + custom hex)
│       ├── LogoPicker.tsx     # logo grid + scale/offset sliders
│       ├── PositioningPanel.tsx  # text X/Y offset sliders
│       ├── TextColorBlock.tsx    # primary/sub/phone/email color pickers
│       ├── QrLinksManager.tsx    # editable QR link list
│       ├── PatternPanel.tsx      # flower pattern toggles + density/size/rot/opacity sliders
│       ├── ExportMenu.tsx        # export dropdown (SVG/PNG/PDF × front/back/both)
│       ├── PersonSettingsTransfer.tsx  # per-person JSON backup (download / import)
│       └── PeopleList.tsx        # people rail — add/edit/delete/select persons
│
├── hooks/
│   ├── useEditorState.ts  # all app state + persistence (people, front/back per person, JSON backup)
│   └── useExport.ts       # export state, SVG refs, handleExport
│
└── lib/
    ├── types.ts       # ALL TypeScript types (Person, FrontState, BackState, etc.)
    ├── constants.ts   # barrel re-exporting everything below — existing imports still work
    ├── print.ts       # SVG viewBox dimensions (VB_W, VB_H, BLEED, SAFE_INSET, PX_W, PX_H, DPI)
    ├── palette.ts     # COLORS, LOGOS, QR_COLORS, FD_SOLID_PALETTE, FLOWER_SRCS + clamp helpers
    ├── layouts.ts     # FRONT/BACK_LAYOUTS + FRONT/BACK_LAYOUT_DEFAULTS (global presets) + PERSON_FRONT/BACK_LAYOUT_OVERRIDES (per-person tweaks) + resolve/apply helpers + QR options + normalizers
    ├── typography.ts  # font scale bases, frontFont*Px(), clampFontScale(), gap helpers
    ├── defaults.ts    # DEFAULT_FRONT/BACK/PEOPLE, defaultFrontForPerson(), migrate* functions — chrome + per-layout element defaults
    ├── storage.ts     # STORAGE_KEY constant
    ├── color.ts       # resolveCardPalette(), resolveSolidHex(), toHex6ForColorInput()
    ├── export.ts      # exportSvg(), exportPng(), exportPdf(), EXPORT_SPEC
    ├── personSettingsFile.ts  # PersonSettingsFileV1 envelope + parse/build helpers
    ├── qr.ts          # QR path-building helpers (used by QrModule)
    └── rng.ts         # seeded RNG used by PatternLayer
```

---

## Data model

All types are in `src/lib/types.ts`. The core shapes:

```ts
Person       { id, name, title, phone, email }
FrontState   { layout, color, logo, logoScale, logoOffset*, logoAdjust, textOffset*, fontScale*, textFill, pat, bgImage, … }
BackState    { layout, color, logo, logoAdjust, qrColor, qrBody, qrEyeFrame, qrEyeBall, qrLinks, qrLinkIds, fontQrCaption, pat, bgImage, … }
PatternConfig{ on, f1, f2, f3, density, size, rot, opacity, seed }
QrLink       { id, label, url }
ColorValue   = ColorId | `#${string}`  (palette id OR custom hex)
```

State is stored in `localStorage` under key `STORAGE_KEY = "lavolta_bcb_v1"` as:
```ts
{ people, frontByPersonId, backByPersonId, selectedId }
```

---

## State management

`useEditorState` (in `hooks/useEditorState.ts`) owns all persistent state:
- `people` — array of Person
- `frontByPersonId` / `backByPersonId` — per-person face state maps
- `selectedId` — which person is being edited
- Derived: `person`, `front`, `back`, `factoryFront`, `factoryBack`
- Mutations: `updateFront(patch)`, `patchSelectedFront(fn)`, same for back, plus people CRUD
- Delegates export to `useExport(person)` which owns `frontSvgRef`, `backSvgRef`, `handleExport`
- `exportSelectedPersonSettings()` / `importPersonSettingsFromJson(text)` — per-person JSON backup (see `personSettingsFile.ts`; UI in `PersonSettingsTransfer` in the People rail)

`Editor.tsx` calls `useEditorState()`, spreads the result, and passes slices to panels.

---

## Adding a new front layout

1. Add the new id to `FrontLayout` union in `src/lib/types.ts`
2. Add it to `FRONT_LAYOUTS` array in `src/lib/layouts.ts`
3. Add an entry to `FRONT_LAYOUT_DEFAULTS` in `src/lib/layouts.ts` (logo scale/offsets, text offsets, gaps, font scales — these reset when users switch into this layout)
4. Add default font bases to the `Record<FrontLayout, number>` objects in `src/lib/typography.ts`
5. Add the render case to the `layouts` object in `src/components/card/CardFront.tsx`
6. Add `normalizeFrontLayout` recognition in `src/lib/layouts.ts` if migrating from a legacy id

## Adding a new back layout

1. Add id to `BackLayout` union in `src/lib/types.ts`
2. Add to `BACK_LAYOUTS` in `src/lib/layouts.ts`
3. Add an entry to `BACK_LAYOUT_DEFAULTS` in `src/lib/layouts.ts` (logo scale/offsets + font defaults)
4. Add render case to `layouts` in `src/components/card/CardBack.tsx`

## Layout switching model (important)

Layouts own their element-level defaults. Switching layouts via the panel chip-rows calls
`applyFrontLayoutDefaults(state, layout, personId)` / `applyBackLayoutDefaults(...)`, which
**resets** logo scale/offsets, text offsets, gaps, and font scales to the target layout's
**resolved** defaults. "Chrome" — card background color, pattern, text fill colors, chosen
logo id, QR color/style/links — **persists** across layout switches because it's a user
design choice, not a layout concern. Panel factories always pass `personId` so slider
baselines and reset buttons match the exact layout + person combo.

## Layout-default resolution order

For any `(layout, personId)` tuple the effective defaults are computed as:

```
FRONT_LAYOUT_DEFAULTS[layout]                        // global preset for that layout
  + PERSON_FRONT_LAYOUT_OVERRIDES[personId]?.[layout]  // optional per-person tweak
```

(Identical shape for the back via `BACK_LAYOUT_DEFAULTS` + `PERSON_BACK_LAYOUT_OVERRIDES`.)

- Most edits should go to the **global** preset — a layout should look good by default for
  everyone.
- Use `PERSON_FRONT_LAYOUT_OVERRIDES` / `PERSON_BACK_LAYOUT_OVERRIDES` only when a specific
  person needs a layout tuned differently from the rest. The override map is sparse; it
  stores only the fields that differ. Example:

  ```ts
  // src/lib/layouts.ts
  export const PERSON_FRONT_LAYOUT_OVERRIDES = {
    1: { stack_logo_right: { logoOffsetX: -40 } },  // Ted nudges further left
    2: { centered: { logoScale: 1.8 } },            // Andrew prefers a smaller logo
  };
  ```

Call `resolveFrontLayoutDefaults(layout, personId)` / `resolveBackLayoutDefaults(...)` to
read the merged defaults from code; `applyFront/BackLayoutDefaults` already call these
internally when you pass `personId`.

## Adding a new color swatch

Add an entry to `COLORS` in `src/lib/palette.ts`. The `id` must be a valid `ColorId` — add it to the union in `src/lib/types.ts` too, and to `VALID_COLOR_IDS` at the top of `palette.ts`.

## Adding a new QR link to defaults

Edit `DEFAULT_QR_LINKS` in `src/lib/defaults.ts`.

## Changing default card designs per person

Edit `defaultFrontForPerson()` and `defaultBackForPerson()` in `src/lib/defaults.ts`.

## Adding a new control slider

Use `<FDRange>` from `controls/Primitives.tsx`. It includes a slider AND an editable number input — do not build a custom one. Pass `readOnlyNumber` if the field should not be editable by hand.

## Adding a new control section

Wrap in `<Section id="unique-id" title="...">` from `controls/Section.tsx`. The section persists its open/closed state in `localStorage` keyed by `id` — keep ids stable.

## Changing the export format / dimensions

Edit `src/lib/print.ts` (SVG viewBox units) and `src/lib/export.ts` (raster/PDF output). Both `EXPORT_SPEC` (used in the UI) and the actual export functions are in `export.ts`.

---

## Responsive layout

`Editor.tsx` uses a 3-column layout:

| Screen | People rail | Card preview | Design rail |
|--------|-------------|--------------|-------------|
| `< lg` (mobile) | fixed drawer, opened by hamburger | stacked above controls | full-width below card |
| `≥ lg` (desktop) | static left column, 260px | flex-1 center | static right column, 340px |

Body container: `flex flex-col lg:flex-row`. Card section: `shrink-0 lg:flex-1`. Design rail: `flex-1 lg:flex-none lg:w-[340px]`.

---

## Tailwind conventions

- Brand cream / burgundy: `#F6F4E8`, `#6B1E2D` — see `globals.css` `--lv-*` tokens
- Dark UI: `#1f1c1a` (page), `#2c2826` (rails / header)
- No magic numbers outside the design system — prefer Tailwind arbitrary values over inline styles

## Lint rules to know

- `react-hooks/set-state-in-effect` — calling `setState` synchronously in a `useEffect` body requires `// eslint-disable-next-line react-hooks/set-state-in-effect` on the exact line
- Zero warnings policy — `--max-warnings 0`; never leave unused disable directives

---

## Import paths

Always use `@/` alias for cross-module imports:
- `@/lib/types` — types
- `@/lib/constants` — any constant or helper (barrel, always works)
- `@/lib/print`, `@/lib/palette`, `@/lib/layouts`, `@/lib/typography`, `@/lib/defaults` — prefer direct imports for new code
- `@/components/controls` — barrel for all control components
- `@/components/card` — barrel for CardFront / CardBack

---

## Things NOT to change without discussion

- `STORAGE_KEY` — changing it invalidates all user-saved data in the browser
- The `VB_W` / `VB_H` viewBox (920×1400 for 5.5″×8.5″ finished + bleed) — card print math depends on it
- `DEFAULT_PEOPLE` ids (1, 2, 3) — per-person tuning in `defaults.ts` and `typography.ts` is id-keyed
