// Ασύμπτωτες: σκηνή WebXR για Magic Leap 2, Meta Quest 3 και tablet Samsung (Maths---AR)
// Οι 5 καταστάσεις αντιστοιχούν στα 5 αρχεία GeoGebra «Ασύμπτωτες - 01 … 05» (ίδια χρώματα και ίδια κείμενα).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COL = { blue: 0x1565C0, red: 0xC62828, green: 0x2E7D32, purple: 0x6A1B9A, orange: 0xEF6C00, teal: 0x00838F, navy: 0x1A237E, gray: 0x37474F };
const HEX = k => '#' + COL[k].toString(16).padStart(6, '0');
const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',').replace('-', '−');
const PI = Math.PI;

// ------------------------------------------------------------------ Καταστάσεις (μαθηματικό περιεχόμενο)
const STATES = [
  {
    id: 'katakoryfi', short: 'Κατακόρυφη', title: 'Κατακόρυφη ασύμπτωτη', view: [-8, 8, -6, 4.5],
    params: [
      { key: 'a', label: 'Θέση α της ευθείας', min: -3, max: 3, step: 0.5, val: 1 },
      { key: 'k', label: 'Συνάρτηση', min: 1, max: 3, step: 1, val: 1 },
      { key: 'd', label: 'Απόσταση d από το α', min: 0.01, max: 2, step: 0.01, val: 1, list: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 1.5, 2] },
    ],
    compute(p) {
      const { a, k, d } = p;
      const f = x => (k === 1 ? 1 / (x - a) : k === 2 ? 1 / ((x - a) ** 2) : Math.log(Math.abs(x - a)));
      const formula = ['f(x) = 1/(x − α)', 'f(x) = 1/(x − α)²', 'f(x) = ln|x − α|'][k - 1];
      const concl = k === 1 ? 'Όταν x → α+, f(x) → +∞. Όταν x → α−, f(x) → −∞.' : k === 2 ? 'Όταν x → α+ και όταν x → α−, f(x) → +∞.' : 'Όταν x → α+ και όταν x → α−, f(x) → −∞.';
      return {
        f, formula,
        asym: [{ kind: 'v', x: a, color: 'red' }],
        points: [
          { x: a + d, y: f(a + d), color: 'orange', r: 0.013 }, { x: a - d, y: f(a - d), color: 'teal', r: 0.013 },
          { x: a + d, y: 0, color: 'orange', r: 0.009 }, { x: a - d, y: 0, color: 'teal', r: 0.009 },
        ],
        segs: [{ x1: a + d, y1: f(a + d), x2: a + d, y2: 0, color: 'orange' }, { x1: a - d, y1: f(a - d), x2: a - d, y2: 0, color: 'teal' }],
        lines: [
          { t: `x → α+  :  x = ${fmt(a + d)}   και   f(x) = ${fmt(f(a + d))}`, c: 'orange' },
          { t: `x → α−  :  x = ${fmt(a - d)}   και   f(x) = ${fmt(f(a - d))}`, c: 'teal' },
          { t: concl, c: 'gray' },
          { t: `Η ευθεία x = ${fmt(a)} είναι κατακόρυφη ασύμπτωτη της γραφικής παράστασης της f.`, c: 'red' },
        ],
      };
    },
  },
  {
    id: 'orizontia', short: 'Οριζόντια', title: 'Οριζόντια ασύμπτωτη', view: [-12, 12, -4.5, 5],
    params: [
      { key: 'k', label: 'Συνάρτηση', min: 1, max: 3, step: 1, val: 1 },
      { key: 't', label: 'Θέση x', min: -12, max: 12, step: 0.5, val: 4, anim: true },
    ],
    compute(p) {
      const { k, t } = p;
      const f = x => (k === 1 ? 2 + 1 / x : k === 2 ? 1 + Math.exp(-x) : x / Math.sqrt(x * x + 1));
      const formula = ['f(x) = 2 + 1/x', 'f(x) = 1 + e^(−x)', 'f(x) = x/√(x² + 1)'][k - 1];
      const yp = k === 1 ? 2 : 1;
      const okP = k === 1 ? Math.abs(t) > 0.001 : true;
      const okQ = k === 1 ? Math.abs(t) > 0.001 : k === 2 ? t > 0 : true;
      const yq = t >= 0 ? yp : (k === 3 ? -1 : 2);
      const asym = [{ kind: 'h', y: yp, color: 'green' }];
      if (k === 3) asym.push({ kind: 'h', y: -1, color: 'green' });
      if (k === 1) asym.push({ kind: 'v', x: 0, color: 'red' });
      const points = [], segs = [];
      if (okP) points.push({ x: t, y: f(t), color: 'orange', r: 0.013 });
      if (okQ) { points.push({ x: t, y: yq, color: 'green', r: 0.011 }); segs.push({ x1: t, y1: f(t), x2: t, y2: yq, color: 'teal' }); }
      const vals = okQ ? `x = ${fmt(t)}   f(x) = ${fmt(f(t))}   απόσταση από την ευθεία y = ℓ :  |f(x) − ℓ| = ${fmt(Math.abs(f(t) - yq))}`
        : okP ? `x = ${fmt(t)}   f(x) = ${fmt(f(t))}   (η f(x) αυξάνεται απεριόριστα, δεν πλησιάζει ευθεία)` : 'Στο x = 0 η f δεν ορίζεται: διάλεξε άλλο x';
      const concl = k === 1 ? 'Όταν x → +∞ και όταν x → −∞, f(x) → 2. Η y = 2 είναι οριζόντια ασύμπτωτη και στα δύο άκρα.'
        : k === 2 ? 'Όταν x → +∞, f(x) → 1: η y = 1 είναι οριζόντια ασύμπτωτη στο +∞. Όταν x → −∞, f(x) → +∞: καμία οριζόντια ασύμπτωτη στο −∞.'
          : 'Όταν x → +∞, f(x) → 1 και όταν x → −∞, f(x) → −1. Δύο οριζόντιες ασύμπτωτες: y = 1 στο +∞ και y = −1 στο −∞.';
      const concl2 = k === 1 ? 'Η x = 0 είναι κατακόρυφη ασύμπτωτη: f(x) → +∞ για x → 0+ και f(x) → −∞ για x → 0−.'
        : 'Ισχύει: η ευθεία y = ℓ είναι οριζόντια ασύμπτωτη στο +∞ ή στο −∞ όταν το όριο της f εκεί είναι ο πραγματικός αριθμός ℓ.';
      return { f, formula, asym, points, segs, lines: [{ t: vals, c: 'teal' }, { t: concl, c: 'green' }, { t: concl2, c: 'gray' }] };
    },
  },
  {
    id: 'plagia', short: 'Πλάγια', title: 'Πλάγια ασύμπτωτη', view: [-12, 12, -7, 8.5],
    params: [
      { key: 'l', label: 'λ', min: -2, max: 2, step: 0.5, val: 1 },
      { key: 'b', label: 'β', min: -3, max: 3, step: 0.5, val: 1 },
      { key: 'g', label: 'γ', min: -4, max: 4, step: 0.5, val: 2 },
      { key: 'd', label: 'δ', min: -3, max: 3, step: 0.5, val: 1 },
      { key: 't', label: 'Θέση x', min: -10, max: 10, step: 0.5, val: 5, anim: true },
    ],
    compute(p) {
      const { l, b, g, d, t } = p;
      const f = x => l * x + b + g / (x - d);
      const okt = Math.abs(t - d) > 0.001;
      const asym = [];
      if (l !== 0) asym.push({ kind: 'o', m: l, b, color: 'purple' }); else asym.push({ kind: 'h', y: b, color: 'green' });
      if (g !== 0) asym.push({ kind: 'v', x: d, color: 'red' });
      const points = [], segs = [];
      if (okt) {
        points.push({ x: t, y: f(t), color: 'orange', r: 0.013 }, { x: t, y: l * t + b, color: 'purple', r: 0.011 });
        segs.push({ x1: t, y1: f(t), x2: t, y2: l * t + b, color: 'teal' });
      }
      const gap = okt ? Math.abs(f(t) - (l * t + b)) : 0;
      const vals = okt && Math.abs(t) > 0.001 ? `x = ${fmt(t)}   f(x)/x = ${fmt(f(t) / t)}   f(x) − λx = ${fmt(f(t) - l * t)}   |f(x) − (λx + β)| = ${fmt(gap)}`
        : okt ? `x = ${fmt(t)}   f(x) − λx = ${fmt(f(t) - l * t)}   |f(x) − (λx + β)| = ${fmt(gap)}` : 'Στο x = δ η f δεν ορίζεται: διάλεξε άλλο x';
      const concl = l === 0 ? 'Για λ = 0 η ασύμπτωτη y = β είναι οριζόντια.'
        : g === 0 ? 'Για γ = 0 η γραφική παράσταση είναι η ίδια η ευθεία y = λx + β: δεν υπάρχει κατακόρυφη ασύμπτωτη.'
          : 'Όταν x → ±∞, f(x)/x → λ και f(x) − λx → β: η y = λx + β είναι πλάγια ασύμπτωτη και στα δύο άκρα.';
      const concl2 = g !== 0 ? `Η x = ${fmt(d)} είναι κατακόρυφη ασύμπτωτη (το γ/(x − δ) τείνει στο ±∞ όταν x → δ).` : '';
      return {
        f, formula: 'f(x) = λx + β + γ/(x − δ)', asym, points, segs,
        lines: [{ t: `Ασύμπτωτη:  y = λx + β  με  λ = ${fmt(l)}  και  β = ${fmt(b)}`, c: 'purple' }, { t: vals, c: 'teal' }, { t: concl, c: 'gray' }, { t: concl2, c: 'red' }],
      };
    },
  },
  {
    id: 'meleti', short: 'Πού ψάχνουμε', title: 'Πού ψάχνουμε για ασύμπτωτες', view: [-12, 12, -8, 6.5],
    params: [
      { key: 'k', label: 'Συνάρτηση', min: 1, max: 4, step: 1, val: 1 },
      { key: 't', label: 'Θέση x', min: -10, max: 10, step: 0.25, val: 3, anim: true },
    ],
    compute(p) {
      const { k, t } = p;
      const f = x => (k === 1 ? (x * x - 1) / (x * x - 4) : k === 2 ? x - Math.log(x) : k === 3 ? Math.sqrt(x * x + 1) : x + Math.exp(x));
      const formula = ['f(x) = (x² − 1)/(x² − 4)', 'f(x) = x − ln x', 'f(x) = √(x² + 1)', 'f(x) = x + e^x'][k - 1];
      const dom = ['Πεδίο ορισμού:  ℝ − {−2, 2}', 'Πεδίο ορισμού:  (0, +∞)', 'Πεδίο ορισμού:  ℝ', 'Πεδίο ορισμού:  ℝ'][k - 1];
      const asym = [];
      if (k === 1) asym.push({ kind: 'v', x: -2, color: 'red' }, { kind: 'v', x: 2, color: 'red' }, { kind: 'h', y: 1, color: 'green' });
      if (k === 2) asym.push({ kind: 'v', x: 0, color: 'red' });
      if (k === 3) asym.push({ kind: 'o', m: 1, b: 0, color: 'purple' }, { kind: 'o', m: -1, b: 0, color: 'purple' });
      if (k === 4) asym.push({ kind: 'o', m: 1, b: 0, color: 'purple' });
      const ok = k === 1 ? Math.abs(Math.abs(t) - 2) > 0.001 : k === 2 ? t > 0.001 : true;
      const lam = (k === 3 && t < 0) ? -1 : 1;
      const points = ok ? [{ x: t, y: f(t), color: 'orange', r: 0.013 }] : [];
      const lv = k === 1 ? 'Κατακόρυφες:  x = −2  και  x = 2' : k === 2 ? 'Κατακόρυφες:  x = 0  (f(x) → +∞ όταν x → 0+)' : 'Κατακόρυφες:  καμία';
      const lh = k === 1 ? 'Οριζόντιες:  y = 1  στο +∞ και στο −∞' : 'Οριζόντιες:  καμία';
      const lo = k === 1 ? 'Πλάγιες:  καμία' : k === 2 ? 'Πλάγιες:  καμία (f(x)/x → 1, αλλά f(x) − x = −ln x → −∞)' : k === 3 ? 'Πλάγιες:  y = x στο +∞  και  y = −x στο −∞' : 'Πλάγιες:  y = x μόνο στο −∞  (στο +∞ είναι f(x)/x → +∞)';
      const vals = ok ? (k > 1 && Math.abs(t) > 0.001 ? `x = ${fmt(t)}   f(x) = ${fmt(f(t))}   f(x)/x = ${fmt(f(t) / t)}   f(x) − λx = ${fmt(f(t) - lam * t)}   (λ = ${fmt(lam)})` : `x = ${fmt(t)}   f(x) = ${fmt(f(t))}`)
        : `Το x = ${fmt(t)} δεν ανήκει στο πεδίο ορισμού της f`;
      return { f, formula, asym, points, segs: [], lines: [{ t: dom, c: 'gray' }, { t: lv, c: 'red' }, { t: lh, c: 'green' }, { t: lo, c: 'purple' }, { t: vals, c: 'teal' }] };
    },
  },
  {
    id: 'temnei', short: 'Τέμνει;', title: 'Τέμνει η γραφική παράσταση την ασύμπτωτη;', view: [-12, 12, -5.5, 4],
    params: [
      { key: 'k', label: 'Συνάρτηση', min: 1, max: 2, step: 1, val: 1 },
      { key: 'w', label: 'ω', min: 1, max: 3, step: 0.5, val: 1 },
      { key: 't', label: 'Θέση x', min: -12, max: 12, step: 0.5, val: 7, anim: true },
    ],
    compute(p) {
      const { k, w, t } = p;
      const f = x => (k === 1 ? Math.sin(w * x) / x : x + Math.sin(w * x) / x);
      const formula = k === 1 ? 'f(x) = ημ(ωx)/x    Ασύμπτωτη:  y = 0' : 'f(x) = x + ημ(ωx)/x    Ασύμπτωτη:  y = x';
      const asym = [k === 1 ? { kind: 'h', y: 0, color: 'green' } : { kind: 'o', m: 1, b: 0, color: 'purple' }];
      const points = [{ x: 0, y: w, color: 'red', r: 0.015, hollow: true }];
      for (let n = 1; n <= 12; n++) for (const s of [1, -1]) { const x = s * n * PI / w; points.push({ x, y: k === 1 ? 0 : x, color: 'orange', r: 0.009 }); }
      const segs = [];
      const okt = Math.abs(t) > 0.001;
      const yq = k === 1 ? 0 : t;
      if (okt) { points.push({ x: t, y: f(t), color: 'teal', r: 0.013 }, { x: t, y: yq, color: 'green', r: 0.011 }); segs.push({ x1: t, y1: f(t), x2: t, y2: yq, color: 'teal' }); }
      const vals = okt ? `x = ${fmt(t)}   f(x) = ${fmt(f(t))}   f(x) − (ασύμπτωτη) = ημ(ωx)/x = ${fmt(f(t) - yq)}` : 'Στο x = 0 η f δεν ορίζεται: διάλεξε άλλο x';
      return {
        f, formula, asym, points, segs,
        lines: [{ t: vals, c: 'teal' }, { t: 'Η γραφική παράσταση τέμνει την ασύμπτωτη στα x = νπ/ω  (ν = ±1, ±2, …), δηλαδή σε άπειρα σημεία.', c: 'orange' },
          { t: 'Η διαφορά ημ(ωx)/x τείνει στο 0 όταν x → ±∞: ασύμπτωτη δεν σημαίνει ότι η γραφική παράσταση δεν την τέμνει.', c: 'gray' },
          { t: `Το 0 δεν ανήκει στο πεδίο ορισμού, αλλά το όριο της f στο 0 είναι ${fmt(w)} (κόκκινος κύκλος): η x = 0 δεν είναι κατακόρυφη ασύμπτωτη.`, c: 'red' }],
      };
    },
  },
];
for (const s of STATES) { s.P = {}; for (const q of s.params) s.P[q.key] = q.val; }

