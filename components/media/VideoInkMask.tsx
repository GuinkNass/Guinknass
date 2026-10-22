"use client";

import React from "react";

export interface VideoInkMaskProps {
  /** Fonte do vídeo em execução */
  videoSrc?: string;
  /** Caminho do arquivo SVG de máscara de tinta (ex: /portfolio/videotinta.svg) */
  maskSrc?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Componente de Máscara de Vídeo (Alpha Masking / Reveal com Tinta Escorrendo)
 * Baseado em Next.js e Tailwind CSS.
 * O vídeo roda continuamente e fica visível apenas onde o SVG tem opacidade (tinta),
 * revelando o fundo sólido (preto) nas partes transparentes.
 */
export default function VideoInkMask({
  videoSrc = "/Portifolio/minha foto/eu.mp4",
  maskSrc = "/portfolio/videotinta.svg",
  className = "",
  children,
}: VideoInkMaskProps) {
  return (
    <div
      className={`relative w-full min-h-screen overflow-hidden bg-black flex items-center justify-center ${className}`}
    >
      {/* 1. Container do Vídeo Mascarado com Fundo Preto */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <video
          className="w-full h-full object-cover brightness-[0.95] contrast-[1.05]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            maskImage: `url('${maskSrc}')`,
            WebkitMaskImage: `url('${maskSrc}')`,
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
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* 2. Camada Sobreposta de Contraste para Máxima Legibilidade */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(7, 7, 9, 0.35) 0%, rgba(7, 7, 9, 0.72) 68%, #000000 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.1) 35%, rgba(0, 0, 0, 0.75) 82%, #000000 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* 3. Container Interativo Sobreposto (Textos, Botões e Conteúdo) */}
      <div className="relative z-20 w-full max-w-5xl mx-auto px-6 py-12 text-center pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
