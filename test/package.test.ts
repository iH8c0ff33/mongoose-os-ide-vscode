import { join, normalize } from "path"
import { StatusBarAlignment, window } from "vscode"

import { rmrf } from "../src/fs"
import { Logger } from "../src/logger"
import { PackageManager } from "../src/package"
import { Platform } from "../src/platform"
import { setExtensionPath, StatusBarItem } from "../src/util"

const packageJSON = {
  extensionDependencies: [
    {
      name: "test_file",
      description: "An useless file",
      url: "http://www.colorado.edu/conflict/peace/download/peace.zip",
      platform: "esp32",
      installPath: ".useless_a",
      testFile: "ab_cites.htm"
    },
    {
      name: "test_file_fake",
      description: "An even more useless file",
      url: "http://www.colorado.edu/conflict/peace/download/peace_treatment.ZIP",
      platform: "esp8266",
      installPath: ".useless_b"
    }
  ]
}

describe("PackageManager", () => {
  before(() => setExtensionPath(normalize(join(__dirname, "..", ".."))))

  it("should install dependencies", async () => {

    const statusBar = new StatusBarItem(window.createStatusBarItem(StatusBarAlignment.Right))
    const logger = new Logger(console.log, "D")

    const packageManager = new PackageManager(
      packageJSON,
      Platform.esp32,
      logger,
      statusBar
    )

    await packageManager.downloadPackages()
    await packageManager.installPackages()
  }).timeout(30 * 1000)

  after(async () => {
    await Promise.all(packageJSON.extensionDependencies.map(it => {
      return rmrf(normalize(join(__dirname, "..", "..", it.installPath)))
    }))
  })
})
