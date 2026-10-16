import { z } from "zod";

// Função de validação matemática oficial de CPF brasileiro
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

export const cpfSchema = z
  .string({ required_error: "CPF é obrigatório" })
  .min(11, "CPF deve ter no mínimo 11 dígitos")
  .refine(validateCPF, "CPF inválido. Verifique os dígitos informados.");

export const searchQuoteSchema = z.object({
  cpf: cpfSchema,
});

export const slotQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
  type: z.enum(["NEW", "TOUCHUP", "NEXT_SESSION"]),
  duration: z.coerce.number().min(1, "Duração mínima é de 1 hora").max(12, "Duração máxima é de 12 horas"),
});

export const createAppointmentSchema = z.object({
  quoteId: z.string().min(1, "ID do orçamento é obrigatório"),
  cpf: cpfSchema,
  scheduledStart: z.string().datetime("Data/hora de início inválida"),
  durationHours: z.number().min(1).max(12),
  depositConsent: z.boolean().refine((val) => val === true, {
    message: "É obrigatório consentir com a política de sinal estritamente não reembolsável.",
  }),
});

export const rescheduleAppointmentSchema = z
  .object({
    quoteId: z.string().min(1, "ID do orçamento/projeto é obrigatório"),
    cpf: cpfSchema,
    appointmentType: z.enum(["TOUCHUP", "NEXT_SESSION"], {
      required_error: "Selecione o motivo do retorno (Retoque ou Próxima Sessão)",
    }),
    touchupReason: z.string().optional(),
    scheduledStart: z.string().datetime("Data/hora de início inválida"),
    durationHours: z.number().min(1).max(12),
  })
  .superRefine((data, ctx) => {
    if (data.appointmentType === "TOUCHUP") {
      if (!data.touchupReason || data.touchupReason.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Para retoque, descreva o motivo detalhado (ex: área desbotada, falha de cicatrização).",
          path: ["touchupReason"],
        });
      }
    }
  });

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "ID do agendamento é obrigatório"),
  cpf: cpfSchema,
  cancellationReason: z.string().min(3, "Por favor informe o motivo do cancelamento"),
});

export const anamneseSubmitSchema = z.object({
  appointmentId: z.string().min(1, "ID do agendamento é obrigatório"),
  clientCpf: cpfSchema,
  clientName: z.string().min(2, "Nome completo é obrigatório"),
  hasAllergies: z.boolean(),
  allergiesDetails: z.string().optional().nullable(),
  hasHealingProblems: z.boolean(),
  usesAnticoagulants: z.boolean(),
  hasDiabetes: z.boolean(),
  isPregnantOrLactating: z.boolean(),
  hasSkinDiseases: z.boolean(),
  skinDiseasesDetails: z.string().optional().nullable(),
  signatureBase64: z.string().min(50, "A assinatura digital desenhada é obrigatória."),
  skinPhotoUrl: z.string().optional().nullable(),
  referenceImages: z.array(z.string()).optional().nullable(),
});

export const chargeBalanceSchema = z.object({
  appointmentId: z.string().min(1, "ID do agendamento é obrigatório"),
});

export const infinitepayWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.string(),
    txid: z.string().optional(),
    status: z.string(), // "paid", "approved", etc.
    amount: z.number().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});
