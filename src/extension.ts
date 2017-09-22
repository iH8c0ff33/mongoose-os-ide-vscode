"use strict";
// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, commands, window, workspace } from "vscode"
import { writeFileSync } from "fs"
import { execSync } from "child_process"

const namespace = "mongoose-os-ide"

class MongooseOSExtension {

  private _context: ExtensionContext

  async activate(context: ExtensionContext) {
    this._context = context

    this.registerCommands()

  }

  registerCommands() {
    this._context.subscriptions.push(commands.registerCommand(`${namespace}.testCommand`, async () => {
      console.log("hello world!")
      const result = await window.showInputBox({ prompt: "don't know... type something: " })
      const filePath = await workspace.findFiles("mos.yml")
      window.showInformationMessage(`you typed "${result}"... as if that even matters`)

      const sources = execSync("mos -X eval-manifest-expr sources", { cwd: workspace.rootPath })
      const mosRepoPath = execSync("mos -X get-mos-repo-dir", { cwd: workspace.rootPath })
      console.log(sources.toString())
      console.log(mosRepoPath.toString())

      this.genCppProperties(JSON.parse(sources.toString()), mosRepoPath.toString().replace(/\n/g, ""))
    }))
  }

  genCppProperties(sources: String[], mosRepoPath: String) {
    sources.map(i => i.startsWith("/") ? i : `\${workspaceRoot}/${i}`)

    sources.push(
      `${mosRepoPath}/fw/src`,
      mosRepoPath,
      "/Library/Developer/CommandLineTools/usr/lib/clang/9.0.0/include",
      "${workspaceRoot}/build/gen"
    )

    const config = {
      configurations: [
        {
          name: "Mongoose OS",
          includePath: sources,
          intelliSenseMode: "clang-x64",
          browse: {
            path: sources,
            databaseFilename: "",
            limitSymbolsToIncludedHeaders: true
          },
          defines: []
        }
      ],
      version: 2
    }

    writeFileSync(`${workspace.rootPath}/.vscode/c_cpp_properties.json`, JSON.stringify(config, null, 4))
  }
}

const mos = new MongooseOSExtension

export function activate(context: ExtensionContext) {
  mos.activate(context)
}

// this method is called when your extension is deactivated
export function deactivate() {
}