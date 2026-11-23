import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ---------- Μαθηματικά ----------
const EPS = 1e-9;
export function rref(M) {
  const A = M.map(r => r.slice()); const m = A.length, n = A[0].length; const piv = []; let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    let p = -1, b = 1e-9;
    for (let i = r; i < m; i++) if (Math.abs(A[i][c]) > b) { b = Math.abs(A[i][c]); p = i; }
    if (p < 0) continue;
    [A[r], A[p]] = [A[p], A[r]];
    const f = A[r][c]; for (let j = 0; j < n; j++) A[r][j] /= f;
    for (let i = 0; i < m; i++) if (i !== r) { const g = A[i][c]; if (g) for (let j = 0; j < n; j++) A[i][j] -= g * A[r][j]; }
    piv.push(c); r++;
  }
  return { R: A, piv };
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = v => Math.hypot(...v);
export function det3(A) { return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]); }
export function inv3(A) {
  const d = det3(A); if (Math.abs(d) < 1e-9) return null;
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const r = [0, 1, 2].filter(x => x !== i), c = [0, 1, 2].filter(x => x !== j);
    C[i][j] = ((i + j) % 2 ? -1 : 1) * (A[r[0]][c[0]] * A[r[1]][c[1]] - A[r[0]][c[1]] * A[r[1]][c[0]]);
  }
  return C[0].map((_, j) => C.map(row => row[j] / d)); // adj/d
}
// Ανάλυση συστήματος με 3 αγνώστους: Ab = m×4
export function analyse(Ab) {
  const m = Ab.length, n = 3;
  const A = Ab.map(r => r.slice(0, n));
  const ra = rref(A).piv.length; const full = rref(Ab); const rb = full.piv.filter(c => c < 4).length;
  if (rb > ra) return { ra, rb, type: "none" };
  const R = full.R, piv = full.piv; const p = [0, 0, 0];
  piv.forEach((c, i) => { if (c < n) p[c] = R[i][3]; });
  if (ra === 3) return { ra, rb, type: "point", p };
  if (ra === 0) return { ra, rb, type: "space", p };
  if (ra === 1) { const row = A.find(r => norm(r) > EPS); return { ra, rb, type: "plane", p, nrm: row }; }
  // ra === 2: διεύθυνση ευθείας από εξωτερικό γινόμενο δύο ανεξάρτητων γραμμών
  let d = null;
  for (let i = 0; i < m && !d; i++) for (let j = i + 1; j < m && !d; j++) { const c = cross(A[i], A[j]); if (norm(c) > 1e-7) d = c; }
  const s = norm(d); return { ra, rb, type: "line", p, d: d.map(x => x / s) };
}
export function parabola(X, Y) {
  const V = X.map((x, i) => [x * x, x, 1, Y[i]]);
  const d = det3(V.map(r => r.slice(0, 3)));
  if (Math.abs(d) < 1e-9) return null;
  const { R } = rref(V); return [R[0][3], R[1][3], R[2][3]];
}
// Μορφοποίηση αριθμών: υποδιαστολή, ουσιαστικό πρόσημο, κλάσματα με μικρό παρονομαστή
const MINUS = "−";
export function dec(x, k = 2) { let s = (Math.round(x * 10 ** k) / 10 ** k).toString().replace(".", ","); if (s === "-0") s = "0"; return s.replace("-", MINUS); }
export function fr(x) {
  if (Math.abs(x) < 1e-9) return "0";
  for (let q = 1; q <= 30; q++) { const p = Math.round(x * q); if (Math.abs(x - p / q) < 1e-7) return q === 1 ? dec(p, 0) : `${dec(p, 0)}/${q}`; }
  return dec(x, 2);
}
const SUBS = ["₁", "₂", "₃", "₄"];
function lin(coefs, vars = ["x", "y", "z"]) {
  let s = "";
  coefs.forEach((c, i) => {
    if (Math.abs(c) < 1e-9) return;
    const a = Math.abs(c), body = (Math.abs(a - 1) < 1e-9 ? "" : fr(a)) + vars[i];
    s += s === "" ? (c < 0 ? MINUS + body : body) : (c < 0 ? ` ${MINUS} ` : " + ") + body;
  });
  return s === "" ? "0" : s;
}
const eqStr = (row) => `${lin(row.slice(0, 3))} = ${fr(row[3])}`;

