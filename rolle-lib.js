// Θεώρημα Rolle: σκηνή three.js για τη σελίδα Maths - AR (Magic Leap 2, Meta Quest 3, tablet Samsung).
// Τέσσερις καταστάσεις, ίδιες με τις εφαρμογές GeoGebra του σεναρίου 46:
//   0 Γεωμετρική ερμηνεία, 1 Υποθέσεις και αντιπαραδείγματα, 2 Πλήθος ριζών εξίσωσης, 3 Ρίζες της f και της f΄.
import * as THREE from "three";

export const S = 0.0375;            // μέτρα ανά μονάδα του γραφήματος (πίνακας 48 × 30 cm)
export const BOARD_W = 0.48, BOARD_H = 0.30;
const XMAX = 6.4, YMAX = 4.0;
const ZC = 0.008;                   // ύψος των καμπυλών πάνω από την επιφάνεια του πίνακα

export const COL = {
  navy: 0x1f3863, blue: 0x1a409e, lblue: 0x9eb8e6, red: 0xcc1f1f, green: 0x14803d,
  orange: 0xe6730d, gray: 0x595959,
};
const css = (c) => "#" + c.toString(16).padStart(6, "0");

// Ελληνική υποδιαστολή και πραγματικό σύμβολο μείον
export function fmt(x, d = 2) {
  const f = 10 ** d;
  let v = Math.round(x * f) / f;
  if (Object.is(v, -0) || v === 0) v = 0;
  return String(v).replace(".", ",").replace("-", "−");
}

// ---------------------------------------------------------------------------
// Ταινία (στερεό με πάχος) κατά μήκος μιας πολυγωνικής γραμμής, με μεταβλητό πλήθος σημείων
// ---------------------------------------------------------------------------
class Ribbon {
  constructor(capacity, width, thickness, color, z = ZC) {
    this.cap = capacity; this.w = width; this.t = thickness; this.z = z;
    this.pos = new Float32Array(capacity * 4 * 3);
    this.idx = new Uint32Array(capacity * 4 * 6);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.geo.setIndex(new THREE.BufferAttribute(this.idx, 1));
    this.mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
  }
  // pts: πίνακας από [x, y] (μονάδες γραφήματος) ή null για διακοπή
  set(pts) {
    const n = Math.min(pts.length, this.cap);
    const hw = this.w / 2, ht = this.t / 2;
    let ni = 0;
    // κανονικά διανύσματα ανά σημείο (miter)
    const nrm = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (!p) continue;
      const a = i > 0 && pts[i - 1] ? pts[i - 1] : null;
      const b = i < n - 1 && pts[i + 1] ? pts[i + 1] : null;
      const seg = (u, v) => { const dx = (v[0] - u[0]) * S, dy = (v[1] - u[1]) * S, l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
      let nx = 0, ny = 0;
      if (a) { const s = seg(a, p); nx += s[0]; ny += s[1]; }
      if (b) { const s = seg(p, b); nx += s[0]; ny += s[1]; }
      let l = Math.hypot(nx, ny);
      if (l < 1e-6) { nx = 0; ny = 1; l = 1; }
      nx /= l; ny /= l;
      let k = 1;
      if (a && b) { const s1 = seg(a, p), dot = Math.max(0.5, nx * s1[0] + ny * s1[1]); k = Math.min(2, 1 / dot); }
      nrm[i] = [nx * k, ny * k];
    }
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const o = i * 12;
      if (!p) { for (let j = 0; j < 12; j++) this.pos[o + j] = 0; continue; }
      const [nx, ny] = nrm[i];
      const X = p[0] * S, Y = p[1] * S;
      const corners = [[hw, ht], [-hw, ht], [-hw, -ht], [hw, -ht]];
      for (let c = 0; c < 4; c++) {
        this.pos[o + c * 3] = X + nx * corners[c][0];
        this.pos[o + c * 3 + 1] = Y + ny * corners[c][0];
        this.pos[o + c * 3 + 2] = this.z + corners[c][1];
      }
    }
    for (let i = 0; i < n - 1; i++) {
      if (!pts[i] || !pts[i + 1]) continue;
      const A = i * 4, B = (i + 1) * 4;
      for (let c = 0; c < 4; c++) {
        const c2 = (c + 1) % 4;
        // δύο τρίγωνα ανά πλευρά
        this.idx[ni++] = A + c; this.idx[ni++] = B + c; this.idx[ni++] = B + c2;
        this.idx[ni++] = A + c; this.idx[ni++] = B + c2; this.idx[ni++] = A + c2;
      }
    }
    this.geo.setDrawRange(0, ni);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.index.needsUpdate = true;
    this.geo.computeBoundingSphere();
  }
  clear() { this.geo.setDrawRange(0, 0); }
}

