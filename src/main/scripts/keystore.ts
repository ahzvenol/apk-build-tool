import fs from 'fs/promises'
import { executeCommand } from './exec'
import { Dname, Keystore } from '../../shared/types/build'

const dnameToString = (dname: Dname): string | null => {
  const parts: string[] = []

  if (!dname.firstAndLastName?.length) return null

  parts.push(`CN=${dname.firstAndLastName}`)
  if (dname.organizationalUnit?.length) parts.push(`OU=${dname.organizationalUnit}`)
  if (dname.organization?.length) parts.push(`O=${dname.organization}`)
  if (dname.cityOrLocality?.length) parts.push(`L=${dname.cityOrLocality}`)
  if (dname.stateOrProvince?.length) parts.push(`ST=${dname.stateOrProvince}`)
  if (dname.countryCode?.length) parts.push(`C=${dname.countryCode}`)

  return parts.join(',')
}

export const createKeystore = async (
  keytoolPath: string,
  keystore: Keystore
): Promise<Keystore | null> => {
  await fs.rm(keystore.storeFile, { force: true })

  const validity = (keystore.validity * 365).toString()

  const dname = dnameToString(keystore.dname)

  if (!dname) return null

  try {
    await executeCommand(
      keytoolPath,
      [
        '-genkey',
        '-v',
        '-keystore',
        keystore.storeFile,
        '-alias',
        keystore.keyAlias,
        '-keyalg',
        'RSA',
        '-keysize',
        '2048',
        '-validity',
        validity,
        '-storepass',
        keystore.storePassword,
        '-keypass',
        keystore.keyPassword,
        '-dname',
        dname
      ],
      'Keystore creation'
    )
    console.log('Keystore created successfully at:', keystore.storeFile)
  } catch (error) {
    console.error('Keystore creation failed', error)
    return null
  }

  return keystore
}
