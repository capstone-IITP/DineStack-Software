/**
 * DineStack Build-Time Config Generator
 * 
 * Reads secrets from backend/.env and generates an encrypted config file
 * that gets bundled with the Electron app.
 * 
 * Usage: node scripts/generate-config.js
 */

const fs = require('fs');
const path = require('path');
const { encrypt } = require('./config-crypto');

// Paths
const BACKEND_ENV_PATH = path.join(__dirname, '..', 'backend', '.env');
const OUTPUT_PATH = path.join(__dirname, '..', 'backend', 'config.enc.json');

/**
 * Parse .env file into key-value pairs
 */
function parseEnvFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = {};

    content.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) return;

        const key = line.substring(0, eqIndex).trim();
        let value = line.substring(eqIndex + 1).trim();

        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        result[key] = value;
    });

    return result;
}

/**
 * Main function
 */
function main() {
    console.log('🔐 DineStack Config Generator');
    console.log('─'.repeat(40));

    // Check if backend/.env exists
    if (!fs.existsSync(BACKEND_ENV_PATH)) {
        console.error('❌ Error: backend/.env not found');
        console.error(`   Expected at: ${BACKEND_ENV_PATH}`);
        process.exit(1);
    }

    // Parse environment variables
    const env = parseEnvFile(BACKEND_ENV_PATH);

    // Validate required variables
    if (!env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL not found in backend/.env');
        process.exit(1);
    }

    console.log('✓ Found DATABASE_URL');

    // Prepare config object with required values
    const config = {
        DATABASE_URL: env.DATABASE_URL,
        JWT_SECRET: env.JWT_SECRET || 'dinestack-default-jwt-secret',
        FRONTEND_URL: env.FRONTEND_URL || 'https://order.dinestack.in'
    };

    // Encrypt each sensitive value
    const encryptedConfig = {
        version: 1,
        generated: new Date().toISOString(),
        data: {}
    };

    for (const [key, value] of Object.entries(config)) {
        encryptedConfig.data[key] = encrypt(value);
        console.log(`✓ Encrypted ${key}`);
    }

    // Write encrypted config
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(encryptedConfig, null, 2));

    console.log('─'.repeat(40));
    console.log(`✅ Generated: ${OUTPUT_PATH}`);
    console.log('');
}

main();
