import { ExtensionContext, extensions, OutputChannel, window } from "vscode"

import { Logger } from "./logger"
import { checkInstallLockfile, InstallLockfile } from "./util"

let _channel: OutputChannel

export function activate(context: ExtensionContext) {

  const extensionId = "ih8c0ff33.mongoose-os-ide"
  const extension = extensions.getExtension(extensionId)
  if (extension == null)
    throw new Error("mos: Extension is not installed")
  const extensionVersion = extension.packageJSON.version

  _channel = window.createOutputChannel("mos")

  const logger = new Logger(_channel.append)
}

function checkDependencies(): Promise<boolean> {
  return checkInstallLockfile(InstallLockfile.Lock).then(installed => {
    if (!installed) {
      // TODO: Install...
      return true
    } else {
      return true
    }
  })
}

function installDependencies() { }