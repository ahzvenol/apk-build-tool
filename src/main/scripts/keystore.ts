import fs from 'fs/promises'
import { executeCommand } from './exec'
import { Dname, Keystore } from '../../shared/types/build'

const dnameToString = (dname: Dname): string | null => {
  const dnameParts: string[] = []

  if (dname.firstAndLastName?.length === 0) return null

  if (dname.firstAndLastName && dname.firstAndLastName.length > 0) {
    dnameParts.push(`CN=${dname.firstAndLastName}`)
  }
  if (dname.organizationalUnit && dname.organizationalUnit.length > 0) {
    dnameParts.push(`OU=${dname.organizationalUnit}`)
  }
  if (dname.organization && dname.organization.length > 0) {
    dnameParts.push(`O=${dname.organization}`)
  }
  if (dname.cityOrLocality && dname.cityOrLocality.length > 0) {
    dnameParts.push(`L=${dname.cityOrLocality}`)
  }
  if (dname.stateOrProvince && dname.stateOrProvince.length > 0) {
    dnameParts.push(`ST=${dname.stateOrProvince}`)
  }
  if (dname.countryCode && dname.countryCode.length > 0) {
    dnameParts.push(`C=${dname.countryCode}`)
  }
  return dnameParts.join(',')
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
