/**
 * GALERIA DE RASCUNHOS E ESTUDOS ARTÍSTICOS
 * Gestão dos estudos preliminares, processos criativos (Arte 1 até 13)
 * e controle de privacidade/publicação sob demanda do artista.
 */

document.addEventListener("DOMContentLoaded", () => {
  initEstudosGallery();
});

function initEstudosGallery() {
  const container = document.getElementById("estudosContainer");
  const banner = document.getElementById("estudosStatusBanner");
  const toggleBtn = document.getElementById("toggleEstudosVisibility");

  if (!container || !window.GUINKNASS_CONFIG) return;

  const config = window.GUINKNASS_CONFIG.estudos || {};
  let isPublished = localStorage.getItem("guinknass_estudos_published") !== null
    ? localStorage.getItem("guinknass_estudos_published") === "true"
    : config.isPublished;

  const updateVisibilityUI = () => {
    if (isPublished) {
      container.style.display = "grid";
      if (banner) {
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: var(--color-secondary); font-size: 1.2rem;">●</span>
            <div>
              <strong style="color: #ffffff;">Galeria de Estudos Ativa (Modo Artista)</strong>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Esta seção apresenta processos de pesquisa visual não comercializados.</p>
            </div>
          </div>
          <button id="toggleEstudosVisibility" class="btn btn-outline btn-sm">Ocultar Seção</button>
        `;
        document.getElementById("toggleEstudosVisibility")?.addEventListener("click", toggleStatus);
      }
    } else {
      container.style.display = "none";
      if (banner) {
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #ef4444; font-size: 1.2rem;">●</span>
            <div>
              <strong style="color: #ffffff;">Seção Temporariamente Oculta</strong>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">Estudos e rascunhos em modo reservado. Clique para autorizar a exibição.</p>
            </div>
          </div>
          <button id="toggleEstudosVisibility" class="btn btn-primary btn-sm">Publicar Galeria</button>
        `;
        document.getElementById("toggleEstudosVisibility")?.addEventListener("click", toggleStatus);
      }
    }
  };

  const toggleStatus = () => {
    isPublished = !isPublished;
    localStorage.setItem("guinknass_estudos_published", isPublished.toString());
    updateVisibilityUI();
    if (window.showToast) {
      window.showToast(isPublished ? "Galeria de estudos publicada." : "Galeria de estudos mantida em modo reservado.");
    }
  };

  // Renderiza os estudos
  const list = window.GUINKNASS_CONFIG.estudosList || [];
  container.innerHTML = "";

  list.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "estudo-card";
    card.innerHTML = `
      <div class="estudo-thumb-wrap">
        <img src="${item.file}" alt="${item.title}" loading="lazy">
      </div>
      <div class="estudo-info">
        <h4 class="estudo-title">${item.title}</h4>
        <p class="estudo-desc">${item.subtitle || 'Estudo autoral e processo de criação'}</p>
      </div>
    `;

    card.addEventListener("click", () => {
      if (window.openLightbox) {
        window.openLightbox(list.map(l => ({ file: l.file, title: `${l.title} - ${l.subtitle}` })), index);
      }
    });

    container.appendChild(card);
  });

  updateVisibilityUI();
}
