/**
 * LIGHTBOX DE ALTA RESOLUÇÃO
 * Permite ampliar qualquer obra de tatuagem, quadro ou estudo com nitidez,
 * navegação entre imagens (setas ou swipe no celular) e acessibilidade via teclado.
 */

(function () {
  let lightboxModal = null;
  let lightboxImage = null;
  let lightboxCaption = null;
  let currentList = [];
  let currentIndex = 0;

  function createLightboxDOM() {
    if (document.getElementById("globalLightbox")) return;

    const modal = document.createElement("div");
    modal.id = "globalLightbox";
    modal.className = "lightbox-modal";
    modal.innerHTML = `
      <div class="lightbox-content-wrapper">
        <button class="lightbox-close-btn" id="lightboxClose" aria-label="Fechar visualização">✕</button>
        <img class="lightbox-image" id="lightboxImg" src="" alt="Obra de GuinkNass">
        <div class="lightbox-caption" id="lightboxCaption"></div>
      </div>
      <button class="lightbox-nav-btn lightbox-nav-prev" id="lightboxPrev" aria-label="Obra anterior">❮</button>
      <button class="lightbox-nav-btn lightbox-nav-next" id="lightboxNext" aria-label="Próxima obra">❯</button>
    `;

    document.body.appendChild(modal);

    lightboxModal = modal;
    lightboxImage = document.getElementById("lightboxImg");
    lightboxCaption = document.getElementById("lightboxCaption");

    const closeBtn = document.getElementById("lightboxClose");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");

    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", (e) => { e.stopPropagation(); prevImage(); });
    nextBtn.addEventListener("click", (e) => { e.stopPropagation(); nextImage(); });

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("lightbox-content-wrapper")) {
        closeLightbox();
      }
    });

    // Navegação por teclado
    window.addEventListener("keydown", (e) => {
      if (!lightboxModal.classList.contains("active")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    });

    // Touch Swipe no Celular
    let touchStartX = 0;
    let touchEndX = 0;

    modal.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    modal.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (Math.abs(touchStartX - touchEndX) > 40) {
        if (touchStartX > touchEndX) {
          nextImage();
        } else {
          prevImage();
        }
      }
    }, { passive: true });
  }

  function openLightbox(list, index = 0) {
    createLightboxDOM();
    currentList = list;
    currentIndex = index;
    updateDisplay();
    lightboxModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  function updateDisplay() {
    if (!currentList || currentList.length === 0) return;
    const item = currentList[currentIndex];
    lightboxImage.src = item.file || item.image || item.src;
    lightboxCaption.textContent = item.title || "";
  }

  function nextImage() {
    if (currentIndex < currentList.length - 1) {
      currentIndex++;
    } else {
      currentIndex = 0;
    }
    updateDisplay();
  }

  function prevImage() {
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      currentIndex = currentList.length - 1;
    }
    updateDisplay();
  }

  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
})();
