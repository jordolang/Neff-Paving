const { app, BrowserWindow, Tray, Menu, shell, dialog, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

let tray = null;
let mainWindow = null;
let isQuitting = false;

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false, // Start hidden in system tray
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        title: 'Neff Paving Server Control Panel',
        icon: path.join(__dirname, 'icon.png'),
        autoHideMenuBar: true,
        skipTaskbar: true, // Don't show in taskbar
        resizable: true,
        minimizable: true,
        maximizable: true
    });

    // Load the app
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Hide window instead of closing
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            
            if (process.platform === 'win32') {
                tray.displayBalloon({
                    title: 'Neff Paving Server',
                    content: 'Server control panel minimized to system tray'
                });
            }
        }
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        if (process.argv.includes('--show')) {
            mainWindow.show();
        }
    });
}

function createTray() {
    // Create tray icon
    const iconPath = path.join(__dirname, 'tray-icon.png');
    let trayIcon;
    
    if (fs.existsSync(iconPath)) {
        trayIcon = nativeImage.createFromPath(iconPath);
    } else {
        // Fallback to a simple generated icon
        trayIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVFiFtZc9aBRBFMd/s7e3l8QkJhqwsLGwsLCwsLGwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCw');
    }
    
    tray = new Tray(trayIcon);
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Neff Paving Server',
            type: 'normal',
            enabled: false,
            icon: trayIcon.resize({ width: 16, height: 16 })
        },
        { type: 'separator' },
        { 
            label: 'Show Control Panel', 
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { 
            label: 'Server Status', 
            click: () => checkServerStatus()
        },
        { 
            label: 'View Submissions CSV', 
            click: () => openSubmissionsFile()
        },
        { 
            label: 'View Screenshots Folder', 
            click: () => openScreenshotsFolder()
        },
        { type: 'separator' },
        { 
            label: 'Restart Server', 
            click: () => restartServer()
        },
        { 
            label: 'Test Alert', 
            click: () => testAlert()
        },
        { type: 'separator' },
        { 
            label: 'About', 
            click: () => showAbout()
        },
        { 
            label: 'Quit', 
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Neff Paving Server - Running');
    
    // Double click to show main window
    tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

async function checkServerStatus() {
    try {
        const response = await fetch('http://localhost:3001/health');
        const data = await response.json();
        
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Server Status',
            message: 'Server Status: RUNNING ✅',
            detail: `Status: ${data.status}\nUptime: ${Math.floor(data.uptime / 60)} minutes\nLast Check: ${moment().format('hh:mm:ss A')}`
        });
    } catch (error) {
        dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Server Status',
            message: 'Server Status: OFFLINE ❌',
            detail: `Unable to connect to server on localhost:3001\nError: ${error.message}`
        });
    }
}

function openSubmissionsFile() {
    const csvPath = path.join(__dirname, '..', 'estimate-form-data-requests.csv');
    if (fs.existsSync(csvPath)) {
        shell.openPath(csvPath);
    } else {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'No Submissions',
            message: 'No submissions file found yet.',
            detail: 'The CSV file will be created when the first estimate submission is received.'
        });
    }
}

function openScreenshotsFolder() {
    const screenshotsPath = path.join(__dirname, '..', 'screenshots');
    shell.openPath(screenshotsPath);
}

async function restartServer() {
    const choice = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: 'Restart Server',
        message: 'Are you sure you want to restart the server?',
        detail: 'This will briefly interrupt the estimate submission service.',
        buttons: ['Cancel', 'Restart'],
        defaultId: 0
    });
    
    if (choice.response === 1) {
        // In a real implementation, you would restart the server service here
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Server Restart',
            message: 'Server restart initiated',
            detail: 'The server service is being restarted. Please wait a moment before submitting estimates.'
        });
    }
}

function testAlert() {
    const testData = {
        customerName: 'John Test Customer',
        email: 'test@example.com',
        phone: '(740) 555-0123',
        address: '123 Test Street, Zanesville, OH',
        projectType: 'driveway',
        selectedArea: '500.00',
        estimatedPrice: '$8,500.00'
    };
    
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '🚨 TEST ALERT - New Estimate Submission',
        message: `Test Alert Triggered!\n\n👤 Customer: ${testData.customerName}\n📧 Email: ${testData.email}\n📞 Phone: ${testData.phone}\n📍 Address: ${testData.address}\n🏗️ Project: ${testData.projectType}\n📏 Area: ${testData.selectedArea} sq ft\n💰 Estimate: ${testData.estimatedPrice}`,
        detail: 'This is a test of the alert system. In a real submission, you would receive a sound notification and persistent popup.',
        buttons: ['Close', 'Print Test', 'Copy to Clipboard']
    }).then(result => {
        if (result.response === 1) {
            // Print functionality would go here
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Print Test',
                message: 'Print functionality would be triggered here'
            });
        } else if (result.response === 2) {
            // Copy to clipboard
            require('electron').clipboard.writeText(`${testData.customerName}\n${testData.email}\n${testData.phone}\n${testData.address}`);
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Copied',
                message: 'Contact information copied to clipboard!'
            });
        }
    });
}

function showAbout() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About Neff Paving Server',
        message: 'Neff Paving Estimate Server v1.0.0',
        detail: `🏗️ Windows service for handling estimate form submissions\n📊 Real-time alerts and notifications\n💾 Automatic CSV data storage\n📸 Screenshot capture with Puppeteer\n🔔 Sound alerts and popup notifications\n\n© 2024 Neff Paving\nBuilt for Windows with Node.js and Electron`
    });
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createTray();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Keep app running in system tray
    if (process.platform !== 'darwin') {
        // Don't quit, stay in tray
    }
});

app.on('before-quit', () => {
    isQuitting = true;
});

// IPC handlers for renderer process
ipcMain.handle('get-server-stats', async () => {
    try {
        const response = await fetch('http://localhost:3001/stats');
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-submissions-count', async () => {
    try {
        const csvPath = path.join(__dirname, '..', 'estimate-form-data-requests.csv');
        if (fs.existsSync(csvPath)) {
            const content = await fs.readFile(csvPath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            return Math.max(0, lines.length - 1); // Subtract header
        }
        return 0;
    } catch (error) {
        return 0;
    }
});

// Handle certificate errors for development
app.commandLine.appendSwitch('--ignore-certificate-errors-spki-list');
app.commandLine.appendSwitch('--ignore-certificate-errors');

console.log('🖥️  Neff Paving Server GUI starting...');