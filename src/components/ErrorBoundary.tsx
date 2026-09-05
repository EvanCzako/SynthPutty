import React from 'react';
import { clearStoredPreferences } from '../theme';
import styles from '../styles/ErrorBoundary.module.css';

/*
 * Without the reset button a stored preference that the app can no longer read
 * re-crashes on every reload, with no way out short of clearing site data by
 * hand.
 */
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('SynthPutty crashed:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className={styles.fallback} role="alert">
                <h1 className={styles.title}>Something went wrong</h1>
                <p className={styles.message}>{this.state.error.message}</p>
                <button
                    type="button"
                    className={styles.button}
                    onClick={() => {
                        clearStoredPreferences();
                        window.location.reload();
                    }}
                >
                    Reset and reload
                </button>
            </div>
        );
    }
}
