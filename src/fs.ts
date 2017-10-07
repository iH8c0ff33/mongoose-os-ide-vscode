import {
  exists as fsExists, lstat as fsLstat, PathLike, readdir as fsReaddir,
  rmdir as fsRmdir, Stats, unlink as fsUnlink, writeFile as fsWriteFile
} from "fs"
import { join } from "path"

function rmdir(path: PathLike) {
  return new Promise<void>((resolve, reject) => fsRmdir(path, error => {
    if (error)
      return reject(error)
    resolve()
  }))
}

function exists(path: PathLike) {
  return new Promise<boolean>((resolve) => fsExists(path, exists => resolve(exists)))
}

function lstat(path: PathLike) {
  return new Promise<Stats>((resolve, reject) => fsLstat(path, (error, stats) => {
    if (error)
      return reject(error)
    resolve(stats)
  }))
}

function readdir(path: PathLike) {
  return new Promise<string[]>((resolve, reject) => fsReaddir(path, (error, files) => {
    if (error)
      return reject(error)
    resolve(files)
  }))
}

export function unlink(path: PathLike) {
  return new Promise<void>((resolve, reject) => fsUnlink(path, error => {
    if (error)
      return reject(error)
    resolve()
  }))
}

export async function rmrf(path: PathLike) {
  if (await exists(path)) {
    const files = await readdir(path)

    await Promise.all(files.map(async it => {
      const file = join(path.toString(), it)

      if ((await lstat(file)).isDirectory())
        return rmrf(file)
      else
        return unlink(file)
    }))

    return rmdir(path)
  }
}

export function writeFile(
  path: PathLike | number,
  data: any,
  options?: {
    encoding?: string | null;
    mode?: number | string;
    flag?: string;
  } | string | null
) {
  return new Promise<void>((resolve, reject) => fsWriteFile(path, data, options, error => {
    if (error)
      return reject(error)
    resolve()
  }))
}
