/**
 * Structured JSON logger compatible with Firebase Crashlytics and Cloud Logging.
 * Format: { event, level, component, message, ...context }
 * Never logs secrets or PII.
 */

async function reportErrorToCrashlytics(
    message: string,
    error?: unknown
): Promise<void> {
    // Firebase Crashlytics for web is not yet in the public firebase JS SDK.
    // When available, integrate: import { getCrashlytics, log, recordError } from 'firebase/crashlytics'
    // and pass message/error to log() and recordError().
    void { message, error };
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    event: string;
    level: LogLevel;
    component: string;
    message: string;
    error?: unknown;
    context?: Record<string, unknown>;
    [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
    'password',
    'secret',
    'token',
    'apikey',
    'api_key',
    'authorization',
    'credit_card',
    'ssn',
    'email',
    'phone',
]);

function sanitize(context: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
        const lower = key.toLowerCase();
        if (
            SENSITIVE_KEYS.has(lower) ||
            lower.includes('secret') ||
            lower.includes('pii')
        ) {
            out[key] = '[REDACTED]';
        } else {
            out[key] = value;
        }
    }
    return out;
}

function formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
}

function writeLog(entry: LogEntry): void {
    const sanitized = {
        ...entry,
        ...(entry.context
            ? { context: sanitize(entry.context as Record<string, unknown>) }
            : {}),
    };
    const json = formatLogEntry(sanitized as LogEntry);

    switch (entry.level) {
        case 'debug':
            if (import.meta.env.DEV) {
                console.debug(json);
            }
            break;
        case 'info':
            console.info(json);
            break;
        case 'warn':
            console.warn(json);
            break;
        case 'error':
            console.error(json);
            reportErrorToCrashlytics(json, entry.error);
            break;
        default:
            console.log(json);
    }
}

export function createLogger(component: string) {
    return {
        debug(
            event: string,
            message: string,
            context?: Record<string, unknown>
        ) {
            writeLog({
                event,
                level: 'debug',
                component,
                message,
                ...(context && { context: sanitize(context) }),
            });
        },
        info(
            event: string,
            message: string,
            context?: Record<string, unknown>
        ) {
            writeLog({
                event,
                level: 'info',
                component,
                message,
                ...(context && { context: sanitize(context) }),
            });
        },
        warn(
            event: string,
            message: string,
            context?: Record<string, unknown>
        ) {
            writeLog({
                event,
                level: 'warn',
                component,
                message,
                ...(context && { context: sanitize(context) }),
            });
        },
        error(
            event: string,
            message: string,
            context?: Record<string, unknown> & { error?: unknown }
        ) {
            const { error, ...rest } = context ?? {};
            writeLog({
                event,
                level: 'error',
                component,
                message,
                ...(error !== undefined && { error }),
                ...(Object.keys(rest).length > 0 && {
                    context: sanitize(rest),
                }),
            });
        },
    };
}

export const logger = createLogger('app');
