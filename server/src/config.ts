import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

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
  clientDistPath: process.env.CLIENT_DIST_PATH
    ? path.resolve(process.env.CLIENT_DIST_PATH)
    : path.resolve(process.cwd(), "../client/dist")
};
