import { NextRequest, NextResponse } from "next/server";
import { createGoogleCalendarEvent } from "@/lib/googleCalendar";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    console.log("[Webhook InfinitePay] Payload recebido:", JSON.stringify(rawBody));

    // Suporta o formato oficial do Checkout Integrado (order_nsu, amount, etc.) ou formato legado
    const appointmentId = 
      rawBody.order_nsu || 
      rawBody.data?.metadata?.appointmentId || 
      rawBody.data?.id;

    if (!appointmentId) {
      console.warn("[Webhook InfinitePay] Nenhum order_nsu / ID de agendamento encontrado.");
      return NextResponse.json({ success: false, message: "order_nsu não informado" }, { status: 400 });
    }

    const cleanAppId = appointmentId.replace(/^balance_/, "");
    const isBalancePayment = appointmentId.startsWith("balance_") || rawBody.data?.metadata?.type === "TATTOO_BALANCE_REMAINING";

    // Busca o agendamento no banco
    let appointment: any = null;
    try {
      const { prisma } = await import("@/lib/db");
      appointment = await prisma.appointment.findFirst({
        where: {
          OR: [
            { id: cleanAppId },
            { infinitepayOrderId: cleanAppId },
            { balanceOrderId: cleanAppId },
          ],
        },
        include: { quote: true },
      });

      if (!appointment) {
        console.error(`[Webhook InfinitePay] Agendamento não encontrado para ID: ${cleanAppId}`);
        return NextResponse.json({ success: false, message: "Agendamento não encontrado" }, { status: 400 });
      }

      // 1. Pagamento de Saldo Restante (75%)
      if (isBalancePayment) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            isFullyPaid: true,
            balancePaidAt: new Date(),
            balanceDue: 0,
          },
        });
        return NextResponse.json({ success: true, message: "Saldo restante liquidado com sucesso!" }, { status: 200 });
      }

      // 2. Pagamento de Sinal Inicial de 25%
      if (appointment.status === "CONFIRMED") {
        return NextResponse.json({ success: true, message: "Agendamento já confirmado anteriormente." }, { status: 200 });
      }

      const rawAmount = rawBody.paid_amount || rawBody.amount || rawBody.data?.amount;
      const paidAmount = rawAmount ? Number((rawAmount / 100).toFixed(2)) : Number(appointment.depositPaid);

      // Atualiza status para CONFIRMED e limpa o hold
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CONFIRMED",
          holdExpiresAt: null,
          depositPaid: paidAmount,
        },
      });
    } catch (err) {
      console.warn("[Webhook] DB fallback:", err);
    }

    // Cria o evento na Google Agenda (se ainda não existir)
    if (appointment && !appointment.googleCalendarEventId) {
      const googleEventId = await createGoogleCalendarEvent({
        appointmentType: "NEW",
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientCpf: appointment.clientCpf,
        style: appointment.quote?.style || "Autoral",
        tattooDescription: appointment.quote?.tattooDescription,
        scheduledStart: new Date(appointment.scheduledStart),
        scheduledEnd: new Date(appointment.scheduledEnd),
        durationHours: appointment.durationHours,
        totalPrice: Number(appointment.totalPrice),
        depositPaid: Number(appointment.depositPaid),
        balanceDue: Number(appointment.balanceDue),
        isExempt: false,
        skinPhotoUrl: appointment.skinPhotoUrl,
        referenceImages: appointment.referenceImages as string[],
      });

      try {
        const { prisma } = await import("@/lib/db");
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleCalendarEventId: googleEventId },
        });
      } catch {}
    }

    // Resposta 200 rápida conforme recomendação da InfinitePay
    return NextResponse.json({ success: true, message: null }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook InfinitePay] Erro no processamento:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no webhook" },
      { status: 500 }
    );
  }
}
