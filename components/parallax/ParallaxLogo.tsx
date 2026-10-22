"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export interface ParallaxLogoProps {
  /** Caminho do asset de logo (ex: /Portifolio/logo.png ou /logo.svg) */
  logoSrc?: string;
  altText?: string;
  className?: string;
  /** Percentual máximo de deslocamento vertical parallax (padrão: 20%) */
  yOffsetPercent?: number;
  /** Ativa respiração sutil de escala tridimensional durante a rolagem */
  enableScale?: boolean;
}

/**
 * Componente Parallax Scrolling inspirado no padrão Osmo Supply (21st.dev)
 * Aplica translação vertical e interpolação de escala aceleradas por GPU
 * vinculadas ao ciclo de visibilidade do container no viewport.
 */
export default function ParallaxLogo({
  logoSrc = "/Portifolio/logo.png",
  altText = "GuinkNass — Artista Visual & Tatuador",
  className = "",
  yOffsetPercent = 20,
  enableScale = true,
}: ParallaxLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 1. Container com Scroll Tracker (ciclo completo de visibilidade)
  // offset: ["start end", "end start"] -> inicia quando o topo do container toca a base do viewport
  // e finaliza quando a base do container deixa o topo do viewport.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Física de mola (Spring) para amortecimento fluido de alta taxa de quadros (60/120fps)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  // Em mobile, usa offset mais suave (10%) para evitar sensibilidade excessiva no toque
  const activeOffset = isMobile ? Math.round(yOffsetPercent * 0.5) : yOffsetPercent;

  // 2. Interpolação de Valores (useTransform)
  // Translação vertical contínua
  const y = useTransform(
    smoothProgress,
    [0, 1],
    [`-${activeOffset}%`, `${activeOffset}%`]
  );

  // Escala suave tridimensional (0.96 no início, 1.04 no centro de foco, 0.98 na saída)
  const scale = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    enableScale ? [0.96, 1.04, 0.98] : [1, 1, 1]
  );

  // Opacidade gradual nas extremidades para evitar corte abrupto
  const opacity = useTransform(smoothProgress, [0, 0.12, 0.88, 1], [0.85, 1, 1, 0.88]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-visible select-none ${className}`}
    >
      <motion.div
        style={{
          y,
          scale,
          opacity,
          willChange: "transform",
        }}
        className="relative flex items-center justify-center pointer-events-auto"
      >
        {/* Halo / Iluminação dourada sutil de ambientação */}
        <div
          className="absolute -inset-8 -z-10 rounded-full blur-2xl opacity-25 pointer-events-none transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle, rgba(197, 160, 89, 0.38) 0%, rgba(197, 160, 89, 0) 70%)",
          }}
          aria-hidden="true"
        />

        {/* Elemento Visual do Logo */}
        <Image
          src={logoSrc}
          alt={altText}
          width={500}
          height={231}
          priority
          className="w-full max-w-[480px] sm:max-w-[440px] xs:max-w-[320px] h-auto object-contain drop-shadow-[0_10px_32px_rgba(0,0,0,0.95)]"
        />
      </motion.div>
    </div>
  );
}
