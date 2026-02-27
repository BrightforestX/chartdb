# Logging & Crash Reporting

This project uses structured JSON logging compatible with Firebase Crashlytics and Google Cloud Logging.

## Log Format

All logs follow this structure:

```json
{
  "event": "string",
  "level": "debug" | "info" | "warn" | "error",
  "component": "string",
  "message": "string",
  "context": { ... }
}
```

- **event**: Logical event name (e.g. `dbml_export_error`, `sql_import_failed`)
- **level**: Log severity
- **component**: Module or feature name (e.g. `dbml-export`, `sql-mysql`)
- **message**: Human-readable description
- **context**: Optional additional data (PII and secrets are redacted)

## Usage

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger('my-component');

logger.info('operation_started', 'Starting export');
logger.warn('validation_skipped', 'Optional field missing', { field: 'name' });
logger.error('export_failed', 'DBML generation failed', { error: err });
```

## Security

- **Never log secrets or PII.** The logger automatically redacts known sensitive keys: `password`, `secret`, `token`, `apikey`, `authorization`, `email`, `phone`, `ssn`, `credit_card`, and any key containing `secret` or `pii`.

## Firebase Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create or select a project
3. In Project Settings > General, copy:
   - Project ID
   - Web API Key (under "Your apps" > Web app config)
   - App ID

### 2. Configure environment

Add to your `.env`:

```bash
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_APP_ID=your-app-id
```

Or for `config.js` (e.g. for Docker):

```javascript
window.env = {
  FIREBASE_PROJECT_ID: 'your-project-id',
  FIREBASE_API_KEY: 'your-api-key',
  FIREBASE_APP_ID: 'your-app-id',
};
```

### 3. firebase.json

The repo includes a `firebase.json` for hosting. Set `projectId` to your Firebase project ID when deploying:

```json
{
  "projectId": "your-project-id",
  ...
}
```

## Error Reporting

- Uncaught errors and unhandled promise rejections are captured and logged via `window.onerror` and `window.onunhandledrejection`.
- Errors use the structured format and can be ingested by Cloud Logging when a backend is added.
- Firebase Crashlytics for web: The Firebase JS SDK does not yet export `firebase/crashlytics` in the public npm package. When it becomes available, integrate `getCrashlytics`, `log`, and `recordError` in `src/lib/logger.ts` for full Crashlytics support.

## Backend / Cloud Logging (Future)

When adding a Node.js, Go, or Python backend:

- **Node/TS**: Use `firebase-admin` with Cloud Logging
- **Go**: Use `cloud.google.com/go/logging`
- **Python**: Use `google-cloud-logging` or `firebase-admin`

Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON for server-side logging.

## References

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Logging](https://cloud.google.com/logging/docs)
- Project cursor rules (014-logging-standards) if configured
