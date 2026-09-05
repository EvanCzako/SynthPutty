import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSynthStore } from '../store/synthStore';
import { useFontStore } from '../store/fontStore';
import styles from '../styles/Keyboard.module.css';

/*
 * Notes are real MIDI note numbers throughout (middle C = C4 = 60). They used
 * to be indices into a table of note names, which is a whole octave below the
 * MIDI number for the same name -- so a hardware controller and the on-screen
 * keys played different pitches for the same key.
 */

const PITCH_CLASS: Record<string, number> = {
    C: 0,
    'C#': 1,
    D: 2,
    'D#': 3,
    E: 4,
    F: 5,
    'F#': 6,
    G: 7,
    'G#': 8,
    A: 9,
    'A#': 10,
    B: 11,
};

/* A fractional octave (3.5) means its upper half, F..B. */
const WHITE_KEYS_FULL = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const WHITE_KEYS_HALF = ['F', 'G', 'A', 'B'] as const;

/* The black key immediately to the LEFT of each white key, if there is one.
 * The black row renders one slot per white key so the two rows stay aligned. */
const BLACK_BEFORE: Record<string, string | undefined> = {
    C: undefined,
    D: 'C#',
    E: 'D#',
    F: undefined,
    G: 'F#',
    A: 'G#',
    B: 'A#',
};

/* Two overlapping rows, as on a tracker: the lower row starts at C4 and the
 * upper at C5, so the ranges deliberately share an octave. */
const COMPUTER_KEYS: Record<string, string> = {
    z: 'C4',
    s: 'C#4',
    x: 'D4',
    d: 'D#4',
    c: 'E4',
    v: 'F4',
    g: 'F#4',
    b: 'G4',
    h: 'G#4',
    n: 'A4',
    j: 'A#4',
    m: 'B4',
    ',': 'C5',
    l: 'C#5',
    '.': 'D5',
    ';': 'D#5',
    '/': 'E5',
    q: 'C5',
    2: 'C#5',
    w: 'D5',
    3: 'D#5',
    e: 'E5',
    r: 'F5',
    5: 'F#5',
    t: 'G5',
    6: 'G#5',
    y: 'A5',
    7: 'A#5',
    u: 'B5',
    i: 'C6',
    9: 'C#6',
    o: 'D6',
    0: 'D#6',
    p: 'E6',
};

const KEYBOARD_VELOCITY = 100;

/* How far a touch must travel before it is re-tested against the key under
 * it, in CSS pixels. Below this a resting finger would re-trigger constantly. */
const GLIDE_THRESHOLD_PX = 5;

function midiNumber(name: string, octave: number): number {
    return (octave + 1) * 12 + PITCH_CLASS[name];
}

