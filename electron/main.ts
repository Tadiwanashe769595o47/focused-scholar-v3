import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { autoUpdater } from 'electron-updater';

const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

// Configure autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = console;

autoUpdater.on('checking-for-update', () => console.log('Checking for update...'));
autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  dialog.showMessageBox(mainWindow!, {
    type: 'info',
    buttons: ['Download in Background'],
    defaultId: 0,
    title: 'Update Available',
    message: `A new version (${info.version}) of Focused Scholar is available.`,
    detail: 'It will download automatically in the background.'
  }).then(() => {
    autoUpdater.downloadUpdate();
  });
});
autoUpdater.on('update-not-available', () => console.log('No update available.'));
autoUpdater.on('error', (err) => console.error('Error in auto-updater:', err));
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
});

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

function resolveResourcePath(...segments: string[]) {
  return isDev
    ? path.join(__dirname, '..', ...segments)
    : path.join(process.resourcesPath, 'app.asar', ...segments);
}

function resolveUnpackedPath(...segments: string[]) {
  return isDev
    ? path.join(__dirname, '..', ...segments)
    : path.join(process.resourcesPath, 'app.asar.unpacked', ...segments);
}

function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashPath = resolveResourcePath('build', 'splash.html');

  if (fs.existsSync(splashPath)) {
    splashWindow.loadFile(splashPath);
  } else {
    splashWindow.loadURL('data:text/html,<body style="background:#0F172A;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:white;text-align:center;"><div><h1 style="margin:0;font-size:24px;">Focused Scholar V3</h1><p style="opacity:0.7;">Initialising Premium Experience...</p></div></body>');
  }
}

