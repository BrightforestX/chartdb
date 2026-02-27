import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './globals.css';
import { App } from './app';
import './i18n/i18n';
import { initFirebase } from './lib/firebase';
import { logger } from './lib/logger';

initFirebase();

window.addEventListener('error', (event) => {
    logger.error('uncaught_error', event.message, {
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
    });
});

window.addEventListener('unhandledrejection', (event) => {
    logger.error('unhandled_rejection', String(event.reason), {
        reason: event.reason,
    });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
