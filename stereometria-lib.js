// Στερεομετρία: σκηνή WebXR για Magic Leap 2, Meta Quest 3 και tablet Samsung (Maths---AR)
// Οι 7 καταστάσεις αντιστοιχούν στα 7 αρχεία GeoGebra «Στερεομετρία - 01 … 07» (ίδιες παράμετροι, ίδια κείμενα, ίδια χρώματα).
// Η γεωμετρία περιγράφεται σε μαθηματικές συντεταγμένες (x, y, z) με το z κατακόρυφο· η απεικόνιση στη σκηνή γίνεται στο M().
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COL = { blue: 0x1565C0, red: 0xC62828, green: 0x2E7D32, purple: 0x6A1B9A, orange: 0xEF6C00, teal: 0x00838F, navy: 0x1A237E, gray: 0x37474F, lgray: 0x90A4AE };
const HEX = k => '#' + COL[k].toString(16).padStart(6, '0');
const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',').replace('-', '−');
const PI = Math.PI;
const K = 0.1;            // μία μονάδα της γεωμετρίας = 10 cm στη σκηνή
const EPS = 1e-4;

// ------------------------------------------------------------------ Διανυσματική άλγεβρα (μαθηματικές συντεταγμένες)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => { const l = len(a) || 1; return mul(a, 1 / l); };
// Απεικόνιση μαθηματικών συντεταγμένων σε συντεταγμένες σκηνής (y της σκηνής = z, προς τα πάνω)
const M0 = p => new THREE.Vector3(p[0], p[2], -p[1]);
const M = p => M0(p).multiplyScalar(K);
// Μοναδιαίο κάθετο στο n
function perpUnit(n) {
  const ref = Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  return norm(cross(n, ref));
}

