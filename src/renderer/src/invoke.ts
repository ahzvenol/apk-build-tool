import { BuildOptions, BuildResult, Keystore } from 'src/shared/types/build'

export const selectFolder = async (): Promise<string | null> => {
  return await window.electron.ipcRenderer.invoke('select-folder')
}

export const selectKeystore = async (): Promise<string | null> => {
  return await window.electron.ipcRenderer.invoke('select-keystore')
}

export const selectSaveKeystore = async (): Promise<string | null> =>
  await window.electron.ipcRenderer.invoke('select-save-keystore')

export const openOutputFolder = async (path: string): Promise<void> => {
  await window.electron.ipcRenderer.invoke('open-output-folder', path)
}

export const createKeystore = async (keystore: Keystore): Promise<Keystore | null> => {
  return await window.electron.ipcRenderer.invoke('create-keystore', keystore)
}

export const buildApk = async (options: BuildOptions): Promise<BuildResult> => {
  return await window.electron.ipcRenderer.invoke('build-apk', options)
}
