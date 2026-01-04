#!/usr/bin/env tsx
/**
 * Update production URLs in .env.yaml files
 *
 * This script updates:
 * - Frontend .env.yaml: VITE_API_URL, VITE_APP_URL, VITE_HOST_URL
 * - Backend server/.env.yaml: CORS_ORIGIN, FRONTEND_URL
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const PROJECT_ROOT = process.cwd();
const FRONTEND_ENV_YAML = join(PROJECT_ROOT, '.env.yaml');
const BACKEND_ENV_YAML = join(PROJECT_ROOT, 'server', '.env.yaml');

// Production URLs
const PRODUCTION_FRONTEND_URL =
    'https://brightpath-ai-production.up.railway.app';
const PRODUCTION_BACKEND_URL =
    'https://brightpath-ai-backend-production.up.railway.app';

// Local development URLs (for reference/comments)
const LOCAL_FRONTEND_URL = 'http://localhost:5173';

function updateFrontendEnv() {
    console.log('📝 Updating frontend .env.yaml...');

    const content = readFileSync(FRONTEND_ENV_YAML, 'utf-8');
    const data = yaml.load(content) as Record<string, string>;

    // Update URLs
    data.VITE_API_URL = PRODUCTION_BACKEND_URL;
    data.VITE_APP_URL = PRODUCTION_FRONTEND_URL;
    data.VITE_HOST_URL = PRODUCTION_FRONTEND_URL;

    // Write back
    const updatedContent = yaml.dump(data, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
    });

    writeFileSync(FRONTEND_ENV_YAML, updatedContent, 'utf-8');

    console.log('✅ Updated frontend .env.yaml:');
    console.log(`   VITE_API_URL: ${data.VITE_API_URL}`);
    console.log(`   VITE_APP_URL: ${data.VITE_APP_URL}`);
    console.log(`   VITE_HOST_URL: ${data.VITE_HOST_URL}`);
}

function updateBackendEnv() {
    console.log('📝 Updating backend server/.env.yaml...');

    const content = readFileSync(BACKEND_ENV_YAML, 'utf-8');
    const data = yaml.load(content) as Record<string, string>;

    // Update CORS_ORIGIN to include production URL (keep localhost for local dev)
    const corsOrigins = [
        PRODUCTION_FRONTEND_URL,
        LOCAL_FRONTEND_URL,
        'http://localhost:5174',
        'http://localhost:5175',
    ].join(',');
    data.CORS_ORIGIN = corsOrigins;

    // Update FRONTEND_URL
    data.FRONTEND_URL = PRODUCTION_FRONTEND_URL;

    // Remove VITE_API_URL from backend (not needed there)
    if (data.VITE_API_URL) {
        delete data.VITE_API_URL;
    }

    // Write back
    const updatedContent = yaml.dump(data, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
    });

    writeFileSync(BACKEND_ENV_YAML, updatedContent, 'utf-8');

    console.log('✅ Updated backend server/.env.yaml:');
    console.log(`   CORS_ORIGIN: ${data.CORS_ORIGIN}`);
    console.log(`   FRONTEND_URL: ${data.FRONTEND_URL}`);
    if (data.VITE_API_URL === undefined) {
        console.log('   Removed VITE_API_URL (not needed in backend)');
    }
}

function main() {
    console.log('🚀 Updating production URLs in environment files...\n');

    try {
        updateFrontendEnv();
        console.log('');
        updateBackendEnv();
        console.log('\n✅ All environment files updated successfully!');
        console.log('\n📋 Next steps:');
        console.log(
            '   1. Review the changes in .env.yaml and server/.env.yaml'
        );
        console.log(
            '   2. For local development, create .env.local files with localhost URLs'
        );
        console.log('   3. Sync to Railway: npm run railway:sync-env');
    } catch (error) {
        console.error('❌ Error updating environment files:', error);
        process.exit(1);
    }
}

main();
