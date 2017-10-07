import { exec as execProcess, ExecOptions } from "child_process"
import { workspace } from "vscode"

interface SpawnResult {
  stdout: string
  stderr: string
}

function exec(command: string, options?: ExecOptions) {
  return new Promise<SpawnResult>((resolve, reject) => {
    execProcess(command, options, (error, stdout, stderr) => {
      if (error)
        return reject(error)
      resolve({
        stdout: typeof stdout === "string" ? stdout : stdout.toString(),
        stderr: typeof stderr === "string" ? stderr : stderr.toString()
      })
    })
  })
}

async function loginExec(command: string, options?: ExecOptions) {
  return exec(`bash -l -c '${command}'`, options)
}

export async function getMosPlatform() {
  const { stdout } = await loginExec("mos -X eval-manifest-expr platform", { cwd: workspace.rootPath })

  return stdout
}

export async function getMosIncludes() {
  const { stdout } = await loginExec("mos -X eval-manifest-expr includes", { cwd: workspace.rootPath })

  return stdout
}
