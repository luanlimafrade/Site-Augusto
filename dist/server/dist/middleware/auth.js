import jwt from "jsonwebtoken";
import { config } from "../config.js";
export function requireAdmin(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) {
        return res.status(401).json({ message: "Acesso não autorizado." });
    }
    try {
        jwt.verify(token, config.jwtSecret);
        return next();
    }
    catch {
        return res.status(401).json({ message: "Sessão expirada ou inválida." });
    }
}
