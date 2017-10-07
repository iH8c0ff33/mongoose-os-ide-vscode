import { workspace } from "vscode"
import { homedir } from "os"
import { join } from "path"
import { exec } from "./process"

const MOS = join(homedir(),".mos", "bin", "mos")

/**
 * Get the mos platform used in the workspace
 * 
 * @export
 * @returns {string} mos platform
 */
export async function getMosPlatform() {
  const { stdout } = await exec(`${MOS} -X eval-manifest-expr platform`, { cwd: workspace.rootPath })

  return stdout
}

/**
 * Get the mos modules path
 * 
 * @export
 * @returns {string} path of the cloned mongoose-os repo
 */
export async function getMosModulePath() {
  const { stdout } = await exec(`${MOS} -X get-mos-repo-dir`, { cwd: workspace.rootPath })
  const [match] = stdout.match(/^((?:\/[^/\0 \n]+)+)/) || [null]
  if (!match)
    throw new Error("failed to get mos repo dir")
  return match
}

/**
 * Get include path for mos project
 * 
 * @export
 * @returns {string[]} include path
 */
export async function getMosIncludes() {
  const { stdout } = await exec(`${MOS} -X eval-manifest-expr includes`, { cwd: workspace.rootPath })

  return JSON.parse(stdout) as string[]
}
