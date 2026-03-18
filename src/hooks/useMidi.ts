import { useEffect } from "react";
import { useSynthStore } from "../store/synthStore";

interface MIDIMessageEvent {
  readonly data: Uint8Array;
}
interface MIDIInput {
  addEventListener(type: "midimessage", listener: (e: MIDIMessageEvent) => void): void;
  removeEventListener(type: "midimessage", listener: (e: MIDIMessageEvent) => void): void;
}
interface MIDIAccess {
  inputs: { values(): IterableIterator<MIDIInput> };
}

export function useMIDI() {
  const { midiEnabled, noteOn, noteOff } = useSynthStore();

  useEffect(() => {
    if (!midiEnabled) return;

    let access: MIDIAccess | undefined;
    let handleMessage: ((e: MIDIMessageEvent) => void) | undefined;

    (navigator as Navigator & { requestMIDIAccess(): Promise<MIDIAccess> })
      .requestMIDIAccess()
      .then((midiAccess: MIDIAccess) => {
        access = midiAccess;

        handleMessage = (e: MIDIMessageEvent) => {
          const [status, data1, data2] = e.data;
          const command = status & 0xf0;

          if (command === 0x90 && data2 > 0) {
            noteOn(data1, data2);
          } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
            noteOff(data1);
          }
        };

        for (const input of access.inputs.values()) {
          input.addEventListener("midimessage", handleMessage);
        }
      })
      .catch((err: Error) => {
        alert(
          "MIDI could not be enabled on this device.\n" + (err?.message || err),
        );
        console.error("MIDI initialization failed:", err);
      });

    return () => {
      if (access && handleMessage) {
        for (const input of access.inputs.values()) {
          input.removeEventListener("midimessage", handleMessage);
        }
      }
    };
  }, [midiEnabled, noteOn, noteOff]);
}
