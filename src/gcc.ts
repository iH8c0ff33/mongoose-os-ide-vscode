import { loginExec } from "./process"

async function verboseGcc() {
  const { stderr } = await loginExec("gcc -v -x c -E /dev/null")

  return stderr
}

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

export async function getGccSearchPath() {
  return parseGccSearchPath(await verboseGcc())
}
