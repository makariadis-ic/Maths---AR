// Σύνολα: σκηνή WebXR για Magic Leap 2, Meta Quest 3 και tablet Samsung (Maths---AR)
// Οι 9 καταστάσεις αντιστοιχούν στα 9 αρχεία GeoGebra «Σύνολα Α΄ Λυκείου - 01 … 09» (ίδιες παράμετροι, ίδια κείμενα, ίδια χρώματα).
// Η σκηνή περιγράφεται σε μαθηματικές συντεταγμένες (x, y, z) με το z κατακόρυφο. Τα σχήματα βρίσκονται στο επίπεδο y = 0 και βλέπουν προς τον θεατή·
// τα στοιχεία των συνόλων (μάρκες με αριθμό) αιωρούνται μπροστά από το επίπεδο (y < 0).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COL = { blue: 0x1565C0, red: 0xC62828, green: 0x2E7D32, purple: 0x6A1B9A, orange: 0xEF6C00, teal: 0x00838F, navy: 0x1A237E, gray: 0x37474F, lgray: 0x90A4AE };
const HEX = k => '#' + COL[k].toString(16).padStart(6, '0');
const HX = k => (COL[k] !== undefined ? HEX(k) : k);   // κλειδί χρώματος ή τιμή CSS
const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',').replace('-', '−');
const PI = Math.PI;
const K = 0.1;            // μία μονάδα της γεωμετρίας = 10 cm στη σκηνή
const M0 = p => new THREE.Vector3(p[0], p[2], -p[1]);
const M = p => M0(p).multiplyScalar(K);
const TOK_Y = -0.05;      // βάθος των μαρκών μπροστά από το επίπεδο των διαγραμμάτων

// ------------------------------------------------------------------ Μαθηματικά βοηθητικά
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const sameSet = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const OMEGA30 = range(1, 30), OMEGA60 = range(1, 60);
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
const interval = (lo, hi, cl, cr) => { const s = Number.isInteger(lo) && Number.isInteger(hi) ? ', ' : '; '; return (cl ? '[' : '(') + fmt(lo) + s + fmt(hi) + (cr ? ']' : ')'); };
// Σύνολο σε γραμμές: «A = {1, 2, …}», με το πολύ per στοιχεία ανά γραμμή
function setLines(label, arr, c, per = 12) {
  if (!arr.length) return [{ t: label + ' = ∅', c }];
  const out = []; const chunks = [];
  for (let i = 0; i < arr.length; i += per) chunks.push(arr.slice(i, i + per).join(', '));
  chunks.forEach((s, i) => out.push({ t: (i === 0 ? label + ' = {' : '    ') + s + (i === chunks.length - 1 ? '}' : ','), c }));
  return out;
}

// ------------------------------------------------------------------ Γεωμετρία διαγραμμάτων Venn
const BOX2 = { x0: -3.6, x1: 3.6, z0: -2.3, z1: 2.3 };
const V2 = { cA: [-0.95, 0.15], cB: [0.95, 0.15], r: 1.55 };
const V3 = { cA: [-0.8, -0.55], cB: [0.8, -0.55], cC: [0, 0.85], r: 1.4 };
const inC = (pt, c, r, m = 0) => Math.hypot(pt[0] - c[0], pt[1] - c[1]) <= r + m;
const mask2 = (x, z) => (inC([x, z], V2.cA, V2.r) ? 1 : 0) | (inC([x, z], V2.cB, V2.r) ? 2 : 0);

// Θέσεις στοιχείων: κάθε στοιχείο μπαίνει σε σημείο πλέγματος της περιοχής του, κοντά σε ένα «άγκυρα»
function slotsFor(sp) {
  const pts = [];
  for (let x = BOX2.x0 + 0.3; x <= BOX2.x1 - 0.3 + 1e-9; x += sp) for (let z = BOX2.z0 + 0.3; z <= BOX2.z1 - 0.3 + 1e-9; z += sp) {
    const dA = Math.hypot(x - V2.cA[0], z - V2.cA[1]), dB = Math.hypot(x - V2.cB[0], z - V2.cB[1]); const mg = 0.17;
    const a = dA <= V2.r - mg ? 1 : dA >= V2.r + mg ? 0 : -1, b = dB <= V2.r - mg ? 1 : dB >= V2.r + mg ? 0 : -1;
    if (a < 0 || b < 0) continue;
    pts.push({ x, z, m: a | (b << 1) });
  }
  return pts;
}
const ANCH = { 1: [-1.55, 0.15], 2: [1.55, 0.15], 3: [0, 0.15], 0: [-2.85, -1.85] };
// items: [{n, m (μάσκα 0..3), fill, stroke, ring}] → ops 'tok'
function placeTokens(items, sp = 0.4, r = 0.17) {
  const slots = slotsFor(sp); const ops = []; const over = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const m of [0, 1, 2, 3]) {
    const mine = items.filter(it => it.m === m); const free = slots.filter(s => s.m === m);
    const a = ANCH[m]; free.sort((p, q) => Math.hypot(p.x - a[0], p.z - a[1]) - Math.hypot(q.x - a[0], q.z - a[1]));
    mine.forEach((it, i) => { if (i < free.length) ops.push({ t: 'tok', p: [free[i].x, TOK_Y * 10, free[i].z], n: it.n, fill: it.fill, stroke: it.stroke, ring: it.ring, r }); else over[m]++; });
  }
  const extra = over[0] + over[1] + over[2] + over[3];
  if (extra) ops.push({ t: 'txt', p: [2.4, TOK_Y * 10, -2.0], s: '+' + extra + ' ακόμη', c: 'gray', h: 0.3 });
  return ops;
}
const TS = {   // χρώματα μαρκών
  none: { fill: '#F5F7F8', stroke: '#90A4AE' }, A: { fill: '#AAC8EB', stroke: '#1565C0' }, B: { fill: '#E8AAAA', stroke: '#C62828' },
  AB: { fill: '#BC98D4', stroke: '#6A1B9A' }, G: { fill: '#9CCB9E', stroke: '#2E7D32' },
};
const styleOf = m => (m === 1 ? TS.A : m === 2 ? TS.B : m === 3 ? TS.AB : TS.none);

