import { createWriteStream, unlink } from "fs"
import { request as httpRequest, RequestOptions } from "http"
import {
  request as httpsRequest, RequestOptions as HttpsRequestOptions
} from "https"
import * as mkdirp from "mkdirp"
import { resolve as resolvePath } from "path"
import { SynchrounousResult } from "tmp"
import { parse as parseUrl } from "url"
import { Entry, fromFd } from "yauzl"

import { Logger } from "./logger"
import { parsePlatform, Platform } from "./platform"
import {
  checkTestFile, createTempFile, getAbsInstallPath, getAbsTestFilePath,
  StatusBarItem, touchInstallLockFile
} from "./util"

/**
 * A package, such as C headers for your platform
 *
 * @interface Package
 */
export interface Package {
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
  constructor(
    public message: string,
    public pkg?: Package,
    public error: any = null
  ) {
    super(message)
  }
}

/**
 * Downloads ans installs packages
 *
 * @class PackageManager
 */
export class PackageManager {

  private packages: Package[]

  constructor(
    private packageJSON: any,
    private platform: Platform,
    private logger: Logger,
    private statusBar: StatusBarItem
  ) { }

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
    logger.appendLine(`Started downloading "${pkg.name}": ${pkg.description}`)

    const tmpFile = await createTempFile("package-")
    pkg.tmpFile = tmpFile

    const result = await PackageManager.downloadFile(pkg.url, pkg, logger)

