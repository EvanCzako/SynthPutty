# Style Guide

Conventions for small interactive front-end projects — Vite + React + TypeScript
with a zustand store, CSS Modules, and optionally a small Express/SQLite API.
Written for the DoughLoops family of portfolio apps; portable to any of them.

> **This repo is Create React App, not Vite, and there is no server.** The
> rules in sections 1-7 and 9-10 apply as written; the differences are:
>
> | Style guide             | Here (SynthPutty)                                      |
> | ----------------------- | ------------------------------------------------------ |
> | Vite                    | `react-scripts` (CRA 5) -- `npm run check` is the gate |
> | `src/theme.ts` scaffold | permanent: the theme switcher ships                    |
> | Tone.js transport       | raw Web Audio, owned by `src/audio/engine.ts`          |
>
> Section 8 (server) does not apply -- this app is static.

Most rules below carry a **Why** drawn from a bug that actually shipped. Rules
without one are just house style. When a rule and a deadline conflict, break the
rule and leave a comment saying so.

---

## 1. Design tokens

**One file owns every custom property.** `src/styles/variables.module.css`.
Three layers, in order:

1. **Seeds** — ~20 raw colours. The only thing a theme overrides.
2. **Derived** — every semantic and component token, computed from seeds with
   `color-mix()`. Written once, never per theme.
3. **Structure** — sizes, radii, motion, elevation. Theme-independent.

```css
:root {
    --seed-surface: #24283b;
    --seed-accent: #bb9af7;
}
:root {
    --ui-surface: var(--seed-surface);
    --ui-accent-2: color-mix(in srgb, var(--seed-accent) 78%, var(--seed-surface));
    --ui-hover: color-mix(in srgb, var(--seed-accent) 34%, var(--seed-surface));
}
[data-theme='forest'] {
    --seed-surface: #19281e;
    --seed-accent: #7fc98a;
}
```

- **Never declare `:root` inside a CSS Module.** It is global regardless of
  where it sits, so the declaration leaks app-wide from an unpredictable place
  and load order picks the winner.
  **Why:** a codebase ended up with two complete competing palettes — a tidy one
  in the tokens file that nothing used, and ad-hoc `:root` blocks in six
  component modules that everything used.
- **No hardcoded colour in component CSS.** If you write a hex or `rgba()`
  outside the token file, it will not follow the theme. Neutral white/black
  overlays for _lighting_ (`rgba(255,255,255,.1)` as a bevel) are the one
  exception, and even those are suspect.
- **Derive hover/active states**, don't hand-pick them:
  `--x-hover: color-mix(in srgb, var(--x) 78%, white)`.
- **Make a token contrast-adaptive by mixing toward the text colour.**
  `color-mix(in srgb, var(--seed-accent) 72%, var(--seed-text))` darkens on light
  themes and lightens on dark ones, with no per-theme value.
- **Grep for orphans** before shipping: tokens defined but never referenced, and
  `var(--x)` references with no definition. Both accumulate silently.
  **Why:** a `--color-off-red-1` referenced by two forms was defined nowhere, so
  every login error rendered in the ordinary body colour.

## 2. CSS Modules & the cascade

- **A media query adds no specificity.** Rules inside `@media` beat their
  unconditional counterparts on _source order only_. Put responsive override
  blocks **last in the file** and say so in a comment.
  **Why:** a base rule appended after a portrait block silently overrode it, so
  a grid ruler laid out along the wrong axis — and placing items outside the
  explicit grid spawned four stray implicit tracks.
- **Same trap for attribute selectors.** `[data-theme]` and `[data-shape]` on
  the same element have equal specificity; order decides. Keep the narrower
  concern later.
- **One rule per selector per file.** Two `.foo {}` blocks in one stylesheet is
  a merge conflict waiting to happen; merge them.
