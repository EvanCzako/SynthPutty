# Dough Synths — Architecture Guide
> A React interview study reference for this codebase

---

## Project Overview

**Dough Synths** is a browser-based polyphonic synthesizer. It renders an interactive piano keyboard, synthesizes audio with the Web Audio API, accepts MIDI input, and visualizes the frequency spectrum in real time. The stack is React + TypeScript + Zustand, with no backend.

```
src/
  components/
    Keyboard.tsx       # Piano keyboard — mouse, touch, and computer keyboard input
    SynthControls.tsx  # Sliders and preset buttons for synth parameters
    MainControls.tsx   # Logo + MIDI enable button
    EQVisualizer.tsx   # Canvas-based real-time frequency spectrum
  hooks/
    useSynthEngine.ts  # Core audio synthesis (Web Audio API)
    useMidi.ts         # MIDI device input
    useCompressor.ts   # Dynamics compressor node setup
    useDisableZoom.ts  # Prevents pinch-zoom on mobile
  store/
    synthStore.ts      # All synth parameters + active notes
    fontStore.ts       # Responsive layout: font size, octave array, viewport
  App.tsx              # Root layout, resize listener
```

---

## State Management: Zustand

### Why Zustand here?

The synth state is global by nature — the keyboard triggers notes, the MIDI hook triggers notes, and the audio engine consumes them. Prop-drilling or Context would require threading state through unrelated components. Zustand gives a flat, directly-imported store with no provider boilerplate.

### `synthStore`

Holds all audio parameters and the active notes map:

```typescript
{
  // Audio parameters
  waveform: "sine" | "square" | "triangle" | "sawtooth"
  filterType: "lowpass" | "bandpass" | "highpass"
  filterCutoff: number       // Hz
  filterQ: number            // resonance
  filterEnabled: boolean
  detune: number             // cents spread per voice
  voices: number             // 1–8 polyphony
  vibratoRate: number
  vibratoDepth: number
  attack: number             // seconds
  release: number            // seconds
  masterVolume: number       // 0–1

  // Active notes: MIDI note number → { velocity }
  activeNotes: Record<number, { velocity: number }>

  // Shared audio nodes stored in the store so hooks can read them
  analyserNode: AnalyserNode | null
  vibratoOsc: OscillatorNode | null
  vibratoGain: GainNode | null

  midiEnabled: boolean
}
```

**Interview note:** Storing Web Audio nodes in Zustand is unconventional — normally you'd keep mutable objects in a `useRef`. Here it works because the nodes are set once during initialization and never replaced, so serialization/mutability concerns don't apply in practice.

### `fontStore`

Handles responsive layout math:

```typescript
{
  fontSize: number           // px, drives CSS --font-size custom property
  vw: number                 // viewport-relative unit
  octaves: number[]          // e.g. [3.5, 4, 5] — which octaves to render
  layout: "portrait" | "landscape"
  updateFontSize(): void     // recalculates everything on resize
}
```

The `octaves` array uses a decimal convention: integer = full octave (C–B), decimal `.5` = half-octave (F–B). This allows the keyboard to scale down gracefully on narrow viewports without breaking black key alignment.

---

## `useRef` — Three Distinct Use Cases

### 1. Mutable audio state that must not trigger re-renders (`useSynthEngine`)

```typescript
const playingNotesRef = useRef<Record<number, VoiceChain[]>>({});
const prevActiveNotesRef = useRef<Record<number, { velocity: number }>>({});
```

`playingNotesRef` stores the live oscillator/gain node graph for every active note. If this were `useState`, every note-on/note-off would re-render the component. The audio engine only needs to read and write this imperatively — React rendering is irrelevant.

`prevActiveNotesRef` lets the engine diff the previous `activeNotes` against the current one to find newly pressed or released notes without React needing to know about the diff.

