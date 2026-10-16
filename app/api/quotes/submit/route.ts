import { NextRequest, NextResponse } from "next/server";
import { saveOrUpdateQuote, StoredQuote } from "@/lib/quotesStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCpf = body.cpf || body.clientCpf || "";
    const cleanCpf = rawCpf.replace(/\D/g, "");

    if (!cleanCpf || cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF obrigatório com 11 dígitos." },
        { status: 400 }
      );
    }

    const pendingQuote: StoredQuote = {
      id: `quote-${cleanCpf.slice(0, 6)}-${Date.now()}`,
      clientCpf: cleanCpf,
      clientName: body.name || body.clientName || "Cliente",
      clientPhone: body.phone || body.clientPhone || "",
      clientEmail: body.email || body.clientEmail || "",
      tattooDescription: body.ideaDescription || body.tattooDescription || "Projeto de Tatuagem",
      sizeCm: body.sizeCm || "A combinar",
      style: body.style || "Autoral",
      totalPrice: 0,
      estimatedDurationHours: 3,
      depositAmount: 150.0,
      status: "PENDENTE",
      notes: "Aguardando avaliação artística e definição de valor pelo GuinkNass.",
      images: body.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveOrUpdateQuote(pendingQuote);

    return NextResponse.json({
      success: true,
      message: "Solicitação de orçamento registrada com sucesso!",
      cpf: cleanCpf,
    });
  } catch (error: any) {
    console.error("[quotes/submit] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao registrar solicitação: " + error.message },
      { status: 500 }
    );
  }
}
