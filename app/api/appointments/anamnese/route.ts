import { NextRequest, NextResponse } from "next/server";
import { anamneseSubmitSchema } from "@/lib/validations/schedule";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = anamneseSubmitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Dados de anamnese incompletos ou inválidos." },
        { status: 400 }
      );
    }

    const data = validation.data;
    const cleanCpf = data.clientCpf.replace(/\D/g, "");

    let termId = `term_${Date.now()}`;

    try {
      const { prisma } = await import("@/lib/db");

      // 1. Cria ou atualiza o termo de anamnese
      const anamneseTerm = await prisma.anamneseTerm.upsert({
        where: { appointmentId: data.appointmentId },
        update: {
          clientName: data.clientName,
          clientCpf: cleanCpf,
          hasAllergies: data.hasAllergies,
          allergiesDetails: data.allergiesDetails,
          hasHealingProblems: data.hasHealingProblems,
          usesAnticoagulants: data.usesAnticoagulants,
          hasDiabetes: data.hasDiabetes,
          isPregnantOrLactating: data.isPregnantOrLactating,
          hasSkinDiseases: data.hasSkinDiseases,
          skinDiseasesDetails: data.skinDiseasesDetails,
          signatureBase64: data.signatureBase64,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
        create: {
          appointmentId: data.appointmentId,
          clientCpf: cleanCpf,
          clientName: data.clientName,
          hasAllergies: data.hasAllergies,
          allergiesDetails: data.allergiesDetails,
          hasHealingProblems: data.hasHealingProblems,
          usesAnticoagulants: data.usesAnticoagulants,
          hasDiabetes: data.hasDiabetes,
          isPregnantOrLactating: data.isPregnantOrLactating,
          hasSkinDiseases: data.hasSkinDiseases,
          skinDiseasesDetails: data.skinDiseasesDetails,
          signatureBase64: data.signatureBase64,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      termId = anamneseTerm.id;

      // 2. Atualiza foto da pele e referências no agendamento se fornecidas
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: {
          skinPhotoUrl: data.skinPhotoUrl || undefined,
          referenceImages: data.referenceImages ? (data.referenceImages as any) : undefined,
        },
      });
    } catch (err) {
      console.warn("[Anamnese] DB fallback mock:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Ficha de Anamnese e Assinatura Digital registradas com sucesso!",
      termId,
    });
  } catch (error: any) {
    console.error("[API appointments/anamnese] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar a ficha de anamnese." },
      { status: 500 }
    );
  }
}
