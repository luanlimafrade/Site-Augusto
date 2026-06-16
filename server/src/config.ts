import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, "..");
const projectRoot = path.resolve(serverRoot, "..");
const initialNodeEnv = process.env.NODE_ENV || "development";

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

  return (
    candidates.find((candidate) =>
      fs.existsSync(path.join(candidate, "index.html"))
    ) || candidates[1]
  );
}

function envValue(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function parsePort(value: string | undefined) {
  const port = Number(value || 3333);
  return Number.isInteger(port) && port > 0 ? port : 3333;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  host: process.env.HOST || "0.0.0.0",
  port: parsePort(process.env.PORT),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  adminPassword: envValue("ADMIN_PASSWORD", "troque-esta-senha"),
  jwtSecret: envValue("JWT_SECRET", "troque-este-segredo"),
  database: {
    host: envValue("DB_HOST", "localhost"),
    port: parsePort(process.env.DB_PORT || "3306"),
    user: envValue("DB_USER", "root"),
    password: process.env.DB_PASSWORD || "",
    name: envValue("DB_NAME", "casamento_daiane_augusto"),
    autoCreate: process.env.DB_AUTO_CREATE === "true"
  },
  clientDistPath: resolveClientDistPath(),
  missingProductionEnv
};
