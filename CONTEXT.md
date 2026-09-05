# CONTEXT.md

Orientation for anyone (human or agent) picking this repo up cold. Read this
first, then the deep docs it points at.

---

## What this is

A browser-based polyphonic synthesizer. An on-screen piano keyboard, four input
sources, a Web Audio synthesis graph, a real-time frequency spectrum, presets,
and 14 themes. React 19 + TypeScript + Zustand. No backend, no database, no
tests worth speaking of — it is a static single-page app.

**The name is inconsistent, on purpose-ish.** Three names refer to the same
thing, and you will meet all of them:

| Where                                                       | Name           |
| ----------------------------------------------------------- | -------------- |
| Directory on disk                                           | `dough-synths` |
| `package.json`, `localStorage` keys, logo asset, deploy URL | `SynthPutty`   |
| `ARCHITECTURE.md` heading                                   | "Dough Synths" |

Deployed to GitHub Pages at `https://evanczako.github.io/SynthPutty` via
`npm run deploy` (gh-pages, `predeploy` builds first). Don't "fix" the naming
without checking the deploy URL and the `synthputty.*` storage keys — renaming
the keys silently discards every user's saved theme.

## Family context

One of four sibling portfolio apps under `Portfolio apps/`: `DoughLoops2`,
`chord-finder-2`, `Portfolio`, and this one. They deliberately share a visual
language — the same 14 seed palettes live in each app's
`styles/variables.module.css`, and `STYLE_GUIDE.md` was written for the family,
not for this app alone. A palette change here is usually a change you owe the
siblings. They also share the `evanczako.github.io` origin, which is why the
storage keys are namespaced (`synthputty.theme`).

The header's "Back to Bakery" link points at `https://evanczako.com`.

## The three docs, and which to read

- **`CONTEXT.md`** (this file) — orientation, commands, current state, traps.
- **`ARCHITECTURE.md`** — how the app works: store shapes, the audio graph, the
  hook-by-hook breakdown, the responsive octave system. Written partly as React
  interview study notes, so it explains _why_ a hook is used, not only what it
  does. **Note: this file is gitignored** (`/ARCHITECTURE.md`) — it exists only
  in the working copy, so a fresh clone will not have it.
- **`STYLE_GUIDE.md`** — the house rules, most with a **Why** drawn from a bug
  that actually shipped. Its opening table flags where the guide (written for a
  Vite + Tone.js + Express stack) diverges from this repo. Section 8 (server)
  does not apply.
- `README.md` is stock Create React App boilerplate. It says nothing about this
  project; ignore it.

## Commands

```
npm start          # dev server on :3000
npm run check      # THE GATE: typecheck + lint + build. Green before "done".
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src --ext .ts,.tsx  (also :fix)
npm run prettier:check  # 4 spaces, single quotes, 100 cols  (also :fix)
npm run deploy     # builds, pushes build/ to gh-pages
```

`npm test` exists because CRA ships it; there are no meaningful tests. Do not
report a change as verified on the strength of a green build — a build says
nothing about layout or about whether a note actually sounds. Check it in a
browser, in **both orientations**.

## Layout of the code

```
src/
  audio/engine.ts        Owns the AudioContext and the shared node graph.
  components/            Keyboard, SynthControls, MainControls, EQVisualizer,
                         ThemeSwitcher, ErrorBoundary
  hooks/                 useAudioGate, useSynthEngine, useMidi, useDisableZoom
  store/synthStore.ts    All synth params + activeNotes + presetIndex
  store/fontStore.ts     Type scale + the octave ladder
  styles/variables.module.css   Every design token. The only place a colour is written.
  presets.ts             PRESETS[0].params IS the store's initial state
  theme.ts               Theme list, persistence, DOM application
  App.tsx                One grid; CSS alone decides portrait vs landscape
```

Two files carry most of the weight: `Keyboard.tsx` (~394 lines — four input
sources, roving tabindex, half-octave geometry) and `useSynthEngine.ts` (~328
lines — the note-diffing engine). Everything else is small.

## Invariants — break these and something regresses

These are load-bearing. Each one is a bug that already happened once.

- **Notes are real MIDI numbers everywhere.** Middle C = 60. They were once
  indices into a note-name table, an octave off, so hardware MIDI and the
  on-screen keys disagreed.
- **The AudioContext is created on the first user gesture**, by `useAudioGate`
  calling `ensureAudio()`, and nowhere else. A context built at import time
  starts suspended and never plays. `getAudio()` returns null for observers
  (the spectrum display) precisely so they cannot force one into existence.
- **Master volume lives on `masterGain` only.** Baking it into each voice gain
  made the volume slider tear down and restart every sounding note.
- **Only a `voices` change rebuilds a sounding note.** Every other parameter is
  ramped on nodes that already exist.
- **No component branches on orientation.** `@media (orientation: …)` in
  `App.module.css` is the single mechanism. The store used to also track it and
  was a frame behind on rotation.
- **`OCTAVE_LADDER` must stay monotonic.** Widening the window may never remove
  keys. An older ladder gave 4.5 octaves at 1200px and 4 at 1400px.
- **Every preset sets every parameter.** A partial preset inherits whatever the
  last one set, so the same preset sounds different depending on what preceded it.
- **`:root` is never declared inside a CSS Module**, and no component CSS holds
  a hex or `rgba()`. Both rules exist because the codebase once had two
  competing palettes.
- **`localStorage` access is always wrapped in try/catch** — private browsing
  throws on read, not just on write — and the read is a trust boundary: an
  unrecognised stored value is discarded, never written to the DOM.

## Conventions in one paragraph

Prettier at 4 spaces, single quotes, semicolons, 100 columns. Zustand accessed
with per-field selectors (`useStore((s) => s.x)`) — never destructure the whole
store. Comments explain the _why_ or the constraint, never the _what_; the
existing comments are unusually dense and deliberately so, and several name the
specific bug they prevent. Keep that register when editing — a change that
strips a "why" comment loses the only record of the bug.

## Current working state (as of 2026-09-05)

Branch `main`, five files modified and uncommitted. The change in flight is the
**removal of the corner-shape ("Soft / Sharp / Round") feature** from the theme
switcher: `SHAPES`, `ShapeId`, `applyShape`, `readStoredShape`, the
`synthputty.shape` key, the panel's shape row and its CSS, and the switcher's
text label (the swatches alone now identify the theme). If you arrive mid-task,
that is what these diffs are — not stray edits. Check `git diff` and finish or
revert it deliberately.

## Traps

- **`ARCHITECTURE.md` is gitignored.** It is the best doc in the repo and it is
  not in the repository. Don't assume a collaborator has read it, and don't be
  surprised when a fresh clone lacks it.
- **A media query adds no specificity.** Responsive override blocks go _last_
  in the stylesheet. Same trap for `[data-theme]` selectors on one element.
- **Screenshots taken straight after a state change can catch a mid-repaint
  frame**, and `ResizeObserver` / `rAF` are suspended in a throttled or occluded
  tab. Confirm against computed styles rather than believing the picture.
- `MAX_HELD_NOTES` is 10 because ten notes at eight voices is already eighty
  running oscillators.
- Web MIDI is feature-detected (`isMidiSupported()`), never user-agent sniffed.
