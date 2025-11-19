import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Text,
  InfoLabel,
  Input,
} from '@fluentui/react-components'
import { createKeystore, selectSaveKeystore } from '../invoke'
import styles from '../app.module.css'
import { Keystore, SignConfig } from 'src/shared/types/build' // 使用新的类型
import { t } from '@renderer/translation'
import { deepSignal } from 'deepsignal'
import { Reactive, useReactiveWrapper } from 'micro-reactive-wrapper'

// 定义 Props 接口
interface NewKeystoreDialogProps {
  // 接收父组件的响应式 setter 函数
  setKeystore: (newKeystore: SignConfig) => void
}

// 定义初始空状态
const emptyKeystore: Keystore = {
  storeFile: '',
  storePassword: '',
  keyAlias: '',
  keyPassword: '',
  validity: 25,
  dname: {
    firstAndLastName: '',
    organizationalUnit: '',
    organization: '',
    cityOrLocality: '',
    stateOrProvince: '',
    countryCode: ''
  }
}
const useReactive: <T>(value: T) => Reactive<T> = useReactiveWrapper(deepSignal)
export const NewKeystore = ({ setKeystore }: NewKeystoreDialogProps): React.JSX.Element => {
  const open = useReactive(false)
  const newKeystore = useReactive<Keystore>(JSON.parse(JSON.stringify(emptyKeystore))) // 使用深拷贝确保初始值独立

  const isCreateDisabled = (): boolean =>
    !newKeystore.storeFile() ||
    (newKeystore.storePassword()?.length ?? 0) < 6 ||
    !newKeystore.keyAlias() ||
    (newKeystore.keyPassword()?.length ?? 0) < 6 ||
    !newKeystore.dname() ||
    !newKeystore.dname.firstAndLastName()

  const handleCreate = async (): Promise<void> => {
    const result = await createKeystore(newKeystore())
    if (result) {
      setKeystore(result)
      open(false)
    }
  }

  return (
    <Dialog
      open={open()}
      onOpenChange={(_event, data) => {
        open(data.open)
        if (!data.open) {
          // 对话框关闭时重置表单
          newKeystore(JSON.parse(JSON.stringify(emptyKeystore)))
        }
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" style={{ minWidth: '0' }}>
          {t.new()}
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t.create_keystore_dialog_title()}</DialogTitle>
          <DialogContent className={styles.container}>
            <Text>
              {t.keystore_file_path()} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.storeFile()}
                onChange={(_ev, data) => newKeystore.storeFile(data.value)}
              />
              <Button
                appearance="primary"
                style={{ minWidth: '0' }}
                onClick={async () => {
                  const result = await selectSaveKeystore()
                  if (result) newKeystore.storeFile(result)
                }}
              >
                {t.select()}
              </Button>
            </div>

            <Text>
              {t.keystore_password()} <InfoLabel info={t.keystore_password_info()} required />
            </Text>
            <div className={styles.input}>
              <Input
                type="password"
                style={{ flex: 1 }}
                value={newKeystore.storePassword()}
                onChange={(_ev, data) => newKeystore.storePassword(data.value)}
              />
            </div>

            <Text>
              {t.key_alias()} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.keyAlias()}
                onChange={(_ev, data) => newKeystore.keyAlias(data.value)}
              />
            </div>

            <Text>
              {t.key_password()}
              <InfoLabel info={t.keystore_password_info()} required />
            </Text>
            <div className={styles.input}>
              <Input
                type="password"
                style={{ flex: 1 }}
                value={newKeystore.keyPassword()}
                onChange={(_ev, data) => newKeystore.keyPassword(data.value)}
              />
            </div>

            <Text>
              {t.validity_years()} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.input}>
              <Input
                type="number"
                step={1}
                min={1}
                style={{ flex: 1 }}
                value={newKeystore.validity()?.toString() || ''}
                onChange={(_ev, data) => newKeystore.validity(Number(data.value))}
              />
            </div>

            <Text>
              {t.first_and_last_name()} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname.firstAndLastName() || ''}
                onChange={(_ev, data) => newKeystore.dname.firstAndLastName(data.value)}
              />
            </div>

            <Text>{t.organizational_unit()}</Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname.organizationalUnit() || ''}
                onChange={(_ev, data) => newKeystore.dname.organizationalUnit(data.value)}
              />
            </div>

            <Text>{t.organization()}</Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname.organization() || ''}
                onChange={(_ev, data) => newKeystore.dname.organization(data.value)}
              />
            </div>

            <Text>{t.city_or_locality()}</Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname.cityOrLocality() || ''}
                onChange={(_ev, data) => newKeystore.dname.cityOrLocality(data.value)}
              />
            </div>

            <Text>{t.state_or_province()}</Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname.stateOrProvince() || ''}
                onChange={(_ev, data) => newKeystore.dname.stateOrProvince(data.value)}
              />
            </div>

            <Text>{t.country_code()}</Text>
            <div className={styles.input}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname.countryCode() || ''}
                onChange={(_ev, data) => newKeystore.dname.countryCode(data.value)}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button onClick={() => open(false)}>{t.cancel()}</Button>
            </DialogTrigger>
            <Button appearance="primary" disabled={isCreateDisabled()} onClick={handleCreate}>
              {t.create()}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
