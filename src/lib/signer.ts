import fs from 'fs/promises'
import { executeCommand } from './exec'
import path from 'path'
import { Dname, Keystore } from './types'
import { getKeytoolPath, getLibPath } from './path'

export const dnameToString = (dname: Dname): string | null => {
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

  if (!keystore.validity) return null

  const validity = (keystore.validity * 365).toString()

  if (!keystore.dname) return null

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

export const signApk = async (
  javaPath: string,
  apksignerPath: string,
  keystore: Keystore,
  alignedApkPath: string,
  signedApkPath: string
): Promise<void> => {
  await executeCommand(
    javaPath,
    [
      '-jar',
      apksignerPath,
      'sign',
      '--ks',
      keystore.storeFile,
      '--ks-key-alias',
      keystore.keyAlias,
      '--ks-pass',
      `pass:${keystore.storePassword}`,
      '--key-pass',
      `pass:${keystore.keyPassword}`,
      '--v1-signing-enabled',
      'true',
      '--v2-signing-enabled',
      'true',
      '--v3-signing-enabled',
      'true',
      '--v4-signing-enabled',
      'true',
      '--out',
      signedApkPath,
      alignedApkPath
    ],
    'APK signing'
  )
}

export const createDebugKeystore = async (): Promise<Keystore | null> => {
  const keystorePath = path.join(getLibPath(), 'debug.keystore')
  const keystore: Keystore = {
    storeFile: keystorePath,
    storePassword: 'android',
    keyAlias: 'androiddebugkey',
    keyPassword: 'android'
  }

  const keytoolPath = await getKeytoolPath()

  if (!keytoolPath) {
    return null
  }

  return await createKeystore(keytoolPath, keystore)
}