### 2. DOM node reference (`EQVisualizer`)

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
// in useEffect:
const ctx = canvasRef.current?.getContext("2d");
```

Classic use: grab the canvas element after mount to call the Canvas 2D API imperatively.

### 3. Touch tracking map (`Keyboard`)

```typescript
const touchNoteMap = useRef<Map<number, number>>(new Map());
```

Maps `touch.identifier → MIDI note number` so multi-touch works correctly. When a finger moves or lifts, the engine knows which note it was playing. Again, this never needs to trigger a re-render — it's bookkeeping, not view state.

---

## `useEffect` — Patterns and Dependencies

### Effect as subscription (mount/unmount)

`useMidi` requests MIDI access once and tears it down on unmount:

```typescript
useEffect(() => {
  if (!midiEnabled) return;
  let inputs: MIDIInput[] = [];

  navigator.requestMIDIAccess().then((access) => {
    inputs = [...access.inputs.values()];
    inputs.forEach((input) => input.addEventListener("midimessage", handleMessage));
  });

  return () => {
    inputs.forEach((input) => input.removeEventListener("midimessage", handleMessage));
  };
}, [midiEnabled]);
```

The cleanup function is the critical pattern: remove the listener when the dependency changes or the component unmounts. Without it, you'd stack up duplicate listeners every time MIDI is toggled.

### Effect as audio parameter sync

`useSynthEngine` has multiple focused effects, each watching a specific slice of state:

```typescript
// Re-wire the audio graph when waveform, voice count, or volume changes
useEffect(() => {
  rebuildAllVoices();
}, [waveform, voices, masterVolume]);

// Update filter without rebuilding voices
useEffect(() => {
  updateFilter();
}, [filterEnabled, filterType, filterCutoff, filterQ]);

// Adjust vibrato oscillator
useEffect(() => {
  vibratoOsc?.frequency.setValueAtTime(vibratoRate, audioCtx.currentTime);
  vibratoGain?.gain.setValueAtTime(vibratoDepth, audioCtx.currentTime);
}, [vibratoRate, vibratoDepth]);
```

**Interview point:** splitting effects by concern (rather than one giant effect) means a filter cutoff change doesn't trigger a full voice rebuild. Each effect has the minimum dependency footprint for its job.

### Effect as event listener lifecycle

`App.tsx` and `useDisableZoom` attach/detach window listeners:

```typescript
useEffect(() => {
  window.addEventListener("resize", updateFontSize);
  return () => window.removeEventListener("resize", updateFontSize);
}, []);
```

Empty dependency array = run once on mount, clean up on unmount. The returned function is the cleanup — this is the pattern React calls when the component unmounts or before the effect re-runs.

### Effect as animation loop

`EQVisualizer` starts a `requestAnimationFrame` loop:

```typescript
useEffect(() => {
  let animId: number;
  const loop = () => {
    draw();
    animId = requestAnimationFrame(loop);
  };
  animId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(animId);
}, [draw]);
```

The cleanup cancels the pending frame. `draw` is wrapped in `useCallback` (see below) so the loop only restarts when the canvas or analyser node actually changes.

---

## `useCallback` — Stabilizing Function Identity

`EQVisualizer` wraps the draw function:

```typescript
const draw = useCallback(() => {
  const canvas = canvasRef.current;
  const analyser = analyserNode;
  if (!canvas || !analyser) return;
  // ... canvas drawing logic
}, [analyserNode]);
```

Without `useCallback`, `draw` would be a new function reference on every render, which would cause the animation `useEffect` to restart its loop on every render — cancelling and recreating the `requestAnimationFrame` chain unnecessarily.

**Interview note:** `useCallback` is most valuable when a function is in a `useEffect` dependency array, or when passed as a prop to a memoized child. Here it directly prevents the animation loop from restarting on unrelated re-renders.

---

## Custom Hooks: Separation of Concerns

### `useSynthEngine()`

The heaviest hook. Does everything audio:
- Creates oscillators per note per voice
- Applies attack/release envelopes with `linearRampToValueAtTime`
- Wires vibrato (a global sine oscillator modulating every voice's detune parameter)
- Manages the full node chain: `Oscillator → Filter → GainEnvelope → MasterGain → Compressor → Analyser → destination`

It reads from `synthStore` and writes `analyserNode`, `vibratoOsc`, `vibratoGain` back into the store so other parts of the app (EQVisualizer) can access them.

### `useMidi()`

Reads `midiEnabled` from the store. When true, calls `navigator.requestMIDIAccess()` and maps incoming messages to `noteOn`/`noteOff` store actions. Normalizes MIDI velocity (0–127) to the synth's 0–100 scale.

### `useCompressor()`

Single-purpose: creates and wires a `DynamicsCompressorNode` into the audio graph once on mount.

### `useDisableZoom()`

Attaches a `touchmove` listener with `{ passive: false }` to call `preventDefault()` on multi-touch events. Prevents the mobile browser from intercepting pinch gestures on the keyboard.

---

## Keyboard Component: Four Input Sources

`Keyboard.tsx` handles four simultaneous input methods, all converging to the same `noteOn`/`noteOff` store actions:

| Source | Handler | Notes |
|--------|---------|-------|
| Mouse | `onMouseDown/Enter/Leave/Up` | Single note at a time, supports slide between keys |
| Touch | `onTouchStart/Move/End` | Multi-touch via `touchNoteMap` ref |
| Computer keyboard | `keydown/keyup` on `window` | QWERTY keys mapped to notes |
| MIDI | `useMidi` hook | Handled entirely outside this component |

**Force-update pattern:** The keyboard reads `activeNotes` from the store to apply an "active" CSS class to pressed keys. Because the component needs to re-render when `activeNotes` changes but the store subscription doesn't automatically trigger this for all cases, there's an explicit `forceUpdate`:

```typescript
const [, forceUpdate] = React.useState({});
// called when noteOn/noteOff fires
forceUpdate({});
```

This is a pragmatic (if slightly hacky) way to force a re-render without introducing state that has meaning beyond "re-render now."

---

## Audio Graph Architecture

```
                     [vibrato sine osc]
                            │ detune modulation
                            ↓
