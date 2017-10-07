import { exec as execProcess, ExecOptions } from "child_process"

interface ExecResult {
  stdout: string
  stderr: string
}

/**
 * Promisified version of *child_process.exec*
 * 
 * @export
 * @param {string} command 
 * @param {ExecOptions} [options] 
 * @returns {ExecResult} stdout and stderr from executed command
 */
export function exec(command: string, options?: ExecOptions) {
  return new Promise<ExecResult>((resolve, reject) => {
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

/**
 * Execute a command in a login shell
 * 
 * Useful when you need PATH to be populated, because mac so doesn't always set
 * it correctly for GUI applications.
 * 
 * @export
 * @param {string} command 
 * @param {ExecOptions} [options] 
 * @returns {ExecResult} stdout and stderr from executed command
 */
export async function loginExec(command: string, options?: ExecOptions) {
  return exec(`bash -l -c '${command}'`, options)
}
