# Folk Devils Business Card Generator

A web-based business card designer for Folk Devils. Design, preview, and export print-ready cards for each team member — front and back, fully customizable, straight to MOO-compatible PDF.

## Features

- **Per-person cards** — each person gets independently configurable front and back faces
- **Live preview** — SVG-rendered card with flip animation between front/back
- **7 front layouts, 5 back layouts** — stack, centered, bold name, split columns, QR-led, type-led, minimal
- **Full design control** — color palettes, custom hex colors, logo position/scale, font scale per text role, text positioning, flower pattern overlays, QR code style
- **Editable number fields** — every slider has a type-in number field alongside it
- **Export** — SVG, 300-DPI PNG, and MOO-compatible full-bleed PDF (front + back)
- **Auto-save** — all settings persist to `localStorage` across sessions
- **Responsive** — works on mobile (stacked layout) and desktop (3-column)

## Dev

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npx tsc --noEmit   # type-check
npx eslint src --ext .ts,.tsx --max-warnings 0  # lint
```

## Print spec

| | |
|---|---|
| Finished size | 3.5″ × 2.0″ |
| Bleed | 0.125″ all sides |
| Full-bleed doc | 3.75″ × 2.25″ |
| PNG export | 1125 × 675 px @ 300 DPI |
| SVG viewBox | 600 × 360 units (160 units/inch) |

## Codebase map

```
src/
├── app/               Next.js App Router entry points
├── components/
│   ├── Editor.tsx     Main shell — layout + wiring only
│   ├── card/          SVG card face components (CardFront, CardBack, shared helpers)
│   └── controls/      All editor UI (panels, sliders, pickers, sections)
├── hooks/
│   ├── useEditorState.ts  All app state + localStorage persistence
│   └── useExport.ts       Export state, SVG refs, handleExport
└── lib/
    ├── types.ts       All TypeScript types
    ├── print.ts       SVG/print dimension constants
    ├── palette.ts     Color swatches, logos, flowers
    ├── layouts.ts     Layout options, QR style options
    ├── typography.ts  Font scale helpers
    ├── defaults.ts    Factory defaults + migration
    ├── storage.ts     localStorage key
    ├── color.ts       Color resolution helpers
    ├── export.ts      SVG/PNG/PDF export functions
    ├── qr.ts          QR path builder
    └── constants.ts   Re-export barrel (all lib/* in one import)
```

For detailed agent/AI guidance on how to modify this codebase, see [AGENTS.md](./AGENTS.md).
