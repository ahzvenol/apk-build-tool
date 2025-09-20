import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const isWindows = process.platform === 'win32'
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

if (!isWindows && !isMac && !isLinux) {
  throw console.error('Unsupported operating system:', process.platform)
}

import './ipc'

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit())

// Set app user model id for windows
app.setAppUserModelId('com.electron.yourapp')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 720,
    minWidth: 600,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Defer showing the window until the renderer process has finished its initial paint.
  // This prevents a "white flash" effect during app startup for a smoother user experience.
  window.on('ready-to-show', () => window.show())

  // Prevents new windows from being created.
  // All links that would open in a new window (e.g., target="_blank") will be blocked.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  optimizer.watchWindowShortcuts(window)
})
