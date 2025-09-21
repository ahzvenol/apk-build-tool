import { Translations } from '../locales/i18n'

export interface AppInfo {
  appName: string
  packageName: string
  versionName: string
  versionCode: number
}

// todo:有两个不同用途的Keystore
export interface SignConfig {
  storeFile: string
  storePassword: string
  keyAlias: string
  keyPassword: string
}

export interface Keystore {
  storeFile: string
  storePassword: string
  keyAlias: string
  keyPassword: string
  validity?: number
  dname?: Dname
}

export interface BuildOptions {
  distPath: string
  // outputPath: string
  appInfo: AppInfo
  // iconsPath?: string
  signConfig?: SignConfig
}

export interface BuildResult {
  success: boolean
  message: string
  path?: string
  error?: unknown
}

export type BuildStage =
  | 'NOT_STARTED'
  | 'INITIALIZING'
  | 'RUNNING'
  | 'WARNING'
  | 'ERROR'
  | 'COMPLETED'

export interface ProgressData {
  message: keyof Translations
  stage: BuildStage
  percentage: number
}

export type ProgressCallback = (progressData: ProgressData) => void

export interface Dname {
  firstAndLastName?: string
  organizationalUnit?: string
  organization?: string
  cityOrLocality?: string
  stateOrProvince?: string
  countryCode?: string
}
