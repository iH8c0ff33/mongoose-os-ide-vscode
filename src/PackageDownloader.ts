import { Logger } from "./logger"
import { PackageManager } from "./package"
import { Platform } from "./platform";

export async function installPackages(packageJSON: any, platform: Platform, logger: Logger) {
  const packageManager = new PackageManager(packageJSON, platform, logger)
  await packageManager.downloadPackages()
  console.log("downloaded")
}