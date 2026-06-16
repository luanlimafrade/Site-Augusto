import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createRsvp,
  deleteRsvp,
  getStats,
  listRsvps,
  updateRsvp
} from "../database.js";
import { requireAdmin } from "../middleware/auth.js";
import { rsvpSchema } from "../validation.js";

export const rsvpRouter = Router();

const rsvpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitos envios. Tente novamente em alguns minutos." }
});

rsvpRouter.post("/", rsvpLimiter, async (req, res, next) => {
  const parsed = rsvpSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0]?.message });
  }

  try {
    const rsvp = await createRsvp(parsed.data);
    return res.status(201).json({
      message:
        "Confirmação recebida com carinho. Ficamos muito felizes em compartilhar este momento com você.",
      rsvp
    });
  } catch (error) {
    return next(error);
  }
});

rsvpRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const [rsvps, stats] = await Promise.all([listRsvps(), getStats()]);
    return res.json({ rsvps, stats });
  } catch (error) {
    return next(error);
  }
});

rsvpRouter.put("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const parsed = rsvpSchema.safeParse(req.body);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Identificador inválido." });
  }

  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0]?.message });
  }

  try {
    const rsvp = await updateRsvp(id, parsed.data);
    return res.json({ rsvp });
  } catch (error) {
    if (error instanceof Error && error.message.includes("não encontrada")) {
      return res.status(404).json({ message: error.message });
    }

    return next(error);
  }
});

rsvpRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Identificador inválido." });
  }

  try {
    const deleted = await deleteRsvp(id);

    if (!deleted) {
      return res.status(404).json({ message: "Confirmação não encontrada." });
    }

    return res.json({ message: "Confirmação excluída." });
  } catch (error) {
    return next(error);
  }
});
