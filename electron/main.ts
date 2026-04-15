import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const __dirname = path.dirname(__filename);
const resourcesPath = 'resourcesPath' in process
  ? (process as NodeJS.Process & { resourcesPath: string }).resourcesPath
  : app.getAppPath();

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

function resolveResourcePath(...segments: string[]) {
  return app.isPackaged
    ? path.join(resourcesPath, ...segments)
    : path.join(__dirname, '..', ...segments);
}

function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true
  });

  const splashPath = resolveResourcePath('build', 'splash.html');

  if (fs.existsSync(splashPath)) {
    splashWindow.loadFile(splashPath);
  } else {
    splashWindow.loadURL('data:text/html,<h1 style="color:white;text-align:center;">Loading...</h1>');
  }
}

function createWindow() {
  const isDev = !app.isPackaged;

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
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-fail-load', (_event: unknown, errorCode: number, errorDescription: string, validatedURL: string) => {
    console.error('Focused Scholar failed to load window contents.', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  // Show main window when ready, close splash
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow?.show();
  });

  // Build menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit', label: 'Exit Focused Scholar' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        ...(isDev ? [{ role: 'toggleDevTools' } as any] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Focused Scholar',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About Focused Scholar V3',
              message: 'Focused Scholar V3',
              detail: 'Premium IGCSE AI Academic Assistant and Board Revision Platform\n\nVersion 3.0.0\n\n© 2026 Focused Scholar Team',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Start the server in production
  if (!isDev) {
    const serverPath = resolveResourcePath('dist-server', 'index.cjs');
    const envPath = resolveResourcePath('.env');
    
    console.log('Starting server from:', serverPath);
    
    // Start server as child process
    const serverProcess = spawn('node', [serverPath], {
      cwd: resolveResourcePath(),
      stdio: 'inherit'
    });
    
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  
  createSplashScreen();
  
  // Wait a bit for splash to show, then create main window
  setTimeout(() => {
    createWindow();
  }, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashScreen();
      setTimeout(() => {
        createWindow();
      }, 1500);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('dialog:openFile', async (_: unknown, options?: OpenDialogOptions) => {
  const result = await dialog.showOpenDialog(mainWindow!, options || {});
  return result.filePaths;
});

ipcMain.handle('dialog:saveFile', async (_: unknown, options?: SaveDialogOptions) => {
  const result = await dialog.showSaveDialog(mainWindow!, options || {});
  return result.filePath;
});
