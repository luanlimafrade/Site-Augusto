import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const clientDist = path.join(rootDir, "client", "dist");
const rootDist = path.join(rootDir, "dist");

if (!fs.existsSync(clientDist)) {
  throw new Error("client/dist nao foi encontrado. Rode o build do client antes de copiar.");
}

fs.rmSync(rootDist, { recursive: true, force: true });
fs.cpSync(clientDist, rootDist, { recursive: true });

console.log("Build estatico copiado para dist/");
