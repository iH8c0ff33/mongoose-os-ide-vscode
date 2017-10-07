import {
  ExtensionContext, extensions, OutputChannel, StatusBarAlignment, window,
  workspace
} from "vscode"

import { writeFile } from "./fs"
import { getGccSearchPath } from "./gcc"
import genCppConfig from "./generator"
import { Logger } from "./logger"
import { getMosIncludes, getMosModulePath, getMosPlatform } from "./mos"
import { PackageManager } from "./package"
import { parsePlatform } from "./platform"
import {
  checkFile, checkInstallLockfile, InstallLockfile, setExtensionPath,
  StatusBarItem, touchInstallLockFile
} from "./util"

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
  if (!await checkCppConfig())
    await createCppConfig(logger)
  else
    logger.appendLine("skip config generation")
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

async function checkCppConfig() {
  return checkFile(`${workspace.rootPath}/.vscode/c_cpp_properties.json`)
}

async function createCppConfig(logger: Logger) {
  let includes = await getMosIncludes()
  includes = includes.concat(await getGccSearchPath())
  includes.push(await getMosModulePath())

  logger.appendLine(`includes: ${includes}`)

  const config = await genCppConfig(includes)

  await writeFile(`${workspace.rootPath} /.vscode / c_cpp_properties.json`, JSON.stringify(config))
  logger.appendLine("wrote cpp config")
}
