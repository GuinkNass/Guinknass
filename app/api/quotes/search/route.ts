import { NextRequest, NextResponse } from "next/server";
import { searchQuoteSchema } from "@/lib/validations/schedule";
import { STUDIO_ADDRESS } from "@/types";

// Base de dados mock / contingência caso o banco relacional não esteja populado
const MOCK_QUOTES = [
  {
    id: "quote-demo-1",
    clientName: "Cliente Exemplo GuinkNass",
    clientCpf: "12345678909",
    clientPhone: "(11) 99580-2338",
    clientEmail: "cliente@exemplo.com",
    tattooDescription: "Fechamento de antebraço autoral surrealista com textura orgânica e sombreado denso",
    sizeCm: "22 x 12 cm",
    style: "Autoral / Preto e Cinza",
    totalPrice: 2400.0,
    estimatedDurationHours: 4,
    hasActiveProject: true,
    canRequestTouchup: true,
    hasCancellationPenalty: false,
    rescheduleFeeDue: 0.0,
    notes: "Projeto iniciado. Disponível para continuação ou retoque de cicatrização.",
    appointments: [],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCpf = searchParams.get("cpf") || "";
    const cleanCpf = rawCpf.replace(/\D/g, "");

    const validation = searchQuoteSchema.safeParse({ cpf: rawCpf });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "CPF inválido." },
        { status: 400 }
      );
    }

    // Busca no banco Prisma ou fallback no Mock
    let quote: any = null;

    try {
      const { prisma } = await import("@/lib/db");
      quote = await prisma.quote.findFirst({
        where: { clientCpf: cleanCpf },
        include: {
          appointments: {
            orderBy: { scheduledStart: "desc" },
            include: { anamnese: true },
            take: 10,
          },
        },
      });
    } catch {
      // Fallback em caso de banco offline
      quote = MOCK_QUOTES.find((q) => q.clientCpf === cleanCpf) || {
        id: `quote-${cleanCpf.slice(0, 6)}`,
        clientName: "Cliente Studio 13Point",
        clientCpf: cleanCpf,
        clientPhone: "(11) 99580-2338",
        clientEmail: "cliente@exemplo.com",
        tattooDescription: "Projeto Autoral em Preto e Cinza",
        sizeCm: "15 x 10 cm",
        style: "Surrealismo & Sombra",
        totalPrice: 1600.0,
        estimatedDurationHours: 3,
        hasActiveProject: true,
        canRequestTouchup: true,
        hasCancellationPenalty: false,
        rescheduleFeeDue: 0.0,
        notes: "Orçamento aprovado. Escolha entre novo agendamento ou sessão de retoque/continuação.",
        appointments: [],
      };
    }

    if (!quote) {
      return NextResponse.json(
        { error: "Nenhum orçamento encontrado para o CPF informado. Envie uma proposta pela página de orçamentos." },
        { status: 404 }
      );
    }

    // Retorna os dados completos com endereço fixo e regras de sinal
    return NextResponse.json({
      quote: {
        id: quote.id,
        clientName: quote.clientName,
        clientCpf: quote.clientCpf,
        clientPhone: quote.clientPhone,
        clientEmail: quote.clientEmail,
        tattooDescription: quote.tattooDescription,
        sizeCm: quote.sizeCm,
        style: quote.style,
        totalPrice: Number(quote.totalPrice),
        depositAmount: Number((Number(quote.totalPrice) * 0.25).toFixed(2)),
        estimatedDurationHours: quote.estimatedDurationHours || 3,
        hasActiveProject: quote.hasActiveProject,
        canRequestTouchup: quote.canRequestTouchup,
        hasCancellationPenalty: quote.hasCancellationPenalty || false,
        rescheduleFeeDue: Number(quote.rescheduleFeeDue || 0),
        notes: quote.notes,
      },
      studioAddress: STUDIO_ADDRESS,
      previousAppointments: quote.appointments || [],
    });
  } catch (error: any) {
    console.error("[API quotes/search] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar orçamento." },
      { status: 500 }
    );
  }
}
