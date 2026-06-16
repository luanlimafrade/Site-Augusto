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
import http from "node:http";
import { fileURLToPath } from "node:url";

function resolvePort() {
  const port = Number(process.env.PORT || 3333);
  return Number.isInteger(port) && port > 0 ? port : 3333;
}

function startFallbackServer(error) {
  const port = resolvePort();
  const host = process.env.HOST || "0.0.0.0";
  const message = error instanceof Error ? error.message : String(error);

  http
    .createServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = req.url?.startsWith("/api/health") ? 200 : 500;
      res.end(
        JSON.stringify({
          ok: false,
          status: "startup-error",
          message
        })
      );
    })
    .listen(port, host, () => {
      console.error("Falha ao iniciar o backend principal.", error);
      console.log(\`Servidor de diagnostico rodando em \${host}:\${port}\`);
    });
}

const serverEntryUrl = new URL("./server/dist/index.js", import.meta.url);
const serverEntryPath = fileURLToPath(serverEntryUrl);

if (!fs.existsSync(serverEntryPath)) {
  startFallbackServer(
    new Error("server/dist/index.js nao encontrado no pacote de deploy.")
  );
} else {
  try {
    await import(serverEntryUrl.href);
  } catch (error) {
    startFallbackServer(error);
  }
}
`
);

console.log("Build de deploy copiado para dist/");
