/**
 * GUINKNASS 3D BODY VIEWER & ANATOMICAL RAYCASTING
 * Integração Three.js com OrbitControls, Raycasting e cálculo em centímetros reais
 */

(function () {
  const MODEL_BASE_HEIGHT_CM = 180.0;

  function init3DBodyViewer() {
    const container = document.getElementById("body3dContainer");
    if (!container) return;

    const canvasMount = document.getElementById("body3dCanvasMount");
    const loadingEl = document.getElementById("body3dLoading");
    const heightSlider = document.getElementById("clientRealHeight");
    const heightDisplay = document.getElementById("clientRealHeightDisplay");
    const regionNameEl = document.getElementById("body3dRegionName");
    const regionDescEl = document.getElementById("body3dRegionDesc");
    const regionDimsEl = document.getElementById("body3dRegionDims");
    const regionAreaEl = document.getElementById("body3dRegionArea");
    const selectedBadgeEl = document.getElementById("body3dSelectedBadge");
    const emptyStateEl = document.getElementById("body3dEmptyState");
    const filledStateEl = document.getElementById("body3dFilledState");
    const confirmBtn = document.getElementById("body3dConfirmBtn");
    const whatsappBtn = document.getElementById("body3dWhatsappBtn");

    let currentSelected = null;
    let clientHeight = heightSlider ? parseInt(heightSlider.value, 10) || 175 : 175;
    let sizePreset = "medio";

    // Three.js instances
    let scene, camera, renderer, controls, bodyMesh, markerGroup;
    let bbox = { min: { x: -53.4, y: 0.58, z: -16.3 }, max: { x: 53.4, y: 180.5, z: 20.6 } };

    // Verifica suporte a Three.js
    if (typeof THREE === "undefined") {
      console.warn("[Body3D] Three.js não carregado globalmente. Carregando dinamicamente...");
      loadThreeScripts(() => startScene());
    } else {
      startScene();
    }

    function loadThreeScripts(callback) {
      const scriptThree = document.createElement("script");
      scriptThree.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      scriptThree.onload = () => {
        const scriptOrbit = document.createElement("script");
        scriptOrbit.src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";
        scriptOrbit.onload = () => {
          const scriptGLTF = document.createElement("script");
          scriptGLTF.src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js";
          scriptGLTF.onload = callback;
          document.head.appendChild(scriptGLTF);
        };
        document.head.appendChild(scriptOrbit);
      };
      document.head.appendChild(scriptThree);
    }

    function startScene() {
      if (!canvasMount) return;

      const width = canvasMount.clientWidth || 600;
      const height = canvasMount.clientHeight || 500;

      // Cena
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0e);

      // Câmera
      camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(0, 95, 230);

      // Renderizador WebGL
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      canvasMount.replaceChildren(renderer.domElement);

      // OrbitControls
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 90, 0);
      controls.minDistance = 60;
      controls.maxDistance = 340;
      controls.maxPolarAngle = Math.PI / 2 + 0.05;
      controls.update();

      // Iluminação de Estúdio Clean Dark Mode
      const ambientLight = new THREE.AmbientLight(0x222430, 1.2);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.4);
      keyLight.position.set(60, 150, 100);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x00fcdb, 0.9);
      fillLight.position.set(-80, 100, 70);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xc5a059, 3.2);
      rimLight.position.set(0, 130, -110);
      scene.add(rimLight);

      // Grid de apoio dos pés
      const grid = new THREE.GridHelper(160, 32, 0xc5a059, 0x1f212a);
      grid.position.y = 0;
      scene.add(grid);

      // Marcador Visual 3D de Seleção
      markerGroup = new THREE.Group();
      markerGroup.visible = false;

      const ringGeo = new THREE.RingGeometry(1.6, 2.3, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc5a059,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      markerGroup.add(ringMesh);

      const centerGeo = new THREE.CircleGeometry(0.6, 24);
      const centerMat = new THREE.MeshBasicMaterial({
        color: 0x00fcdb,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const centerMesh = new THREE.Mesh(centerGeo, centerMat);
      centerMesh.position.z = 0.05;
      markerGroup.add(centerMesh);

      const pointLight = new THREE.PointLight(0xc5a059, 1.5, 30);
      pointLight.position.z = 2.0;
      markerGroup.add(pointLight);

      scene.add(markerGroup);

      // Carrega Modelo GLB
      const gltfLoader = new THREE.GLTFLoader();
      const modelPath = "Portifolio/3d/male_body.glb";

      gltfLoader.load(
        modelPath,
        (gltf) => {
          const root = gltf.scene;

          // Centralização precisa e apoio dos pés no chão Y = 0
          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());

          root.position.x = -center.x;
          root.position.y = -box.min.y;
          root.position.z = -center.z;

          box.setFromObject(root);
          bbox = box;

          // Material dark mode estilo escultura de estúdio
          root.traverse((child) => {
            if (child.isMesh) {
              bodyMesh = child;
              child.material = new THREE.MeshStandardMaterial({
                color: 0x22242c,
                roughness: 0.52,
                metalness: 0.28,
              });
            }
          });

          scene.add(root);
          if (loadingEl) loadingEl.style.display = "none";
        },
        undefined,
        (err) => {
          console.error("[Body3D] Erro ao carregar GLB:", err);
          if (loadingEl) {
            loadingEl.innerHTML = `<span style="color:#ef4444; font-size: 0.85rem;">Falha ao carregar o modelo 3D.</span>`;
          }
        }
      );

      // Raycasting ao Clicar
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let startPos = { x: 0, y: 0 };

      const onPointerDown = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startPos = { x: clientX, y: clientY };
      };

      const onPointerUp = (e) => {
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dx = Math.abs(clientX - startPos.x);
        const dy = Math.abs(clientY - startPos.y);

        if (dx > 6 || dy > 6) return; // Arraste de rotação

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        if (!bodyMesh) return;
        const intersects = raycaster.intersectObject(bodyMesh, true);

        if (intersects.length > 0) {
          const hit = intersects[0];
          const point = hit.point;
          const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
          normal.transformDirection(hit.object.matrixWorld);

          if (markerGroup) {
            markerGroup.position.copy(point).add(normal.clone().multiplyScalar(0.4));
            markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
            markerGroup.visible = true;
          }

          const raw = identifyAnatomy(point, bbox);
          currentSelected = updateCalculations(raw);
          updateUI(currentSelected);
        }
      };

      const domEl = renderer.domElement;
      domEl.addEventListener("mousedown", onPointerDown);
      domEl.addEventListener("mouseup", onPointerUp);
      domEl.addEventListener("touchstart", onPointerDown, { passive: true });
      domEl.addEventListener("touchend", onPointerUp);

      // Resize
      window.addEventListener("resize", () => {
        if (!canvasMount || !renderer || !camera) return;
        const w = canvasMount.clientWidth;
        const h = canvasMount.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });

      // Render Loop
      let clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        if (markerGroup && markerGroup.visible) {
          const pulse = 1 + Math.sin(elapsed * 5.0) * 0.09;
          markerGroup.scale.set(pulse, pulse, pulse);
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Botões de Câmera Rápida
      document.querySelectorAll("[data-cam-view]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const view = btn.getAttribute("data-cam-view");
          setCameraView(view);
        });
      });
    }

    function setCameraView(view) {
      if (!camera || !controls) return;
      controls.target.set(0, 90, 0);

      switch (view) {
        case "front":
          camera.position.set(0, 95, 220);
          break;
        case "back":
          camera.position.set(0, 95, -220);
          break;
        case "left":
          camera.position.set(220, 95, 0);
          break;
        case "right":
          camera.position.set(-220, 95, 0);
          break;
        case "reset":
          camera.position.set(0, 95, 230);
          break;
      }
      controls.update();
    }

    function identifyAnatomy(point, box) {
      const height = box.max.y - box.min.y;
      const yNorm = (point.y - box.min.y) / (height || 1);
      const x = point.x;
      const z = point.z;
      const absX = Math.abs(x);
      const isFront = z > 0;
      const isLeft = x > 0;
      const side = absX < 3.5 ? "Central" : isLeft ? "Esquerdo" : "Direito";
      const sideFem = absX < 3.5 ? "Central" : isLeft ? "Esquerda" : "Direita";
      const sideSuffix = side === "Central" ? "" : ` ${side}`;
      const sideSuffixFem = side === "Central" ? "" : ` ${sideFem}`;
      const view = isFront ? "Frente" : "Costas";

      if (yNorm > 0.91) {
        return {
          name: isFront ? "Rosto / Cabeça" : "Nuca / Cabeça Posterior",
          category: "Cabeça",
          view,
          baseWidth: 14,
          baseHeight: 16,
          desc: "Área de alta visibilidade e acabamento refinado para traços precisos.",
        };
      }
      if (yNorm > 0.84) {
        return {
          name: isFront ? "Garganta / Pescoço Anterior" : `Pescoço / Trapézio${sideSuffix}`,
          category: "Pescoço",
          view,
          baseWidth: 12,
          baseHeight: 10,
          desc: "Região com curvatura anatômica delicada e contornos elegantes.",
        };
      }

      const isArmZone = yNorm >= 0.38 && yNorm <= 0.84 && absX > 16.5;
      if (isArmZone) {
        if (yNorm >= 0.72) {
          return {
            name: `Ombro / Deltoide${sideSuffix} (${view})`,
            category: "Ombro",
            view,
            baseWidth: 15,
            baseHeight: 14,
            desc: "Área arredondada nobre, ideal para mandalas, brasões e peças circulares.",
          };
        }
        if (yNorm >= 0.58) {
          const muscle = isFront ? "Bíceps" : "Tríceps";
          return {
            name: `Braço Superior (${muscle})${sideSuffix}`,
            category: "Braço",
            view,
            baseWidth: 18,
            baseHeight: 15,
            desc: "Plano muscular amplo, excelente para fechamento de meia manga.",
          };
        }
        if (yNorm >= 0.46) {
          return {
            name: `Antebraço${sideSuffix} (${view})`,
            category: "Antebraço",
            view,
            baseWidth: 18,
            baseHeight: 9,
            desc: "A tela mais clássica e visível do corpo, perfeita para composições verticais.",
          };
        }
        return {
          name: `Punho & Mão${sideSuffixFem} (${view})`,
          category: "Mão",
          view,
          baseWidth: 10,
          baseHeight: 8,
          desc: "Área com forte presença e impacto visual, ideal para micro-detalhes.",
        };
      }

      if (yNorm >= 0.7) {
        if (isFront) {
          return {
            name: `Peitoral${sideSuffix} (Tórax)`,
            category: "Peitoral",
            view,
            baseWidth: 20,
            baseHeight: 16,
            desc: "Plano muscular forte, ideal para arte de grande impacto e composições centrais.",
          };
        }
        return {
          name: `Costas Superior / Escápula${sideSuffix}`,
          category: "Costas",
          view,
          baseWidth: 32,
          baseHeight: 22,
          desc: "Área nobre e ampla para grandes narrativas visuais e painéis detalhados.",
        };
      }

      if (yNorm >= 0.56) {
        if (isFront) {
          return {
            name: `Abdômen / Costelas${sideSuffixFem}`,
            category: "Abdômen",
            view,
            baseWidth: 22,
            baseHeight: 16,
            desc: "Curvatura dinâmica das costelas com fluxo anatômico expressivo.",
          };
        }
        return {
          name: `Costas Inferior / Lombar${sideSuffixFem}`,
          category: "Lombar",
          view,
          baseWidth: 26,
          baseHeight: 18,
          desc: "Região anatômica plana que harmoniza composições com o fechamento dorsal.",
        };
      }

      if (yNorm >= 0.46) {
        if (isFront) {
          return {
            name: `Quadril / Pélvis${sideSuffix}`,
            category: "Quadril",
            view,
            baseWidth: 18,
            baseHeight: 12,
            desc: "Linhas anatômicas com fluxo diagonal refinado.",
          };
        }
        return {
          name: `Glúteo${sideSuffix}`,
          category: "Glúteo",
          view,
          baseWidth: 20,
          baseHeight: 18,
          desc: "Superfície contínua e espaçosa.",
        };
      }

      if (yNorm >= 0.32) {
        const aspect = isFront ? "Anterior" : "Posterior";
        return {
          name: `Coxa${sideSuffixFem} (${aspect})`,
          category: "Coxa",
          view,
          baseWidth: 28,
          baseHeight: 18,
          desc: "Uma das maiores telas musculares do corpo humano para painéis completos.",
        };
      }

      if (yNorm >= 0.26) {
        return {
          name: `Joelho${sideSuffix} (${view})`,
          category: "Joelho",
          view,
          baseWidth: 14,
          baseHeight: 14,
          desc: "Ponto de articulação central com forte dinamismo geométrico.",
        };
      }

      if (yNorm >= 0.08) {
        if (isFront) {
          return {
            name: `Canela / Tíbia${sideSuffixFem}`,
            category: "Canela",
            view,
            baseWidth: 24,
            baseHeight: 12,
            desc: "Plano vertical frontal excelente para motivos botânicos, animais ou armas estilizadas.",
          };
        }
        return {
          name: `Panturrilha${sideSuffixFem}`,
          category: "Panturrilha",
          view,
          baseWidth: 24,
          baseHeight: 15,
          desc: "Volume muscular curvo que confere profundidade impressionante à tatuagem.",
        };
      }

      return {
        name: `Tornozelo & Pé${sideSuffix} (${view})`,
        category: "Pé",
        view,
        baseWidth: 14,
        baseHeight: 9,
        desc: "Região compacta e expressiva para símbolos, caligrafia fina e detalhes autorais.",
      };
    }

    function updateCalculations(raw) {
      const scaleFactor = (clientHeight || 175) / MODEL_BASE_HEIGHT_CM;
      const multiplier = sizePreset === "pequeno" ? 0.65 : sizePreset === "grande" ? 1.45 : 1.0;
      const realWidth = Math.max(3, Math.round(raw.baseWidth * scaleFactor * multiplier));
      const realHeight = Math.max(3, Math.round(raw.baseHeight * scaleFactor * multiplier));
      const areaCm2 = Math.round(realWidth * realHeight);

      return {
        ...raw,
        realWidth,
        realHeight,
        areaCm2,
      };
    }

    function updateUI(data) {
      if (!data) return;

      if (emptyStateEl) emptyStateEl.style.display = "none";
      if (filledStateEl) filledStateEl.style.display = "block";

      if (regionNameEl) regionNameEl.textContent = data.name;
      if (regionDescEl) regionDescEl.textContent = data.desc;
      if (selectedBadgeEl) selectedBadgeEl.textContent = `${data.category} • ${data.view}`;
      if (regionDimsEl) regionDimsEl.textContent = `${data.realWidth} x ${data.realHeight} cm`;
      if (regionAreaEl) regionAreaEl.textContent = `~${data.areaCm2} cm²`;

      if (confirmBtn) {
        confirmBtn.removeAttribute("disabled");
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor = "pointer";
      }

      if (whatsappBtn) {
        whatsappBtn.style.display = "flex";
        const msg = `Olá GuinkNass! Gostaria de um orçamento para uma tatuagem no(a) ${data.name}, tamanho estimado de ${data.realWidth} x ${data.realHeight} cm (~${data.areaCm2} cm²). Minha altura é ${clientHeight} cm.`;
        whatsappBtn.href = `https://wa.me/5511995802338?text=${encodeURIComponent(msg)}`;
      }
    }

    // Listener para Slider de Altura
    if (heightSlider) {
      heightSlider.addEventListener("input", (e) => {
        clientHeight = parseInt(e.target.value, 10) || 175;
        if (heightDisplay) heightDisplay.textContent = `${clientHeight} cm`;
        if (currentSelected) {
          currentSelected = updateCalculations(currentSelected);
          updateUI(currentSelected);
        }
      });
    }

    // Listener para Botões de Preset de Porte
    document.querySelectorAll("[data-size-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-size-preset]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        sizePreset = btn.getAttribute("data-size-preset");
        if (currentSelected) {
          currentSelected = updateCalculations(currentSelected);
          updateUI(currentSelected);
        }
      });
    });

    // Listener para Botão Confirmar Local
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (!currentSelected) return;

        const locInput = document.getElementById("tattooLocation");
        const sizeInput = document.getElementById("tattooSize");

        if (locInput) locInput.value = currentSelected.name;
        if (sizeInput) {
          sizeInput.value = `${currentSelected.realWidth} cm x ${currentSelected.realHeight} cm (~${currentSelected.areaCm2} cm²)`;
        }

        // Scroll suave até o formulário
        if (locInput) {
          locInput.scrollIntoView({ behavior: "smooth", block: "center" });
          locInput.focus();
        }

        // Feedback visual
        const toast = document.createElement("div");
        toast.className = "budget-3d-toast";
        toast.textContent = `✓ Local definido: ${currentSelected.name} (${currentSelected.realWidth}x${currentSelected.realHeight} cm)`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      });
    }

    // Trata parâmetros de URL (?local=...&tamanho=...) se vindo de simulador externo
    const urlParams = new URLSearchParams(window.location.search);
    const paramLocal = urlParams.get("local");
    const paramTamanho = urlParams.get("tamanho");
    if (paramLocal) {
      const locInput = document.getElementById("tattooLocation");
      if (locInput) locInput.value = decodeURIComponent(paramLocal);
    }
    if (paramTamanho) {
      const sizeInput = document.getElementById("tattooSize");
      if (sizeInput) sizeInput.value = decodeURIComponent(paramTamanho);
    }
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DBodyViewer);
  } else {
    init3DBodyViewer();
  }
})();
