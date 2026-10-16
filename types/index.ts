export type AppointmentType = 'NEW' | 'TOUCHUP' | 'NEXT_SESSION';

export type AppointmentStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'CANCELLED_DEPOSIT_FORFEITED' 
  | 'COMPLETED';

export interface QuoteDTO {
  id: string;
  clientName: string;
  clientCpf: string;
  clientPhone: string;
  clientEmail: string;
  tattooDescription: string;
  sizeCm: string;
  style: string;
  totalPrice: number;
  depositAmount?: number;
  estimatedDurationHours: number;
  hasActiveProject: boolean;
  canRequestTouchup: boolean;
  hasCancellationPenalty?: boolean;
  rescheduleFeeDue?: number;
  notes?: string | null;
}

export interface AnamneseDTO {
  id?: string;
  appointmentId: string;
  clientCpf: string;
  clientName: string;
  hasAllergies: boolean;
  allergiesDetails?: string | null;
  hasHealingProblems: boolean;
  usesAnticoagulants: boolean;
  hasDiabetes: boolean;
  isPregnantOrLactating: boolean;
  hasSkinDiseases: boolean;
  skinDiseasesDetails?: string | null;
  signatureBase64: string;
  signedAt?: string;
}

export interface AppointmentDTO {
  id: string;
  quoteId?: string | null;
  clientName: string;
  clientCpf: string;
  clientPhone: string;
  clientEmail: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  touchupReason?: string | null;
  scheduledStart: string; // ISO string
  scheduledEnd: string;   // ISO string
  durationHours: number;
  bufferMinutes: number;
  totalPrice: number;
  depositPaid: number;
  balanceDue: number;
  isFullyPaid?: boolean;
  balancePaidAt?: string | null;
  
  depositConsent?: boolean;
  depositForfeited?: boolean;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  
  skinPhotoUrl?: string | null;
  referenceImages?: string[] | null;
  
  holdExpiresAt?: string | null;
  infinitepayOrderId?: string | null;
  infinitepayQrCode?: string | null;
  infinitepayCopiaECola?: string | null;
  googleCalendarEventId?: string | null;
  createdAt: string;
  
  anamnese?: AnamneseDTO | null;
}

export interface TimeSlot {
  start: string; // "13:00"
  end: string;   // "16:00"
  startISO: string;
  endISO: string;
  available: boolean;
  reason?: string;
}

export const STUDIO_ADDRESS = "Studio 13Point Tattoo - Rua Marechal Fontoura, 26, Água Fria, São Paulo - SP";

// Geradores de Link Direto de WhatsApp (Sem Custo de API)
export function getWhatsAppPreCareLink(phone: string, clientName: string, dateFormatted: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const targetPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  
  const text = encodeURIComponent(
    `Olá, ${clientName}! Aqui é do Studio 13Point Tattoo (GuinkNass).\n\n` +
    `Sua sessão está agendada para *${dateFormatted}* no endereço:\n` +
    `📍 ${STUDIO_ADDRESS}\n\n` +
    `*GUIA DE CUIDADOS PRÉ-SESSÃO:*\n` +
    `1. Tenha uma boa noite de sono antes do atendimento.\n` +
    `2. Alimente-se bem antes de vir ao estúdio (não venha em jejum).\n` +
    `3. Beba bastante água nas 48h anteriores para hidratar a pele.\n` +
    `4. NÃO ingira bebidas alcoólicas nem medicamentos anticoagulantes nas 24h que antecedem a tattoo.\n` +
    `5. Venha com roupas confortáveis e de fácil acesso ao local que será tatuado.\n\n` +
    `Qualquer dúvida antes da sessão, é só nos chamar!`
  );

  return `https://wa.me/${targetPhone}?text=${text}`;
}

export function getWhatsAppAftercareLink(phone: string, clientName: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const targetPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  
  const text = encodeURIComponent(
    `Olá, ${clientName}! Aqui é o GuinkNass do Studio 13Point Tattoo.\n\n` +
    `Parabéns pela sua nova tattoo! Agora o resultado final impecável depende dos cuidados durante os próximos 30 dias.\n\n` +
    `*GUIA OFICIAL DE CICATRIZAÇÃO (AFTERCARE):*\n` +
    `• *Primeiros 3 dias:* Lave a tattoo de 2 a 3 vezes ao dia com água fria/morna e sabonete neutro antibacteriano. Seque suavemente com papel toalha descartável (não esfregue pano).\n` +
    `• *Pomada Cicatrizante:* Aplique uma camada BEM FINA de pomada específica a partir do 2º ou 3º dia, espalhando até a pele absorver (não deixe excesso).\n` +
    `• *NÃO remova as casquinhas* e evite coçar em hipótese alguma.\n` +
    `• *PROIBIDO por 30 dias:* Banho de imersão (mar, piscina, banheira), sol direto na tatuagem e sauna.\n` +
    `• Evite alimentos ultraprocessados ou muito gordurosos na primeira semana.\n\n` +
    `Após 30 dias de cicatrização completa, nos envie uma foto nítida para avaliarmos se há necessidade de algum retoque!`
  );

  return `https://wa.me/${targetPhone}?text=${text}`;
}
