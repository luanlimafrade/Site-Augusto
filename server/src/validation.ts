import { z } from "zod";

export const rsvpSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome completo."),
    phone: z.string().trim().min(10, "Informe um telefone/WhatsApp válido."),
    attending: z.boolean(),
    partySize: z.coerce.number().int().min(0).max(20),
    inviteeNames: z.string().trim().max(500).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal(""))
  })
  .superRefine((value, ctx) => {
    if (value.attending && value.partySize < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["partySize"],
        message: "Informe a quantidade de pessoas incluídas no convite."
      });
    }
  });

export const loginSchema = z.object({
  password: z.string().min(1, "Informe a senha.")
});

const imageUrlSchema = z
  .string()
  .trim()
  .max(500, "A imagem deve ter no máximo 500 caracteres.")
  .refine(
    (value) =>
      value.startsWith("https://") ||
      value.startsWith("/fotos/") ||
      value.startsWith("/uploads/gifts/"),
    "Use uma URL https://, uma imagem local em /fotos/ ou envie uma imagem."
  );

export const giftImageUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataUrl: z.string().min(1)
});

export const giftGroupSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do grupo.").max(80),
  description: z.string().trim().max(280).optional().or(z.literal(""))
});

export const giftSchema = z.object({
  groupId: z.coerce.number().int().positive("Selecione um grupo."),
  name: z.string().trim().min(2, "Informe o nome do presente.").max(120),
  imageUrl: imageUrlSchema,
  imageFit: z.enum(["cover", "contain"]).optional().or(z.literal("")),
  imagePosition: z.string().trim().max(40).optional().or(z.literal("")),
  priceCents: z.coerce.number().int().min(0).max(10000000),
  purchaseStatus: z
    .enum(["available", "reserved", "sold"])
    .optional()
    .or(z.literal(""))
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type GiftGroupInput = z.infer<typeof giftGroupSchema>;
export type GiftInput = z.infer<typeof giftSchema>;
export type GiftImageUploadInput = z.infer<typeof giftImageUploadSchema>;
