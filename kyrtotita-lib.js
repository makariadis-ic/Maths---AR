// Κυρτότητα και σημεία καμπής: σκηνή three.js για τη σελίδα Maths - AR (Magic Leap 2, Meta Quest 3, tablet Samsung).
// Έξι καταστάσεις, ίδιες με τις εφαρμογές GeoGebra του σεναρίου 48:
//   0 Ορισμός με τη χορδή, 1 Εφαπτομένη και κυρτότητα, 2 Πρόσημο της f΄΄ και σημεία καμπής,
//   3 Συνθήκες σημείου καμπής, 4 Ανισότητες με κυρτότητα, 5 Μέγιστος ρυθμός μεταβολής.
import * as THREE from "three";

export const BOARD_W = 0.48, BOARD_H = 0.30;
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
// Πλαίσιο: ποιο τμήμα του επιπέδου φαίνεται στον πίνακα (ενεργεί η ενεργή κατάσταση)
// ---------------------------------------------------------------------------
const FR = { x0: 0, hx: 4.8, y0: 0, hy: 3, tx: 1, ty: 1, sx: BOARD_W / 2 / 4.8, sy: BOARD_H / 2 / 3 };
function setFrame(f) {
  Object.assign(FR, f);
  FR.sx = BOARD_W / 2 / FR.hx; FR.sy = BOARD_H / 2 / FR.hy;
}
const MX = (x) => (x - FR.x0) * FR.sx, MY = (y) => (y - FR.y0) * FR.sy;
const inFrame = (y) => Math.abs(y - FR.y0) <= FR.hy - 0.08;

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
    const nrm = new Array(n).fill(null);
    const seg = (u, v) => { const dx = (v[0] - u[0]) * FR.sx, dy = (v[1] - u[1]) * FR.sy, l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (!p) continue;
      const a = i > 0 && pts[i - 1] ? pts[i - 1] : null;
      const b = i < n - 1 && pts[i + 1] ? pts[i + 1] : null;
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
      const X = MX(p[0]), Y = MY(p[1]);
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

function dashed(a, b, dash = 0.14, gap = 0.1) {
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

// Δειγματοληψία συνάρτησης με αποκοπή στο πλαίσιο και διακοπή εκεί που δεν ορίζεται
function sample(fn, x0, x1, n = 200) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = fn(x);
    if (y === null || y === undefined || !isFinite(y) || !inFrame(y)) pts.push(null);
    else pts.push([x, y]);
  }
  return pts;
}
// Ευθεία y = y1 + m (x − x1) μέσα στο πλαίσιο, μεταξύ xa και xb
function lineSeg(m, x1, y1, xa, xb) {
  let lo = Math.max(xa, FR.x0 - FR.hx + 0.05), hi = Math.min(xb, FR.x0 + FR.hx - 0.05);
  const yl = FR.y0 - FR.hy + 0.1, yh = FR.y0 + FR.hy - 0.1;
  if (Math.abs(m) > 1e-9) {
    const xs = [(yl - y1) / m + x1, (yh - y1) / m + x1].sort((a, b) => a - b);
    lo = Math.max(lo, xs[0]); hi = Math.min(hi, xs[1]);
  } else if (y1 < yl || y1 > yh) return [];
  if (hi <= lo) return [];
  return [[lo, y1 + m * (lo - x1)], [hi, y1 + m * (hi - x1)]];
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
const place = (m, x, y) => { m.position.x = MX(x); m.position.y = MY(y); };
const tri = (t, T) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / T);   // 0 → 1 → 0

