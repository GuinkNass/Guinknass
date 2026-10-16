"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppointmentType, QuoteDTO, AppointmentDTO, TimeSlot, STUDIO_ADDRESS, getWhatsAppPreCareLink } from "@/types";

interface SchedulingModalProps {
  quote: QuoteDTO;
  initialType?: AppointmentType;
  isOpen: boolean;
  previousAppointments?: AppointmentDTO[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SchedulingModal({
  quote,
  initialType = "NEW",
  isOpen,
  previousAppointments = [],
  onClose,
  onSuccess,
}: SchedulingModalProps) {
  // Verifica se o cliente já realizou e concluiu a 1ª sessão para poder solicitar retoque/reagendamento
  const hasCompletedFirstSession = useMemo(() => {
    return previousAppointments.some(
      (app) =>
        (app.status === "CONFIRMED" || app.status === "COMPLETED") &&
        new Date(app.scheduledStart) < new Date()
    );
  }, [previousAppointments]);

  // Se não concluiu a 1ª sessão, o fluxo é estritamente NOVO AGENDAMENTO
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(
    hasCompletedFirstSession ? initialType : "NEW"
  );

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [touchupReason, setTouchupReason] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Consentimento do sinal fixo de R$ 150
  const [depositConsent, setDepositConsent] = useState<boolean>(false);

  // Estado do Pagamento Pix
  const [pixData, setPixData] = useState<{
    amount: number;
    qrCodeUrl: string;
    copiaECola: string;
    checkoutUrl?: string;
    expiresInMinutes: number;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Gera os próximos 21 dias para visualização interativa
  const upcomingDays = useMemo(() => {
    const list = [];
    const base = new Date();
    const weekNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 1; i <= 21; i++) {
      const d = new Date();
      d.setDate(base.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = d.getDay();
      const isClosed = dayOfWeek === 0; // Domingos fechados

      list.push({
        dateStr,
        dayOfWeek,
        weekDay: weekNames[dayOfWeek],
        dayNum: d.getDate(),
        month: monthNames[d.getMonth()],
        isClosed,
      });
    }
    return list;
  }, []);

  // Define a primeira data aberta disponível
  useEffect(() => {
    if (isOpen && !selectedDate) {
      const firstOpen = upcomingDays.find((d) => !d.isClosed);
      if (firstOpen) {
        setSelectedDate(firstOpen.dateStr);
      }
    }
  }, [isOpen, upcomingDays, selectedDate]);

  // Carrega horários disponíveis da data selecionada
  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setErrorMsg("");
      setSelectedSlot(null);

      const duration = appointmentType === "TOUCHUP" ? 2 : quote.estimatedDurationHours || 3;

      try {
        const res = await fetch(
          `/api/schedule/slots?date=${selectedDate}&type=${appointmentType}&duration=${duration}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Não foi possível carregar os horários.");
        }

        setSlots(data.slots || []);
      } catch (err: any) {
        setErrorMsg(err.message || "Erro de conexão ao buscar horários.");
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, appointmentType, quote.estimatedDurationHours]);

  if (!isOpen) return null;

  const duration = appointmentType === "TOUCHUP" ? 2 : quote.estimatedDurationHours || 3;
  const isRetorno = appointmentType === "TOUCHUP" || appointmentType === "NEXT_SESSION";
  const depositAmount = isRetorno ? 0 : 150.0;
  const balanceDue = isRetorno ? 0 : Number(Math.max(0, quote.totalPrice - depositAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedSlot) {
      setErrorMsg("Selecione um horário disponível para a sua sessão.");
      return;
    }

    if (appointmentType === "TOUCHUP" && (!touchupReason || touchupReason.trim().length < 5)) {
      setErrorMsg("Por favor, descreva detalhadamente a região do retoque.");
      return;
    }

    if (!isRetorno && !depositConsent) {
      setErrorMsg("É obrigatório concordar com o termo de reserva de data.");
      return;
    }

    setSubmitting(true);

    try {
      if (isRetorno) {
        const res = await fetch("/api/appointments/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteId: quote.id,
            cpf: quote.clientCpf,
            appointmentType,
            touchupReason: appointmentType === "TOUCHUP" ? touchupReason : undefined,
            scheduledStart: selectedSlot.startISO,
            durationHours: duration,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao solicitar retorno.");

        alert("✓ Reagendamento / Retorno confirmado com sucesso! Sincronizado na agenda.");
        onSuccess();
        onClose();
      } else {
        const res = await fetch("/api/appointments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteId: quote.id,
            cpf: quote.clientCpf,
            scheduledStart: selectedSlot.startISO,
            durationHours: duration,
            depositConsent: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao gerar agendamento.");

        setPixData(data.pix);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro no agendamento.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPix = () => {
    if (pixData?.copiaECola) {
      navigator.clipboard.writeText(pixData.copiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formattedDate = selectedSlot
    ? new Date(selectedSlot.startISO).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }) + ` às ${selectedSlot.start}`
    : "Data agendada";

  const preCareUrl = getWhatsAppPreCareLink(quote.clientPhone, quote.clientName, formattedDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121216] border border-neutral-800 w-full max-w-2xl rounded-2xl p-6 sm:p-8 text-neutral-100 shadow-2xl relative my-8 animate-fadeIn">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-6 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-amber-500 uppercase">
              Studio 13Point Tattoo & GuinkNass
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              {pixData ? "Pagamento do Sinal Fixo (R$ 150,00)" : "Agendamento de Sessão"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-900 border border-neutral-800 transition"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 mb-6 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* TELA DE PAGAMENTO */}
        {pixData ? (
          <div className="py-2 space-y-5">
            <div className="text-center">
              <span className="text-xs font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase">
                Sessão Pré-Agendada
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-3">
                R$ 150,00
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Para confirmar seu horário na agenda oficial do estúdio, realize o pagamento do sinal de <strong>R$ 150,00</strong>. O valor é integralmente abatido no dia da tattoo.
              </p>
            </div>

            {/* BOTÃO PRINCIPAL: CARTÃO DE CRÉDITO OU PIX */}
            <div className="space-y-2">
              <a
                href={pixData.checkoutUrl || "https://checkout.infinitepay.io/deal-hunter-pro-br/YhWrx0WoY3"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black rounded-xl transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 text-base cursor-pointer text-center"
              >
                <span>💳 PAGAR R$ 150,00 NO CARTÃO DE CRÉDITO OU PIX &rarr;</span>
              </a>
              <p className="text-[11px] text-center text-neutral-400">
                Checkout seguro InfinitePay: pague em até 12x no cartão de crédito ou gere o Pix oficial do seu banco.
              </p>
            </div>

            {/* OPÇÃO DE ESCANEAR VIA CELULAR SE ESTIVER NO COMPUTADOR */}
            <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-neutral-700 flex-shrink-0">
                <img
                  src={pixData.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(pixData.checkoutUrl || "https://checkout.infinitepay.io/deal-hunter-pro-br/YhWrx0WoY3")}`}
                  alt="QR Code Pagamento"
                  className="w-24 h-24 sm:w-28 sm:h-28"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <strong className="text-xs text-white block">Está no computador?</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Aponte a <strong>câmera do celular</strong> para o QR Code ao lado para abrir a tela de pagamento no seu celular (Cartão ou Pix).
                </p>
                <button
                  type="button"
                  onClick={copyPix}
                  className="mt-1 text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer block"
                >
                  {copied ? "✓ Link de Pagamento Copiado!" : "Copiar Link de Pagamento"}
                </button>
              </div>
            </div>

            {/* RECOMENDAÇÕES PRÉ-TATTOO DIRETAMENTE NA TELA */}
            <div className="bg-neutral-900/90 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2.5 text-left">
              <div className="font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                <span>📋</span> Recomendações Importantes para o Dia da Sessão:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300 text-[11px]">
                <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <strong className="text-white block mb-0.5">🍽️ Alimentação</strong>
                  Não venha em jejum! Faça uma refeição reforçada até 1h antes do horário marcado.
                </div>
                <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <strong className="text-white block mb-0.5">💧 Hidratação da Pele</strong>
                  Beba bastante água nas 48h anteriores para preparar a pele para a tattoo.
                </div>
                <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <strong className="text-white block mb-0.5">🚫 Sem Álcool</strong>
                  Não consuma bebidas alcoólicas nas 24h antes para evitar afinamento do sangue.
                </div>
                <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <strong className="text-white block mb-0.5">👕 Roupas e Sono</strong>
                  Durma bem na noite anterior e use roupas confortáveis de fácil acesso ao local.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="text-xs text-neutral-400 underline hover:text-neutral-200 block mx-auto pt-1 cursor-pointer"
            >
              Já realizei o pagamento (Concluir)
            </button>
          </div>
        ) : (
          /* FORMULÁRIO DE AGENDAMENTO */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Se o cliente já concluiu a 1ª sessão, permite escolher Retorno/Retoque */}
            {hasCompletedFirstSession && (
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">
                  Tipo de Atendimento:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAppointmentType("NEW")}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      appointmentType === "NEW"
                        ? "bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="font-bold text-sm">Nova Sessão</div>
                    <div className="text-xs mt-0.5 text-neutral-400">
                      Sinal Fixo de R$ 150,00 via Pix
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppointmentType("TOUCHUP")}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      isRetorno
                        ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="font-bold text-sm">Retoque de Cicatrização</div>
                    <div className="text-xs mt-0.5 text-neutral-400">
                      Isento de novo sinal
                    </div>
                  </button>
                </div>

                {appointmentType === "TOUCHUP" && (
                  <div className="mt-3">
                    <label className="block text-xs text-neutral-300 mb-1">
                      Descreva a região para o retoque <span className="text-red-400">*</span>:
                    </label>
                    <textarea
                      value={touchupReason}
                      onChange={(e) => setTouchupReason(e.target.value)}
                      placeholder="Ex: Pequeno detalhe no traço do antebraço após cicatrização..."
                      className="w-full text-xs p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 h-16"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* SELETOR INTERATIVO DE DATAS (Datas visíveis diretamente na aba) */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-sm font-semibold text-neutral-300">
                  Selecione o Dia da Sessão:
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  {showCustomDatePicker ? "← Ver dias sugeridos" : "📅 Outra data futura..."}
                </button>
              </div>

              {showCustomDatePicker ? (
                <input
                  type="date"
                  min={upcomingDays[0]?.dateStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 max-h-52 overflow-y-auto p-1.5 bg-neutral-950/60 rounded-xl border border-neutral-800">
                  {upcomingDays.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    if (item.isClosed) {
                      return (
                        <div
                          key={item.dateStr}
                          className="p-2 rounded-lg border border-neutral-900 bg-neutral-950/40 text-center opacity-40 cursor-not-allowed select-none"
                          title="Estúdio fechado aos domingos"
                        >
                          <div className="text-[10px] uppercase font-bold text-neutral-500">{item.weekDay}</div>
                          <div className="text-sm font-bold text-neutral-600">{item.dayNum}</div>
                          <div className="text-[9px] text-neutral-600">{item.month}</div>
                          <div className="text-[9px] text-red-500/80 font-medium mt-0.5">Fechado</div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/25 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20 font-bold ring-1 ring-amber-500 scale-[1.02]"
                            : "bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-amber-400/60 hover:bg-neutral-800/80"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-bold text-neutral-400">{item.weekDay}</div>
                        <div className="text-base font-extrabold text-white">{item.dayNum}</div>
                        <div className="text-[10px] text-neutral-400">{item.month}</div>
                        <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">Disponível</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SELEÇÃO DE HORÁRIOS DISPONÍVEIS */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-neutral-300">
                  Horários Disponíveis (Sessão de {duration}h):
                </label>
                {loadingSlots && <span className="text-xs text-amber-400 animate-pulse">Consultando agenda...</span>}
              </div>

              {slots.length === 0 && !loadingSlots ? (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-400 text-center">
                  Não há horários disponíveis para esta data. Escolha outro dia acima.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-44 overflow-y-auto pr-1">
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-lg text-xs font-semibold border transition text-center ${
                        selectedSlot?.start === slot.start
                          ? "bg-amber-500 border-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/20"
                          : slot.available
                          ? "bg-neutral-950 border-neutral-700 text-white hover:border-amber-400"
                          : "bg-neutral-950/40 border-neutral-800 text-neutral-600 cursor-not-allowed line-through"
                      }`}
                    >
                      {slot.start} às {slot.end}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RESUMO FINANCEIRO LIMPO */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Local de Atendimento:</span>
                <span className="text-right text-neutral-200 font-medium max-w-[280px]">
                  {STUDIO_ADDRESS}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Valor Total da Tattoo:</span>
                <span className="text-white font-semibold">R$ {quote.totalPrice.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm">
                <span>Sinal Fixo de Reserva:</span>
                <span>{isRetorno ? "R$ 0,00 (Isento)" : "R$ 150,00"}</span>
              </div>
              {!isRetorno && (
                <div className="flex justify-between text-neutral-400 border-t border-neutral-800 pt-2">
                  <span>Restante a Pagar no Estúdio no Dia:</span>
                  <span className="text-neutral-200 font-semibold">R$ {balanceDue.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
            </div>

            {/* TERMO DE RESERVA */}
            {!isRetorno && (
              <div className="p-3.5 bg-amber-950/20 border border-amber-500/40 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositConsent}
                    onChange={(e) => setDepositConsent(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500 flex-shrink-0 mt-0.5"
                    required
                  />
                  <span className="text-xs text-amber-200 leading-relaxed">
                    <strong>Termo de Reserva:</strong> Estou ciente de que o sinal fixo de R$ 150,00 garante a reserva exclusiva da minha data e horário na agenda do GuinkNass, <strong>NÃO sendo reembolsável em caso de cancelamento</strong>. O valor será integralmente abatido no dia da tattoo.
                  </span>
                </label>
              </div>
            )}

            {/* BOTÃO PRINCIPAL */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot || (!isRetorno && !depositConsent)}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 text-neutral-950 font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting
                ? "Processando..."
                : isRetorno
                ? "Confirmar Retoque (R$ 0,00)"
                : "PAGAR SINAL FIXO DE R$ 150,00 VIA PIX"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