[noteOn] → Oscillator(s) → [BiquadFilter?] → GainNode (envelope)
                                                      │
                                               MasterGain
                                                      │
                                           DynamicsCompressor
                                                      │
                                              AnalyserNode
                                                      │
                                           AudioDestination
```

**Polyphony:** Each note gets `voices` oscillators, detuned symmetrically:
```
spread = (i - (voices - 1) / 2) * detune
```
For 3 voices at 20 cents detune: -20, 0, +20 cents. Fattens the sound without changing perceived pitch.

**Velocity to gain:** MIDI velocity (or mouse press, normalized to 0–100) maps to oscillator gain, divided by voice count to prevent clipping:
```
gain = (velocity / 127) * (masterVolume / voices)
```

---

## Responsive Layout

`fontStore.updateFontSize()` runs on mount and every resize. It:
1. Calculates a base font size from `window.innerWidth`
2. Sets CSS custom properties (`--vw`, `--vh`, `--font-size`)
3. Determines how many octaves fit and builds the `octaves` array

The octave array drives what the keyboard renders. Examples:
- Narrow viewport: `[4]` — one full octave
- Medium: `[3.5, 4]` — half-octave + full octave
- Wide: `[3, 4, 5]` — three full octaves

Integer indices → full octaves (C–B, 7 white keys).
Decimal `.5` indices → half-octaves (F–B, 4 white keys).

Black key alignment between mixed octave types uses invisible spacer keys — every white key slot either renders a real black key or an invisible placeholder, maintaining grid consistency.

---

## Key Interview Talking Points

- **Zustand over Context:** No provider, no selector boilerplate, direct import. Good for global mutable state that many unrelated components need (note on/off from keyboard, MIDI, and audio engine all touch the same store).
- **useRef for audio nodes:** Audio nodes are mutable objects the engine manages imperatively. Storing them in refs (not state) means note on/off doesn't cause React re-renders.
- **Multiple focused useEffects:** Rather than one monolithic effect, each audio parameter has its own effect with minimal dependencies. This prevents over-triggering expensive audio graph rebuilds.
- **useCallback for stable animation:** The `requestAnimationFrame` loop depends on `draw` — wrapping it in `useCallback` prevents the loop from restarting on every render.
- **Custom hooks for separation of concerns:** Audio engine, MIDI, compressor, and zoom-disable are all separate hooks. `App.tsx` and the components stay clean.
- **Cleanup functions in useEffect:** MIDI listeners, resize handlers, animation frames, and touch handlers all return cleanup functions. Without them, the app would leak listeners on every re-render or unmount.
