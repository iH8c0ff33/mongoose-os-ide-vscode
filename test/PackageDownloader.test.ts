import { installPackages } from "../src/PackageDownloader"
import { Platform } from "../src/platform"
import { Logger } from "../src/logger"

suite("Package tests", () => {
  test("Download all packages (fake package.json)", async () => {
    await installPackages({
      extensionDependencies: [
        {
          name: "test_file",
          description: "An useless file",
          url: "http://ipv4.download.thinkbroadband.com/100MB.zip",
          platform: "esp32"
        },
        {
          name: "test_file_fake",
          description: "An even more useless file",
          url: "http://ipv4.download.thinkbroadband.com/100MB.zip",
          platform: "esp8266"
        }
      ]
    }, Platform.esp32, new Logger(console.log, "test"))
  }).timeout(30 * 1000)
})