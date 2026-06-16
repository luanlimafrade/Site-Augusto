import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Send, UsersRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHero } from "../components/PageHero";
import { api } from "../lib/api";
import { photos } from "../data/photos";
import { siteConfig } from "../data/siteConfig";

const rsvpSchema = z
  .object({
    name: z.string().min(3, "Informe seu nome completo."),
    phone: z.string().min(10, "Informe um telefone/WhatsApp válido."),
    attending: z.enum(["yes", "no"], {
      required_error: "Selecione uma opção."
    }),
    partySize: z.coerce.number().int().min(0).max(20),
    inviteeNames: z.string().optional(),
    notes: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.attending === "yes" && value.partySize < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["partySize"],
        message: "Informe a quantidade de pessoas incluídas no convite."
      });
    }
  });

type RsvpFormData = z.infer<typeof rsvpSchema>;

const inputClass =
  "focus-ring w-full rounded-2xl border border-moss/15 bg-white/78 px-4 py-3 text-ink shadow-sm outline-none transition placeholder:text-ink/35 focus:border-plum";

export function RsvpPage() {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      attending: "yes",
      partySize: 1
    }
  });

  const attending = watch("attending");

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setServerMessage(null);

    try {
      const payload = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        attending: data.attending === "yes",
        partySize: data.attending === "yes" ? Number(data.partySize) : 0,
        inviteeNames: data.inviteeNames?.trim(),
        notes: data.notes?.trim()
      };

      const result = await api.sendRsvp(payload);
      setServerMessage(result.message || siteConfig.successText);
      reset({ attending: "yes", partySize: 1 });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar sua confirmação agora."
      );
    }
  });

  return (
    <main>
      <PageHero
        eyebrow="Confirmação de presença"
        title="Confirme sua presença com carinho"
        text={`${siteConfig.rsvpText} O prazo para confirmação é ${siteConfig.rsvpDeadlineLabel}.`}
        image={photos.rsvp}
      />

      <section className="page-shell grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-[1.5rem] border border-moss/10 bg-white/65 p-6 shadow-sm">
          <UsersRound className="text-plum" size={28} />
          <h2 className="mt-5 font-display text-4xl font-semibold text-moss">
            Convite pessoal
          </h2>
          <p className="mt-4 text-sm leading-7 text-ink/68">
            Para cuidarmos bem de cada detalhe, pedimos que a confirmação seja
            feita apenas para as pessoas incluídas no convite entregue
            presencialmente.
          </p>
          <p className="mt-4 text-sm leading-7 text-ink/68">
            Caso não possa comparecer, sua resposta também nos ajuda muito na
            organização.
          </p>
        </aside>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[1.5rem] border border-moss/10 bg-white/75 p-5 shadow-soft md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-moss">Nome completo</span>
              <input
                className={`${inputClass} mt-2`}
                placeholder="Seu nome"
                {...register("name")}
              />
              {errors.name ? (
                <span className="mt-2 block text-sm text-red-700">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <label>
              <span className="text-sm font-semibold text-moss">
                Telefone/WhatsApp
              </span>
              <input
                className={`${inputClass} mt-2`}
                placeholder="(37) 99999-9999"
                {...register("phone")}
              />
              {errors.phone ? (
                <span className="mt-2 block text-sm text-red-700">
                  {errors.phone.message}
                </span>
              ) : null}
            </label>

            <label>
              <span className="text-sm font-semibold text-moss">
                Confirma presença?
              </span>
              <select className={`${inputClass} mt-2`} {...register("attending")}>
                <option value="yes">Sim, estarei presente</option>
                <option value="no">Não poderei comparecer</option>
              </select>
              {errors.attending ? (
                <span className="mt-2 block text-sm text-red-700">
                  {errors.attending.message}
                </span>
              ) : null}
            </label>

            {attending === "yes" ? (
              <>
                <label>
                  <span className="text-sm font-semibold text-moss">
                    Pessoas incluídas no convite
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={`${inputClass} mt-2`}
                    {...register("partySize")}
                  />
                  {errors.partySize ? (
                    <span className="mt-2 block text-sm text-red-700">
                      {errors.partySize.message}
                    </span>
                  ) : null}
                </label>

                <label>
                  <span className="text-sm font-semibold text-moss">
                    Nomes das pessoas do convite
                  </span>
                  <input
                    className={`${inputClass} mt-2`}
                    placeholder="Ex.: Maria e João"
                    {...register("inviteeNames")}
                  />
                </label>
              </>
            ) : null}

            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-moss">Observações</span>
              <textarea
                rows={4}
                className={`${inputClass} mt-2 resize-none`}
                placeholder="Alguma informação importante?"
                {...register("notes")}
              />
            </label>
          </div>

          {serverMessage ? (
            <div className="mt-6 flex gap-3 rounded-2xl bg-sage/14 p-4 text-sm font-medium text-moss">
              <CheckCircle2 size={19} />
              <span>{serverMessage}</span>
            </div>
          ) : null}

          {serverError ? (
            <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
              {serverError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-ivory shadow-soft transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-65 md:w-auto"
          >
            <Send size={18} />
            {isSubmitting ? "Enviando..." : "Enviar confirmação"}
          </button>
        </motion.form>
      </section>
    </main>
  );
}