function dashed(a, b, dash = 0.28, gap = 0.2) {
  const out = [];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L < 1e-9) return out;
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  for (let s = 0; s < L; s += dash + gap) {
    const e = Math.min(s + dash, L);
    out.push([a[0] + ux * s, a[1] + uy * s], [a[0] + ux * e, a[1] + uy * e], null);
  }
  return out;
}

// Δειγματοληψία συνάρτησης με αποκοπή στο πλαίσιο του πίνακα και διακοπή στις ασυνέχειες
function sample(fn, x0, x1, n = 160) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = fn(x);
    if (y === null || !isFinite(y) || Math.abs(y) > YMAX - 0.1) pts.push(null);
    else pts.push([x, y]);
  }
  return pts;
}

function sphere(color, r = 0.0048) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.05 }));
  m.position.z = ZC + 0.002;
  return m;
}
function ring(color, r = 0.0052) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0016, 10, 28),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
  m.position.z = ZC + 0.002;
  return m;
}
// Περιορίζει το μήκος της εφαπτομένης ώστε να μένει μέσα στον πίνακα.
function fitTangent(tangent, y, slope, half) {
  const sin = Math.abs(slope) / Math.sqrt(1 + slope * slope);
  const lim = sin > 1e-6 ? (YMAX - 0.08 - Math.abs(y)) / (half * sin) : 1;
  tangent.scale.y = Math.max(0.12, Math.min(1, lim));
}
const place = (m, x, y) => { m.position.x = x * S; m.position.y = y * S; };

// ---------------------------------------------------------------------------
// Πίνακας, βάση και πίνακας κειμένου
// ---------------------------------------------------------------------------
function boardTexture() {
  const W = 1920, H = 1200, u = W / (2 * XMAX), cx = W / 2, cy = H / 2;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#fbfbf8"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#dcdce0"; g.lineWidth = 2;
  for (let x = -6; x <= 6; x++) { g.beginPath(); g.moveTo(cx + x * u, 0); g.lineTo(cx + x * u, H); g.stroke(); }
  for (let y = -4; y <= 4; y++) { g.beginPath(); g.moveTo(0, cy - y * u); g.lineTo(W, cy - y * u); g.stroke(); }
  g.strokeStyle = "#2b2b2f"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, cy); g.lineTo(W, cy); g.stroke();
  g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, H); g.stroke();
  g.fillStyle = "#2b2b2f"; g.font = "30px Arial, sans-serif"; g.textAlign = "center";
  for (let x = -6; x <= 6; x++) if (x !== 0) g.fillText(String(x).replace("-", "−"), cx + x * u, cy + 38);
  g.textAlign = "right";
  for (let y = -3; y <= 3; y++) if (y !== 0) g.fillText(String(y).replace("-", "−"), cx - 12, cy - y * u + 10);
  g.font = "italic 38px Arial, sans-serif"; g.textAlign = "left";
  g.fillText("x", W - 40, cy - 14); g.fillText("y", cx + 16, 42);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function makeBoard() {
  const g = new THREE.Group(); g.name = "Πίνακας";
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.7 });
  const face = new THREE.MeshBasicMaterial({ map: boardTexture() });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_H, 0.012), [edge, edge, edge, edge, face, edge]);
  slab.position.z = -0.006;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.11), wood);
  base.position.set(0, -BOARD_H / 2 - 0.01, -0.03);
  g.add(slab, base);
  return g;
}

