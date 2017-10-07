import { exec as execProcess, ExecOptions } from "child_process"

interface SpawnResult {
  stdout: string
  stderr: string
}

export function exec(command: string, options?: ExecOptions) {
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

export async function loginExec(command: string, options?: ExecOptions) {
  return exec(`bash -l -c '${command}'`, options)
}