// ---------- Σκηνές ----------
const NAMES = ["a", "b", "c", "d"];
function coefControls(S, rows, withD, init, dr = 12) {
  const cs = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < (withD ? 4 : 3); c++)
    cs.push({ id: `${NAMES[c]}${r + 1}`, label: `${NAMES[c]}${SUBS[r]}`, min: c === 3 ? -dr : -5, max: c === 3 ? dr : 5, step: 1, v: init[r][c] });
  return cs;
}
const SCENES = [
  {
    tab: "Τρία επίπεδα", title: "Σύστημα 3×3 και τρία επίπεδα", kind: "sys3",
    controls: () => coefControls(null, 3, true, [[1, 1, 1, 6], [1, -1, 1, 2], [1, 2, -1, 2]]),
    system: v => [0, 1, 2].map(r => [0, 1, 2, 3].map(c => v[`${NAMES[c]}${r + 1}`])),
  },
  {
    tab: "X = A⁻¹B", title: "Λύση με αντίστροφο πίνακα", kind: "inv",
    controls: () => coefControls(null, 3, true, [[1, 1, 1, 6], [1, -1, 1, 2], [1, 2, -1, 2]]),
    system: v => [0, 1, 2].map(r => [0, 1, 2, 3].map(c => v[`${NAMES[c]}${r + 1}`])),
  },
  {
    tab: "Ομογενές", title: "Ομογενές σύστημα 3×3", kind: "hom",
    controls: () => coefControls(null, 3, false, [[1, 1, 1], [1, -1, 0], [2, 0, 1]]),
    system: v => [0, 1, 2].map(r => [0, 1, 2].map(c => v[`${NAMES[c]}${r + 1}`]).concat(0)),
  },
  {
    tab: "Παραμετρικό", title: "Παραμετρικό σύστημα 3×3", kind: "par",
    controls: () => [{ id: "kk", label: "Σύστημα", min: 1, max: 3, step: 1, v: 1 }, { id: "lam", label: "λ", min: -6, max: 6, step: 0.5, v: 0.5 }],
    system: v => { const l = v.lam; return [
      [[l, 1, 1, 1], [1, l, 1, 1], [1, 1, l, 1]],
      [[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, l, 3]],
      [[l, 1, 1, 0], [1, l, 1, 0], [1, 1, l, 0]]][v.kk - 1]; },
    names: ["λx + y + z = 1 (κυκλικό)", "x + y + z = 1, x + 2y + 3z = 2, x + 3y + λz = 3", "ομογενές με λ"],
  },
  {
    tab: "Γενικό m×n", title: "Γενικό σύστημα m×n (3 άγνωστοι)", kind: "gen",
    controls: () => [{ id: "kk", label: "Σύστημα", min: 1, max: 4, step: 1, v: 1 }],
    PRES: [
      { n: "2×3, άπειρες λύσεις", Ab: [[1, 2, -1, 3], [2, -1, 1, 1]] },
      { n: "4×3, μοναδική λύση", Ab: [[1, 1, 1, 6], [1, -1, 1, 2], [1, 1, -1, 0], [1, 2, 3, 14]] },
      { n: "3×3 με r(A) = 2, αδύνατο", Ab: [[1, 1, 1, 1], [1, -1, 0, 0], [2, 0, 1, 3]] },
      { n: "4×3 με r(A) = 2, ευθεία λύσεων", Ab: [[1, 1, 1, 3], [1, -1, 0, 0], [2, 0, 1, 3], [0, 2, 1, 3]] },
    ],
    system(v) { return this.PRES[v.kk - 1].Ab; },
  },
  {
    tab: "Παραβολή", title: "Παραβολή από τρία σημεία", kind: "par3",
    controls: () => [[-1, 2], [1, 0], [2, 3]].flatMap(([x, y], i) => [
      { id: `X${i + 1}`, label: `x${SUBS[i]}`, min: -5, max: 5, step: 1, v: x }, { id: `Y${i + 1}`, label: `y${SUBS[i]}`, min: -6, max: 6, step: 1, v: y }]),
  },
];

