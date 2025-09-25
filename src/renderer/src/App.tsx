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
import { ProgressData, AppInfo, SignConfig, BuildOptions } from 'src/shared/types/build'
import { buildApk, openOutputFolder, selectFolder, selectKeystore } from './invoke'
import { descriptions, Languages } from '../../shared/locales'
import { NewKeystore } from './components/NewKeystore'
import { useReactiveWrapper} from 'micro-reactive-wrapper'
import { t, language } from './translation'

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

const distPath = useReactive<string | null>(null)
const appInfo = useReactive<AppInfo>(initialAppInfo)
const signConfig = useReactive<SignConfig>(initialSignConfig)

const progress = useReactive<ProgressData | null>(null)

const App = (): JSX.Element => {
  window.electron.ipcRenderer.on('build-progress', (_event, progressData) => {
    console.log('Build Progress:', progressData)
    progress(progressData)
  })

  const isValidPackageName = (packageName: string): boolean => {
    const regex = /^(?=[a-z])(?=.*\.)[a-z0-9_.]*[a-z0-9]$/
    return regex.test(packageName)
  }

  const build = async (): Promise<void> => {
    const options: BuildOptions = {
      distPath: distPath()!,
      appInfo: appInfo(),
      signConfig: signConfig()
      // outputPath: distPath!
    }
    await buildApk(options)
    openOutputFolder(distPath()!)
  }

  const disableBuild = (): boolean =>
    !distPath() ||
    distPath()!.length === 0 ||
    !appInfo() ||
    appInfo().appName.length === 0 ||
    appInfo().packageName.length === 0 ||
    !isValidPackageName(appInfo().packageName) ||
    appInfo().versionName.length === 0 ||
    appInfo().versionCode === 0 ||
    !signConfig() ||
    signConfig().storeFile.length === 0 ||
    signConfig().storePassword.length < 6 ||
    signConfig().keyAlias.length === 0 ||
    signConfig().keyPassword.length < 6 ||
    progress()?.stage === 'RUNNING' ||
    progress()?.stage === 'INITIALIZING'

  return useObserver(() => (
    <div className={styles.app}>
      <div className={styles.main}>
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
            {t.title()} {version}
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
                  {descriptions[language()]}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {Object.keys(descriptions).map((description) => (
                    <MenuItem
                      key={description}
                      onClick={() => {
                        language(description as Languages)
                      }}
                    >
                      {description}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
        <Text>{t.project_path()}</Text>
        <div className={styles.input}>
          <Input
            style={{ flex: 1 }}
            value={distPath() || ''}
            onChange={(_ev, data) => distPath(data.value)}
          />

          <Button
            appearance="primary"
            style={{ minWidth: '0' }}
            onClick={async () => {
              const result = await selectFolder()
              if (!result) return
              distPath(result)
              console.log(distPath())
              progress(null)
            }}
          >
            {t.select()}
          </Button>
        </div>
        <>
          <Text>{t.app_name()}</Text>
          <div className={styles.input}>
            <Input
              type="text"
              style={{ flex: 1 }}
              value={appInfo.appName()}
              onChange={(_ev, data) => {
                appInfo.appName(data.value)
              }}
            />
          </div>

          <Text>
            {t.package_name()}
            <InfoLabel info={t.package_name_info()} />
          </Text>
          <div className={styles.input}>
            <Input
              spellCheck={false}
              type="text"
              style={{ flex: 1 }}
              value={appInfo.packageName()}
              onChange={(_ev, data) => {
                appInfo.packageName(data.value)
              }}
            />
          </div>

          <Text>{t.version_name()}</Text>
          <div className={styles.input}>
            <Input
              type="text"
              style={{ flex: 1 }}
              value={appInfo.versionName()}
              onChange={(_ev, data) => {
                appInfo.versionName(data.value)
              }}
            />
          </div>

          <Text>
            {t.version_code()}
            <InfoLabel info={t.version_code_info()} />
          </Text>
          <div className={styles.input}>
            <Input
              type="number"
              step={1}
              min={1}
              style={{ flex: 1 }}
              value={appInfo.versionCode().toString()}
              onChange={(_ev, data) => {
                appInfo.versionCode(Number(data.value) || 1)
              }}
            />
          </div>
        </>
        <>
          <Text>{t.keystore_file_path()}</Text>
          <div className={styles.input}>
            <Input
              type="text"
              style={{ flex: 1 }}
              value={signConfig.storeFile()}
              onChange={(_ev, data) => {
                signConfig.storeFile(data.value)
              }}
            />

            <NewKeystore setKeystore={signConfig} />

            <Button
              appearance="primary"
              style={{ minWidth: '0' }}
              onClick={async () => {
                const result = await selectKeystore()
                if (!result) return
                signConfig.storeFile(result)
              }}
            >
              {t.select()}
            </Button>
          </div>

          <Text>
            {t.keystore_password()} <InfoLabel info={t.keystore_password_info()} />
          </Text>
          <div className={styles.input}>
            <Input
              type="password"
              style={{ flex: 1 }}
              value={signConfig.storePassword()}
              onChange={(_ev, data) => {
                signConfig.storePassword(data.value)
              }}
            />
          </div>

          <Text>
            {t.key_alias()} <span style={{ color: 'red' }}>*</span>
          </Text>
          <div className={styles.input}>
            <Input
              type="text"
              style={{ flex: 1 }}
              value={signConfig.keyAlias()}
              onChange={(_ev, data) => {
                signConfig.keyAlias(data.value)
              }}
            />
          </div>

          <Text>
            {t.key_password()} <InfoLabel info={t.keystore_password_info()} />
          </Text>
          <div className={styles.input}>
            <Input
              type="password"
              style={{ flex: 1 }}
              value={signConfig.keyPassword()}
              onChange={(_ev, data) => {
                signConfig.keyPassword(data.value)
              }}
            />
          </div>
        </>
      </div>

      {distPath() && appInfo() && (
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
              disabled={disableBuild()}
            >
              {t.build_apk()}
            </Button>
            {progress() && (
              <Button
                appearance="primary"
                style={{ width: '100%' }}
                onClick={() => openOutputFolder(distPath()!)}
              >
                {t.open_output_folder()}
              </Button>
            )}
          </div>

          <Field
            validationMessage={`${progress()?.message ? t()[progress()!.message] : ''}`}
            validationState={
              progress()?.stage === 'ERROR'
                ? 'error'
                : progress()?.stage === 'COMPLETED'
                  ? 'success'
                  : 'none'
            }
          >
            <ProgressBar
              value={(progress()?.percentage ?? 0) / 100}
              color={
                progress()?.stage === 'ERROR'
                  ? 'error'
                  : progress()?.stage === 'COMPLETED'
                    ? 'success'
                    : 'brand'
              }
            />
          </Field>
        </div>
      )}
    </div>
  ))
}

export default App
