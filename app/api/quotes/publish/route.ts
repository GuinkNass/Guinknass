import { NextRequest, NextResponse } from "next/server";
import { saveOrUpdateQuote, StoredQuote } from "@/lib/quotesStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rawCpf = body.cpf || body.clientCpf || "";
    const cleanCpf = rawCpf.replace(/\D/g, "");

    if (!cleanCpf || cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido. Deve conter 11 dígitos numéricos." },
        { status: 400 }
      );
    }

    const totalPrice = Number(body.totalPrice || body.valorTotal || 0);
    if (isNaN(totalPrice) || totalPrice <= 0) {
      return NextResponse.json(
        { error: "Valor total da tattoo é obrigatório e deve ser maior que zero." },
        { status: 400 }
      );
    }

    const duration = Number(body.estimatedDurationHours || body.duracao || 3);
    const sessions = Number(body.sessionsCount || body.sessoes || 1);

    const quoteRecord: StoredQuote = {
      id: `quote-${cleanCpf.slice(0, 6)}-${Date.now()}`,
      clientCpf: cleanCpf,
      clientName: body.clientName || body.nome || "Cliente GuinkNass",
      clientPhone: body.clientPhone || body.phone || body.whatsapp || "",
      clientEmail: body.clientEmail || body.email || "",
      tattooDescription: body.tattooDescription || body.descricao || "Projeto de Tatuagem Autoral",
      sizeCm: body.sizeCm || body.tamanho || "A combinar",
      style: body.style || body.estilo || "Autoral / Preto e Cinza",
      totalPrice: totalPrice,
      estimatedDurationHours: duration > 0 ? duration : 3,
      sessionsCount: sessions > 0 ? sessions : 1,
      depositAmount: 150.0, // Sinal fixo de R$ 150
      status: "APROVADO",
      notes: body.notes || body.mensagem || body.observacoes || "Orçamento aprovado pelo artista GuinkNass.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Salva no Store resiliente (memória / arquivo Vercel)
    saveOrUpdateQuote(quoteRecord);

    // 2. Tenta salvar no Prisma se banco relacional estiver conectado
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.quote.upsert({
        where: { id: quoteRecord.id },
        update: {
          clientName: quoteRecord.clientName,
          clientPhone: quoteRecord.clientPhone,
          clientEmail: quoteRecord.clientEmail,
          tattooDescription: quoteRecord.tattooDescription,
          sizeCm: quoteRecord.sizeCm,
          style: quoteRecord.style,
          totalPrice: quoteRecord.totalPrice,
          estimatedDurationHours: quoteRecord.estimatedDurationHours,
          hasActiveProject: true,
          notes: quoteRecord.notes,
        },
        create: {
          id: quoteRecord.id,
          clientCpf: quoteRecord.clientCpf,
          clientName: quoteRecord.clientName,
          clientPhone: quoteRecord.clientPhone,
          clientEmail: quoteRecord.clientEmail,
          tattooDescription: quoteRecord.tattooDescription,
          sizeCm: quoteRecord.sizeCm,
          style: quoteRecord.style,
          totalPrice: quoteRecord.totalPrice,
          estimatedDurationHours: quoteRecord.estimatedDurationHours,
          hasActiveProject: true,
          notes: quoteRecord.notes,
        },
      });
    } catch (dbErr) {
      console.warn("[quotes/publish] Banco relacional Prisma não conectado ou offline. Orçamento armazenado com sucesso no Store resiliente.");
    }

    return NextResponse.json({
      success: true,
      message: `Orçamento aprovado e publicado com sucesso para o CPF ${cleanCpf}!`,
      quote: quoteRecord,
      consultUrl: `https://guinknass.com.br/consultar-orcamento`,
    });
  } catch (error: any) {
    console.error("[quotes/publish] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao publicar orçamento: " + error.message },
      { status: 500 }
    );
  }
}
