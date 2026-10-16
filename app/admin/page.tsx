"use client";

import React, { useState, useEffect } from "react";
import { 
  AppointmentDTO, 
  STUDIO_ADDRESS, 
  getWhatsAppPreCareLink, 
  getWhatsAppAftercareLink 
} from "@/types";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Estado para cobrança de saldo restante (75%)
  const [chargingApp, setChargingApp] = useState<AppointmentDTO | null>(null);
  const [balancePixData, setBalancePixData] = useState<{
    amount: number;
    qrCodeUrl: string;
    copiaECola: string;
    expiresAt: string;
  } | null>(null);
  const [chargingLoading, setChargingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estado para visualização de Anamnese & Assinatura
  const [viewingAnamneseApp, setViewingAnamneseApp] = useState<AppointmentDTO | null>(null);

  // Estado para visualização de Fotos da Pele e Referências
  const [viewingPhotosApp, setViewingPhotosApp] = useState<AppointmentDTO | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/appointments");
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleGenerateBalancePix = async (app: AppointmentDTO) => {
    setChargingApp(app);
    setChargingLoading(true);
    setBalancePixData(null);

    try {
      const res = await fetch("/api/appointments/charge-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: app.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar cobrança.");

      setBalancePixData({
        amount: data.balanceAmount,
        qrCodeUrl: data.pix.qrCodeUrl,
        copiaECola: data.pix.copiaECola,
        expiresAt: data.pix.expiresAt,
      });
    } catch (err: any) {
      alert(err.message || "Erro ao gerar cobrança de saldo restante.");
      setChargingApp(null);
    } finally {
      setChargingLoading(false);
    }
  };

  const copyPix = () => {
    if (balancePixData?.copiaECola) {
      navigator.clipboard.writeText(balancePixData.copiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filtered = appointments.filter((app) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "CONFIRMED") return app.status === "CONFIRMED";
    if (filterStatus === "PENDING") return app.status === "PENDING_PAYMENT";
    if (filterStatus === "FORFEITED") return app.status === "CANCELLED_DEPOSIT_FORFEITED";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08080a] text-neutral-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-2">
              Painel Operacional do Tatuador
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Studio 13Point Tattoo & GuinkNass
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Gestão de agendamentos, cobrança de saldo restante (75%), anamneses digitais e disparo de orientações de cuidados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAppointments}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold rounded-xl transition"
            >
              🔄 Atualizar Agenda
            </button>
            <a
              href="/consultar-orcamento"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded-xl transition"
            >
              Abrir Consulta Cliente
            </a>
          </div>
        </div>

        {/* Filtros de Status */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "ALL", label: "Todos os Atendimentos" },
            { id: "CONFIRMED", label: "Confirmados" },
            { id: "PENDING", label: "Hold / Pagamento Pendente" },
            { id: "FORFEITED", label: "Cancelados (Sinal Retido)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                filterStatus === f.id
                  ? "bg-amber-500 text-neutral-950 font-bold"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista de Agendamentos */}
        {loading ? (
          <div className="text-center py-20 text-neutral-500 text-sm">
            Carregando agenda do estúdio...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900/40 border border-neutral-800 rounded-2xl text-neutral-400 text-sm">
            Nenhum agendamento encontrado para este filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const startDate = new Date(app.scheduledStart);
              const endDate = new Date(app.scheduledEnd);
              const isConfirmed = app.status === "CONFIRMED";
              const isForfeited = app.status === "CANCELLED_DEPOSIT_FORFEITED";

              const dateFormatted = `${startDate.toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "long",
              })} às ${startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

              const preCareUrl = getWhatsAppPreCareLink(app.clientPhone, app.clientName, dateFormatted);
              const aftercareUrl = getWhatsAppAftercareLink(app.clientPhone, app.clientName);

              return (
                <div
                  key={app.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    
                    {/* Dados do Cliente e Tipo */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white text-base">
                          {app.clientName}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isConfirmed
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : isForfeited
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isForfeited ? "SINAL RETIDO" : app.status}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                          {app.appointmentType === "TOUCHUP"
                            ? "Retoque"
                            : app.appointmentType === "NEXT_SESSION"
                            ? "Próxima Sessão"
                            : "Novo Agendamento"}
                        </span>
                        {app.isFullyPaid && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            ✓ Saldo 100% Quitado
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span>📱 {app.clientPhone}</span>
                        <span>🆔 CPF: {app.clientCpf}</span>
                        <span>
                          📅 {dateFormatted} ({app.durationHours}h)
                        </span>
                      </div>

                      {app.touchupReason && (
                        <p className="text-xs text-amber-400/90 italic mt-1.5">
                          Retoque: "{app.touchupReason}"
                        </p>
                      )}
                    </div>

                    {/* Dados Financeiros */}
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs flex gap-4 min-w-[240px] justify-between">
                      <div>
                        <span className="text-neutral-500 block">Total</span>
                        <span className="font-semibold text-white">
                          R$ {Number(app.totalPrice).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Sinal Pago</span>
                        <span className="font-semibold text-amber-400">
                          R$ {Number(app.depositPaid).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Saldo Restante</span>
                        <span className={`font-semibold ${app.isFullyPaid ? "text-emerald-400 line-through" : "text-white"}`}>
                          R$ {Number(app.balanceDue).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas do Tatuador */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-800">
                    
                    {/* Ação 1: Cobrança do Saldo Restante (75%) */}
                    {isConfirmed && !app.isFullyPaid && Number(app.balanceDue) > 0 && (
                      <button
                        onClick={() => handleGenerateBalancePix(app)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                      >
                        <span>💳</span>
                        <span>Gerar Cobrança de Saldo Restante (R$ {Number(app.balanceDue).toFixed(2)})</span>
                      </button>
                    )}

                    {/* Ação 2: Ver Anamnese Digital */}
                    <button
                      onClick={() => setViewingAnamneseApp(app)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5"
                    >
                      <span>✍️</span>
                      <span>{app.anamnese ? "Ver Anamnese & Assinatura" : "Anamnese Pendente"}</span>
                    </button>

                    {/* Ação 3: Ver Fotos da Pele / Referências */}
                    {(app.skinPhotoUrl || (app.referenceImages && (app.referenceImages as string[]).length > 0)) && (
                      <button
                        onClick={() => setViewingPhotosApp(app)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5"
                      >
                        <span>📸</span>
                        <span>Fotos (Pele & Referências)</span>
                      </button>
                    )}

                    {/* Ação 4: WhatsApp Pré-Sessão */}
                    <a
                      href={preCareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition flex items-center gap-1.5"
                    >
                      <span>📱</span>
                      <span>Disparar Guia Pré-Sessão</span>
                    </a>

                    {/* Ação 5: WhatsApp Aftercare */}
                    <a
                      href={aftercareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5"
                    >
                      <span>🩹</span>
                      <span>Disparar Pós-Tattoo (Aftercare)</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Cobrança Pix do Saldo Restante (75%) */}
        {chargingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-center">
              <h3 className="text-xl font-bold text-white">
                Cobrança de Saldo Restante via Pix
              </h3>
              <p className="text-xs text-neutral-400">
                Cliente: <strong>{chargingApp.clientName}</strong>
              </p>

              {chargingLoading ? (
                <div className="py-10 text-amber-400 animate-pulse text-sm">
                  Gerando Pix InfinitePay de R$ {Number(chargingApp.balanceDue).toFixed(2)}...
                </div>
              ) : balancePixData ? (
                <div className="space-y-4">
                  <div className="text-2xl font-extrabold text-amber-400">
                    R$ {balancePixData.amount.toFixed(2).replace(".", ",")}
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-amber-500 inline-block">
                      <img src={balancePixData.qrCodeUrl} alt="QR Code Saldo" className="w-44 h-44" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyPix}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
                  >
                    {copied ? "✓ Copiado com Sucesso!" : "Copiar Chave Copia e Cola"}
                  </button>

                  <p className="text-[11px] text-neutral-500">
                    O webhook atualizará automaticamente este projeto como 100% QUITADO assim que o Pix for aprovado.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setChargingApp(null)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl font-semibold mt-2"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Visualização da Ficha de Anamnese & Assinatura */}
        {viewingAnamneseApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Ficha de Anamnese Digital</h3>
                  <p className="text-xs text-neutral-400">{viewingAnamneseApp.clientName} • CPF: {viewingAnamneseApp.clientCpf}</p>
                </div>
                <button
                  onClick={() => setViewingAnamneseApp(null)}
                  className="text-neutral-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {viewingAnamneseApp.anamnese ? (
                <div className="space-y-4 text-xs">
                  <div className="space-y-2 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Alergias:</span>
                      <span className={viewingAnamneseApp.anamnese.hasAllergies ? "text-red-400 font-bold" : "text-emerald-400"}>
                        {viewingAnamneseApp.anamnese.hasAllergies ? `Sim (${viewingAnamneseApp.anamnese.allergiesDetails || "informado"})` : "Não"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Cicatrização / Quelóide:</span>
                      <span className={viewingAnamneseApp.anamnese.hasHealingProblems ? "text-amber-400 font-bold" : "text-emerald-400"}>
                        {viewingAnamneseApp.anamnese.hasHealingProblems ? "Sim" : "Não"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Uso de Anticoagulantes:</span>
                      <span className={viewingAnamneseApp.anamnese.usesAnticoagulants ? "text-red-400 font-bold" : "text-emerald-400"}>
                        {viewingAnamneseApp.anamnese.usesAnticoagulants ? "Sim" : "Não"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Diabetes:</span>
                      <span className={viewingAnamneseApp.anamnese.hasDiabetes ? "text-amber-400 font-bold" : "text-emerald-400"}>
                        {viewingAnamneseApp.anamnese.hasDiabetes ? "Sim" : "Não"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Gestante / Lactante:</span>
                      <span className={viewingAnamneseApp.anamnese.isPregnantOrLactating ? "text-red-400 font-bold" : "text-emerald-400"}>
                        {viewingAnamneseApp.anamnese.isPregnantOrLactating ? "Sim" : "Não"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Doenças de Pele Ativas:</span>
                      <span className={viewingAnamneseApp.anamnese.hasSkinDiseases ? "text-red-400 font-bold" : "text-emerald-400"}>
                        {viewingAnamneseApp.anamnese.hasSkinDiseases ? `Sim (${viewingAnamneseApp.anamnese.skinDiseasesDetails || "informado"})` : "Não"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase text-neutral-400 font-semibold mb-2">Assinatura Digital Capturada:</h4>
                    <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex justify-center">
                      <img
                        src={viewingAnamneseApp.anamnese.signatureBase64}
                        alt="Assinatura Digital"
                        className="max-h-24 w-auto object-contain"
                      />
                    </div>
                    {viewingAnamneseApp.anamnese.signedAt && (
                      <p className="text-[10px] text-neutral-500 mt-1 text-center">
                        Assinado em: {new Date(viewingAnamneseApp.anamnese.signedAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-950 rounded-xl">
                  O cliente ainda não preencheu a ficha de anamnese digital.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Visualização de Fotos (Pele & Referências) */}
        {viewingPhotosApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Fotos Enviadas pelo Cliente</h3>
                  <p className="text-xs text-neutral-400">{viewingPhotosApp.clientName}</p>
                </div>
                <button
                  onClick={() => setViewingPhotosApp(null)}
                  className="text-neutral-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {viewingPhotosApp.skinPhotoUrl && (
                <div>
                  <h4 className="text-xs uppercase text-amber-500 font-bold mb-2">📸 Foto da Pele / Local da Tattoo:</h4>
                  <div className="rounded-xl overflow-hidden border border-neutral-800">
                    <img src={viewingPhotosApp.skinPhotoUrl} alt="Foto da Pele" className="w-full max-h-60 object-contain bg-black" />
                  </div>
                </div>
              )}

              {viewingPhotosApp.referenceImages && (viewingPhotosApp.referenceImages as string[]).length > 0 && (
                <div>
                  <h4 className="text-xs uppercase text-neutral-400 font-bold mb-2">🎨 Referências Visuais:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewingPhotosApp.referenceImages as string[]).map((img, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-neutral-800">
                        <img src={img} alt={`Referência ${i + 1}`} className="w-full h-36 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
