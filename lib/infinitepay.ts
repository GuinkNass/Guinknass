export interface InfinitePayPixResponse {
  orderId: string;
  txid: string;
  amount: number;
  qrCodeUrl: string;
  copiaECola: string;
  checkoutUrl?: string;
  expiresAt: string;
}

// Valor fixo oficial do sinal de reserva da data / diária
export const FIXED_DEPOSIT_AMOUNT = 150.0;

// Link fixo oficial de checkout criado pelo estúdio na InfinitePay
export const FIXED_INFINITEPAY_CHECKOUT_URL = "https://checkout.infinitepay.io/deal-hunter-pro-br/YhWrx0WoY3";

/**
 * Serviço de Integração com InfinitePay Checkout
 * Gera a cobrança do sinal FIXO de R$ 150,00
 */
export async function generateInfinitePayPix(params: {
  appointmentId: string;
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  totalPrice: number;
}): Promise<InfinitePayPixResponse> {
  const handle = process.env.INFINITEPAY_HANDLE || "deal-hunter-pro-br";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://guinknass.com.br";
  const webhookUrl = `${appUrl}/api/webhooks/infinitepay`;
  const redirectUrl = `${appUrl}/consultar-orcamento?status=paid&appId=${params.appointmentId}`;

  // Sinal fixo de R$ 150,00 (15000 centavos)
  const depositAmount = FIXED_DEPOSIT_AMOUNT;
  const amountInCents = 15000;

  // Hold de 15 minutos para expiração do agendamento
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  try {
    const res = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle: handle.replace(/^\$/, ""),
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
        order_nsu: params.appointmentId,
        items: [
          {
            quantity: 1,
            price: amountInCents,
            description: `Sinal Fixo Tattoo (R$ 150,00) - ${params.clientName}`,
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          orderId: params.appointmentId,
          txid: params.appointmentId,
          amount: depositAmount,
          checkoutUrl: data.url,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(data.url)}`,
          copiaECola: data.url,
          expiresAt,
        };
      }
    }
  } catch (error) {
    console.warn("[InfinitePay Checkout] Erro ao chamar API externa. Usando link fixo oficial:", error);
  }

  // Link oficial direto configurado na conta InfinitePay
  return {
    orderId: params.appointmentId,
    txid: params.appointmentId,
    amount: depositAmount,
    checkoutUrl: FIXED_INFINITEPAY_CHECKOUT_URL,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(FIXED_INFINITEPAY_CHECKOUT_URL)}`,
    copiaECola: FIXED_INFINITEPAY_CHECKOUT_URL,
    expiresAt,
  };
}

/**
 * Serviço de Cobrança de Saldo Restante (Valor Total - R$ 150,00)
 */
export async function generateBalancePix(params: {
  appointmentId: string;
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  balanceAmount: number;
}): Promise<InfinitePayPixResponse> {
  const handle = process.env.INFINITEPAY_HANDLE || "deal-hunter-pro-br";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://guinknass.com.br";
  const webhookUrl = `${appUrl}/api/webhooks/infinitepay`;
  const redirectUrl = `${appUrl}/consultar-orcamento?status=balance_paid&appId=${params.appointmentId}`;

  const amountInCents = Math.round(params.balanceAmount * 100);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  try {
    const res = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle: handle.replace(/^\$/, ""),
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
        order_nsu: `balance_${params.appointmentId}`,
        items: [
          {
            quantity: 1,
            price: amountInCents,
            description: `Saldo Restante Tattoo (R$ ${params.balanceAmount.toFixed(2)}) - ${params.clientName}`,
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          orderId: `balance_${params.appointmentId}`,
          txid: `balance_${params.appointmentId}`,
          amount: params.balanceAmount,
          checkoutUrl: data.url,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(data.url)}`,
          copiaECola: data.url,
          expiresAt,
        };
      }
    }
  } catch (err) {
    console.warn("[InfinitePay Balance] Erro ao chamar API externa:", err);
  }

  const directCheckoutUrl = `https://checkout.infinitepay.com.br/${handle.replace(/^\$/, "")}`;
  return {
    orderId: `balance_${params.appointmentId}`,
    txid: `balance_${params.appointmentId}`,
    amount: params.balanceAmount,
    checkoutUrl: directCheckoutUrl,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(directCheckoutUrl)}`,
    copiaECola: directCheckoutUrl,
    expiresAt,
  };
}
