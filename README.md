# Chord Wheel

A radial chord player controlled by hand tracking or touch — hover a slice to play that chord, move off or close your hand to stop. Runs entirely client-side in the browser; no build step, no backend.

**Live demo:** https://jarlohalili.github.io

---

## Project structure

```
chord-wheel.html   the entire app: markup, styles, and logic
songs.js            song/chord/lyrics data — edit this to add songs, no HTML/JS changes needed
```

Both files must stay in the same directory — `chord-wheel.html` loads `songs.js` via a `<script src>` tag.

---

## How it works

### 1. Input layer

Two independent input sources feed the same downstream pipeline. Only one is active per session.

**Hand tracking**
- `getUserMedia` video stream → MediaPipe `Hands` (WASM, runs client-side, no network round-trip per frame).
- Config: `maxNumHands: 1`, `modelComplexity: 1`, `minDetectionConfidence: 0.7`, `minTrackingConfidence: 0.6`.
- Per frame (`onResults` callback): `results.multiHandLandmarks[0]` — 21 landmarks, each `{x, y, z}` normalized to `[0,1]` relative to frame width/height. `z` is relative depth (more negative = closer to camera).
- Also returns `results.multiHandedness[0]` = `{label: 'Left'|'Right', score: 0..1}`. Since video is displayed mirrored (`scaleX(-1)`) but the raw frame fed to the model isn't pre-flipped, the displayed label is inverted from the raw one: `displayLabel = rawLabel === 'Left' ? 'Right' : 'Left'`.
- Key landmark indices: `0` = wrist, `5/9/13/17` = index/middle/ring/pinky MCP, `8` = index fingertip, `4/8/12/16/20` = fingertip of each digit.

Fist detection (`isFist(lm)`) — per non-thumb finger, compare fingertip-to-wrist vs. PIP-to-wrist distance:
```js
curled = dist(tip, wrist) < dist(pip, wrist) * 0.92
```
≥3 of 4 fingers curled = closed hand (mute).