// ------------------------------------------------------------------ Βοηθητικά γραφικά
const BW = 0.8, BH = 0.45; // διαστάσεις πίνακα σε μέτρα
const texCache = new Map();
function labelTexture(text, color = '#37474F', size = 64) {
  const key = text + color + size;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d'); g.font = `bold ${size}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; texCache.set(key, tex); return tex;
}
function makeTextPlane(w, h, pxW, pxH) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  mesh.userData.draw = (lines, opts = {}) => {
    const g = c.getContext('2d'); g.clearRect(0, 0, pxW, pxH);
    if (opts.bg) { g.fillStyle = opts.bg; g.fillRect(0, 0, pxW, pxH); }
    const n = Math.max(1, lines.length); const lh = pxH / n; const align = opts.align || 'left';
    lines.forEach((ln, i) => {
      let fs = Math.min(opts.maxFont || 40, lh * 0.72);
      g.font = `${ln.bold === false ? '' : 'bold '}${fs}px sans-serif`;
      while (g.measureText(ln.t).width > pxW - 24 && fs > 12) { fs -= 1; g.font = `${ln.bold === false ? '' : 'bold '}${fs}px sans-serif`; }
      g.fillStyle = HEX[ln.c] || ln.c || '#37474F'; g.textBaseline = 'middle'; g.textAlign = align;
      g.fillText(ln.t, align === 'left' ? 12 : align === 'center' ? pxW / 2 : pxW - 12, lh * (i + 0.5));
    });
    tex.needsUpdate = true;
  };
  return mesh;
}
function cylBetween(a, b, r, color, opacity = 1) {
  const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.max(len, 1e-6), 8, 1), new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}
