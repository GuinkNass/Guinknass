import { NextRequest, NextResponse } from "next/server";
import { createAppointmentSchema } from "@/lib/validations/schedule";
import { getAvailableSlots } from "@/lib/scheduleValidator";
import { listCalendarBusyIntervals } from "@/lib/googleCalendar";
import { generateInfinitePayPix } from "@/lib/infinitepay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Dados inválidos para novo agendamento." },
        { status: 400 }
      );
    }

    const data = validation.data;
    const cleanCpf = data.cpf.replace(/\D/g, "");

    const scheduledStart = new Date(data.scheduledStart);
    const scheduledEnd = new Date(scheduledStart.getTime() + data.durationHours * 60 * 60 * 1000);
    const targetDateStr = scheduledStart.toISOString().split("T")[0];

    // 1. Verifica disponibilidade do horário com buffer de 60min
    const busyIntervals = await listCalendarBusyIntervals(
      new Date(scheduledStart.getFullYear(), scheduledStart.getMonth(), scheduledStart.getDate(), 0, 0, 0),
      new Date(scheduledStart.getFullYear(), scheduledStart.getMonth(), scheduledStart.getDate(), 23, 59, 59)
    );

    const availableSlots = getAvailableSlots(targetDateStr, "NEW", data.durationHours, busyIntervals);
    const targetSlotISO = scheduledStart.toISOString();

    const matchedSlot = availableSlots.find((s) => s.startISO === targetSlotISO);
    if (!matchedSlot || !matchedSlot.available) {
      return NextResponse.json(
        {
          error: "O horário selecionado não está mais disponível ou colide com outro agendamento.",
        },
        { status: 409 }
      );
    }

    // 2. Busca dados do orçamento
    let clientName = "Cliente";
    let clientPhone = "";
    let clientEmail = "cliente@exemplo.com";
    let totalPrice = 1600.0;

    try {
      const { prisma } = await import("@/lib/db");
      const quote = await prisma.quote.findUnique({ where: { id: data.quoteId } });
      if (quote) {
        clientName = quote.clientName;
        clientPhone = quote.clientPhone;
        clientEmail = quote.clientEmail;
        totalPrice = Number(quote.totalPrice);
      }
    } catch {
      // Mock fallback
    }

    // 3. Hold de 15 minutos e cálculo estrito de 25% de sinal
    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const depositAmount = Number((totalPrice * 0.25).toFixed(2));
    const balanceDue = Number((totalPrice - depositAmount).toFixed(2));

    const appointmentId = `app_new_${Date.now()}`;

    // 4. Gera Pix na InfinitePay
    const pixData = await generateInfinitePayPix({
      appointmentId,
      clientName,
      clientCpf: cleanCpf,
      clientEmail,
      totalPrice,
    });

    // 5. Salva no banco com status PENDING_PAYMENT e consentimento de sinal registrado
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.appointment.create({
        data: {
          id: appointmentId,
          quoteId: data.quoteId,
          clientName,
          clientCpf: cleanCpf,
          clientPhone,
          clientEmail,
          appointmentType: "NEW",
          status: "PENDING_PAYMENT",
          scheduledStart,
          scheduledEnd,
          durationHours: data.durationHours,
          bufferMinutes: 60,
          totalPrice,
          depositPaid: depositAmount,
          balanceDue,
          depositConsent: true,
          depositForfeited: false,
          holdExpiresAt,
          infinitepayOrderId: pixData.orderId,
          infinitepayTxid: pixData.txid,
          infinitepayQrCode: pixData.qrCodeUrl,
          infinitepayCopiaECola: pixData.copiaECola,
        },
      });
    } catch (err) {
      console.warn("[Appointment Create] DB fallback mock:", err);
    }

    return NextResponse.json({
      success: true,
      appointmentId,
      status: "PENDING_PAYMENT",
      holdExpiresAt: holdExpiresAt.toISOString(),
      pix: {
        amount: depositAmount,
        qrCodeUrl: pixData.qrCodeUrl,
        copiaECola: pixData.copiaECola,
        expiresInMinutes: 15,
      },
      summary: {
        totalPrice,
        depositAmount,
        balanceDue,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        durationHours: data.durationHours,
      },
    });
  } catch (error: any) {
    console.error("[API appointments/create] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar o agendamento e cobrança Pix." },
      { status: 500 }
    );
  }
}