// ---------------------------------------------------------------------------
// Πίνακας: το πλέγμα και οι άξονες ακολουθούν το πλαίσιο της ενεργής κατάστασης
// ---------------------------------------------------------------------------
function drawBoard(c, tex) {
  const W = c.width, H = c.height, g = c.getContext("2d");
  const px = (x) => W / 2 + ((x - FR.x0) / FR.hx) * (W / 2), py = (y) => H / 2 - ((y - FR.y0) / FR.hy) * (H / 2);
  const dec = (v, t) => String(Math.round(v * 100) / 100).replace(".", ",").replace("-", "−");
  g.fillStyle = "#fbfbf8"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#dcdce0"; g.lineWidth = 2;
  const xs = [], ys = [];
  for (let k = Math.ceil((FR.x0 - FR.hx) / FR.tx - 1e-9); k * FR.tx <= FR.x0 + FR.hx + 1e-9; k++) xs.push(k * FR.tx);
  for (let k = Math.ceil((FR.y0 - FR.hy) / FR.ty - 1e-9); k * FR.ty <= FR.y0 + FR.hy + 1e-9; k++) ys.push(k * FR.ty);
  xs.forEach((x) => { g.beginPath(); g.moveTo(px(x), 0); g.lineTo(px(x), H); g.stroke(); });
  ys.forEach((y) => { g.beginPath(); g.moveTo(0, py(y)); g.lineTo(W, py(y)); g.stroke(); });
  g.strokeStyle = "#2b2b2f"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, py(0)); g.lineTo(W, py(0)); g.stroke();
  g.beginPath(); g.moveTo(px(0), 0); g.lineTo(px(0), H); g.stroke();
  g.fillStyle = "#2b2b2f"; g.font = "30px Arial, sans-serif";
  const yx = Math.min(Math.max(py(0), 40), H - 14);
  g.textAlign = "center";
  xs.forEach((x) => { if (Math.abs(x) > 1e-9 && px(x) > 30 && px(x) < W - 60) g.fillText(dec(x), px(x), yx + (yx > H - 50 ? -10 : 38)); });
  const ax = Math.min(Math.max(px(0), 70), W - 14);
  g.textAlign = "right";
  ys.forEach((y) => { if (Math.abs(y) > 1e-9 && py(y) > 30 && py(y) < H - 20) g.fillText(dec(y), ax - 12, py(y) + 10); });
  g.font = "italic 38px Arial, sans-serif"; g.textAlign = "left";
  g.fillText(FR.xl || "x", W - 40, py(0) - 14 > 50 && py(0) < H - 20 ? py(0) - 14 : H - 20);
  g.fillText(FR.yl || "y", Math.min(px(0) + 16, W - 60), 42);
  tex.needsUpdate = true;
}

function makeBoard() {
  const g = new THREE.Group(); g.name = "Πίνακας";
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.8 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.7 });
  const c = document.createElement("canvas"); c.width = 1920; c.height = 1200;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const face = new THREE.MeshBasicMaterial({ map: t });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_H, 0.012), [edge, edge, edge, edge, face, edge]);
  slab.position.z = -0.006;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.11), wood);
  base.position.set(0, -BOARD_H / 2 - 0.01, -0.03);
  g.add(slab, base);
  g.userData.redraw = () => drawBoard(c, t);
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

const FRAME = (x0, hx, y0, hy, tx, ty) => ({ x0, hx, y0, hy, tx, ty });
const F_STD = FRAME(0, 4.8, 0, 3, 1, 1);
const lbl = (t, c, b) => ({ t, c, b });

// ---------------------------------------------------------------------------
// Κατάσταση 0: Ορισμός με τη χορδή, f(x) = x³/6 − x
// ---------------------------------------------------------------------------
const V0 = [[0.4, 2.8], [-2.6, -0.8], [-1.4, 1.2], [-2.2, 2.2]];
const f0 = (x) => x ** 3 / 6 - x;