    logger.appendLine(`Finished downloading "${pkg.name}"`)
  }

  /**
   * Install a package (extracts tmp zip file to installPath)
   * 
   * @private
   * @static
   * @param {Package} pkg package to install 
   * @param {Logger} logger 
   * @param {StatusBarItem} statusBar used for notifications
   * @returns {Promise<void>} 
   * @memberof PackageManager
   */
  private static installPackage(pkg: Package, logger: Logger, statusBar: StatusBarItem): Promise<void> {
    if (!pkg.tmpFile) {
      logger.appendLine(`skipping package: "${pkg.name}"`)
      return Promise.resolve()
    }

    logger.appendLine(`installing package: "${pkg.name}"`)

    statusBar.text = "$(desktop-download) Installing packages..."
    statusBar.tooltip = `installing package: ${pkg.name}`

    return new Promise<void>((resolve, rejectPromise) => {
      // replace reject function with one that deletes the temporary file before rejecting
      const reject = (error?: any) => {
        const testFilePath = getAbsTestFilePath(pkg)

        if (testFilePath) {
          unlink(testFilePath, (unlinkError) => {
            if (unlinkError)
              return rejectPromise({ ...unlinkError, parent: error })
            else
              return rejectPromise(error)
          })
        } else {
          return rejectPromise(error)
        }
      }

      if (!pkg.tmpFile || pkg.tmpFile.fd === 0)
        return reject(new PackageError("tmpfile is not there", pkg))

      // parse zip file
      fromFd(pkg.tmpFile.fd, { lazyEntries: true }, (error, zipFile) => {

        // TODO: that error happens too many times without any reason
        if (error || !zipFile)
          return reject(new PackageError("couldn't open tmp zipfile", pkg, error))

        // create install path for package
        mkdirp(getAbsInstallPath(pkg), { mode: 0o755 }, error => {
          if (error)
            return reject(new PackageError("couldn't create install path", pkg, error))

          // start reading the first entry in the zip file
          zipFile.readEntry()
        })

        zipFile.on("entry", (entry: Entry) => {
          const entryPath = resolvePath(getAbsInstallPath(pkg), entry.fileName)

          // if it's a folder create it
          if (entry.fileName.endsWith("/")) {
            mkdirp(entryPath, { mode: 0o755 }, error => {
              if (error)
                return reject(new PackageError(`error creating dir: ${error.code}`, pkg, error))

              zipFile.readEntry()
            })
          } else {
            // extract the file from zip and read the next entry
            zipFile.openReadStream(entry, (error, readStream) => {
              if (error || !readStream)
                return reject(new PackageError("error opening read stream", pkg, error))

              readStream.pipe(createWriteStream(entryPath, { mode: 0o664 }))

              readStream.on("error", error => reject(new PackageError("write stream error", pkg, error)))
              readStream.on("end", () => zipFile.readEntry())
            })
          }
        })

        zipFile.on("end", () => resolve())

        zipFile.on("error", (error: any) => reject(new PackageError(`zip error: ${error.code}`, pkg, error)))
      })
    }).then(() => {
      // delete temporary file
      if (pkg.tmpFile)
        pkg.tmpFile.removeCallback()

      return parsePlatform(pkg.platform)
    }).then(platform => touchInstallLockFile(platform))
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
    if (!pkg.tmpFile)
      return Promise.reject(new PackageError("tmpFile not found", pkg))

    const tmpWriteStream = createWriteStream("", { fd: pkg.tmpFile.fd })

    const url = parseUrl(urlString)

    // we need to use https module instead of http to make https requests
    let request = httpRequest
    if (url.protocol === "https:") {
      request = httpsRequest
    }

    return new Promise((resolve, reject) => {
      const req = request(urlString, response => {
        // Error handling
        if (response.statusCode === 301 || response.statusCode === 302) {
          return resolve(PackageManager.downloadFile(response.headers["location"] as string, pkg, logger))
        }

        if (response.statusCode !== 200) {
          return reject(new PackageError(`${response.statusCode} - ${response.statusMessage}`, pkg))
        }

        // Download preparation
        const downloadSize = parseInt(response.headers["content-length"] as string, 10)
        let downloaded = 0
        let percentage = 0
        let lastProgress = new Date()

        if (!pkg.tmpFile)
          return reject(new PackageError("Temporary file not found!", pkg))

        let tmpFile = createWriteStream("", { fd: pkg.tmpFile.fd })

        // Handlers
        response.on("data", chunk => {
          downloaded += chunk.length

          let newPercentage = Math.ceil(100 * (downloaded / downloadSize))

          // Display percentage if changed > 20%
          if (newPercentage - percentage > 20) {
            const now = new Date()
            const speed = (newPercentage - percentage) * downloadSize / (now.getTime() / 1000 - lastProgress.getTime() / 1000)
            logger.appendLine(`${pkg.name}: ${newPercentage}% - ${speed / 1024}KiB/s`)
            lastProgress = now
            percentage = newPercentage
          }
        })

        response.on("end", () => {
          logger.appendLine(`downloaded: "${pkg.name}"`)
          resolve()
        })

        response.on("error", error => {
          reject(new PackageError(`Download error: ${error.message || "NONE"}`, pkg))
        })

        response.pipe(tmpWriteStream, { end: false })
      })
      // start the download (end the request)
      req.end()
    })
  }

  /**
   * Downloads all the packages for your platform
   * 
   * @returns Downloaded packages
   * @memberof PackageManager
   */
  public async downloadPackages() {
    const packages = await this.selectPackages()
    await Promise.all(packages.map(async it => {
      // check if the dep is already installed
      if (!await checkTestFile(it)) {
        return PackageManager.downloadPackage(it, this.logger)
      } else {
        touchInstallLockFile(await parsePlatform(it.platform))

        this.logger.appendLine(`skip package "${it.name}"`)
      }
    }))
  }

  /**
   * Install all packages
   * 
   * @memberof PackageManager
   */
  public async installPackages() {
    const packages = await this.selectPackages()
    await Promise.all(packages.map(it => PackageManager.installPackage(it, this.logger, this.statusBar)))
    this.logger.appendLine("installation completed")
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
      this.platform === Platform.none || await parsePlatform(pkg.platform) === this.platform)
  }

  /**
   * Parses packages from extension"s package.json
   * 
   * @private
   * @returns 
   * @memberof PackageManager
   */
  private async parsePackages() {
    if (this.packages)
      return (this.packages)
    else if (this.packageJSON.ideDeps) {
      this.packages = this.packageJSON.ideDeps as Package[]
      return this.packages
    } else
      throw new PackageError("Failed to parse manifest")
  }
}
