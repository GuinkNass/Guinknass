"use client";

import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface SelectedAnatomyData {
  name: string;
  category: string;
  side: "Esquerdo" | "Direito" | "Central";
  view: "Frente" | "Costas";
  baseWidth: number;
  baseHeight: number;
  description: string;
  realWidth: number;
  realHeight: number;
  areaCm2: number;
  point: { x: number; y: number; z: number };
}

export interface BodyModelViewerProps {
  modelPath?: string;
  defaultHeightCm?: number;
  onSelectRegion?: (data: SelectedAnatomyData) => void;
  className?: string;
  showSidebar?: boolean;
}

// Altura de referência do modelo GLB original em centímetros (~180 cm)
const MODEL_BASE_HEIGHT_CM = 180.0;

// Função pura de identificação anatômica (não recria instâncias)
function identifyAnatomy(
  point: { x: number; y: number; z: number },
  bbox: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } }
): Omit<SelectedAnatomyData, "realWidth" | "realHeight" | "areaCm2"> {
  const height = bbox.max.y - bbox.min.y;
  const yNorm = (point.y - bbox.min.y) / (height || 1);
  const x = point.x;
  const z = point.z;
  const absX = Math.abs(x);
  const isFront = z > 0;
  const isLeft = x > 0; // X positivo no modelo é o lado esquerdo anatômico
  const side = absX < 3.5 ? "Central" : isLeft ? "Esquerdo" : "Direito";
  const sideFem = absX < 3.5 ? "Central" : isLeft ? "Esquerda" : "Direita";
  const sideSuffix = side === "Central" ? "" : ` ${side}`;
  const sideSuffixFem = side === "Central" ? "" : ` ${sideFem}`;
  const view = isFront ? "Frente" : "Costas";

  // 1. Cabeça (Y > 91%)
  if (yNorm > 0.91) {
    return {
      name: isFront ? "Rosto / Cabeça" : "Nuca / Crânio Posterior",
      category: "Cabeça",
      side,
      view,
      baseWidth: 14,
      baseHeight: 16,
      description: "Área de alta visibilidade e acabamento refinado para traços precisos.",
      point,
    };
  }

  // 2. Pescoço & Trapézio (84% < Y <= 91%)
  if (yNorm > 0.84) {
    return {
      name: isFront ? "Garganta / Pescoço Anterior" : `Pescoço / Trapézio${sideSuffix}`,
      category: "Pescoço",
      side,
      view,
      baseWidth: 12,
      baseHeight: 10,
      description: "Região com curvatura anatômica delicada e contornos elegantes.",
      point,
    };
  }

  // 3. Membros Superiores (Braços, Antebraços e Mãos) quando |X| está fora do tronco
  const isArmZone = yNorm >= 0.38 && yNorm <= 0.84 && absX > 16.0;
  if (isArmZone) {
    if (yNorm >= 0.72) {
      return {
        name: `Ombro / Deltoide${sideSuffix} (${view})`,
        category: "Ombro",
        side,
        view,
        baseWidth: 15,
        baseHeight: 14,
        description: "Área arredondada nobre, ideal para mandalas, brasões e peças circulares.",
        point,
      };
    }
    if (yNorm >= 0.58) {
      const muscle = isFront ? "Bíceps" : "Tríceps";
      return {
        name: `Braço Superior (${muscle})${sideSuffix}`,
        category: "Braço",
        side,
        view,
        baseWidth: 18,
        baseHeight: 15,
        description: "Plano muscular amplo, excelente para fechamento de meia manga.",
        point,
      };
    }
    if (yNorm >= 0.46) {
      return {
        name: `Antebraço${sideSuffix} (${view})`,
        category: "Antebraço",
        side,
        view,
        baseWidth: 18,
        baseHeight: 9,
        description: "A tela mais clássica e visível do corpo, perfeita para composições verticais.",
        point,
      };
    }
    return {
      name: `Punho & Mão${sideSuffixFem} (${view})`,
      category: "Mão",
      side,
      view,
      baseWidth: 10,
      baseHeight: 8,
      description: "Área com forte presença e impacto visual, ideal para micro-detalhes.",
      point,
    };
  }

  // 4. Tronco Superior (Peitoral & Costas Superior) (70% < Y <= 84%)
  if (yNorm >= 0.7) {
    if (isFront) {
      return {
        name: `Peitoral${sideSuffix} (Tórax)`,
        category: "Peitoral",
        side,
        view,
        baseWidth: 20,
        baseHeight: 16,
        description: "Plano muscular forte, ideal para arte de grande impacto e composições centrais.",
        point,
      };
    }
    return {
      name: `Costas Superior / Escápula${sideSuffix}`,
      category: "Costas",
      side,
      view,
      baseWidth: 32,
      baseHeight: 22,
      description: "Área nobre e ampla para painéis autorais completos e texturas ricas.",
      point,
    };
  }

  // 5. Tronco Médio (Abdômen & Lombar) (56% < Y < 70%)
  if (yNorm >= 0.56) {
    if (isFront) {
      return {
        name: `Abdômen / Costelas${sideSuffixFem}`,
        category: "Abdômen",
        side,
        view,
        baseWidth: 22,
        baseHeight: 16,
        description: "Curvatura dinâmica das costelas com fluxo anatômico expressivo.",
        point,
      };
    }
    return {
      name: `Costas Inferior / Lombar${sideSuffixFem}`,
      category: "Lombar",
      side,
      view,
      baseWidth: 26,
      baseHeight: 18,
      description: "Região anatômica plana que harmoniza composições com o fechamento dorsal.",
      point,
    };
  }

  // 6. Quadril / Pélvis / Glúteos (46% < Y < 56%)
  if (yNorm >= 0.46) {
    if (isFront) {
      return {
        name: `Quadril / Pélvis${sideSuffix}`,
        category: "Quadril",
        side,
        view,
        baseWidth: 18,
        baseHeight: 12,
        description: "Linhas anatômicas com fluxo diagonal refinado.",
        point,
      };
    }
    return {
      name: `Glúteo${sideSuffix}`,
      category: "Glúteo",
      side,
      view,
      baseWidth: 20,
      baseHeight: 18,
      description: "Superfície contínua e espaçosa.",
      point,
    };
  }

  // 7. Membros Inferiores: Coxas (32% < Y < 46%)
  if (yNorm >= 0.32) {
    const aspect = isFront ? "Anterior" : "Posterior";
    return {
      name: `Coxa${sideSuffixFem} (${aspect})`,
      category: "Coxa",
      side,
      view,
      baseWidth: 28,
      baseHeight: 18,
      description: "Uma das maiores telas musculares do corpo humano para painéis completos.",
      point,
    };
  }

  // 8. Joelho (26% < Y < 32%)
  if (yNorm >= 0.26) {
    return {
      name: `Joelho${sideSuffix} (${view})`,
      category: "Joelho",
      side,
      view,
      baseWidth: 14,
      baseHeight: 14,
      description: "Ponto de articulação central com forte dinamismo geométrico.",
      point,
    };
  }

  // 9. Canela & Panturrilha (8% < Y < 26%)
  if (yNorm >= 0.08) {
    if (isFront) {
      return {
        name: `Canela / Tíbia${sideSuffixFem}`,
        category: "Canela",
        side,
        view,
        baseWidth: 24,
        baseHeight: 12,
        description: "Plano vertical frontal excelente para motivos botânicos, animais ou armas estilizadas.",
        point,
      };
    }
    return {
      name: `Panturrilha${sideSuffixFem}`,
      category: "Panturrilha",
      side,
      view,
      baseWidth: 24,
      baseHeight: 15,
      description: "Área volumétrica curva que confere profundidade impressionante à tatuagem.",
      point,
    };
  }

  // 10. Tornozelo & Pé (Y <= 8%)
  return {
    name: `Tornozelo & Pé${sideSuffix} (${view})`,
    category: "Pé",
    side,
    view,
    baseWidth: 14,
    baseHeight: 9,
    description: "Região compacta e expressiva para símbolos, caligrafia fina e detalhes autorais.",
    point,
  };
}

