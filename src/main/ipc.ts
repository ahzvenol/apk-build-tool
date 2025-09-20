import { shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { buildApk } from '../lib/build'
import { BuildResult, Keystore, ProgressCallback, ProjectInfo } from '../lib/types'
import { getAllProjectInfo, getProjectInfo, saveProjectInfo } from '../lib/project'
import { createKeystore, getKeyProperties, saveKeyProperties } from '../lib/signer'
import { getKeytoolPath } from '../lib/path'

ipcMain.handle('select-folder', async () => {
  const folderPaths = dialog.showOpenDialogSync({
    properties: ['openDirectory']
  })
  const projectInfo = folderPaths ? await getProjectInfo(folderPaths[0]) : null

  return projectInfo ? folderPaths : null
})

ipcMain.handle('build-apk', async (_event, path: string | null): Promise<BuildResult> => {
  if (!path)
    return {
      success: false,
      message: 'No path specified'
    }

  const window = BrowserWindow.fromWebContents(_event.sender)

  if (!window) {
    return {
      success: false,
      message: 'Could not find the sender window.'
    }
  }

  const onProgress: ProgressCallback = (progressData): void => {
    window.webContents.send('build-progress', progressData)
  }

  const result = await buildApk(path, onProgress)
  return result
})

ipcMain.handle(
  'get-project-info',
  async (_event, path: string | null): Promise<ProjectInfo | null> => {
    if (!path) return null
    return await getProjectInfo(path)
  }
)

ipcMain.handle(
  'get-all-project-info',
  async (_event, path: string | null): Promise<ProjectInfo[]> => {
    if (!path) return []
    return await getAllProjectInfo(path)
  }
)

ipcMain.handle(
  'get-key-properties',
  async (_event, path: string | null): Promise<Keystore | null> => {
    if (!path) return null
    return await getKeyProperties(path)
  }
)

ipcMain.handle(
  'save-project-info',
  async (_event, path: string | null, projectInfo: ProjectInfo): Promise<void> => {
    if (!path) return
    await saveProjectInfo(path, projectInfo)
  }
)

ipcMain.handle(
  'save-key-properties',
  async (_event, path: string | null, keystore: Keystore): Promise<void> => {
    if (!path) return
    await saveKeyProperties(path, keystore)
  }
)

ipcMain.handle('select-keystore', async () => {
  const filePaths = dialog.showOpenDialogSync({
    properties: ['openFile'],
    filters: [
      { name: 'Keystore File', extensions: ['jks'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return filePaths
})

ipcMain.handle('select-save-keystore', async () => {
  const filePaths = dialog.showSaveDialogSync({
    properties: ['createDirectory'],
    filters: [
      { name: 'Keystore File', extensions: ['jks'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return filePaths
})

ipcMain.handle('create-keystore', async (_event, keystore: Keystore): Promise<Keystore | null> => {
  const keytoolPath = await getKeytoolPath()
  if (!keytoolPath) return null
  return await createKeystore(keytoolPath, keystore, true)
})

ipcMain.handle('open-output-folder', async (_event, projectPath) => {
  if (!projectPath) return
  const outputPath = path.join(
    projectPath,
    '..',
    '..',
    '..',
    'Exported_Games',
    projectPath.split(path.sep).pop()!,
    'apk'
  )
  console.log(outputPath)
  try {
    await shell.openPath(outputPath)
  } catch (error) {
    console.error(`Error opening folder '${outputPath}':`, error)
  }
})
