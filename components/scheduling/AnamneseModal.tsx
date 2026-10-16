"use client";

import React, { useState } from "react";
import SignatureCanvas from "./SignatureCanvas";
import { AppointmentDTO } from "@/types";

interface AnamneseModalProps {
  appointment: AppointmentDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AnamneseModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}: AnamneseModalProps) {
  const [hasAllergies, setHasAllergies] = useState(false);
  const [allergiesDetails, setAllergiesDetails] = useState("");
  const [hasHealingProblems, setHasHealingProblems] = useState(false);
  const [usesAnticoagulants, setUsesAnticoagulants] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [isPregnantOrLactating, setIsPregnantOrLactating] = useState(false);
  const [hasSkinDiseases, setHasSkinDiseases] = useState(false);
  const [skinDiseasesDetails, setSkinDiseasesDetails] = useState("");

  const [signatureBase64, setSignatureBase64] = useState("");
  const [skinPhotoUrl, setSkinPhotoUrl] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [refInput, setRefInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleAddRefImage = () => {
    if (refInput.trim() && !referenceImages.includes(refInput.trim())) {
      setReferenceImages([...referenceImages, refInput.trim()]);
      setRefInput("");
    }
  };

  const handleRemoveRefImage = (index: number) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  // Suporte a carregamento de arquivo local como DataURL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "skin" | "ref") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (target === "skin") {
        setSkinPhotoUrl(result);
      } else {
        setReferenceImages((prev) => [...prev, result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureBase64 || signatureBase64.length < 50) {
      setErrorMessage("Por favor, assine digitalmente no campo indicado antes de enviar.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/appointments/anamnese", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          clientCpf: appointment.clientCpf,
          clientName: appointment.clientName,
          hasAllergies,
          allergiesDetails: hasAllergies ? allergiesDetails : null,
          hasHealingProblems,
          usesAnticoagulants,
          hasDiabetes,
          isPregnantOrLactating,
          hasSkinDiseases,
          skinDiseasesDetails: hasSkinDiseases ? skinDiseasesDetails : null,
          signatureBase64,
          skinPhotoUrl: skinPhotoUrl || null,
          referenceImages: referenceImages.length > 0 ? referenceImages : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar anamnese.");
      }

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de conexão ao enviar ficha de anamnese.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
        
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest block">
              Pré-Sessão Oficial • Studio 13Point Tattoo
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Ficha de Anamnese & Assinatura Digital
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 text-xs text-neutral-300">
            <strong>Cliente:</strong> {appointment.clientName} | <strong>CPF:</strong> {appointment.clientCpf}
            <p className="text-neutral-400 mt-1">
              As informações abaixo são confidenciais e fundamentais para a sua segurança biológica e o sucesso do procedimento de tatuagem.
            </p>
          </div>

          {/* Questionário de Saúde */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
              1. Questionário de Saúde e Pele
            </h3>

            {/* Alergias */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAllergies}
                  onChange={(e) => setHasAllergies(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-200">Possui alergia a pigmentos, látex, pomadas ou cosméticos?</span>
              </label>
              {hasAllergies && (
                <input
                  type="text"
                  placeholder="Quais alergias conhecidas?"
                  value={allergiesDetails}
                  onChange={(e) => setAllergiesDetails(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                  required
                />
              )}
            </div>

            {/* Cicatrização / Quelóide */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHealingProblems}
                onChange={(e) => setHasHealingProblems(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
              />
              <span className="text-sm text-neutral-200">Possui histórico de má cicatrização ou formação de quelóides?</span>
            </label>

            {/* Anticoagulantes */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={usesAnticoagulants}
                onChange={(e) => setUsesAnticoagulants(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
              />
              <span className="text-sm text-neutral-200">Faz uso contínuo de anticoagulantes ou anti-inflamatórios?</span>
            </label>

            {/* Diabetes */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDiabetes}
                onChange={(e) => setHasDiabetes(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
              />
              <span className="text-sm text-neutral-200">É portador(a) de diabetes mellitus?</span>
            </label>

            {/* Gestante ou Lactante */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPregnantOrLactating}
                onChange={(e) => setIsPregnantOrLactating(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
              />
              <span className="text-sm text-neutral-200">Está gestante ou em período de amamentação?</span>
            </label>

            {/* Doenças de Pele */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSkinDiseases}
                  onChange={(e) => setHasSkinDiseases(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-200">Apresenta dermatite, psoríase, lesões ou infecções ativas na pele?</span>
              </label>
              {hasSkinDiseases && (
                <input
                  type="text"
                  placeholder="Descreva a condição de pele observada"
                  value={skinDiseasesDetails}
                  onChange={(e) => setSkinDiseasesDetails(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white"
                  required
                />
              )}
            </div>
          </div>

          {/* Upload de Fotos da Pele e Referências */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              2. Foto do Local da Pele & Referências
            </h3>

            {/* Foto da Região a Tatuar */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-300 block">
                Foto nítida da região do corpo onde a tattoo será feita:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "skin")}
                  className="text-xs text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-amber-400 hover:file:bg-neutral-700 cursor-pointer"
                />
              </div>
              {skinPhotoUrl && (
                <div className="mt-2 relative inline-block border border-amber-500/40 rounded-lg overflow-hidden">
                  <img src={skinPhotoUrl} alt="Foto da Pele" className="h-24 w-auto object-cover" />
                  <button
                    type="button"
                    onClick={() => setSkinPhotoUrl("")}
                    className="absolute top-1 right-1 bg-black/70 text-red-400 p-1 rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Fotos de Referências Visuais */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-300 block">
                Imagens de referência ou ideias complementares:
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "ref")}
                  className="text-xs text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
                />
              </div>

              {referenceImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative border border-neutral-700 rounded-lg overflow-hidden">
                      <img src={img} alt={`Referência ${idx + 1}`} className="h-20 w-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveRefImage(idx)}
                        className="absolute top-1 right-1 bg-black/70 text-red-400 p-1 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assinatura Digital */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              3. Assinatura Digital do Termo
            </h3>
            <p className="text-xs text-neutral-400">
              Declaro que respondi às perguntas de saúde com total sinceridade e autorizo a realização do procedimento pelo artista GuinkNass no Studio 13Point Tattoo.
            </p>
            <SignatureCanvas onSave={setSignatureBase64} />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 p-3 bg-red-950/40 border border-red-500/30 rounded-lg">
              {errorMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !signatureBase64}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? "Gravando Termo..." : "Confirmar & Assinar Termo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