// ------------------------------------------------------------------ Καταστάσεις (μαθηματικό περιεχόμενο)
// Κάθε κατάσταση επιστρέφει σχήματα (ops) σε μαθηματικές συντεταγμένες και κείμενα.
const STATES = [
  {
    id: 'trisimeia', short: 'Τρία σημεία', title: 'Τρία σημεία και επίπεδο', formulaTxt: 'Επίπεδο ΑΒΓ',
    params: [
      { key: 'a', label: 'Συντεταγμένη x του Γ', min: -3, max: 3, step: 0.1, val: 1 },
      { key: 'b', label: 'Συντεταγμένη y του Γ', min: -3, max: 3, step: 0.1, val: 2 },
      { key: 'c', label: 'Συντεταγμένη z του Γ', min: -3, max: 3, step: 0.1, val: 1.5 },
    ],
    compute(p) {
      const A = [0, 0, 0], B = [3, 0, 0], G = [p.a, p.b, p.c];
      const n = cross(sub(B, A), sub(G, A)); const d = len(n);
      const ops = [];
      if (d > EPS) ops.push({ t: 'plane', o: A, n, c: 'blue', op: 0.22 });
      ops.push({ t: 'seg', a: A, b: B, c: 'navy' }, { t: 'seg', a: A, b: G, c: 'orange' }, { t: 'seg', a: B, b: G, c: 'orange' });
      ops.push({ t: 'pt', p: A, c: 'navy' }, { t: 'pt', p: B, c: 'navy' }, { t: 'pt', p: G, c: 'orange', r: 0.016 });
      return {
        formula: 'Α, Β, Γ μη συνευθειακά ⇔ (ΑΒ × ΑΓ) ≠ 0',
        ops,
        lines: [
          { t: d > EPS ? 'Τα Α, Β, Γ δεν είναι συνευθειακά: ορίζουν ένα επίπεδο.' : 'Τα Α, Β, Γ είναι συνευθειακά: δεν ορίζουν επίπεδο.', c: 'gray' },
        ],
      };
    },
  },
  {
    id: 'theseis', short: 'Δύο ευθείες', title: 'Σχετική θέση δύο ευθειών', formulaTxt: 'Μικτό γινόμενο (OQ, u, v)',
    params: [
      { key: 'q1', label: 'Θέση Q: x', min: -2, max: 2, step: 0.5, val: 1 },
      { key: 'q2', label: 'Θέση Q: y', min: -2, max: 2, step: 0.5, val: 1 },
      { key: 'q3', label: 'Θέση Q: z', min: -2, max: 2, step: 0.5, val: 1 },
      { key: 'v2', label: 'Κατεύθυνση v: y', min: -2, max: 2, step: 0.5, val: 0.5 },
      { key: 'v3', label: 'Κατεύθυνση v: z', min: -2, max: 2, step: 0.5, val: 0.5 },
    ],
    compute(p) {
      const O = [0, 0, 0], u = [1, 0, 0], Q = [p.q1, p.q2, p.q3], v = [1, p.v2, p.v3];
      const n = cross(u, v); const l = len(n); const m = dot(Q, n);
      const kind = l > EPS ? (Math.abs(m) > EPS ? 'Οι ευθείες είναι ασύμβατες.' : 'Οι ευθείες τέμνονται.') : 'Οι ευθείες είναι παράλληλες ή ταυτίζονται.';
      return {
        formula: 'Μικτό γινόμενο: (OQ) · (u × v) = ' + fmt(m),
        ops: [
          { t: 'line', p: O, d: u, c: 'blue', T: 2.8 }, { t: 'line', p: Q, d: v, c: 'red', T: 2.8 },
          { t: 'pt', p: O, c: 'navy' }, { t: 'pt', p: Q, c: 'orange', r: 0.016 },
        ],
        lines: [{ t: kind, c: 'gray' }, { t: 'Μικτό γινόμενο των OQ, u, v: ' + fmt(m), c: 'gray' }],
      };
    },
  },
  {
    id: 'parallili', short: 'Παράλληλη', title: 'Ευθεία παράλληλη σε επίπεδο', formulaTxt: 'Η z συνιστώσα του u',
    params: [
      { key: 'h', label: 'Ύψος του Ρ', min: 0.5, max: 3, step: 0.1, val: 2 },
      { key: 't', label: 'z συνιστώσα του u', min: -2, max: 2, step: 0.1, val: 0 },
    ],
    compute(p) {
      const P = [1, 1, p.h], u = [1, 1, p.t];
      const par = Math.abs(p.t) < EPS;
      return {
        formula: 'u = (1, 1, ' + fmt(p.t) + ')',
        ops: [
          { t: 'plane', o: [0, 0, 0], n: [0, 0, 1], c: 'gray', op: 0.16 },
          { t: 'line', p: P, d: u, c: 'purple', T: 2.8 }, { t: 'pt', p: P, c: 'orange', r: 0.016 },
        ],
        lines: [
          { t: par ? 'Η z συνιστώσα του u είναι 0: παράλληλη στο επίπεδο.' : 'Η z συνιστώσα του u δεν είναι 0: τέμνει το επίπεδο.', c: 'gray' },
          { t: 'Ύψος του Ρ από το επίπεδο: ' + fmt(p.h), c: 'gray' },
        ],
      };
    },
  },
  {
    id: 'kathetes', short: 'Κάθετη', title: 'Ευθεία κάθετη σε επίπεδο', formulaTxt: 'u · i = 0 και u · j = 0',
    params: [
      { key: 'a', label: 'Κατεύθυνση u: x', min: -1, max: 1, step: 0.1, val: 0 },
      { key: 'b', label: 'Κατεύθυνση u: y', min: -1, max: 1, step: 0.1, val: 0 },
    ],
    compute(p) {
      const P = [2, 1, 0], u = [p.a, p.b, 1];
      const p1 = dot(u, [1, 0, 0]), p2 = dot(u, [0, 1, 0]);
      const perp = Math.abs(p1) + Math.abs(p2) < EPS;
      return {
        formula: 'u · i = ' + fmt(p1) + '   u · j = ' + fmt(p2),
        ops: [
          { t: 'plane', o: [0, 0, 0], n: [0, 0, 1], c: 'gray', op: 0.16 },
          { t: 'line', p: P, d: u, c: 'purple', T: 2.2 },
          { t: 'line', p: P, d: [1, 0, 0], c: 'blue', T: 1.2 }, { t: 'line', p: P, d: [0, 1, 0], c: 'green', T: 1.2 },
          { t: 'pt', p: P, c: 'orange', r: 0.016 },
        ],
        lines: [
          { t: perp ? 'Η d είναι κάθετη στο επίπεδο.' : 'Η d δεν είναι κάθετη στο επίπεδο.', c: 'gray' },
          { t: 'Κριτήριο: κάθετη σε δύο τεμνόμενες ευθείες του επιπέδου.', c: 'gray' },
        ],
      };
    },
  },
  {
    id: 'triwn', short: 'Τριών καθέτων', title: 'Θεώρημα των τριών καθέτων', formulaTxt: 'ΦΑ ⊥ ε ⇒ ΡΑ ⊥ ε',
    params: [
      { key: 'h', label: 'Ύψος του Ρ', min: 0.5, max: 3, step: 0.1, val: 2 },
      { key: 'p1', label: 'Σημείο Ρ: x', min: -2, max: 2, step: 0.1, val: 1 },
      { key: 'p2', label: 'Σημείο Ρ: y', min: -2, max: 2, step: 0.1, val: 0.5 },
      { key: 'a1', label: 'Σημείο Α: x', min: -2, max: 2, step: 0.1, val: -1.5 },
      { key: 'a2', label: 'Σημείο Α: y', min: -2, max: 2, step: 0.1, val: 1 },
    ],
    compute(p) {
      const P = [p.p1, p.p2, p.h], F = [p.p1, p.p2, 0], A = [p.a1, p.a2, 0];
      const w = cross(sub(A, F), [0, 0, 1]);
      const k1 = dot(sub(P, A), w), k2 = dot(sub(F, A), w);
      const ops = [{ t: 'plane', o: [0, 0, 0], n: [0, 0, 1], c: 'gray', op: 0.16 }];
      if (len(w) > EPS) ops.push({ t: 'line', p: A, d: w, c: 'purple', T: 2.6 });
      ops.push({ t: 'seg', a: P, b: A, c: 'orange' }, { t: 'seg', a: P, b: F, c: 'gray' }, { t: 'seg', a: F, b: A, c: 'teal' });
      ops.push({ t: 'pt', p: P, c: 'orange', r: 0.016 }, { t: 'pt', p: F, c: 'navy' }, { t: 'pt', p: A, c: 'teal' });
      return {
        formula: 'ΡΑ · ε = ' + fmt(k1) + '   ΦΑ · ε = ' + fmt(k2),
        ops,
        lines: [
          { t: 'Η ΦΑ κάθετη στην ε, άρα και η ΡΑ κάθετη στην ε.', c: 'gray' },
          { t: 'Εσωτερικό γινόμενο ΡΑ με ε: ' + fmt(k1) + '   ΦΑ με ε: ' + fmt(k2), c: 'gray' },
        ],
      };
    },
  },
  {
    id: 'dieidri', short: 'Δίεδρη γωνία', title: 'Δίεδρη γωνία', formulaTxt: 'Επίπεδη γωνία ΑΟΒ = φ',
    params: [
      { key: 'phi', label: 'Δίεδρη γωνία φ (μοίρες)', min: 10, max: 170, step: 1, val: 70 },
    ],
    compute(p) {
      const r = p.phi * PI / 180, c = Math.cos(r), s = Math.sin(r);
      const ops = [
        { t: 'line', p: [0, 0, 0], d: [1, 0, 0], c: 'orange', T: 2.6 },
        { t: 'poly', pts: [[-2, 0, 0], [2, 0, 0], [2, 2, 0], [-2, 2, 0]], c: 'blue', op: 0.22 },
        { t: 'poly', pts: [[-2, 0, 0], [2, 0, 0], [2, 2 * c, 2 * s], [-2, 2 * c, 2 * s]], c: 'green', op: 0.22 },
        { t: 'seg', a: [0, 0, 0], b: [0, 1, 0], c: 'blue' }, { t: 'seg', a: [0, 0, 0], b: [0, c, s], c: 'green' },
        { t: 'arc', o: [0, 0, 0], u: [0, 1, 0], v: [0, 0, 1], R: 0.8, angle: r, c: 'purple' },
        { t: 'pt', p: [0, 0, 0], c: 'navy' },
      ];
      return {
        formula: 'Δίεδρη γωνία φ = ' + fmt(p.phi) + '°',
        ops,
        lines: [
          { t: 'Δίεδρη γωνία φ = ' + fmt(p.phi) + '°', c: 'gray' },
          { t: 'Επίπεδη γωνία ΑΟΒ της δίεδρης: ' + fmt(p.phi) + '°', c: 'gray' },
        ],
      };
    },
  },
  {
    id: 'kathetes-epipeda', short: 'Κάθετα επίπεδα', title: 'Κάθετα επίπεδα', formulaTxt: 'n₁ · n₂ = 0',
    params: [
      { key: 'a1', label: 'n₁: x', min: -2, max: 2, step: 0.1, val: 1 },
      { key: 'a2', label: 'n₁: y', min: -2, max: 2, step: 0.1, val: 0.5 },
      { key: 'a3', label: 'n₁: z', min: -2, max: 2, step: 0.1, val: 1 },
      { key: 'b1', label: 'n₂: x', min: -2, max: 2, step: 0.1, val: 1 },
      { key: 'b2', label: 'n₂: y', min: -2, max: 2, step: 0.1, val: 0 },
      { key: 'b3', label: 'n₂: z', min: -2, max: 2, step: 0.1, val: -1 },
    ],
    compute(p) {
      const n1 = [p.a1, p.a2, p.a3], n2 = [p.b1, p.b2, p.b3];
      const pr = dot(n1, n2);
      const ops = [];
      if (len(n1) > EPS) { ops.push({ t: 'plane', o: [0, 0, 0], n: n1, c: 'blue', op: 0.25 }); ops.push({ t: 'seg', a: [0, 0, 0], b: n1, c: 'blue' }); }
      if (len(n2) > EPS) { ops.push({ t: 'plane', o: [0, 0, 0], n: n2, c: 'green', op: 0.25 }); ops.push({ t: 'seg', a: [0, 0, 0], b: n2, c: 'green' }); }
      ops.push({ t: 'pt', p: [0, 0, 0], c: 'navy' });
      return {
        formula: 'n₁ · n₂ = ' + fmt(pr),
        ops,
        lines: [
          { t: Math.abs(pr) < EPS ? 'Τα επίπεδα είναι κάθετα: κάθετα και τα διανύσματά τους.' : 'Τα επίπεδα δεν είναι κάθετα.', c: 'gray' },
          { t: 'Εσωτερικό γινόμενο των διανυσμάτων: ' + fmt(pr), c: 'gray' },
        ],
      };
    },
  },
];

