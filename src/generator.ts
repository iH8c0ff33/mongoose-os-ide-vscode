const template = {
  configurations: [
    {
      name: "Mongoose OS",
      includePath: [] as string[],
      intelliSenseMode: "clang-x64",
      browse: {
        path: [] as string[],
        databaseFilename: "",
        limitSymbolsToIncludedHeaders: true
      },
      defines: []
    }
  ],
  version: 2
}

/**
 * Generate config file for c-cpp vscode's extension
 * 
 * @export
 * @param {string[]} includes includePath and browse.path
 * @returns cpp config
 */
export default async function genCppConfig(includes: string[]) {
  let config = template
  config.configurations.map(it => {
    it.includePath = it.includePath.concat(includes)
    it.browse.path = it.browse.path.concat(includes)
    return it
  })

  return config
}
