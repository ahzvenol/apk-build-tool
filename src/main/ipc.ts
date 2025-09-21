import { shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { build } from '../lib/build'
import { createKeystore } from '../lib/signer'
import { getKeytoolPath } from '../lib/path'
import { BuildOptions, BuildResult, Keystore, ProgressCallback } from '../lib/types'

// todo:给出合适的命名，涉及dist至少验证存在index.html
ipcMain.handle('select-folder', async () => {
  const folderPaths = dialog.showOpenDialogSync({
    properties: ['openDirectory']
  })

  return folderPaths ? folderPaths[0] : null
})

ipcMain.handle('build-apk', async (_event, options: BuildOptions): Promise<BuildResult> => {
  const window = BrowserWindow.fromWebContents(_event.sender)

  const onProgress: ProgressCallback = (progressData): void => {
    window?.webContents.send('build-progress', progressData)
  }

  const result = await build(options, onProgress)
  return result
})

ipcMain.handle('select-keystore', async () => {
  const filePaths = dialog.showOpenDialogSync({
    properties: ['openFile'],
    filters: [{ name: 'Keystore File', extensions: ['jks'] }]
  })
  return filePaths ? filePaths[0] : null
})

ipcMain.handle('select-save-keystore', async () => {
  const filePath = dialog.showSaveDialogSync({
    properties: ['createDirectory'],
    filters: [{ name: 'Keystore File', extensions: ['jks'] }]
  })
  return filePath
})

ipcMain.handle('create-keystore', async (_event, keystore: Keystore): Promise<Keystore | null> => {
  const keytoolPath = await getKeytoolPath()
  if (!keytoolPath) return null
  return await createKeystore(keytoolPath, keystore)
})

ipcMain.handle('open-output-folder', async (_event, projectPath) => {
  if (!projectPath) return
  const outputPath = projectPath
  console.log(outputPath)
  try {
    await shell.openPath(outputPath)
  } catch (error) {
    console.error(`Error opening folder '${outputPath}':`, error)
  }
})
