"use client";

import React, { useRef } from "react";
import ParallaxLogo from "./ParallaxLogo";

/**
 * Seção Hero com Efeito Parallax Scrolling idêntico ao padrão Osmo Supply (21st.dev)
 * Integrada com Next.js (App Router), Tailwind CSS e Framer Motion.
 */
export default function ParallaxHeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={containerRef}
      id="hero-parallax"
      className="relative min-h-[100vh] w-full flex items-center justify-center overflow-hidden bg-black pt-20"
    >
      {/* 1. Background com Vídeo & Máscara de Tinta (Alpha Masking / Reveal) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-black">
        <video
          className="w-full h-full object-cover brightness-[0.95] contrast-[1.05]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            maskImage: "url('/portfolio/videotinta.svg')",
            WebkitMaskImage: "url('/portfolio/videotinta.svg')",
            maskSize: "cover",
            WebkitMaskSize: "cover",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskMode: "alpha",
            WebkitMaskMode: "alpha",
          }}
        >
          <source src="/Portifolio/minha foto/eu.mp4" type="video/mp4" />
        </video>
        {/* Degradê de Alto Contraste Sobreposto */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(7, 7, 9, 0.38) 0%, rgba(7, 7, 9, 0.74) 68%, #000000 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.12) 35%, rgba(0, 0, 0, 0.78) 82%, #000000 100%)",
          }}
        />
      </div>

      {/* 2. Conteúdo Editorial & Camada Parallax Interativa */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 py-10 text-center pointer-events-auto">
        {/* Badge da Categoria */}
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#DFC17B] bg-[#C5A059]/10 border border-[#C5A059]/40 px-5 py-1.5 rounded-full mb-5">
          Artista Visual & Tatuador
        </span>

        {/* 3. Componente Parallax Scrolling do Logo */}
        <ParallaxLogo
          logoSrc="/Portifolio/logo.png"
          altText="GuinkNass — Artista Visual & Tatuador"
          className="my-3"
          yOffsetPercent={20}
          enableScale={true}
        />

        {/* 4. Hierarquia Visual de Texto */}
        <div className="max-w-2xl mx-auto mt-6 mb-8 space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
            Mais de 20 anos de trajetória artística.
          </h2>
          <p className="text-sm sm:text-base text-[#E1E3E8]/90 leading-relaxed drop-shadow">
            Mais de 13 anos transformando ideias em tatuagens autorais e obras de expressão singular.
          </p>
        </div>

        {/* 5. Chamadas para Ação (CTAs Dourado & Dark) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/portfolio.html"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-neutral-950 bg-gradient-to-r from-[#DFC17B] to-[#C5A059] hover:from-[#EAD397] hover:to-[#D4AF65] shadow-lg shadow-[#C5A059]/20 transition-all hover:-translate-y-0.5"
          >
            <span>VER PORTFÓLIO</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/orcamentos.html"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-white bg-[#0D0D0F]/65 border border-[#C5A059]/45 backdrop-blur-md hover:border-[#DFC17B] hover:text-[#DFC17B] transition-all hover:-translate-y-0.5"
          >
            SOLICITAR ORÇAMENTO
          </a>
        </div>
      </div>
    </section>
  );
}
