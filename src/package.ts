import { createWriteStream, unlink } from "fs"
import { request, RequestOptions } from "http"
import { SynchrounousResult } from "tmp"
import { parse as parseUrl } from "url"

import { Logger } from "./logger";
import { Platform, parsePlatform } from "./platform"
import { createTempFile, StatusBarItem } from "./util"


/**
 * A package, such as C headers for your platform
 * 
 * @interface Package
 */
interface Package {
  name: string
  description: string
  url: string
  installPath?: string
  platform: string
  /**
   * Used to check whether the package is installed
   * 
   * @type {string}
   * @memberof Package
   */
  testFile?: string
  tmpFile?: SynchrounousResult
}

/**
 * Error for _PackageManager_
 * 
 * @class PackageError
 * @extends {Error}
 */
class PackageError extends Error {
  constructor(public message: string,
    public pkg?: Package,
    public error: any = null) {
    super(message)
  }
}

/**
 * Downloads ans installs packages
 * 
 * @class PackageManager
 */
export class PackageManager {

  constructor(private packageJSON: any,
    private platform: Platform,
    private logger: Logger) { }

  private packages: Package[]

  /**
   * Downloads all the packages for your platform
   * 
   * @returns Downloaded packages
   * @memberof PackageManager
   */
  public async downloadPackages() {
    const packages = await this.selectPackages()
    await Promise.all(packages.map(it => PackageManager.downloadPackage(it, this.logger)))
  }

  /**
   * Filter packages of your architecture
   * 
   * @private
   * @returns Filtered packages
   * @memberof PackageManager
   */
  private async selectPackages() {
    const packages = await this.parsePackages()
    return packages.filter(async pkg =>
      await parsePlatform(pkg.platform) === this.platform)
  }

  /**
   * Parses packages from extension's package.json
   * 
   * @private
   * @returns 
   * @memberof PackageManager
   */
  private async parsePackages() {
    if (this.packages)
      return (this.packages)
    else if (this.packageJSON.extensionDependencies) {
      this.packages = <Package[]>this.packageJSON.extensionDependencies
      return this.packages
    } else
      throw new PackageError("Failed to parse manifest")
  }

  private static installPackage(pkg: Package, logger: Logger, statusBar: StatusBarItem): Promise<void> {
    if (!pkg.tmpFile) {
      logger.appendLine(`skipping package: ${pkg.name}`)
      return Promise.resolve()
    }

    logger.appendLine(`installing package: ${pkg.name}`)

    statusBar.text = "$(desktop-download) Installing packages..."
    statusBar.tooltip = `installing package: ${pkg.name}`

    return new Promise((resolve, reject) => {
      reject = (err) => {

      }
    })
  }

  /**
   * Downloads a package
   * 
   * @private
   * @static
   * @param {Package} pkg package to download
   * @param {Logger} logger 
   * @returns {Promise<void>} finished downloading
   * @memberof PackageManager
   */
  private static async downloadPackage(pkg: Package, logger: Logger): Promise<void> {
    logger.appendLine(`Started downloading '${pkg.name}: ${pkg.description}`)

    const tmpFile = await createTempFile("package-")
    pkg.tmpFile = tmpFile

    const result = await PackageManager.downloadFile(pkg.url, pkg, logger)

    logger.appendLine(`Finished downloading '${pkg.name}`)

    return result
  }

  /**
   * Downloads a package file
   * 
   * @private
   * @static
   * @param {string} urlString 
   * @param {Package} pkg 
   * @param {Logger} logger 
   * @returns {Promise<void>} 
   * @memberof PackageManager
   */
  private static downloadFile(urlString: string, pkg: Package, logger: Logger): Promise<void> {
    const url = parseUrl(urlString)

    const options: RequestOptions = {
      host: url.host,
      path: url.path
    }

    return new Promise((resolve, reject) => {
      const req = request(options, response => {

        // Error handling
        if (response.statusCode === 301 || response.statusCode === 302) {
          return resolve(PackageManager.downloadFile(response.headers['location'] as string, pkg, logger))
        }

        if (response.statusCode != 200) {
          return reject(new PackageError(`${response.statusCode} - ${response.statusMessage}`, pkg))
        }

        // Download preparation
        const downloadSize = parseInt(response.headers['content-length'] as string, 10)
        let downloaded = 0
        let percentage = 0
        let lastProgress = new Date()

        if (!pkg.tmpFile)
          throw new PackageError("Temporary file not found!", pkg)
        let tmpFile = createWriteStream("", { fd: pkg.tmpFile.fd })

        // Handlers
        response.on("data", chunk => {
          downloaded += chunk.length

          let newPercentage = Math.ceil(100 * (downloaded / downloadSize))

          // Display percentage is changed > 20%
          if (newPercentage - percentage > 20) {
            const now = new Date()
            const speed = (newPercentage - percentage) * downloadSize / (now.getTime() / 1000 - lastProgress.getTime() / 1000)
            logger.appendLine(`${pkg.name}: ${newPercentage}% - ${speed / 1024}KiB/s`)
            lastProgress = now
            percentage = newPercentage
          }
        })

        response.on("end", () => {
          resolve()
        })

        response.on("error", error => {
          reject(new PackageError(`Download error: ${error.message || "NONE"}`, pkg))
        })

        // Start the download
      })

      req.end()
    })
  }
}