- **Prefer one element with a swapped axis over two parallel implementations.**
  Emit position as custom properties and let CSS transpose:

    ```css
    .cell {
        grid-column: var(--col);
        grid-row: var(--row);
    }
    @media (orientation: portrait) {
        .cell {
            grid-column: var(--row);
            grid-row: var(--col);
        }
    }
    ```

    **Why:** a component that early-returned two full JSX trees needed ~20 pairs
    of `*Portrait` / `*Landscape` twin classes; every change had to be made twice,
    and the commit log was a run of `Again`, `Again`, `Again`.

- **Branch layout in CSS, not JS.** If `@media (orientation: …)` can decide it,
  the store should not also track it. Two mechanisms for one decision drift.

## 3. Layout & sizing

- **Measure the container, not the viewport.** A component's panel is rarely the
  window. Use `ResizeObserver` on the element that actually bounds the content.
- **Use `contentRect` / the content box.** `getBoundingClientRect()` includes
  padding and border.
  **Why:** counting a 6px padding ring as usable space clipped 28px off a grid.
- **Avoid observer feedback loops by construction.** Resolve one axis from a
  measurement that cannot depend on the result, then derive the other. Never
  observe a box whose size depends on the value you are computing.
- **Reserve the scrollbar unconditionally** when overflow is possible on the
  cross axis: `probe.offsetHeight - probe.clientHeight`, measured once and
  cached. Overlay scrollbars measure 0 and cost nothing.
  **Why:** a 7px classic scrollbar clipped the last row, and making the reserve
  conditional creates the loop in the previous bullet.
- **`Math.floor` computed track sizes.** Rounding up half a pixel per track is
  enough to overflow the container and pin a scrollbar open.
- **Bound aspect ratios on anything grid-like.** Cells that fill both axes
  independently degenerate into slivers. Clamp the ratio, then let the container
  scroll rather than compress further.
  **Why:** a 64-step sequencer grid produced cells 4x taller than wide — legible
  as a bar chart, not as a button.
- **A `minmax()` floor is a _minimum usable_ size, not the ideal size.** Using
  the ideal as the floor makes content overflow by a few pixels and shows a
  scrollbar permanently.
- **Align two tracks by giving them the same template and the same origin.**
  Centring them independently misaligns them whenever their containers differ —
  e.g. a scroll area is narrower than its parent by the scrollbar width.

## 4. React & state

- **Per-field selectors, always:** `useStore((s) => s.x)`. Never destructure the
  whole store; it re-renders on every unrelated change.
- **Derived state belongs in the setter, not an effect.** If B must always equal
  `f(A)`, compute it inside `setA` so the invariant holds atomically.
  **Why:** a grid-resize effect lived in a component that remounted on every
  orientation change, so rotating the device silently re-ran a data migration.
- **One source of truth per transition.** If a store action already decodes and
  applies a payload, no component should decode the same payload again.
- **Satisfy `react-hooks/exhaustive-deps` or explain the omission.** A missing
  dep that "works" usually works by accident.
  **Why:** an effect that cleared selection when logged out only behaved because
  its dep array omitted the very value it cleared. Adding the honest dep broke
  the feature.
- **Read hot-path values from the DOM/refs, not state**, when the event can
  outrun a render. Held arrow keys repeat faster than React re-renders, so
  keyboard navigation must read its origin from `event.target`, not `useState`.
- **Refs for the real value, state for the rendered one.** A playhead position
  lives in a ref; the store copy exists only to drive the highlight.
- **Wrap the app in an error boundary**, and give it a button that clears
  persisted state and reloads. Corrupt `localStorage` otherwise re-crashes on
  every reload with no way out.

## 5. Persistence & serialization

- **One serialization format, one parser.** If a string is written to a DB, hard
  coded in fixtures, _and_ cached in `localStorage`, all four readers must go
  through the same function.
- **The parser is a trust boundary — normalise, don't assume.** Validate ranges,
  pad or truncate to the expected shape, fall back per-field, and return `null`
  only when the input is unsalvageable.
- **Version any format you persist**, or accept that you can never change it.
- **Wrap every `localStorage` access in `try`/`catch`.** Private browsing and
  blocked storage throw on access, not just on write.
- **Debounce writes and subscribe from the store**, not from a component — a
  slider drag fires on every pointer move.

## 6. Audio & timing (where relevant)

