/**
 * FORMULÁRIO DE ORÇAMENTOS - TATUAGENS AUTORAIS
 * Gerencia validação de campos, upload múltiplo de imagens com pré-visualização,
 * integração real com Google Sheets/Google Forms e fallback inteligente para WhatsApp.
 */

document.addEventListener("DOMContentLoaded", () => {
  initBudgetForm();
});

function initBudgetForm() {
  const form = document.getElementById("budgetForm");
  const dropzone = document.getElementById("budgetDropzone");
  const fileInput = document.getElementById("budgetFileInput");
  const previewList = document.getElementById("budgetPreviewList");
  const submitBtn = document.getElementById("budgetSubmitBtn");
  const successCard = document.getElementById("budgetSuccessCard");
  const whatsappFallbackBtn = document.getElementById("budgetWhatsAppFallback");

  if (!form) return;

  const selectedFiles = [];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB por arquivo
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  // --------------------------------------------------------------------------
  // Gestão de Upload de Referências (Drag & Drop e Seleção de Arquivo)
  // --------------------------------------------------------------------------
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener("change", (e) => {
      handleFiles(e.target.files);
    });
  }

  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        if (window.showToast) window.showToast(`Formato não suportado: ${file.name}. Use JPG, PNG ou WEBP.`, "error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        if (window.showToast) window.showToast(`Arquivo muito grande: ${file.name} (máx 10MB).`, "error");
        return;
      }
      selectedFiles.push(file);
    });
    renderPreviews();
  }

  function renderPreviews() {
    if (!previewList) return;
    previewList.innerHTML = "";

    selectedFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "preview-item";

      const reader = new FileReader();
      reader.onload = (e) => {
        item.innerHTML = `
          <img class="preview-thumb" src="${e.target.result}" alt="Referência ${index + 1}">
          <button type="button" class="preview-remove-btn" data-index="${index}" title="Remover imagem">✕</button>
        `;
        item.querySelector(".preview-remove-btn")?.addEventListener("click", (ev) => {
          ev.stopPropagation();
          selectedFiles.splice(index, 1);
          renderPreviews();
        });
      };
      reader.readAsDataURL(file);

      previewList.appendChild(item);
    });
  }

  // --------------------------------------------------------------------------
  // Validação e Envio do Formulário
  // --------------------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    const requiredInputs = form.querySelectorAll("[required]");

    requiredInputs.forEach((input) => {
      const group = input.closest(".form-group");
      if (!input.value.trim()) {
        group?.classList.add("has-error");
        isValid = false;
      } else {
        group?.classList.remove("has-error");
      }
    });

    if (!isValid) {
      if (window.showToast) window.showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    // Previne envio duplicado
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span>Processando imagens e enviando...</span>`;

    // Converte imagens selecionadas em Base64 para envio à planilha/Drive
    const imagesData = await Promise.all(
      selectedFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type || "image/jpeg",
              base64: reader.result.split(",")[1]
            });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      })
    );

    // Coleta dos dados preenchidos
    const formData = {
      name: document.getElementById("clientName")?.value.trim(),
      email: document.getElementById("clientEmail")?.value.trim(),
      phone: document.getElementById("clientPhone")?.value.trim(),
      city: document.getElementById("clientCity")?.value.trim(),
      ideaDescription: document.getElementById("tattooIdea")?.value.trim(),
      meaning: document.getElementById("tattooMeaning")?.value.trim(),
      sizeCm: document.getElementById("tattooSize")?.value.trim(),
      bodyLocation: document.getElementById("tattooLocation")?.value.trim(),
      orientation: document.getElementById("tattooOrientation")?.value.trim(),
      style: document.getElementById("tattooStyle")?.value.trim(),
      colorPreference: form.querySelector('input[name="colorPreference"]:checked')?.value || "Preto e Cinza",
      notes: document.getElementById("additionalNotes")?.value.trim(),
      timestamp: new Date().toISOString(),
      referenceFilesCount: selectedFiles.length,
      images: imagesData.filter(Boolean)
    };

    const webhookUrl = window.GUINKNASS_CONFIG?.integrations?.googleSheetsBudgetWebhookUrl;

    try {
      if (webhookUrl && webhookUrl.startsWith("http")) {
        // Envio real para o Webhook do Google Apps Script
        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(formData)
        });
      }
      
      // Armazena cópia local de contingência no navegador
      const storedBudgets = JSON.parse(localStorage.getItem("guinknass_budgets") || "[]");
      storedBudgets.push(formData);
      localStorage.setItem("guinknass_budgets", JSON.stringify(storedBudgets));

      // Sucesso na submissão
      form.style.display = "none";
      if (successCard) {
        successCard.style.display = "block";
      }

      // Prepara botão de WhatsApp caso o cliente queira confirmar imediatamente
      if (whatsappFallbackBtn) {
        const waText = encodeURIComponent(
          window.GUINKNASS_CONFIG.whatsappMessages.budgetSummary(formData)
        );
        whatsappFallbackBtn.href = `${window.GUINKNASS_CONFIG.artist.whatsappBaseUrl}?text=${waText}`;
      }

      if (window.showToast) {
        window.showToast("Solicitação de orçamento enviada com sucesso!");
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      if (window.showToast) {
        window.showToast("Ocorreu um erro no envio. Tente novamente ou use o WhatsApp.", "error");
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}
