const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess = null;

// Get the correct resource path based on whether we're in dev or packaged
function getResourcePath(relativePath) {
    if (app.isPackaged) {
        // In production, resources are in the app.asar or unpacked folder
        return path.join(process.resourcesPath, 'app.asar.unpacked', relativePath);
    }
    return path.join(__dirname, relativePath);
}

/**
 * Decrypts a single encrypted value from config.enc.json
 * Uses the same algorithm as scripts/config-crypto.js
 */
function decryptConfigValue(encryptedPayload) {
    const crypto = require('crypto');
    const APP_SECRET = 'DineStack-2026-SecureConfig-v1';

    const parts = encryptedPayload.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid encrypted payload format');
    }

    const [saltB64, ivB64, authTagB64, ciphertext] = parts;

    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const key = crypto.scryptSync(APP_SECRET, salt, 32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

function startBackendServer() {
    const isDev = !app.isPackaged;

    if (isDev) {
        // In development, assume backend is started separately
        console.log('Development mode: Please start backend separately with "cd backend && npm run dev"');
        return;
    }

    // In production, start the compiled backend server
    const backendPath = getResourcePath('backend/dist/server.desktop.js');
    const backendCwd = getResourcePath('backend');

    // Determine persistent Config path in User Data
    const userDataPath = app.getPath('userData');
    const userConfigPath = path.join(userDataPath, 'config.json');

    // Bundled encrypted config path
    const encryptedConfigPath = getResourcePath('backend/config.enc.json');

    let dbUrl = process.env.DATABASE_URL;
    let jwtSecret = process.env.JWT_SECRET;
    let frontendUrl = process.env.FRONTEND_URL;

    const fs = require('fs');

    // Priority 1: User override config (config.json in userData)
    try {
        if (fs.existsSync(userConfigPath)) {
            const config = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
            if (config.DATABASE_URL) {
                dbUrl = config.DATABASE_URL;
                console.log('Loaded DATABASE_URL from user config.json');
            }
            if (config.JWT_SECRET) jwtSecret = config.JWT_SECRET;
            if (config.FRONTEND_URL) frontendUrl = config.FRONTEND_URL;
        }
    } catch (err) {
        console.error('Failed to load user config.json:', err);
    }

    // Priority 2: Bundled encrypted config (config.enc.json)
    if (!dbUrl) {
        try {
            if (fs.existsSync(encryptedConfigPath)) {
                console.log('Loading bundled encrypted config...');
                const encConfig = JSON.parse(fs.readFileSync(encryptedConfigPath, 'utf8'));

                let decryptedConfig = {};

                // Handle Version 2 (Full Payload Encryption)
                if (encConfig.payload) {
                    try {
                        const decryptedJson = decryptConfigValue(encConfig.payload);
                        decryptedConfig = JSON.parse(decryptedJson);
                        console.log('✓ Decrypted secure config payload');
                    } catch (e) {
                        console.error('Failed to decrypt payload:', e);
                    }
                }
                // Handle Version 1 (Legacy Key-Value Encryption) - Fallback
                else if (encConfig.data) {
                    if (encConfig.data.DATABASE_URL) decryptedConfig.DATABASE_URL = decryptConfigValue(encConfig.data.DATABASE_URL);
                    if (encConfig.data.JWT_SECRET) decryptedConfig.JWT_SECRET = decryptConfigValue(encConfig.data.JWT_SECRET);
                    if (encConfig.data.FRONTEND_URL) decryptedConfig.FRONTEND_URL = decryptConfigValue(encConfig.data.FRONTEND_URL);
                }

                // Apply values
                if (decryptedConfig.DATABASE_URL) {
                    dbUrl = decryptedConfig.DATABASE_URL;
                    console.log('✓ Loaded DATABASE_URL from bundled config');
                }
                if (!jwtSecret && decryptedConfig.JWT_SECRET) {
                    jwtSecret = decryptedConfig.JWT_SECRET;
                }
                if (!frontendUrl && decryptedConfig.FRONTEND_URL) {
                    frontendUrl = decryptedConfig.FRONTEND_URL;
                }
            } else {
                console.log('No bundled config.enc.json found at:', encryptedConfigPath);
            }
        } catch (err) {
            console.error('Failed to decrypt bundled config:', err);
        }
    }

    if (!dbUrl) {
        console.error('CRITICAL: No DATABASE_URL found. Backend may fail to start.');
        console.error('Please ensure config.enc.json is bundled or create config.json in:', userDataPath);
    }

    console.log('Starting backend server from:', backendPath);

    backendProcess = spawn('node', [backendPath], {
        cwd: backendCwd,
        env: {
            ...process.env,
            NODE_ENV: 'production',
            PORT: '5001',
            DATABASE_URL: dbUrl,
            JWT_SECRET: jwtSecret || 'dinestack-default-jwt-secret',
            FRONTEND_URL: frontendUrl || 'https://order.dinestack.in'
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

function createWindow() {
    const isDev = !app.isPackaged;

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'public/assets/DineStack.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.setMenu(null); // Permanently hide the menu bar

    // Manually handle F11 to toggle full screen
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' && input.type === 'keyDown') {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
            event.preventDefault();
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        // In production, load the static export
        mainWindow.loadFile(path.join(__dirname, 'out', 'index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    startBackendServer();

    // Give backend a moment to start before loading the window
    setTimeout(createWindow, 1000);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    // Clean up the backend process when quitting
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});
