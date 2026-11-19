// Μιγαδικοί αριθμοί: σκηνή WebXR για Magic Leap 2, Meta Quest 3 και tablet Samsung (Maths---AR)
// Οι 6 καταστάσεις αντιστοιχούν στα αρχεία GeoGebra «Μιγαδικοί αριθμοί» (ίδια χρώματα και ίδια κείμενα).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COL = { blue: 0x1565C0, red: 0xC62828, green: 0x2E7D32, purple: 0x6A1B9A, orange: 0xEF6C00, teal: 0x00838F, navy: 0x1A237E, gray: 0x37474F };
const HEX = k => '#' + COL[k].toString(16).padStart(6, '0');
const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',').replace('-', '−');
const PI = Math.PI;

// ------------------------------------------------------------------ Καταστάσεις (μαθηματικό περιεχόμενο)
const D2R = PI / 180;
const fz = (a, b) => `${fmt(a)} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}i`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const piFr = deg => { const d0 = Math.round(deg); const g = gcd(d0, 180) || 180; const n = d0 / g, d = 180 / g; if (n === 0) return '0'; const num = n === 1 ? 'π' : `${n}π`; return d === 1 ? num : (n === 1 ? `π/${d}` : `${n}π/${d}`); };
const argDeg = (a, b) => Math.atan2(b, a) / D2R;
const mod360 = x => ((x % 360) + 360) % 360;
const cmul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = n => String(n).split('').map(c => SUPD[c] || c).join('');
const WH = 16 / 9;
const view = w => [-w / 2, w / 2, -w / 2 / WH, w / 2 / WH];

