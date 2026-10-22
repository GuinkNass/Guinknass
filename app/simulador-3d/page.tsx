"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SelectedAnatomyData } from "@/components/3d/BodyModelViewer";

// Import dinâmico com ssr: false para WebGL seguro no Next.js App Router
const BodyModelViewer = dynamic(() => import("@/components/3d/BodyModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-2xl bg-[#0a0a0e] border border-white/10 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium">Iniciando Motor 3D...</span>
    </div>
  ),
});

export default function Simulador3DPage() {
  const [confirmedData, setConfirmedData] = useState<SelectedAnatomyData | null>(null);

  const handleSelect = (data: SelectedAnatomyData) => {
    setConfirmedData(data);
  };

  return (
    <main className="min-h-screen bg-[#070709] text-white flex flex-col justify-between p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/orcamentos.html"
            className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-semibold transition flex items-center gap-1.5"
          >
            ← Voltar ao Formulário
          </Link>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#C5A059] uppercase block">
              GuinkNass Studio
            </span>
            <h1 className="text-lg md:text-xl font-bold text-white leading-tight">
              Simulador Anatômico 3D de Orçamento
            </h1>
          </div>
        </div>

        <Link
          href="https://wa.me/5511995802338"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/20 text-xs font-bold transition"
        >
          WhatsApp Comercial
        </Link>
      </header>

      {/* Visualizador 3D Principal */}
      <section className="max-w-6xl mx-auto w-full py-6 flex-1 flex flex-col justify-center">
        <BodyModelViewer
          modelPath="/Portifolio/3d/male_body.glb"
          defaultHeightCm={175}
          onSelectRegion={handleSelect}
          className="shadow-2xl shadow-black/80"
        />

        {/* Notificação / Toast de Confirmação */}
        {confirmedData && (
          <div className="mt-4 p-4 rounded-xl bg-[#121319] border border-[#00FCDB]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#00FCDB]/10 text-[#00FCDB] flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <div>
                <span className="text-xs text-white/50 block">Local Selecionado:</span>
                <span className="text-sm font-bold text-white">
                  {confirmedData.name} — {confirmedData.realWidth} x {confirmedData.realHeight} cm (~{confirmedData.areaCm2} cm²)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`/orcamentos.html?local=${encodeURIComponent(confirmedData.name)}&tamanho=${encodeURIComponent(
                  `${confirmedData.realWidth} cm x ${confirmedData.realHeight} cm (~${confirmedData.areaCm2} cm²)`
                )}`}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#C5A059] text-black font-bold text-xs hover:brightness-105 transition text-center shadow-md"
              >
                Preencher no Orçamento Digital &rarr;
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-4 border-t border-white/10 text-center text-xs text-white/40">
        GuinkNass © 2026 • Sistema de Raycasting Anatômico 3D para Dimensionamento Real de Tatuagens
      </footer>
    </main>
  );
}