// ---------- Κείμενο πληροφοριών ανά σκηνή ----------
function intDir(d) { for (let m = 1; m <= 40; m++) { const e = d.map(x => x * m / Math.max(...d.map(Math.abs)) ); if (e.every(x => Math.abs(x - Math.round(x)) < 1e-6)) return e.map(x => dec(Math.round(x), 0)); } return d.map(x => dec(x, 2)); }
const pr = (x) => x < 0 ? `(${dec(x, 0)})` : dec(x, 0);
export function infoFor(si, v) {
  const S = SCENES[si]; const L = [];
  if (S.kind === "par3") {
    const X = [1, 2, 3].map(i => v[`X${i}`]), Y = [1, 2, 3].map(i => v[`Y${i}`]);
    const co = parabola(X, Y);
    [0, 1, 2].forEach(i => L.push({ t: `${["A", "B", "Γ"][i]}(${dec(X[i], 0)}, ${dec(Y[i], 0)}): a·${pr(X[i] ** 2)} + b·${pr(X[i])} + c = ${dec(Y[i], 0)}`, c: ["#1F5FD6", "#2E9D3A", "#D62828"][i] }));
    const D = det3(X.map(x => [x * x, x, 1]));
    L.push({ t: `Ορίζουσα Vandermonde D = ${dec(D, 0)}`, c: "#00A6A6" });
    L.push(co ? { t: `y = ${lin(co, ["x²", "x", ""]).replace(/ \+ 0$/, "")}`, c: "#8E3FBF" } : { t: "Δύο σημεία έχουν την ίδια τετμημένη: δεν υπάρχει μοναδική παραβολή", c: "#D62828" });
    return L;
  }
  const Ab = S.system(v); const an = analyse(Ab); const A3 = Ab.slice(0, 3).map(r => r.slice(0, 3));
  const cols = ["#1F5FD6", "#2E9D3A", "#D62828", "#1F5FD6"];
  if (S.kind === "par") L.push({ t: `Σύστημα ${v.kk}: ${S.names[v.kk - 1]}`, c: "#555" });
  if (S.kind === "gen") L.push({ t: `Σύστημα ${v.kk}: ${S.PRES[v.kk - 1].n}`, c: "#555" });
  Ab.forEach((r, i) => L.push({ t: eqStr(r).replace(/ = (.*)$/, S.kind === "hom" ? " = 0" : " = $1"), c: cols[i] }));
  const sq = Ab.length === 3;
  if (sq) L.push({ t: `Ορίζουσα D = ${fr(det3(A3))}`, c: "#00A6A6" });
  L.push({ t: `r(A) = ${an.ra},  r(A|B) = ${an.rb}`, c: "#00A6A6" });
  if (S.kind === "inv") {
    const I = inv3(A3);
    if (I) {
      const b = Ab.map(r => r[3]); const X = I.map(row => row.reduce((s, x, j) => s + x * b[j], 0));
      I.forEach((row, i) => L.push({ t: (i === 0 ? "A⁻¹ = " : "       ") + "( " + row.map(fr).join("   ") + " )", c: "#1F5FD6" }));
      L.push({ t: `X = A⁻¹B = (${X.map(fr).join(", ")})`, c: "#8E3FBF" });
      return L;
    }
    L.push({ t: "Ο A δεν αντιστρέφεται (det A = 0): χρησιμοποίησε απαλοιφή Gauss", c: "#D62828" });
  }
  const names = { none: ["Αδύνατο σύστημα: r(A) < r(A|B)", "#D62828"], point: [`Μοναδική λύση (${(an.p || []).map(fr).join(", ")})`, "#8E3FBF"],
    line: ["Άπειρες λύσεις: μία ευθεία", "#8E3FBF"], plane: ["Άπειρες λύσεις: ένα επίπεδο", "#8E3FBF"], space: ["Κάθε σημείο του χώρου είναι λύση", "#8E3FBF"] };
  if (S.kind === "hom" && an.type === "point") L[L.length] = { t: "Μόνο η τετριμμένη λύση (0, 0, 0)", c: "#8E3FBF" };
  else L.push({ t: names[an.type][0], c: names[an.type][1] });
  if (an.type === "line") L.push({ t: `Ευθεία: (x, y, z) = (${an.p.map(fr).join(", ")}) + t·(${intDir(an.d).join("; ")})`, c: "#555" });
  return L;
}