**Touch / pointer**
- Pointer Events API (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`), not raw touch events — works with mouse/trackpad too if Touch mode is picked on desktop.
- `overlay.setPointerCapture(e.pointerId)` on `pointerdown` so drag tracking survives leaving the canvas bounds.
- No camera permission requested in this mode — `getUserMedia` is never called.

Both paths converge to a single `(x, y)` point in canvas-pixel space per frame.

### 2. Hit testing

The wheel's center/radius are computed once (`placeWheel()`) and stay fixed — the wheel does not track the input. (An earlier hand-anchored version had reachability problems: half the wheel would sit behind the wrist.)

```js
placeWheel():
  radius = min(usableWidth, canvasHeight) * 0.42 * sizeSliderScale
  center.x = clamp(idealX, minX, maxX)   // biased right of center, clamped on-screen
  center.y = canvasHeight / 2
```

Given a point `(px, py)`:
```js
dx = px - center.x
dy = py - center.y
dist = hypot(dx, dy)

if (dist < radius * 0.16) return -1   // inner deadzone, no slice
if (dist > radius * 1.05) return -1   // off the wheel

angle = atan2(dy, dx) + PI/2 + sliceAngle/2   // slice 0 centered at 12 o'clock
angle = ((angle % 2*PI) + 2*PI) % 2*PI
sliceIndex = floor(angle / sliceAngle)         // sliceAngle = 2*PI / SLICE_COUNT
```

`SLICE_COUNT` is dynamic — it's the current song's chord array length (3–8), not fixed at 8. Both the hand-tracking loop and the touch `requestAnimationFrame` loop call the same `hoverIndexForPoint()` — hit-testing isn't duplicated per input method. In hand mode, a fist overrides the result to `-1` regardless of finger position.

### 3. Chord resolution

**Data** — `songs.js` defines `window.CHORD_WHEEL_SONGS[key] = { name, chords: string[], lyrics?: string }`. `chords` is ordered clockwise from the top slice; its length sets `SLICE_COUNT`.

**Symbol parsing**
```
/^([A-G](?:b|#)?)([a-zA-Z0-9]*)(?:\/([A-G](?:b|#)?))?$/
```
Captures root note, quality suffix (`''`, `m`, `7`, `maj7`, `m7`, `dim`, `dim7`, `aug`, `sus2`, `sus4`), optional slash-bass note. Sharps normalize to flats via a lookup table so the engine works in one consistent 12-tone array: `['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']`.

**Interval stacking** — quality → semitone offsets from root (major `[0,4,7]`, minor `[0,3,7]`, dominant 7th `[0,4,7,10]`, etc.):
```js
noteIndex = (rootIndex + offset) % 12
octave = baseOctave + floor((rootIndex + offset) / 12)
```

**Octave normalization** — roots in the upper half of the chromatic array (index ≥ 6, Gb–B) get `baseOctave - 1` before the above runs. Without this, chords rooted near the top of the array have most of their intervals cross the `/12` boundary and land an octave higher than chords rooted near the bottom — same math, inconsistent register. This shifts the reference point, not the interval logic.

**Transpose** — `transposeSemitones` (±12) is applied in two places kept in sync:
- *Audio*: `transposeNoteName()` converts note+octave to MIDI-equivalent, shifts, converts back — applied to the note array right before `triggerAttack`.
- *Label*: `transposeChordSymbol()` re-derives root/bass letters by shifting chromatic index, reusing the original quality suffix. This is why the wheel and lyrics panel relabel themselves (`Ebm/Bb` → `Fm/C` at +2) instead of just pitch-shifting under an unchanged label.

### 4. Audio engine

`Tone.PolySynth` wraps a per-voice synth, selectable via the Sound dropdown:
- Default ("soft dreamy"): `Tone.FMSynth` (`harmonicity: 2`, `modulationIndex: 3.2`, sine carrier/modulator) → `Tone.Chorus(3.8, 2.2, 0.35)` → `Tone.Reverb({decay: 2.2, wet: 0.24})` → destination.
- Alternate presets (`pad`, `triangle`, `sawtooth`) swap oscillator type or drop the effects chain.
- Envelope is deliberately slow: attack ≈ 0.25–0.4s, release ≈ 1.2–2.0s, for a swell rather than a hard on/off transient.

**Loudness compensation** — chords aren't perceptually equal in loudness at identical per-voice gain: fewer notes sum to less energy, and lower average pitch reads as quieter at equal amplitude. Compensation is computed per chord at trigger time, referenced against a 4-note, mid-register chord (Bb7):
```js
countCompDb = max(0, 20 * log10(4 / noteCount))
pitchCompDb = max(0, (REF_AVG_MIDI - avgMidiOfChordNotes) * 0.35)
totalCompDb = min(countCompDb * 0.6 + pitchCompDb, 8)   // capped to avoid clipping

synth.volume.value = baseVolumeDb + totalCompDb
```
Recomputed on every `playSlice()` call, so it stays correct after transpose too (which changes `avgMidiOfChordNotes`).

### 5. Rendering / feedback

Two redraw loops depending on input mode, both calling the same `drawWheel()` / `hoverIndexForPoint()`:
- **Hand mode**: driven by MediaPipe's `onResults` callback (tied to camera frame rate).
- **Touch mode**: explicit `requestAnimationFrame` loop, since there's no external frame source.

Canvas 2D context is cleared and redrawn in full each tick — no dirty-rect optimization (cheap enough per frame not to need it).

**Calibration mode** branches `onResults()` before the wheel-drawing path: if active, draws a 21-point skeleton instead (fixed `HAND_CONNECTIONS` index-pair list for the standard MediaPipe hand topology) and forces `stopChord()` regardless of hover state — pure visualization, no playback.

**Lyrics highlighting** is DOM-side, not canvas: `renderChordProLine()` parses `[Chord]word` tokens into `<span class="chord-tag" data-chord="...">`, and `updateLyricsHighlight()` toggles a `.playing` class on any tag whose `data-chord` matches the currently-sounding chord's *original* (pre-transpose) symbol — matching is done on the untransposed identity so it stays correct regardless of transpose state.

---

## Adding a new song

Edit `songs.js` — see the inline comments there for the full chord-symbol and lyrics (`[Chord]word`) syntax. No changes to `chord-wheel.html` are needed; the song dropdown and wheel slice count both rebuild automatically from whatever's in that file.