class Panel {
  constructor(w = BOARD_W, h = 0.13) {
    this.cv = document.createElement("canvas"); this.cv.width = 1280; this.cv.height = Math.round(1280 * h / w);
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, toneMapped: false }));
    this.key = "";
  }
  set(lines) { // lines: [{t, c, b}]
    const key = JSON.stringify(lines);
    if (key === this.key) return;
    this.key = key;
    const g = this.cv.getContext("2d"), W = this.cv.width, H = this.cv.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.93)"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#c9ced6"; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4);
    const step = Math.min(64, (H - 24) / lines.length);
    const fs = Math.round(step * 0.66);
    g.textBaseline = "middle"; g.textAlign = "left";
    lines.forEach((l, i) => {
      let f = fs;
      g.font = `bold ${f}px Arial, sans-serif`;
      const avail = W - 56, wd = g.measureText(l.t).width;
      if (wd > avail) { f = Math.floor((f * avail) / wd); g.font = `bold ${f}px Arial, sans-serif`; }
      g.fillStyle = css(l.c ?? COL.navy);
      g.fillText(l.t, 28, 14 + step * (i + 0.5));
    });
    this.tex.needsUpdate = true;
  }
}

export function makeButton(label, w = 0.105, h = 0.032) {
  const cv = document.createElement("canvas"); cv.width = 420; cv.height = Math.round(420 * h / w);
  const g = cv.getContext("2d");
  g.fillStyle = "#1f3863"; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "#ffffff"; g.font = "bold 40px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, cv.width / 2, cv.height / 2 + 2);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.008), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  m.userData.cv = cv; m.userData.tex = tex;
  m.userData.relabel = (text) => {
    g.fillStyle = "#1f3863"; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = "#ffffff"; g.fillText(text, cv.width / 2, cv.height / 2 + 2); tex.needsUpdate = true;
  };
  return m;
}

// ---------------------------------------------------------------------------
// Κατάσταση 0: Γεωμετρική ερμηνεία
// ---------------------------------------------------------------------------
const V0 = [
  { a: -2, b: 2, g: 0, h: -0.8 },
  { a: -3, b: 2, g: -1, h: 0.5 },
  { a: -1.5, b: 3, g: 4, h: 0 },
  { a: -4, b: 4, g: 0, h: 0 },
];
function model0(v) {
  const { a, b, g, h } = v;
  const poly = (x) => (x - a) * (x - b) * (x - g);
  let amp = 0;
  for (let j = 0; j <= 80; j++) amp = Math.max(amp, Math.abs(poly(a + ((b - a) * j) / 80)));
  const d = amp <= 4 ? 1 : amp / 4;
  const f = (x) => poly(x) / d + h;
  const df = (x) => ((x - b) * (x - g) + (x - a) * (x - g) + (x - a) * (x - b)) / d;
  const Sg = a + b + g, Qg = a * b + a * g + b * g, D = Sg * Sg - 3 * Qg;
  const crit = [(Sg - Math.sqrt(D)) / 3, (Sg + Math.sqrt(D)) / 3].filter((x) => x > a && x < b);
  return { f, df, crit, a, b };
}

