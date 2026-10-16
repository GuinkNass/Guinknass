import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    let appointments: any[] = [];

    try {
      const { prisma } = await import("@/lib/db");
      appointments = await prisma.appointment.findMany({
        orderBy: { scheduledStart: "desc" },
        include: {
          quote: true,
          anamnese: true,
        },
        take: 50,
      });
    } catch {
      // Mock para desenvolvimento caso banco esteja desconectado
      appointments = [
        {
          id: "app_demo_1",
          clientName: "Cliente Exemplo GuinkNass",
          clientCpf: "12345678909",
          clientPhone: "(11) 99580-2338",
          clientEmail: "cliente@exemplo.com",
          appointmentType: "NEW",
          status: "CONFIRMED",
          scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          scheduledEnd: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
          durationHours: 4,
          totalPrice: 2400.0,
          depositPaid: 600.0,
          balanceDue: 1800.0,
          isFullyPaid: false,
          depositConsent: true,
          depositForfeited: false,
          quote: {
            tattooDescription: "Fechamento de antebraço autoral surrealista",
            style: "Autoral / Preto e Cinza",
            sizeCm: "22 x 12 cm",
          },
          anamnese: {
            hasAllergies: false,
            hasHealingProblems: false,
            usesAnticoagulants: false,
            hasDiabetes: false,
            isPregnantOrLactating: false,
            hasSkinDiseases: false,
            signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            signedAt: new Date().toISOString(),
          },
        },
      ];
    }

    return NextResponse.json({ appointments });
  } catch (error: any) {
    console.error("[API admin/appointments] Erro:", error);
    return NextResponse.json({ error: "Erro ao listar agendamentos." }, { status: 500 });
  }
}
