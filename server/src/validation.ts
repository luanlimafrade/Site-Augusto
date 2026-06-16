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

export type RsvpInput = z.infer<typeof rsvpSchema>;
