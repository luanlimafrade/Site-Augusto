import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { initDatabase } from "./database.js";
import { adminRouter } from "./routes/admin.js";
import { giftsRouter } from "./routes/gifts.js";
import { mercadoPagoRouter } from "./routes/mercadoPago.js";
import { rsvpRouter } from "./routes/rsvp.js";
const app = express();
fs.mkdirSync(path.join(config.uploadsDir, "gifts"), { recursive: true });
let databaseStatus = "starting";
let databaseError = null;
function getDatabaseError(error) {
    if (!(error instanceof Error)) {
        return { message: String(error) };
    }
    const mysqlError = error;
    return {
        code: mysqlError.code,
        errno: mysqlError.errno,
        sqlState: mysqlError.sqlState,
        message: mysqlError.message
    };
}
app.use(cors({
    origin: config.nodeEnv === "production"
        ? config.frontendOrigin.split(",").map((origin) => origin.trim())
        : true
}));
app.use(express.json({ limit: "4mb" }));
app.use("/uploads", express.static(config.uploadsDir, {
    maxAge: config.nodeEnv === "production" ? "7d" : 0
}));
app.use("/uploads", (_req, res) => {
    res.status(404).json({ message: "Imagem não encontrada." });
});
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
        },
        databaseError
    });
});
app.use("/api/admin", adminRouter);
app.use("/api/gifts", giftsRouter);
app.use("/api/mercado-pago", mercadoPagoRouter);
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
app.use((error, _req, res, _next) => {
    console.error(error);
    return res.status(500).json({
        message: "Algo não saiu como esperado. Tente novamente em instantes."
    });
});
function startServer() {
    if (typeof config.port === "string") {
        app.listen(config.port, () => {
            console.log(`Servidor do casamento rodando em ${config.port}`);
        });
        return;
    }
    app.listen(config.port, config.host, () => {
        console.log(`Servidor do casamento rodando em ${config.host}:${config.port}`);
    });
}
startServer();
initDatabase()
    .then(() => {
    databaseStatus = "connected";
    databaseError = null;
})
    .catch((error) => {
    console.error("Não foi possível conectar ao MySQL.", error);
    databaseStatus = "error";
    databaseError = getDatabaseError(error);
    console.warn("Servidor iniciado sem conexão MySQL. Configure DB_USER/DB_PASSWORD para usar RSVP e admin.");
});
