/**
 * Cena 3D do terreno — demonstração.
 *
 * Não há levantamento topográfico (PEN-04) nem polígonos medidos, por isso o
 * relevo é gerado e a disposição das zonas é proporcional à área declarada.
 * O que é real: as zonas, as suas áreas, os talhões registados, o estado de
 * cada um e o compasso de 10 × 10 m da macadâmia. O resto é ilustrativo e a
 * página di-lo.
 *
 * Escala: 1 unidade = 10 m. Com o compasso de 10 m, uma árvore por unidade.
 *
 * Este módulo é o único que importa o three.js, e só é carregado quando a
 * vista 3D se abre.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface Parcela {
  codigo: string;
  nome: string;
  areaHa: number;
  /** Cor do estado (semáforo) em hexadecimal. */
  cor: string;
  /** Talhão ilustrativo, ainda não registado. */
  demo: boolean;
  /** Árvores registadas; sem valor, enche-se ao compasso. */
  arvores?: number;
}

export interface Zona {
  codigo: string;
  nome: string;
  areaHa: number;
  parcelas: Parcela[];
}

export interface OpcoesCena {
  arvores: boolean;
  exagero: number;
  rodar: boolean;
}

export interface Cena {
  definir(opcoes: Partial<OpcoesCena>): void;
  seleccionar(codigo: string | null): void;
  focar(codigo: string | null): void;
  destruir(): void;
}

// ============================================================================
// Relevo
// ============================================================================

