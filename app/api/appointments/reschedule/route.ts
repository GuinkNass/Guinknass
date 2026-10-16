import { NextRequest, NextResponse } from "next/server";
import { rescheduleAppointmentSchema } from "@/lib/validations/schedule";
import { getAvailableSlots } from "@/lib/scheduleValidator";
import { listCalendarBusyIntervals, createGoogleCalendarEvent } from "@/lib/googleCalendar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = rescheduleAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Dados inválidos para reagendamento/retorno." },
        { status: 400 }
      );
    }

    const data = validation.data;
    const cleanCpf = data.cpf.replace(/\D/g, "");

    // 1. Verifica se o cliente tem penalidade de cancelamento prévio
    let clientName = "Cliente";
    let clientPhone = "";
    let clientEmail = "";
    let tattooDescription = "Continuação de Projeto / Retoque";
    let hasPenalty = false;
    let feeDue = 0;

    try {
      const { prisma } = await import("@/lib/db");
      const quote = await prisma.quote.findUnique({ where: { id: data.quoteId } });
      if (quote) {
        clientName = quote.clientName;
        clientPhone = quote.clientPhone;
        clientEmail = quote.clientEmail;
        tattooDescription = quote.tattooDescription;
        hasPenalty = quote.hasCancellationPenalty;
        feeDue = Number(quote.rescheduleFeeDue);
      }
    } catch {
      // Mock fallback
    }

    if (hasPenalty && feeDue > 0) {
      return NextResponse.json(
        {
          error: `O reagendamento gratuito está bloqueado devido ao cancelamento de uma sessão prévia com data reservada. É necessária a quitação da Taxa de Remarcação de Data (R$ ${feeDue.toFixed(2)}).`,
          requiresFee: true,
          feeDue,
        },
        { status: 403 }
      );
    }

    const scheduledStart = new Date(data.scheduledStart);
    const scheduledEnd = new Date(scheduledStart.getTime() + data.durationHours * 60 * 60 * 1000);
    const targetDateStr = scheduledStart.toISOString().split("T")[0];

    // 2. Validação de disponibilidade do horário
    const busyIntervals = await listCalendarBusyIntervals(
      new Date(scheduledStart.getFullYear(), scheduledStart.getMonth(), scheduledStart.getDate(), 0, 0, 0),
      new Date(scheduledStart.getFullYear(), scheduledStart.getMonth(), scheduledStart.getDate(), 23, 59, 59)
    );

    const availableSlots = getAvailableSlots(targetDateStr, data.appointmentType, data.durationHours, busyIntervals);
    const targetSlotISO = scheduledStart.toISOString();

    const matchedSlot = availableSlots.find((s) => s.startISO === targetSlotISO);
    if (!matchedSlot || !matchedSlot.available) {
      return NextResponse.json(
        {
          error: "O horário selecionado não está mais disponível ou colide com o intervalo obrigatório de 1 hora entre clientes.",
        },
        { status: 409 }
      );
    }

    // 3. Grava agendamento confirmado no Banco (Isento de Sinal para retornos normais)
    let appointmentId = `app_return_${Date.now()}`;
    try {
      const { prisma } = await import("@/lib/db");
      const createdApp = await prisma.appointment.create({
        data: {
          quoteId: data.quoteId,
          clientName,
          clientCpf: cleanCpf,
          clientPhone,
          clientEmail,
          appointmentType: data.appointmentType,
          status: "CONFIRMED",
          touchupReason: data.touchupReason || null,
          scheduledStart,
          scheduledEnd,
          durationHours: data.durationHours,
          bufferMinutes: 60,
          totalPrice: 0.0,
          depositPaid: 0.0,
          balanceDue: 0.0,
        },
      });
      appointmentId = createdApp.id;
    } catch (err) {
      console.warn("[Reschedule] Banco em modo mock:", err);
    }

    // 4. Cria evento na Google Agenda com dados estritos
    const googleEventId = await createGoogleCalendarEvent({
      appointmentType: data.appointmentType,
      clientName,
      clientPhone,
      clientCpf: cleanCpf,
      tattooDescription,
      touchupReason: data.touchupReason,
      scheduledStart,
      scheduledEnd,
      durationHours: data.durationHours,
      totalPrice: 0.0,
      depositPaid: 0.0,
      balanceDue: 0.0,
      isExempt: true,
    });

    return NextResponse.json({
      success: true,
      message: `${data.appointmentType === "TOUCHUP" ? "Retoque" : "Próxima sessão"} agendado com sucesso!`,
      appointment: {
        id: appointmentId,
        type: data.appointmentType,
        status: "CONFIRMED",
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        durationHours: data.durationHours,
        isExempt: true,
        depositPaid: 0.0,
        googleCalendarEventId: googleEventId,
      },
    });
  } catch (error: any) {
    console.error("[API appointments/reschedule] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o agendamento de retorno." },
      { status: 500 }
    );
  }
}
