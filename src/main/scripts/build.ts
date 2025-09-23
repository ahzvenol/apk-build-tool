import fs from 'fs-extra'
import path from 'path'
import { replaceTextInFolder } from './files'
import { executeCommand } from './exec'
import { BuildOptions, ProgressCallback } from '../../shared/types/build'
import {
  getApkEditorPath,
  getApksignerPath,
  getJavaPath,
  getTemplateApkPath,
  getZipalignPath
} from './path'
import { KnownError } from '../../shared/KnownError'

const noOpProgress: ProgressCallback = () => {}

export const build = async (
  { appInfo, distPath, signConfig }: BuildOptions,
  onProgress: ProgressCallback = noOpProgress
): Promise<void> => {
  try {
    onProgress({ message: 'initializing', stage: 'INITIALIZING', percentage: 0 })

    const outputPath = path.dirname(distPath)

    onProgress({ message: 'checking_project_info', stage: 'RUNNING', percentage: 5 })
    onProgress({ message: 'preparing', stage: 'RUNNING', percentage: 10 })

    const templateApkPath = await getTemplateApkPath()
    const apkEditorPath = await getApkEditorPath()
    const javaPath = await getJavaPath()
    const apksignerPath = await getApksignerPath()
    const zipalignPath = await getZipalignPath()
    const buildPath = path.join(outputPath, 'build')

    const { appName, packageName, versionName, versionCode } = appInfo

    const apkFileName = [packageName, versionName, `build${versionCode}`].join('-')
    const unsignedApkPath = path.join(outputPath, `${apkFileName}-unsigned.apk`)
    const alignedApkPath = path.join(outputPath, `${apkFileName}-aligned.apk`)
    const signedApkPath = path.join(outputPath, `${apkFileName}-signed.apk`)
    const idsigPath = signedApkPath + '.idsig'

    console.log('\x1b[96m')
    console.log(`App name: ${appName}`)
    console.log(`Package name: ${packageName}`)
    console.log(`Version: ${versionName} (${versionCode})`)
    console.log(`Output directory: ${outputPath}`)
    console.log('\x1b[0m')

    onProgress({ message: 'cleaning_build_dir', stage: 'RUNNING', percentage: 10 })

    await Promise.allSettled([
      fs.rm(buildPath, { recursive: true, force: true }),
      fs.rm(unsignedApkPath, { force: true }),
      fs.rm(alignedApkPath, { force: true }),
      fs.rm(signedApkPath, { force: true }),
      fs.rm(idsigPath, { force: true })
    ])

    onProgress({ message: 'decompiling_template_apk', stage: 'RUNNING', percentage: 20 })

    // 反编译apk
    await executeCommand(
      javaPath,
      ['-jar', apkEditorPath, 'd', '-i', templateApkPath, '-o', buildPath],
      'APK decompilation'
    ).catch(() => {
      throw new KnownError('apk_decompilation_failed')
    })

    console.log('\x1b[93m%s\x1b[0m', '\nStarting to replace assets...\n')

    onProgress({ message: 'replacing_assets', stage: 'RUNNING', percentage: 30 })

    await Promise.allSettled([
      // 替换包名
      replaceTextInFolder(buildPath, 'com.openwebgal.demo', packageName),
      replaceTextInFolder(buildPath, 'com/openwebgal/demo', packageName.replace(/\./g, '/')),
      // 替换游戏名
      replaceTextInFolder(
        buildPath,
        '<string name="app_name">WebGAL</string>',
        `<string name="app_name">${appInfo.appName}</string>`
      ),
      // 替换版本信息
      replaceTextInFolder(
        buildPath,
        'android:versionCode="1"',
        `android:versionCode="${appInfo.versionCode}"`
      ),
      replaceTextInFolder(
        buildPath,
        'android:versionName="1.0"',
        `android:versionName="${appInfo.versionName}"`
      )
    ]).catch(() => {
      throw new KnownError('replacing_assets_failed')
    })

    console.log('Replacement completed')

    // 查找实际的包路径
    const sourcePath = await Promise.allSettled(
      [
        path.join(buildPath, 'smali', 'classes', 'com', 'openwebgal', 'demo'),
        path.join(buildPath, 'smali', 'classes2', 'com', 'openwebgal', 'demo')
      ].map((path) => fs.access(path).then(() => path))
    ).then((results) => results.find((res) => res.status === 'fulfilled')?.value)

    if (!sourcePath) {
      throw new KnownError('package_directory_not_found')
    } else {
      console.log(`Found package directory at: ${sourcePath}`)
    }

    // 移动文件夹
    const packagePath = packageName.split('.')
    // todo:泛化
    const targetDir = path
      .dirname(sourcePath)
      .replace(/com(\/|\\)openwebgal/, packagePath.slice(0, -1).join(path.sep))
    const targetPath = path.join(targetDir, packagePath[packagePath.length - 1])

    // 确保目标目录存在
    await fs.mkdir(targetDir, { recursive: true })

    console.log(`Moving files from ${sourcePath} to ${targetPath}`)
    await fs.rename(sourcePath, targetPath).catch(() => {
      throw new KnownError('replacing_assets_failed')
    })
    console.log('Files moved successfully')

    // todo:泛化
    // 复制游戏资源
    const destPath = path.join(buildPath, 'root', 'assets', 'webgal')

    console.log(`Copying game resources from ${distPath} to ${destPath}`)
    onProgress({ message: 'copying_game_assets', stage: 'RUNNING', percentage: 40 })

    await fs.copy(distPath, destPath).catch(() => {
      throw new KnownError('replacing_assets_failed')
    })
    console.log('Game resources copied successfully')

    // 复制图标
    const iconsPath = path.join(distPath, 'icons')
    const resPath = path.join(buildPath, 'resources', 'package_1', 'res')

    const iconSrcIsExists = await fs
      .access(path.join(iconsPath, 'ic_launcher-playstore.png'))
      .then(() => true)
      .catch(() => false)

    if (iconSrcIsExists) {
      console.log(`Copying icons from ${iconsPath} to ${resPath}`)
      onProgress({ message: 'copying_icons', stage: 'RUNNING', percentage: 60 })
      await fs.copy(iconsPath, resPath).catch(() => {
        throw new KnownError('replacing_assets_failed')
      })
    } else {
      console.log('Skip copying icons')
      onProgress({ message: 'skip_copying_icons', stage: 'RUNNING', percentage: 60 })
    }

    onProgress({ message: 'building_apk', stage: 'RUNNING', percentage: 70 })

    // 构建apk
    await executeCommand(
      javaPath,
      ['-jar', apkEditorPath, 'b', '-i', buildPath, '-o', unsignedApkPath],
      'Build APK'
    ).catch(() => {
      throw new KnownError('build_apk_failed')
    })

    onProgress({ message: 'aligning_apk', stage: 'RUNNING', percentage: 80 })

    // 对齐
    await executeCommand(
      zipalignPath,
      ['-v', '-p', '4', unsignedApkPath, alignedApkPath],
      'APK alignment'
    ).catch(() => {
      throw new KnownError('apk_alignment_failed')
    })

    await fs.rm(unsignedApkPath, { force: true })
    await fs.rename(alignedApkPath, unsignedApkPath)

    onProgress({ message: 'signing_apk', stage: 'RUNNING', percentage: 90 })

    // 签名
    if (signConfig) {
      await executeCommand(
        javaPath,
        [
          '-jar',
          apksignerPath,
          'sign',
          '--ks',
          signConfig.storeFile,
          '--ks-key-alias',
          signConfig.keyAlias,
          '--ks-pass',
          `pass:${signConfig.storePassword}`,
          '--key-pass',
          `pass:${signConfig.keyPassword}`,
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
      ).catch(() => {
        throw new KnownError('apk_signing_failed_check_info')
      })

      await fs.rm(unsignedApkPath, { force: true })

      onProgress({ message: 'completed', stage: 'COMPLETED', percentage: 100 })
    }

    onProgress({ message: 'completed', stage: 'COMPLETED', percentage: 100 })
  } catch (error) {
    if (error instanceof KnownError) {
      onProgress({ message: error.message, stage: 'ERROR', percentage: 100 })
    }
  }
}

export default build