// Επίπεδο καμβά (διάγραμμα Venn, αριθμογραμμή): draw(g, W, H) σε εικονοστοιχεία
function vennCanvas(cx, cz, w, h, fillFn, circles, box, extra) {
  return {
    t: 'canvas', c: [cx, cz], w, h, px: 480,
    draw(g, W, H) {
      const X = x => (x - box.x0) / (box.x1 - box.x0) * W, Z = z => (box.z1 - z) / (box.z1 - box.z0) * H;
      g.fillStyle = '#F2F4F6'; g.fillRect(0, 0, W, H);
      const img = g.getImageData(0, 0, W, H); const d = img.data;
      for (let py = 0; py < H; py++) for (let pxl = 0; pxl < W; pxl++) {
        const x = box.x0 + (pxl + 0.5) / W * (box.x1 - box.x0), z = box.z1 - (py + 0.5) / H * (box.z1 - box.z0);
        let m = 0; circles.forEach((c, i) => { if (Math.hypot(x - c.c[0], z - c.c[1]) <= c.r) m |= (1 << i); });
        const col = fillFn(m); if (!col) continue;
        const o = (py * W + pxl) * 4, a = col[3];
        d[o] = d[o] * (1 - a) + col[0] * a; d[o + 1] = d[o + 1] * (1 - a) + col[1] * a; d[o + 2] = d[o + 2] * (1 - a) + col[2] * a;
      }
      g.putImageData(img, 0, 0);
      g.lineWidth = Math.max(2, W / 200);
      circles.forEach(c => { g.strokeStyle = c.col; g.beginPath(); g.arc(X(c.c[0]), Z(c.c[1]), c.r / (box.x1 - box.x0) * W, 0, 2 * PI); g.stroke(); });
      g.strokeStyle = '#B0BEC5'; g.lineWidth = Math.max(2, W / 160); g.strokeRect(1, 1, W - 2, H - 2);
      if (extra) extra(g, W, H, X, Z);
    },
  };
}
const RGB = { blue: [21, 101, 192], red: [198, 40, 40], green: [46, 125, 50], purple: [106, 27, 154] };
const fill2 = m => (m === 1 ? [...RGB.blue, 0.3] : m === 2 ? [...RGB.red, 0.28] : m === 3 ? [...RGB.purple, 0.34] : null);
const CIRC2 = [{ c: V2.cA, r: V2.r, col: '#4A8AD0' }, { c: V2.cB, r: V2.r, col: '#D05A5A' }];
const labelsAB = (aT = 'A', bT = 'B') => [
  { t: 'txt', p: [-2.2, 0, 2.0], s: aT, c: 'blue', h: 0.42 }, { t: 'txt', p: [2.2, 0, 2.0], s: bT, c: 'red', h: 0.42 },
];
const omegaLabel = s => ({ t: 'txt', p: [-3.45, 0, 2.05], s, c: 'gray', h: 0.34, a: 'l' });

// ------------------------------------------------------------------ Καταστάσεις (μαθηματικό περιεχόμενο)
const gridPos = (i, cols = 6, sx = 1.0, sz = 0.9) => { const r = Math.floor(i / cols), c = i % cols; return [(c - (cols - 1) / 2) * sx, TOK_Y * 10, ((5 - 1) / 2 - r) * sz]; };