// ------------------------------------------------------------------ Βοηθητικά γραφικά
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
    const n = Math.max(1, lines.length); const lh = pxH / n;
    lines.forEach((ln, i) => {
      let fs = Math.min(opts.maxFont || 40, lh * 0.72);
      g.font = `${ln.bold === false ? '' : 'bold '}${fs}px sans-serif`;
      while (g.measureText(ln.t).width > pxW - 24 && fs > 12) { fs -= 1; g.font = `${ln.bold === false ? '' : 'bold '}${fs}px sans-serif`; }
      g.fillStyle = HEX[ln.c] || ln.c || '#37474F'; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.fillText(ln.t, 12, lh * (i + 0.5));
    });
    tex.needsUpdate = true;
  };
  return mesh;
}
function cylBetween(a, b, r, color, opacity = 1) {
  const dir = new THREE.Vector3().subVectors(b, a); const L = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.max(L, 1e-6), 8, 1), new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}
function disposeTree(o) { o.traverse(ch => { if (ch.geometry) ch.geometry.dispose(); if (ch.material) ch.material.dispose(); }); }

// Σχήματα σε μαθηματικές συντεταγμένες → σκηνή
function buildOps(ops, grp) {
  for (const o of ops) {
    if (o.t === 'pt') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(o.r || 0.012, 16, 12), new THREE.MeshLambertMaterial({ color: COL[o.c] }));
      m.position.copy(M(o.p)); grp.add(m);
    } else if (o.t === 'seg') {
      grp.add(cylBetween(M(o.a), M(o.b), o.r || 0.0035, COL[o.c]));
    } else if (o.t === 'line') {
      const d = norm(o.d); const T = o.T || 3;
      grp.add(cylBetween(M(add(o.p, mul(d, -T))), M(add(o.p, mul(d, T))), 0.0035, COL[o.c]));
    } else if (o.t === 'plane') {
      const n = norm(o.n); const u = perpUnit(n); const v = cross(n, u);
      const h = 2.6 * K;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2 * h, 2 * h), new THREE.MeshBasicMaterial({ color: COL[o.c], transparent: true, opacity: o.op ?? 0.2, side: THREE.DoubleSide, depthWrite: false }));
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(M0(u), M0(v), M0(n)));
      mesh.position.copy(M(o.o)); grp.add(mesh);
    } else if (o.t === 'poly') {
      const pos = []; o.pts.forEach(p => { const q = M(p); pos.push(q.x, q.y, q.z); });
      const idx = []; for (let i = 1; i < o.pts.length - 1; i++) idx.push(0, i, i + 1);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      grp.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COL[o.c], transparent: true, opacity: o.op ?? 0.2, side: THREE.DoubleSide, depthWrite: false })));
    } else if (o.t === 'arc') {
      const pts = []; const N = 36;
      for (let i = 0; i <= N; i++) { const t = o.angle * i / N; pts.push(M(add(o.o, add(mul(o.u, o.R * Math.cos(t)), mul(o.v, o.R * Math.sin(t)))))); }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
      grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, N, 0.0045, 6, false), new THREE.MeshBasicMaterial({ color: COL[o.c] })));
    }
  }
}

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
  const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, 0, 0); controls.enableDamping = true; controls.minDistance = 0.5; controls.maxDistance = 3; controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2)); const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(0.5, 1, 1); scene.add(dl);

  const root = new THREE.Group(); root.scale.setScalar(1.6); scene.add(root);
  const axesGrp = new THREE.Group(); root.add(axesGrp);       // άξονες (σταθεροί)
  const dyn = new THREE.Group(); root.add(dyn);                // δυναμικά σχήματα
  const panel = new THREE.Group(); root.add(panel);            // 3D πίνακας ελέγχου για τα γυαλιά
  const interactives = [];

  const titlePlane = makeTextPlane(0.36, 0.05, 1600, 220); titlePlane.position.set(0, 0.43, 0); root.add(titlePlane);
  const infoPlane = makeTextPlane(0.36, 0.13, 1600, 520); infoPlane.position.set(0, -0.4, 0); root.add(infoPlane);

  let cur = 0;
  const S = () => STATES[cur];

  function buildAxes() {
    while (axesGrp.children.length) { const c = axesGrp.children[0]; axesGrp.remove(c); disposeTree(c); }
    const ax = [[[-3.2, 0, 0], [3.2, 0, 0], 'x'], [[0, -3.2, 0], [0, 3.2, 0], 'y'], [[0, 0, -0.5], [0, 0, 3.2], 'z']];
    for (const [a, b, name] of ax) {
      axesGrp.add(cylBetween(M(a), M(b), 0.0016, 0x263238));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(name, '#263238', 56), depthTest: false }));
      s.scale.set(0.03, 0.015, 1); s.position.copy(M(add(b, mul(norm(sub(b, a)), 0.25)))); axesGrp.add(s);
    }
  }

  function refresh() {
    const st = S(); const r = st.compute(st.P);
    while (dyn.children.length) { const c = dyn.children[0]; dyn.remove(c); disposeTree(c); }
    buildOps(r.ops, dyn);
    titlePlane.userData.draw([{ t: `${st.title}`, c: 'navy' }], { maxFont: 64 });
    infoPlane.userData.draw([{ t: r.formula, c: 'navy', bold: true }, ...r.lines.filter(l => l.t)], { maxFont: 40 });
    lastResult = r; syncUI();
  }
  let lastResult = null;

  // ------------------------------------------------------------------ 3D πίνακας ελέγχου (γυαλιά)
  const rowsGrp = new THREE.Group(); panel.add(rowsGrp);
  function makeButton(label, w, h, bg, onClick, fg = '#ffffff') {
    const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
    const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    let fs = c.height * 0.5; g.font = `bold ${fs}px sans-serif`; while (g.measureText(label).width > c.width - 16 && fs > 10) { fs -= 1; g.font = `bold ${fs}px sans-serif`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, c.width / 2, c.height / 2 + 2);
    mesh.material.map.colorSpace = THREE.SRGBColorSpace; mesh.material.map.needsUpdate = true;
    mesh.userData = { onClick, label };
    interactives.push(mesh); return mesh;
  }
  function stepParam(q, dir) {
    const st = S(); let v = st.P[q.key];
    v = Math.min(q.max, Math.max(q.min, Math.round((v + dir * q.step) / q.step) * q.step));
    st.P[q.key] = Math.round(v * 1000) / 1000; refresh();
  }
  const PW = 0.36;
  function buildPanel() {
    while (rowsGrp.children.length) { const c = rowsGrp.children[0]; rowsGrp.remove(c); const i = interactives.indexOf(c); if (i >= 0) interactives.splice(i, 1); disposeTree(c); }
    const y0 = -0.42;
    const w = (PW - 6 * 0.008) / 7;
    STATES.forEach((s, i) => {
      const b = makeButton(s.short, w, 0.05, i === cur ? HEX('navy') : '#78909C', () => setState(i));
      b.position.set(-PW / 2 + w / 2 + i * (w + 0.008), y0 - 0.1, 0.002); rowsGrp.add(b);
    });
    let yy = y0 - 0.16;
    S().params.forEach(q => {
      const lab = makeTextPlane(0.26, 0.04, 1040, 100); lab.position.set(-PW / 2 + 0.13, yy, 0.002); rowsGrp.add(lab); rowLabels.push([lab, q]);
      const mi = makeButton('−', 0.04, 0.04, HEX('orange'), () => stepParam(q, -1)); mi.position.set(PW / 2 - 0.1, yy, 0.002); rowsGrp.add(mi);
      const pl = makeButton('+', 0.04, 0.04, HEX('orange'), () => stepParam(q, +1)); pl.position.set(PW / 2 - 0.04, yy, 0.002); rowsGrp.add(pl);
      yy -= 0.05;
    });
    updatePanelLabels();
  }
  const rowLabels = [];
  function updatePanelLabels() {
    for (const [lab, q] of rowLabels) lab.userData.draw([{ t: `${q.label} = ${fmt(S().P[q.key])}`, c: 'orange' }], { maxFont: 40 });
  }

  // ------------------------------------------------------------------ Περιβάλλον DOM (υπολογιστής και tablet)
  const ui = document.getElementById('ui');
  const uiTitle = ui.querySelector('#ui-title'), uiSub = ui.querySelector('#ui-sub'), uiStates = ui.querySelector('#ui-states'), uiParams = ui.querySelector('#ui-params'), uiInfo = ui.querySelector('#ui-info');
  uiSub.textContent = 'Κέντρο Καινοτομίας Θεσσαλίας, Μαθηματικά Α΄ Λυκείου, Στερεομετρία';
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
  }
  function syncUI() {
    uiTitle.textContent = S().title; [...uiStates.children].forEach((b, i) => b.classList.toggle('on', i === cur));
    for (const [sp, inp, q] of sliderEls) { sp.textContent = `${q.label} = ${fmt(S().P[q.key])}`; if (parseFloat(inp.value) !== S().P[q.key]) inp.value = S().P[q.key]; }
    uiInfo.innerHTML = ''; const fl = document.createElement('div'); fl.className = 'formula'; fl.textContent = lastResult.formula; uiInfo.appendChild(fl);
    for (const l of lastResult.lines) { if (!l.t) continue; const d = document.createElement('div'); d.textContent = l.t; d.style.color = HEX[l.c]; uiInfo.appendChild(d); }
    updatePanelLabels();
  }
  function setState(i) { cur = i; buildUIParams(); refresh(); buildPanel(); }

  // ------------------------------------------------------------------ Αλληλεπίδραση (ακτίνα ελεγκτή ή δείκτης)
  const raycaster = new THREE.Raycaster(); const tmpM = new THREE.Matrix4();
  function pick() { const hits = raycaster.intersectObjects(interactives.filter(m => m.parent && panel.visible), false); return hits.length ? hits[0].object : null; }
  renderer.domElement.addEventListener('pointerdown', ev => {
    if (!panel.visible || renderer.xr.isPresenting) return;
    const r = renderer.domElement.getBoundingClientRect(); const v = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(v, camera); const o = pick(); if (o) o.userData.onClick();
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
    const p = new THREE.Vector3().setFromMatrixPosition(reticle.matrix); root.position.copy(p); root.position.y += 0.2 * root.scale.y;
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
    if (handheld) { root.scale.setScalar(1.6); root.position.set(0, -0.05, -0.7); ui.classList.add('inxr'); }
    else { root.scale.setScalar(1.6); root.position.set(0, -0.1, -1.3); ui.style.display = 'none'; }
    setMode();
    if (ar && handheld) { try { const vs = await s.requestReferenceSpace('viewer'); hitSource = await s.requestHitTestSource({ space: vs }); } catch (e) { hitSource = null; } }
    s.addEventListener('end', () => { session = null; hitSource = null; reticle.visible = false; scene.background = BG; ui.style.display = ''; ui.classList.remove('inxr'); root.scale.setScalar(1.6); root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); handheld = false; setMode(); });
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
  renderer.setAnimationLoop((time, frame) => {
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
      const dist = 1.3 * Math.max(1.15, 0.92 / (2 * Math.tan(25 * PI / 180) * (W / H)));
      camera.position.set(dist * 0.3, dist * 0.55, dist * 0.78); controls.target.set(0, 0.04, 0); controls.update();   // λοξή θέαση: το οριζόντιο επίπεδο φαίνεται
    } else camera.clearViewOffset();
  }

  buildAxes();
  for (const st of STATES) st.P = Object.fromEntries(st.params.map(q => [q.key, q.val]));
  setMode();
  setState(0);

  // βοηθητικά για αυτοματοποιημένο έλεγχο
  window.__ster = {
    setState, states: STATES, refresh, getResult: () => lastResult, interactives, camera, panel, root, dyn, THREE,
    setParam(key, v) { S().P[key] = v; refresh(); updatePanelLabels(); },
    click(label, idx = 0) { const m = interactives.filter(x => x.parent && x.userData.label === label)[idx]; if (m) m.userData.onClick(); return !!m; },
    cur: () => cur,
  };
}
