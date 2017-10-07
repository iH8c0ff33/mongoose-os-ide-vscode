import { stat } from "fs"
import { join, resolve } from "path"
import { file as createTmpFile, SynchrounousResult } from "tmp"
import { StatusBarItem as VscodeStatusBarItem } from "vscode"

import { unlink, writeFile } from "./fs"
import { Package } from "./package"

// Extension path

let extensionPath: string | undefined

export function setExtensionPath(path: string) {
  extensionPath = path
}

export function getExtensionPath(): string {
  if (!extensionPath)
    throw new Error("mos: Extension path is not set")

  return extensionPath
}

// Files

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

export enum InstallLockfile {
  Running,
  Lock
}

function getInstallLockfilePath(type: InstallLockfile): string {
  const lockfileName = `install.${InstallLockfile[type]}`
  return resolve(getExtensionPath(), lockfileName)
}

export async function checkInstallLockfile(type: InstallLockfile) {
  return checkFile(getInstallLockfilePath(type))
}

export async function touchInstallLockFile(type: InstallLockfile) {
  return writeFile(getInstallLockfilePath(type), "")
}

export async function removeInstallLockFile(type: InstallLockfile) {
  return unlink(getInstallLockfilePath(type))
}

// Visual Studio Code's statusBar item

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

export async function checkTestFile(pkg: Package) {
  const testFile = getAbsTestFilePath(pkg)
  if (testFile)
    return checkFile(testFile)
  else
    return false
}

export function getAbsTestFilePath(pkg: Package) {
  return pkg.testFile ? join(getAbsInstallPath(pkg), pkg.testFile) : undefined
}

export function getAbsInstallPath(pkg: Package) {
  return pkg.installPath ? join(getExtensionPath(), pkg.installPath) : getExtensionPath()
}
