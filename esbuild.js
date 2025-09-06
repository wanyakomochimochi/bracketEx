require("esbuild")
  .build({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outfile: "dist/extension.js",
    platform: "node",
    external: ["vscode"], // vscode 本体は除外
    minify: true, // サイズ縮小
  })
  .catch(() => process.exit(1));