/* "C#4" -> 61 */
function parseNoteName(label: string): number {
    const match = /^([A-G]#?)(-?\d+)$/.exec(label);
    return match ? midiNumber(match[1], Number(match[2])) : -1;
}

function accessibleName(name: string, octave: number): string {
    return `${name.replace('#', ' sharp')} ${octave}`;
}

type WhiteKey = { note: number; name: string; octave: number; label: string | null };
type BlackSlot = { note: number; name: string; octave: number } | null;

export const Keyboard: React.FC = () => {
    const octaves = useFontStore((s) => s.octaves);
    const activeNotes = useSynthStore((s) => s.activeNotes);
    const noteOn = useSynthStore((s) => s.noteOn);
    const noteOff = useSynthStore((s) => s.noteOff);

    const { whites, blacks, ordered } = useMemo(() => {
        const whiteKeys: WhiteKey[] = [];
        const blackSlots: BlackSlot[] = [];

        for (const entry of octaves) {
            const isHalf = entry % 1 !== 0;
            const octave = Math.floor(entry);
            const names = isHalf ? WHITE_KEYS_HALF : WHITE_KEYS_FULL;

            names.forEach((name, i) => {
                whiteKeys.push({
                    note: midiNumber(name, octave),
                    name,
                    octave,
                    /* Label the first white key of each run, so the player can
                     * find their bearings without labelling all 60 keys. */
                    label: i === 0 ? `${name}${octave}` : null,
                });

                /* C and F have no black key to their left, so they push an
                 * empty slot -- the two rows must stay index-aligned. */
                const blackName = BLACK_BEFORE[name];
                blackSlots.push(
                    blackName
                        ? { note: midiNumber(blackName, octave), name: blackName, octave }
                        : null
                );
            });
        }

        const orderedNotes = [
            ...whiteKeys.map((k) => k.note),
            ...blackSlots.filter((s): s is NonNullable<BlackSlot> => s !== null).map((s) => s.note),
        ].sort((a, b) => a - b);

        return { whites: whiteKeys, blacks: blackSlots, ordered: orderedNotes };
    }, [octaves]);

    /* Roving tabindex: one key in the tab order, arrows move between them.
     * Sixty tabbable keys between the piano and the rest of the page is worse
     * than none. */
    const [rovingNote, setRovingNote] = useState<number | null>(null);
    const activeRoving =
        rovingNote !== null && ordered.includes(rovingNote) ? rovingNote : ordered[0];

    const keyboardRef = useRef<HTMLDivElement>(null);

    /* Mouse gliding across keys reads its held note from a ref, not state: the
     * global mouseup listener is registered once and must see the note that is
     * actually sounding, not the one captured by the render that added it. */
    const mouseNote = useRef<number | null>(null);
    const touchNotes = useRef(new Map<number, number>());
    const touchPositions = useRef(new Map<number, { x: number; y: number }>());

    const play = useCallback(
        (note: number) => {
            if (note >= 0) noteOn(note, KEYBOARD_VELOCITY);
        },
        [noteOn]
    );

    /* ---- Computer keyboard --------------------------------------------- */

    useEffect(() => {
        /* The two key rows overlap, so C5 has two physical keys. Counting the
         * physical keys holding each note stops releasing one from cutting a
         * note the other is still holding. */
        const held = new Map<string, number>();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
            const label = COMPUTER_KEYS[e.key.toLowerCase()];
            if (!label) return;
            const note = parseNoteName(label);
            if (note < 0 || held.has(e.key.toLowerCase())) return;
            held.set(e.key.toLowerCase(), note);
            noteOn(note, KEYBOARD_VELOCITY);
        };

        const onKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const note = held.get(key);
            if (note === undefined) return;
            held.delete(key);
            if (![...held.values()].includes(note)) noteOff(note);
        };

        /* A window that loses focus never delivers the keyup, so the note
         * would sustain until the key was pressed and released again. */
        const onBlur = () => {
            held.forEach((note) => noteOff(note));
            held.clear();
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            onBlur();
        };
    }, [noteOn, noteOff]);

    /* ---- Mouse ---------------------------------------------------------- */

    useEffect(() => {
        const onMouseUp = () => {
            if (mouseNote.current !== null) {
                noteOff(mouseNote.current);
                mouseNote.current = null;
            }
        };
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, [noteOff]);

    const handleMouseDown = (note: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        if (mouseNote.current !== null && mouseNote.current !== note) noteOff(mouseNote.current);
        mouseNote.current = note;
        play(note);
        setRovingNote(note);
    };

    const handleMouseEnter = (note: number) => (e: React.MouseEvent) => {
        if (e.buttons !== 1 || mouseNote.current === note) return;
        if (mouseNote.current !== null) noteOff(mouseNote.current);
        mouseNote.current = note;
        play(note);
    };

    /* ---- Touch ---------------------------------------------------------- */

    const handleTouchStart = (note: number) => (e: React.TouchEvent) => {
        e.preventDefault();
        for (const touch of Array.from(e.changedTouches)) {
            if (touchNotes.current.has(touch.identifier)) continue;
            touchNotes.current.set(touch.identifier, note);
            /* Seed the position here or the first move always clears the
             * glide threshold and re-tests a finger that has not moved. */
            touchPositions.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
            play(note);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        for (const touch of Array.from(e.changedTouches)) {
            const id = touch.identifier;
            const last = touchPositions.current.get(id);
            if (
                last &&
                Math.abs(touch.clientX - last.x) < GLIDE_THRESHOLD_PX &&
                Math.abs(touch.clientY - last.y) < GLIDE_THRESHOLD_PX
            ) {
                continue;
            }
            touchPositions.current.set(id, { x: touch.clientX, y: touch.clientY });

            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const noteAttr = target instanceof HTMLElement ? target.dataset.note : undefined;
            if (!noteAttr) continue;

            const next = Number(noteAttr);
            const previous = touchNotes.current.get(id);
            if (previous !== undefined && previous !== next) {
                noteOff(previous);
                touchNotes.current.set(id, next);
                play(next);
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault();
        for (const touch of Array.from(e.changedTouches)) {
            const note = touchNotes.current.get(touch.identifier);
            if (note === undefined) continue;
            noteOff(note);
            touchNotes.current.delete(touch.identifier);
            touchPositions.current.delete(touch.identifier);
        }
    };

    /* ---- Keyboard navigation within the piano --------------------------- */

    const focusNote = (note: number) => {
        setRovingNote(note);
        keyboardRef.current?.querySelector<HTMLButtonElement>(`[data-note="${note}"]`)?.focus();
    };

    const handleKeyNav = (note: number) => (e: React.KeyboardEvent) => {
        const index = ordered.indexOf(note);

        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const next = index + (e.key === 'ArrowRight' ? 1 : -1);
            if (next >= 0 && next < ordered.length) focusNote(ordered[next]);
            return;
        }
        if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            focusNote(e.key === 'Home' ? ordered[0] : ordered[ordered.length - 1]);
            return;
        }
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            play(note);
        }
    };

    const handleKeyRelease = (note: number) => (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') noteOff(note);
    };

    /* The stylesheet derives the black row's offset from this; see the
     * .blackKeyboard rule in Keyboard.module.css. */
    const keyboardStyle = { '--white-count': Math.max(whites.length, 1) } as React.CSSProperties;

    const keyProps = (note: number, name: string, octave: number) => ({
        type: 'button' as const,
        'data-note': note,
        'aria-label': accessibleName(name, octave),
        'aria-pressed': Boolean(activeNotes[note]),
        tabIndex: note === activeRoving ? 0 : -1,
        onMouseDown: handleMouseDown(note),
        onMouseEnter: handleMouseEnter(note),
        onTouchStart: handleTouchStart(note),
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd,
        onKeyDown: handleKeyNav(note),
        onKeyUp: handleKeyRelease(note),
        onFocus: () => setRovingNote(note),
    });

    return (
        <div
            ref={keyboardRef}
            className={styles.keyboard}
            style={keyboardStyle}
            role="group"
            aria-label="Piano keyboard"
        >
            <div className={styles.blackKeyboard}>
                {/* One slot per white key, whether or not it holds a black
                    key, so the two rows stay aligned. */}
                {blacks.map((slot, i) => (
                    <span key={slot ? slot.note : `gap-${i}`} className={styles.blackSlot}>
                        {slot && (
                            <button
                                {...keyProps(slot.note, slot.name, slot.octave)}
                                className={`${styles.blackKey} ${
                                    activeNotes[slot.note] ? styles.blackKeyPressed : ''
                                }`}
                            />
                        )}
                    </span>
                ))}
            </div>

            <div className={styles.whiteKeyboard}>
                {whites.map((key) => (
                    <button
                        key={key.note}
                        {...keyProps(key.note, key.name, key.octave)}
                        className={`${styles.whiteKey} ${
                            activeNotes[key.note] ? styles.whiteKeyPressed : ''
                        }`}
                    >
                        <span className={styles.keyLabel} aria-hidden="true">
                            {key.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Keyboard;
