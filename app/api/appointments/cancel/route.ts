import { NextRequest, NextResponse } from "next/server";
import { cancelAppointmentSchema } from "@/lib/validations/schedule";
import { deleteGoogleCalendarEvent } from "@/lib/googleCalendar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = cancelAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Dados inválidos para cancelamento." },
        { status: 400 }
      );
    }

    const { appointmentId, cpf, cancellationReason } = validation.data;
    const cleanCpf = cpf.replace(/\D/g, "");

    let appointment: any = null;
    let calendarEventId: string | null = null;
    let quoteId: string | null = null;
    let sessionPrice = 0;

    try {
      const { prisma } = await import("@/lib/db");
      appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          clientCpf: cleanCpf,
        },
        include: { quote: true },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Agendamento não encontrado para o CPF informado." },
          { status: 404 }
        );
      }

      calendarEventId = appointment.googleCalendarEventId;
      quoteId = appointment.quoteId;
      sessionPrice = Number(appointment.totalPrice || appointment.quote?.totalPrice || 1600);

      // Atualiza o agendamento para CANCELLED_DEPOSIT_FORFEITED
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CANCELLED_DEPOSIT_FORFEITED",
          depositForfeited: true,
          cancellationReason,
          cancelledAt: new Date(),
        },
      });

      // Se for vinculado a um orçamento/projeto, aplica penalidade de cancelamento para bloqueio de reagendamento gratuito
      if (quoteId) {
        const fee = Number((sessionPrice * 0.25).toFixed(2));
        await prisma.quote.update({
          where: { id: quoteId },
          data: {
            hasCancellationPenalty: true,
            rescheduleFeeDue: fee,
          },
        });
      }
    } catch (err) {
      console.warn("[Cancel Appointment] DB fallback:", err);
    }

    // Remove o evento da Google Agenda
    if (calendarEventId) {
      await deleteGoogleCalendarEvent(calendarEventId);
    }

    return NextResponse.json({
      success: true,
      status: "CANCELLED_DEPOSIT_FORFEITED",
      message: "Agendamento cancelado com sucesso. Conforme a política de diária do estúdio, o sinal foi retido e a data liberada na agenda.",
      depositForfeited: true,
      reschedulePolicy: "Para agendar uma nova data, será necessária a quitação de um novo sinal / taxa de remarcação.",
    });
  } catch (error: any) {
    console.error("[API appointments/cancel] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o cancelamento." },
      { status: 500 }
    );
  }
}
