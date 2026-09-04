/* Compile compteur-poker.jsx en un index.html autonome (React inclus). */
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";

const result = await build({
  entryPoints: ["main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "transform",
  legalComments: "eof",
  loader: { ".jsx": "jsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  outfile: "bundle.js",
});

const bundle = result.outputFiles[0].text;
const template = await readFile("template.html", "utf8");
await writeFile("index.html", template.replace("__BUNDLE__", () => `\n${bundle}\n`));

console.log(`index.html écrit (${bundle.length} caractères de bundle)`);
