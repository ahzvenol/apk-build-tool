import { useEffect, useMemo, useState } from 'react'
import styles from './app.module.css'
import {
  Button,
  Field,
  InfoLabel,
  Input,
  Link,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  ProgressBar,
  Text,
  Title3
} from '@fluentui/react-components'
import { bundleIcon, LocalLanguageFilled, LocalLanguageRegular } from '@fluentui/react-icons'
import { version } from '~build/package'
import { BuildResult, ProgressData, AppInfo, SignConfig, BuildOptions } from 'src/lib/types'
import useLocalStorage from './hooks/useLocalStorage'
import { buildApk, openOutputFolder, selectFolder, selectKeystore } from './invoke'
import { getTranslations, Language, languages } from '../../locales/i18n'
import { NewKeystore } from './NewKeystore'

const LocalLanguageIcon = bundleIcon(LocalLanguageFilled, LocalLanguageRegular)

const initialAppInfo: AppInfo = {
  appName: '',
  packageName: '',
  versionName: '1.0.0',
  versionCode: 1
}

const initialSignConfig: SignConfig = {
  storeFile: '',
  storePassword: '',
  keyAlias: '',
  keyPassword: ''
}

const App = (): React.JSX.Element => {
  const [distPath, setDistPath] = useState<string | null>(null)
  const [appInfo, setAppInfo] = useLocalStorage<AppInfo>('appInfo', initialAppInfo)
  const [signConfig, setSignConfig] = useLocalStorage<SignConfig>('signConfig', initialSignConfig)

  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null)
  const [open, setOpen] = useState(false)

  const [language, setLanguage] = useLocalStorage<Language>('language', languages.zhCn)
  const t = useMemo(() => getTranslations(language), [language])

  const isValidPackageName = (packageName: string): boolean => {
    const regex = /^(?=[a-z])(?=.*\.)[a-z0-9_.]*[a-z0-9]$/
    return regex.test(packageName)
  }

  const build = async (): Promise<void> => {
    setBuildResult(null)
    const options: BuildOptions = {
      distPath: distPath!,
      appInfo: appInfo,
      signConfig: signConfig!
      // outputPath: distPath!
    }
    const result = await buildApk(options)
    console.log(result)
    setBuildResult(result)
    openOutputFolder(distPath!)
  }

  const disableBuild = useMemo(
    () =>
      !distPath ||
      distPath.length === 0 ||
      !appInfo ||
      appInfo.appName.length === 0 ||
      appInfo.packageName.length === 0 ||
      !isValidPackageName(appInfo.packageName) ||
      appInfo.versionName.length === 0 ||
      appInfo.versionCode === 0 ||
      !signConfig ||
      signConfig.storeFile.length === 0 ||
      signConfig.storePassword.length < 6 ||
      signConfig.keyAlias.length === 0 ||
      signConfig.keyPassword.length < 6 ||
      progress?.stage === 'RUNNING' ||
      progress?.stage === 'INITIALIZING',
    [distPath, appInfo, signConfig, progress]
  )

  useEffect(() => {
    window.electron.ipcRenderer.on('build-progress', (_event, progressData) => {
      console.log('Build Progress:', progressData)
      setProgress(progressData)
    })
  }, [])

  useEffect(() => {
    document.title = `${t.title} ${version}`
  }, [t])

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 0 0.5rem 0.25rem'
          }}
        >
          <Title3>
            {t.title} {version}
          </Title3>
          <div
            style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}
          >
            <Link
              href="https://github.com/OpenWebGAL/webgal-apk-build-tool"
              title="https://github.com/OpenWebGAL/webgal-apk-build-tool"
              target="_blank"
              style={{ fontWeight: 500 }}
            >
              GitHub
            </Link>
            <Menu positioning={{ autoSize: true }}>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<LocalLanguageIcon />} appearance="subtle" style={{ minWidth: '0' }}>
                  {language.name}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    onClick={() => {
                      setLanguage(languages.zhCn)
                    }}
                  >
                    简体中文
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setLanguage(languages.en)
                    }}
                  >
                    English
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
        <Text>{t.project_path}</Text>
        <div className={styles.inputContainer}>
          <Input
            style={{ flex: 1 }}
            value={distPath || ''}
            onChange={(_ev, data) => setDistPath(data.value)}
          />

          <Button
            appearance="primary"
            style={{ minWidth: '0' }}
            onClick={async () => {
              const result = await selectFolder()
              if (!result) return
              setDistPath(result)
              setBuildResult(null)
              setProgress(null)
            }}
          >
            {t.select}
          </Button>
        </div>
        {distPath && appInfo && (
          <>
            <Text>{t.app_name}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={appInfo.appName}
                onChange={(_ev, data) => {
                  const newProjectInfo = { ...appInfo, appName: data.value }
                  setAppInfo(newProjectInfo)
                }}
              />
            </div>

            <Text>
              {t.package_name}
              <InfoLabel info={t.package_name_info} />
            </Text>
            <div className={styles.inputContainer}>
              <Input
                spellCheck={false}
                type="text"
                style={{ flex: 1 }}
                value={appInfo.packageName}
                onChange={(_ev, data) => {
                  const newProjectInfo = { ...appInfo, packageName: data.value }
                  setAppInfo(newProjectInfo)
                }}
              />
            </div>

            <Text>{t.version_name}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={appInfo.versionName}
                onChange={(_ev, data) => {
                  const newProjectInfo = { ...appInfo, versionName: data.value }
                  setAppInfo(newProjectInfo)
                }}
              />
            </div>

            <Text>
              {t.version_code}
              <InfoLabel info={t.version_code_info} />
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="number"
                step={1}
                min={1}
                style={{ flex: 1 }}
                value={appInfo.versionCode.toString()}
                onChange={(_ev, data) => {
                  const newProjectInfo = {
                    ...appInfo,
                    versionCode: Number(data.value) || 1
                  }
                  setAppInfo(newProjectInfo)
                }}
              />
            </div>
          </>
        )}
        {signConfig && appInfo && (
          <>
            <Text>{t.keystore_file_path}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={signConfig.storeFile}
                onChange={(_ev, data) => {
                  setSignConfig({ ...signConfig, storeFile: data.value })
                }}
              />

              <NewKeystore open={open} setOpen={setOpen} setKeystore={setSignConfig}></NewKeystore>

              <Button
                appearance="primary"
                style={{ minWidth: '0' }}
                onClick={async () => {
                  const result = await selectKeystore()
                  if (!result) return
                  setSignConfig({ ...signConfig, storeFile: result })
                }}
              >
                {t.select}
              </Button>
            </div>

            <Text>
              {t.keystore_password} <InfoLabel info={t.keystore_password_info} />
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="password"
                style={{ flex: 1 }}
                value={signConfig.storePassword}
                onChange={(_ev, data) => {
                  setSignConfig({ ...signConfig, storePassword: data.value })
                }}
              />
            </div>

            <Text>
              {t.key_alias} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={signConfig.keyAlias}
                onChange={(_ev, data) => {
                  setSignConfig({ ...signConfig, keyAlias: data.value })
                }}
              />
            </div>

            <Text>
              {t.key_password} <InfoLabel info={t.keystore_password_info} />
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="password"
                style={{ flex: 1 }}
                value={signConfig.keyPassword}
                onChange={(_ev, data) => {
                  setSignConfig({ ...signConfig, keyPassword: data.value })
                }}
              />
            </div>
          </>
        )}
      </div>

      {distPath && appInfo && (
        <div
          style={{
            backgroundColor: '#f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            padding: '0.5rem',
            flexGrow: 0,
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
            <Button
              appearance="primary"
              onClick={build}
              style={{ width: '100%' }}
              disabled={disableBuild}
            >
              {t.build_apk}
            </Button>
            {progress && (
              <Button
                appearance="primary"
                style={{ width: '100%' }}
                onClick={() => openOutputFolder(distPath)}
              >
                {t.open_output_folder}
              </Button>
            )}
          </div>

          <Field
            validationMessage={`${progress?.message ? t[progress.message] : ''} ${buildResult?.path ? `- ${t.saved_to} ${buildResult.path} ` : ''}`}
            validationState={
              progress?.stage === 'ERROR'
                ? 'error'
                : progress?.stage === 'COMPLETED'
                  ? 'success'
                  : 'none'
            }
          >
            <ProgressBar
              value={(progress?.percentage ?? 0) / 100}
              color={
                progress?.stage === 'ERROR'
                  ? 'error'
                  : progress?.stage === 'COMPLETED'
                    ? 'success'
                    : 'brand'
              }
            />
          </Field>
        </div>
      )}
    </div>
  )
}

export default App
