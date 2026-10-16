import { STUDIO_ADDRESS, AppointmentType } from "@/types";

export interface CreateEventParams {
  appointmentType: AppointmentType;
  clientName: string;
  clientPhone: string;
  clientCpf: string;
  style?: string;
  tattooDescription?: string;
  touchupReason?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  durationHours: number;
  totalPrice: number;
  depositPaid: number;
  balanceDue: number;
  isExempt: boolean;
  skinPhotoUrl?: string | null;
  referenceImages?: string[] | null;
}

/**
 * Cria token de autenticação via Google Service Account usando JWT nativo
 */
async function getGoogleAuthToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    console.warn("[GoogleCalendar] Credenciais não configuradas no .env");
    return null;
  }

  try {
    const crypto = await import("crypto");
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };
    const payload = Buffer.from(JSON.stringify(claimSet)).toString("base64url");
    const signature = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), privateKey).toString("base64url");
    const jwt = `${header}.${payload}.${signature}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const data = await res.json();
    return data.access_token || null;
  } catch (error) {
    console.error("[GoogleCalendar] Erro ao obter auth token:", error);
    return null;
  }
}

/**
 * Busca intervalos ocupados na Google Agenda para um intervalo de datas
 */
export async function listCalendarBusyIntervals(startDate: Date, endDate: Date): Promise<{ start: Date; end: Date }[]> {
  const token = await getGoogleAuthToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!token) {
    return [];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      console.error("[GoogleCalendar] Falha ao buscar eventos:", await res.text());
      return [];
    }

    const data = await res.json();
    const items = data.items || [];

    return items
      .filter((ev: any) => ev.start?.dateTime && ev.end?.dateTime)
      .map((ev: any) => ({
        start: new Date(ev.start.dateTime),
        end: new Date(ev.end.dateTime),
      }));
  } catch (error) {
    console.error("[GoogleCalendar] Erro ao listar eventos:", error);
    return [];
  }
}

/**
 * Cria evento formatado na Google Agenda conforme os requisitos estritos do estúdio
 */
export async function createGoogleCalendarEvent(params: CreateEventParams): Promise<string | null> {
  const token = await getGoogleAuthToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!token) {
    console.warn("[GoogleCalendar] Token ausente. Simulando criação de evento.");
    return `simulated_event_${Date.now()}`;
  }

  // Definição do título oficial
  let summary = "";
  let tipoLabel = "";

  if (params.appointmentType === "NEW") {
    summary = `Tattoo: ${params.clientName} - ${params.style || "Autoral"}`;
    tipoLabel = "Novo Agendamento (1ª Sessão)";
  } else if (params.appointmentType === "TOUCHUP") {
    summary = `[RETOQUE]: ${params.clientName}`;
    tipoLabel = "Retoque";
  } else {
    summary = `[PRÓXIMA SESSÃO]: ${params.clientName}`;
    tipoLabel = "Próxima Sessão (Continuação)";
  }

  const statusFinanceiro = params.isExempt
    ? "Isento - Retorno / Continuação de Projeto"
    : `Sinal Quitado via InfinitePay (R$ ${params.depositPaid.toFixed(2)})`;

  const detailsText = params.appointmentType === "TOUCHUP"
    ? `Detalhes do Retoque: ${params.touchupReason || "Não informado"}`
    : `Descrição da Tattoo: ${params.tattooDescription || "Projeto de Tatuagem"}`;

  const imageLines = [];
  if (params.skinPhotoUrl) {
    imageLines.push(`📸 Foto da Região / Pele: ${params.skinPhotoUrl}`);
  }
  if (params.referenceImages && params.referenceImages.length > 0) {
    imageLines.push(`🎨 Referências Visuais: ${params.referenceImages.join(" | ")}`);
  }

  // Descrição rica e estruturada
  const description = [
    `📌 TIPO DE ATENDIMENTO: ${tipoLabel}`,
    `👤 CLIENTE: ${params.clientName}`,
    `📱 WHATSAPP: ${params.clientPhone}`,
    `🆔 CPF: ${params.clientCpf}`,
    `⏱️ DURAÇÃO ESTIMADA: ${params.durationHours} horas`,
    `🎨 ${detailsText}`,
    imageLines.length > 0 ? imageLines.join("\n") : "",
    `💰 VALOR TOTAL: R$ ${params.totalPrice.toFixed(2)}`,
    `💳 SINAL PAGO: R$ ${params.depositPaid.toFixed(2)}`,
    `💵 SALDO A PAGAR NO ESTÚDIO: R$ ${params.balanceDue.toFixed(2)}`,
    `📊 STATUS FINANCEIRO: ${statusFinanceiro}`,
    `📍 LOCAL: ${STUDIO_ADDRESS}`,
    `\n--\nAgendamento processado pelo Sistema Oficial Studio 13Point Tattoo`,
  ]
    .filter(Boolean)
    .join("\n");

  const eventBody = {
    summary,
    location: STUDIO_ADDRESS,
    description,
    start: {
      dateTime: params.scheduledStart.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: params.scheduledEnd.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 }, // 1 dia antes
        { method: "popup", minutes: 120 },     // 2 horas antes
      ],
    },
  };

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!res.ok) {
      console.error("[GoogleCalendar] Erro ao criar evento:", await res.text());
      return null;
    }

    const created = await res.json();
    return created.id || null;
  } catch (error) {
    console.error("[GoogleCalendar] Erro na requisição do Google Calendar:", error);
    return null;
  }
}

/**
 * Remove/cancela evento na Google Agenda quando um agendamento for cancelado
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<boolean> {
  if (!eventId) return true;
  if (eventId.startsWith("simulated_")) return true;

  const token = await getGoogleAuthToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!token) {
    console.warn("[GoogleCalendar] Token ausente. Simulando remoção de evento.");
    return true;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok && res.status !== 404) {
      console.error("[GoogleCalendar] Falha ao deletar evento:", await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[GoogleCalendar] Erro ao deletar evento na agenda:", error);
    return false;
  }
}
