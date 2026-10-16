export interface InfinitePayPixResponse {
  orderId: string;
  txid: string;
  amount: number;
  qrCodeUrl: string;
  copiaECola: string;
  expiresAt: string;
}

/**
 * Serviço de Integração com InfinitePay Pix - Sinal Obrigatório de 25%
 */
export async function generateInfinitePayPix(params: {
  appointmentId: string;
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  totalPrice: number;
}): Promise<InfinitePayPixResponse> {
  const apiKey = process.env.INFINITEPAY_API_KEY;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://studio13point.art"}/api/webhooks/infinitepay`;

  // Cálculo estrito no backend: exatamente 25% de sinal
  const depositAmount = Number((params.totalPrice * 0.25).toFixed(2));
  const amountInCents = Math.round(depositAmount * 100);

  // Hold de 15 minutos para expiração do Pix
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  if (!apiKey) {
    console.warn("[InfinitePay] Chave API não definida. Gerando Pix de demonstração.");
    return {
      orderId: `inf_ord_${Date.now()}`,
      txid: `tx_${Date.now()}`,
      amount: depositAmount,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136studio13point-deposit-${params.appointmentId}520400005303986540${depositAmount}5802BR5919STUDIO13POINT6009SAOPAULO62070503***6304`,
      copiaECola: `00020126580014br.gov.bcb.pix0136studio13point-deposit-${params.appointmentId}520400005303986540${depositAmount}5802BR5919STUDIO13POINT6009SAOPAULO62070503***6304`,
      expiresAt,
    };
  }

  try {
    const res = await fetch("https://api.infinitepay.io/v2/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_method: "pix",
        amount: amountInCents,
        customer: {
          name: params.clientName,
          document: params.clientCpf.replace(/\D/g, ""),
          email: params.clientEmail,
        },
        metadata: {
          appointmentId: params.appointmentId,
          type: "TATTOO_DEPOSIT_25",
        },
        notification_url: webhookUrl,
      }),
    });

    if (!res.ok) {
      throw new Error(`InfinitePay API error: ${await res.text()}`);
    }

    const data = await res.json();
    return {
      orderId: data.id || data.order_id,
      txid: data.pix?.txid || data.id,
      amount: depositAmount,
      qrCodeUrl: data.pix?.qrcode_url || data.pix?.qr_code,
      copiaECola: data.pix?.qrcode_text || data.pix?.copy_and_paste,
      expiresAt,
    };
  } catch (error) {
    console.error("[InfinitePay] Erro ao criar cobrança Pix do sinal:", error);
    throw error;
  }
}

/**
 * Serviço de Integração com InfinitePay Pix - Cobrança de Saldo Restante (75% ou valor contratual)
 */
export async function generateBalancePix(params: {
  appointmentId: string;
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  balanceAmount: number;
}): Promise<InfinitePayPixResponse> {
  const apiKey = process.env.INFINITEPAY_API_KEY;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://studio13point.art"}/api/webhooks/infinitepay`;

  const amountInCents = Math.round(params.balanceAmount * 100);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora de validade

  if (!apiKey) {
    console.warn("[InfinitePay] Chave API não definida. Gerando Pix de saldo de demonstração.");
    return {
      orderId: `inf_balance_${Date.now()}`,
      txid: `tx_balance_${Date.now()}`,
      amount: params.balanceAmount,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136studio13point-balance-${params.appointmentId}520400005303986540${params.balanceAmount}5802BR5919STUDIO13POINT6009SAOPAULO62070503***6304`,
      copiaECola: `00020126580014br.gov.bcb.pix0136studio13point-balance-${params.appointmentId}520400005303986540${params.balanceAmount}5802BR5919STUDIO13POINT6009SAOPAULO62070503***6304`,
      expiresAt,
    };
  }

  try {
    const res = await fetch("https://api.infinitepay.io/v2/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_method: "pix",
        amount: amountInCents,
        customer: {
          name: params.clientName,
          document: params.clientCpf.replace(/\D/g, ""),
          email: params.clientEmail,
        },
        metadata: {
          appointmentId: params.appointmentId,
          type: "TATTOO_BALANCE_REMAINING",
        },
        notification_url: webhookUrl,
      }),
    });

    if (!res.ok) {
      throw new Error(`InfinitePay API error: ${await res.text()}`);
    }

    const data = await res.json();
    return {
      orderId: data.id || data.order_id,
      txid: data.pix?.txid || data.id,
      amount: params.balanceAmount,
      qrCodeUrl: data.pix?.qrcode_url || data.pix?.qr_code,
      copiaECola: data.pix?.qrcode_text || data.pix?.copy_and_paste,
      expiresAt,
    };
  } catch (error) {
    console.error("[InfinitePay] Erro ao criar cobrança Pix do saldo restante:", error);
    throw error;
  }
}
