import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { loginSchema } from "../validation.js";

export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente em alguns minutos." }
});

adminRouter.post("/login", loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0]?.message });
  }

  if (parsed.data.password !== config.adminPassword) {
    return res.status(401).json({ message: "Senha incorreta." });
  }

  const token = jwt.sign({ role: "admin" }, config.jwtSecret, {
    expiresIn: "8h"
  });

  return res.json({ token });
});