// ---------- 3D ----------
const COLORS = [0x1F5FD6, 0x2E9D3A, 0xD62828, 0x1F5FD6];
const BOX = 5, SC = 0.06; // κύβος [-5,5]³ → 0,6 m
const state = { si: 0, vals: {}, controls: [], placed: false, domUI: true };
const $ = id => document.getElementById(id);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.localClippingEnabled = true; renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xEEF2F8);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.01, 100);
camera.position.set(0.9, 0.7, 1.2);
const orbit = new OrbitControls(camera, renderer.domElement); orbit.target.set(0, 0, 0); orbit.update();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(1, 2, 1); scene.add(dl);

const world = new THREE.Group(); world.scale.setScalar(SC); scene.add(world);
// Στο χώρο κόσμου ο άξονας z των μαθηματικών είναι ο κατακόρυφος (y του three): αντιστοίχιση (x,y,z) → (x, z, -y)
let zUp = true;
const toW = (x, y, z) => zUp ? new THREE.Vector3(x, z, -y) : new THREE.Vector3(x, y, z);
const clipPlanes = [];
for (const [nx, ny, nz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) clipPlanes.push(new THREE.Plane(new THREE.Vector3(nx, ny, nz), BOX));
const baseClip = clipPlanes.map(p => p.clone());
const staticGroup = new THREE.Group(), dyn = new THREE.Group(); world.add(staticGroup, dyn);

function buildStatic() {
  while (staticGroup.children.length) { const o = staticGroup.children.pop(); o.traverse(n => { n.geometry?.dispose(); n.material?.map?.dispose(); n.material?.dispose(); }); }
  const b = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * BOX, 2 * BOX, 2 * BOX)), new THREE.LineBasicMaterial({ color: 0x9aa7bd }));
  staticGroup.add(b);
  const ax = (dir, col) => { const g = new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(-BOX), dir.clone().multiplyScalar(BOX)]); staticGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: col }))); };
  ax(toW(1, 0, 0), 0x333333); ax(toW(0, 1, 0), 0x333333); if (zUp) ax(toW(0, 0, 1), 0x333333);
  const lbl = (t, p) => { const s = textSprite(t, "#222", 64); s.position.copy(p.clone().multiplyScalar(BOX + 0.9)); s.scale.setScalar(1.6); staticGroup.add(s); };
  lbl("x", toW(1, 0, 0)); lbl("y", toW(0, 1, 0)); if (zUp) lbl("z", toW(0, 0, 1));
}
function textSprite(t, col, px) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  g.fillStyle = col; g.font = `italic ${px}px serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 64, 64);
  const tex = new THREE.CanvasTexture(c); return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
}
function clearDyn() { while (dyn.children.length) { const o = dyn.children.pop(); o.traverse?.(n => { n.geometry?.dispose(); if (n.material) { n.material.map?.dispose(); n.material.dispose(); } }); } }
function planeMesh(a, b, c, d, color) {
  const n = new THREE.Vector3(a, b, c), len = n.length(); if (len < 1e-9) return null;
  const nw = toW(a, b, c).normalize(); const off = d / len;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, side: THREE.DoubleSide, clippingPlanes: clipPlanes, depthWrite: false }));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nw); m.position.copy(nw.clone().multiplyScalar(off));
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(40, 40)), new THREE.LineBasicMaterial({ color, clippingPlanes: clipPlanes }));
  m.add(edge); return m;
}
const PURPLE = 0x8E3FBF;
function sphere(p, col, r = 0.28) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshStandardMaterial({ color: col })); s.position.copy(p); return s; }
function rebuild() {
  clearDyn(); const S = SCENES[state.si], v = state.vals; zUp = S.kind !== "par3"; buildStatic();
  if (S.kind === "par3") {
    const X = [1, 2, 3].map(i => v[`X${i}`]), Y = [1, 2, 3].map(i => v[`Y${i}`]); const co = parabola(X, Y);
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(2 * BOX, 2 * BOX), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    dyn.add(gp);
    X.forEach((x, i) => dyn.add(sphere(toW(x, Y[i], 0), COLORS[i], 0.3)));
    if (co) {
      const pts = []; for (let x = -BOX; x <= BOX + 1e-9; x += 0.1) { const y = co[0] * x * x + co[1] * x + co[2]; if (Math.abs(y) <= BOX) pts.push(toW(x, y, 0)); else if (pts.length) { addCurve(pts.splice(0)); } }
      addCurve(pts);
    }
    return;
  }
  const Ab = S.system(v); const an = analyse(Ab);
  Ab.forEach((r, i) => { const m = planeMesh(r[0], r[1], r[2], r[3], COLORS[i % 4]); if (m) dyn.add(m); });
  if (an.type === "point") dyn.add(sphere(toW(...an.p), PURPLE, 0.35));
  if (an.type === "line") {
    const d = toW(...an.d).normalize(), p = toW(...an.p);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 40, 12), new THREE.MeshStandardMaterial({ color: PURPLE, clippingPlanes: clipPlanes }));
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); cyl.position.copy(p); dyn.add(cyl);
  }
  if (an.type === "space") dyn.add(sphere(new THREE.Vector3(), PURPLE, 0.35));
}
function addCurve(pts) { if (pts.length < 2) return; dyn.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: PURPLE, linewidth: 3 }))); }

// ---------- Διεπαφή (DOM) ----------
function setScene(si) {
  state.si = si; state.controls = SCENES[si].controls(); state.vals = {}; state.controls.forEach(c => state.vals[c.id] = c.v);
  [...$("tabs").children].forEach((b, i) => b.classList.toggle("on", i === si));
  const box = $("ctl"); box.innerHTML = "";
  state.controls.forEach(c => {
    const d = document.createElement("div"); d.className = "c";
    d.innerHTML = `<label></label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.v}">`;
    const lab = d.firstChild, inp = d.lastChild; const upd = () => { lab.textContent = `${c.label} = ${dec(+inp.value, 1)}`; };
    inp.addEventListener("input", () => { state.vals[c.id] = +inp.value; upd(); refresh(); });
    inp.addEventListener("pointerdown", e => e.stopPropagation()); c.inp = inp; c.upd = upd; upd(); box.appendChild(d);
  });
  refresh();
}
function setVal(c, v) { v = Math.min(c.max, Math.max(c.min, Math.round(v / c.step) * c.step)); state.vals[c.id] = v; c.inp.value = v; c.upd(); refresh(); }
function refresh() {
  rebuild();
  const L = infoFor(state.si, state.vals);
  $("info").innerHTML = `<div class="l" style="font-weight:600;color:#14305E">${SCENES[state.si].title}</div>` + L.map(l => `<div class="l" style="color:${l.c}">${l.t.replace(/</g, "&lt;")}</div>`).join("");
  panelDirty = true;
}
SCENES.forEach((S, i) => { const b = document.createElement("button"); b.textContent = S.tab; b.onclick = () => setScene(i); $("tabs").appendChild(b); });