function calculateDimensions(
  raw: Omit<SelectedAnatomyData, "realWidth" | "realHeight" | "areaCm2">,
  heightCm: number,
  preset: "pequeno" | "medio" | "grande"
): SelectedAnatomyData {
  const scaleFactor = (heightCm || 175) / MODEL_BASE_HEIGHT_CM;
  const multiplier = preset === "pequeno" ? 0.65 : preset === "grande" ? 1.45 : 1.0;
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

export default function BodyModelViewer({
  modelPath = "/Portifolio/3d/male_body.glb",
  defaultHeightCm = 175,
  onSelectRegion,
  className = "",
  showSidebar = true,
}: BodyModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clientHeight, setClientHeight] = useState<number>(defaultHeightCm);
  const [sizePreset, setSizePreset] = useState<"pequeno" | "medio" | "grande">("medio");
  const [selectedRegion, setSelectedRegion] = useState<SelectedAnatomyData | null>(null);

  // Armazena valores voláteis em refs para evitar re-criação da cena WebGL
  const clientHeightRef = useRef<number>(clientHeight);
  clientHeightRef.current = clientHeight;

  const sizePresetRef = useRef<"pequeno" | "medio" | "grande">(sizePreset);
  sizePresetRef.current = sizePreset;

  const onSelectRegionRef = useRef(onSelectRegion);
  onSelectRegionRef.current = onSelectRegion;

  const selectedRegionRef = useRef<SelectedAnatomyData | null>(selectedRegion);
  selectedRegionRef.current = selectedRegion;

  // Instâncias Three.js
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const modelRootRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const bboxRef = useRef({ min: { x: -53.4, y: 0.58, z: -16.3 }, max: { x: 53.4, y: 180.5, z: 20.6 } });

  // Trata atualização de tamanho e altura sem recriar o Three.js
  const handleHeightOrPresetChange = (newHeight: number, newPreset: "pequeno" | "medio" | "grande") => {
    if (selectedRegionRef.current) {
      const updated = calculateDimensions(selectedRegionRef.current, newHeight, newPreset);
      setSelectedRegion(updated);
      if (onSelectRegionRef.current) onSelectRegionRef.current(updated);
    }
  };

  // Inicializa a cena Three.js APENAS UMA VEZ no mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;

    // 1. Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0e);

    // 2. Câmera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 95, 230);

    // 3. Renderizador WebGL
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.replaceChildren(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 90, 0);
    controls.minDistance = 60;
    controls.maxDistance = 340;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.update();

    // 5. Luzes de Estúdio Clean Dark Mode
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

    // 6. Grid
    const grid = new THREE.GridHelper(160, 32, 0xc5a059, 0x1f212a);
    grid.position.y = 0;
    scene.add(grid);

    // 7. Marcador Visual 3D de Seleção
    const markerGroup = new THREE.Group();
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
    markerRef.current = markerGroup;

    // 8. Carregamento do GLB
    const loader = new GLTFLoader();
    setLoading(true);
    setLoadError(null);

    loader.load(
      modelPath,
      (gltf: any) => {
        if (isDisposed) return;
        const root = gltf.scene;
        modelRootRef.current = root;

        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());

        root.position.x = -center.x;
        root.position.y = -box.min.y;
        root.position.z = -center.z;

        box.setFromObject(root);
        bboxRef.current = {
          min: { x: box.min.x, y: box.min.y, z: box.min.z },
          max: { x: box.max.x, y: box.max.y, z: box.max.z },
        };

        root.traverse((child: any) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x22242c,
              roughness: 0.52,
              metalness: 0.28,
            });
          }
        });

        scene.add(root);
        setLoading(false);
      },
      undefined,
      (err: any) => {
        if (isDisposed) return;
        console.error("[BodyModelViewer] Erro ao carregar GLB:", err);
        setLoadError("Não foi possível carregar o modelo 3D.");
        setLoading(false);
      }
    );

    // 9. Raycasting ao Clicar (Suporte Seguro a Desktop e Touch)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };
    let downTime = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      downPos = { x: clientX, y: clientY };
      downTime = Date.now();
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;
      const dist = Math.hypot(clientX - downPos.x, clientY - downPos.y);
      const duration = Date.now() - downTime;

      // Distingue rotação/arraste (se moveu > 10px ou demorou > 400ms, é navegação)
      if (dist > 10 || duration > 400) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (!modelRootRef.current) return;
      const intersects = raycaster.intersectObject(modelRootRef.current, true);

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

        const raw = identifyAnatomy({ x: point.x, y: point.y, z: point.z }, bboxRef.current);
        const fullData = calculateDimensions(raw, clientHeightRef.current, sizePresetRef.current);

        setSelectedRegion(fullData);
        if (onSelectRegionRef.current) onSelectRegionRef.current(fullData);
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onPointerDown);
    domEl.addEventListener("mouseup", onPointerUp);
    domEl.addEventListener("touchstart", onPointerDown, { passive: true });
    domEl.addEventListener("touchend", onPointerUp);

    // 10. Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // 11. Loop 60FPS
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (markerGroup && markerGroup.visible) {
        const pulse = 1 + Math.sin(elapsed * 5.0) * 0.09;
        markerGroup.scale.set(pulse, pulse, pulse);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      domEl.removeEventListener("mousedown", onPointerDown);
      domEl.removeEventListener("mouseup", onPointerUp);
      domEl.removeEventListener("touchstart", onPointerDown);
      domEl.removeEventListener("touchend", onPointerUp);
      renderer.dispose();
      container.replaceChildren();
    };
  }, [modelPath]);

  // Controles de Câmera
  const setCameraView = (view: "front" | "back" | "left" | "right" | "reset") => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
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
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d12] shadow-2xl flex flex-col lg:flex-row ${className}`}
      style={{ minHeight: "560px" }}
    >
      {/* Visualizador 3D */}
      <div className="relative flex-1 w-full h-[480px] lg:h-auto min-h-[460px] bg-gradient-to-b from-[#0a0a0e] via-[#0d0e14] to-[#07070a]">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {loading && (
          <div className="absolute inset-0 bg-[#0a0a0e]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
            <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-[#C5A059] tracking-wider uppercase">
              Carregando Anatomia 3D...
            </span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 bg-[#0a0a0e]/95 flex flex-col items-center justify-center p-6 text-center z-20">
            <span className="text-red-400 text-sm mb-2">⚠️ {loadError}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs bg-[#C5A059] text-black font-bold rounded-lg cursor-pointer"
            >
              Recarregar
            </button>
          </div>
        )}

        {/* Instrução Superior */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/80 pointer-events-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FCDB] animate-pulse" />
            <span>Gire 360° e clique para marcar o local</span>
          </div>

          <button
            type="button"
            onClick={() => setCameraView("reset")}
            className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white/70 hover:text-white rounded-full px-3 py-1.5 text-xs transition pointer-events-auto cursor-pointer"
            title="Resetar Vista"
          >
            ⟲ Reset
          </button>
        </div>

        {/* Atalhos de Câmera */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10 bg-black/65 backdrop-blur-md border border-white/10 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setCameraView("front")}
            className="px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:text-[#C5A059] hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setCameraView("back")}
            className="px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:text-[#C5A059] hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            Costas
          </button>
          <button
            type="button"
            onClick={() => setCameraView("left")}
            className="px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:text-[#C5A059] hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            Lado Esq
          </button>
          <button
            type="button"
            onClick={() => setCameraView("right")}
            className="px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:text-[#C5A059] hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            Lado Dir
          </button>
        </div>
      </div>

      {/* Painel Lateral */}
      {showSidebar && (
        <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#121319] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest">
                  Anatomia Interativa 3D
                </span>
                <h3 className="text-base font-bold text-white">Local da Tatuagem</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#00FCDB]/10 text-[#00FCDB] border border-[#00FCDB]/30 font-mono">
                Raycasting
              </span>
            </div>

            {/* Input de Altura */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80">Sua Altura Real</label>
                <span className="text-xs text-[#C5A059] font-mono font-bold">{clientHeight} cm</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="145"
                  max="210"
                  step="1"
                  value={clientHeight}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    setClientHeight(h);
                    handleHeightOrPresetChange(h, sizePreset);
                  }}
                  className="w-full accent-[#C5A059] cursor-pointer"
                />
                <input
                  type="number"
                  min="140"
                  max="220"
                  value={clientHeight}
                  onChange={(e) => {
                    const h = Math.max(120, Math.min(230, Number(e.target.value)));
                    setClientHeight(h);
                    handleHeightOrPresetChange(h, sizePreset);
                  }}
                  className="w-16 px-2 py-1 bg-black/60 border border-white/20 rounded-md text-xs font-mono text-center text-white"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1.5">
                Escala real: proporção de {(clientHeight / MODEL_BASE_HEIGHT_CM).toFixed(2)}x sobre o corpo anatômico.
              </p>
            </div>

            {/* Região Selecionada */}
            {selectedRegion ? (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1a1c25] to-[#121319] border border-[#C5A059]/40 shadow-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[#C5A059] uppercase tracking-wider">
                      {selectedRegion.category} • {selectedRegion.view}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#C5A059] shadow-[0_0_8px_#C5A059]" />
                  </div>
                  <h4 className="text-base font-bold text-white leading-tight">{selectedRegion.name}</h4>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">{selectedRegion.description}</p>
                </div>

                {/* Porte */}
                <div>
                  <label className="text-xs font-semibold text-white/75 block mb-1.5">Porte do Projeto</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["pequeno", "medio", "grande"] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setSizePreset(preset);
                          handleHeightOrPresetChange(clientHeight, preset);
                        }}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition capitalize cursor-pointer ${
                          sizePreset === preset
                            ? "bg-[#C5A059] text-black border-[#C5A059]"
                            : "bg-black/40 text-white/70 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medidas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                    <span className="text-[10px] uppercase font-semibold text-white/50 block">Dimensões Estimadas</span>
                    <span className="text-sm font-bold font-mono text-[#DFC17B] block mt-0.5">
                      {selectedRegion.realWidth} x {selectedRegion.realHeight} cm
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                    <span className="text-[10px] uppercase font-semibold text-white/50 block">Área de Cobertura</span>
                    <span className="text-sm font-bold font-mono text-[#00FCDB] block mt-0.5">
                      ~{selectedRegion.areaCm2} cm²
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-white/15 rounded-xl text-center bg-black/20 my-4">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-lg mb-2">
                  👆
                </div>
                <h4 className="text-sm font-bold text-white/90">Nenhuma região selecionada</h4>
                <p className="text-xs text-white/50 mt-1">
                  Clique no modelo 3D ao lado para selecionar o local da sua tatuagem.
                </p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            {selectedRegion && (
              <a
                href={`https://wa.me/5511995802338?text=${encodeURIComponent(
                  `Olá GuinkNass! Gostaria de um orçamento para uma tatuagem no(a) ${selectedRegion.name}, tamanho estimado de ${selectedRegion.realWidth} x ${selectedRegion.realHeight} cm (~${selectedRegion.areaCm2} cm²). Minha altura é ${clientHeight} cm.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-green-900/30 transition cursor-pointer"
              >
                <span>Enviar no WhatsApp</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                </svg>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                if (selectedRegion && onSelectRegionRef.current) {
                  onSelectRegionRef.current(selectedRegion);
                }
              }}
              disabled={!selectedRegion}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                selectedRegion
                  ? "bg-gradient-to-r from-[#DFC17B] to-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20 hover:brightness-105 cursor-pointer"
                  : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
              }`}
            >
              <span>{selectedRegion ? "Confirmar Local Selecionado" : "Selecione um Local no 3D"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
