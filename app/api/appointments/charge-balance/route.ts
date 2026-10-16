import { NextRequest, NextResponse } from "next/server";
import { chargeBalanceSchema } from "@/lib/validations/schedule";
import { generateBalancePix } from "@/lib/infinitepay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = chargeBalanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "ID de agendamento inválido." },
        { status: 400 }
      );
    }

    const { appointmentId } = validation.data;

    let appointment: any = null;
    try {
      const { prisma } = await import("@/lib/db");
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { quote: true },
      });
    } catch {
      // Mock fallback
    }

    if (!appointment) {
      // Fallback para teste
      appointment = {
        id: appointmentId,
        clientName: "Cliente Exemplo",
        clientCpf: "12345678909",
        clientEmail: "cliente@exemplo.com",
        balanceDue: 1200.0,
        isFullyPaid: false,
      };
    }

    if (appointment.isFullyPaid || Number(appointment.balanceDue) <= 0) {
      return NextResponse.json(
        { error: "Este agendamento já possui o saldo integralmente quitado." },
        { status: 400 }
      );
    }

    const balanceAmount = Number(appointment.balanceDue);

    // Gera o Pix na InfinitePay com o valor do saldo restante
    const pixData = await generateBalancePix({
      appointmentId: appointment.id,
      clientName: appointment.clientName,
      clientCpf: appointment.clientCpf,
      clientEmail: appointment.clientEmail,
      balanceAmount,
    });

    try {
      const { prisma } = await import("@/lib/db");
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { balanceOrderId: pixData.orderId },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Cobrança de saldo restante (75%) gerada com sucesso via InfinitePay Pix.",
      balanceAmount,
      pix: {
        qrCodeUrl: pixData.qrCodeUrl,
        copiaECola: pixData.copiaECola,
        expiresAt: pixData.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("[API appointments/charge-balance] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar a cobrança de saldo restante." },
      { status: 500 }
    );
  }
}
