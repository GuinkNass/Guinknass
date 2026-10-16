import { NextRequest, NextResponse } from "next/server";
import { slotQuerySchema } from "@/lib/validations/schedule";
import { getAvailableSlots, BusyInterval } from "@/lib/scheduleValidator";
import { listCalendarBusyIntervals } from "@/lib/googleCalendar";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "";
    const type = searchParams.get("type") || "NEW";
    const duration = searchParams.get("duration") || "3";

    const validation = slotQuerySchema.safeParse({ date, type, duration });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Parâmetros de consulta de slots inválidos." },
        { status: 400 }
      );
    }

    const validData = validation.data;
    const [year, month, day] = validData.date.split("-").map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const busyIntervals: BusyInterval[] = [];

    // 1. Busca agendamentos ocupados no Banco de Dados (Confirmados e Holds temporários de 15min)
    try {
      const { prisma } = await import("@/lib/db");
      const dbAppointments = await prisma.appointment.findMany({
        where: {
          scheduledStart: { gte: dayStart, lte: dayEnd },
          OR: [
            { status: "CONFIRMED" },
            {
              status: "PENDING_PAYMENT",
              holdExpiresAt: { gt: new Date() }, // Hold ativo
            },
          ],
        },
      });

      dbAppointments.forEach((app) => {
        busyIntervals.push({
          start: new Date(app.scheduledStart),
          end: new Date(app.scheduledEnd),
        });
      });
    } catch {
      // Ignora erro se DB não estiver conectado
    }

    // 2. Busca eventos ocupados na Google Agenda
    try {
      const calendarBusy = await listCalendarBusyIntervals(dayStart, dayEnd);
      calendarBusy.forEach((interval) => {
        busyIntervals.push(interval);
      });
    } catch (err) {
      console.warn("[Slots] Não foi possível consultar Google Agenda:", err);
    }

    // 3. Executa o motor com validações estritas de janela, duração e 60 minutos de buffer
    const slots = getAvailableSlots(validData.date, validData.type, validData.duration, busyIntervals);

    return NextResponse.json({
      date: validData.date,
      type: validData.type,
      durationHours: validData.duration,
      slots,
    });
  } catch (error: any) {
    console.error("[API schedule/slots] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao calcular horários disponíveis." },
      { status: 500 }
    );
  }
}
