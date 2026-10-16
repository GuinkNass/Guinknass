/**
 * CARROSSEL AUTOMÁTICO DE TATUAGENS EM DESTAQUE
 * Suporte a toque móvel (touch swipe), navegação por setas e indicadores,
 * pausa ao passar o mouse e integração com visualização ampliada.
 */

document.addEventListener("DOMContentLoaded", () => {
  initFeaturedCarousel();
});

function initFeaturedCarousel() {
  const track = document.getElementById("featuredCarouselTrack");
  const dotsContainer = document.getElementById("carouselDots");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");
  const wrapper = document.querySelector(".carousel-wrapper");

  if (!track || !window.GUINKNASS_CONFIG) return;

  const slidesData = window.GUINKNASS_CONFIG.featuredCarousel || [];
  if (slidesData.length === 0) return;

  // Renderiza os slides dinamicamente a partir dos dados reais
  track.innerHTML = "";
  if (dotsContainer) dotsContainer.innerHTML = "";

  slidesData.forEach((item, index) => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";
    slide.setAttribute("data-index", index);
    slide.innerHTML = `
      <div class="carousel-image-container">
        <img class="carousel-image" src="${item.file}" alt="${item.title}" loading="${index < 3 ? 'eager' : 'lazy'}">
        <div class="carousel-overlay">
          <span class="carousel-tag">${item.tag || 'Tatuagem Autoral'}</span>
          <h3 class="carousel-title">${item.title}</h3>
        </div>
      </div>
    `;

    // Ao clicar na imagem do carrossel, abre em alta resolução no Lightbox
    slide.addEventListener("click", () => {
      if (window.openLightbox) {
        window.openLightbox(slidesData.map(s => ({ file: s.file, title: s.title })), index);
      }
    });

    track.appendChild(slide);

    if (dotsContainer) {
      const dot = document.createElement("button");
      dot.className = `carousel-dot ${index === 0 ? "active" : ""}`;
      dot.setAttribute("aria-label", `Ir para slide ${index + 1}`);
      dot.addEventListener("click", () => goToSlide(index));
      dotsContainer.appendChild(dot);
    }
  });

  let currentIndex = 0;
  let autoPlayTimer = null;
  let isHovered = false;

  const getVisibleSlides = () => {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  };

  const getMaxIndex = () => {
    const visible = getVisibleSlides();
    return Math.max(0, slidesData.length - visible);
  };

  const updateCarousel = () => {
    const visible = getVisibleSlides();
    const slideWidthPercent = 100 / visible;
    const gapOffset = 24 * (currentIndex / visible); // compensação de gap
    
    // Calcula o deslocamento do track
    const slideElement = track.querySelector(".carousel-slide");
    if (slideElement) {
      const slideWidth = slideElement.getBoundingClientRect().width;
      const gap = 24;
      const offset = (slideWidth + gap) * currentIndex;
      track.style.transform = `translateX(-${offset}px)`;
    }

    // Atualiza indicadores
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll(".carousel-dot");
      dots.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === currentIndex);
      });
    }
  };

  const goToSlide = (index) => {
    const maxIdx = getMaxIndex();
    currentIndex = Math.min(Math.max(0, index), maxIdx);
    updateCarousel();
  };

  const nextSlide = () => {
    const maxIdx = getMaxIndex();
    if (currentIndex >= maxIdx) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }
    updateCarousel();
  };

  const prevSlide = () => {
    const maxIdx = getMaxIndex();
    if (currentIndex <= 0) {
      currentIndex = maxIdx;
    } else {
      currentIndex--;
    }
    updateCarousel();
  };

  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);

  // Auto-play suave (troca a cada 4.5 segundos)
  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      if (!isHovered) {
        nextSlide();
      }
    }, 4500);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
  };

  if (wrapper) {
    wrapper.addEventListener("mouseenter", () => { isHovered = true; });
    wrapper.addEventListener("mouseleave", () => { isHovered = false; });

    // Suporte a Touch Swipe em Celulares
    let touchStartX = 0;
    let touchEndX = 0;

    wrapper.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
      isHovered = true;
    }, { passive: true });

    wrapper.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      isHovered = false;
      handleSwipe();
    }, { passive: true });

    const handleSwipe = () => {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    };
  }

  window.addEventListener("resize", () => {
    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = maxIdx;
    updateCarousel();
  });

  updateCarousel();
  startAutoPlay();
}
