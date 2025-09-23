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
  Input
} from '@fluentui/react-components'
import { useState } from 'react'
import { createKeystore, selectSaveKeystore } from '../invoke'
import styles from '../app.module.css'
import { Keystore, SignConfig } from 'src/shared/types/build'
import { Translations, Languages } from 'src/shared/locales'

// 定义 Props 接口
interface NewKeystoreDialogProps {
  setKeystore: (newKeystore: SignConfig) => void
  t: Translations[Languages]
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

export const NewKeystore = ({ setKeystore, t }: NewKeystoreDialogProps): React.JSX.Element => {
  const [open, setOpen] = useState(false)
  const [newKeystore, setNewKeystore] = useState<Keystore>(emptyKeystore)

  return (
    <Dialog
      open={open}
      onOpenChange={(_event, isOpen) => {
        setOpen(isOpen.open)
        setNewKeystore(emptyKeystore)
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" style={{ minWidth: '0' }}>
          {t.new}
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t.create_keystore_dialog_title}</DialogTitle>
          <DialogContent className={styles.container}>
            <Text>
              {t.keystore_file_path} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.storeFile}
                onChange={(_ev, data) => {
                  setNewKeystore({ ...newKeystore, storeFile: data.value })
                }}
              />
              <Button
                appearance="primary"
                style={{ minWidth: '0' }}
                onClick={async () => {
                  const result = await selectSaveKeystore()
                  if (!result) return
                  setNewKeystore({ ...newKeystore, storeFile: result })
                }}
              >
                {t.select}
              </Button>
            </div>

            <Text>
              {t.keystore_password} <InfoLabel info={t.keystore_password_info} required />
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="password"
                style={{ flex: 1 }}
                value={newKeystore.storePassword}
                onChange={(_ev, data) => {
                  setNewKeystore({ ...newKeystore, storePassword: data.value })
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
                value={newKeystore.keyAlias}
                onChange={(_ev, data) => {
                  setNewKeystore({ ...newKeystore, keyAlias: data.value })
                }}
              />
            </div>

            <Text>
              {t.key_password}
              <InfoLabel info={t.keystore_password_info} required />
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="password"
                style={{ flex: 1 }}
                value={newKeystore.keyPassword}
                onChange={(_ev, data) => {
                  setNewKeystore({ ...newKeystore, keyPassword: data.value })
                }}
              />
            </div>

            <Text>
              {t.validity_years} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="number"
                step={1}
                min={1}
                style={{ flex: 1 }}
                value={newKeystore.validity?.toString()}
                onChange={(_ev, data) => {
                  setNewKeystore({ ...newKeystore, validity: Number(data.value) })
                }}
              />
            </div>

            <Text>
              {t.first_and_last_name} <span style={{ color: 'red' }}>*</span>
            </Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname?.firstAndLastName || ''}
                onChange={(_ev, data) => {
                  setNewKeystore({
                    ...newKeystore,
                    dname: { ...newKeystore.dname, firstAndLastName: data.value }
                  })
                }}
              />
            </div>

            <Text>{t.organizational_unit}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname?.organizationalUnit || ''}
                onChange={(_ev, data) => {
                  setNewKeystore({
                    ...newKeystore,
                    dname: { ...newKeystore.dname, organizationalUnit: data.value }
                  })
                }}
              />
            </div>

            <Text>{t.organization}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname?.organization || ''}
                onChange={(_ev, data) => {
                  setNewKeystore({
                    ...newKeystore,
                    dname: { ...newKeystore.dname, organization: data.value }
                  })
                }}
              />
            </div>

            <Text>{t.city_or_locality}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname?.cityOrLocality || ''}
                onChange={(_ev, data) => {
                  setNewKeystore({
                    ...newKeystore,
                    dname: { ...newKeystore.dname, cityOrLocality: data.value }
                  })
                }}
              />
            </div>

            <Text>{t.state_or_province}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname?.stateOrProvince || ''}
                onChange={(_ev, data) => {
                  setNewKeystore({
                    ...newKeystore,
                    dname: { ...newKeystore.dname, stateOrProvince: data.value }
                  })
                }}
              />
            </div>

            <Text>{t.country_code}</Text>
            <div className={styles.inputContainer}>
              <Input
                type="text"
                style={{ flex: 1 }}
                value={newKeystore.dname?.countryCode || ''}
                onChange={(_ev, data) => {
                  setNewKeystore({
                    ...newKeystore,
                    dname: { ...newKeystore.dname, countryCode: data.value }
                  })
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button onClick={() => setNewKeystore(emptyKeystore)}>{t.cancel}</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              disabled={
                !newKeystore.storeFile ||
                !newKeystore.storePassword ||
                newKeystore.storePassword.length < 6 ||
                !newKeystore.keyAlias ||
                !newKeystore.keyPassword ||
                newKeystore.keyPassword.length < 6 ||
                !newKeystore.dname ||
                !newKeystore.dname.firstAndLastName
              }
              onClick={async () => {
                const keystore = await createKeystore(newKeystore)
                if (!keystore) return
                setKeystore(keystore)
                setOpen(false)
              }}
            >
              {t.create}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
