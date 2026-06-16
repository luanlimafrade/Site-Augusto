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

function resolveClientDistPath() {
  if (process.env.CLIENT_DIST_PATH) {
    return path.resolve(process.cwd(), process.env.CLIENT_DIST_PATH);
  }

  const candidates = [
    path.join(projectRoot, "client", "dist"),
    path.join(projectRoot, "dist"),
    path.resolve(process.cwd(), "client", "dist"),
    path.resolve(process.cwd(), "dist")
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function requiredEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback;
  if (!value && isProduction) {
    throw new Error(`Configure a variável de ambiente ${name}.`);
  }
  return value || "";
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3333),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  adminPassword: requiredEnv("ADMIN_PASSWORD", "troque-esta-senha"),
  jwtSecret: requiredEnv("JWT_SECRET", "troque-este-segredo"),
  database: {
    host: requiredEnv("DB_HOST", "localhost"),
    port: Number(process.env.DB_PORT || 3306),
    user: requiredEnv("DB_USER", "root"),
    password: process.env.DB_PASSWORD || "",
    name: requiredEnv("DB_NAME", "casamento_daiane_augusto"),
    autoCreate: process.env.DB_AUTO_CREATE === "true"
  },
  clientDistPath: resolveClientDistPath()
};
