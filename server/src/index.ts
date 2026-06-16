import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { initDatabase } from "./database.js";
import { adminRouter } from "./routes/admin.js";
import { rsvpRouter } from "./routes/rsvp.js";

const app = express();
let databaseStatus: "starting" | "connected" | "error" = "starting";

app.use(
  cors({
    origin:
      config.nodeEnv === "production"
        ? config.frontendOrigin.split(",").map((origin) => origin.trim())
        : true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    database: databaseStatus,
    runtime: {
      nodeEnv: config.nodeEnv,
      host: config.host,
      port: config.port,
      clientDist: fs.existsSync(config.clientDistPath),
      missingEnv: config.missingProductionEnv
    }
  });
});

app.use("/api/admin", adminRouter);
app.use("/api/rsvp", rsvpRouter);

if (fs.existsSync(config.clientDistPath)) {
  app.use(express.static(config.clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(path.join(config.clientDistPath, "index.html"));
  });
}

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);
    return res.status(500).json({
      message: "Algo não saiu como esperado. Tente novamente em instantes."
    });
  }
);

function startServer() {
  app.listen(config.port, config.host, () => {
    console.log(
      `Servidor do casamento rodando em ${config.host}:${config.port}`
    );
  });
}

startServer();

initDatabase()
  .then(() => {
    databaseStatus = "connected";
  })
  .catch((error) => {
    console.error("Não foi possível conectar ao MySQL.", error);

    databaseStatus = "error";

    console.warn(
      "Servidor iniciado sem conexão MySQL. Configure DB_USER/DB_PASSWORD para usar RSVP e admin."
    );
  });
