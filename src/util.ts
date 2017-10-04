import { stat } from "fs"
import { resolve } from "path"
import { file as createTmpFile, SynchrounousResult } from "tmp"
import { StatusBarItem as VscodeStatusBarItem, StatusBarAlignment } from "vscode"

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
  return new Promise((resolve, reject) => {
    stat(path, (error, stats) => {
      if (error)
        reject(error)
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

export function checkInstallLockfile(type: InstallLockfile): Promise<boolean> {
  return checkFile(getInstallLockfilePath(type))
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
}