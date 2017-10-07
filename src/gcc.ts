import { loginExec } from "./process"

/**
 * Get output of a verbose gcc compilation (useful for search paths)
 * 
 * @returns {string} gcc output
 */
async function verboseGcc() {
  const { stderr } = await loginExec("gcc -v -x c -E /dev/null")

  return stderr
}

/**
 * Parse gcc search path from gcc output
 * 
 * @param {string} gccOutput gcc output
 * @returns {string[]} search path
 */
function parseGccSearchPath(gccOutput: string) {
  const matches: string[] = []

  const regex = /^ ((?:\/[^/\0 \n]+)+)/gm
  let [_, path] = regex.exec(gccOutput) || [null, null]

  while (path != null) {
    matches.push(path);
    [_, path] = regex.exec(gccOutput) || [null, null]
  }

  return matches
}

/**
 * Get gcc search path
 * 
 * @export
 * @returns {string[]} search path
 */
export async function getGccSearchPath() {
  return parseGccSearchPath(await verboseGcc())
}
