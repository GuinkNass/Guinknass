"use client";

import React, { useState, useEffect } from "react";
import { AppointmentType, QuoteDTO, TimeSlot, STUDIO_ADDRESS, getWhatsAppPreCareLink } from "@/types";

interface SchedulingModalProps {
  quote: QuoteDTO;
  initialType?: AppointmentType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SchedulingModal({
  quote,
  initialType = "NEW",
  isOpen,
  onClose,
  onSuccess,
}: SchedulingModalProps) {
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(initialType);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [touchupReason, setTouchupReason] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Consentimento estrito da política de sinal (25%) e retenção de diária
  const [depositConsent, setDepositConsent] = useState<boolean>(false);

  // Estado do Pagamento Pix (Novo Agendamento)
  const [pixData, setPixData] = useState<{
    amount: number;
    qrCodeUrl: string;
    copiaECola: string;
    expiresInMinutes: number;
  } | null>(null);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Define data mínima (amanhã)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  useEffect(() => {
    if (isOpen && !selectedDate) {
      setSelectedDate(minDateStr);
    }
  }, [isOpen, minDateStr, selectedDate]);

  // Carrega slots sempre que a data ou tipo mudar
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
  const depositAmount = isRetorno ? 0 : Number((quote.totalPrice * 0.25).toFixed(2));
  const balanceDue = isRetorno ? 0 : Number((quote.totalPrice - depositAmount).toFixed(2));

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedSlot) {
      setErrorMsg("Selecione um horário disponível para a sessão.");
      return;
    }

    if (appointmentType === "TOUCHUP" && (!touchupReason || touchupReason.trim().length < 5)) {
      setErrorMsg("Por favor, descreva detalhadamente o motivo do retoque (ex: falha de cicatrização, área desbotada).");
      return;
    }

    if (!isRetorno && !depositConsent) {
      setErrorMsg("É obrigatório concordar com o termo de reserva de data e retenção de sinal não reembolsável.");
      return;
    }

    setSubmitting(true);

