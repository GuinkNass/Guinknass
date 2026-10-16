import { NextRequest, NextResponse } from "next/server";
import { searchQuoteSchema } from "@/lib/validations/schedule";
import { STUDIO_ADDRESS } from "@/types";
import { findQuoteByCpf } from "@/lib/quotesStore";

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

    // 1. Busca primeiro no store resiliente (orçamentos cadastrados via site ou publicados via Google Sheets)
    const storedQuote = findQuoteByCpf(cleanCpf);

    // Se estiver no store mas ainda estiver PENDENTE de valor
    if (storedQuote && storedQuote.status === "PENDENTE") {
      return NextResponse.json(
        {
          status: "PENDING_REVIEW",
          message: "Seu orçamento foi recebido e está em análise pelo artista GuinkNass. Assim que o valor for aprovado na planilha, seu agendamento estará disponível aqui!",
          clientName: storedQuote.clientName,
        },
        { status: 200 }
      );
    }

    // 2. Busca no banco relacional Prisma
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
      // Prisma offline
    }

    // Se achou no store aprovado, usa os dados do store
    if (storedQuote && storedQuote.status === "APROVADO") {
      return NextResponse.json({
        quote: {
          id: storedQuote.id,
          clientName: storedQuote.clientName,
          clientCpf: storedQuote.clientCpf,
          clientPhone: storedQuote.clientPhone,
          clientEmail: storedQuote.clientEmail,
          tattooDescription: storedQuote.tattooDescription,
          sizeCm: storedQuote.sizeCm,
          style: storedQuote.style,
          totalPrice: storedQuote.totalPrice,
          depositAmount: 150.0,
          estimatedDurationHours: storedQuote.estimatedDurationHours || 3,
          sessionsCount: storedQuote.sessionsCount || 1,
          hasActiveProject: true,
          canRequestTouchup: false,
          hasCancellationPenalty: false,
          rescheduleFeeDue: 0.0,
          notes: storedQuote.notes || "Orçamento aprovado pelo artista. Escolha sua data e confirme com sinal de R$ 150,00.",
        },
        studioAddress: STUDIO_ADDRESS,
        previousAppointments: quote?.appointments || [],
      });
    }

    // Se achou no Prisma
    if (quote) {
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
          depositAmount: 150.0,
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
    }

    // 3. Fallback Direto no Google Sheets Webhook (dados em tempo real da planilha)
    try {
      const gsWebhookUrl = process.env.GOOGLE_SHEETS_BUDGET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbznrzPLyTQ0BA23BXwhcXq0R1tJeMojvCK7nOAPOVHrW0XAPR3eO56ShDnuVM-XXZgu3Q/exec";
      const gsRes = await fetch(`${gsWebhookUrl}?cpf=${encodeURIComponent(cleanCpf)}`, {
        cache: "no-store",
      });

      if (gsRes.ok) {
        const gsData = await gsRes.json();
        if (gsData && gsData.found && gsData.quote) {
          saveOrUpdateQuote(gsData.quote);

          if (gsData.status === "PENDING_REVIEW") {
            return NextResponse.json(
              {
                status: "PENDING_REVIEW",
                message: gsData.message || "Seu orçamento foi recebido e está em análise pelo artista GuinkNass.",
                clientName: gsData.quote.clientName,
              },
              { status: 200 }
            );
          }

          return NextResponse.json({
            quote: gsData.quote,
            studioAddress: STUDIO_ADDRESS,
            previousAppointments: [],
          });
        }
      }
    } catch (gsErr) {
      console.warn("[quotes/search] Falha ao consultar Webhook Google Sheets:", gsErr);
    }

    return NextResponse.json(
      { error: "Nenhum orçamento encontrado para o CPF informado. Envie uma proposta pela página de orçamentos." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[API quotes/search] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar orçamento." },
      { status: 500 }
    );
  }
}