async function checkForUpdates() {
  if (isDev) return;
  try {
    const result = await autoUpdater.checkForUpdates();
    if (result && result.updateInfo) {
      const { response } = await dialog.showMessageBox(mainWindow!, {
        type: 'info',
        buttons: ['Update Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
        title: 'Update Available',
        message: `A new version (${result.updateInfo.version}) of Focused Scholar is available.`,
        detail: 'Would you like to download and install it now?'
      });
      if (response === 0) autoUpdater.downloadUpdate();
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow!, {
    type: 'info',
    buttons: ['Restart and Install', 'Later'],
    defaultId: 0,
    cancelId: 1,
    title: 'Update Ready',
    message: 'The update has been downloaded and is ready to install.',
    detail: 'The application will restart to apply the update.'
  }).then((v) => {
    if (v.response === 0) autoUpdater.quitAndInstall();
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    title: 'Focused Scholar V3',
    backgroundColor: '#F8FAFC',
    show: false,
    icon: resolveResourcePath('build', 'icon.png')
  });

  // Load app
  const distPath = isDev ? path.join(__dirname, '..', 'dist', 'index.html') : resolveResourcePath('dist', 'index.html');
  if (isDev && fs.existsSync(distPath)) {
    // Running from source with dist folder - load from dist
    mainWindow.loadFile(distPath);
  } else if (isDev) {
    // Running from source without dist - use vite dev server
    mainWindow.loadURL('http://localhost:5174');
  } else {
    // Installed app
    mainWindow.loadFile(resolveResourcePath('dist', 'index.html'));
  }

  // Handle external links and Google OAuth  
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow localhost redirects (Google callback)
    if (url.includes('localhost:3000')) {
      return { action: 'allow' };
    }
    // Open Google and other external links in browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // CRITICAL: Prevent Google auth from loading in app - redirect to external browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Block Google auth START from loading in the app
    if (url.includes('/api/auth/google') && !url.includes('/callback')) {
      event.preventDefault();
      shell.openExternal(url);
      return;
    }
    // Google CALLBACK should be ALLOWED to load - handles the token
    if (url.includes('/api/auth/google/callback')) {
      // Let it load - this is how we get the token
      return;
    }
    // Block Google account pages
    if (url.includes('accounts.google.com')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow?.show();
    setTimeout(checkForUpdates, 3000);
  });

  const menu = Menu.buildFromTemplate([
    { label: 'File', submenu: [{ role: 'quit', label: 'Exit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
    { 
      label: 'Help', 
      submenu: [
        { label: 'Check for Updates...', click: () => checkForUpdates() },
        { type: 'separator' },
        { 
          label: 'About', 
          click: () => dialog.showMessageBox(mainWindow!, { type: 'info', title: 'About', message: 'Focused Scholar V3', detail: 'Version 3.0.0\n© 2026 Focused Scholar Team' }) 
        }
      ] 
    }
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => { mainWindow = null; });
}

// Handle deep links for Google Auth (Production)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('focused-scholar', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('focused-scholar');
}

function handleDeepLink(url: string) {
  if (!mainWindow) return;
  const token = new URL(url).searchParams.get('token');
  const error = new URL(url).searchParams.get('error');
  
  if (token) {
    mainWindow.webContents.send('auth:google-success', token);
  } else if (error) {
    dialog.showErrorBox('Authentication Error', error);
  }
}

// Windows deep link handling
app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  const url = commandLine.pop();
  if (url && url.startsWith('focused-scholar://')) {
    handleDeepLink(url);
  }
});

app.whenReady().then(async () => {
  // Start server when running from installed app OR when running from source with bundles
  const serverPath = isDev ? path.join(__dirname, '..', 'dist-server', 'index.cjs') : resolveUnpackedPath('dist-server', 'index.cjs');
  const envPath = isDev ? path.join(__dirname, '..', '.env') : resolveUnpackedPath('.env');
  
  const serverExists = fs.existsSync(serverPath);
  const shouldStart = !isDev || serverExists;
  
  if (shouldStart && serverExists) {
    const serverCwd = isDev ? path.join(__dirname, '..') : resolveUnpackedPath();
    
    console.log('Server path:', serverPath);
    console.log('Env path:', envPath);
    console.log('CWD:', serverCwd);
    
    if (!fs.existsSync(serverPath)) {
      dialog.showErrorBox('Startup Error', `Server file not found at: ${serverPath}`);
      return;
    }

    // Load .env and pass to server
    const envConfig: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) envConfig[match[1].trim()] = match[2].trim();
      });
      console.log('Loaded env keys:', Object.keys(envConfig).join(', '));
    } else {
      console.log('Env file not found at:', envPath);
    }

    // Start server using Electron path as Node
    const serverProcess = spawn(process.execPath, [serverPath], {
      cwd: serverCwd,
      stdio: 'pipe',
      env: { 
        ...process.env,
        ...envConfig,
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1'
      }
    });

    serverProcess.stdout?.on('data', (data) => console.log(`Server: ${data}`));
    serverProcess.stderr?.on('data', (data) => console.error(`Server Error: ${data}`));
    
    serverProcess.on('error', (err) => {
      console.error('Failed to start server process:', err);
      dialog.showErrorBox('Server Error', `Failed to start server: ${err.message}`);
    });
    
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error('Server exited with code:', code);
        dialog.showErrorBox('Background Server Error', `The server failed with code ${code}. \n\nThis usually happens if Port 3000 is still in use by another app.`);
      }
    });

    // Wait for server and verify it's actually running
    let serverStarted = false;
    for (let i = 0; i < 15; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const testReq = await fetch('http://localhost:3000/api/health', { 
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        if (testReq.ok) {
          serverStarted = true;
          console.log('Server verified running after', i + 1, 'seconds');
          break;
        }
      } catch {
        console.log('Waiting for server...', i + 1);
      }
    }
    
    if (!serverStarted) {
      console.error('Server did not start in time');
      dialog.showErrorBox('Server Timeout', 'Server failed to start. Please restart the application.');
    }
  } else if (isDev) {
    console.log('Running in dev mode - expecting external server on port 3000');
  }
   
  createSplashScreen();
  setTimeout(() => createWindow(), 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashScreen();
      setTimeout(() => createWindow(), 1500);
    }
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('dialog:openFile', async (_, options) => (await dialog.showOpenDialog(mainWindow!, options || {})).filePaths);
ipcMain.handle('dialog:saveFile', async (_, options) => (await dialog.showSaveDialog(mainWindow!, options || {})).filePath);