function state0() {
  const group = new THREE.Group();
  const fFaint = new Ribbon(200, 0.0026, 0.0026, COL.lblue, ZC);
  const fBold = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ab = new Ribbon(200, 0.0026, 0.0026, COL.gray, ZC);
  const hor = new Ribbon(40, 0.0040, 0.0040, COL.green, ZC + 0.001);
  const A = sphere(COL.navy), B = sphere(COL.navy), X = sphere(COL.orange, 0.0058);
  const cr = [sphere(COL.green), sphere(COL.green)];
  const tangent = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 3.4 * S, 10),
    new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.5 }));
  tangent.name = "tangent"; X.name = "xi";
  tangent.rotation.order = "ZYX";
  group.add(fFaint.mesh, fBold.mesh, ab.mesh, hor.mesh, A, B, X, tangent, ...cr);
  let m = null, vi = -1;
  const api = {
    group, variants: V0.length, title: "Γεωμετρική ερμηνεία",
    // Επιστρέφει τη ζωντανή κατάσταση ώστε να χρησιμοποιηθεί και για το μοντέλο AR.
    pose(t, v) {
      const mm = model0(V0[v]);
      const s = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 12);
      const xi = mm.a + s * (mm.b - mm.a);
      return { xi, y: mm.f(xi), slope: mm.df(xi), m: mm };
    },
    update(t, v, panel) {
      if (v !== vi) {
        vi = v; m = model0(V0[v]);
        fFaint.set(sample(m.f, -XMAX, XMAX));
        fBold.set(sample(m.f, m.a, m.b, 160));
        place(A, m.a, m.f(m.a)); place(B, m.b, m.f(m.b));
        ab.set(dashed([m.a, m.f(m.a)], [m.b, m.f(m.b)]));
        const hp = [];
        m.crit.forEach((x, i) => { hp.push([x - 1, m.f(x)], [x + 1, m.f(x)], null); cr[i].visible = true; place(cr[i], x, m.f(x)); });
        for (let i = m.crit.length; i < 2; i++) cr[i].visible = false;
        hor.set(hp);
      }
      const p = this.pose(t, v);
      place(X, p.xi, p.y);
      tangent.position.set(p.xi * S, p.y * S, ZC + 0.0042);
      tangent.rotation.set(0, 0, Math.atan(p.slope) - Math.PI / 2);
      fitTangent(tangent, p.y, p.slope, 1.7);
      const hv = V0[v].h;
      const horiz = Math.abs(p.slope) < 0.05;
      panel.set([
        { t: "Θεώρημα Rolle: Γεωμετρική ερμηνεία", c: COL.navy, b: true },
        { t: `f(α) = f(β) = ${fmt(hv)}    α = ${fmt(V0[v].a)}    β = ${fmt(V0[v].b)}`, c: COL.navy },
        { t: `f΄(ξ) = ${fmt(p.slope)}    ξ = ${fmt(p.xi)}`, c: COL.red },
        { t: `Σημεία ξ του θεωρήματος στο (α, β): ${m.crit.length}`, c: COL.green },
        ...(horiz ? [{ t: "Η εφαπτομένη στο ξ είναι παράλληλη στην ευθεία ΑΒ", c: COL.red }] : []),
      ]);
    },
  };
  return api;
}

// ---------------------------------------------------------------------------
// Κατάσταση 1: Υποθέσεις και αντιπαραδείγματα
// ---------------------------------------------------------------------------
const EX = [
  { f: (x) => x ** 3 - 4 * x, df: (x) => 3 * x * x - 4, a: -2, b: 2, name: "f(x) = x³ − 4x στο [−2 ; 2]",
    c: ["Ναι", "Ναι", "Ναι"], concl: "Ναι, στα σημεία ξ = ± 2/√3", crit: [-2 / Math.sqrt(3), 2 / Math.sqrt(3)] },
  { f: (x) => 1 - Math.abs(x), df: (x) => (x === 0 ? NaN : -Math.sign(x)), a: -1, b: 1, name: "f(x) = 1 − |x| στο [−1 ; 1]",
    c: ["Ναι", "Όχι", "Ναι"], concl: "Όχι", crit: [] },
  { f: (x) => x * x, df: (x) => 2 * x, a: -1, b: 1.5, name: "f(x) = x² στο [−1 ; 1,5]",
    c: ["Ναι", "Ναι", "Όχι"], concl: "Ναι, στο σημείο ξ = 0 (το θεώρημα δεν αντιστρέφεται)", crit: [0] },
  { f: (x) => x, df: () => 1, a: 0, b: 1, name: "f(x) = x στο [0 ; 1), f(1) = 0",
    c: ["Όχι", "Ναι", "Ναι"], concl: "Όχι", crit: [], jump: true },
];

