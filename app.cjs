const fs = require("node:fs");
const http = require("node:http");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

function resolvePort() {
  if (process.env.PORT && !/^\d+$/.test(process.env.PORT)) {
    return process.env.PORT;
  }

  const port = Number(process.env.PORT || 3333);
  return Number.isInteger(port) && port > 0 ? port : 3333;
}

function listen(server, callback) {
  const port = resolvePort();
  const host = process.env.HOST || "0.0.0.0";

  if (typeof port === "string") {
    server.listen(port, callback);
    return;
  }

  server.listen(port, host, callback);
}

function startFallbackServer(error) {
  const message = error instanceof Error ? error.message : String(error);

  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = req.url && req.url.startsWith("/api/health") ? 200 : 500;
    res.end(
      JSON.stringify({
        ok: false,
        status: "startup-error",
        message
      })
    );
  });

  listen(server, () => {
    console.error("Falha ao iniciar o backend principal.", error);
    console.log("Servidor de diagnostico iniciado.");
  });
}

const serverEntryCandidates = [
  path.join(__dirname, "server", "dist", "index.js"),
  path.join(__dirname, "dist", "server", "dist", "index.js")
];

function findServerEntry() {
  return serverEntryCandidates.find((entryPath) => fs.existsSync(entryPath));
}

async function start() {
  let serverEntryPath = findServerEntry();

  if (!serverEntryPath) {
    console.log("Build do backend nao encontrado. Executando npm run build...");
    const build = spawnSync("npm run build", {
      shell: true,
      stdio: "inherit"
    });

    if (build.status !== 0) {
      startFallbackServer(
        new Error(`npm run build falhou com codigo ${build.status ?? "desconhecido"}.`)
      );
      return;
    }

    serverEntryPath = findServerEntry();
  }

  if (!serverEntryPath) {
    startFallbackServer(
      new Error("server/dist/index.js nao encontrado apos tentativa de build.")
    );
    return;
  }

  try {
    await import(pathToFileURL(serverEntryPath).href);
  } catch (error) {
    startFallbackServer(error);
  }
}

start();
