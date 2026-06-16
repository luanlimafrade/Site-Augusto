import fs from "node:fs";
import { fileURLToPath } from "node:url";

const serverEntryUrl = new URL("./server/dist/index.js", import.meta.url);
const serverEntryPath = fileURLToPath(serverEntryUrl);

if (!fs.existsSync(serverEntryPath)) {
  console.error(
    "server/dist/index.js nao encontrado. Rode `npm install` e `npm run build` antes de iniciar o app."
  );
  process.exit(1);
}

await import(serverEntryUrl.href);
