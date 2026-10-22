/**
 * JAVASCRIPT PRINCIPAL - GUINKNASS SITE OFICIAL
 * Controle de navegação, cabeçalho dinâmico, WhatsApp flutuante e utilitários
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileMenu();
  initWhatsAppWidget();
  highlightActiveNavLink();
  initHeroParallaxLogo();
});

/* --------------------------------------------------------------------------
   Header com Scroll Effect
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
}

/* --------------------------------------------------------------------------
   Menu Mobile & Gaveta Lateral
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.querySelector(".mobile-toggle");
  const drawer = document.querySelector(".mobile-drawer");
  const backdrop = document.querySelector(".drawer-backdrop");

  if (!toggleBtn || !drawer) return;

  const toggleDrawer = (isOpen) => {
    const shouldOpen = typeof isOpen === "boolean" ? isOpen : !drawer.classList.contains("open");
    drawer.classList.toggle("open", shouldOpen);
    toggleBtn.classList.toggle("active", shouldOpen);
    if (backdrop) backdrop.classList.toggle("active", shouldOpen);
    document.body.style.overflow = shouldOpen ? "hidden" : "";
  };

  toggleBtn.addEventListener("click", () => toggleDrawer());
  if (backdrop) backdrop.addEventListener("click", () => toggleDrawer(false));

  // Fechar ao clicar em um link interno
  drawer.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", () => toggleDrawer(false));
  });

  // Fechar com tecla ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      toggleDrawer(false);
    }
  });
}

/* --------------------------------------------------------------------------
   Destacar Link Ativo no Menu
   -------------------------------------------------------------------------- */
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".nav-link, .mobile-nav-link");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/* --------------------------------------------------------------------------
   Botão Flutuante de WhatsApp e Menu Rápido
   -------------------------------------------------------------------------- */
function initWhatsAppWidget() {
  const trigger = document.querySelector(".whatsapp-btn-trigger");
  const popup = document.querySelector(".whatsapp-popup");
  const closeBtn = document.querySelector(".whatsapp-popup-close");

  if (!trigger || !popup) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    popup.classList.toggle("active");
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.classList.remove("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !trigger.contains(e.target)) {
      popup.classList.remove("active");
    }
  });
}

/* --------------------------------------------------------------------------
   Sistema Global de Toast Notifications
   -------------------------------------------------------------------------- */
function showToast(message, type = "success", duration = 4500) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
  
  const icon = type === "error" ? "✕" : "✓";
  toast.innerHTML = `<span><strong>${icon}</strong> ${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.35s ease forwards";
    setTimeout(() => {
      toast.remove();
    }, 350);
  }, duration);
}

// Expõe showToast globalmente
window.showToast = showToast;

/* --------------------------------------------------------------------------
   Efeito Parallax Scrolling no Logo Central (Inspirado no Osmo Supply)
   Interpolação contínua acelerada por GPU, willChange: transform
   Ciclo de visibilidade: target hero, offset: ["start end", "end start"]
   -------------------------------------------------------------------------- */
function initHeroParallaxLogo() {
  const hero = document.getElementById("hero");
  const logo = document.querySelector(".hero-logo-center .hero-logo-img");
  if (!hero || !logo) return;

  // Respeita preferência do usuário por redução de movimento
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  logo.style.willChange = "transform";

  let currentY = 0;
  let targetY = 0;
  let currentScale = 1;
  let targetScale = 1;
  let isTicking = false;

  const calculateParallax = () => {
    const rect = hero.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Se o elemento estiver totalmente fora do viewport, ignora cálculo
    if (rect.bottom < 0 || rect.top > windowH) return;

    // Offset ["start end", "end start"]:
    // 0 = quando o topo do hero toca o fundo do viewport
    // 1 = quando o fundo do hero toca o topo do viewport
    const totalDist = windowH + rect.height;
    const currentDist = windowH - rect.top;
    const progress = Math.max(0, Math.min(1, currentDist / totalDist));

    // Deslocamento suave de -20% a +20%
    const isMobile = window.innerWidth < 768;
    const maxOffset = isMobile ? 24 : 50;
    targetY = (progress - 0.5) * 2 * maxOffset;

    // Leve respiração tridimensional de escala (0.97 a 1.03)
    targetScale = 1 + (1 - Math.abs(progress - 0.5) * 2) * 0.03;

    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(renderParallax);
    }
  };

  const renderParallax = () => {
    // Amortecimento suave (lerp 0.12) idêntico ao Framer Motion useSpring
    currentY += (targetY - currentY) * 0.12;
    currentScale += (targetScale - currentScale) * 0.12;

    logo.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;

    if (Math.abs(targetY - currentY) > 0.05 || Math.abs(targetScale - currentScale) > 0.0005) {
      requestAnimationFrame(renderParallax);
    } else {
      isTicking = false;
    }
  };

  window.addEventListener("scroll", calculateParallax, { passive: true });
  window.addEventListener("resize", calculateParallax, { passive: true });
  calculateParallax();
}