const STATES = [
  {
    id: 'perigrafi', short: 'Περιγραφή', title: 'Σύνολο: περιγραφή, αναγραφή, πλήθος',
    params: [
      { key: 'p', label: 'Ιδιότητα (1 έως 4)', min: 1, max: 4, step: 1, val: 1 },
      { key: 'k', label: 'Αριθμός κ', min: 1, max: 6, step: 1, val: 3 },
      { key: 'q', label: 'Ο αριθμός q', min: 1, max: 30, step: 1, val: 12 },
    ],
    compute(P) {
      const { p, k, q } = P;
      const inSet = x => (p === 1 ? x % k === 0 : p === 2 ? (6 * k) % x === 0 : p === 3 ? x <= 4 * k : PRIMES.includes(x));
      const A = OMEGA30.filter(inSet);
      const prop = p === 1 ? 'x πολλαπλάσιο του ' + k : p === 2 ? 'x διαιρέτης του ' + 6 * k : p === 3 ? 'x ≤ ' + 4 * k : 'x πρώτος αριθμός';
      const ops = [{ t: 'canvas', c: [0, 0], w: 7.2, h: 5.0, px: 360, draw: (g, W, H) => { g.fillStyle = '#F2F4F6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#B0BEC5'; g.lineWidth = 3; g.strokeRect(1, 1, W - 2, H - 2); } }];
      OMEGA30.forEach((x, i) => { const s = inSet(x) ? TS.A : TS.none; ops.push({ t: 'tok', p: gridPos(i), n: x, fill: s.fill, stroke: s.stroke, ring: x === q, r: 0.36 }); });
      const lines = [{ t: 'Περιγραφή:  A = {x ∈ Ω | ' + prop + '}', c: 'blue' }, ...setLines('Αναγραφή:  A', A, 'blue', 15),
        { t: 'Πλήθος στοιχείων:  N(A) = ' + A.length, c: 'navy' },
        { t: inSet(q) ? q + ' ∈ A   (το q είναι στοιχείο του A)' : q + ' ∉ A   (το q δεν είναι στοιχείο του A)', c: 'orange' },
        { t: 'Μπλε: στοιχεία του A.  Γκρι: στοιχεία του Ω εκτός του A.  Ω = {1, 2, 3, …, 30}', c: 'gray' }];
      return { formula: 'Ω = {1, 2, 3, …, 30}', ops, lines, lines3: lines.slice(0, 4) };
    },
  },
  {
    id: 'ypo', short: 'Υποσύνολο', title: 'Υποσύνολο και ισότητα συνόλων',
    params: [
      { key: 'a', label: 'Το A αρχίζει στο α', min: 1, max: 30, step: 1, val: 5 },
      { key: 'b', label: 'Το A τελειώνει στο β', min: 1, max: 30, step: 1, val: 20 },
      { key: 'c', label: 'Το B αρχίζει στο γ', min: 1, max: 30, step: 1, val: 10 },
      { key: 'd', label: 'Το B τελειώνει στο δ', min: 1, max: 30, step: 1, val: 25 },
    ],
    compute(P) {
      const A = OMEGA30.filter(x => x >= P.a && x <= P.b), B = OMEGA30.filter(x => x >= P.c && x <= P.d);
      const ops = [{ t: 'canvas', c: [0, 0], w: 7.2, h: 5.0, px: 360, draw: (g, W, H) => { g.fillStyle = '#F2F4F6'; g.fillRect(0, 0, W, H); g.strokeStyle = '#B0BEC5'; g.lineWidth = 3; g.strokeRect(1, 1, W - 2, H - 2); } }];
      OMEGA30.forEach((x, i) => { const m = (A.includes(x) ? 1 : 0) | (B.includes(x) ? 2 : 0); const s = styleOf(m); ops.push({ t: 'tok', p: gridPos(i), n: x, fill: s.fill, stroke: s.stroke, r: 0.36 }); });
      const sub = (S, T) => S.every(x => T.includes(x)), yn = v => (v ? 'ΝΑΙ' : 'ΟΧΙ');
      const l1 = sub(A, B), l2 = sub(B, A), l3 = sameSet(A, B);
      const lines = [{ t: 'A = {x ∈ Ω | ' + P.a + ' ≤ x ≤ ' + P.b + '},   N(A) = ' + A.length, c: 'blue' }, { t: 'B = {x ∈ Ω | ' + P.c + ' ≤ x ≤ ' + P.d + '},   N(B) = ' + B.length, c: 'red' },
        { t: 'A ⊆ B :  ' + yn(l1), c: l1 ? 'green' : 'red' }, { t: 'B ⊆ A :  ' + yn(l2), c: l2 ? 'green' : 'red' }, { t: 'A = B :  ' + yn(l3), c: l3 ? 'green' : 'red' },
        { t: 'Μπλε: μόνο στο A.  Κόκκινο: μόνο στο B.  Μωβ: και στα δύο.  Γκρι: σε κανένα. Αν β < α, το A είναι το κενό σύνολο ∅.', c: 'gray' }];
      return { formula: 'A ⊆ B ⇔ κάθε στοιχείο του A ανήκει στο B', ops, lines, lines3: lines.slice(0, 5) };
    },
  },
  {
    id: 'venn', short: 'Venn', title: 'Διάγραμμα Venn δύο συνόλων',
    params: [{ key: 'a', label: 'Το A: πολλαπλάσια του α', min: 2, max: 9, step: 1, val: 2 }, { key: 'b', label: 'Το B: πολλαπλάσια του β', min: 2, max: 9, step: 1, val: 3 }],
    compute(P) {
      const A = OMEGA30.filter(x => x % P.a === 0), B = OMEGA30.filter(x => x % P.b === 0);
      const items = OMEGA30.map(x => { const m = (A.includes(x) ? 1 : 0) | (B.includes(x) ? 2 : 0); return { n: x, m, ...styleOf(m) }; });
      const ops = [vennCanvas(0, 0, 7.2, 4.6, fill2, CIRC2, BOX2), ...labelsAB(), omegaLabel('Ω'), ...placeTokens(items)];
      const I = A.filter(x => B.includes(x)), U = OMEGA30.filter(x => A.includes(x) || B.includes(x));
      const lines = [{ t: 'A = {x ∈ Ω | x πολλαπλάσιο του ' + P.a + '},   B = {x ∈ Ω | x πολλαπλάσιο του ' + P.b + '}', c: 'blue' },
        { t: 'N(A) = ' + A.length + ',   N(B) = ' + B.length, c: 'navy' }, { t: 'N(A ∩ B) = ' + I.length + ',   N(A ∪ B) = ' + U.length, c: 'purple' },
        { t: I.length ? 'Τα A και B έχουν κοινά στοιχεία.' : 'Τα A και B δεν έχουν κοινά στοιχεία (ξένα σύνολα).', c: 'green' },
        { t: 'Μπλε: μόνο στο A.  Μωβ: και στα δύο.  Κόκκινο: μόνο στο B.  Γκρι: στο Ω αλλά ούτε στο A ούτε στο B.', c: 'gray' }];
      return { formula: 'N(A ∪ B) = N(A) + N(B) − N(A ∩ B) = ' + A.length + ' + ' + B.length + ' − ' + I.length + ' = ' + U.length, ops, lines, lines3: lines.slice(0, 4) };
    },
  },
  {
    id: 'praxeis', short: 'Πράξεις', title: 'Πράξεις με σύνολα',
    params: [{ key: 'op', label: 'Πράξη (1 έως 8)', min: 1, max: 8, step: 1, val: 1 },
      { key: 'a', label: 'Το A: πολλαπλάσια του α', min: 2, max: 9, step: 1, val: 2 }, { key: 'b', label: 'Το B: πολλαπλάσια του β', min: 2, max: 9, step: 1, val: 3 }],
    compute(P) {
      const inA = x => x % P.a === 0, inB = x => x % P.b === 0;
      const f = [null, (a, b) => a || b, (a, b) => a && b, (a, b) => a && !b, (a, b) => b && !a, a => !a, (a, b) => !b, (a, b) => !(a || b), (a, b) => !(a && b)][P.op];
      const R = OMEGA30.filter(x => f(inA(x), inB(x)));
      const opn = ['', 'Α ∪ Β', 'Α ∩ Β', 'Α − Β', 'Β − Α', 'Α′', 'Β′', '(Α ∪ Β)′', '(Α ∩ Β)′'][P.op];
      const opd = ['', 'x ∈ Α ή x ∈ Β', 'x ∈ Α και x ∈ Β', 'x ∈ Α και x ∉ Β', 'x ∈ Β και x ∉ Α', 'x ∈ Ω και x ∉ Α', 'x ∈ Ω και x ∉ Β', 'x ∉ Α ∪ Β', 'x ∉ Α ∩ Β'][P.op];
      const hl = m => (f(!!(m & 1), !!(m & 2)) ? [...RGB.green, 0.55] : null);
      const items = OMEGA30.map(x => { const m = (inA(x) ? 1 : 0) | (inB(x) ? 2 : 0); const g = R.includes(x); return { n: x, m, ...(g ? TS.G : TS.none) }; });
      const ops = [vennCanvas(0, 0, 7.2, 4.6, hl, CIRC2, BOX2), ...labelsAB(), omegaLabel('Ω'), ...placeTokens(items)];
      const lines = [{ t: 'A = {x ∈ Ω | x πολλαπλάσιο του ' + P.a + '},   B = {x ∈ Ω | x πολλαπλάσιο του ' + P.b + '}', c: 'blue' },
        { t: opn + ' = {x ∈ Ω | ' + opd + '}', c: 'green' }, ...setLines(opn, R, 'navy', 15), { t: 'Πλήθος:  N(' + opn + ') = ' + R.length, c: 'navy' }];
      return { formula: 'Πράξη:  ' + opn, ops, lines, lines3: lines.slice(0, 4) };
    },
  },
  {
    id: 'demorgan', short: 'De Morgan', title: 'Νόμοι του De Morgan',
    params: [{ key: 'law', label: 'Νόμος (1 ή 2)', min: 1, max: 2, step: 1, val: 1 },
      { key: 'a', label: 'Το A: πολλαπλάσια του α', min: 2, max: 9, step: 1, val: 2 }, { key: 'b', label: 'Το B: πολλαπλάσια του β', min: 2, max: 9, step: 1, val: 3 }],
    compute(P) {
      const inA = x => x % P.a === 0, inB = x => x % P.b === 0;
      const law1 = P.law === 1;
      const L = x => (law1 ? !(inA(x) || inB(x)) : !(inA(x) && inB(x))), Rr = x => (law1 ? !inA(x) && !inB(x) : !inA(x) || !inB(x));
      const LS = OMEGA30.filter(L), RS = OMEGA30.filter(Rr);
      const box = { x0: -1.8, x1: 1.8, z0: -1.65, z1: 1.65 };
      const c2 = [{ c: [-0.55, 0], r: 0.95, col: '#4A8AD0' }, { c: [0.55, 0], r: 0.95, col: '#D05A5A' }];
      const lhs = vennCanvas(-1.95, 0, 3.6, 3.3, m => ((law1 ? !(m & 3) : m !== 3) ? [...RGB.green, 0.45] : null), c2, box);
      const rhsFn = m => {   // A′ μπλε, B′ κόκκινο (αν επικαλύπτονται, το χρώμα αναμειγνύεται)
        const nA = !(m & 1), nB = !(m & 2);
        if (law1) return nA && nB ? [...RGB.purple, 0.5] : null;
        return nA || nB ? [...(nA && nB ? RGB.purple : nA ? RGB.blue : RGB.red), 0.45] : null;
      };
      const rhs = vennCanvas(1.95, 0, 3.6, 3.3, rhsFn, c2, box);
      const t1 = law1 ? '(Α ∪ Β)′' : '(Α ∩ Β)′', t2 = law1 ? 'Α′ ∩ Β′' : 'Α′ ∪ Β′';
      const ops = [lhs, rhs, { t: 'txt', p: [-1.95, 0, 2.0], s: t1, c: 'green', h: 0.4 }, { t: 'txt', p: [1.95, 0, 2.0], s: t2, c: 'purple', h: 0.4 }];
      const eq = sameSet(LS, RS);
      const lines = [{ t: 'A: πολλαπλάσια του ' + P.a + ',   B: πολλαπλάσια του ' + P.b, c: 'gray' }, { t: 'Νόμος ' + P.law + ':  ' + t1 + ' = ' + t2, c: 'navy' },
        ...setLines(t1, LS, 'green', 15), ...setLines(t2, RS, 'purple', 15), { t: eq ? 'Τα δύο σύνολα είναι ίσα.' : 'Τα δύο σύνολα δεν είναι ίσα.', c: eq ? 'green' : 'red' }];
      return { formula: 'Νόμος ' + P.law + ':  ' + t1 + ' = ' + t2, ops, lines, lines3: [lines[1], ...lines.slice(2, 4), lines[lines.length - 1]] };
    },
  },
  {
    id: 'plithos', short: 'Ν(Α ∪ Β)', title: 'Πλήθος στοιχείων: Ν(Α ∪ Β)',
    params: [{ key: 'n', label: 'Μαθητές της τάξης n', min: 10, max: 60, step: 1, val: 30 }, { key: 'x', label: 'Μπάσκετ, N(A) = x', min: 0, max: 40, step: 1, val: 18 },
      { key: 'y', label: 'Βόλεϊ, N(B) = y', min: 0, max: 40, step: 1, val: 15 }, { key: 'z', label: 'Και τα δύο, N(A ∩ B) = z', min: 0, max: 30, step: 1, val: 7 }],
    compute(P) {
      const { n, x, y, z } = P; const u = x + y - z; const ok = z <= x && z <= y && u <= n;
      const ops = [vennCanvas(0, 0, 7.2, 4.6, fill2, CIRC2, BOX2), { t: 'txt', p: [-2.2, 0, 2.0], s: 'A: μπάσκετ', c: 'blue', h: 0.36 }, { t: 'txt', p: [2.2, 0, 2.0], s: 'B: βόλεϊ', c: 'red', h: 0.36 }, omegaLabel('Ω: η τάξη')];
      if (ok) ops.push({ t: 'txt', p: [-1.55, TOK_Y * 10, 0.2], s: String(x - z), c: 'blue', h: 0.62 }, { t: 'txt', p: [0, TOK_Y * 10, 0.2], s: String(z), c: 'purple', h: 0.62 }, { t: 'txt', p: [1.55, TOK_Y * 10, 0.2], s: String(y - z), c: 'red', h: 0.62 },
        { t: 'txt', p: [-2.8, TOK_Y * 10, -1.8], s: String(n - u), c: 'gray', h: 0.62 }, { t: 'txt', p: [-1.55, TOK_Y * 10, 0.75], s: 'μόνο A', c: 'blue', h: 0.26 }, { t: 'txt', p: [0, TOK_Y * 10, 0.75], s: 'και τα δύο', c: 'purple', h: 0.26 },
        { t: 'txt', p: [1.55, TOK_Y * 10, 0.75], s: 'μόνο B', c: 'red', h: 0.26 }, { t: 'txt', p: [-2.8, TOK_Y * 10, -1.25], s: 'κανένα από τα δύο', c: 'gray', h: 0.26 });
      const lines = [{ t: 'Σε μια τάξη με ' + n + ' μαθητές, ' + x + ' παίζουν μπάσκετ (A), ' + y + ' παίζουν βόλεϊ (B) και ' + z + ' παίζουν και τα δύο.', c: 'gray' }];
      if (ok) lines.push({ t: 'N(A ∪ B) = ' + x + ' + ' + y + ' − ' + z + ' = ' + u, c: 'purple' }, { t: 'Κανένα από τα δύο:  ' + n + ' − ' + u + ' = ' + (n - u), c: 'navy' });
      else lines.push({ t: 'Οι τιμές δεν είναι συμβατές: το z δεν μπορεί να ξεπερνά τα x και y, και το x + y − z δεν μπορεί να ξεπερνά το n.', c: 'red' });
      return { formula: 'N(A ∪ B) = N(A) + N(B) − N(A ∩ B)', ops, lines, lines3: lines };
    },
  },
  {
    id: 'diastimata', short: 'Διαστήματα', title: 'Διαστήματα πραγματικών αριθμών',
    params: [{ key: 'pa', label: 'Το A αρχίζει στο α', min: -6, max: 4, step: 0.5, val: -3 }, { key: 'pw', label: 'Μήκος του A', min: 0.5, max: 6, step: 0.5, val: 4 }, { key: 'ta', label: 'Είδος A (1 έως 4)', min: 1, max: 4, step: 1, val: 1 },
      { key: 'pc', label: 'Το B αρχίζει στο γ', min: -6, max: 4, step: 0.5, val: 0 }, { key: 'pv', label: 'Μήκος του B', min: 0.5, max: 6, step: 0.5, val: 5 }, { key: 'tb', label: 'Είδος B (1 έως 4)', min: 1, max: 4, step: 1, val: 2 }],
    compute(P) {
      const closedL = t => t === 1 || t === 3, closedR = t => t === 1 || t === 4;
      const A = { lo: P.pa, hi: P.pa + P.pw, cl: closedL(P.ta), cr: closedR(P.ta) }, B = { lo: P.pc, hi: P.pc + P.pv, cl: closedL(P.tb), cr: closedR(P.tb) };
      // τομή
      let I = null; { const lo = Math.max(A.lo, B.lo), hi = Math.min(A.hi, B.hi);
        const cl = A.lo === B.lo ? A.cl && B.cl : (A.lo > B.lo ? A.cl : B.cl), cr = A.hi === B.hi ? A.cr && B.cr : (A.hi < B.hi ? A.cr : B.cr);
        if (lo < hi || (lo === hi && cl && cr)) I = { lo, hi, cl, cr }; }
      // ένωση: ένα διάστημα ή δύο
      let U = [];
      { const [P1, P2] = A.lo <= B.lo ? [A, B] : [B, A];
        const touch = P1.hi > P2.lo || (P1.hi === P2.lo && (P1.cr || P2.cl));
        if (touch) {
          const hi = Math.max(P1.hi, P2.hi); const cr = P1.hi === P2.hi ? P1.cr || P2.cr : (P1.hi > P2.hi ? P1.cr : P2.cr);
          const cl = P1.lo === P2.lo ? P1.cl || P2.cl : P1.cl;
          U = [{ lo: P1.lo, hi, cl, cr }];
        } else U = [P1, P2]; }
      const str = v => interval(v.lo, v.hi, v.cl, v.cr);
      const X0 = -8, X1 = 12;
            const ops = [{
        t: 'canvas', c: [0, 0], w: 8.0, h: 4.4, px: 640,
        draw(g, W, H) {
          g.fillStyle = '#F2F4F6'; g.fillRect(0, 0, W, H);
          const X = x => (x - X0) / (X1 - X0) * W, Z = z => (2.2 - z) / 4.4 * H;
          g.strokeStyle = '#E3E8EC'; g.lineWidth = 1; for (let x = X0 + 1; x < X1; x++) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), H); g.stroke(); }
          g.strokeStyle = '#37474F'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, Z(-1.65)); g.lineTo(W, Z(-1.65)); g.stroke();
          g.fillStyle = '#37474F'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center';
          for (let x = X0 + 1; x < X1; x++) { g.beginPath(); g.moveTo(X(x), Z(-1.65) - 5); g.lineTo(X(x), Z(-1.65) + 5); g.stroke(); g.fillText(String(x).replace('-', '−'), X(x), Z(-1.65) + 24); }
          const seg = (v, col, z) => { g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.moveTo(X(v.lo), Z(z)); g.lineTo(X(v.hi), Z(z)); g.stroke();
            [[v.lo, v.cl], [v.hi, v.cr]].forEach(([x, cl]) => { g.beginPath(); g.arc(X(x), Z(z), 9, 0, 2 * PI); g.fillStyle = cl ? col : '#F2F4F6'; g.fill(); g.lineWidth = 4; g.strokeStyle = col; g.stroke(); }); };
          seg(A, '#1565C0', 1.45); seg(B, '#C62828', 0.55); if (I) seg(I, '#2E7D32', -0.35); U.forEach(v => seg(v, '#6A1B9A', -1.2));
        },
      }];
      const names = [['A', 'blue', 1.45], ['B', 'red', 0.55], ['A ∩ B', 'green', -0.35], ['A ∪ B', 'purple', -1.2]];
      names.forEach(([s, c, z]) => ops.push({ t: 'txt', p: [-3.8, TOK_Y * 10, z + 0.35], s, c, h: 0.34, a: 'l' }));
      const lines = [{ t: 'A = ' + str(A), c: 'blue' }, { t: 'B = ' + str(B), c: 'red' }, { t: 'A ∩ B = ' + (I ? str(I) : '∅'), c: 'green' }, { t: 'A ∪ B = ' + U.map(str).join(' ∪ '), c: 'purple' },
        { t: 'Είδη: 1 = [α, β],  2 = (α, β),  3 = [α, β),  4 = (α, β].  Γεμάτος κύκλος: το άκρο ανήκει.  Κενός κύκλος: δεν ανήκει.', c: 'gray' }];
      return { formula: 'Πράξεις με διαστήματα του ℝ', ops, lines, lines3: lines.slice(0, 4) };
    },
  },
  {
    id: 'mkd', short: 'ΜΚΔ', title: 'Διαιρέτες, κοινοί διαιρέτες και ΜΚΔ',
    params: [{ key: 'm', label: 'Ο αριθμός μ', min: 1, max: 60, step: 1, val: 36 }, { key: 'nn', label: 'Ο αριθμός ν', min: 1, max: 60, step: 1, val: 48 }],
    compute(P) {
      const D = n => OMEGA60.filter(x => n % x === 0); const A = D(P.m), B = D(P.nn); const I = A.filter(x => B.includes(x)); const g = Math.max(...I);
      const items = OMEGA60.filter(x => A.includes(x) || B.includes(x)).map(x => { const m = (A.includes(x) ? 1 : 0) | (B.includes(x) ? 2 : 0); return { n: x, m, ...(x === g ? { fill: '#FFD180', stroke: '#EF6C00' } : styleOf(m)), ring: x === g }; });
      const ops = [vennCanvas(0, 0, 7.2, 4.6, fill2, CIRC2, BOX2), { t: 'txt', p: [-2.2, 0, 2.0], s: 'Δ(μ): διαιρέτες του μ', c: 'blue', h: 0.34 }, { t: 'txt', p: [2.2, 0, 2.0], s: 'Δ(ν): διαιρέτες του ν', c: 'red', h: 0.34 },
        omegaLabel('Ω = {1, 2, 3, …, 60}'), ...placeTokens(items, 0.36, 0.16)];
      const lines = [{ t: 'Δ(μ) = διαιρέτες του ' + P.m + ':  ' + A.length + ' στοιχεία', c: 'blue' }, { t: 'Δ(ν) = διαιρέτες του ' + P.nn + ':  ' + B.length + ' στοιχεία', c: 'red' },
        { t: 'Κοινοί διαιρέτες:  Δ(μ) ∩ Δ(ν),  ' + I.length + ' στοιχεία', c: 'purple' }, { t: 'ΜΚΔ(' + P.m + ', ' + P.nn + ') = ' + g, c: 'navy' }, { t: 'Το ΜΚΔ είναι το μέγιστο στοιχείο του Δ(μ) ∩ Δ(ν) (πορτοκαλί).', c: 'gray' }];
      return { formula: 'ΜΚΔ(' + P.m + ', ' + P.nn + ') = ' + g, ops, lines, lines3: lines.slice(0, 4) };
    },
  },
  {
    id: 'tria', short: 'Τρία σύνολα', title: 'Τρία σύνολα: Ν(Α ∪ Β ∪ Γ)',
    params: [{ key: 'a', label: 'Το A: πολλαπλάσια του α', min: 2, max: 9, step: 1, val: 2 }, { key: 'b', label: 'Το B: πολλαπλάσια του β', min: 2, max: 9, step: 1, val: 3 }, { key: 'c', label: 'Το Γ: πολλαπλάσια του γ', min: 2, max: 9, step: 1, val: 5 }],
    compute(P) {
      const { a, b, c } = P; const f = k => Math.floor(60 / k);
      const nA = f(a), nB = f(b), nC = f(c), nAB = f(lcm(a, b)), nAC = f(lcm(a, c)), nBC = f(lcm(b, c)), nABC = f(lcm(lcm(a, b), c));
      const direct = OMEGA60.filter(x => x % a === 0 || x % b === 0 || x % c === 0).length;
      const u = nA + nB + nC - nAB - nAC - nBC + nABC;
      const circ = [{ c: V3.cA, r: V3.r, col: '#4A8AD0' }, { c: V3.cB, r: V3.r, col: '#D05A5A' }, { c: V3.cC, r: V3.r, col: '#5E9E62' }];
      const fill3 = m => { const n = (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1); if (!n) return null;
        const cols = [m & 1 ? RGB.blue : null, m & 2 ? RGB.red : null, m & 4 ? RGB.green : null].filter(Boolean); return [Math.round(cols.reduce((s, q) => s + q[0], 0) / n), Math.round(cols.reduce((s, q) => s + q[1], 0) / n), Math.round(cols.reduce((s, q) => s + q[2], 0) / n), 0.2 + 0.07 * n]; };
      const T = (s, x, z, col, h = 0.5) => ({ t: 'txt', p: [x, TOK_Y * 10, z], s: String(s), c: col, h });
      const ops = [vennCanvas(0, 0, 7.2, 4.6, fill3, circ, BOX2), omegaLabel('Ω = {1, 2, …, 60}'),
        { t: 'txt', p: [-2.6, 0, -1.2], s: 'A', c: 'blue', h: 0.42 }, { t: 'txt', p: [2.6, 0, -1.2], s: 'B', c: 'red', h: 0.42 }, { t: 'txt', p: [1.5, 0, 1.9], s: 'Γ', c: 'green', h: 0.42 },
        T(nA - nAB - nAC + nABC, -1.65, -0.7, 'blue'), T(nB - nAB - nBC + nABC, 1.65, -0.7, 'red'), T(nC - nAC - nBC + nABC, 0, 1.8, 'green'),
        T(nAB - nABC, 0, -1.0, 'purple'), T(nAC - nABC, -0.75, 0.45, 'gray'), T(nBC - nABC, 0.75, 0.45, 'gray'), T(nABC, 0, -0.05, 'navy'), T(60 - direct, 3.0, -1.9, 'gray', 0.46)];
      const lines = [{ t: 'N(A) = ' + nA + ',  N(B) = ' + nB + ',  N(Γ) = ' + nC, c: 'navy' }, { t: 'N(A∩B) = ' + nAB + ',  N(A∩Γ) = ' + nAC + ',  N(B∩Γ) = ' + nBC + ',  N(A∩B∩Γ) = ' + nABC, c: 'navy' },
        { t: 'N(A ∪ B ∪ Γ) = ' + nA + ' + ' + nB + ' + ' + nC + ' − ' + nAB + ' − ' + nAC + ' − ' + nBC + ' + ' + nABC + ' = ' + u, c: 'purple' },
        { t: 'Απευθείας μέτρηση: N(A ∪ B ∪ Γ) = ' + direct + (direct === u ? '  ✔' : '  ✘'), c: direct === u ? 'green' : 'red' }, { t: 'Οι αριθμοί στο διάγραμμα δείχνουν πόσα στοιχεία έχει κάθε περιοχή.', c: 'gray' }];
      return { formula: 'N(A ∪ B ∪ Γ) = N(A) + N(B) + N(Γ) − N(A∩B) − N(A∩Γ) − N(B∩Γ) + N(A∩B∩Γ)', ops, lines, lines3: lines.slice(0, 4), check: { u, direct } };
    },
  },
];

