import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Use `contextBridge` APIs to expose Electron APIs to renderer.
// Asserting contextIsolation is enabled to ensure a secure environment.
contextBridge.exposeInMainWorld('electron', electronAPI)
