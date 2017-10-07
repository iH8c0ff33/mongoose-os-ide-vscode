import {
  ExtensionContext, extensions, OutputChannel, StatusBarAlignment, window
} from "vscode"

import { Logger } from "./logger"
import { getMosPlatform } from "./mos"
import { PackageManager } from "./package"
import { parsePlatform } from "./platform"
import { checkInstallLockfile, InstallLockfile, setExtensionPath, StatusBarItem, touchInstallLockFile } from "./util"

let _channel: OutputChannel

export async function activate(_context: ExtensionContext) {

  const extensionId = "ih8c0ff33.mongoose-os-ide"
  const extension = extensions.getExtension(extensionId)
  if (extension == null)
    throw new Error("mos: Extension is not installed")
  const extensionVersion = extension.packageJSON.version

  setExtensionPath(extension.extensionPath)

  _channel = window.createOutputChannel("mos")

  const logger = new Logger(text => _channel.append(text))

  logger.appendLine(`activating mos ide version: ${extensionVersion}`)

  logger.appendLine(`PATH: ${process.env["PATH"]}`)
  logger.appendLine(`platform is ${await getMosPlatform()}`)

  await checkDependencies(extension.packageJSON, logger)
}

async function checkDependencies(packageJSON: any, logger: Logger) {
  if (!await checkInstallLockfile(InstallLockfile.Lock)) {
    const platform = await parsePlatform(await getMosPlatform())

    const statusBar = new StatusBarItem(window.createStatusBarItem(StatusBarAlignment.Right))

    const packageManager = new PackageManager(packageJSON, platform, logger, statusBar)

    await packageManager.downloadPackages()
    await packageManager.installPackages()

    await touchInstallLockFile(InstallLockfile.Lock)

    statusBar.dispose()
    return true
  } else {
    return true
  }
}
