/**
 * GALERIA DE QUADROS E OBRAS ORIGINAIS
 * Renderização dinâmica das obras, controle de vídeo do processo de criação
 * e integração com WhatsApp para compra direta e esclarecimento de dúvidas.
 */

document.addEventListener("DOMContentLoaded", () => {
  renderQuadros();
  initVideoModal();
});

function renderQuadros() {
  const container = document.getElementById("quadrosContainer");
  if (!container || !window.GUINKNASS_CONFIG) return;

  const quadros = window.GUINKNASS_CONFIG.quadros || [];
  container.innerHTML = "";

  quadros.forEach((q) => {
    const card = document.createElement("article");
    card.className = "quadro-showcase-card";
    card.id = q.id;

    const buyMsg = encodeURIComponent(
      window.GUINKNASS_CONFIG.whatsappMessages.quadroInterest(q.title, q.price)
    );
    const buyUrl = `${window.GUINKNASS_CONFIG.artist.whatsappBaseUrl}?text=${buyMsg}`;

    const askMsg = encodeURIComponent(
      window.GUINKNASS_CONFIG.whatsappMessages.quadroQuestions(q.title)
    );
    const askUrl = `${window.GUINKNASS_CONFIG.artist.whatsappBaseUrl}?text=${askMsg}`;

    card.innerHTML = `
      <div class="quadro-media-col">
        <img class="quadro-main-img" src="${q.image}" alt="${q.title}" loading="lazy">
        ${q.hasVideo ? `
          <button class="quadro-video-badge-btn" onclick="playQuadroVideo('${q.video}', '${q.title}')" aria-label="Assistir ao vídeo do processo">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Ver Processo de Criação</span>
          </button>
        ` : ''}
      </div>

      <div class="quadro-info-col">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span class="tag-badge">Obra Física Original</span>
          <span class="quadro-status-badge status-${q.statusBadge}">${q.availability}</span>
        </div>

        <h2 style="font-size: clamp(1.8rem, 3vw, 2.4rem); margin-bottom: 16px;">${q.title}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.7;">${q.description}</p>

        <div class="quadro-meta-list">
          <div class="quadro-meta-item">
            <span class="quadro-meta-label">Técnica</span>
            <span class="quadro-meta-val">${q.technique}</span>
          </div>
          <div class="quadro-meta-item">
            <span class="quadro-meta-label">Materiais</span>
            <span class="quadro-meta-val">${q.materials}</span>
          </div>
          <div class="quadro-meta-item">
            <span class="quadro-meta-label">Dimensões</span>
            <span class="quadro-meta-val">${q.dimensions}</span>
          </div>
          <div class="quadro-meta-item">
            <span class="quadro-meta-label">Ano</span>
            <span class="quadro-meta-val">${q.year}</span>
          </div>
          <div class="quadro-meta-item">
            <span class="quadro-meta-label">Valor</span>
            <span class="quadro-meta-val" style="color: var(--color-secondary);">${q.price}</span>
          </div>
          <div class="quadro-meta-item">
            <span class="quadro-meta-label">Autoria</span>
            <span class="quadro-meta-val">GuinkNass (Original)</span>
          </div>
        </div>

        ${q.details && q.details.length > 0 ? `
          <ul style="margin-bottom: 28px; display: flex; flex-direction: column; gap: 8px;">
            ${q.details.map(d => `<li style="font-size: 0.9rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;"><span style="color: var(--color-secondary);">✓</span> ${d}</li>`).join('')}
          </ul>
        ` : ''}

        <div class="quadro-actions">
          <a href="${buyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg">
            <span>COMPRAR VIA WHATSAPP</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="${askUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-lg">
            <span>TIRAR DÚVIDAS</span>
          </a>
        </div>
      </div>
    `;

    // Clique na imagem abre em alta resolução
    const imgEl = card.querySelector(".quadro-main-img");
    imgEl.addEventListener("click", () => {
      if (window.openLightbox) {
        window.openLightbox(quadros.map(item => ({ file: item.image, title: item.title })), quadros.indexOf(q));
      }
    });

    container.appendChild(card);
  });
}

/* --------------------------------------------------------------------------
   Modal de Vídeo do Processo de Pintura
   -------------------------------------------------------------------------- */
let videoModalEl = null;
let videoPlayerEl = null;
let videoTitleEl = null;

function initVideoModal() {
  if (document.getElementById("quadroVideoModal")) return;

  const modal = document.createElement("div");
  modal.id = "quadroVideoModal";
  modal.className = "video-modal";
  modal.innerHTML = `
    <div class="video-modal-inner">
      <div class="video-modal-header">
        <h4 class="video-modal-title" id="videoModalTitle">Processo de Criação</h4>
        <button class="lightbox-close-btn" style="position: static;" onclick="closeQuadroVideo()" aria-label="Fechar vídeo">✕</button>
      </div>
      <div class="video-modal-video-container">
        <video id="quadroVideoPlayer" controls playsinline preload="metadata">
          <source src="" type="video/mp4">
          Seu navegador não suporta reprodução de vídeos HTML5.
        </video>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  videoModalEl = modal;
  videoPlayerEl = document.getElementById("quadroVideoPlayer");
  videoTitleEl = document.getElementById("videoModalTitle");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeQuadroVideo();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && videoModalEl.classList.contains("active")) {
      closeQuadroVideo();
    }
  });
}

function playQuadroVideo(videoSrc, title) {
  if (!videoModalEl) initVideoModal();
  videoTitleEl.textContent = `Processo de Criação: ${title}`;
  videoPlayerEl.src = videoSrc;
  videoModalEl.classList.add("active");
  document.body.style.overflow = "hidden";
  videoPlayerEl.play().catch(() => {});
}

function closeQuadroVideo() {
  if (!videoModalEl) return;
  videoPlayerEl.pause();
  videoPlayerEl.currentTime = 0;
  videoPlayerEl.src = "";
  videoModalEl.classList.remove("active");
  document.body.style.overflow = "";
}

window.playQuadroVideo = playQuadroVideo;
window.closeQuadroVideo = closeQuadroVideo;