// ---------- Πίνακας ελέγχου για headsets (καμβάς στο 3D) ----------
const PW = 1024, PH = 640; const pCanvas = document.createElement("canvas"); pCanvas.width = PW; pCanvas.height = PH;
const pTex = new THREE.CanvasTexture(pCanvas);
const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9 * PH / PW), new THREE.MeshBasicMaterial({ map: pTex, transparent: true }));
panel.visible = false; scene.add(panel);
let panelDirty = true, regions = [];
function drawPanel() {
  const g = pCanvas.getContext("2d"); g.clearRect(0, 0, PW, PH); regions = [];
  g.fillStyle = "rgba(255,255,255,0.96)"; g.fillRect(0, 0, PW, PH);
  g.strokeStyle = "#b9c3d6"; g.lineWidth = 3; g.strokeRect(2, 2, PW - 4, PH - 4);
  const tw = (PW - 20) / SCENES.length;
  SCENES.forEach((S, i) => { const x = 10 + i * tw; g.fillStyle = i === state.si ? "#14305E" : "#fff"; g.fillRect(x, 10, tw - 6, 56); g.strokeStyle = "#14305E"; g.strokeRect(x, 10, tw - 6, 56);
    g.fillStyle = i === state.si ? "#fff" : "#14305E"; g.font = "22px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(S.tab, x + (tw - 6) / 2, 38); regions.push({ x, y: 10, w: tw - 6, h: 56, f: () => setScene(i) }); });
  const cols = state.controls.length > 6 ? 2 : 1; const cw = 300, rh = 70;
  state.controls.forEach((c, i) => {
    const col = Math.floor(i / 6) % cols, row = i % 6, x = 14 + col * (cw + 14), y = 84 + row * rh;
    g.fillStyle = "#FF8C00"; g.font = "bold 26px sans-serif"; g.textAlign = "center"; g.fillText(`${c.label} = ${dec(state.vals[c.id], 1)}`, x + cw / 2, y + rh / 2);
    for (const [s, bx] of [[-1, x], [1, x + cw - 64]]) { g.fillStyle = "#14305E"; g.fillRect(bx, y + 8, 64, rh - 16); g.fillStyle = "#fff"; g.font = "bold 36px sans-serif"; g.fillText(s < 0 ? "−" : "+", bx + 32, y + rh / 2 + 2); regions.push({ x: bx, y: y + 8, w: 64, h: rh - 16, f: () => setVal(c, state.vals[c.id] + s * c.step) }); }
  });
  const ix = cols === 2 ? 650 : 340, L = infoFor(state.si, state.vals); g.textAlign = "left"; g.font = "22px sans-serif";
  g.fillStyle = "#14305E"; g.font = "bold 24px sans-serif"; g.fillText(SCENES[state.si].title, ix, 100);
  g.font = "22px sans-serif"; L.slice(0, 12).forEach((l, i) => { g.fillStyle = l.c; g.fillText(l.t, ix, 140 + i * 34); });
  pTex.needsUpdate = true;
}
const ray = new THREE.Raycaster(), tmpM = new THREE.Matrix4();
function onSelect(ctrl) {
  if (!panel.visible) return;
  tmpM.identity().extractRotation(ctrl.matrixWorld); ray.ray.origin.setFromMatrixPosition(ctrl.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(tmpM);
  const hit = ray.intersectObject(panel)[0]; if (!hit) return false;
  const x = hit.uv.x * PW, y = (1 - hit.uv.y) * PH; const r = regions.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (r) r.f(); return true;
}

// ---------- WebXR ----------
let session = null, hitSrc = null, refSpace = null, reticle = null, mode = "";
reticle = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x14305E })); reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);
const ctrls = [0, 1].map(i => { const c = renderer.xr.getController(i); c.addEventListener("select", () => { if (!onSelect(c)) onTapPlace(); }); const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1.2)]), new THREE.LineBasicMaterial({ color: 0xFF8C00 })); c.add(l); scene.add(c); return c; });
function onTapPlace() { if (mode === "ar" && !state.placed && reticle.visible) { world.position.setFromMatrixPosition(reticle.matrix); state.placed = true; reticle.visible = false; world.position.y += BOX * SC; if (state.domUI) $("bPlace").hidden = false; } }
$("bPlace").onclick = () => { state.placed = false; $("bPlace").hidden = true; };
async function start(kind) {
  try {
    const init = kind === "ar" ? { requiredFeatures: ["hit-test"], optionalFeatures: ["dom-overlay", "local-floor"], domOverlay: { root: document.body } } : { optionalFeatures: ["local-floor"] };
    session = await navigator.xr.requestSession(kind === "ar" ? "immersive-ar" : "immersive-vr", init);
  } catch (e) {
    if (kind === "ar") { try { session = await navigator.xr.requestSession("immersive-ar", { optionalFeatures: ["local-floor", "dom-overlay"], domOverlay: { root: document.body } }); } catch (e2) { alert("Δεν ξεκίνησε η συνεδρία: " + e2.message); return; } }
    else { alert("Δεν ξεκίνησε η συνεδρία: " + e.message); return; }
  }
  mode = kind; await renderer.xr.setSession(session);
  const dom = !!session.domOverlayState; state.domUI = dom && kind === "ar";
  scene.background = kind === "ar" ? null : new THREE.Color(0xEEF2F8);
  document.body.classList.toggle("ar", kind === "ar"); $("ui").style.display = state.domUI ? "block" : "none";
  panel.visible = !state.domUI; state.placed = kind !== "ar";
  if (kind === "vr") { world.position.set(0.5, 1.2, -1.1); panel.position.set(-0.55, 1.25, -0.9); panel.rotation.set(0, 0.45, 0); }
  else { reticle.visible = false; refSpace = await session.requestReferenceSpace("viewer"); hitSrc = await session.requestHitTestSource({ space: refSpace }); panel.position.set(-0.55, 0.15, -0.9); panel.rotation.set(0, 0.45, 0); }
  session.addEventListener("beforexrselect", e => { if (state.domUI && e.target.closest?.("#ui, #xrbar")) e.preventDefault(); });
  session.addEventListener("end", () => { session = null; hitSrc = null; mode = ""; panel.visible = false; scene.background = new THREE.Color(0xEEF2F8); document.body.classList.remove("ar"); $("ui").style.display = "block"; $("bPlace").hidden = true; world.position.set(0, 0, 0); state.placed = false; });
}
$("bAR").onclick = () => start("ar"); $("bVR").onclick = () => start("vr");
if (navigator.xr) {
  navigator.xr.isSessionSupported("immersive-ar").then(ok => { $("bAR").hidden = !ok; }).catch(() => {});
  navigator.xr.isSessionSupported("immersive-vr").then(ok => { $("bVR").hidden = !ok; }).catch(() => {});
}
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

buildStatic();
const q = new URLSearchParams(location.search); setScene(Math.max(0, Math.min(SCENES.length - 1, (+q.get("k") || 1) - 1)));
renderer.setAnimationLoop((t, frame) => {
  if (frame && hitSrc && mode === "ar" && !state.placed) { const h = frame.getHitTestResults(hitSrc); if (h.length) { reticle.visible = true; reticle.matrix.fromArray(h[0].getPose(renderer.xr.getReferenceSpace()).transform.matrix); } else reticle.visible = false; }
  if (panel.visible && panelDirty) { drawPanel(); panelDirty = false; }
  world.updateMatrixWorld(true); clipPlanes.forEach((p, i) => p.copy(baseClip[i]).applyMatrix4(world.matrixWorld));
  if (!session) orbit.update();
  renderer.render(scene, camera);
});
window.__gs = { drawPanel, pCanvas, panel, analyse, parabola, infoFor, setScene, state, SCENES, det3, inv3, rref, fr, dec };
