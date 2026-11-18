// Θεώρημα Μέσης Τιμής: σκηνή three.js για τη σελίδα Maths - AR (Magic Leap 2, Meta Quest 3, tablet Samsung).
// Τέσσερις καταστάσεις, ίδιες με τις εφαρμογές GeoGebra του σεναρίου 47:
//   0 Γεωμετρική ερμηνεία, 1 Υποθέσεις και αντιπαραδείγματα, 2 Εφαρμογή e^x ≥ 1 + x, 3 Εφαρμογή |ημβ − ημα| ≤ |β − α|.
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
// Κατάσταση 0: Γεωμετρική ερμηνεία (f(x) = x³ − 3x)
// ---------------------------------------------------------------------------
const f0 = (x) => x ** 3 - 3 * x;
const df0 = (x) => 3 * x * x - 3;
const V0 = [
  { a: 0, b: 2 },
  { a: -2, b: 1 },
  { a: -1.5, b: 2 },
  { a: -2, b: 2 },
];
// Ρίζες της f΄(x) = m στο (α, β): x² = (α² + αβ + β²) / 3
function xiCandidates(a, b) {
  const c = Math.sqrt((a * a + a * b + b * b) / 3);
  return [c, -c].filter((x) => x > a && x < b);
}

function state0() {
  const group = new THREE.Group();
  const fFaint = new Ribbon(200, 0.0026, 0.0026, COL.lblue, ZC);
  const fBold = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ab = new Ribbon(200, 0.0026, 0.0026, COL.gray, ZC);
  const A = sphere(COL.navy), B = sphere(COL.navy), X = sphere(COL.orange, 0.0058);
  const cr = [sphere(COL.green, 0.0055), sphere(COL.green, 0.0055)];
  const tangent = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 3.4 * S, 10),
    new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.5 }));
  tangent.rotation.order = "ZYX";
  group.add(fFaint.mesh, fBold.mesh, ab.mesh, A, B, X, tangent, ...cr);
  let vi = -1, m = 0, a = 0, b = 1, fa = 0, fb = 0, roots = [];
  return {
    group, variants: V0.length, title: "Γεωμετρική ερμηνεία",
    update(t, v, panel) {
      if (v !== vi) {
        vi = v; ({ a, b } = V0[v]);
        fa = f0(a); fb = f0(b); m = (fb - fa) / (b - a);
        roots = xiCandidates(a, b);
        fFaint.set(sample(f0, -XMAX, XMAX));
        fBold.set(sample(f0, a, b, 160));
        place(A, a, fa); place(B, b, fb);
        ab.set(dashed([a, fa], [b, fb]));
        roots.forEach((x, i) => { cr[i].visible = true; place(cr[i], x, f0(x)); });
        for (let i = roots.length; i < 2; i++) cr[i].visible = false;
      }
      const s = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 12);
      const x = a + s * (b - a);
      const y = f0(x), slope = df0(x);
      place(X, x, y);
      tangent.position.set(x * S, y * S, ZC + 0.0042);
      tangent.rotation.set(0, 0, Math.atan(slope) - Math.PI / 2);
      fitTangent(tangent, y, slope, 1.7);
      const par = Math.abs(slope - m) < 0.08;
      panel.set([
        { t: "Θεώρημα Μέσης Τιμής: Γεωμετρική ερμηνεία", c: COL.navy, b: true },
        { t: `f(α) = ${fmt(fa)}    f(β) = ${fmt(fb)}    α = ${fmt(a)}    β = ${fmt(b)}`, c: COL.navy },
        { t: `Κλίση χορδής ΑΒ = ${fmt(m)}`, c: COL.orange },
        { t: `f΄(x) = ${fmt(slope)}    x = ${fmt(x)}`, c: COL.red },
        { t: `Σημεία ξ στο (α, β) με f΄(ξ) = κλίση ΑΒ: ${roots.length}`, c: COL.green },
        ...(par ? [{ t: "Η εφαπτομένη στο ξ είναι παράλληλη στην ΑΒ", c: COL.green }] : []),
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 1: Υποθέσεις και αντιπαραδείγματα
// ---------------------------------------------------------------------------
const sq = (x) => (x >= 0 ? Math.sqrt(x) : NaN);
const EX = [
  { f: f0, df: df0, a: 0, b: 2, name: "f(x) = x³ − 3x στο [0 ; 2]",
    c: ["Ναι", "Ναι"], concl: "Ναι, ξ = 2/√3 ≈ 1,15", crit: [2 / Math.sqrt(3)] },
  { f: sq, df: (x) => 1 / (2 * Math.sqrt(x)), a: 0, b: 4, name: "f(x) = √x στο [0 ; 4]",
    c: ["Ναι", "Ναι"], concl: "Ναι, ξ = 1", crit: [1] },
  { f: (x) => Math.abs(x), df: (x) => (x === 0 ? NaN : Math.sign(x)), a: -1, b: 2, name: "f(x) = |x| στο [−1 ; 2]",
    c: ["Ναι", "Όχι"], concl: "Όχι, η f΄ παίρνει μόνο τις τιμές −1 και 1", crit: [] },
  { f: (x) => (x < 1 ? x : x - 1), df: () => 1, a: 0, b: 2, name: "f(x) = x αν x < 1, f(x) = x − 1 αν x ≥ 1, στο [0 ; 2]",
    c: ["Όχι", "Όχι"], concl: "Όχι, η f΄ είναι 1 και η κλίση της ΑΒ είναι 0,5", crit: [], jump: true },
];

function state1() {
  const group = new THREE.Group();
  const fFaint = new Ribbon(200, 0.0026, 0.0026, COL.lblue, ZC);
  const fBold = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ab = new Ribbon(200, 0.0026, 0.0026, COL.gray, ZC);
  const A = sphere(COL.navy), B = sphere(COL.navy), gapOpen = ring(COL.blue), gapDot = sphere(COL.blue, 0.0045);
  const X = sphere(COL.orange, 0.0058);
  const cr = [sphere(COL.green, 0.0055), sphere(COL.green, 0.0055)];
  const tangent = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 2.4 * S, 10),
    new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.5 }));
  group.add(fFaint.mesh, fBold.mesh, ab.mesh, A, B, gapOpen, gapDot, X, tangent, ...cr);
  let vi = -1, e = EX[0];
  return {
    group, variants: EX.length, title: "Υποθέσεις και αντιπαραδείγματα",
    update(t, v, panel) {
      e = EX[v];
      if (v !== vi) {
        vi = v;
        fFaint.set(sample(e.f, -XMAX, XMAX));
        if (e.jump) {
          // ασυνέχεια στο 1: δύο κλάδοι χωρισμένοι με κενό
          fBold.set([...sample(e.f, 0, 0.999, 80), null, ...sample(e.f, 1.001, 2, 80)]);
          place(gapOpen, 1, 1); place(gapDot, 1, 0); gapOpen.visible = true; gapDot.visible = true;
        } else {
          fBold.set(sample(e.f, e.a, e.b, 160));
          gapOpen.visible = false; gapDot.visible = false;
        }
        const ya = e.f(e.a), yb = e.f(e.b);
        place(A, e.a, ya); place(B, e.b, yb);
        ab.set(dashed([e.a, ya], [e.b, yb]));
        e.crit.forEach((x, i) => { cr[i].visible = true; place(cr[i], x, e.f(x)); });
        for (let i = e.crit.length; i < 2; i++) cr[i].visible = false;
      }
      const s = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 12);
      const x = e.a + (0.02 + 0.96 * s) * (e.b - e.a);
      const showX = v <= 1; // τα δύο πρώτα παραδείγματα έχουν ξ
      X.visible = showX; tangent.visible = showX;
      if (showX) {
        const y = e.f(x);
        let sl = e.df(x); if (!isFinite(sl)) sl = e.df(x + 1e-3);
        place(X, x, y);
        tangent.position.set(x * S, y * S, ZC + 0.0042);
        tangent.rotation.set(0, 0, Math.atan(sl) - Math.PI / 2);
        fitTangent(tangent, y, sl, 1.2);
      }
      const yn = (s2) => (s2 === "Ναι" ? COL.green : COL.red);
      panel.set([
        { t: "Θεώρημα Μέσης Τιμής: Υποθέσεις και αντιπαραδείγματα", c: COL.navy, b: true },
        { t: e.name, c: COL.navy },
        { t: `1. Η f είναι συνεχής στο [α, β]: ${e.c[0]}`, c: yn(e.c[0]) },
        { t: `2. Η f είναι παραγωγίσιμη στο (α, β): ${e.c[1]}`, c: yn(e.c[1]) },
        { t: `Υπάρχει ξ ∈ (α, β) με f΄(ξ) = κλίση ΑΒ: ${e.concl}`, c: COL.red },
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 2: Εφαρμογή, e^x ≥ 1 + x (με ξ = ln(κλίση ΑΒ))
// ---------------------------------------------------------------------------
const B2 = [1.2, -1.5, 0.8, -2];
function state2() {
  const group = new THREE.Group();
  const fFaint = new Ribbon(200, 0.0026, 0.0026, COL.lblue, ZC);
  const fBold = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ab = new Ribbon(200, 0.0026, 0.0026, COL.gray, ZC);
  const A = sphere(COL.navy), B = sphere(COL.navy), Xi = sphere(COL.green, 0.0058);
  const tangent = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 3.4 * S, 10),
    new THREE.MeshStandardMaterial({ color: COL.red, roughness: 0.5 }));
  group.add(fFaint.mesh, fBold.mesh, ab.mesh, A, B, Xi, tangent);
  let vi = -1, be = 1, m = 1, xi = 0;
  return {
    group, variants: B2.length, title: "Εφαρμογή: e^x ≥ 1 + x",
    update(t, v, panel) {
      if (v !== vi) {
        vi = v; be = B2[v];
        m = (Math.exp(be) - 1) / be;
        xi = Math.log(m);
        fFaint.set(sample(Math.exp, -XMAX, XMAX));
        fBold.set(sample(Math.exp, Math.min(0, be), Math.max(0, be), 160));
        place(A, 0, 1); place(B, be, Math.exp(be));
        ab.set(dashed([0, 1], [be, Math.exp(be)]));
        place(Xi, xi, Math.exp(xi));
      }
      const y = Math.exp(xi);
      tangent.position.set(xi * S, y * S, ZC + 0.0042);
      tangent.rotation.set(0, 0, Math.atan(m) - Math.PI / 2);
      fitTangent(tangent, y, m, 1.7);
      panel.set([
        { t: "Εφαρμογή: e^x ≥ 1 + x", c: COL.navy, b: true },
        { t: `β = ${fmt(be)}    κλίση ΑΒ = ${fmt(m)}`, c: COL.orange },
        { t: `e^β − 1 = e^ξ × β, με ξ μεταξύ 0 και β`, c: COL.navy },
        { t: `ξ = ln(κλίση ΑΒ) = ${fmt(xi)}`, c: COL.green },
        { t: `e^β ≥ 1 + β: ${Math.exp(be) >= 1 + be ? "Ναι" : "Όχι"}`, c: COL.red },
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 3: Εφαρμογή, |ημβ − ημα| ≤ |β − α|
// ---------------------------------------------------------------------------
const R3 = [[-2.5, 1.5], [0.5, 2.2], [-1, 0.4], [1.2, 2.6]];
function state3() {
  const group = new THREE.Group();
  const fFaint = new Ribbon(200, 0.0026, 0.0026, COL.lblue, ZC);
  const fBold = new Ribbon(200, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ab = new Ribbon(200, 0.0026, 0.0026, COL.orange, ZC);
  const cone = new Ribbon(200, 0.0020, 0.0020, COL.gray, ZC);
  const A = sphere(COL.navy), B = sphere(COL.orange, 0.0055);
  group.add(fFaint.mesh, fBold.mesh, cone.mesh, ab.mesh, A, B);
  let vi = -1, al = 0, d = 1;
  const sin = Math.sin;
  return {
    group, variants: R3.length, title: "Εφαρμογή: |ημβ − ημα| ≤ |β − α|",
    update(t, v, panel) {
      if (v !== vi) {
        vi = v; [al, d] = R3[v];
        fFaint.set(sample(sin, -XMAX, XMAX));
        cone.set([...dashed([al, sin(al)], [al + 2.4, sin(al) + 2.4]), ...dashed([al, sin(al)], [al + 2.4, sin(al) - 2.4])]);
        place(A, al, sin(al));
      }
      const s = 0.25 + 0.75 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 12));
      const be = al + d * s;
      const m = (sin(be) - sin(al)) / (be - al);
      fBold.set(sample(sin, al, be, 160));
      place(B, be, sin(be));
      ab.set(dashed([al, sin(al)], [be, sin(be)]));
      panel.set([
        { t: "Εφαρμογή: |ημβ − ημα| ≤ |β − α|", c: COL.navy, b: true },
        { t: `α = ${fmt(al)}    β = ${fmt(be)}`, c: COL.navy },
        { t: `Κλίση χορδής ΑΒ = ${fmt(m)}`, c: COL.orange },
        { t: `|κλίση χορδής ΑΒ| ≤ 1: ${Math.abs(m) <= 1 ? "Ναι" : "Όχι"}`, c: COL.green },
        { t: "Άρα |ημβ − ημα| ≤ |β − α|", c: COL.red },
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Η εφαρμογή
// ---------------------------------------------------------------------------
export function createMVT() {
  const root = new THREE.Group(); root.name = "Θεώρημα Μέσης Τιμής";
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