function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function ruido(x: number, z: number): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Altura em unidades (10 m) antes do exagero. Colinas suaves, serra a norte. */
function alturaBase(x: number, z: number): number {
  let h = 0;
  let amp = 1;
  let freq = 0.018;
  for (let i = 0; i < 5; i++) {
    h += (ruido(x * freq + 13, z * freq + 7) - 0.5) * amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  // A serra de Vanduzi a nordeste, a planície do rio a sul.
  const serra = Math.max(0, -z - 40) * 0.05 + Math.max(0, x - 70) * 0.03;
  const vale = Math.exp(-((z - 62) ** 2) / 120) * -0.9;
  const base = h * 2.2 + serra + vale;
  // A represa: o relevo aplana-se à volta e afunda-se no meio.
  const dp = Math.hypot(x - AGUA_X, z - AGUA_Z);
  if (dp > 18) return base;
  const t = Math.min(1, Math.max(0, (18 - dp) / 7));
  const liso = t * t * (3 - 2 * t);
  const fundo = NIVEL_AGUA - 0.7 * Math.max(0, 1 - dp / 9);
  return base * (1 - liso) + fundo * liso;
}

const AGUA_X = 0;
const AGUA_Z = 60;
const NIVEL_AGUA = -1.2;

// ============================================================================
// Disposição: zonas lado a lado, talhões em faixas proporcionais à área
// ============================================================================

interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

interface ParcelaPosta extends Parcela {
  rect: Rect;
  zona: string;
}

function dispor(zonas: Zona[]): { zonas: (Zona & { rect: Rect })[]; parcelas: ParcelaPosta[] } {
  const ESTRADA = 10;
  const lados = zonas.map((z) => Math.sqrt(z.areaHa * 10_000) / 10);
  const largura = lados.reduce((s, l) => s + l, 0) + ESTRADA * (zonas.length - 1);
  let x = -largura / 2;
  const postas: (Zona & { rect: Rect })[] = [];
  const parcelas: ParcelaPosta[] = [];

  zonas.forEach((zona, i) => {
    const lado = lados[i];
    const rect = { x0: x, z0: -lado / 2, x1: x + lado, z1: lado / 2 };
    postas.push({ ...zona, rect });

    const total = zona.parcelas.reduce((s, p) => s + p.areaHa, 0) || 1;
    let z = rect.z0;
    for (const p of zona.parcelas) {
      const fundo = (p.areaHa / total) * lado;
      parcelas.push({ ...p, zona: zona.codigo, rect: { x0: rect.x0, x1: rect.x1, z0: z, z1: z + fundo } });
      z += fundo;
    }
    x += lado + ESTRADA;
  });

  return { zonas: postas, parcelas };
}

const dentro = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

// ============================================================================
// Cena
// ============================================================================

export function criarCena(
  contentor: HTMLElement,
  zonas: Zona[],
  aoSeleccionar: (codigo: string | null) => void,
  inicial: OpcoesCena,
): Cena {
  const opcoes = { ...inicial };
  const { zonas: zonasPostas, parcelas } = dispor(zonas);

  const largura = () => contentor.clientWidth || 800;
  const altura = () => contentor.clientHeight || 520;

  // --- Renderizadores ---
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(largura(), altura());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contentor.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';

  const etiquetas = new CSS2DRenderer();
  etiquetas.setSize(largura(), altura());
  Object.assign(etiquetas.domElement.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
  });
  contentor.appendChild(etiquetas.domElement);

  const cena = new THREE.Scene();
  const ceu = new THREE.Color('#dfe8ec');
  cena.background = ceu;
  cena.fog = new THREE.Fog(ceu, 220, 420);

  const camara = new THREE.PerspectiveCamera(42, largura() / altura(), 0.5, 1000);
  // Num ecrã estreito, recua para as duas zonas caberem na largura.
  const recuo = Math.max(1, 1.5 / camara.aspect);
  camara.position.set(40 * recuo, 115 * recuo, 165 * recuo);
  cena.fog = new THREE.Fog(ceu, 220 * recuo, 420 * recuo);

  const controlos = new OrbitControls(camara, renderer.domElement);
  controlos.enableDamping = true;
  controlos.dampingFactor = 0.08;
  controlos.maxPolarAngle = Math.PI / 2.15;
  controlos.minDistance = 25;
  controlos.maxDistance = 320 * recuo;
  controlos.target.set(0, 0, 0);
  controlos.autoRotateSpeed = 0.6;

  // --- Luz ---
  cena.add(new THREE.HemisphereLight('#f4f8ff', '#5b6b3a', 1.2));
  const sol = new THREE.DirectionalLight('#fff4e0', 2.2);
  sol.position.set(-90, 140, 60);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -130, right: 130, top: 110, bottom: -110, near: 10, far: 400 });
  sol.shadow.bias = -0.0005;
  cena.add(sol);

  // --- Relevo ---
  const W = 300;
  const D = 220;
  const SEG_X = 240;
  const SEG_Z = 176;
  const geo = new THREE.PlaneGeometry(W, D, SEG_X, SEG_Z);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const cores = new Float32Array(pos.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3));

  const savana = new THREE.Color('#b9b47a');
  const serra = new THREE.Color('#7d7a5c');
  const pomar = new THREE.Color('#6f9a4c');
  const estrada = new THREE.Color('#c9a77a');
  const tmp = new THREE.Color();
  const corParcela = parcelas.map((p) => new THREE.Color(p.cor));

  const y = (x: number, z: number) => alturaBase(x, z) * opcoes.exagero;

  function pintar() {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = alturaBase(x, z);
      pos.setY(i, h * opcoes.exagero);

      const k = parcelas.findIndex((p) => dentro(p.rect, x, z));
      if (k >= 0) {
        tmp.copy(pomar).lerp(corParcela[k], 0.38);
      } else if (zonasPostas.some((zp) => dentro(zp.rect, x, z))) {
        tmp.copy(pomar);
      } else if (Math.abs(z) < 4 || zonasPostas.some((zp) => x > zp.rect.x1 && x < zp.rect.x1 + 10 && Math.abs(z) < zp.rect.z1)) {
        tmp.copy(estrada);
      } else {
        tmp.copy(savana).lerp(serra, Math.min(1, Math.max(0, (h - 1) / 4)));
      }
      // Um pouco de grão, para o relevo não parecer plástico.
      const g = (hash(x * 3.1, z * 2.7) - 0.5) * 0.06;
      cores[i * 3] = tmp.r + g;
      cores[i * 3 + 1] = tmp.g + g;
      cores[i * 3 + 2] = tmp.b + g;
    }
    pos.needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    geo.computeVertexNormals();
  }
  pintar();

  const solo = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
  );
  solo.receiveShadow = true;
  cena.add(solo);

  // --- Represa ilustrativa, no ponto baixo do vale ---
  const agua = new THREE.Mesh(
    new THREE.CircleGeometry(9, 40),
    new THREE.MeshStandardMaterial({ color: '#4f8fb3', roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.9 }),
  );
  agua.rotation.x = -Math.PI / 2;
  cena.add(agua);

  // --- Contornos dos talhões, assentes no relevo ---
  const contornos = new THREE.Group();
  cena.add(contornos);
  const materialContorno = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 });
  const materialSeleccao = new THREE.LineBasicMaterial({ color: '#0e0c19' });
  const linhaDe = new Map<string, THREE.Line>();

  function contornar() {
    contornos.clear();
    linhaDe.clear();
    for (const p of parcelas) {
      const { x0, z0, x1, z1 } = p.rect;
      const pontos: THREE.Vector3[] = [];
      const passo = 2;
      const lado = (ax: number, az: number, bx: number, bz: number) => {
        const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / passo));
        for (let i = 0; i < n; i++) {
          const t = i / n;
          const x = ax + (bx - ax) * t;
          const z = az + (bz - az) * t;
          pontos.push(new THREE.Vector3(x, y(x, z) + 0.35, z));
        }
      };
      lado(x0, z0, x1, z0);
      lado(x1, z0, x1, z1);
      lado(x1, z1, x0, z1);
      lado(x0, z1, x0, z0);
      const linha = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pontos), materialContorno);
      contornos.add(linha);
      linhaDe.set(p.codigo, linha);
    }
    agua.position.set(AGUA_X, NIVEL_AGUA * opcoes.exagero + 0.06, AGUA_Z);
  }
  contornar();

  // --- Árvores: copa e tronco, instanciadas ---
  const posicoesArvores: { x: number; z: number; s: number; p: number }[] = [];
  parcelas.forEach((p, ip) => {
    const { x0, z0, x1, z1 } = p.rect;
    const capacidade = Math.floor(x1 - x0) * Math.floor(z1 - z0);
    // Talhões com árvores contadas mostram a densidade real; os ilustrativos enchem ao compasso.
    const alvo = p.arvores !== undefined && !p.demo ? Math.min(p.arvores, capacidade) : capacidade;
    const salto = alvo > 0 ? capacidade / alvo : Infinity;
    let k = 0;
    let proximo = 0;
    for (let x = x0 + 0.5; x < x1; x += 1) {
      for (let z = z0 + 0.5; z < z1; z += 1) {
        if (k++ < proximo) continue;
        proximo += salto;
        posicoesArvores.push({
          x: x + (hash(x, z) - 0.5) * 0.25,
          z: z + (hash(z, x) - 0.5) * 0.25,
          s: 0.8 + hash(x * 1.7, z * 0.3) * 0.45,
          p: ip,
        });
      }
    }
  });

  const nArv = posicoesArvores.length;
  const copa = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, flatShading: true }),
    nArv,
  );
  const tronco = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5),
    new THREE.MeshStandardMaterial({ color: '#5b4632', roughness: 1 }),
    nArv,
  );
  copa.castShadow = true;
  tronco.castShadow = true;
  const verdeEscuro = new THREE.Color('#2f5d2a');
  const verdeClaro = new THREE.Color('#4f7f36');
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const v = new THREE.Vector3();

  function plantar() {
    posicoesArvores.forEach((a, i) => {
      const base = y(a.x, a.z);
      s.set(a.s, a.s * 0.9, a.s);
      v.set(a.x, base + 0.5 + 0.36 * a.s, a.z);
      m.compose(v, q, s);
      copa.setMatrixAt(i, m);
      v.set(a.x, base + 0.25, a.z);
      s.set(1, 1, 1);
      m.compose(v, q, s);
      tronco.setMatrixAt(i, m);
    });
    copa.instanceMatrix.needsUpdate = true;
    tronco.instanceMatrix.needsUpdate = true;
    copa.computeBoundingSphere();
    tronco.computeBoundingSphere();
  }
  posicoesArvores.forEach((a, i) => {
    tmp.copy(verdeEscuro).lerp(verdeClaro, hash(a.x * 0.7, a.z * 1.3));
    // Nos talhões registados, a copa leva um toque da cor do estado.
    if (!parcelas[a.p].demo) tmp.lerp(corParcela[a.p], 0.35);
    copa.setColorAt(i, tmp);
  });
  plantar();
  cena.add(copa, tronco);

  // --- Etiquetas ---
  const objetosEtiqueta: { obj: CSS2DObject; x: number; z: number; dy: number }[] = [];
  function etiqueta(texto: string, sub: string, x: number, z: number, dy: number, forte: boolean) {
    const el = document.createElement('div');
    el.style.cssText = `font: ${forte ? 700 : 600} ${forte ? 12.5 : 11}px 'Plus Jakarta Sans', system-ui, sans-serif;
      color:#0e0c19; background:rgba(255,255,255,${forte ? 0.92 : 0.8}); padding:${forte ? '4px 9px' : '2px 7px'};
      border-radius:999px; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,.12); text-align:center; line-height:1.25`;
    el.innerHTML = `${texto}${sub ? `<div style="font-weight:500;font-size:10px;color:#3c3a47">${sub}</div>` : ''}`;
    const obj = new CSS2DObject(el);
    cena.add(obj);
    objetosEtiqueta.push({ obj, x, z, dy });
  }
  for (const zp of zonasPostas) {
    etiqueta(zp.nome, `${zp.codigo} · ${zp.areaHa.toLocaleString()} ha`, (zp.rect.x0 + zp.rect.x1) / 2, zp.rect.z0 - 4, 9, true);
  }
  for (const p of parcelas) {
    etiqueta(p.codigo, '', (p.rect.x0 + p.rect.x1) / 2, (p.rect.z0 + p.rect.z1) / 2, 4, false);
  }
  function assentarEtiquetas() {
    for (const e of objetosEtiqueta) e.obj.position.set(e.x, y(e.x, e.z) + e.dy, e.z);
  }
  assentarEtiquetas();

  // --- Selecção por clique ---
  const raio = new THREE.Raycaster();
  const rato = new THREE.Vector2();
  let premido: { x: number; y: number } | null = null;
  const aoPremir = (e: PointerEvent) => (premido = { x: e.clientX, y: e.clientY });
  const aoLargar = (e: PointerEvent) => {
    // Arrastar para rodar não é clicar.
    if (!premido || Math.hypot(e.clientX - premido.x, e.clientY - premido.y) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    rato.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raio.setFromCamera(rato, camara);
    const [hit] = raio.intersectObject(solo);
    const p = hit && parcelas.find((pp) => dentro(pp.rect, hit.point.x, hit.point.z));
    aoSeleccionar(p ? p.codigo : null);
  };
  renderer.domElement.addEventListener('pointerdown', aoPremir);
  renderer.domElement.addEventListener('pointerup', aoLargar);

  let seleccionado: string | null = null;
  function seleccionar(codigo: string | null) {
    const anterior = seleccionado ? linhaDe.get(seleccionado) : undefined;
    if (anterior) anterior.material = materialContorno;
    seleccionado = codigo;
    const l = codigo ? linhaDe.get(codigo) : undefined;
    if (l) l.material = materialSeleccao;
  }

  // --- Foco animado ---
  let destino: THREE.Vector3 | null = null;
  function focar(codigo: string | null) {
    const p = parcelas.find((pp) => pp.codigo === codigo);
    if (!p) {
      destino = new THREE.Vector3(0, 0, 0);
      return;
    }
    const cx = (p.rect.x0 + p.rect.x1) / 2;
    const cz = (p.rect.z0 + p.rect.z1) / 2;
    destino = new THREE.Vector3(cx, y(cx, cz), cz);
  }

  // --- Ciclo ---
  let pedido = 0;
  const ciclo = () => {
    pedido = requestAnimationFrame(ciclo);
    if (destino) {
      const delta = destino.clone().sub(controlos.target).multiplyScalar(0.08);
      controlos.target.add(delta);
      camara.position.add(delta);
      if (delta.length() < 0.01) destino = null;
    }
    controlos.update();
    renderer.render(cena, camara);
    etiquetas.render(cena, camara);
  };
  ciclo();

  const observador = new ResizeObserver(() => {
    camara.aspect = largura() / altura();
    camara.updateProjectionMatrix();
    renderer.setSize(largura(), altura());
    etiquetas.setSize(largura(), altura());
  });
  observador.observe(contentor);

  function definir(novas: Partial<OpcoesCena>) {
    const exageroMudou = novas.exagero !== undefined && novas.exagero !== opcoes.exagero;
    Object.assign(opcoes, novas);
    copa.visible = tronco.visible = opcoes.arvores;
    controlos.autoRotate = opcoes.rodar;
    if (exageroMudou) {
      pintar();
      contornar();
      plantar();
      assentarEtiquetas();
      seleccionar(seleccionado);
    }
  }
  definir(opcoes);

  return {
    definir,
    seleccionar,
    focar,
    destruir() {
      cancelAnimationFrame(pedido);
      observador.disconnect();
      renderer.domElement.removeEventListener('pointerdown', aoPremir);
      renderer.domElement.removeEventListener('pointerup', aoLargar);
      controlos.dispose();
      cena.traverse((o) => {
        const malha = o as THREE.Mesh;
        malha.geometry?.dispose();
        const mat = malha.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      etiquetas.domElement.remove();
    },
  };
}
