import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { applyTheme, readStoredTheme } from './theme';
import reportWebVitals from './reportWebVitals';

/* Applied before the first paint so the app never flashes the default palette
 * on the way to the stored one. */
applyTheme(readStoredTheme());

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);

reportWebVitals();
