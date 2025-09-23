import path from 'path'
import which from 'which'
import fs from 'fs/promises'
import { app } from 'electron'
import { KnownError } from '../../shared/KnownError'

/**
 * Gets the correct root path of the application.
 * In development, it points to the project's root directory.
 * In production, it points to the directory containing the executable.
 * @returns {string} The application's root path.
 */
export const getAppRootPath = (): string =>
  app.isPackaged ? path.dirname(app.getPath('exe')) : process.cwd()

export const getLibPath = (): string => path.join(getAppRootPath(), 'lib')

export const getTemplateApkPath = (): Promise<string> =>
  Promise.resolve(path.join(getLibPath(), 'webgal-template.apk'))
    .then((path) => fs.access(path).then(() => path))
    .catch(() => {
      throw new KnownError('template_apk_not_found')
    })

export const getApkEditorPath = (): Promise<string> =>
  Promise.resolve(path.join(getLibPath(), 'APKEditor.jar'))
    .then((path) => fs.access(path).then(() => path))
    .catch(() => {
      throw new KnownError('apkeditor_not_found')
    })

export const getJavaPath = (): Promise<string> =>
  Promise.try(() => {
    switch (process.platform) {
      case 'win32':
        return path.join(getLibPath(), 'jdk-21', 'bin', 'java.exe')
      case 'darwin':
        return path.join(getLibPath(), 'jdk-21', 'Contents', 'Home', 'bin', 'java')
      case 'linux':
        return path.join(getLibPath(), 'jdk-21', 'bin', 'java')
      default:
        throw process.exit(1)
    }
  })
    .then((path) => fs.access(path).then(() => path))
    .catch(() => which('java'))
    .catch(() => {
      throw new KnownError('jdk_not_found')
    })

export const getKeytoolPath = (): Promise<string> =>
  Promise.try(() => {
    switch (process.platform) {
      case 'win32':
        return path.join(getLibPath(), 'jdk-21', 'bin', 'keytool.exe')
      case 'darwin':
        return path.join(getLibPath(), 'jdk-21', 'Contents', 'Home', 'bin', 'keytool')
      case 'linux':
        return path.join(getLibPath(), 'jdk-21', 'bin', 'keytool')
      default:
        throw process.exit(1)
    }
  })
    .then((path) => fs.access(path).then(() => path))
    .catch(() => which('keytool'))
    .catch(() => {
      throw new KnownError('jdk_not_found')
    })

export const getApksignerPath = (): Promise<string> =>
  Promise.resolve(path.join(getLibPath(), 'build-tools', 'lib', 'apksigner.jar'))
    .then((path) => fs.access(path).then(() => path))
    .catch(() => which('apksigner'))
    .catch(() => {
      throw new KnownError('build_tools_not_found')
    })

export const getZipalignPath = (): Promise<string> =>
  Promise.resolve(
    path.join(getLibPath(), 'build-tools', `zipalign${process.platform === 'win32' ? '.exe' : ''}`)
  )
    .then((path) => fs.access(path).then(() => path))
    .catch(() => which('zipalign'))
    .catch(() => {
      throw new KnownError('build_tools_not_found')
    })
