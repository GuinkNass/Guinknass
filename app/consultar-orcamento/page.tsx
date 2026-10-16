"use client";

import React, { useState } from "react";
import SchedulingModal from "@/components/scheduling/SchedulingModal";
import AnamneseModal from "@/components/scheduling/AnamneseModal";
import { 
  AppointmentType, 
  QuoteDTO, 
  AppointmentDTO, 
  STUDIO_ADDRESS, 
  getWhatsAppPreCareLink, 
  getWhatsAppAftercareLink 
} from "@/types";

interface SearchResponse {
  quote: QuoteDTO;
  studioAddress: string;
  previousAppointments: AppointmentDTO[];
}

export default function ConsultarOrcamentoPage() {
  const [cpfInput, setCpfInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  // Controle do modal de agendamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlowType, setSelectedFlowType] = useState<AppointmentType>("NEW");
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Controle do modal de Anamnese Digital
  const [isAnamneseOpen, setIsAnamneseOpen] = useState(false);
  const [selectedAppointmentForAnamnese, setSelectedAppointmentForAnamnese] = useState<AppointmentDTO | null>(null);

  // Controle do modal de cancelamento
  const [cancellingApp, setCancellingApp] = useState<AppointmentDTO | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Formatação de máscara do CPF (000.000.000-00)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }

    setCpfInput(value);
    setErrorMessage("");
  };

  const reloadData = async () => {
    const rawCpf = cpfInput.replace(/\D/g, "");
    if (!rawCpf) return;
    try {
      const res = await fetch(`/api/quotes/search?cpf=${encodeURIComponent(rawCpf)}`);
      const data = await res.json();
      if (data?.quote) setSearchResult(data);
    } catch {}
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCpf = cpfInput.replace(/\D/g, "");

    if (rawCpf.length !== 11) {
      setErrorMessage("Por favor, digite um CPF válido com 11 dígitos.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSearchResult(null);
    setSuccessNotification(null);

    try {
      const res = await fetch(`/api/quotes/search?cpf=${encodeURIComponent(rawCpf)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível localizar o orçamento.");
      }

      setSearchResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de conexão ao buscar orçamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScheduling = (type: AppointmentType) => {
    setSelectedFlowType(type);
    setIsModalOpen(true);
  };

  const handleSchedulingSuccess = () => {
    setIsModalOpen(false);
    setSuccessNotification("Agendamento processado com sucesso! Verifique os detalhes e a ficha de anamnese abaixo.");
    reloadData();
  };

  const handleOpenAnamnese = (app: AppointmentDTO) => {
    setSelectedAppointmentForAnamnese(app);
    setIsAnamneseOpen(true);
  };

  const handleAnamneseSuccess = () => {
    setIsAnamneseOpen(false);
    setSuccessNotification("Ficha de anamnese e assinatura digital registradas com sucesso!");
    reloadData();
  };

  const handleConfirmCancel = async () => {
    if (!cancellingApp) return;
    if (!cancellationReason.trim()) {
      alert("Por favor informe o motivo do cancelamento.");
      return;
    }

    setCancelLoading(true);
    try {
      const res = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: cancellingApp.id,
          cpf: cancellingApp.clientCpf,
          cancellationReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao cancelar o agendamento.");
      }

      alert("Agendamento cancelado. Conforme a política de diária, o sinal de 25% foi retido.");
      setCancellingApp(null);
      setCancellationReason("");
      reloadData();
    } catch (err: any) {
      alert(err.message || "Erro ao processar cancelamento.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabeçalho da Página */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase">
            Sistema Oficial de Agendamentos & Pré-Sessão
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
            Studio 13Point Tattoo & GuinkNass
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto">
            Consulte seu orçamento aprovado com seu CPF para agendar sua primeira sessão, preencher sua anamnese digital ou solicitar retorno/continuação.
          </p>
        </header>

        {/* Notificação de Sucesso */}
        {successNotification && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
            <span>{successNotification}</span>
            <button
              onClick={() => setSuccessNotification(null)}
              className="text-emerald-400 hover:text-emerald-200 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Formulário de Busca por CPF */}
        <section className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSearch} className="space-y-4">
            <label htmlFor="cpf" className="block text-sm font-medium text-neutral-300">
              Digite seu CPF cadastrado no orçamento
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfInput}
                  onChange={handleCpfChange}
                  maxLength={14}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg tracking-wider"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-neutral-950" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Consultar</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </p>
            )}
          </form>
        </section>

        {/* Detalhes do Orçamento Encontrado */}
        {searchResult && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Aviso de Penalidade por Cancelamento Prévio (se houver) */}
            {searchResult.quote.hasCancellationPenalty && (
              <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-red-300 text-xs sm:text-sm space-y-1">
                <div className="font-bold flex items-center gap-2 text-red-200">
                  <span>⚠️</span> Atenção: Histórico de Cancelamento de Data com Sinal Retido
                </div>
                <p className="text-neutral-400">
                  Conforme a política do estúdio, o sinal anterior foi retido para cobrir a diária reservada. Para agendar uma nova data de sessão, é necessária a liquidação de uma nova Taxa de Remarcação de Data no valor de R$ {(searchResult.quote.rescheduleFeeDue || (searchResult.quote.totalPrice * 0.25)).toFixed(2).replace(".", ",")}.
                </p>
              </div>
            )}

            {/* Card Principal: Dados do Orçamento */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="border-b border-neutral-800 bg-neutral-950/70 p-6 sm:flex sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                    Orçamento Aprovado
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1">
                    {searchResult.quote.clientName}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    CPF: {searchResult.quote.clientCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4")} • Telefone: {searchResult.quote.clientPhone}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Pronto para Agendamento
                </div>
              </div>

              {/* Informações da Obra & Estilo */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                      Ideia & Descrição da Tattoo
                    </h4>
                    <p className="text-neutral-200 text-sm mt-1 leading-relaxed bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80">
                      {searchResult.quote.tattooDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80">
                      <span className="text-xs text-neutral-400 block">Estilo</span>
                      <span className="text-sm font-semibold text-neutral-200">{searchResult.quote.style}</span>
                    </div>
                    <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80">
                      <span className="text-xs text-neutral-400 block">Dimensões</span>
                      <span className="text-sm font-semibold text-neutral-200">{searchResult.quote.sizeCm}</span>
                    </div>
                  </div>

                  {searchResult.quote.notes && (
                    <div className="text-xs text-neutral-400 italic">
                      Observação: {searchResult.quote.notes}
                    </div>
                  )}
                </div>

                {/* Resumo Financeiro & Duração */}
                <div className="bg-neutral-950/80 rounded-xl p-5 border border-neutral-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-neutral-800/80 pb-2">
                      <span className="text-neutral-400">Duração Estimada:</span>
                      <span className="font-semibold text-white">{searchResult.quote.estimatedDurationHours || 3} horas</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-neutral-800/80 pb-2">
                      <span className="text-neutral-400">Valor Total do Projeto:</span>
                      <span className="font-bold text-white text-base">
                        R$ {searchResult.quote.totalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-neutral-800/80 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-medium">Sinal de Reserva (25%):</span>
                      </div>
                      <span className="font-bold text-amber-400 text-base">
                        R$ {(searchResult.quote.depositAmount ?? (searchResult.quote.totalPrice * 0.25)).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-neutral-400 pt-1">
                      <span>Saldo a acertar no estúdio (75%):</span>
                      <span className="font-medium text-neutral-300">
                        R$ {(searchResult.quote.totalPrice - (searchResult.quote.depositAmount ?? (searchResult.quote.totalPrice * 0.25))).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  {/* Endereço Fixo Oficial */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <strong className="text-neutral-300 block font-semibold">Local de Atendimento:</strong>
                      {searchResult.studioAddress || STUDIO_ADDRESS}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações: Escolha entre Novo Agendamento e Retorno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Opção A: NOVO AGENDAMENTO (Sinal 25%) */}
              <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-amber-500/30 hover:border-amber-500/60 transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Fluxo Principal
                    </span>
                    <span className="text-xs text-neutral-400">1ª Sessão</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Novo Agendamento</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Reserva oficial da sua sessão inaugural com garantia de data e diária de bancada. Exige sinal estrito de 25% (R$ {(searchResult.quote.depositAmount ?? (searchResult.quote.totalPrice * 0.25)).toFixed(2).replace(".", ",")}), <strong>não reembolsável em caso de cancelamento</strong>, abatido presencialmente no estúdio.
                  </p>
                  
                  <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1 mb-5">
                    <p className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Confirmação imediata pós Pix InfinitePay
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Hold de 15 minutos na agenda
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-amber-400">✓</span> Evento automático na Google Agenda
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenScheduling("NEW")}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Agendar 1ª Sessão (Sinal 25%)</span>
                </button>
              </div>

              {/* Opção B: REAGENDAMENTO / RETORNO (Isento de Sinal) */}
              <div className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Isento de Sinal (R$ 0,00)
                    </span>
                    <span className="text-xs text-neutral-400">Retorno ou Continuação</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Solicitar Retorno / Reagendamento</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    Destinado a clientes com direito a retoque de cicatrização ou continuação de projetos fechados já iniciados. Sem cobrança de novo sinal.
                  </p>

                  <div className="space-y-2 mb-5">
                    <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800 text-xs">
                      <strong className="text-neutral-200 block">1. Retoque de Cicatrização:</strong>
                      <span className="text-neutral-400">Seg, Ter, Qua e Sex das 12:00 às 19:00 (~2h)</span>
                    </div>
                    <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800 text-xs">
                      <strong className="text-neutral-200 block">2. Próxima Sessão (Continuação):</strong>
                      <span className="text-neutral-400">Seg a Sáb 11h-23h (Ter-Qui restrito a 13h-17h)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenScheduling("TOUCHUP")}
                    className="py-3 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-all text-center"
                  >
                    Agendar Retoque
                  </button>
                  <button
                    onClick={() => handleOpenScheduling("NEXT_SESSION")}
                    className="py-3 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 transition-all text-center"
                  >
                    Próxima Sessão
                  </button>
                </div>
              </div>
            </div>

            {/* Histórico de Sessões Agendadas & Ações Pré/Pós Sessão */}
            {searchResult.previousAppointments && searchResult.previousAppointments.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Histórico de Sessões & Pré-Sessão
                </h3>

                <div className="divide-y divide-neutral-800">
                  {searchResult.previousAppointments.map((app) => {
                    const startDate = new Date(app.scheduledStart);
                    const endDate = new Date(app.scheduledEnd);
                    const isConfirmed = app.status === "CONFIRMED";
                    const isPending = app.status === "PENDING_PAYMENT";
                    const isForfeited = app.status === "CANCELLED_DEPOSIT_FORFEITED";

                    const dateFormatted = `${startDate.toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "long",
                    })} às ${startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

                    const preCareUrl = getWhatsAppPreCareLink(app.clientPhone, app.clientName, dateFormatted);
                    const aftercareUrl = getWhatsAppAftercareLink(app.clientPhone, app.clientName);

                    return (
                      <div key={app.id} className="py-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-neutral-200">
                                {app.appointmentType === "TOUCHUP"
                                  ? "Retoque de Cicatrização"
                                  : app.appointmentType === "NEXT_SESSION"
                                  ? "Próxima Sessão (Projeto)"
                                  : "Primeira Sessão"}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  isConfirmed
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : isPending
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : isForfeited
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-neutral-800 text-neutral-400"
                                }`}
                              >
                                {isForfeited ? "CANCELADO (SINAL RETIDO)" : app.status}
                              </span>
                              {app.isFullyPaid && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  100% Quitado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">
                              {dateFormatted} até {endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ({app.durationHours}h)
                            </p>
                            {app.cancellationReason && (
                              <p className="text-xs text-red-400 italic mt-0.5">
                                Motivo do Cancelamento: {app.cancellationReason}
                              </p>
                            )}
                          </div>

                          <div className="text-right text-xs">
                            <span className="text-neutral-400 block">Sinal da Sessão:</span>
                            <span className="font-medium text-neutral-200">
                              {app.depositPaid && app.depositPaid > 0
                                ? `R$ ${app.depositPaid.toFixed(2).replace(".", ",")}`
                                : "Isento (R$ 0,00)"}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ações para Agendamento Confirmado */}
                        {isConfirmed && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-850">
                            {/* Botão de Anamnese & Assinatura */}
                            <button
                              onClick={() => handleOpenAnamnese(app)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition flex items-center gap-1.5"
                            >
                              <span>✍️</span>
                              <span>Ficha de Anamnese & Assinatura Digital</span>
                            </button>

                            {/* Botão Guia Pré-Sessão no WhatsApp */}
                            <a
                              href={preCareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1.5"
                            >
                              <span>📱</span>
                              <span>Guia de Cuidados Pré-Sessão (WhatsApp)</span>
                            </a>

                            {/* Botão Orientações Pós-Tattoo (Aftercare) */}
                            <a
                              href={aftercareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5"
                            >
                              <span>🩹</span>
                              <span>Orientações Pós-Tattoo (Aftercare)</span>
                            </a>

                            {/* Botão Cancelar com aviso de retenção */}
                            <button
                              onClick={() => setCancellingApp(app)}
                              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 text-xs font-semibold border border-red-500/30 transition ml-auto"
                            >
                              Cancelar Sessão
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de Agendamento Conectado */}
        {searchResult && (
          <SchedulingModal
            quote={searchResult.quote}
            initialType={selectedFlowType}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSchedulingSuccess}
          />
        )}

        {/* Modal de Anamnese Digital e Uploads */}
        {selectedAppointmentForAnamnese && (
          <AnamneseModal
            appointment={selectedAppointmentForAnamnese}
            isOpen={isAnamneseOpen}
            onClose={() => setIsAnamneseOpen(false)}
            onSuccess={handleAnamneseSuccess}
          />
        )}

        {/* Modal de Confirmação de Cancelamento */}
        {cancellingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <span>⚠️</span> Confirmar Cancelamento de Sessão
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Você está solicitando o cancelamento da sessão agendada para{" "}
                <strong>
                  {new Date(cancellingApp.scheduledStart).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(cancellingApp.scheduledStart).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </strong>.
              </p>
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300">
                <strong>ATENÇÃO (POLÍTICA DE DIÁRIA):</strong> Conforme o termo assinado, o sinal de 25% (R$ {cancellingApp.depositPaid.toFixed(2).replace(".", ",")}) é estritamente não reembolsável e será <strong>integralmente retido</strong> para cobrir os custos da reserva e diária de estúdio. A data será removida da agenda.
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">
                  Motivo do cancelamento <span className="text-red-400">*</span>:
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Informe o motivo do cancelamento..."
                  className="w-full text-xs p-3 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 h-20 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancellingApp(null);
                    setCancellationReason("");
                  }}
                  disabled={cancelLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:text-white"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading || !cancellationReason.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {cancelLoading ? "Cancelando..." : "Confirmar Cancelamento & Perda do Sinal"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
