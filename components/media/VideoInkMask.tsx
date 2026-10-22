"use client";

import React, { useEffect, useRef } from "react";

export interface VideoInkMaskProps {
  /** Fonte do vídeo de apresentação / fundo (1ª camada) */
  videoSrc?: string;
  /** Fonte do vídeo de tinta fluida sobreposta rodando simultaneamente (2ª camada) */
  inkVideoSrc?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Componente de Vídeo em Duas Camadas Simultâneas
 * - 1ª Camada: Vídeo de fundo com alta resolução (eu.mp4)
 * - 2ª Camada: Vídeo de tinta fluida sobreposta rodando em tempo real (videotinta.mp4)
 * com mix-blend-mode: multiply para transparência orgânica e sincronismo contínuo.
 */
export default function VideoInkMask({
  videoSrc = "/Portifolio/minha foto/eu.mp4",
  inkVideoSrc = "/Portifolio/videotinta.mp4",
  className = "",
  children,
}: VideoInkMaskProps) {
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const inkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Garante que ambos os vídeos iniciem simultaneamente sem interrupção
    if (bgVideoRef.current) {
      bgVideoRef.current.play().catch(() => {});
    }
    if (inkVideoRef.current) {
      inkVideoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div
      className={`relative w-full min-h-screen overflow-hidden bg-black flex items-center justify-center ${className}`}
    >
      {/* 1. Container de Vídeos em Duas Camadas Sobrepostas */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        {/* 1ª Camada: Vídeo de fundo */}
        <video
          ref={bgVideoRef}
          className="absolute inset-0 w-full h-full object-cover brightness-[0.92] contrast-[1.08] z-0"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* 2ª Camada: Vídeo de tinta fluida sobreposta */}
        <video
          ref={inkVideoRef}
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-95 pointer-events-none z-10"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={inkVideoSrc} type="video/mp4" />
        </video>

        {/* Camada Sobreposta de Contraste para Máxima Legibilidade */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(7, 7, 9, 0.35) 0%, rgba(7, 7, 9, 0.72) 68%, #000000 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.1) 35%, rgba(0, 0, 0, 0.75) 82%, #000000 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* 2. Container Interativo Sobreposto (Textos, Botões e Conteúdo) */}
      <div className="relative z-30 w-full max-w-5xl mx-auto px-6 py-12 text-center pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
