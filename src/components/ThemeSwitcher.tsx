import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { THEMES, DEFAULT_THEME, ThemeId, applyTheme, readStoredTheme } from '../theme';
import styles from '../styles/ThemeSwitcher.module.css';

/* Gap between the trigger and the panel below it. */
const PANEL_OFFSET_PX = 8;

const TONE_GROUPS = [
    { tone: 'dark', label: 'Dark' },
    { tone: 'light', label: 'Light' },
] as const;

/*
 * The panel is portalled to <body> and fixed-positioned because .app and
 * .panel both clip overflow, so an absolutely positioned popover would be cut
 * off at the header's edge.
 */
export default function ThemeSwitcher() {
    const [theme, setTheme] = useState<ThemeId>(readStoredTheme);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, right: 0 });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => applyTheme(theme), [theme]);

    useLayoutEffect(() => {
        if (!open) return;

        const place = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (rect) {
                setPos({
                    top: rect.bottom + PANEL_OFFSET_PX,
                    right: window.innerWidth - rect.right,
                });
            }
        };

        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const currentLabel = THEMES.find((t) => t.id === theme)?.label ?? theme;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className={styles.trigger}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label={`Theme: ${currentLabel}`}
                title="Theme"
            >
                <span className={styles.swatches} aria-hidden="true">
                    <i style={{ background: 'var(--seed-accent)' }} />
                    <i style={{ background: 'var(--seed-active)' }} />
                    <i style={{ background: 'var(--seed-playhead)' }} />
                </span>
            </button>

            {open &&
                createPortal(
                    <div
                        ref={panelRef}
                        className={styles.panel}
                        style={{ top: `${pos.top}px`, right: `${pos.right}px` }}
                        role="dialog"
                        aria-label="Theme"
                    >
                        {TONE_GROUPS.map((group) => (
                            <div key={group.tone}>
                                <div className={styles.groupLabel}>{group.label}</div>
                                <div className={styles.swatchGrid}>
                                    {THEMES.filter((t) => t.tone === group.tone).map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            /* Each swatch carries its own data-theme, so the
                                               seeds inside it resolve to that theme rather
                                               than the active one. */
                                            data-theme={
                                                option.id === DEFAULT_THEME ? undefined : option.id
                                            }
                                            className={`${styles.swatch} ${
                                                option.id === theme ? styles.swatchActive : ''
                                            }`}
                                            aria-pressed={option.id === theme}
                                            onClick={() => setTheme(option.id)}
                                        >
                                            <span className={styles.swatchChip} aria-hidden="true">
                                                <i style={{ background: 'var(--seed-bg)' }} />
                                                <i style={{ background: 'var(--seed-accent)' }} />
                                                <i style={{ background: 'var(--seed-active)' }} />
                                                <i style={{ background: 'var(--seed-playhead)' }} />
                                            </span>
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>,
                    document.body
                )}
        </>
    );
}
