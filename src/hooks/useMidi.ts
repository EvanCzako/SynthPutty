import { useEffect } from 'react';
import { useSynthStore } from '../store/synthStore';

/* The Web MIDI types are not in the default TS lib, and pulling in
 * @types/webmidi for three fields is not worth the dependency. */
interface MIDIMessageEvent {
    readonly data: Uint8Array;
}
interface MIDIInput {
    addEventListener(type: 'midimessage', listener: (e: MIDIMessageEvent) => void): void;
    removeEventListener(type: 'midimessage', listener: (e: MIDIMessageEvent) => void): void;
}
interface MIDIAccess {
    inputs: { values(): IterableIterator<MIDIInput> };
}
type MIDINavigator = Navigator & { requestMIDIAccess?: () => Promise<MIDIAccess> };

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;

export function isMidiSupported(): boolean {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}

export function useMIDI() {
    const midiEnabled = useSynthStore((s) => s.midiEnabled);
    const noteOn = useSynthStore((s) => s.noteOn);
    const noteOff = useSynthStore((s) => s.noteOff);
    const panic = useSynthStore((s) => s.panic);
    const setMidiError = useSynthStore((s) => s.setMidiError);

    useEffect(() => {
        if (!midiEnabled) return;

        const request = (navigator as MIDINavigator).requestMIDIAccess;
        if (!request) {
            setMidiError('This browser does not support Web MIDI.');
            return;
        }

        let cancelled = false;
        let access: MIDIAccess | undefined;
        let onMessage: ((e: MIDIMessageEvent) => void) | undefined;

        request
            .call(navigator)
            .then((midiAccess) => {
                /* The permission prompt can outlive the toggle being switched
                 * back off, so do not wire up a device nobody asked for. */
                if (cancelled) return;
                access = midiAccess;

                onMessage = (e: MIDIMessageEvent) => {
                    const [status, data1, data2] = e.data;
                    const command = status & 0xf0;
                    /* A note-on with velocity 0 is the note-off most
                     * controllers actually send. */
                    if (command === NOTE_ON && data2 > 0) noteOn(data1, data2);
                    else if (command === NOTE_OFF || (command === NOTE_ON && data2 === 0)) {
                        noteOff(data1);
                    }
                };

                for (const input of access.inputs.values()) {
                    input.addEventListener('midimessage', onMessage);
                }
            })
            .catch((err: Error) => {
                if (cancelled) return;
                setMidiError(err?.message || 'MIDI could not be enabled on this device.');
            });

        return () => {
            cancelled = true;
            if (access && onMessage) {
                for (const input of access.inputs.values()) {
                    input.removeEventListener('midimessage', onMessage);
                }
            }
            /* A device can be unplugged mid-note; without this its note-off
             * never arrives and the note sustains forever. */
            panic();
        };
    }, [midiEnabled, noteOn, noteOff, panic, setMidiError]);
}
