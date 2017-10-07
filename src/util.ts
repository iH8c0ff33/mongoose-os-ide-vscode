import { stat } from "fs"
import { join, resolve } from "path"
import { file as createTmpFile, SynchrounousResult } from "tmp"
import { StatusBarItem as VscodeStatusBarItem } from "vscode"

import { unlink, writeFile } from "./fs"
import { Package } from "./package"
import { Platform, Platforms } from "./platform"

// Extension path

let extensionPath: string | undefined

/**
 * Saves the extension path in the module
 * 
 * @export
 * @param {string} path 
 */
export function setExtensionPath(path: string) {
  extensionPath = path
}

/**
 * Gets the extension path saved in the module
 * 
 * @export
 * @returns {string} 
 */
export function getExtensionPath(): string {
  if (!extensionPath)
    throw new Error("mos: Extension path is not set")

  return extensionPath
}

// Files

/**
 * Checks existence of a file
 * 
 * @export
 * @param {string} path 
 * @returns {Promise<boolean>} true if file exists and is a file
 */
export function checkFile(path: string): Promise<boolean> {
  return new Promise((resolve, _reject) => {
    stat(path, (error, stats) => {
      if (error)
        resolve(false)
      if (stats && stats.isFile)
        resolve(true)
      else
        resolve(false)
    })
  })
}

// Temporary file

/**
 * Create temporary file using tmp
 * 
 * @export
 * @param {string} [prefix] 
 * @returns {Promise<SynchrounousResult>} 
 */
export function createTempFile(prefix?: string): Promise<SynchrounousResult> {
  return new Promise((resolve, reject) => {
    createTmpFile({ prefix }, (error, path, fd, cleanup) => {
      if (error)
        reject(error)
      resolve({
        fd,
        name: path,
        removeCallback: cleanup
      })
    }
    )
  })
}

// Install lockfiles

/**
 * Get the lockfile path
 * 
 * @param {InstallLockfile} type 
 * @returns {string} 
 */
function getInstallLockfilePath(platform: Platform): string {
  const lockfileName = `install.${Platform[platform]}`
  return resolve(getExtensionPath(), lockfileName)
}

/**
 * Check is the lockfile is present
 * 
 * @export
 * @param {InstallLockfile} type 
 * @returns 
 */
export async function checkInstallLockfile(platform: Platform): Promise<boolean> {
  if (platform === Platform.none)
    return (await Promise.all<boolean>(Platforms.map(it => checkInstallLockfile(it))))
      .reduce((previous, current) => previous && current)
  return checkFile(getInstallLockfilePath(platform))
}

/**
 * Touch the install lock file
 * 
 * @export
 * @param {InstallLockfile} type 
 * @returns 
 */
export async function touchInstallLockFile(platform: Platform) {
  return writeFile(getInstallLockfilePath(platform), "")
}

/**
 * Remove the install lock file
 * 
 * @export
 * @param {InstallLockfile} type 
 * @returns 
 */
export async function removeInstallLockFile(type: Platform) {
  return unlink(getInstallLockfilePath(type))
}

// Visual Studio Code's statusBar item

/**
 * Wrapper for vscode's statusbar item
 * 
 * Provides getters and setters for showing text and tooltip
 * 
 * @export
 * @class StatusBarItem
 */
export class StatusBarItem {
  constructor(private _statusBarItem: VscodeStatusBarItem) { }

  set text(text: string) {
    this._statusBarItem.text = text
    this._statusBarItem.show()
  }

  set tooltip(text: string) {
    this._statusBarItem.tooltip = text
    this._statusBarItem.show()
  }

  public dispose(): void {
    return this._statusBarItem.dispose()
  }
}

// Package utilities

/**
 * Checks the test file for a package
 * 
 * @export
 * @param {Package} pkg 
 * @returns {Promise<boolean>} true if the package is installed
 */
export async function checkTestFile(pkg: Package) {
  const testFile = getAbsTestFilePath(pkg)
  if (testFile)
    return checkFile(testFile)
  else
    return false
}

/**
 * Get the absolute test file path of a package
 * 
 * @export
 * @param {Package} pkg 
 * @returns {string} path
 */
export function getAbsTestFilePath(pkg: Package) {
  return pkg.testFile ? join(getAbsInstallPath(pkg), pkg.testFile) : undefined
}

/**
 * Get the absolute install path of a package
 * 
 * @export
 * @param {Package} pkg 
 * @returns {string} path
 */
export function getAbsInstallPath(pkg: Package) {
  return pkg.installPath ? join(getExtensionPath(), pkg.installPath) : getExtensionPath()
}
