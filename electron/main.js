const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Optional
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    // Load your frontend (React, Vue, or Angular)
    const frontendPath = isDev
        ? 'http://localhost:3000' // During development
        : `file://${path.join(__dirname, '../client/build/index.html')}`; // After build

    mainWindow.loadURL(frontendPath);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const startBackend = () => {
    const backendPath = path.join(__dirname, '../server/src/index.js');
    const backend = spawn('node', [backendPath]);

    backend.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backend.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backend.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
};

startBackend();
