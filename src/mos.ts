import { workspace } from "vscode"
import { loginExec } from "./process"

export async function getMosPlatform() {
  const { stdout } = await loginExec("mos -X eval-manifest-expr platform", { cwd: workspace.rootPath })

  return stdout
}

export async function getMosModulePath() {
  const { stdout } = await loginExec("mos -X get-mos-repo-dir", { cwd: workspace.rootPath })
  const [match] = stdout.match(/^((?:\/[^/\0 \n]+)+)/) || [null]
  if (!match)
    throw new Error("failed to get mos repo dir")
  return match
}

export async function getMosIncludes() {
  const { stdout } = await loginExec("mos -X eval-manifest-expr includes", { cwd: workspace.rootPath })

  return JSON.parse(stdout) as string[]
}
