import { initializeApp, type FirebaseApp } from 'firebase/app';
import { FIREBASE_PROJECT_ID, FIREBASE_API_KEY, FIREBASE_APP_ID } from './env';

let app: FirebaseApp | null = null;

/**
 * Initialize Firebase. Safe to call multiple times.
 * Only initializes when FIREBASE_PROJECT_ID is set.
 * Used for Firebase services (Analytics, future Crashlytics web support).
 */
export function initFirebase(): void {
    if (!FIREBASE_PROJECT_ID) {
        return;
    }

    if (app) {
        return;
    }

    const apiKey = FIREBASE_API_KEY ?? '';
    const appId = FIREBASE_APP_ID ?? '';

    if (!apiKey || !appId) {
        return;
    }

    try {
        app = initializeApp({
            apiKey,
            authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
            projectId: FIREBASE_PROJECT_ID,
            storageBucket: `${FIREBASE_PROJECT_ID}.appspot.com`,
            messagingSenderId: '',
            appId,
        });
    } catch {
        app = null;
    }
}

export function getFirebaseApp(): FirebaseApp | null {
    return app;
}
