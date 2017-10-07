import { join } from "path"
import {
  commands, ExtensionContext, extensions, OutputChannel, StatusBarAlignment,
  window, workspace
} from "vscode"

import { lstat, mkdir, readdir, writeFile } from "./fs"
import { getGccSearchPath } from "./gcc"
import genCppConfig from "./generator"
import { Logger } from "./logger"
import { getMosIncludes, getMosModulePath, getMosPlatform } from "./mos"
import { PackageManager } from "./package"
import { parsePlatform, Platform } from "./platform"
import {
  checkFile, checkInstallLockfile, setExtensionPath,
  StatusBarItem, touchInstallLockFile
} from "./util"

let _channel: OutputChannel
const extensionName = "mongoose-os-ide"

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

  registerCommands(_context, logger)

  logger.appendLine(`PATH: ${process.env["PATH"]}`)
  logger.appendLine(`platform is ${await getMosPlatform()}`)

  await checkDependencies(extension.packageJSON, logger)

  if (!await checkCppConfig())
    await createCppConfig(logger)
  else
    logger.appendLine("skip config generation")
}

/**
 * Register all extension commands
 * 
 * @param {ExtensionContext} context 
 * @param {Logger} logger 
 */
function registerCommands(context: ExtensionContext, logger: Logger) {
  context.subscriptions.push(commands.registerCommand(`${extensionName}.genConfig`, async () =>
    createCppConfig(logger)
  ))
}

/**
 * Check and install dependencies
 * 
 * @param {*} packageJSON package.json
 * @param {Logger} logger 
 */
async function checkDependencies(packageJSON: any, logger: Logger) {
  const platform = await parsePlatform(await getMosPlatform())

  if (!await checkInstallLockfile(platform)) {
    const statusBar = new StatusBarItem(window.createStatusBarItem(StatusBarAlignment.Right))

    const packageManager = new PackageManager(packageJSON, platform, logger, statusBar)

    await packageManager.downloadPackages()
    await packageManager.installPackages()

    statusBar.dispose()
    return
  } else {
    return
  }
}

/**
 * Checks whether the cpp config is present or not
 * 
 * @returns {boolean} true if there's a cpp config in the workspace
 */
async function checkCppConfig() {
  if (!workspace.rootPath)
    throw new Error("workspace has no opened folder")

  if ((await readdir(workspace.rootPath)).indexOf(".vscode") === -1) {
    await mkdir(join(workspace.rootPath, ".vscode"))
  }

  return checkFile(`${workspace.rootPath}/.vscode/c_cpp_properties.json`)
}

/**
 * Generates a cpp config and writes it to the workspace
 * 
 * @param {Logger} logger 
 */
async function createCppConfig(logger: Logger) {
  let includes = await getMosIncludes()
  includes = includes.concat(await getGccSearchPath())
  includes.push(await getMosModulePath())

  logger.appendLine(`includes: ${includes}`)

  const config = await genCppConfig(includes)

  await writeFile(`${workspace.rootPath}/.vscode/c_cpp_properties.json`, JSON.stringify(config))
  logger.appendLine("wrote cpp config")
}
