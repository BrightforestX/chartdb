#!/usr/bin/env tsx
/**
 * Sync environment variables from YAML files to Railway services
 *
 * This script reads:
 * - .env.yaml → Frontend Railway service
 * - server/.env.yaml → Backend Railway service
 *
 * Usage:
 *   tsx scripts/sync-env-to-railway.ts [--frontend-only] [--backend-only] [--dry-run]
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

const PROJECT_ROOT = process.cwd();
const FRONTEND_ENV_YAML = join(PROJECT_ROOT, '.env.yaml');
const BACKEND_ENV_YAML = join(PROJECT_ROOT, 'server', '.env.yaml');

// Railway service names
const FRONTEND_SERVICE_NAME = 'brightpath-ai';
const BACKEND_SERVICE_NAME = 'brightpath-ai-backend';

interface SyncOptions {
    frontendOnly?: boolean;
    backendOnly?: boolean;
    dryRun?: boolean;
}

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message: string) {
    log(`[INFO] ${message}`, 'green');
}

function logWarn(message: string) {
    log(`[WARN] ${message}`, 'yellow');
}

function logError(message: string) {
    log(`[ERROR] ${message}`, 'red');
}

function logDebug(message: string) {
    log(`[DEBUG] ${message}`, 'blue');
}

// Check if Railway CLI is installed
function checkRailwayCLI(): boolean {
    try {
        execSync('railway --version', { stdio: 'ignore' });
        return true;
    } catch {
        logError('Railway CLI is not installed.');
        logInfo('Install it with: npm i -g @railway/cli');
        return false;
    }
}

// Check if logged in to Railway
function checkRailwayAuth(): boolean {
    try {
        execSync('railway whoami', { stdio: 'ignore' });
        return true;
    } catch {
        logError('Not logged in to Railway.');
        logInfo('Run: railway login');
        return false;
    }
}

// Check if linked to a Railway project
function checkRailwayLink(): boolean {
    try {
        execSync('railway status', { stdio: 'ignore' });
        return true;
    } catch {
        logWarn('Not linked to a Railway project.');
        logInfo('Run: railway link');
        return false;
    }
}

// Load YAML file and return as object
function loadYamlFile(filePath: string): Record<string, string> {
    try {
        const content = readFileSync(filePath, 'utf-8');
        const data = yaml.load(content) as Record<string, string>;

        // Filter out comments and empty values
        const filtered: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
            // Skip if key starts with # (comment) or value is empty/null
            if (!key.startsWith('#') && value != null && value !== '') {
                // Remove quotes if present
                const cleanValue = String(value).replace(/^["']|["']$/g, '');
                filtered[key] = cleanValue;
            }
        }

        return filtered;
    } catch (error) {
        if (error instanceof Error) {
            logError(`Failed to load ${filePath}: ${error.message}`);
        }
        throw error;
    }
}

// Set multiple environment variables in Railway (batched per service to avoid rate limits)
function setRailwayVariablesBatch(
    variables: Array<{ key: string; value: string }>,
    service: string, // Now required - must specify service explicitly
    dryRun = false
): { success: number; failed: number } {
    if (variables.length === 0) {
        return { success: 0, failed: 0 };
    }

    if (dryRun) {
        for (const { key, value } of variables) {
            const preview =
                value.length > 30 ? `${value.substring(0, 30)}...` : value;
            logDebug(`[DRY RUN] Would set: ${key}=${preview}`);
        }
        return { success: variables.length, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    // Build Railway CLI command with all variables at once
    // Railway CLI supports multiple --set flags: railway variables --set "KEY1=VAL1" --set "KEY2=VAL2" ... --skip-deploys
    const setFlags = variables
        .map(({ key, value }) => {
            // Escape special characters in value (quotes and dollar signs)
            const escapedValue = value
                .replace(/"/g, '\\"')
                .replace(/\$/g, '\\$');
            return `--set "${key}=${escapedValue}"`;
        })
        .join(' ');

    // Always use --service flag explicitly to avoid Railway CLI using directory context
    const command = `railway variables ${setFlags} --skip-deploys --service ${service}`;

    try {
        logDebug(
            `Setting ${variables.length} variables in batch for ${service} service...`
        );
        execSync(command, {
            stdio: 'pipe',
            cwd: PROJECT_ROOT, // Always use project root, not workingDir
            timeout: 60000, // 60 second timeout for batch operations
            encoding: 'utf-8',
        });

        // All variables set successfully
        success = variables.length;
        for (const { key } of variables) {
            logDebug(`✅ Set ${key}`);
        }
    } catch (error: unknown) {
        const errorMessage =
            error && typeof error === 'object' && 'message' in error
                ? String(error.message)
                : String(error);

        // If batch fails due to rate limit, try smaller batches
        if (errorMessage.includes('rate limit') && variables.length > 1) {
            logWarn(`Batch rate limited, splitting into smaller batches...`);

            // Split into batches of 5
            const batchSize = 5;
            for (let i = 0; i < variables.length; i += batchSize) {
                const batch = variables.slice(i, i + batchSize);
                const batchResult = setRailwayVariablesBatch(
                    batch,
                    service,
                    dryRun
                );
                success += batchResult.success;
                failed += batchResult.failed;

                // Wait between batches to avoid rate limits
                if (i + batchSize < variables.length) {
                    logDebug('Waiting 2 seconds before next batch...');
                    execSync('sleep 2', { stdio: 'ignore' });
                }
            }
        } else {
            // If batch fails for other reasons, try setting individually with delays
            logWarn(`Batch set failed: ${errorMessage}`);
            logWarn('Falling back to individual sets with delays...');

            for (const { key, value } of variables) {
                try {
                    const escapedValue = value
                        .replace(/"/g, '\\"')
                        .replace(/\$/g, '\\$');
                    // Always use --service flag explicitly
                    const individualCommand = `railway variables --set "${key}=${escapedValue}" --skip-deploys --service ${service}`;

                    execSync(individualCommand, {
                        stdio: 'pipe',
                        cwd: PROJECT_ROOT, // Always use project root
                        timeout: 10000,
                        encoding: 'utf-8',
                    });

                    success++;
                    logDebug(`✅ Set ${key}`);

                    // Small delay every 3 variables to avoid rate limits
                    if (success % 3 === 0 && success < variables.length) {
                        execSync('sleep 1', { stdio: 'ignore' });
                    }
                } catch (individualError: unknown) {
                    failed++;
                    const individualErrorMessage =
                        individualError &&
                        typeof individualError === 'object' &&
                        'message' in individualError
                            ? String(individualError.message)
                            : String(individualError);

                    if (individualErrorMessage.includes('rate limit')) {
                        logWarn(
                            `Rate limited for ${key}, waiting 3 seconds...`
                        );
                        execSync('sleep 3', { stdio: 'ignore' });
                        // Retry once
                        try {
                            const escapedValue = value
                                .replace(/"/g, '\\"')
                                .replace(/\$/g, '\\$');
                            // Always use --service flag explicitly
                            const retryCommand = `railway variables --set "${key}=${escapedValue}" --skip-deploys --service ${service}`;
                            execSync(retryCommand, {
                                stdio: 'pipe',
                                cwd: PROJECT_ROOT, // Always use project root
                                timeout: 10000,
                                encoding: 'utf-8',
                            });
                            success++;
                            failed--;
                            logDebug(`✅ Set ${key} (after retry)`);
                        } catch {
                            logWarn(`Failed to set ${key} after retry`);
                        }
                    } else {
                        logWarn(
                            `Failed to set ${key}: ${individualErrorMessage}`
                        );
                    }
                }
            }
        }
    }

    return { success, failed };
}

// Sync environment variables from YAML to Railway
function syncToRailway(
    yamlPath: string,
    serviceName: string,
    serviceId: string, // Now required - must specify service explicitly
    options: SyncOptions = {}
): { success: number; failed: number } {
    logInfo(`Syncing ${serviceName} variables from ${yamlPath}...`);

    if (!existsSync(yamlPath)) {
        logError(`${serviceName} YAML file not found: ${yamlPath}`);
        return { success: 0, failed: 0 };
    }

    const envVars = loadYamlFile(yamlPath);
    const total = Object.keys(envVars).length;

    if (total === 0) {
        logWarn(`No environment variables found in ${yamlPath}`);
        return { success: 0, failed: 0 };
    }

    logInfo(`Found ${total} environment variables`);

    // Prepare variables array (filter out comments)
    const variables: Array<{ key: string; value: string }> = [];
    for (const [key, value] of Object.entries(envVars)) {
        // Skip commented out variables
        if (key.trim().startsWith('#')) {
            continue;
        }
        variables.push({ key, value });
    }

    if (variables.length === 0) {
        logWarn(`No valid environment variables to sync`);
        return { success: 0, failed: 0 };
    }

    // Don't change directories - always use PROJECT_ROOT and --service flag explicitly
    // This ensures variables are written to the correct service regardless of directory context
    logInfo(
        `Setting ${variables.length} variables in batch for ${serviceName} service (${serviceId})...`
    );
    const result = setRailwayVariablesBatch(
        variables,
        serviceId,
        options.dryRun
    );
    const { success, failed } = result;

    logInfo(
        `Synced ${success}/${total} variables to Railway (${serviceName} service)`
    );
    if (failed > 0) {
        logWarn(`${failed} variables failed to sync`);
    }

    return { success, failed };
}

// Main function
function main() {
    const args = process.argv.slice(2);
    const options: SyncOptions = {
        frontendOnly: args.includes('--frontend-only'),
        backendOnly: args.includes('--backend-only'),
        dryRun: args.includes('--dry-run'),
    };

    log('==========================================', 'cyan');
    log('Railway Environment Variable Sync', 'cyan');
    log('==========================================', 'cyan');
    console.log('');

    if (options.dryRun) {
        logWarn('DRY RUN MODE - No variables will be set');
        console.log('');
    }

    // Check prerequisites
    if (!checkRailwayCLI()) {
        process.exit(1);
    }

    if (!options.dryRun) {
        if (!checkRailwayAuth()) {
            process.exit(1);
        }

        if (!checkRailwayLink()) {
            logWarn('Continuing anyway, but variables may fail to set...');
            console.log('');
        }
    }

    let frontendResult = { success: 0, failed: 0 };
    let backendResult = { success: 0, failed: 0 };

    // Sync frontend (explicitly target frontend service)
    if (!options.backendOnly) {
        console.log('');
        frontendResult = syncToRailway(
            FRONTEND_ENV_YAML,
            'Frontend',
            FRONTEND_SERVICE_NAME, // Explicitly specify frontend service name
            options
            // Don't pass workingDir - we always use PROJECT_ROOT and --service flag
        );
    }

    // Sync backend (explicitly target backend service)
    if (!options.frontendOnly) {
        console.log('');
        backendResult = syncToRailway(
            BACKEND_ENV_YAML,
            'Backend',
            BACKEND_SERVICE_NAME, // Explicitly specify backend service name
            options
            // Don't pass workingDir - we always use PROJECT_ROOT and --service flag
        );
    }

    // Summary
    console.log('');
    log('==========================================', 'cyan');
    log('Summary', 'cyan');
    log('==========================================', 'cyan');
    logInfo(
        `Frontend: ${frontendResult.success} succeeded, ${frontendResult.failed} failed`
    );
    logInfo(
        `Backend: ${backendResult.success} succeeded, ${backendResult.failed} failed`
    );

    const totalFailed = frontendResult.failed + backendResult.failed;

    console.log('');
    if (totalFailed === 0) {
        log('✅ All variables synced successfully!', 'green');
        process.exit(0);
    } else {
        logWarn(`⚠️  ${totalFailed} variables failed to sync`);
        logInfo('Check Railway dashboard or run with --dry-run to debug');
        process.exit(1);
    }
}

// Run if called directly
main();

export { syncToRailway, loadYamlFile };
