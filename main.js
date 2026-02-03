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

    // Determine persistent DB path in User Data
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'dinestack.db');

    console.log('Starting backend server from:', backendPath);
    console.log('Using persistent database at:', dbPath);

    backendProcess = spawn('node', [backendPath], {
        cwd: backendCwd,
        env: {
            ...process.env,
            NODE_ENV: 'production',
            PORT: '5001',
            DATABASE_URL: `file:${dbPath}`
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
