import { Router } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { createGift, createGiftCheckoutReservation, createGiftGroup, deleteGift, deleteGiftGroup, listGiftOrders, listGiftGroups, releaseGiftOrder, updateGiftOrderCheckout, updateGift, updateGiftGroup } from "../database.js";
import { syncPendingMercadoPagoOrders } from "../giftPaymentSync.js";
import { requireAdmin } from "../middleware/auth.js";
import { createMercadoPagoPreference } from "../mercadoPago.js";
import { giftGroupSchema, giftImageUploadSchema, giftSchema } from "../validation.js";
export const giftsRouter = Router();
const maxGiftImageBytes = 2 * 1024 * 1024;
const imageExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}
function handleGiftError(error, res) {
    if (error instanceof Error) {
        const mysqlError = error;
        if (error.message.includes("não encontrado") ||
            error.message.includes("não encontrada")) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes("Remova os presentes")) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes("foi escolhido")) {
            return res.status(409).json({ message: error.message });
        }
        if (error.message.includes("jÃ¡ foi escolhido") ||
            error.message.includes("em processo de escolha")) {
            return res.status(409).json({ message: error.message });
        }
        if (error.message.includes("Defina um valor")) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes("MERCADO_PAGO_ACCESS_TOKEN")) {
            return res.status(400).json({ message: error.message });
        }
        if (mysqlError.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Já existe um cadastro com esse nome." });
        }
        if (mysqlError.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({ message: "Selecione um grupo válido." });
        }
    }
    return null;
}
function assertImageBytes(contentType, buffer) {
    if (buffer.length === 0 || buffer.length > maxGiftImageBytes) {
        throw new Error("A imagem deve ter até 2 MB.");
    }
    const isJpeg = contentType === "image/jpeg" &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;
    const isPng = contentType === "image/png" &&
        buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = contentType === "image/webp" &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
        throw new Error("Arquivo de imagem inválido.");
    }
}
giftsRouter.get("/", async (_req, res, next) => {
    try {
        await syncPendingMercadoPagoOrders();
        const groups = await listGiftGroups();
        return res.json({ groups });
    }
    catch (error) {
        return next(error);
    }
});
giftsRouter.get("/orders", requireAdmin, async (_req, res, next) => {
    try {
        await syncPendingMercadoPagoOrders({ force: true });
        const orders = await listGiftOrders();
        return res.json({ orders });
    }
    catch (error) {
        return next(error);
    }
});
giftsRouter.post("/orders/:id/release", requireAdmin, async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Identificador invÃ¡lido." });
    }
    try {
        const order = await releaseGiftOrder(id);
        return res.json({ order });
    }
    catch (error) {
        return handleGiftError(error, res) || next(error);
    }
});
giftsRouter.post("/images", requireAdmin, async (req, res, next) => {
    const parsed = giftImageUploadSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message });
    }
    const { contentType, dataUrl } = parsed.data;
    const prefix = `data:${contentType};base64,`;
    if (!dataUrl.startsWith(prefix)) {
        return res.status(400).json({ message: "Imagem enviada em formato inválido." });
    }
    try {
        const buffer = Buffer.from(dataUrl.slice(prefix.length), "base64");
        assertImageBytes(contentType, buffer);
        const fileName = `${crypto.randomUUID()}${imageExtensions[contentType]}`;
        const uploadDir = path.join(config.uploadsDir, "gifts");
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, fileName), buffer, { flag: "wx" });
        return res.status(201).json({ imageUrl: `/uploads/gifts/${fileName}` });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
});
giftsRouter.post("/groups", requireAdmin, async (req, res, next) => {
    const parsed = giftGroupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message });
    }
    try {
        const group = await createGiftGroup(parsed.data);
        return res.status(201).json({ group });
    }
    catch (error) {
        return handleGiftError(error, res) || next(error);
    }
});
giftsRouter.put("/groups/:id", requireAdmin, async (req, res, next) => {
    const id = parseId(req.params.id);
    const parsed = giftGroupSchema.safeParse(req.body);
    if (!id) {
        return res.status(400).json({ message: "Identificador inválido." });
    }
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message });
    }
    try {
        const group = await updateGiftGroup(id, parsed.data);
        return res.json({ group });
    }
    catch (error) {
        return handleGiftError(error, res) || next(error);
    }
});
giftsRouter.delete("/groups/:id", requireAdmin, async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Identificador inválido." });
    }
    try {
        const deleted = await deleteGiftGroup(id);
        if (!deleted) {
            return res.status(404).json({ message: "Grupo de presentes não encontrado." });
        }
        return res.json({ message: "Grupo excluído." });
    }
    catch (error) {
        return handleGiftError(error, res) || next(error);
    }
});
giftsRouter.post("/", requireAdmin, async (req, res, next) => {
    const parsed = giftSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message });
    }
    try {
        const gift = await createGift(parsed.data);
        return res.status(201).json({ gift });
    }
    catch (error) {
        return handleGiftError(error, res) || next(error);
    }
});
giftsRouter.post("/:id/checkout", async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Identificador invÃ¡lido." });
    }
    try {
        const reservation = await createGiftCheckoutReservation(id);
        try {
            const preference = await createMercadoPagoPreference(reservation.order);
            const order = await updateGiftOrderCheckout(reservation.order.id, {
                preferenceId: preference.preferenceId,
                checkoutUrl: preference.checkoutUrl
            });
            return res.status(201).json({
                order,
                checkoutUrl: preference.checkoutUrl,
                message: "Reserva criada. Redirecionando para o Mercado Pago."
            });
        }
        catch (checkoutError) {
            await releaseGiftOrder(reservation.order.id);
            throw checkoutError;
        }
    }
    catch (error) {
        return handleGiftError(error, res) || next(error);
    }
});
giftsRouter.put("/:id", requireAdmin, async (req, res, next) => {
    const id = parseId(req.params.id);
    const parsed = giftSchema.safeParse(req.body);
    if (!id) {
        return res.status(400).json({ message: "Identificador inválido." });
    }
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message });
    }
    try {
        const gift = await updateGift(id, parsed.data);
        return res.json({ gift });
    }
    catch (error) {
        return handleGiftError(error, res) || next(error);
    }
});
giftsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Identificador inválido." });
    }
    try {
        const deleted = await deleteGift(id);
        if (!deleted) {
            return res.status(404).json({ message: "Presente não encontrado." });
        }
        return res.json({ message: "Presente excluído." });
    }
    catch (error) {
        return next(error);
    }
});