function state0() {
  const group = new THREE.Group();
  const faint = new Ribbon(240, 0.0026, 0.0026, COL.lblue, ZC);
  const bold = new Ribbon(240, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const chord = new Ribbon(4, 0.0034, 0.0034, COL.orange, ZC + 0.0005);
  const pq = new Ribbon(60, 0.0030, 0.0030, COL.red, ZC + 0.0005);
  const A = sphere(COL.navy), B = sphere(COL.navy), P = sphere(COL.blue, 0.0055), Q = sphere(COL.orange, 0.0055);
  group.add(faint.mesh, bold.mesh, chord.mesh, pq.mesh, A, B, P, Q);
  let vi = -1;
  return {
    group, variants: V0.length, title: "Ορισμός με τη χορδή", frame: F_STD,
    invalidate() { vi = -1; },
    update(t, v, panel) {
      const [a, b] = V0[v];
      const lo = Math.min(a, b), hi = Math.max(a, b);
      if (v !== vi) {
        vi = v;
        faint.set(sample(f0, -4.7, 4.7, 240));
        bold.set(sample(f0, lo, hi, 200));
        chord.set([[a, f0(a)], [b, f0(b)]]);
        place(A, a, f0(a)); place(B, b, f0(b));
      }
      const l = tri(t, 12);
      const xl = l * a + (1 - l) * b, yc = l * f0(a) + (1 - l) * f0(b), yp = f0(xl);
      place(P, xl, yp); place(Q, xl, yc);
      pq.set(dashed([xl, yp], [xl, yc]));
      const rel = yp < yc - 1e-6 ? "Το P είναι κάτω από το Q: f(λα + (1 − λ)β) < λf(α) + (1 − λ)f(β)"
        : yp > yc + 1e-6 ? "Το P είναι πάνω από το Q: f(λα + (1 − λ)β) > λf(α) + (1 − λ)f(β)"
        : "Τα P και Q ταυτίζονται: ισότητα";
      const concl = lo >= 0 ? "f΄΄(x) = x ≥ 0 στο [α, β]: η f είναι κυρτή στο [α, β]"
        : hi <= 0 ? "f΄΄(x) = x ≤ 0 στο [α, β]: η f είναι κοίλη στο [α, β]"
        : "f΄΄(x) = x αλλάζει πρόσημο στο (α, β): η f δεν είναι ούτε κυρτή ούτε κοίλη";
      panel.set([
        lbl("Κυρτή και κοίλη συνάρτηση: f(x) = x³/6 − x", COL.navy, true),
        lbl(`α = ${fmt(a)}    β = ${fmt(b)}    λ = ${fmt(l)}`, COL.navy),
        lbl(`P: f(λα + (1 − λ)β) = ${fmt(yp)}    Q: λf(α) + (1 − λ)f(β) = ${fmt(yc)}`, COL.blue),
        lbl(rel, COL.red),
        lbl(concl, COL.navy, true),
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 1: Εφαπτομένη και κυρτότητα, f(x) = x³/6 − x
// ---------------------------------------------------------------------------
const T1 = [1.2, -1.8, 0, 2.2];
const df1 = (x) => (x * x) / 2 - 1;

function state1() {
  const group = new THREE.Group();
  const curve = new Ribbon(240, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const tan = new Ribbon(4, 0.0034, 0.0034, COL.green, ZC + 0.0005);
  const su = new Ribbon(60, 0.0030, 0.0030, COL.red, ZC + 0.0005);
  const T = sphere(COL.green, 0.0055), S_ = sphere(COL.blue, 0.0055), U = sphere(COL.orange, 0.0055), Sg = ring(COL.red, 0.0062);
  group.add(curve.mesh, tan.mesh, su.mesh, T, S_, U, Sg);
  let vi = -1;
  return {
    group, variants: T1.length, title: "Εφαπτομένη και κυρτότητα", frame: F_STD,
    invalidate() { vi = -1; },
    update(t, v, panel) {
      const tt = T1[v], m = df1(tt), ft = f0(tt);
      if (v !== vi) {
        vi = v;
        curve.set(sample(f0, -4.7, 4.7, 240));
        tan.set(lineSeg(m, tt, ft, tt - 3, tt + 3));
        place(T, tt, ft); place(Sg, 0, 0);
      }
      const s = 3 * Math.sin((2 * Math.PI * t) / 16);
      const ys = f0(s), yu = m * (s - tt) + ft, d = ys - yu;
      place(S_, s, ys);
      U.visible = inFrame(yu);
      if (U.visible) place(U, s, yu);
      su.set(inFrame(yu) ? dashed([s, ys], [s, yu]) : []);
      const concl = tt >= 0 && s >= 0 ? "t, s ≥ 0: η f είναι κυρτή, η γραφική παράσταση είναι πάνω από την εφαπτομένη"
        : tt <= 0 && s <= 0 ? "t, s ≤ 0: η f είναι κοίλη, η γραφική παράσταση είναι κάτω από την εφαπτομένη"
        : "Τα t και s είναι εκατέρωθεν του x = 0: το πρόσημο της διαφοράς εξαρτάται από αυτά";
      panel.set([
        lbl("Εφαπτομένη και κυρτότητα: f(x) = x³/6 − x,  f΄΄(x) = x", COL.navy, true),
        lbl(`t = ${fmt(tt)}    f(t) = ${fmt(ft)}    f΄(t) = ${fmt(m)}    εφαπτομένη στο Τ`, COL.green),
        lbl(`s = ${fmt(s)}    f(s) = ${fmt(ys)}    εφαπτομένη στο s: ${fmt(yu)}    διαφορά: ${fmt(d)}`, COL.red),
        lbl(concl, COL.navy, true),
        ...(Math.abs(tt) < 1e-6 ? [lbl("Στο σημείο καμπής Σ(0 ; 0) η εφαπτομένη y = −x διαπερνά τη γραφική παράσταση", COL.red)] : []),
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 2: Πρόσημο της f΄΄ και σημεία καμπής
//   f(x) = 0,1x⁴ − 0,2(α + β)x³ + 0,6αβx²,  f΄΄(x) = 1,2(x − α)(x − β)
// ---------------------------------------------------------------------------
const V2 = [[-0.9, 1.8], [-1.5, 0.8], [0, 1.4], [-1.2, 1.2]];
function model2([a, d]) {
  const b = a + d;
  return { a, b, f: (x) => 0.1 * x ** 4 - 0.2 * (a + b) * x ** 3 + 0.6 * a * b * x * x, f2: (x) => 1.2 * (x - a) * (x - b) };
}
function state2() {
  const group = new THREE.Group();
  const cvx = new Ribbon(320, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ccv = new Ribbon(320, 0.0048, 0.0048, COL.orange, ZC + 0.001);
  const vl = new Ribbon(80, 0.0030, 0.0030, COL.green, ZC);
  const S1 = sphere(COL.green, 0.0058), S2 = sphere(COL.green, 0.0058), X = sphere(COL.blue, 0.0058);
  group.add(cvx.mesh, ccv.mesh, vl.mesh, S1, S2, X);
  let vi = -1, m = null;
  return {
    group, variants: V2.length, title: "Πρόσημο της f΄΄ και σημεία καμπής", frame: F_STD,
    invalidate() { vi = -1; },
    update(t, v, panel) {
      if (v !== vi) {
        vi = v; m = model2(V2[v]);
        const n = 300, A = [], C = [];
        for (let i = 0; i <= n; i++) {
          const x = -4.5 + (9 * i) / n, y = m.f(x), ok = inFrame(y);
          A.push(ok && m.f2(x) >= 0 ? [x, y] : null);
          C.push(ok && m.f2(x) <= 0 ? [x, y] : null);
        }
        cvx.set(A); ccv.set(C);
        place(S1, m.a, m.f(m.a)); place(S2, m.b, m.f(m.b));
        vl.set([...dashed([m.a, 0], [m.a, m.f(m.a)], 0.12, 0.09), ...dashed([m.b, 0], [m.b, m.f(m.b)], 0.12, 0.09)]);
      }
      const u = 3 * Math.sin((2 * Math.PI * t) / 18), y = m.f(u), s2 = m.f2(u);
      X.visible = inFrame(y);
      place(X, u, y);
      X.material.color.setHex(s2 >= 0 ? COL.blue : COL.orange);
      panel.set([
        lbl("Πρόσημο της f΄΄:  f΄΄(x) = 1,2(x − α)(x − β)", COL.navy, true),
        lbl(`α = ${fmt(m.a)}    β = ${fmt(m.b)}    x₀ = ${fmt(u)}`, COL.navy),
        lbl("Κυρτή, f΄΄(x) > 0: στο (−∞, α] και στο [β, +∞).    Κοίλη, f΄΄(x) < 0: στο [α, β].", COL.blue),
        lbl(`Σημεία καμπής: Σ₁(${fmt(m.a)} ; ${fmt(m.f(m.a))})  και  Σ₂(${fmt(m.b)} ; ${fmt(m.f(m.b))})`, COL.green, true),
        lbl(`f΄΄(x₀) = ${fmt(s2)}` + (s2 > 1e-9 ? " > 0: η f είναι κυρτή κοντά στο x₀" : s2 < -1e-9 ? " < 0: η f είναι κοίλη κοντά στο x₀" : " = 0: το x₀ είναι θέση σημείου καμπής"), s2 >= 0 ? COL.blue : COL.orange, true),
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 3: Συνθήκες σημείου καμπής στο x₀ = 0
// ---------------------------------------------------------------------------
const F3 = FRAME(0, 3.2, 0, 2.3, 0.5, 1);
const K3 = [
  { name: "f(x) = x³/4 + x/2", f: (x) => x ** 3 / 4 + x / 2, f2: (x) => 1.5 * x, sg: "f΄΄(x) = 1,5x: αρνητική για x < 0 και θετική για x > 0", ch: true, tg: true },
  { name: "f(x) = x⁴/4 + x/2", f: (x) => x ** 4 / 4 + x / 2, f2: (x) => 3 * x * x, sg: "f΄΄(x) = 3x² ≥ 0: ισχύει f΄΄(0) = 0, αλλά η f΄΄ δεν αλλάζει πρόσημο στο x₀ = 0", ch: false, tg: true },
  { name: "f(x) = x⁵/8 + x/2", f: (x) => x ** 5 / 8 + x / 2, f2: (x) => 2.5 * x ** 3, sg: "f΄΄(x) = 2,5x³: αρνητική για x < 0 και θετική για x > 0", ch: true, tg: true },
  { name: "f(x) = x² + x/2 για x ≤ 0     f(x) = √x + x/2 για x > 0", f: (x) => (x <= 0 ? x * x + x / 2 : Math.sqrt(x) + x / 2),
    f2: (x) => (x <= 0 ? 2 : -0.25 * x ** -1.5), sg: "Δεν υπάρχει f΄(0): f΄(0⁻) = 1/2, ενώ f΄(x) → +∞ όταν x → 0⁺", ch: true, tg: false },
];
function state3() {
  const group = new THREE.Group();
  const cvx = new Ribbon(320, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const ccv = new Ribbon(320, 0.0048, 0.0048, COL.orange, ZC + 0.001);
  const tan = new Ribbon(4, 0.0034, 0.0034, COL.green, ZC + 0.0005);
  const Sg = sphere(COL.green, 0.0066), X = sphere(COL.blue, 0.0058);
  group.add(cvx.mesh, ccv.mesh, tan.mesh, Sg, X);
  let vi = -1;
  return {
    group, variants: K3.length, title: "Συνθήκες σημείου καμπής", frame: F3,
    invalidate() { vi = -1; },
    update(t, v, panel) {
      const k = K3[v];
      const yes = v === 0 || v === 2;
      if (v !== vi) {
        vi = v;
        const n = 300, A = [], C = [];
        for (let i = 0; i <= n; i++) {
          const x = -1.5 + (3 * i) / n, y = k.f(x);
          const s2 = k.f2(x === 0 ? 1e-9 : x);
          A.push(s2 >= 0 ? [x, y] : null);
          C.push(s2 < 0 || (v !== 1 && x === 0) ? [x, y] : null);
        }
        // Στα όρια των δύο τμημάτων η καμπύλη να είναι συνεχής
        const A0 = A.slice(), C0 = C.slice();
        for (let i = 1; i <= n; i++) {
          if (A0[i] && !A0[i - 1] && C0[i - 1]) A[i - 1] = C0[i - 1];
          if (C0[i] && !C0[i - 1] && A0[i - 1]) C[i - 1] = A0[i - 1];
          if (!A0[i] && A0[i - 1] && C0[i]) A[i] = C0[i];
          if (!C0[i] && C0[i - 1] && A0[i]) C[i] = A0[i];
        }
        cvx.set(A); ccv.set(C);
        if (k.tg) tan.set(lineSeg(0.5, 0, 0, -2.4, 2.4)); else tan.clear();
        Sg.material.color.setHex(yes ? COL.green : COL.red);
        place(Sg, 0, 0);
      }
      const x = 1.5 * Math.sin((2 * Math.PI * t) / 16) * 0.999 + 1e-3, y = k.f(x), s2 = k.f2(x);
      place(X, x, y);
      X.material.color.setHex(s2 >= 0 ? COL.blue : COL.orange);
      const yn = (b) => (b ? COL.green : COL.red);
      const s2txt = Math.abs(s2) > 99 ? (s2 < 0 ? "< −99" : "> 99") : fmt(s2);
      panel.set([
        lbl("Πότε το σημείο (x₀ ; f(x₀)) είναι σημείο καμπής: x₀ = 0", COL.navy, true),
        lbl(k.name, COL.blue, true),
        lbl(k.sg, COL.navy),
        lbl(`1. Η f αλλάζει κυρτότητα στο x₀ = 0: ${k.ch ? "Ναι" : "Όχι"}      2. Ορίζεται εφαπτομένη στο (0 ; f(0)): ${k.tg ? "Ναι" : "Όχι"}`, COL.navy),
        lbl(`Το σημείο (0 ; 0) είναι σημείο καμπής: ${yes ? "Ναι" : "Όχι"}`, yn(yes), true),
        lbl(`Σημείο στη γραφική παράσταση: x = ${fmt(x)}    f΄΄(x) = ${s2txt}`, s2 >= 0 ? COL.blue : COL.orange),
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 4: Ανισότητες με την κοίλη συνάρτηση ln x
// ---------------------------------------------------------------------------
const F4 = FRAME(1.6, 2.4, 0, 1.5, 1, 0.5);
const V4 = [[0.5, 2.6], [2.8, 0.4], [0.3, 3], [1.2, 1.8]];
function state4() {
  const group = new THREE.Group();
  const curve = new Ribbon(240, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const chord = new Ribbon(4, 0.0034, 0.0034, COL.orange, ZC + 0.0005);
  const pq = new Ribbon(60, 0.0030, 0.0030, COL.red, ZC + 0.0005);
  const A = sphere(COL.navy), B = sphere(COL.navy), P = sphere(COL.blue, 0.0055), Q = sphere(COL.orange, 0.0055);
  group.add(curve.mesh, chord.mesh, pq.mesh, A, B, P, Q);
  let vi = -1;
  return {
    group, variants: V4.length, title: "Ανισότητες με κυρτότητα", frame: F4,
    invalidate() { vi = -1; },
    update(t, v, panel) {
      const [a, b] = V4[v];
      if (v !== vi) {
        vi = v;
        curve.set(sample(Math.log, 0.03, 3.95, 240));
        chord.set([[a, Math.log(a)], [b, Math.log(b)]]);
        place(A, a, Math.log(a)); place(B, b, Math.log(b));
      }
      const l = tri(t, 12);
      const xl = l * a + (1 - l) * b, yc = l * Math.log(a) + (1 - l) * Math.log(b), yp = Math.log(xl);
      place(P, xl, yp); place(Q, xl, yc);
      pq.set(dashed([xl, yp], [xl, yc], 0.07, 0.05));
      const gm = a ** l * b ** (1 - l);
      panel.set([
        lbl("Ανισότητα με την κοίλη συνάρτηση: f(x) = ln x,  f΄΄(x) = −1/x² < 0", COL.navy, true),
        lbl(`α = ${fmt(a)}    β = ${fmt(b)}    λ = ${fmt(l)}`, COL.navy),
        lbl(`P: ln(λα + (1 − λ)β) = ${fmt(yp)}    Q: λ ln α + (1 − λ) ln β = ${fmt(yc)}`, COL.blue),
        lbl(`α^λ β^(1 − λ) = ${fmt(gm)}   ≤   λα + (1 − λ)β = ${fmt(xl)}`, COL.red, true),
        lbl("Κοίλη f: ln(λα + (1 − λ)β) ≥ λ ln α + (1 − λ) ln β.   Για λ = 1/2: (α + β)/2 ≥ √(αβ)", COL.navy),
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Κατάσταση 5: Λογιστική συνάρτηση, σημείο καμπής και μέγιστος ρυθμός μεταβολής
// ---------------------------------------------------------------------------
const F5 = FRAME(5.5, 6.4, 1, 1.5, 1, 0.5);
const V5 = [[1.6, 1, 5], [0.8, 2, 3], [1.2, 0.6, 6], [1.8, 1.4, 7.5]];
function state5() {
  const group = new THREE.Group();
  const P = new Ribbon(240, 0.0048, 0.0048, COL.blue, ZC + 0.001);
  const dP = new Ribbon(480, 0.0030, 0.0030, COL.orange, ZC);
  const vl = new Ribbon(60, 0.0030, 0.0030, COL.green, ZC);
  const Sg = sphere(COL.green, 0.0062), M = sphere(COL.orange, 0.0062), XP = sphere(COL.blue, 0.0050), XD = sphere(COL.orange, 0.0044);
  group.add(P.mesh, dP.mesh, vl.mesh, Sg, M, XP, XD);
  let vi = -1;
  return {
    group, variants: V5.length, title: "Μέγιστος ρυθμός μεταβολής", frame: F5,
    invalidate() { vi = -1; },
    update(t, v, panel) {
      const [K, r, t0] = V5[v];
      const p = (x) => K / (1 + Math.exp(-r * (x - t0)));
      const dp = (x) => { const e = Math.exp(-r * (x - t0)); return (K * r * e) / (1 + e) ** 2; };
      if (v !== vi) {
        vi = v;
        P.set(sample(p, 0, 11, 220));
        const raw = sample(dp, 0, 11, 240), out = [];
        for (let i = 0; i < raw.length - 1; i += 2) if (raw[i] && raw[i + 1]) out.push(raw[i], raw[i + 1], null);
        dP.set(out);
        place(Sg, t0, K / 2); place(M, t0, K * r / 4);
        vl.set(dashed([t0, 0], [t0, K / 2], 0.12, 0.09));
      }
      const x = 0.2 + 10.6 * tri(t, 20);
      place(XP, x, p(x)); place(XD, x, dp(x));
      panel.set([
        lbl("Λογιστική συνάρτηση: P(t) = K / (1 + e^(−r(t − t₀)))", COL.navy, true),
        lbl(`K = ${fmt(K)}    r = ${fmt(r)}    t₀ = ${fmt(t0)}`, COL.navy),
        lbl(`Σημείο καμπής Σ(t₀ ; K/2) = Σ(${fmt(t0)} ; ${fmt(K / 2)})`, COL.green, true),
        lbl(`P΄(t): ρυθμός μεταβολής, μέγιστη τιμή P΄(t₀) = Kr/4 = ${fmt(K * r / 4)}`, COL.orange),
        lbl(`t = ${fmt(x)}    P(t) = ${fmt(p(x))}    P΄(t) = ${fmt(dp(x))}` + (x < t0 ? "    P΄΄ > 0: κυρτή, η P΄ αυξάνεται" : x > t0 ? "    P΄΄ < 0: κοίλη, η P΄ μειώνεται" : ""), COL.navy),
      ]);
    },
  };
}

// ---------------------------------------------------------------------------
// Η εφαρμογή
// ---------------------------------------------------------------------------
export function createKyrtotita() {
  const root = new THREE.Group(); root.name = "Κυρτότητα και σημεία καμπής";
  const board = makeBoard();
  const panel = new Panel(); panel.mesh.position.set(0, BOARD_H / 2 + 0.005 + 0.065, 0.003);
  const states = [state0(), state1(), state2(), state3(), state4(), state5()];
  const plot = new THREE.Group(); plot.name = "Γράφημα";
  states.forEach((s) => { s.group.visible = false; plot.add(s.group); });
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
      setFrame(states[this.state].frame);
      board.userData.redraw();
      states[this.state].invalidate();
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
  app.setState(0);
  app.update(0);
  return app;
}
