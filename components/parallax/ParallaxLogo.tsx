"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";

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
 * Implementação nativa de alta performance acelerada por GPU (60/120fps)
 * Vinculada ao ciclo de visibilidade do container no viewport ["start end", "end start"].
 */
export default function ParallaxLogo({
  logoSrc = "/Portifolio/logo.png",
  altText = "GuinkNass — Artista Visual & Tatuador",
  className = "",
  yOffsetPercent = 20,
  enableScale = true,
}: ParallaxLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const logoEl = logoRef.current;
    if (!container || !logoEl) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let currentY = 0;
    let targetY = 0;
    let currentScale = 1;
    let targetScale = 1;
    let currentOpacity = 1;
    let targetOpacity = 1;
    let isTicking = false;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight;

      if (rect.bottom < 0 || rect.top > windowH) return;

      const totalDist = windowH + rect.height;
      const currentDist = windowH - rect.top;
      const progress = Math.max(0, Math.min(1, currentDist / totalDist));

      const activePercent = isMobile ? yOffsetPercent * 0.5 : yOffsetPercent;
      const maxOffsetPx = (activePercent / 100) * 160;

      targetY = (progress - 0.5) * 2 * maxOffsetPx;

      if (enableScale) {
        targetScale = 1 + (1 - Math.abs(progress - 0.5) * 2) * 0.04;
      }

      targetOpacity =
        progress < 0.1
          ? 0.85 + (progress / 0.1) * 0.15
          : progress > 0.9
          ? 0.85 + ((1 - progress) / 0.1) * 0.15
          : 1;

      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(render);
      }
    };

    const render = () => {
      currentY += (targetY - currentY) * 0.12;
      currentScale += (targetScale - currentScale) * 0.12;
      currentOpacity += (targetOpacity - currentOpacity) * 0.12;

      logoEl.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;
      logoEl.style.opacity = currentOpacity.toFixed(3);

      if (
        Math.abs(targetY - currentY) > 0.05 ||
        Math.abs(targetScale - currentScale) > 0.0005
      ) {
        requestAnimationFrame(render);
      } else {
        isTicking = false;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [yOffsetPercent, enableScale, isMobile]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-visible select-none ${className}`}
    >
      <div
        ref={logoRef}
        style={{
          willChange: "transform",
        }}
        className="relative flex items-center justify-center pointer-events-auto transition-opacity"
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
      </div>
    </div>
  );
}