// ------------------------------------------------------------------ Βοηθητικά γραφικά
const texCache = new Map();
function canvasTex(key, w, h, drawFn) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; drawFn(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; texCache.set(key, tex); return tex;
}
function labelTexture(text, color = '#37474F', size = 64) { return canvasTex('l' + text + color + size, 256, 128, (g) => { g.font = `bold ${size}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(text, 128, 64); }); }
const measure = (() => { const g = document.createElement('canvas').getContext('2d'); return (t, px) => { g.font = `bold ${px}px sans-serif`; return g.measureText(t).width; }; })();
function textMesh(s, color, h, align) {
  const PXH = 96, w = Math.ceil(measure(s, 64) + 28), tex = canvasTex('t' + s + color, w, PXH, (g, W, H) => { g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(s, W / 2, H / 2 + 3); });
  const wU = h * w / PXH;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wU, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  return { m, wU };
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
      g.fillStyle = HX(ln.c || 'gray'); g.textBaseline = 'middle'; g.textAlign = 'left';
      g.fillText(ln.t, 12, lh * (i + 0.5));
    });
    tex.needsUpdate = true;
  };
  return mesh;
}
function disposeTree(o) { o.traverse(ch => { if (ch.geometry) ch.geometry.dispose(); if (ch.material) { /* οι υφές των μαρκών και των κειμένων είναι κοινές (cache) */ ch.material.dispose(); } }); }

// Σχήματα σε μαθηματικές συντεταγμένες → σκηνή
function buildOps(ops, grp) {
  for (const o of ops) {
    if (o.t === 'canvas') {
      const W = o.px, H = Math.round(o.px * o.h / o.w); const c = document.createElement('canvas'); c.width = W; c.height = H; o.draw(c.getContext('2d'), W, H);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w * K, o.h * K), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      m.position.copy(M([o.c[0], 0, o.c[1]])); m.userData.ownTex = true; grp.add(m);
    } else if (o.t === 'tok') {
      const key = 'k' + o.n + o.fill + o.stroke + (o.ring ? 1 : 0);
      const tex = canvasTex(key, 128, 128, (g) => {
        g.fillStyle = o.fill; g.beginPath(); g.arc(64, 64, 56, 0, 2 * PI); g.fill(); g.lineWidth = 6; g.strokeStyle = o.stroke; g.stroke();
        if (o.ring) { g.strokeStyle = '#EF6C00'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 61, 0, 2 * PI); g.stroke(); }
        g.fillStyle = '#37474F'; g.textAlign = 'center'; g.textBaseline = 'middle'; const s = String(o.n); g.font = `bold ${s.length > 1 ? 54 : 62}px sans-serif`; g.fillText(s, 64, 68);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * o.r * K * 1.1, 2 * o.r * K * 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
      m.position.copy(M(o.p)); grp.add(m);
    } else if (o.t === 'txt') {
      const { m, wU } = textMesh(o.s, HX(o.c), o.h * K, o.a); const p = M([o.p[0], o.p[1] === 0 ? -0.5 : o.p[1], o.p[2]]);
      if (o.a === 'l') p.x += wU / 2; m.position.copy(p); grp.add(m);
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

  const root = new THREE.Group(); root.scale.setScalar(1.6); scene.add(root);
  const dyn = new THREE.Group(); root.add(dyn);                // δυναμικά σχήματα
  const panel = new THREE.Group(); root.add(panel);            // 3D πίνακας ελέγχου για τα γυαλιά
  const interactives = [];

  const titlePlane = makeTextPlane(0.36, 0.05, 1600, 220); titlePlane.position.set(0, 0.32, 0); root.add(titlePlane);
  const infoPlane = makeTextPlane(0.36, 0.14, 1600, 560); infoPlane.position.set(0, -0.3, 0); root.add(infoPlane);

  let cur = 0;
  const S = () => STATES[cur];
  let lastResult = null;

  function refresh() {
    const st = S(); const r = st.compute(st.P);
    while (dyn.children.length) { const c = dyn.children[0]; dyn.remove(c); disposeTree(c); if (c.userData.ownTex && c.material.map) c.material.map.dispose(); }
    buildOps(r.ops, dyn);
    titlePlane.userData.draw([{ t: st.title, c: 'navy' }], { maxFont: 64 });
    infoPlane.userData.draw([{ t: r.formula, c: 'navy', bold: true }, ...(r.lines3 || r.lines).filter(l => l.t)], { maxFont: 40 });
    lastResult = r; syncUI();
  }

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
    rowLabels.length = 0;
    const per = 5, w = (PW - (per - 1) * 0.008) / per; const y0 = -0.415;
    STATES.forEach((s, i) => {
      const r = Math.floor(i / per), cc = i % per;
      const b = makeButton(s.short, w, 0.04, i === cur ? HEX('navy') : '#78909C', () => setState(i));
      b.position.set(-PW / 2 + w / 2 + cc * (w + 0.008), y0 - r * 0.046, 0.002); rowsGrp.add(b);
    });
    let yy = y0 - 2 * 0.046 - 0.02;
    S().params.forEach(q => {
      const lab = makeTextPlane(0.26, 0.036, 1040, 90); lab.position.set(-PW / 2 + 0.13, yy, 0.002); rowsGrp.add(lab); rowLabels.push([lab, q]);
      const mi = makeButton('−', 0.036, 0.036, HEX('orange'), () => stepParam(q, -1)); mi.position.set(PW / 2 - 0.1, yy, 0.002); rowsGrp.add(mi);
      const pl = makeButton('+', 0.036, 0.036, HEX('orange'), () => stepParam(q, +1)); pl.position.set(PW / 2 - 0.04, yy, 0.002); rowsGrp.add(pl);
      yy -= 0.042;
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
  uiSub.textContent = 'Κέντρο Καινοτομίας Θεσσαλίας, Άλγεβρα Α΄ Λυκείου, Σύνολα';
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
    for (const l of lastResult.lines) { if (!l.t) continue; const d = document.createElement('div'); d.textContent = l.t; d.style.color = HX(l.c); uiInfo.appendChild(d); }
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
  ['0', '1'].forEach(i => {
    const c = renderer.xr.getController(+i); scene.add(c);
    const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1.6)]), new THREE.LineBasicMaterial({ color: 0x00ACC1 })); ray.name = 'ray'; c.add(ray);
    c.addEventListener('selectstart', () => {
      if (handheld) return;
      tmpM.identity().extractRotation(c.matrixWorld); raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld); raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tmpM);
      const o = pick(); if (o) o.userData.onClick();
    });
    c.addEventListener('select', () => { if (handheld && reticle.visible) placeAtReticle(); });
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
      camera.setViewOffset(W, H, 0, Math.round(H * (portrait ? 0.27 : 0.23)), W, H);
      const dist = Math.max(1.95, 0.62 / (Math.tan(25 * PI / 180) * (W / H)));
      camera.position.set(dist * 0.04, dist * 0.07, dist * 0.99); controls.target.set(0, 0.02, 0); controls.update();   // σχεδόν μετωπική θέαση του διαγράμματος
    } else camera.clearViewOffset();
  }

  for (const st of STATES) st.P = Object.fromEntries(st.params.map(q => [q.key, q.val]));
  setMode();
  const k0 = parseInt(url.searchParams.get('k'), 10);
  setState(Number.isInteger(k0) && k0 >= 0 && k0 < STATES.length ? k0 : 0);

  // βοηθητικά για αυτοματοποιημένο έλεγχο
  window.__syn = {
    setState, states: STATES, refresh, getResult: () => lastResult, interactives, camera, panel, root, dyn, THREE,
    setParam(key, v) { S().P[key] = v; refresh(); updatePanelLabels(); },
    click(label, idx = 0) { const m = interactives.filter(x => x.parent && x.userData.label === label)[idx]; if (m) m.userData.onClick(); return !!m; },
    cur: () => cur,
  };
}
