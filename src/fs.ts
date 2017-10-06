import {
  exists as fsExists, lstat as fsLstat, readdir as fsReaddir, rmdir as fsRmdir,
  Stats, unlink as fsUnlink
} from "fs"
import { join } from "path"

function rmdir(path: string) {
  return new Promise<void>((resolve, reject) => fsRmdir(path, error => {
    if (error)
      return reject(error)
    resolve()
  }))
}

function exists(path: string) {
  return new Promise<boolean>((resolve) => fsExists(path, exists => resolve(exists)))
}

function lstat(path: string) {
  return new Promise<Stats>((resolve, reject) => fsLstat(path, (error, stats) => {
    if (error)
      return reject(error)
    resolve(stats)
  }))
}

function readdir(path: string) {
  return new Promise<string[]>((resolve, reject) => fsReaddir(path, (error, files) => {
    if (error)
      return reject(error)
    resolve(files)
  }))
}

function unlink(path: string) {
  return new Promise<void>((resolve, reject) => fsUnlink(path, error => {
    if (error)
      return reject(error)
    resolve()
  }))
}

export async function rmrf(path: string) {
  if (await exists(path)) {
    const files = await readdir(path)

    await Promise.all(files.map(async it => {
      const file = join(path, it)

      if ((await lstat(file)).isDirectory())
        return rmrf(file)
      else
        return unlink(file)
    }))

    return rmdir(path)
  }
}
