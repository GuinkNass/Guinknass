/**
 * PORTFÓLIO DE TATUAGENS - GUINKNASS
 * Galeria dinâmica, filtros de categoria e integração com Lightbox de alta resolução
 */

document.addEventListener("DOMContentLoaded", () => {
  initPortfolio();
});

function initPortfolio() {
  const container = document.getElementById("portfolioGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");

  if (!container || !window.GUINKNASS_CONFIG) return;

  const tattoos = window.GUINKNASS_CONFIG.tattoos || [];
  let currentCategory = "todos";
  let activeList = [...tattoos];

  const renderGrid = () => {
    container.innerHTML = "";

    activeList.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "portfolio-card";
      card.setAttribute("data-category", item.category);

      card.innerHTML = `
        <img src="${item.file}" alt="${item.title}" loading="${index < 6 ? 'eager' : 'lazy'}">
        <div class="portfolio-overlay">
          <span class="portfolio-card-cat">${item.category.toUpperCase()}</span>
          <h3 class="portfolio-card-title">${item.title}</h3>
        </div>
      `;

      card.addEventListener("click", () => {
        if (window.openLightbox) {
          window.openLightbox(activeList.map(t => ({ file: t.file, title: t.title })), index);
        }
      });

      container.appendChild(card);
    });
  };

  // Filtros
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.getAttribute("data-filter");
      currentCategory = category;

      if (category === "todos") {
        activeList = [...tattoos];
      } else {
        activeList = tattoos.filter(t => t.category === category);
      }

      renderGrid();
    });
  });

  renderGrid();
}
