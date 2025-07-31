// hooks/useMIDI.ts
import { useEffect } from "react";
import { useSynthStore } from "../store/synthStore";

export function useMIDI() {
    const { midiEnabled, noteOn, noteOff } = useSynthStore();

    useEffect(() => {
        if (!midiEnabled) return;

        let access: any;
		let handleMessage: any;

        (navigator as any).requestMIDIAccess().then((midiAccess: any) => {
            access = midiAccess;

            handleMessage = (e: any) => {
                if (e.data) {
                    const [status, data1, data2] = e.data;
                    const command = status & 0xf0;

                    if (command === 0x90 && data2 > 0) {
                        // Note on
						console.log([data1,data2]);
                        noteOn(data1, data2 * 100 / 127);
                    } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
                        // Note off
                        noteOff(data1);
                    }
                }
            };

            for (const input of access.inputs.values()) {
                input.addEventListener("midimessage", handleMessage);
            }
        });

        return () => {
            if (access) {
                for (const input of access.inputs.values()) {
                    input.removeEventListener("midimessage", handleMessage);
                }
            }
        };
    }, [midiEnabled, noteOn, noteOff]);
}
