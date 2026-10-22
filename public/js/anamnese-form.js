/**
 * FICHA DIGITAL DE ANAMNESE - TATUAGEM
 * Assistente em 4 etapas (Wizard), com validação cuidadosa, perguntas de segurança,
 * consentimento LGPD para dados sensíveis, assinatura eletrônica em Canvas e submissão protegida.
 */

document.addEventListener("DOMContentLoaded", () => {
  initAnamneseWizard();
  initSignaturePad();
  initConditionalQuestions();
});

let currentStep = 1;
const totalSteps = 4;
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;
let hasSigned = false;

function initAnamneseWizard() {
  const nextBtn = document.getElementById("wizardNextBtn");
  const prevBtn = document.getElementById("wizardPrevBtn");
  const submitBtn = document.getElementById("wizardSubmitBtn");
  const progressBar = document.getElementById("wizardProgressBar");
  const form = document.getElementById("anamneseForm");
  const successCard = document.getElementById("anamneseSuccessCard");

  if (!form) return;

  const updateWizardUI = () => {
    // Atualiza panes
    document.querySelectorAll(".wizard-step-pane").forEach((pane, idx) => {
      pane.classList.toggle("active", idx + 1 === currentStep);
    });

    // Atualiza indicadores de topo
    document.querySelectorAll(".step-indicator").forEach((ind, idx) => {
      const stepNum = idx + 1;
      ind.classList.remove("active", "completed");
      if (stepNum === currentStep) ind.classList.add("active");
      if (stepNum < currentStep) ind.classList.add("completed");
    });

    // Atualiza barra de progresso
    if (progressBar) {
      const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
      progressBar.style.width = `calc(${progressPercent}% - 40px)`;
    }

    // Botões de navegação
    if (prevBtn) prevBtn.style.display = currentStep > 1 ? "inline-flex" : "none";
    if (nextBtn) nextBtn.style.display = currentStep < totalSteps ? "inline-flex" : "none";
    if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? "inline-flex" : "none";

    // Se estiver no passo 4 (revisão), preenche o resumo e dimensiona o canvas
    if (currentStep === 4) {
      populateReviewData();
      setTimeout(() => {
        if (window.setupSignatureCanvas) window.setupSignatureCanvas();
      }, 80);
    }

    // Rola para o topo do formulário suavemente
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validateStep = (step) => {
    let valid = true;
    const currentPane = document.getElementById(`wizardStep${step}`);
    if (!currentPane) return true;

    // Campos obrigatórios no passo atual
    const requireds = currentPane.querySelectorAll("[required]");
    requireds.forEach((field) => {
      const group = field.closest(".form-group") || field.closest(".question-card") || field.closest(".custom-checkbox");
      if (field.type === "checkbox") {
        if (!field.checked) {
          group?.classList.add("has-error");
          valid = false;
        } else {
          group?.classList.remove("has-error");
        }
      } else if (!field.value.trim()) {
        group?.classList.add("has-error");
        valid = false;
      } else {
        group?.classList.remove("has-error");
      }
    });

    if (step === 3) {
      // Verifica consentimento LGPD obrigatório
      const lgpdCheck = document.getElementById("consentLgpd");
      if (!lgpdCheck || !lgpdCheck.checked) {
        if (window.showToast) window.showToast("É necessário aceitar o termo de consentimento para prosseguir.", "error");
        valid = false;
      }
    }

    if (!valid && window.showToast) {
      window.showToast("Por favor, preencha os itens obrigatórios antes de avançar.", "error");
    }

    return valid;
  };

  nextBtn?.addEventListener("click", () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        currentStep++;
        updateWizardUI();
      }
    }
  });

  prevBtn?.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep--;
      updateWizardUI();
    }
  });

  // Envio final no passo 4
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!hasSigned) {
      if (window.showToast) window.showToast("Por favor, confirme sua assinatura no campo indicado.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Registrando Ficha com Segurança...</span>`;

    const anamneseData = collectAnamneseData();

    const webhookUrl = window.GUINKNASS_CONFIG?.integrations?.googleSheetsAnamneseWebhookUrl;

    try {
      if (webhookUrl && webhookUrl.startsWith("http")) {
        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(anamneseData)
        });
      } else {
        // Armazenamento em contingência restrita
        const stored = JSON.parse(localStorage.getItem("guinknass_anamneses") || "[]");
        stored.push({
          ...anamneseData,
          signatureData: "[Assinatura Registrada]"
        });
        localStorage.setItem("guinknass_anamneses", JSON.stringify(stored));
      }

      // Sucesso: oculta o formulário e exibe tela segura com preview da assinatura
      form.style.display = "none";
      if (successCard) {
        successCard.style.display = "block";
        const previewWrap = document.getElementById("anamneseSignaturePreviewWrap");
        const previewImg = document.getElementById("anamneseSignaturePreviewImg");
        if (previewWrap && previewImg && anamneseData.signature) {
          previewImg.src = anamneseData.signature;
          previewWrap.style.display = "block";
        }
      }

      if (window.showToast) {
        window.showToast("Ficha de anamnese enviada e protegida com sucesso!");
      }
    } catch (err) {
      console.error("Erro no envio:", err);
      if (window.showToast) {
        window.showToast("Falha temporária ao registrar ficha. Entre em contato diretamente.", "error");
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>CONFIRMAR E ENVIAR FICHA</span>`;
    }
  });

  updateWizardUI();
}

/* --------------------------------------------------------------------------
   Canvas de Assinatura Eletrônica (Suporte Desktop, Celulares e Alta Resolução)
   -------------------------------------------------------------------------- */
function updateSignatureStatus(signed) {
  const statusEl = document.getElementById("signatureStatus");
  if (!statusEl) return;
  if (signed) {
    statusEl.innerHTML = `<span style="color: #DFC17B; font-weight: 600;">✓ Assinatura eletrônica capturada com sucesso</span>`;
  } else {
    statusEl.innerHTML = `<span style="color: #94a3b8;">✏️ Aguardando assinatura com o dedo (no celular) ou mouse</span>`;
  }
}

function setupSignatureCanvas() {
  signatureCanvas = document.getElementById("signaturePad");
  if (!signatureCanvas) return;
  signatureCtx = signatureCanvas.getContext("2d");

  const rect = signatureCanvas.getBoundingClientRect();
  const width = rect.width || signatureCanvas.parentElement?.clientWidth || 400;
  const height = 180;

  // Preserva assinatura prévia se houver
  let temp = null;
  if (hasSigned && signatureCanvas.width > 0) {
    try {
      temp = signatureCanvas.toDataURL("image/png");
    } catch (e) {}
  }

  const dpr = window.devicePixelRatio || 1;
  signatureCanvas.width = width * dpr;
  signatureCanvas.height = height * dpr;
  signatureCanvas.style.width = width + "px";
  signatureCanvas.style.height = height + "px";

  signatureCtx.setTransform(1, 0, 0, 1, 0, 0);
  signatureCtx.scale(dpr, dpr);
  signatureCtx.lineWidth = 2.8;
  signatureCtx.lineCap = "round";
  signatureCtx.lineJoin = "round";
  signatureCtx.strokeStyle = "#DFC17B";

  if (temp) {
    const img = new Image();
    img.onload = () => {
      signatureCtx.drawImage(img, 0, 0, width, height);
    };
    img.src = temp;
  }
}
window.setupSignatureCanvas = setupSignatureCanvas;

function initSignaturePad() {
  signatureCanvas = document.getElementById("signaturePad");
  if (!signatureCanvas) return;

  signatureCtx = signatureCanvas.getContext("2d");
  window.addEventListener("resize", () => {
    if (currentStep === 4) setupSignatureCanvas();
  });

  const getPos = (e) => {
    const rect = signatureCanvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e) => {
    if (e.cancelable && e.type.startsWith("touch")) e.preventDefault();
    isDrawing = true;
    hasSigned = true;
    updateSignatureStatus(true);
    const pos = getPos(e);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable && e.type.startsWith("touch")) e.preventDefault();
    const pos = getPos(e);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
  };

  const stopDraw = () => {
    isDrawing = false;
  };

  // Eventos de Mouse
  signatureCanvas.addEventListener("mousedown", startDraw);
  signatureCanvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", stopDraw);

  // Eventos de Touch (Smartphones e Tablets)
  signatureCanvas.addEventListener("touchstart", startDraw, { passive: false });
  signatureCanvas.addEventListener("touchmove", draw, { passive: false });
  window.addEventListener("touchend", stopDraw);

  // Botão Limpar
  const clearBtn = document.getElementById("clearSignatureBtn");
  clearBtn?.addEventListener("click", () => {
    if (signatureCtx && signatureCanvas) {
      signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
    hasSigned = false;
    updateSignatureStatus(false);
  });
}

/* --------------------------------------------------------------------------
   Respostas Condicionais (Abrir campo de texto se responder "Sim")
   -------------------------------------------------------------------------- */
function initConditionalQuestions() {
  const cards = document.querySelectorAll(".question-card");
  cards.forEach((card) => {
    const radios = card.querySelectorAll('input[type="radio"]');
    const detailsWrap = card.querySelector(".conditional-input");

    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value === "Sim" && detailsWrap) {
          detailsWrap.classList.add("visible");
          detailsWrap.querySelector("input, textarea")?.focus();
        } else if (detailsWrap) {
          detailsWrap.classList.remove("visible");
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   Revisão e Coleta dos Dados
   -------------------------------------------------------------------------- */
function collectAnamneseData() {
  const form = document.getElementById("anamneseForm");
  const getVal = (id) => document.getElementById(id)?.value.trim() || "";
  const getRadioVal = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "Não informado";

  return {
    client: {
      name: getVal("anamneseName"),
      birthDate: getVal("anamneseBirthDate"),
      email: getVal("anamneseEmail"),
      phone: getVal("anamnesePhone"),
      sessionDate: getVal("anamneseSessionDate")
    },
    safety: {
      allergies: getRadioVal("qAllergies"),
      allergiesDetails: getVal("qAllergiesDetails"),
      healing: getRadioVal("qHealing"),
      healingDetails: getVal("qHealingDetails"),
      healthConditions: getRadioVal("qHealth"),
      healthDetails: getVal("qHealthDetails"),
      medications: getRadioVal("qMedications"),
      medicationsDetails: getVal("qMedicationsDetails"),
      skinConditions: getRadioVal("qSkin"),
      skinDetails: getVal("qSkinDetails"),
      fainting: getRadioVal("qFainting"),
      otherNotes: getVal("qOtherNotes")
    },
    consent: {
      truthfulInfo: document.getElementById("declTruth")?.checked || false,
      talkNeeded: document.getElementById("declTalk")?.checked || false,
      lgpdSensivel: document.getElementById("consentLgpd")?.checked || false,
      timestamp: new Date().toLocaleString("pt-BR")
    },
    signature: (hasSigned && signatureCanvas) ? signatureCanvas.toDataURL("image/png") : null
  };
}

function populateReviewData() {
  const data = collectAnamneseData();
  const reviewContainer = document.getElementById("anamneseReviewSummary");
  if (!reviewContainer) return;

  reviewContainer.innerHTML = `
    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; margin-bottom: 24px;">
      <h4 style="color: var(--color-secondary); margin-bottom: 12px;">Identificação do Cliente</h4>
      <p style="margin-bottom: 6px;"><strong>Nome:</strong> ${data.client.name}</p>
      <p style="margin-bottom: 6px;"><strong>Data de Nascimento:</strong> ${data.client.birthDate}</p>
      <p style="margin-bottom: 6px;"><strong>Contato:</strong> ${data.client.phone} | ${data.client.email}</p>
      ${data.client.sessionDate ? `<p style="margin-bottom: 6px;"><strong>Data Prevista:</strong> ${data.client.sessionDate}</p>` : ''}
    </div>
    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px;">
      <h4 style="color: var(--color-secondary); margin-bottom: 12px;">Resumo dos Fatores de Segurança</h4>
      <p style="margin-bottom: 6px;">Histórico de Alergias: <strong>${data.safety.allergies}</strong></p>
      <p style="margin-bottom: 6px;">Cicatrização / Queloides: <strong>${data.safety.healing}</strong></p>
      <p style="margin-bottom: 6px;">Condições de Saúde: <strong>${data.safety.healthConditions}</strong></p>
      <p style="margin-bottom: 6px;">Uso de Medicamentos: <strong>${data.safety.medications}</strong></p>
      <p style="margin-bottom: 6px;">Afecções na Pele: <strong>${data.safety.skinConditions}</strong></p>
    </div>
  `;
}
