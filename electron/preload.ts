import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  dialog: {
    openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options?: any) => ipcRenderer.invoke('dialog:saveFile', options)
  },
  onAuthGoogleSuccess: (callback: (token: string) => void) => {
    const listener = (_event: any, token: string) => callback(token);
    ipcRenderer.on('auth:google-success', listener);
    return () => ipcRenderer.removeListener('auth:google-success', listener);
  },
  platform: process.platform
});
