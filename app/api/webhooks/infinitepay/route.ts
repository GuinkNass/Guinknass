import { NextRequest, NextResponse } from "next/server";
import { infinitepayWebhookSchema } from "@/lib/validations/schedule";
import { createGoogleCalendarEvent } from "@/lib/googleCalendar";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    const validation = infinitepayWebhookSchema.safeParse(rawBody);
    if (!validation.success) {
      console.warn("[Webhook InfinitePay] Payload inválido:", validation.error.format());
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const { event, data } = validation.data;
    const appointmentId = data.metadata?.appointmentId || data.id;
    const paymentType = data.metadata?.type || "TATTOO_DEPOSIT_25";

    console.log(`[Webhook InfinitePay] Evento: ${event}, Status: ${data.status}, AppId: ${appointmentId}, Tipo: ${paymentType}`);

    // Verifica se o pagamento foi concluído com sucesso
    const isPaid = data.status === "paid" || data.status === "approved" || event === "transaction.paid";

    if (!isPaid) {
      return NextResponse.json({ received: true, status: data.status });
    }

    // Busca o agendamento no banco
    let appointment: any = null;
    try {
      const { prisma } = await import("@/lib/db");
      appointment = await prisma.appointment.findFirst({
        where: {
          OR: [
            { id: appointmentId },
            { infinitepayOrderId: data.id },
            { infinitepayTxid: data.txid },
            { balanceOrderId: data.id },
          ],
        },
        include: { quote: true },
      });

      if (!appointment) {
        console.error(`[Webhook InfinitePay] Agendamento não encontrado para ID: ${appointmentId}`);
        return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
      }

      // 1. Pagamento de Saldo Restante (75%)
      if (paymentType === "TATTOO_BALANCE_REMAINING") {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            isFullyPaid: true,
            balancePaidAt: new Date(),
            balanceDue: 0,
          },
        });
        return NextResponse.json({ success: true, message: "Saldo restante liquidado com sucesso. Projeto quitado!" });
      }

      // 2. Pagamento de Sinal Inicial de 25%
      // Se já estava confirmado, evita duplicidade
      if (appointment.status === "CONFIRMED") {
        return NextResponse.json({ message: "Agendamento já confirmado anteriormente." });
      }

      // Atualiza status para CONFIRMED e limpa o hold
      const paidAmount = Number(data.amount ? (data.amount / 100).toFixed(2) : appointment.depositPaid);
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

    return NextResponse.json({ success: true, message: "Pagamento Pix confirmado e evento agendado." });
  } catch (error: any) {
    console.error("[Webhook InfinitePay] Erro no processamento:", error);
    return NextResponse.json(
      { error: "Erro interno no webhook da InfinitePay." },
      { status: 500 }
    );
  }
}
