import fs from 'fs-extra'
import path from 'path'
import { signApk } from './signer'
import { replaceTextInFolder } from './files'
import { executeCommand } from './exec'
import { BuildOptions, BuildResult, ProgressCallback } from './types'
import {
  getApkEditorPath,
  getApksignerPath,
  getJavaPath,
  getKeytoolPath,
  getTemplateApkPath,
  getZipalignPath
} from './path'

const noOpProgress: ProgressCallback = () => {}

export const build = async (
  { appInfo, distPath, signConfig }: BuildOptions,
  onProgress: ProgressCallback = noOpProgress
): Promise<BuildResult> => {
  onProgress({ message: 'initializing', stage: 'INITIALIZING', percentage: 0 })

  const outputPath = path.dirname(distPath)

  onProgress({ message: 'checking_project_info', stage: 'RUNNING', percentage: 5 })
  onProgress({ message: 'preparing', stage: 'RUNNING', percentage: 10 })

  const templateApkPath = await getTemplateApkPath()

  if (!templateApkPath) {
    console.error(`Template apk not found at: ${templateApkPath}`)
    onProgress({ message: 'template_apk_not_found', stage: 'ERROR', percentage: 100 })
    return {
      success: false,
      message: 'Template apk not found'
    }
  }

  const apkEditorPath = await getApkEditorPath()

  if (!apkEditorPath) {
    console.error(`APKEditor not found at: ${apkEditorPath}`)
    onProgress({ message: 'apkeditor_not_found', stage: 'ERROR', percentage: 100 })
    return {
      success: false,
      message: 'APKEditor not found'
    }
  }

  const javaPath = await getJavaPath()

  const keytoolPath = await getKeytoolPath()

  if (!javaPath || !keytoolPath) {
    console.error('JDK not found')
    onProgress({ message: 'jdk_not_found', stage: 'ERROR', percentage: 100 })
    return {
      success: false,
      message: 'JDK not found'
    }
  }

  const apksignerPath = await getApksignerPath()

  const zipalignPath = await getZipalignPath()

  if (!apksignerPath || !zipalignPath) {
    console.error('Build tools not found')
    onProgress({ message: 'build_tools_not_found', stage: 'ERROR', percentage: 100 })
    return {
      success: false,
      message: 'Build tools not found'
    }
  }

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

  try {
    await fs.rm(buildPath, { recursive: true, force: true })
    await fs.rm(unsignedApkPath, { force: true })
    await fs.rm(alignedApkPath, { force: true })
    await fs.rm(signedApkPath, { force: true })
    await fs.rm(idsigPath, { force: true })
  } catch (_) {
    /* empty */
  }

  onProgress({ message: 'decompiling_template_apk', stage: 'RUNNING', percentage: 20 })

  // 反编译apk
  try {
    await executeCommand(
      javaPath ?? 'java',
      ['-jar', apkEditorPath, 'd', '-i', templateApkPath, '-o', buildPath],
      'APK decompilation'
    )
  } catch (error) {
    console.error('APK decompilation failed', error)
    onProgress({ message: 'apk_decompilation_failed', stage: 'ERROR', percentage: 100 })
    return {
      success: false,
      message: 'APK decompilation failed',
      error
    }
  }

  console.log('\x1b[93m%s\x1b[0m', '\nStarting to replace assets...\n')

  onProgress({ message: 'replacing_assets', stage: 'RUNNING', percentage: 30 })

  try {
    // 替换包名
    await replaceTextInFolder(buildPath, 'com.openwebgal.demo', packageName)
    await replaceTextInFolder(buildPath, 'com/openwebgal/demo', packageName.replace(/\./g, '/'))

    // 替换游戏名
    await replaceTextInFolder(
      buildPath,
      '<string name="app_name">WebGAL</string>',
      `<string name="app_name">${appInfo.appName}</string>`
    )

    // 替换版本信息
    await replaceTextInFolder(
      buildPath,
      'android:versionCode="1"',
      `android:versionCode="${appInfo.versionCode}"`
    )
    await replaceTextInFolder(
      buildPath,
      'android:versionName="1.0"',
      `android:versionName="${appInfo.versionName}"`
    )

    console.log('Replacement completed')

    // 查找实际的包路径
    let sourcePath = ''
    let found = false

    // 可能的路径列表
    const possiblePaths = [
      path.join(buildPath, 'smali', 'classes', 'com', 'openwebgal', 'demo'),
      path.join(buildPath, 'smali', 'classes2', 'com', 'openwebgal', 'demo')
    ]

    for (const pathToCheck of possiblePaths) {
      try {
        await fs.access(pathToCheck)
        sourcePath = pathToCheck
        found = true
        console.log(`Found package directory at: ${sourcePath}`)
        break
      } catch (_error) {
        /* empty */
      }
    }

    if (!found) {
      console.error('Could not find package directory in decompiled APK')
      return {
        success: false,
        message: 'Could not find package directory in decompiled APK'
      }
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
    await fs.rename(sourcePath, targetPath)
    console.log('Files moved successfully')

    // 复制游戏资源
    const destPath = path.join(buildPath, 'root', 'assets', 'public')

    console.log(`Copying game resources from ${distPath} to ${destPath}`)
    onProgress({ message: 'copying_game_assets', stage: 'RUNNING', percentage: 40 })

    await fs.copy(distPath, destPath)
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
      await fs.copy(iconsPath, resPath)
    } else {
      console.log('Skip copying icons')
    }
  } catch (error) {
    console.error('Error replacing assets', error)
    onProgress({ message: 'replacing_assets_failed', stage: 'ERROR', percentage: 100 })
    return {
      success: false,
      message: 'Error replacing assets',
      error
    }
  }

  onProgress({ message: 'building_apk', stage: 'RUNNING', percentage: 70 })

  // 构建apk
  try {
    await executeCommand(
      javaPath,
      ['-jar', apkEditorPath, 'b', '-i', buildPath, '-o', unsignedApkPath],
      'Build APK'
    )

    // console.log('Cleaning build path')
    // await fs.rm(buildPath, { recursive: true, force: true })
  } catch (error) {
    console.error('Build APK failed', error)
    onProgress({ message: 'build_apk_failed', stage: 'ERROR', percentage: 100 })
    return {
      success: false,
      message: 'Build APK failed',
      error
    }
  }

  onProgress({ message: 'aligning_apk', stage: 'RUNNING', percentage: 80 })

  // 对齐
  if (zipalignPath) {
    try {
      await executeCommand(
        zipalignPath,
        ['-v', '-p', '4', unsignedApkPath, alignedApkPath],
        'APK alignment'
      )
    } catch (error) {
      console.error('APK alignment failed', error)
      onProgress({ message: 'apk_alignment_failed', stage: 'ERROR', percentage: 100 })
      return {
        success: false,
        message: 'APK alignment failed',
        error
      }
    }

    await fs.rm(unsignedApkPath, { force: true })
    await fs.rename(alignedApkPath, unsignedApkPath)
  }

  onProgress({ message: 'signing_apk', stage: 'RUNNING', percentage: 90 })

  // 签名
  if (javaPath && apksignerPath && signConfig) {
    try {
      await signApk(javaPath, apksignerPath, signConfig, unsignedApkPath, signedApkPath)
    } catch (error) {
      console.error('APK signing failed', error)
      onProgress({
        message: 'apk_signing_failed_check_info',
        stage: 'ERROR',
        percentage: 100
      })
      return {
        success: false,
        message: 'APK signing failed',
        error
      }
    }

    await fs.rm(unsignedApkPath, { force: true })

    onProgress({ message: 'completed', stage: 'COMPLETED', percentage: 100 })

    return {
      success: true,
      message: 'Build successful',
      path: signedApkPath
    }
  }

  onProgress({ message: 'completed', stage: 'COMPLETED', percentage: 100 })

  return {
    success: true,
    message: 'Build successful',
    path: unsignedApkPath
  }
}

export default build
