/**
 * GUINKNASS 3D BODY VIEWER & ANATOMICAL RAYCASTING
 * Integração Three.js com OrbitControls, Raycasting e cálculo em centímetros reais
 * Paleta: Dourado (#C5A059, #DFC17B) e Âmbar Quente (#F59E0B)
 */

(function () {
  const MODEL_BASE_HEIGHT_CM = 180.0;

  // Dicionário de regiões anatômicas pré-definidas para atalhos rápidos e cálculo
  const REGION_PRESETS = {
    antebraco: {
      name: "Antebraço Esquerdo (Frente)",
      category: "Antebraço",
      view: "Frente",
      baseWidth: 18,
      baseHeight: 9,
      desc: "A tela mais clássica e visível do corpo, perfeita para composições verticais.",
      camPos: { x: 80, y: 85, z: 120 },
      markerPos: { x: 26, y: 88, z: 4 },
      normal: { x: 0.6, y: 0.1, z: 0.8 },
    },
    antebraço: {
      name: "Antebraço Esquerdo (Frente)",
      category: "Antebraço",
      view: "Frente",
      baseWidth: 18,
      baseHeight: 9,
      desc: "A tela mais clássica e visível do corpo, perfeita para composições verticais.",
      camPos: { x: 80, y: 85, z: 120 },
      markerPos: { x: 26, y: 88, z: 4 },
      normal: { x: 0.6, y: 0.1, z: 0.8 },
    },
    braco: {
      name: "Braço Superior (Bíceps) Esquerdo",
      category: "Braço",
      view: "Frente",
      baseWidth: 18,
      baseHeight: 15,
      desc: "Plano muscular amplo, excelente para fechamento de meia manga.",
      camPos: { x: 100, y: 110, z: 100 },
      markerPos: { x: 22, y: 118, z: 2 },
      normal: { x: 0.8, y: 0.1, z: 0.5 },
    },
    braço: {
      name: "Braço Superior (Bíceps) Esquerdo",
      category: "Braço",
      view: "Frente",
      baseWidth: 18,
      baseHeight: 15,
      desc: "Plano muscular amplo, excelente para fechamento de meia manga.",
      camPos: { x: 100, y: 110, z: 100 },
      markerPos: { x: 22, y: 118, z: 2 },
      normal: { x: 0.8, y: 0.1, z: 0.5 },
    },
    peitoral: {
      name: "Peitoral Esquerdo (Tórax)",
      category: "Peitoral",
      view: "Frente",
      baseWidth: 20,
      baseHeight: 16,
      desc: "Plano muscular forte, ideal para arte de grande impacto e composições centrais.",
      camPos: { x: 0, y: 130, z: 140 },
      markerPos: { x: 9, y: 132, z: 11 },
      normal: { x: 0.2, y: 0.1, z: 0.95 },
    },
    costas: {
      name: "Costas Superior / Escápula",
      category: "Costas",
      view: "Costas",
      baseWidth: 32,
      baseHeight: 22,
      desc: "Área nobre e ampla para painéis autorais completos e texturas ricas.",
      camPos: { x: 0, y: 130, z: -160 },
      markerPos: { x: 0, y: 132, z: -10 },
      normal: { x: 0, y: 0.1, z: -0.98 },
    },
    coxa: {
      name: "Coxa Direita (Anterior)",
      category: "Coxa",
      view: "Frente",
      baseWidth: 28,
      baseHeight: 18,
      desc: "Uma das maiores telas musculares do corpo humano para painéis completos.",
      camPos: { x: -60, y: 65, z: 130 },
      markerPos: { x: -11, y: 66, z: 10 },
      normal: { x: -0.3, y: 0.1, z: 0.94 },
    },
    panturrilha: {
      name: "Panturrilha Esquerda (Posterior)",
      category: "Panturrilha",
      view: "Costas",
      baseWidth: 24,
      baseHeight: 15,
      desc: "Volume muscular curvo que confere profundidade impressionante à tatuagem.",
      camPos: { x: 50, y: 35, z: -120 },
      markerPos: { x: 10, y: 36, z: -8 },
      normal: { x: 0.2, y: 0.1, z: -0.95 },
    },
  };

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

    let scene, camera, renderer, controls, modelRoot, markerGroup;
    let bbox = { min: { x: -53.4, y: 0.58, z: -16.3 }, max: { x: 53.4, y: 180.5, z: 20.6 } };

    function checkThreeReady(callback, attempts = 0) {
      if (
        typeof THREE !== "undefined" &&
        typeof THREE.OrbitControls !== "undefined" &&
        typeof THREE.GLTFLoader !== "undefined"
      ) {
        callback();
      } else if (attempts < 80) {
        setTimeout(() => checkThreeReady(callback, attempts + 1), 60);
      } else if (typeof THREE === "undefined") {
        loadThreeScripts(callback);
      }
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

    checkThreeReady(() => startScene());

    function startScene() {
      if (!canvasMount) return;

      const width = canvasMount.clientWidth || 600;
      const height = canvasMount.clientHeight || 500;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0e);

      camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(0, 95, 230);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      canvasMount.replaceChildren(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 90, 0);
      controls.minDistance = 60;
      controls.maxDistance = 340;
      controls.maxPolarAngle = Math.PI / 2 + 0.05;
      controls.update();

      // Iluminação de Estúdio Dourada / Âmbar Quente
      const ambientLight = new THREE.AmbientLight(0x222430, 1.3);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff6ea, 2.4);
      keyLight.position.set(60, 150, 100);
      scene.add(keyLight);

      // Luz de preenchimento âmbar suave (paleta GuinkNass)
      const fillLight = new THREE.DirectionalLight(0xf59e0b, 0.8);
      fillLight.position.set(-80, 100, 70);
      scene.add(fillLight);

      // Luz de recorte dourada
      const rimLight = new THREE.DirectionalLight(0xc5a059, 3.2);
      rimLight.position.set(0, 130, -110);
      scene.add(rimLight);

      const grid = new THREE.GridHelper(160, 32, 0xc5a059, 0x1f212a);
      grid.position.y = 0;
      scene.add(grid);

      // Marcador Visual 3D Dourado/Âmbar
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

      const centerGeo = new THREE.CircleGeometry(0.65, 24);
      const centerMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const centerMesh = new THREE.Mesh(centerGeo, centerMat);
      centerMesh.position.z = 0.05;
      markerGroup.add(centerMesh);

      const pointLight = new THREE.PointLight(0xf59e0b, 2.0, 35);
      pointLight.position.z = 2.0;
      markerGroup.add(pointLight);

      scene.add(markerGroup);

      // Carregamento do GLB com fallback de caminhos
      const gltfLoader = new THREE.GLTFLoader();
      const modelPaths = [
        "Portifolio/3d/male_body.glb",
        "/Portifolio/3d/male_body.glb",
        "portfolio/3d/male_body.glb",
        "/portfolio/3d/male_body.glb",
      ];

      function tryLoadModel(index) {
        if (index >= modelPaths.length) {
          if (loadingEl) {
            loadingEl.innerHTML = `<span style="color:#ef4444; font-size: 0.85rem;">Falha ao carregar modelo 3D.</span>`;
          }
          return;
        }

        gltfLoader.load(
          modelPaths[index],
          (gltf) => {
            const root = gltf.scene;
            modelRoot = root;

            const box = new THREE.Box3().setFromObject(root);
            const center = box.getCenter(new THREE.Vector3());

            root.position.x = -center.x;
            root.position.y = -box.min.y;
            root.position.z = -center.z;
            root.updateMatrixWorld(true);

            box.setFromObject(root);
            bbox = box;

            root.traverse((child) => {
              if (child.isMesh) {
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
          () => {
            tryLoadModel(index + 1);
          }
        );
      }

      tryLoadModel(0);

      // Raycasting ao Clicar (Com tolerância suave para cliques reais em desktop e mobile)
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let downPos = { x: 0, y: 0 };
      let downTime = 0;

      const onPointerDown = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        downPos = { x: clientX, y: clientY };
        downTime = Date.now();
      };

      const onPointerUp = (e) => {
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dist = Math.hypot(clientX - downPos.x, clientY - downPos.y);
        const duration = Date.now() - downTime;

        // Se moveu mais de 16px ou demorou mais de 650ms, foi arraste/órbita da câmera
        if (dist > 16 || duration > 650) return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        if (!modelRoot) return;
        const intersects = raycaster.intersectObject(modelRoot, true);

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

          try {
            const raw = identifyAnatomy(point, bbox);
            currentSelected = updateCalculations(raw);
            updateUI(currentSelected);
          } catch (err) {
            console.error("[3D Raycasting Error]", err);
          }
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

      // Atalhos Rápidos de Região (Chips com suporte seguro a normalização e acentos)
      document.querySelectorAll("[data-quick-region]").forEach((chip) => {
        chip.addEventListener("click", () => {
          const rawKey = (chip.getAttribute("data-quick-region") || "").toLowerCase().trim();
          const normalizedKey = rawKey.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const preset = REGION_PRESETS[rawKey] || REGION_PRESETS[normalizedKey];
          if (!preset) return;

          // Anima marcador para a posição pré-definida
          if (markerGroup) {
            markerGroup.position.set(preset.markerPos.x, preset.markerPos.y, preset.markerPos.z);
            const n = new THREE.Vector3(preset.normal.x, preset.normal.y, preset.normal.z);
            markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
            markerGroup.visible = true;
          }

          // Move câmera
          if (camera && controls) {
            camera.position.set(preset.camPos.x, preset.camPos.y, preset.camPos.z);
            controls.target.set(0, preset.markerPos.y, 0);
            controls.update();
          }

          currentSelected = updateCalculations(preset);
          updateUI(currentSelected);
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

      const isArmZone = yNorm >= 0.38 && yNorm <= 0.84 && absX > 16.0;
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
      if (!raw) return null;
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

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (!currentSelected) return;

        const locInput = document.getElementById("tattooLocation");
        const sizeInput = document.getElementById("tattooSize");

        if (locInput) {
          locInput.value = currentSelected.name;
          locInput.dispatchEvent(new Event("input", { bubbles: true }));
          locInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (sizeInput) {
          sizeInput.value = `${currentSelected.realWidth} cm x ${currentSelected.realHeight} cm (~${currentSelected.areaCm2} cm²)`;
          sizeInput.dispatchEvent(new Event("input", { bubbles: true }));
          sizeInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (locInput) {
          locInput.scrollIntoView({ behavior: "smooth", block: "center" });
          locInput.focus();
        }

        const toast = document.createElement("div");
        toast.className = "budget-3d-toast";
        toast.textContent = `✓ Local definido: ${currentSelected.name} (${currentSelected.realWidth}x${currentSelected.realHeight} cm)`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      });
    }

    // Suporte a mensagens do simulador tela cheia ou parâmetros de URL
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "GUINKNASS_3D_SELECT") {
        const item = event.data.data;
        if (!item) return;
        const locInput = document.getElementById("tattooLocation");
        const sizeInput = document.getElementById("tattooSize");
        if (locInput) {
          locInput.value = item.name;
          locInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (sizeInput) {
          sizeInput.value = `${item.realWidth} cm x ${item.realHeight} cm (~${item.areaCm2} cm²)`;
          sizeInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    });

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DBodyViewer);
  } else {
    init3DBodyViewer();
  }
})();
