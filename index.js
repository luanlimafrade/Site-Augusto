import fs from "node:fs";
import http from "node:http";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function resolvePort() {
  if (process.env.PORT && !/^\d+$/.test(process.env.PORT)) {
    return process.env.PORT;
  }

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
    .listen(port, typeof port === "string" ? undefined : host, () => {
      console.error("Falha ao iniciar o backend principal.", error);
      console.log(
        `Servidor de diagnostico rodando em ${
          typeof port === "string" ? port : `${host}:${port}`
        }`
      );
    });
}

const serverEntryUrl = new URL("./server/dist/index.js", import.meta.url);
const serverEntryPath = fileURLToPath(serverEntryUrl);

if (!fs.existsSync(serverEntryPath)) {
  console.log("Build do backend nao encontrado. Executando npm run build...");
  const build = spawnSync("npm run build", {
    shell: true,
    stdio: "inherit"
  });

  if (build.status !== 0) {
    startFallbackServer(
      new Error(`npm run build falhou com codigo ${build.status ?? "desconhecido"}.`)
    );
  }
}

if (fs.existsSync(serverEntryPath)) {
  try {
    await import(serverEntryUrl.href);
  } catch (error) {
    startFallbackServer(error);
  }
} else {
  startFallbackServer(
    new Error("server/dist/index.js nao encontrado apos tentativa de build.")
  );
}