function state1() {
  const group = new THREE.Group();
  const fFaint = new Ribbon(200, 0.0026, 0.0026, COL.lblue, ZC);
  const fBold = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ab = new Ribbon(200, 0.0026, 0.0026, COL.gray, ZC);
  const hor = new Ribbon(40, 0.0040, 0.0040, COL.green, ZC + 0.001);
  const A = sphere(COL.navy), B = sphere(COL.navy), open = ring(COL.blue), X = sphere(COL.orange, 0.0058);
  const cr = [sphere(COL.green), sphere(COL.green)];
  const tangent = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 2.4 * S, 10),
    new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.5 }));
  group.add(fFaint.mesh, fBold.mesh, ab.mesh, hor.mesh, A, B, open, X, tangent, ...cr);
  let vi = -1;
  return {
    group, variants: EX.length, title: "Υποθέσεις και αντιπαραδείγματα",
    update(t, v, panel) {
      const e = EX[v];
      if (v !== vi) {
        vi = v;
        fFaint.set(sample(e.f, -XMAX, XMAX));
        fBold.set(sample(e.f, e.a, e.b, 160));
        const yb = e.jump ? 0 : e.f(e.b);
        place(A, e.a, e.f(e.a)); place(B, e.b, yb);
        open.visible = !!e.jump; if (e.jump) place(open, e.b, e.f(e.b));
        if (v === 2) ab.clear(); else ab.set(dashed([e.a, e.f(e.a)], [e.b, yb]));
        const hp = [];
        e.crit.forEach((x, i) => { hp.push([x - 0.7, e.f(x)], [x + 0.7, e.f(x)], null); cr[i].visible = true; place(cr[i], x, e.f(x)); });
        for (let i = e.crit.length; i < 2; i++) cr[i].visible = false;
        hor.set(hp);
      }
      const s = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 12);
      const xi = e.a + (0.02 + 0.96 * s) * (e.b - e.a);
      const y = e.f(xi);
      place(X, xi, y);
      let sl = e.df(xi); if (!isFinite(sl)) sl = e.df(xi + 1e-3);
      tangent.position.set(xi * S, y * S, ZC + 0.0042);
      tangent.rotation.set(0, 0, Math.atan(sl) - Math.PI / 2);
      fitTangent(tangent, y, sl, 1.2);
      const yn = (s) => (s === "Ναι" ? COL.green : COL.red);
      panel.set([
        { t: "Θεώρημα Rolle: Υποθέσεις και αντιπαραδείγματα", c: COL.navy, b: true },
        { t: e.name, c: COL.navy },
        { t: `1. Η f είναι συνεχής στο [α, β]: ${e.c[0]}`, c: yn(e.c[0]) },
        { t: `2. Η f είναι παραγωγίσιμη στο (α, β): ${e.c[1]}`, c: yn(e.c[1]) },
        { t: `3. Ισχύει f(α) = f(β): ${e.c[2]}`, c: yn(e.c[2]) },
        { t: `Υπάρχει ξ ∈ (α, β) με f΄(ξ) = 0: ${e.concl}`, c: COL.red },
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 2: Πλήθος ριζών της x³ + px + q = 0
// ---------------------------------------------------------------------------
const P2 = [-3, 0, 3, -1.5];
function cubicRoots(p, q) {
  const Ee = (q * q) / 4 + (p * p * p) / 27;
  const w = Math.sqrt(Math.abs(Ee));
  const cbrt = Math.cbrt;
  let z = [0, 0, 0];
  const cq = p < 0 ? ((3 * q) / (2 * p)) * Math.sqrt(-3 / p) : 0;
  const cc = Math.max(-1, Math.min(1, cq));
  if (Ee > 0) z[0] = cbrt(-q / 2 + w) + cbrt(-q / 2 - w);
  else if (p < 0) {
    const m = 2 * Math.sqrt(-p / 3), th = Math.acos(cc) / 3;
    z = [m * Math.cos(th), m * Math.cos(th - (2 * Math.PI) / 3), m * Math.cos(th - (4 * Math.PI) / 3)];
  }
  const n = Ee > 0 ? 1 : Ee < 0 ? 3 : p === 0 ? 1 : 2;
  return { z, n, three: Ee <= 0 && p < 0 };
}

function state2() {
  const group = new THREE.Group();
  const f = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const df = new Ribbon(400, 0.0030, 0.0030, COL.orange, ZC);
  const Z = [sphere(COL.green, 0.0055), sphere(COL.green, 0.0055), sphere(COL.green, 0.0055)];
  const E = [sphere(COL.orange), sphere(COL.orange)];
  group.add(f.mesh, df.mesh, ...Z, ...E);
  let key = "";
  return {
    group, variants: P2.length, title: "Πλήθος ριζών εξίσωσης",
    update(t, v, panel) {
      const p = P2[v];
      const tri = 1 - Math.abs(((t / 18) % 2) - 1);   // 0 → 1 → 0
      const q = Math.round((-4 + 8 * tri) * 100) / 100;
      const k = `${v}|${q}`;
      if (k !== key) {
        key = k;
        const fn = (x) => x ** 3 + p * x + q;
        f.set(sample(fn, -XMAX, XMAX, 200));
        const dp = [];
        const dfn = (x) => 3 * x * x + p;
        const raw = sample(dfn, -XMAX, XMAX, 160);
        for (let i = 0; i < raw.length - 1; i += 2) { if (raw[i] && raw[i + 1]) dp.push(raw[i], raw[i + 1], null); }
        df.set(dp);
        const r = cubicRoots(p, q);
        Z.forEach((s, i) => { s.visible = i === 0 || r.three; place(s, r.z[i], 0); });
        const rr = p < 0 ? Math.sqrt(-p / 3) : 0;
        E.forEach((s, i) => { s.visible = p < 0; place(s, i === 0 ? -rr : rr, fn(i === 0 ? -rr : rr)); });
        this.last = { r, rr };
      }
      const { r, rr } = this.last;
      panel.set([
        { t: "Θεώρημα Rolle: Πλήθος ριζών της εξίσωσης x³ + px + q = 0", c: COL.navy, b: true },
        { t: `p = ${fmt(p)}    q = ${fmt(q)}`, c: COL.navy },
        { t: p < 0 ? `Ρίζες της f΄: x = ± ${fmt(rr)}` : p === 0 ? "Ρίζα της f΄: x = 0" : "Η f΄ δεν έχει ρίζες", c: COL.orange },
        { t: `Πλήθος πραγματικών ριζών της f: ${r.n}`, c: COL.green },
        { t: p > 0 ? "p > 0: η f΄ δεν μηδενίζεται, άρα η f έχει το πολύ μία ρίζα (Rolle)."
              : p === 0 ? "p = 0: η f΄ μηδενίζεται μόνο στο 0 και η f είναι γνησίως αύξουσα."
              : "p < 0: η f΄ έχει δύο ρίζες, άρα η f έχει το πολύ τρεις ρίζες (Rolle).", c: COL.navy },
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 3: Ρίζες της f και ρίζες της f΄
// ---------------------------------------------------------------------------
const R3 = [[-3, 0.4, 3], [-4, -0.5, 2.5], [-2, 1, 4], [-5, 1.9, 5]];
function state3() {
  const group = new THREE.Group();
  const f = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const df = new Ribbon(400, 0.0030, 0.0030, COL.orange, ZC);
  const vert = new Ribbon(80, 0.0030, 0.0030, COL.green, ZC);
  const hor = new Ribbon(40, 0.0040, 0.0040, COL.green, ZC + 0.001);
  const R = [sphere(COL.blue, 0.0055), sphere(COL.blue, 0.0055), sphere(COL.blue, 0.0055)];
  const Xs = [sphere(COL.orange, 0.0055), sphere(COL.orange, 0.0055)];
  group.add(f.mesh, df.mesh, vert.mesh, hor.mesh, ...R, ...Xs);
  let key = "";
  return {
    group, variants: R3.length, title: "Ρίζες της f και της f΄",
    update(t, v, panel) {
      const [r1, r2v, r3] = R3[v];
      const r2 = Math.round(Math.max(-0.9, Math.min(1.9, r2v + 0.6 * Math.sin((2 * Math.PI * t) / 14))) * 100) / 100;
      const k = `${v}|${r2}`;
      if (k !== key) {
        key = k;
        const poly = (x) => (x - r1) * (x - r2) * (x - r3);
        let amp = 0;
        for (let j = 0; j <= 80; j++) amp = Math.max(amp, Math.abs(poly(r1 + ((r3 - r1) * j) / 80)));
        const d = amp <= 3 ? 1 : amp / 3;
        const fn = (x) => poly(x) / d;
        const dfn = (x) => ((x - r2) * (x - r3) + (x - r1) * (x - r3) + (x - r1) * (x - r2)) / d;
        f.set(sample(fn, -XMAX, XMAX, 200));
        const raw = sample(dfn, -XMAX, XMAX, 160), dp = [];
        for (let i = 0; i < raw.length - 1; i += 2) { if (raw[i] && raw[i + 1]) dp.push(raw[i], raw[i + 1], null); }
        df.set(dp);
        const Sg = r1 + r2 + r3, Qg = r1 * r2 + r1 * r3 + r2 * r3, D = Sg * Sg - 3 * Qg;
        const x1 = (Sg - Math.sqrt(D)) / 3, x2 = (Sg + Math.sqrt(D)) / 3;
        [r1, r2, r3].forEach((r, i) => place(R[i], r, 0));
        [x1, x2].forEach((x, i) => place(Xs[i], x, 0));
        const vp = [], hp = [];
        [x1, x2].forEach((x) => { vp.push(...dashed([x, 0], [x, fn(x)], 0.2, 0.14)); hp.push([x - 1, fn(x)], [x + 1, fn(x)], null); });
        vert.set(vp); hor.set(hp);
        this.last = { r1, r2, r3, x1, x2 };
      }
      const { x1, x2 } = this.last;
      panel.set([
        { t: "Θεώρημα Rolle: Ανάμεσα σε δύο ρίζες της f υπάρχει ρίζα της f΄", c: COL.navy, b: true },
        { t: "f(ρ₁) = f(ρ₂) = f(ρ₃) = 0", c: COL.blue },
        { t: `Η f΄ έχει ρίζα ξ₁ = ${fmt(x1)} στο (${fmt(r1)} ; ${fmt(r2)})`, c: COL.green },
        { t: `Η f΄ έχει ρίζα ξ₂ = ${fmt(x2)} στο (${fmt(r2)} ; ${fmt(r3)})`, c: COL.green },
        { t: "Μπλε: η f. Πορτοκαλί, διακεκομμένη: η f΄.", c: COL.gray },
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Η εφαρμογή
// ---------------------------------------------------------------------------
export function createRolle() {
  const root = new THREE.Group(); root.name = "Θεώρημα Rolle";
  const board = makeBoard();
  const panel = new Panel(); panel.mesh.position.set(0, BOARD_H / 2 + 0.005 + 0.065, 0.003);
  const states = [state0(), state1(), state2(), state3()];
  const plot = new THREE.Group(); plot.name = "Γράφημα";
  states.forEach((s, i) => { s.group.visible = i === 0; plot.add(s.group); });
  root.add(board, plot, panel.mesh);

  const labels = ["‹ Κατάσταση", "Κατάσταση ›", "Παύση", "Παράδειγμα ›"];
  const buttons = labels.map((l, i) => {
    const b = makeButton(l); b.position.set(-0.1875 + i * 0.125, -BOARD_H / 2 - 0.065, 0.004);
    b.userData.action = ["prev", "next", "pause", "variant"][i];
    return b;
  });
  const bar = new THREE.Group(); bar.name = "Κουμπιά"; buttons.forEach((b) => bar.add(b)); root.add(bar);

  const app = {
    root, states, panel, buttons, bar,
    state: 0, variant: 0, paused: false, t: 0, onChange: null,
    setState(i) {
      this.state = (i + states.length) % states.length; this.variant = 0; this.t = 0;
      states.forEach((s, j) => (s.group.visible = j === this.state));
      this.onChange && this.onChange();
    },
    nextVariant() { this.variant = (this.variant + 1) % states[this.state].variants; this.t = 0; this.onChange && this.onChange(); },
    togglePause() {
      this.paused = !this.paused;
      buttons[2].userData.relabel(this.paused ? "Συνέχεια" : "Παύση");
      this.onChange && this.onChange();
    },
    act(action) {
      if (action === "prev") this.setState(this.state - 1);
      else if (action === "next") this.setState(this.state + 1);
      else if (action === "pause") this.togglePause();
      else if (action === "variant") this.nextVariant();
    },
    update(dt) {
      if (!this.paused) this.t += dt;
      states[this.state].update(this.t, this.variant, panel);
    },
  };
  app.update(0);
  return app;
}