- **Schedule sound on the audio clock, paint on the draw clock.** Calling
  `setState` inside an audio callback repaints at _schedule_ time, which is a
  lookahead ahead of the sound. In Tone.js: `getDraw().schedule(fn, time)`.
- **Express intervals in ticks, not seconds**, so a tempo change is a parameter
  ramp rather than a teardown and restart.
- **Resume the audio context inside the user gesture**, in the click handler —
  not in an effect that happens to run soon after.
- **Guard every lookup inside an audio callback.** A throw there kills the
  transport silently, with no error surfaced to the UI.
- **Surface asset-loading failure.** `Promise.all(...).then()` with no `.catch()`
  leaves a control enabled forever and does nothing when pressed.

## 7. Accessibility baseline

Non-negotiable, and cheap if done as you go:

- A visible `:focus-visible` style on every interactive element. Set a global
  default, override per component.
- Real `<button>` for anything clickable. A `<div onClick>` is not focusable and
  not keyboard-operable.
- An accessible name on every control — `aria-label` where the visual is an icon
  or an emoji.
- Valid nesting: `<ul>` takes only `<li>`.
- **Roving tabindex** for large grids. Hundreds of tabbable cells between the
  grid and the rest of the page is worse than none.
- Honour `prefers-reduced-motion` globally.
- Prefer a native control that announces its own state (a checkbox) over
  imitating it (`aria-pressed` on a button).
- Don't animate `font-size` on hover — it reflows the whole list. Animate colour.

## 8. Server (small API)

- **Never trust a caller-supplied user id.** Issue a session token on login,
  resolve it to a user server-side, and put ownership in the `WHERE` clause so
  another user's row is indistinguishable from a missing one.
  **Why:** an API that accepted `?userId=` let any integer read, overwrite and
  delete any account's data. The `403` check compared the row's owner against
  the attacker-supplied id, so it always passed.
- **One connection for the process**, created lazily and reused. Opening one per
  request leaks a file descriptor per request.
- **Validate and bound at the edge:** body size limit, string lengths, integer
  parsing, a password floor, rate limiting on auth routes.
- **Compare a dummy hash when the user doesn't exist**, so a missing account and
  a wrong password take the same time.
- **Add `/health`**, and allow any `localhost:<port>` origin in development — a
  hardcoded dev port silently breaks the moment the dev server picks another.

## 9. Formatting & comments

Prettier: 4 spaces, single quotes, semicolons, 100 columns, `trailingComma: es5`.
Components are default-exported function declarations.

- **Comment the _why_, never the _what_.** If a line needs explaining, explain
  the constraint or the bug that forced it. Delete comments that restate code.
- **Comment every non-obvious constant**, especially one that must match a value
  elsewhere. Name both sides in the comment.
- **Mark temporary scaffolding loudly**, with the removal steps listed in the
  file itself — every file, every mount point, every stylesheet block. Design it
  so the default path writes nothing to the DOM, then removal leaves no trace.

## 10. Verification

- **One gate:** `npm run check` = typecheck + lint + build. Green before you
  claim done.
- **Keep the typecheck genuinely clean.** A tolerated "known" error trains you
  to ignore output. Add the missing declaration file instead.
  **Why:** `tsc --noEmit` reported a `*.png` module error but exited 0, so the
  exit code and the output disagreed for months.
- **Verify UI in a browser, not just in a build.** A green build says nothing
  about layout.
- Two traps when driving a browser programmatically:
    - **Screenshots taken right after a state change can capture a mid-repaint
      frame.** Confirm colours and geometry against computed styles before
      believing a screenshot.
    - **`ResizeObserver` and `requestAnimationFrame` are suspended in a throttled
      or occluded tab.** A resize-then-read test will see stale values unless
      something forces a paint.
- **Prefer measuring to eyeballing.** Assert on computed track templates, box
  offsets and overflow deltas — `laneOffsets: [0,0,0]` is a better result than
  "looks aligned".
- **Check both orientations and the extremes** of any variable-size UI (smallest
  and largest data set, narrowest and widest container).
