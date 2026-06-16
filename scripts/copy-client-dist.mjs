import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const clientDist = path.join(rootDir, "client", "dist");
const serverDist = path.join(rootDir, "server", "dist");
const serverPackageJson = path.join(rootDir, "server", "package.json");
const rootDist = path.join(rootDir, "dist");

if (!fs.existsSync(clientDist)) {
  throw new Error("client/dist nao foi encontrado. Rode o build do client antes de copiar.");
}

if (!fs.existsSync(serverDist)) {
  throw new Error("server/dist nao foi encontrado. Rode o build do server antes de copiar.");
}

fs.rmSync(rootDist, { recursive: true, force: true });
fs.cpSync(clientDist, rootDist, { recursive: true });
fs.mkdirSync(path.join(rootDist, "server"), { recursive: true });
fs.cpSync(serverDist, path.join(rootDist, "server", "dist"), { recursive: true });

const serverPackage = JSON.parse(fs.readFileSync(serverPackageJson, "utf8"));
fs.writeFileSync(
  path.join(rootDist, "package.json"),
  `${JSON.stringify(
    {
      private: true,
      type: "module",
      scripts: {
        start: "node index.js"
      },
      dependencies: serverPackage.dependencies
    },
    null,
    2
  )}\n`
);

fs.writeFileSync(
  path.join(rootDist, "index.js"),
  `import fs from "node:fs";
import { fileURLToPath } from "node:url";

const serverEntryUrl = new URL("./server/dist/index.js", import.meta.url);
const serverEntryPath = fileURLToPath(serverEntryUrl);

if (!fs.existsSync(serverEntryPath)) {
  console.error("server/dist/index.js nao encontrado no pacote de deploy.");
  process.exit(1);
}

await import(serverEntryUrl.href);
`
);

console.log("Build de deploy copiado para dist/");