    try {
      if (isRetorno) {
        // Fluxo Isento de Sinal: Confirmação Imediata
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

        alert("✓ Reagendamento / Retorno confirmado com sucesso! Enviado para a Google Agenda.");
        onSuccess();
        onClose();
      } else {
        // Fluxo Novo Agendamento: Hold de 15 minutos + Pix 25% InfinitePay
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
        setCreatedAppointmentId(data.appointmentId);
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
        
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-start mb-6 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-amber-500 uppercase">
              Studio 13Point Tattoo & GuinkNass
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              {pixData ? "Pagamento do Sinal Pix (25%)" : "Agendamento de Sessão"}
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

        {/* ============================================================== */}
        {/* TELA DE PAGAMENTO PIX INFINITEPAY (NOVO AGENDAMENTO) */}
        {/* ============================================================== */}
        {pixData ? (
          <div className="text-center py-2 space-y-5">
            <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full">
              HOLD TEMPORÁRIO DE 15 MINUTOS ATIVO
            </div>
            
            <div>
              <h3 className="text-2xl font-extrabold text-white">
                R$ {pixData.amount.toFixed(2).replace(".", ",")}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Seu horário está bloqueado temporariamente. Escaneie o QR Code abaixo no app do seu banco ou use a chave Copia e Cola para concluir o agendamento.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-2xl inline-block border-4 border-amber-500/40">
                <img
                  src={pixData.qrCodeUrl}
                  alt="QR Code Pix InfinitePay"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <button
                type="button"
                onClick={copyPix}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {copied ? "✓ Código Copiado com Sucesso!" : "Copiar Código Pix (Copia e Cola)"}
              </button>

              <a
                href={preCareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold rounded-xl transition border border-emerald-500/30 flex items-center justify-center gap-2 text-xs"
              >
                <span>📱 Abrir Guia de Cuidados Pré-Sessão no WhatsApp</span>
              </a>
            </div>

            <div className="text-[11px] text-neutral-500 max-w-md mx-auto border-t border-neutral-800 pt-3">
              Assim que o Pix for aprovado pela InfinitePay, o agendamento é marcado como CONFIRMED e sincronizado na Google Agenda com envio das informações de local.
            </div>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="text-xs text-neutral-400 underline hover:text-neutral-200 block mx-auto"
            >
              Já realizei o pagamento Pix (Concluir)
            </button>
          </div>
        ) : (
          /* ============================================================== */
          /* FORMULÁRIO DE SELEÇÃO DE FLUXO & HORÁRIOS */
          /* ============================================================== */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seletor de Fluxo Principal */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Tipo de Atendimento:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppointmentType("NEW")}
                  className={`p-4 rounded-xl border text-left transition ${
                    appointmentType === "NEW"
                      ? "bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <div className="font-bold">Novo Agendamento</div>
                  <div className="text-xs mt-1 text-neutral-400">
                    Primeira sessão (Sinal de 25% obrigatório via Pix)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAppointmentType("TOUCHUP")}
                  className={`p-4 rounded-xl border text-left transition ${
                    isRetorno
                      ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  <div className="font-bold">Retorno / Reagendamento</div>
                  <div className="text-xs mt-1 text-neutral-400">
                    Retoque ou Continuação (Isento de novo sinal)
                  </div>
                </button>
              </div>
            </div>

            {/* Sub-opções de Retorno (quando aplicável) */}
            {isRetorno && (
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Motivo do Retorno:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAppointmentType("TOUCHUP")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      appointmentType === "TOUCHUP"
                        ? "bg-emerald-500 border-emerald-500 text-neutral-950"
                        : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                    }`}
                  >
                    1. Retoque de Cicatrização
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentType("NEXT_SESSION")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      appointmentType === "NEXT_SESSION"
                        ? "bg-emerald-500 border-emerald-500 text-neutral-950"
                        : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                    }`}
                  >
                    2. Próxima Sessão (Projeto)
                  </button>
                </div>

                {appointmentType === "TOUCHUP" && (
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">
                      Justificativa do Retoque (obrigatório) <span className="text-red-400">*</span>:
                    </label>
                    <textarea
                      value={touchupReason}
                      onChange={(e) => setTouchupReason(e.target.value)}
                      placeholder="Ex: Área no contorno que perdeu pigmentação durante a cicatrização..."
                      className="w-full text-xs p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 h-20"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* Seleção de Data */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">
                Selecione a Data:
              </label>
              <input
                type="date"
                min={minDateStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Seleção de Slots Livres */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-neutral-300">
                  Horários Disponíveis (Duração: {duration}h + 1h Buffer Obrigatório):
                </label>
                {loadingSlots && <span className="text-xs text-amber-400 animate-pulse">Calculando slots...</span>}
              </div>

              {slots.length === 0 && !loadingSlots ? (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-400 text-center">
                  Nenhum horário disponível para esta data ou janela incompatível com as regras. Tente outro dia.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
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
                      title={slot.reason || "Disponível"}
                    >
                      {slot.start} às {slot.end}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo Financeiro & Local */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Local de Atendimento:</span>
                <span className="text-right text-neutral-200 font-medium max-w-[280px]">
                  {STUDIO_ADDRESS}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Valor Total do Projeto:</span>
                <span className="text-white font-semibold">R$ {quote.totalPrice.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm">
                <span>Sinal a Pagar Agora:</span>
                <span>{isRetorno ? "R$ 0,00 (Isento)" : `R$ ${depositAmount.toFixed(2).replace(".", ",")} (25%)`}</span>
              </div>
              {!isRetorno && (
                <div className="flex justify-between text-neutral-400 border-t border-neutral-800 pt-2">
                  <span>Saldo Restante no Estúdio (75%):</span>
                  <span className="text-neutral-300">R$ {balanceDue.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
            </div>

            {/* Checkbox Obrigatório de Consentimento da Retenção de Sinal */}
            {!isRetorno && (
              <div className="p-4 bg-amber-950/20 border border-amber-500/40 rounded-xl space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositConsent}
                    onChange={(e) => setDepositConsent(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500 flex-shrink-0 mt-0.5"
                    required
                  />
                  <span className="text-xs text-amber-200 leading-relaxed">
                    <strong>Termo de Reserva de Data e Diária:</strong> Estou ciente de que o sinal de 25% (R$ {depositAmount.toFixed(2).replace(".", ",")}) garante a reserva da minha data e diária do estúdio, <strong>NÃO sendo reembolsável em nenhuma hipótese de cancelamento ou não comparecimento</strong>. O valor será integralmente abatido no dia da tattoo.
                  </span>
                </label>
              </div>
            )}

            {/* Botão de Ação */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot || (!isRetorno && !depositConsent)}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 text-neutral-950 font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {submitting
                ? "Processando Agendamento..."
                : isRetorno
                ? "CONFIRMAR RETORNO / REAGENDAMENTO (R$ 0,00)"
                : `PAGAR SINAL DE R$ ${depositAmount.toFixed(2).replace(".", ",")} VIA PIX`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