const STATES = [
  {
    id: 'epipedo', short: 'Επίπεδο', title: 'Ο μιγαδικός αριθμός και το μιγαδικό επίπεδο', view: view(10), grid: 1, tick: 1,
    params: [
      { key: 'a', label: 'Re z = α', min: -4, max: 4, step: 0.5, val: 3 },
      { key: 'b', label: 'Im z = β', min: -2.5, max: 2.5, step: 0.5, val: 2 },
    ],
    compute(p) {
      const { a, b } = p; const m = Math.hypot(a, b);
      const kind = b === 0 ? (a === 0 ? 'Το z είναι το 0' : 'Το z είναι πραγματικός αριθμός') : a === 0 ? 'Το z είναι φανταστικός αριθμός' : 'Το z είναι μη πραγματικός αριθμός';
      return {
        formula: 'z = α + βi',
        points: [{ x: a, y: b, color: 'blue', r: 0.012, label: 'z' }, { x: a, y: -b, color: 'red', r: 0.01, label: 'z̄' }, { x: a, y: 0, color: 'orange', r: 0.007 }, { x: 0, y: b, color: 'orange', r: 0.007 }],
        vecs: [{ x1: 0, y1: 0, x2: a, y2: b, color: 'blue' }],
        segs: [{ x1: a, y1: b, x2: a, y2: 0, color: 'gray', dash: true }, { x1: a, y1: b, x2: 0, y2: b, color: 'gray', dash: true }, { x1: a, y1: b, x2: a, y2: -b, color: 'red', dash: true }],
        lines: [
          { t: `z = α + βi = ${fz(a, b)}`, c: 'blue' }, { t: `Συζυγής:  z̄ = α − βi = ${fz(a, -b)}`, c: 'red' },
          { t: `Μέτρο:  |z| = √(α² + β²) = ${fmt(m)}`, c: 'teal' }, { t: `Re z = ${fmt(a)},   Im z = ${fmt(b)}`, c: 'gray' }, { t: kind, c: 'gray' },
        ],
      };
    },
  },
  {
    id: 'praxeis', short: 'Πράξεις', title: 'Πράξεις μιγαδικών αριθμών', view: view(16), grid: 1, tick: 2,
    params: [
      { key: 'k', label: 'Πράξη (1: +,  2: −,  3: ·,  4: ÷)', min: 1, max: 4, step: 1, val: 3 },
      { key: 'a', label: 'Re z₁ = α', min: -2.5, max: 2.5, step: 0.5, val: 1 }, { key: 'b', label: 'Im z₁ = β', min: -2.5, max: 2.5, step: 0.5, val: 1 },
      { key: 'c', label: 'Re z₂ = γ', min: -2.5, max: 2.5, step: 0.5, val: 1 }, { key: 'd', label: 'Im z₂ = δ', min: -2.5, max: 2.5, step: 0.5, val: 2 },
    ],
    compute(p) {
      const { k, a, b, c, d } = p; const m2 = c * c + d * d; const op = ['+', '−', '·', '÷'][k - 1];
      let w = null;
      if (k === 1) w = [a + c, b + d]; else if (k === 2) w = [a - c, b - d]; else if (k === 3) w = [a * c - b * d, a * d + b * c]; else if (m2 > 1e-9) w = [(a * c + b * d) / m2, (b * c - a * d) / m2];
      const points = [{ x: a, y: b, color: 'blue', r: 0.012, label: 'z₁' }, { x: c, y: d, color: 'green', r: 0.012, label: 'z₂' }];
      const vecs = [{ x1: 0, y1: 0, x2: a, y2: b, color: 'blue' }, { x1: 0, y1: 0, x2: c, y2: d, color: 'green' }];
      const segs = [];
      if (w) { points.push({ x: w[0], y: w[1], color: 'purple', r: 0.014, label: 'w' }); vecs.push({ x1: 0, y1: 0, x2: w[0], y2: w[1], color: 'purple' }); }
      if (k === 1 && w) segs.push({ x1: a, y1: b, x2: w[0], y2: w[1], color: 'green', dash: true }, { x1: c, y1: d, x2: w[0], y2: w[1], color: 'blue', dash: true });
      if (k === 2) { points.push({ x: -c, y: -d, color: 'red', r: 0.01, label: '−z₂' }); segs.push({ x1: c, y1: d, x2: -c, y2: -d, color: 'red', dash: true }); if (w) segs.push({ x1: a, y1: b, x2: w[0], y2: w[1], color: 'red', dash: true }); }
      const lines = [{ t: `z₁ = ${fz(a, b)}      z₂ = ${fz(c, d)}`, c: 'blue' }];
      const names = ['z₁ + z₂', 'z₁ − z₂', 'z₁ · z₂', 'z₁ / z₂'];
      let formula = `w = ${names[k - 1]}`;
      if (!w) lines.push({ t: 'Για z₂ = 0 η διαίρεση δεν ορίζεται: διάλεξε z₂ ≠ 0', c: 'red' });
      else {
        lines.push({ t: `w = ${names[k - 1]} = ${fz(w[0], w[1])}`, c: 'purple' });
        const m1 = Math.hypot(a, b), m2s = Math.hypot(c, d);
        if (k === 3) lines.push({ t: `|z₁|·|z₂| = ${fmt(m1)} · ${fmt(m2s)} = ${fmt(m1 * m2s)} = |w|    (το μέτρο του γινομένου)`, c: 'teal' });
        else if (k === 4) lines.push({ t: `|z₁|/|z₂| = ${fmt(m1 / m2s)} = |w|    (το μέτρο του πηλίκου)`, c: 'teal' });
        else lines.push({ t: `Κανόνας του παραλληλογράμμου: οι διακεκομμένες πλευρές δείχνουν το ${op === '+' ? 'άθροισμα' : 'z₁ + (−z₂)'}`, c: 'gray' });
        if (!inRect(w, view(16))) lines.push({ t: 'Το w βγαίνει εκτός του πίνακα: μίκρυνε τις τιμές', c: 'red' });
      }
      if (k === 4 && w) lines.push({ t: 'z₁/z₂ = z₁·z̄₂ / |z₂|²  (πολλαπλασιάζουμε με τον συζυγή του παρονομαστή)', c: 'gray' });
      return { formula, points, vecs, segs, lines };
    },
  },
  {
    id: 'trigon', short: 'Έλικα', title: 'Τριγωνομετρική μορφή και έλικα e^(iθ)', view: view(8), grid: 1, tick: 1,
    params: [
      { key: 'r', label: 'Μέτρο r', min: 0.5, max: 2, step: 0.25, val: 1.5 },
      { key: 'th', label: 'Όρισμα θ (σε μοίρες)', min: 0, max: 360, step: 15, val: 60, anim: true },
    ],
    compute(p) {
      const { r, th } = p; const t = th * D2R; const x = r * Math.cos(t), y = r * Math.sin(t);
      const arc = [], helix = []; const n = Math.max(2, Math.round(th / 4));
      for (let i = 0; i <= n; i++) { const f = t * i / n; arc.push([0.45 * Math.cos(f), 0.45 * Math.sin(f), 0]); helix.push([r * Math.cos(f), r * Math.sin(f), (f / (2 * PI)) * 0.2]); }
      return {
        formula: 'z = r(συν θ + i ημ θ) = r·e^(iθ)',
        circles: [{ cx: 0, cy: 0, r, color: 'gray' }],
        points: [{ x, y, color: 'blue', r: 0.012, label: 'z' }, { x: r, y: 0, color: 'orange', r: 0.008 }, { x, y, z: (t / (2 * PI)) * 0.2, color: 'orange', r: 0.012, label: 'e^(iθ) στην έλικα' }],
        vecs: [{ x1: 0, y1: 0, x2: x, y2: y, color: 'blue' }],
        segs: [{ x1: x, y1: y, x2: x, y2: 0, color: 'gray', dash: true }, { x1: x, y1: y, x2: 0, y2: y, color: 'gray', dash: true },
          { x1: x, y1: y, z1: 0, x2: x, y2: y, z2: (t / (2 * PI)) * 0.2, color: 'orange', dash: true }],
        polys: [{ pts: arc, color: 'orange' }, { pts: helix, color: 'purple' }],
        lines: [
          { t: `r = ${fmt(r)},   θ = ${fmt(th)}° = ${piFr(th)}`, c: 'orange' },
          { t: `α = r·συν θ = ${fmt(x)},   β = r·ημ θ = ${fmt(y)}`, c: 'gray' },
          { t: `z = ${fz(x, y)}`, c: 'blue' },
          { t: `Η έλικα: το ύψος είναι ανάλογο του θ, η προβολή της στο επίπεδο είναι ο κύκλος |z| = r`, c: 'purple' },
        ],
      };
    },
  },
  {
    id: 'demoivre', short: 'De Moivre', title: 'Ο τύπος De Moivre', view: view(8), grid: 1, tick: 1,
    params: [
      { key: 'r', label: 'Μέτρο r', min: 0.6, max: 1.6, step: 0.1, val: 1.1 },
      { key: 'th', label: 'Όρισμα θ (σε μοίρες)', min: 0, max: 360, step: 5, val: 30, anim: true },
      { key: 'nu', label: 'Εκθέτης ν', min: 1, max: 12, step: 1, val: 6 },
    ],
    compute(p) {
      const { r, th, nu } = p; const pts = [], spiral = [[0, 0, 0]];
      for (let k = 1; k <= nu; k++) { const m = r ** k, a = k * th * D2R; const x = m * Math.cos(a), y = m * Math.sin(a); spiral.push([x, y, 0]); pts.push({ x, y, color: k === nu ? 'orange' : k === 1 ? 'blue' : 'purple', r: k === nu ? 0.014 : 0.009, label: k === 1 ? 'z' : k === nu ? `z${sup(nu)}` : '' }); }
      const mN = r ** nu, aN = nu * th, x = mN * Math.cos(aN * D2R), y = mN * Math.sin(aN * D2R);
      const lines = [
        { t: `z = ${fmt(r)}(συν ${fmt(th)}° + i ημ ${fmt(th)}°)`, c: 'blue' },
        { t: `zν = rν (συν νθ + i ημ νθ)   με  ν = ${nu}`, c: 'orange' },
        { t: `|zν| = rν = ${fmt(mN)}      νθ = ${fmt(aN)}° ≡ ${fmt(mod360(aN))}°`, c: 'teal' },
        { t: `zν = ${fz(x, y)}`, c: 'purple' },
      ];
      if (!inRect([x, y], view(8))) lines.push({ t: 'Το zν βγαίνει εκτός του πίνακα (μέτρο μεγαλύτερο από 4): μίκρυνε το r ή το ν', c: 'red' });
      return { formula: 'zν = rν(συν νθ + i ημ νθ)', circles: [{ cx: 0, cy: 0, r: 1, color: 'gray' }], points: pts, polys: [{ pts: spiral, color: 'purple' }], vecs: [], segs: [], lines };
    },
  },
  {
    id: 'rizes', short: 'Ρίζες', title: 'Οι νιοστές ρίζες μιγαδικού αριθμού', view: [-3.2, 3.2, -1.8, 1.8], grid: 0.5, tick: 1,
    params: [
      { key: 'n', label: 'Τάξη ρίζας ν', min: 2, max: 12, step: 1, val: 5 },
      { key: 'r', label: 'Μέτρο r του w', min: 0.25, max: 2, step: 0.25, val: 1 },
      { key: 'th', label: 'Όρισμα θ του w (σε μοίρες)', min: 0, max: 360, step: 15, val: 0, anim: true },
    ],
    compute(p) {
      const { n, r, th } = p; const rho = r ** (1 / n); const roots = []; let prod = [1, 0], sum = [0, 0];
      for (let k = 0; k < n; k++) { const a = (th + 360 * k) / n * D2R; const q = [rho * Math.cos(a), rho * Math.sin(a)]; roots.push(q); prod = cmul(prod, q); sum = [sum[0] + q[0], sum[1] + q[1]]; }
      const wx = r * Math.cos(th * D2R), wy = r * Math.sin(th * D2R);
      const points = roots.map((q, k) => ({ x: q[0], y: q[1], color: k === 0 ? 'orange' : 'purple', r: k === 0 ? 0.013 : 0.011, label: k === 0 ? 'ρ₀' : '' }));
      points.push({ x: wx, y: wy, color: 'blue', r: 0.012, label: 'w' });
      const segs = roots.map(q => ({ x1: 0, y1: 0, x2: q[0], y2: q[1], color: 'purple', dash: true }));
      const same = Math.abs(r - 1) < 1e-9 && th === 0;
      return {
        formula: 'ρₖ = r^(1/ν)·[συν((θ + 2kπ)/ν) + i ημ((θ + 2kπ)/ν)]',
        circles: [{ cx: 0, cy: 0, r: 1, color: 'gray' }, { cx: 0, cy: 0, r: rho, color: 'purple' }],
        points, segs, polys: [{ pts: roots.map(q => [q[0], q[1], 0]).concat([[roots[0][0], roots[0][1], 0]]), color: 'purple' }], vecs: [{ x1: 0, y1: 0, x2: wx, y2: wy, color: 'blue' }],
        lines: [
          { t: `w = ${fmt(r)}(συν ${fmt(th)}° + i ημ ${fmt(th)}°) = ${fz(wx, wy)}${same ? '   (οι ρίζες της μονάδας)' : ''}`, c: 'blue' },
          { t: `Οι ${n} ρίζες έχουν μέτρο r^(1/ν) = ${fmt(rho)} και όρισμα (θ + 360°k)/ν, k = 0, …, ${n - 1}`, c: 'purple' },
          { t: `Διαδοχικές ρίζες: γωνία 360°/ν = ${fmt(360 / n)}° (κανονικό ${n}-γωνο)`, c: 'orange' },
          { t: `Άθροισμα των ριζών = ${fz(Math.abs(sum[0]) < 1e-9 ? 0 : sum[0], Math.abs(sum[1]) < 1e-9 ? 0 : sum[1])}`, c: 'teal' },
          { t: `Γινόμενο των ριζών = ${fz(prod[0], prod[1])}   (= (−1)^(ν+1)·w)`, c: 'gray' },
        ],
      };
    },
  },
  {
    id: 'rlc', short: 'RLC', title: 'Κύκλωμα RLC σε σειρά και μιγαδική εμπέδηση', view: [-12, 52, -18, 18], grid: 4, tick: 8,
    params: [
      { key: 'R', label: 'R (Ω)', min: 1, max: 20, step: 1, val: 10 }, { key: 'L', label: 'L (mH)', min: 10, max: 50, step: 1, val: 30 },
      { key: 'C', label: 'C (μF)', min: 200, max: 1000, step: 20, val: 400 }, { key: 'f', label: 'f (Hz)', min: 30, max: 100, step: 1, val: 50 },
    ],
    compute(p) {
      const { R, L, C, f } = p; const XL = 2 * PI * f * L / 1000, XC = 1 / (2 * PI * f * C / 1e6), XX = XL - XC; const mZ = Math.hypot(R, XX), phi = Math.atan2(XX, R) / D2R;
      const arc = []; const N = Math.max(2, Math.round(Math.abs(phi) / 3)); for (let i = 0; i <= N; i++) { const a = phi * D2R * i / N; arc.push([7 * Math.cos(a), 7 * Math.sin(a), 0]); }
      const f0 = 1 / (2 * PI * Math.sqrt(L / 1000 * C / 1e6));
      const lines = [
        { t: `X_L = 2πfL = ${fmt(XL)} Ω      X_C = 1/(2πfC) = ${fmt(XC)} Ω`, c: 'purple' },
        { t: `Z = ${fz(R, XX)}  (Ω)`, c: 'blue' }, { t: `|Z| = ${fmt(mZ)} Ω,   φ = Arg Z = ${fmt(phi)}°`, c: 'teal' },
        { t: `Ρεύμα για V = 230 V:  I = V/|Z| = ${fmt(230 / mZ)} A      Συχνότητα συντονισμού f₀ = ${fmt(f0)} Hz`, c: 'gray' },
        { t: Math.abs(XX) < 0.5 ? 'Συντονισμός: X ≈ 0, άρα Z ≈ R' : XX > 0 ? 'Επαγωγικό (X > 0): το ρεύμα καθυστερεί της τάσης' : 'Χωρητικό (X < 0): το ρεύμα προηγείται της τάσης', c: 'orange' },
      ];
      if (Math.abs(XX) > 17 || Math.abs(XL) > 17 || Math.abs(XC) > 17) lines.push({ t: 'Κάποιο διάνυσμα βγαίνει εκτός του πίνακα (κόβεται στο όριο)', c: 'red' });
      const cl = v => Math.max(-17.5, Math.min(17.5, v));
      return {
        formula: 'Z = R + i(X_L − X_C)',
        points: [{ x: R, y: cl(XX), color: 'blue', r: 0.013, label: 'Z' }],
        vecs: [{ x1: 0, y1: 0, x2: R, y2: cl(XX), color: 'blue' }, { x1: 0, y1: 0, x2: 0, y2: cl(XL), color: 'purple' }, { x1: 0, y1: 0, x2: 0, y2: cl(-XC), color: 'red' }],
        segs: [{ x1: 0, y1: 0, x2: R, y2: 0, color: 'green' }, { x1: R, y1: 0, x2: R, y2: cl(XX), color: 'teal' }],
        polys: Math.abs(XX) > 0.05 ? [{ pts: arc, color: 'orange' }] : [], lines,
      };
    },
  },
];
function inRect(w, v) { return w[0] >= v[0] && w[0] <= v[1] && w[1] >= v[2] && w[1] <= v[3]; }
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

  function textSprite(txt, color, h = 0.03) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    let fs = 84; g.font = `bold ${fs}px sans-serif`; while (g.measureText(txt).width > 490 && fs > 20) { fs -= 2; g.font = `bold ${fs}px sans-serif`; }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 66);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); s.scale.set(h * 4, h, 1); s.renderOrder = 10; return s;
  }
  const ZS = 1; // το ύψος z των στοιχείων δίνεται σε μέτρα
  function buildBoard() {
    while (boardGrp.children.length) { const c = boardGrp.children[0]; boardGrp.remove(c); disposeTree(c); }
    const [x0, x1, y0, y1] = S().view; const gs = S().grid || 1, ts = S().tick || 2;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 })); bg.position.z = -0.004; boardGrp.add(bg);
    boardGrp.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(BW, BH)), new THREE.LineBasicMaterial({ color: 0x90A4AE })));
    const pts = [];
    for (let x = Math.ceil(x0 / gs) * gs; x <= x1 + 1e-9; x += gs) pts.push(P3(x, y0, -0.002), P3(x, y1, -0.002));
    for (let y = Math.ceil(y0 / gs) * gs; y <= y1 + 1e-9; y += gs) pts.push(P3(x0, y, -0.002), P3(x1, y, -0.002));
    boardGrp.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xE0E6EA })));
    boardGrp.add(cylBetween(P3(x0, 0), P3(x1, 0), 0.0016, 0x263238)); boardGrp.add(cylBetween(P3(0, y0), P3(0, y1), 0.0016, 0x263238));
    const re = textSprite('Re', '#263238', 0.022); re.position.copy(P3(x1, 0).add(new THREE.Vector3(-0.025, 0.014, 0.002))); boardGrp.add(re);
    const im = textSprite('Im', '#263238', 0.022); im.position.copy(P3(0, y1).add(new THREE.Vector3(0.025, -0.012, 0.002))); boardGrp.add(im);
    for (let x = Math.ceil(x0 / ts) * ts; x <= x1 - ts * 0.5 + 1e-9; x += ts) if (Math.abs(x) > 1e-9) { const s = textSprite(fmt(x), '#455A64', 0.02); s.position.copy(P3(x, 0).add(new THREE.Vector3(0, -0.013, 0.002))); boardGrp.add(s); }
    for (let y = Math.ceil(y0 / ts) * ts; y <= y1 - ts * 0.5 + 1e-9; y += ts) if (Math.abs(y) > 1e-9) { const s = textSprite(fmt(y), '#455A64', 0.02); s.position.copy(P3(0, y).add(new THREE.Vector3(-0.022, 0, 0.002))); boardGrp.add(s); }
  }
  const clampP = (x, y) => { const v = S().view; return [Math.min(Math.max(x, v[0]), v[1]), Math.min(Math.max(y, v[2]), v[3])]; };
  function dashed(a, b, r, color) { // διακεκομμένη γραμμή από μικρούς κυλίνδρους
    const g = new THREE.Group(); const len = a.distanceTo(b); const n = Math.max(1, Math.round(len / 0.014));
    for (let i = 0; i < n; i += 2) { const p = a.clone().lerp(b, i / n), q = a.clone().lerp(b, Math.min(1, (i + 1) / n)); g.add(cylBetween(p, q, r, color)); }
    return g;
  }
  function arrow(a, b, color, r = 0.0028) {
    const g = new THREE.Group(); const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length(); if (len < 1e-5) return g;
    const hl = Math.min(0.022, len * 0.5); const stem = b.clone().sub(dir.clone().normalize().multiplyScalar(hl));
    g.add(cylBetween(a, stem, r, color));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 3, hl, 12), new THREE.MeshBasicMaterial({ color }));
    cone.position.copy(stem).add(b).multiplyScalar(0.5); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); g.add(cone); return g;
  }
  function refresh() {
    const st = S(); const r = st.compute(st.P);
    while (dyn.children.length) { const c = dyn.children[0]; dyn.remove(c); disposeTree(c); }
    for (const c of r.circles || []) {
      const pp = []; const N = 120; for (let i = 0; i <= N; i++) { const a = 2 * PI * i / N; pp.push(P3(c.cx + c.r * Math.cos(a), c.cy + c.r * Math.sin(a), 0.0005)); }
      const inside = pp.filter(q => Math.abs(q.x) <= BW / 2 && Math.abs(q.y) <= BH / 2);
      if (inside.length < pp.length) { // κόβουμε το τόξο που βγαίνει εκτός πίνακα
        let seg = []; const flush = () => { if (seg.length > 1) dyn.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seg), seg.length, 0.0017, 5, false), new THREE.MeshBasicMaterial({ color: COL[c.color] }))); seg = []; };
        for (const q of pp) { if (Math.abs(q.x) <= BW / 2 && Math.abs(q.y) <= BH / 2) seg.push(q); else flush(); } flush();
      } else dyn.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp, true), N, 0.0017, 5, true), new THREE.MeshBasicMaterial({ color: COL[c.color] })));
    }
    for (const pl of r.polys || []) {
      const pp = pl.pts.filter(q => Number.isFinite(q[0] + q[1]) && inView(q[0], q[1], 0.01)).map(q => P3(q[0], q[1], (q[2] || 0) + 0.001));
      if (pp.length > 1) dyn.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp), pp.length * 2, 0.0028, 6, false), new THREE.MeshBasicMaterial({ color: COL[pl.color] })));
    }
    for (const s of r.segs || []) {
      const [ax, ay] = clampP(s.x1, s.y1), [bx, by] = clampP(s.x2, s.y2);
      const a = P3(ax, ay, (s.z1 || 0) + 0.002), b = P3(bx, by, (s.z2 || 0) + 0.002);
      dyn.add(s.dash ? dashed(a, b, 0.0018, COL[s.color]) : cylBetween(a, b, 0.0032, COL[s.color]));
    }
    for (const v of r.vecs || []) { const [ax, ay] = clampP(v.x1, v.y1), [bx, by] = clampP(v.x2, v.y2); dyn.add(arrow(P3(ax, ay, 0.003), P3(bx, by, 0.003), COL[v.color])); }
    for (const p of r.points || []) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !inView(p.x, p.y, 0.05)) continue;
      const m = new THREE.Mesh(new THREE.SphereGeometry(p.r, 16, 12), new THREE.MeshLambertMaterial({ color: COL[p.color] })); m.position.copy(P3(p.x, p.y, (p.z || 0) + 0.006)); dyn.add(m);
      if (p.label) { const s = textSprite(p.label, HEX(p.color), 0.026); s.position.copy(P3(p.x, p.y, (p.z || 0) + 0.006)).add(new THREE.Vector3(0.026 + p.label.length * 0.004, 0.018, 0.004)); dyn.add(s); }
    }
    // κατακόρυφος άξονας θ για την έλικα
    if (st.id === 'trigon') { dyn.add(cylBetween(P3(0, 0, 0), P3(0, 0, 0.21), 0.0012, 0x263238)); const t = textSprite('θ', '#263238', 0.024); t.position.copy(P3(0, 0, 0.225)); dyn.add(t); }
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
      const w = (BW - 5 * 0.012) / 6; const b = makeButton(s.short, w, 0.05, i === cur ? HEX('navy') : '#78909C', () => setState(i));
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
    if (hasAnim) { const bt = makeButton(anim ? 'Παύση κίνησης' : 'Κίνηση', 0.3, 0.05, HEX('teal'), () => { anim = !anim; buildPanel(); }); bt.position.set(-BW / 2 + 0.15, yy, 0.002); rowsGrp.add(bt); }
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
  uiSub.textContent = 'Κέντρο Καινοτομίας Θεσσαλίας, Γ΄ Λυκείου, Μιγαδικοί αριθμοί';
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
    uiAnim.style.display = S().params.some(q => q.anim) ? '' : 'none'; uiAnim.textContent = anim ? 'Παύση κίνησης' : 'Κίνηση';
  }
  uiAnim.onclick = () => { anim = !anim; uiAnim.textContent = anim ? 'Παύση κίνησης' : 'Κίνηση'; buildPanel(); };
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
        let v = S().P[q.key] + animDir * dt * (q.max - q.min) / 9; if (v > q.max) { v = q.max; animDir = -1; } if (v < q.min) { v = q.min; animDir = 1; }
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
  setState(Math.min(Math.max(parseInt(url.searchParams.get('k') || '0', 10) || 0, 0), STATES.length - 1));
  // βοηθητικά για αυτοματοποιημένο έλεγχο
  window.__mig = {
    setState, states: STATES, refresh, getResult: () => lastResult, interactives, camera, panel, root, dyn, THREE,
    setParam(key, v) { S().P[key] = v; refresh(); updatePanelLabels(); },
    click(label, idx = 0) { const m = interactives.filter(x => x.parent && x.userData.label === label)[idx]; if (m) m.userData.onClick(); return !!m; },
    screenPos(mesh) { const v = mesh.getWorldPosition(new THREE.Vector3()).project(camera); const r = renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; },
    checkFinite() { let bad = 0; root.traverse(o => { if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) { const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { bad++; break; } } if (!Number.isFinite(o.position.x + o.position.y + o.position.z)) bad++; }); return bad; },
    cur: () => cur, setAnim: v => { anim = v; buildPanel(); }, animOn: () => anim,
  };
}
