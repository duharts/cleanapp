const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js')
        },
    });
    console.log(path.join(__dirname, 'preload.js'))
    // Load the React frontend (assuming build output is in `client/build`)
    mainWindow.loadFile(path.join(__dirname, 'client', 'build', 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startNodeServer() {
    // Start the backend server using Node.js
    serverProcess = spawn('node', [path.join(__dirname, 'server', 'src', 'index.js')], {
        cwd: path.join(__dirname), // Set the working directory to root
        stdio: 'inherit' // Pipe server output to console
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start backend server:', err);
    });
}

function stopNodeServer() {
    if (serverProcess) {
        serverProcess.kill(); // Kill the backend server process
        serverProcess = null;
    }
}

app.on('ready', () => {
    startNodeServer(); // Start the server
    setTimeout(() => {
        createWindow();
    }, 3000);
});

app.on('window-all-closed', () => {
    stopNodeServer(); // Stop the server when all windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