function disposeTree(o) { o.traverse(ch => { if (ch.geometry) ch.geometry.dispose(); if (ch.material && !ch.userData.keepMat) { if (ch.material.map && !ch.userData.keepMap) { /* οι υφές των ετικετών μένουν στην κρυφή μνήμη */ } ch.material.dispose(); } }); }

// ------------------------------------------------------------------ Εκκίνηση
export function start() {
  const url = new URL(location.href);
  const forcePanel = url.searchParams.get('panel') === '1';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: url.searchParams.get('shot') === '1' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.id = 'gl';
  document.body.prepend(renderer.domElement);
  const scene = new THREE.Scene(); const BG = new THREE.Color(0xF4F6F8); scene.background = BG;
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 50); camera.position.set(0, 0.05, 1.35);
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, -0.12, 0); controls.enableDamping = true; controls.maxPolarAngle = PI * 0.62; controls.minDistance = 0.5; controls.maxDistance = 3; controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2)); const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(0.5, 1, 1); scene.add(dl);

  const root = new THREE.Group(); scene.add(root);
  const boardGrp = new THREE.Group(); root.add(boardGrp);      // πίνακας (σταθερό υπόβαθρο ανά κατάσταση)
  const dyn = new THREE.Group(); root.add(dyn);                // δυναμικά αντικείμενα
  const panel = new THREE.Group(); root.add(panel);            // 3D πίνακας ελέγχου για τα γυαλιά
  const interactives = [];

  const titlePlane = makeTextPlane(BW, 0.07, 1600, 140); titlePlane.position.set(0, BH / 2 + 0.05, 0); root.add(titlePlane);
  const infoPlane = makeTextPlane(BW, 0.2, 1600, 400); infoPlane.position.set(0, -BH / 2 - 0.125, 0); root.add(infoPlane);

  let cur = 0; let anim = false; let animDir = 1;
  const S = () => STATES[cur];
  const mapX = x => ((x - S().view[0]) / (S().view[1] - S().view[0]) - 0.5) * BW;
  const mapY = y => ((y - S().view[2]) / (S().view[3] - S().view[2]) - 0.5) * BH;
  const P3 = (x, y, z = 0) => new THREE.Vector3(mapX(x), mapY(y), z);
  const inView = (x, y, e = 0) => x >= S().view[0] - e && x <= S().view[1] + e && y >= S().view[2] - e && y <= S().view[3] + e;

  function buildBoard() {
    while (boardGrp.children.length) { const c = boardGrp.children[0]; boardGrp.remove(c); disposeTree(c); }
    const [x0, x1, y0, y1] = S().view;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 })); bg.position.z = -0.004; boardGrp.add(bg);
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(BW, BH)), new THREE.LineBasicMaterial({ color: 0x90A4AE })); boardGrp.add(frame);
    const pts = [];
    const stepX = (x1 - x0) > 16 ? 2 : 1;
    for (let x = Math.ceil(x0 / stepX) * stepX; x <= x1 + 1e-9; x += stepX) { pts.push(P3(x, y0, -0.002), P3(x, y1, -0.002)); }
    for (let y = Math.ceil(y0); y <= y1 + 1e-9; y += 1) { pts.push(P3(x0, y, -0.002), P3(x1, y, -0.002)); }
    boardGrp.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xCFD8DC })));
    // άξονες
    const axisMat = c => new THREE.MeshBasicMaterial({ color: c });
    if (y0 <= 0 && y1 >= 0) { const m = cylBetween(P3(x0, 0), P3(x1, 0), 0.0016, 0x263238); boardGrp.add(m); }
    if (x0 <= 0 && x1 >= 0) { const m = cylBetween(P3(0, y0), P3(0, y1), 0.0016, 0x263238); boardGrp.add(m); }
    // αριθμοί στους άξονες
    const tick = (txt, pos) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(txt, '#455A64', 56), depthTest: false })); s.scale.set(0.055, 0.0275, 1); s.position.copy(pos); s.userData.keepMat = false; boardGrp.add(s); };
    const stepTx = (x1 - x0) > 16 ? 4 : 2;
    const yAxisY = (y0 <= 0 && y1 >= 0) ? 0 : y0;
    for (let x = Math.ceil(x0 / stepTx) * stepTx; x <= x1 + 1e-9; x += stepTx) if (x !== 0) tick(fmt(x), P3(x, yAxisY).add(new THREE.Vector3(0, -0.013, 0.002)));
    const xAxisX = (x0 <= 0 && x1 >= 0) ? 0 : x0;
    for (let y = Math.ceil(y0 / 2) * 2; y <= y1 + 1e-9; y += 2) if (y !== 0) tick(fmt(y), P3(xAxisX, y).add(new THREE.Vector3(-0.022, 0, 0.002)));
  }

  function curveSegments(f) {
    const [x0, x1, y0, y1] = S().view; const N = 420; const segs = []; let cur2 = [];
    const ymin = y0 - 0.6, ymax = y1 + 0.6;
    let prevY = null;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (x1 - x0) * i / N; const y = f(x);
      const ok = Number.isFinite(y) && y >= ymin && y <= ymax && (prevY === null || Math.abs(y - prevY) < (y1 - y0) * 0.5);
      if (ok) { cur2.push(P3(x, Math.min(Math.max(y, y0), y1))); prevY = y; } else { if (cur2.length > 1) segs.push(cur2); cur2 = []; prevY = null; }
    }
    if (cur2.length > 1) segs.push(cur2);
    return segs;
  }
  function clipLine(m, b) {
    const [x0, x1, y0, y1] = S().view; const out = [];
    const add = (x, y) => { if (x >= x0 - 1e-9 && x <= x1 + 1e-9 && y >= y0 - 1e-9 && y <= y1 + 1e-9 && !out.some(q => Math.abs(q[0] - x) < 1e-6 && Math.abs(q[1] - y) < 1e-6)) out.push([x, y]); };
    add(x0, m * x0 + b); add(x1, m * x1 + b); if (m !== 0) { add((y0 - b) / m, y0); add((y1 - b) / m, y1); }
    return out.length >= 2 ? out : null;
  }

  function refresh() {
    const st = S(); const r = st.compute(st.P);
    while (dyn.children.length) { const c = dyn.children[0]; dyn.remove(c); disposeTree(c); }
    // καμπύλη της f
    for (const seg of curveSegments(r.f)) {
      const curve = new THREE.CatmullRomCurve3(seg, false, 'catmullrom', 0.5);
      dyn.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(2, seg.length), 0.0042, 6, false), new THREE.MeshBasicMaterial({ color: COL.blue })));
    }
    // ασύμπτωτες: λεπτός σωλήνας και ημιδιαφανές επίπεδο με βάθος
    for (const a of r.asym) {
      let A = null, B = null;
      if (a.kind === 'v') { if (inView(a.x, st.view[2])) { A = [a.x, st.view[2]]; B = [a.x, st.view[3]]; } }
      else if (a.kind === 'h') { A = [st.view[0], a.y]; B = [st.view[1], a.y]; if (a.y < st.view[2] || a.y > st.view[3]) A = B = null; }
      else { const c = clipLine(a.m, a.b); if (c) { A = c[0]; B = c[1]; } }
      if (!A) continue;
      const pa = P3(A[0], A[1], 0.001), pb = P3(B[0], B[1], 0.001);
      dyn.add(cylBetween(pa, pb, 0.003, COL[a.color]));
      const dirv = new THREE.Vector3().subVectors(pb, pa); const L = dirv.length();
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.16), new THREE.MeshBasicMaterial({ color: COL[a.color], transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }));
      plane.position.copy(pa).add(pb).multiplyScalar(0.5); plane.position.z = 0.0;
      const ang = Math.atan2(dirv.y, dirv.x); plane.rotation.set(0, 0, ang); plane.rotateX(PI / 2); // επίπεδο κάθετο στον πίνακα
      dyn.add(plane);
    }
    for (const s of r.segs) { if (inView(s.x1, s.y1, 1000)) dyn.add(cylBetween(P3(s.x1, Math.min(Math.max(s.y1, st.view[2]), st.view[3]), 0.003), P3(s.x2, Math.min(Math.max(s.y2, st.view[2]), st.view[3]), 0.003), 0.0025, COL[s.color])); }
    for (const p of r.points) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !inView(p.x, p.y, 0.05)) continue;
      let m;
      if (p.hollow) m = new THREE.Mesh(new THREE.TorusGeometry(p.r, 0.0035, 8, 24), new THREE.MeshBasicMaterial({ color: COL[p.color] }));
      else m = new THREE.Mesh(new THREE.SphereGeometry(p.r, 16, 12), new THREE.MeshLambertMaterial({ color: COL[p.color] }));
      m.position.copy(P3(p.x, p.y, 0.006)); dyn.add(m);
    }
    titlePlane.userData.draw([{ t: `${st.title}     ${r.formula}`, c: 'navy' }], { maxFont: 64 });
    infoPlane.userData.draw(r.lines.filter(l => l.t), { maxFont: 46 });
    lastResult = r; syncUI();
  }
  let lastResult = null;

  // ------------------------------------------------------------------ 3D πίνακας ελέγχου
  const rowsGrp = new THREE.Group(); panel.add(rowsGrp);
  const stateButtons = [];
  function makeButton(label, w, h, bg, onClick, fg = '#ffffff') {
    const c = document.createElement('canvas'); c.width = Math.round(w * 2400 / BW * 0.4); c.height = Math.round(h * 2400 / BW * 0.4);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
    mesh.userData = { onClick, w, h, c, label, bg, fg, redraw(color) { const g = c.getContext('2d'); g.fillStyle = color || this.bg; g.fillRect(0, 0, c.width, c.height); let fs = c.height * 0.5; g.font = `bold ${fs}px sans-serif`; while (g.measureText(label).width > c.width - 16 && fs > 10) { fs -= 1; g.font = `bold ${fs}px sans-serif`; } g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, c.width / 2, c.height / 2 + 2); mesh.material.map.colorSpace = THREE.SRGBColorSpace; mesh.material.map.needsUpdate = true; } };
    mesh.userData.redraw(); interactives.push(mesh); return mesh;
  }
  const rowLabels = [];
  function stepParam(q, dir) {
    const st = S(); let v = st.P[q.key];
    if (q.list) { let i = q.list.findIndex(x => Math.abs(x - v) < 1e-9); if (i < 0) i = 0; i = Math.min(Math.max(i + dir, 0), q.list.length - 1); v = q.list[i]; }
    else v = Math.min(q.max, Math.max(q.min, Math.round((v + dir * q.step) / q.step) * q.step));
    st.P[q.key] = Math.round(v * 1000) / 1000; refresh();
  }
  function buildPanel() {
    while (rowsGrp.children.length) { const c = rowsGrp.children[0]; rowsGrp.remove(c); const i = interactives.indexOf(c); if (i >= 0) interactives.splice(i, 1); disposeTree(c); }
    rowLabels.length = 0;
    const y0 = -BH / 2 - 0.25;
    STATES.forEach((s, i) => {
      const w = (BW - 4 * 0.012) / 5; const b = makeButton(s.short, w, 0.05, i === cur ? HEX('navy') : '#78909C', () => setState(i));
      b.position.set(-BW / 2 + w / 2 + i * (w + 0.012), y0, 0.002); rowsGrp.add(b); b.userData.stateIndex = i;
    });
    const st = S(); let yy = y0 - 0.062;
    st.params.forEach(q => {
      const lab = makeTextPlane(0.52, 0.05, 1040, 100); lab.position.set(-BW / 2 + 0.26, yy, 0.002); rowsGrp.add(lab); rowLabels.push([lab, q]);
      const mi = makeButton('−', 0.07, 0.05, HEX('orange'), () => stepParam(q, -1)); mi.position.set(BW / 2 - 0.15, yy, 0.002); rowsGrp.add(mi);
      const pl = makeButton('+', 0.07, 0.05, HEX('orange'), () => stepParam(q, +1)); pl.position.set(BW / 2 - 0.07, yy, 0.002); rowsGrp.add(pl);
      yy -= 0.058;
    });
    const hasAnim = st.params.some(q => q.anim);
    if (hasAnim) { const bt = makeButton(anim ? 'Παύση κίνησης' : 'Κίνηση του x', 0.3, 0.05, HEX('teal'), () => { anim = !anim; buildPanel(); }); bt.position.set(-BW / 2 + 0.15, yy, 0.002); rowsGrp.add(bt); }
    const sz1 = makeButton('Μικρότερο', 0.15, 0.05, '#78909C', () => root.scale.multiplyScalar(0.9)); sz1.position.set(BW / 2 - 0.15 - 0.08, yy, 0.002); rowsGrp.add(sz1);
    const sz2 = makeButton('Μεγαλύτερο', 0.15, 0.05, '#78909C', () => root.scale.multiplyScalar(1.1)); sz2.position.set(BW / 2 - 0.075 + 0.0, yy, 0.002); rowsGrp.add(sz2);
    updatePanelLabels();
  }
  function updatePanelLabels() {
    for (const [lab, q] of rowLabels) lab.userData.draw([{ t: `${q.label} = ${fmt(S().P[q.key])}`, c: 'orange' }], { maxFont: 56 });
  }

  // ------------------------------------------------------------------ Περιβάλλον DOM (υπολογιστής και tablet)
  const ui = document.getElementById('ui');
  const uiTitle = ui.querySelector('#ui-title'), uiSub = ui.querySelector('#ui-sub'), uiStates = ui.querySelector('#ui-states'), uiParams = ui.querySelector('#ui-params'), uiInfo = ui.querySelector('#ui-info'), uiAnim = ui.querySelector('#ui-anim');
  uiSub.textContent = 'Κέντρο Καινοτομίας Θεσσαλίας, Μαθηματικά Προσανατολισμού Γ΄ Λυκείου, Κεφάλαιο 2';
  STATES.forEach((s, i) => { const b = document.createElement('button'); b.textContent = s.short; b.dataset.i = i; b.onclick = () => setState(i); uiStates.appendChild(b); });
  let sliderEls = [];
  function buildUIParams() {
    uiParams.innerHTML = ''; sliderEls = [];
    S().params.forEach(q => {
      const row = document.createElement('label'); row.className = 'row';
      const sp = document.createElement('span'); const inp = document.createElement('input'); inp.type = 'range'; inp.min = q.min; inp.max = q.max; inp.step = q.step; inp.value = S().P[q.key];
      inp.oninput = () => { S().P[q.key] = parseFloat(inp.value); refresh(); updatePanelLabels(); };
      row.appendChild(sp); row.appendChild(inp); uiParams.appendChild(row); sliderEls.push([sp, inp, q]);
    });
    uiAnim.style.display = S().params.some(q => q.anim) ? '' : 'none'; uiAnim.textContent = anim ? 'Παύση κίνησης' : 'Κίνηση του x';
  }
  uiAnim.onclick = () => { anim = !anim; uiAnim.textContent = anim ? 'Παύση κίνησης' : 'Κίνηση του x'; buildPanel(); };
  function syncUI() {
    uiTitle.textContent = S().title; [...uiStates.children].forEach((b, i) => b.classList.toggle('on', i === cur));
    for (const [sp, inp, q] of sliderEls) { sp.textContent = `${q.label} = ${fmt(S().P[q.key])}`; if (parseFloat(inp.value) !== S().P[q.key]) inp.value = S().P[q.key]; }
    uiInfo.innerHTML = ''; const fl = document.createElement('div'); fl.className = 'formula'; fl.textContent = lastResult.formula; uiInfo.appendChild(fl);
    for (const l of lastResult.lines) { if (!l.t) continue; const d = document.createElement('div'); d.textContent = l.t; d.style.color = HEX[l.c]; uiInfo.appendChild(d); }
    updatePanelLabels();
  }
  function setState(i) { cur = i; anim = false; buildBoard(); buildUIParams(); refresh(); buildPanel(); }

  // ------------------------------------------------------------------ Αλληλεπίδραση (ακτίνα ελεγκτή ή δείκτης)
  const raycaster = new THREE.Raycaster(); const tmpM = new THREE.Matrix4();
  function pick() { const hits = raycaster.intersectObjects(interactives.filter(m => m.parent && panel.visible), false); return hits.length ? hits[0].object : null; }
  renderer.domElement.addEventListener('pointerdown', ev => {
    if (!panel.visible || renderer.xr.isPresenting) return;
    const r = renderer.domElement.getBoundingClientRect(); const v = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(v, camera); const o = pick(); if (o) { o.userData.onClick(); }
  });
  const ctrls = [0, 1].map(i => {
    const c = renderer.xr.getController(i); scene.add(c);
    const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1.6)]), new THREE.LineBasicMaterial({ color: 0x00ACC1 })); ray.name = 'ray'; c.add(ray);
    c.addEventListener('selectstart', () => {
      if (handheld) return;
      tmpM.identity().extractRotation(c.matrixWorld); raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld); raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tmpM);
      const o = pick(); if (o) o.userData.onClick();
    });
    c.addEventListener('select', () => { if (handheld && reticle.visible) placeAtReticle(); });
    return c;
  });

  // ------------------------------------------------------------------ Συνεδρίες XR
  let handheld = false; let hitSource = null; let session = null;
  const reticle = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.08, 32).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: COL.teal })); reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);
  function placeAtReticle() {
    const p = new THREE.Vector3().setFromMatrixPosition(reticle.matrix); root.position.copy(p); root.position.y += BH * root.scale.y * 0.5 + 0.05;
    const cp = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld); root.rotation.set(0, Math.atan2(cp.x - p.x, cp.z - p.z), 0);
  }
  async function startXR(mode) {
    const ar = mode === 'ar';
    const init = ar ? { requiredFeatures: ['local'], optionalFeatures: ['hit-test', 'dom-overlay', 'hand-tracking'], domOverlay: { root: ui } } : { optionalFeatures: ['local-floor', 'hand-tracking'] };
    const s = await navigator.xr.requestSession(ar ? 'immersive-ar' : 'immersive-vr', init);
    renderer.xr.setReferenceSpaceType('local'); await renderer.xr.setSession(s); session = s;
    handheld = ar && (s.interactionMode === 'screen-space' || (s.interactionMode === undefined && /Android/.test(navigator.userAgent) && !/OculusBrowser|Quest|Magic Leap|Helio|Wolvic/i.test(navigator.userAgent)));
    scene.background = ar ? null : new THREE.Color(0xEEF2F5);
    root.rotation.set(0, 0, 0);
    if (handheld) { root.scale.setScalar(0.35); root.position.set(0, -0.05, -0.7); ui.classList.add('inxr'); }
    else { root.scale.setScalar(1); root.position.set(0, -0.1, -1.3); ui.style.display = 'none'; }
    setMode();
    if (ar && handheld) { try { const vs = await s.requestReferenceSpace('viewer'); hitSource = await s.requestHitTestSource({ space: vs }); } catch (e) { hitSource = null; } }
    s.addEventListener('end', () => { session = null; hitSource = null; reticle.visible = false; scene.background = BG; ui.style.display = ''; ui.classList.remove('inxr'); root.scale.setScalar(1); root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); handheld = false; setMode(); });
  }
  ui.addEventListener('beforexrselect', e => e.preventDefault());
  const bar = document.getElementById('ui-xr');
  async function addXRButtons() {
    if (!navigator.xr) { const n = document.createElement('span'); n.className = 'note'; n.textContent = 'Το WebXR δεν υποστηρίζεται σε αυτόν τον περιηγητή'; bar.appendChild(n); return; }
    for (const [mode, label, type] of [['ar', 'Είσοδος σε AR', 'immersive-ar'], ['vr', 'Είσοδος σε VR', 'immersive-vr']]) {
      let ok = false; try { ok = await navigator.xr.isSessionSupported(type); } catch (e) { ok = false; }
      if (!ok) continue;
      const b = document.createElement('button'); b.className = 'xr'; b.textContent = label; b.onclick = () => startXR(mode).catch(err => { console.error(err); b.textContent = 'Η συνεδρία δεν ξεκίνησε'; }); bar.appendChild(b);
    }
    const ex = document.createElement('button'); ex.textContent = 'Έξοδος'; ex.className = 'exit'; ex.onclick = () => session && session.end(); bar.appendChild(ex);
  }
  addXRButtons();

  // ------------------------------------------------------------------ Βρόχος
  const clock = new THREE.Clock(); let lastTick = 0;
  renderer.setAnimationLoop((time, frame) => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (anim) {
      const q = S().params.find(p => p.anim); if (q) {
        let v = S().P[q.key] + animDir * dt * 2.2; if (v > q.max) { v = q.max; animDir = -1; } if (v < q.min) { v = q.min; animDir = 1; }
        S().P[q.key] = Math.round(v * 20) / 20; if (time - lastTick > 40) { lastTick = time; refresh(); }
      }
    }
    if (frame && hitSource && handheld) {
      const hits = frame.getHitTestResults(hitSource); const rs = renderer.xr.getReferenceSpace();
      if (hits.length) { const pose = hits[0].getPose(rs); reticle.visible = !!pose; if (pose) reticle.matrix.fromArray(pose.transform.matrix); } else reticle.visible = false;
    }
    if (!renderer.xr.isPresenting) controls.update();
    renderer.render(scene, camera);
  });
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); setMode(); });

  function setMode() {
    const inX = renderer.xr.isPresenting;
    infoPlane.visible = (inX && !handheld) || forcePanel;
    panel.visible = (inX && !handheld) || forcePanel;
    if (!inX) {
      const W = window.innerWidth, H = window.innerHeight; const portrait = H > W;
      camera.setViewOffset(W, H, 0, Math.round(H * (portrait ? 0.14 : 0.19)), W, H);
      const dist = Math.max(1.15, 0.92 / (2 * Math.tan(25 * PI / 180) * (W / H)));   // ο πίνακας χωράει και σε κατακόρυφο προσανατολισμό
      camera.position.set(0, 0.02, dist); controls.target.set(0, -0.02, 0); controls.update();
    } else camera.clearViewOffset();
  }
  setMode();
  setState(0);
  // βοηθητικά για αυτοματοποιημένο έλεγχο
  window.__asy = {
    setState, states: STATES, refresh, getResult: () => lastResult, interactives, camera, panel, root, dyn, THREE,
    setParam(key, v) { S().P[key] = v; refresh(); updatePanelLabels(); },
    click(label, idx = 0) { const m = interactives.filter(x => x.parent && x.userData.label === label)[idx]; if (m) m.userData.onClick(); return !!m; },
    screenPos(mesh) { const v = mesh.getWorldPosition(new THREE.Vector3()).project(camera); const r = renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; },
    checkFinite() { let bad = 0; root.traverse(o => { if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { bad++; break; } } if (!Number.isFinite(o.position.x + o.position.y + o.position.z)) bad++; }); return bad; },
    cur: () => cur, setAnim: v => { anim = v; buildPanel(); }, animOn: () => anim,
  };
}
