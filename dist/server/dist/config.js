import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, "..");
const projectRoot = path.resolve(serverRoot, "..");
const initialNodeEnv = process.env.NODE_ENV || "development";
const uploadRoot = fs.existsSync(path.join(projectRoot, "client")) &&
    fs.existsSync(path.join(projectRoot, "package.json"))
    ? projectRoot
    : process.cwd();
const envFiles = [`.env.${initialNodeEnv}`, ".env"];
const envDirs = Array.from(new Set([projectRoot, serverRoot, process.cwd()]));
for (const file of envFiles) {
    for (const dir of envDirs) {
        dotenv.config({ path: path.join(dir, file) });
    }
}
const isProduction = process.env.NODE_ENV === "production";
const requiredProductionEnv = [
    "ADMIN_PASSWORD",
    "JWT_SECRET",
    "DB_HOST",
    "DB_USER",
    "DB_NAME"
];
const missingProductionEnv = isProduction
    ? requiredProductionEnv.filter((name) => !process.env[name])
    : [];
function resolveClientDistPath() {
    if (process.env.CLIENT_DIST_PATH) {
        return path.resolve(process.cwd(), process.env.CLIENT_DIST_PATH);
    }
    const candidates = [
        projectRoot,
        path.join(projectRoot, "client", "dist"),
        path.join(projectRoot, "dist"),
        path.resolve(process.cwd(), "client", "dist"),
        path.resolve(process.cwd(), "dist")
    ];
    return (candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) || candidates[1]);
}
function envValue(name, fallback = "") {
    return process.env[name] || fallback;
}
function parsePort(value, fallback = 3333) {
    if (value && !/^\d+$/.test(value)) {
        return value;
    }
    const port = Number(value || fallback);
    return Number.isInteger(port) && port > 0 ? port : fallback;
}
function parsePositiveInt(value, fallback) {
    const number = Number(value || fallback);
    return Number.isInteger(number) && number > 0 ? number : fallback;
}
export const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    host: process.env.HOST || "0.0.0.0",
    port: parsePort(process.env.PORT),
    frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    siteUrl: process.env.SITE_URL ||
        process.env.FRONTEND_ORIGIN ||
        "http://localhost:5173",
    checkoutReservationMinutes: parsePositiveInt(process.env.MP_CHECKOUT_TTL_MINUTES, 30),
    mercadoPago: {
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
        webhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || ""
    },
    adminPassword: envValue("ADMIN_PASSWORD", "troque-esta-senha"),
    jwtSecret: envValue("JWT_SECRET", "troque-este-segredo"),
    database: {
        host: envValue("DB_HOST", "localhost"),
        port: Number(parsePort(process.env.DB_PORT, 3306)),
        user: envValue("DB_USER", "root"),
        password: process.env.DB_PASSWORD || "",
        name: envValue("DB_NAME", "casamento_daiane_augusto"),
        autoCreate: process.env.DB_AUTO_CREATE === "true"
    },
    clientDistPath: resolveClientDistPath(),
    uploadsDir: process.env.UPLOADS_DIR
        ? path.resolve(process.cwd(), process.env.UPLOADS_DIR)
        : path.join(uploadRoot, "uploads"),
    missingProductionEnv
};
