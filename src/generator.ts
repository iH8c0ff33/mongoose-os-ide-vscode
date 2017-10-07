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

export default async function genCppConfig(includes: string[]) {
  let config = template
  config.configurations.map(it => {
    it.includePath = it.includePath.concat(includes)
    it.browse.path = it.browse.path.concat(includes)
    return it
  })

  return config
}
