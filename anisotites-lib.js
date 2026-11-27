// Ανισότητες: σκηνή WebXR για Magic Leap 2, Meta Quest 3 και tablet Samsung (Maths---AR)
// Οι 12 καταστάσεις αντιστοιχούν στα 12 αρχεία GeoGebra «Ανισότητες Α΄ Λυκείου - 01 … 12» (ίδιες παράμετροι, ίδια κείμενα, ίδια χρώματα).
// Τα διαγράμματα σχεδιάζονται σε καμβά (αριθμογραμμές, γραφήματα) που τοποθετείται στο επίπεδο y = 0 και βλέπει προς τον θεατή.
// Ο πίνακας ελέγχου για τα γυαλιά είναι τρισδιάστατος· σε tablet και υπολογιστή χρησιμοποιείται το περιβάλλον DOM.
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

// ------------------------------------------------------------------ Σχεδίαση σε καμβά (μαθηματικές συντεταγμένες → pixel)
const CW = 7.2, CH = 5.0, CPX = 1440;
function plot(g, W, H, x0, x1, y0, y1) {
  const X = x => (x - x0) / (x1 - x0) * W, Y = y => H - (y - y0) / (y1 - y0) * H;
  const P = {
    X, Y,
    seg(xa, ya, xb, yb, col, lw = 4, dash) { g.save(); g.strokeStyle = HX(col); g.lineWidth = lw; g.lineCap = 'butt'; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xb), Y(yb)); g.stroke(); g.restore(); },
    arrow(xa, ya, xb, yb, col, lw = 6) { if (Math.abs(xa - xb) < 1e-9) return; P.seg(xa, ya, xb, yb, col, lw); const d = Math.sign(xb - xa), px = X(xb), py = Y(yb); g.fillStyle = HX(col); g.beginPath(); g.moveTo(px, py); g.lineTo(px - d * 22, py - 11); g.lineTo(px - d * 22, py + 11); g.closePath(); g.fill(); },
    dot(x, y, col, r = 12, open = false) { g.beginPath(); g.arc(X(x), Y(y), r, 0, 2 * Math.PI); g.fillStyle = open ? '#FFFFFF' : HX(col); g.fill(); g.lineWidth = open ? 5 : 2.5; g.strokeStyle = open ? HX(col) : '#263238'; g.stroke(); },
    txt(s, x, y, col, px = 30, align = 'center') { g.font = `bold ${px}px sans-serif`; g.fillStyle = HX(col); g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, X(x), Y(y)); },
    numline(y, xa, xb, minor, major, dy, off = 0) {
      P.seg(xa, y, xb, y, 'gray', 4);
      for (let k = xa; k <= xb + 1e-9; k += minor) P.seg(k, y - 0.14 * (H / 450), k, y + 0.14 * (H / 450), 'gray', 3);
      for (let k = xa; k <= xb + 1e-9; k += major) P.txt(fmtN(k), k, y - dy, 'gray', 26);
    },
    strip(xa, xb, col, al) { const a = Math.max(0, X(xa)), b = Math.min(W, X(xb)); if (b <= a) return; g.save(); g.globalAlpha = al; g.fillStyle = HX(col); g.fillRect(a, 0, b - a, H); g.restore(); },
    fillRect(xa, ya, xb, yb, col, al) { g.save(); g.globalAlpha = al; g.fillStyle = HX(col); g.fillRect(X(xa), Y(yb), X(xb) - X(xa), Y(ya) - Y(yb)); g.restore(); },
    poly(pts, col, al, edge = true) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.closePath(); g.save(); g.globalAlpha = al; g.fillStyle = HX(col); g.fill(); g.restore(); if (edge) { g.lineWidth = 4; g.strokeStyle = HX('navy'); g.stroke(); } },
    curve(f, xa, xb, col, lw = 6) { g.save(); g.strokeStyle = HX(col); g.lineWidth = lw; g.lineJoin = 'round'; g.beginPath(); let pen = false; const n = 900; for (let i = 0; i <= n; i++) { const x = xa + (xb - xa) * i / n, y = f(x); if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { pen = false; continue; } if (!pen) { g.moveTo(X(x), Y(y)); pen = true; } else g.lineTo(X(x), Y(y)); } g.stroke(); g.restore(); },
    axes(gx = 1, gy = 1, lab = 2, labY = 2) {
      g.save(); g.lineWidth = 1.5; g.strokeStyle = '#DDE3E7';
      for (let x = Math.ceil(x0 / gx) * gx; x <= x1; x += gx) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), H); g.stroke(); }
      for (let y = Math.ceil(y0 / gy) * gy; y <= y1; y += gy) { g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(W, Y(y)); g.stroke(); }
      g.restore(); P.seg(x0, 0, x1, 0, 'gray', 3); P.seg(0, y0, 0, y1, 'gray', 3);
      for (let x = Math.ceil(x0 / lab) * lab; x <= x1; x += lab) if (Math.abs(x) > 1e-9) P.txt(fmtN(x), x, -0.04 * (y1 - y0) - 0.3 * (y1 - y0) / 12, 'gray', 22);
      for (let y = Math.ceil(y0 / labY) * labY; y <= y1; y += labY) if (Math.abs(y) > 1e-9) P.txt(fmtN(y), -0.025 * (x1 - x0) - 0.3 * (x1 - x0) / 18, y, 'gray', 22);
    },
  };
  return P;
}
const fmtN = v => String(Math.round(v * 100) / 100).replace('.', ',').replace('-', '−');
const frac = v => (Number.isInteger(v) ? ', ' : '; ');
const cv = draw => ({ t: 'canvas', c: [0, 0], w: CW, h: CH, px: CPX, draw: (g, W, H) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H); g.strokeStyle = '#CFD8DC'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3); draw(g, W, H); } });
const L = (t, c) => ({ t, c });
const sg = (v, nz = '') => (v > 0 ? ' + ' + fmtN(v) : v < 0 ? ' − ' + fmtN(-v) : nz);
const cmpS = (x, y) => (x < y ? '<' : x > y ? '>' : '=');
const IV = (lo, hi, cl, cr) => (cl ? '[' : '(') + fmtN(lo) + (Number.isInteger(lo) && Number.isInteger(hi) ? ', ' : '; ') + fmtN(hi) + (cr ? ']' : ')');
const TSUB = 'Κέντρο Καινοτομίας Θεσσαλίας, Άλγεβρα Α΄ Λυκείου, Ανισότητες';

const STATES = [
  // ---------------------------------------------------------------- 01
  {
    id: 'diataxi', short: 'Διάταξη', title: 'Διάταξη και ιδιότητες των ανισοτήτων',
    params: [
      { key: 'a', label: 'α', min: -5, max: 5, step: 0.5, val: -3 },
      { key: 'b', label: 'β', min: -5, max: 5, step: 0.5, val: 1 },
      { key: 'g', label: 'γ', min: -3, max: 3, step: 0.5, val: 2 },
    ],
    compute(P) {
      const { a, b, g } = P; const rows = [[5, a, b, 'α', 'β'], [0.5, a + g, b + g, 'α + γ', 'β + γ'], [-4, a * g, b * g, 'αγ', 'βγ']];
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -16, 16, -7, 8);
        rows.forEach(r => T.numline(r[0], -15, 15, 1, 5, 0.9));
        T.seg(0, 7.3, 0, -5.6, 'lgray', 2, [6, 8]);
        T.seg(rows[0][1], 5, rows[1][1], 0.5, 'blue', 2.5, [8, 8]); T.seg(rows[0][2], 5, rows[1][2], 0.5, 'red', 2.5, [8, 8]);
        rows.forEach(r => { T.seg(r[1], r[0], r[2], r[0], 'purple', 9); T.dot(r[1], r[0], 'blue', 13); T.dot(r[2], r[0], 'red', 13); T.txt(r[3], r[1], r[0] + 0.85, 'blue', 34); T.txt(r[4], r[2], r[0] + 0.85, 'red', 34); });
      })];
      const v = g > 0 ? 'Ο γ είναι θετικός: η φορά της ανισότητας δεν αλλάζει.' : g < 0 ? 'Ο γ είναι αρνητικός: η φορά της ανισότητας αλλάζει.' : 'Ο γ είναι μηδέν: και τα δύο γινόμενα είναι ίσα με 0.';
      const lines = [L(`Αρχικοί αριθμοί: α = ${fmtN(a)} και β = ${fmtN(b)}, άρα α ${cmpS(a, b)} β`, 'navy'),
        L(`Μετά την πρόσθεση του γ = ${fmtN(g)}: α + γ = ${fmtN(a + g)} και β + γ = ${fmtN(b + g)}, άρα α + γ ${cmpS(a + g, b + g)} β + γ`, 'navy'),
        L(`Μετά τον πολλαπλασιασμό με γ = ${fmtN(g)}: αγ = ${fmtN(a * g)} και βγ = ${fmtN(b * g)}, άρα αγ ${cmpS(a * g, b * g)} βγ`, 'navy'), L(v, 'green')];
      return { formula: 'α < β ⇒ α + γ < β + γ,   γ > 0: αγ < βγ,   γ < 0: αγ > βγ', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 02
  {
    id: 'diastima', short: 'Διαστήματα', title: 'Διαστήματα και αριθμογραμμή',
    params: [
      { key: 'a', label: 'α', min: -8, max: 8, step: 0.5, val: -3 },
      { key: 'w', label: 'Πλάτος', min: 1, max: 10, step: 0.5, val: 6 },
      { key: 't', label: 'Τύπος', min: 1, max: 4, step: 1, val: 1 },
      { key: 'x0', label: 'x', min: -12, max: 12, step: 0.5, val: 1 },
    ],
    compute(P) {
      const { a, w, t, x0 } = P; const b = a + w, cA = t === 1 || t === 3, cB = t === 1 || t === 4;
      const inn = (cA ? x0 >= a : x0 > a) && (cB ? x0 <= b : x0 < b);
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -13, 13, -3, 3);
        T.numline(0, -12, 12, 1, 2, 0.35); T.seg(a, 0, b, 0, 'blue', 14);
        T.dot(a, 0, 'blue', 14, !cA); T.dot(b, 0, 'red', 14, !cB); T.txt('α', a, 0.5, 'blue', 36); T.txt('β', b, 0.5, 'red', 36);
        T.dot(x0, 0.55, 'green', 13); T.txt('x', x0, 1.05, 'green', 34);
      })];
      const nm = ['Κλειστό διάστημα [α, β]', 'Ανοικτό διάστημα (α, β)', 'Κλειστό αριστερά, ανοικτό δεξιά [α, β)', 'Ανοικτό αριστερά, κλειστό δεξιά (α, β]'][t - 1];
      const lines = [L(nm, 'navy'), L('x ∈ ' + IV(a, b, cA, cB), 'blue'), L(`${fmtN(a)}${cA ? ' ≤ ' : ' < '}x${cB ? ' ≤ ' : ' < '}${fmtN(b)}`, 'blue'),
        L(`Το x = ${fmtN(x0)} ${inn ? 'ανήκει' : 'δεν ανήκει'} στο διάστημα`, inn ? 'green' : 'red')];
      return { formula: 'Διάστημα αριθμών και η παράστασή του στην αριθμογραμμή', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 03
  {
    id: 'apostasi', short: 'Απόσταση', title: 'Η απόλυτη τιμή ως απόσταση στην αριθμογραμμή',
    params: [
      { key: 'a', label: 'α', min: -8, max: 8, step: 0.5, val: 2 },
      { key: 'u', label: 'x', min: -10, max: 10, step: 0.5, val: -3.5 },
    ],
    compute(P) {
      const { a, u } = P;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -13, 13, -4, 4);
        T.numline(1.6, -12, 12, 1, 2, 0.45); T.numline(-1.6, -12, 12, 1, 2, 0.45);
        T.seg(0, 1.6, u, 1.6, 'red', 12); T.dot(0, 1.6, 'navy', 12); T.dot(u, 1.6, 'red', 14); T.txt('0', 0, 2.15, 'navy', 32); T.txt('x', u, 2.15, 'red', 34);
        T.seg(a, -1.6, u, -1.6, 'purple', 12); T.dot(a, -1.6, 'blue', 14); T.dot(u, -1.6, 'red', 14); T.txt('α', a, -1.05, 'blue', 34); T.txt('x', u, -1.05, 'red', 34);
      })];
      const lines = [L(`Απόσταση του x από το 0:   |x| = |${fmtN(u)}| = ${fmtN(Math.abs(u))}`, 'red'), L(`Απόσταση του x από το α:   |x − α| = |${fmtN(u)} − (${fmtN(a)})| = |${fmtN(u - a)}| = ${fmtN(Math.abs(u - a))}`, 'purple')];
      return { formula: '|x − α| = x − α αν x ≥ α,   |x − α| = α − x αν x < α', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 04
  {
    id: 'apolyti', short: 'Απόλυτη τιμή', title: 'Εξισώσεις και ανισώσεις της μορφής |x − x₀| ⋚ ρ',
    params: [
      { key: 'x0', label: 'x₀', min: -6, max: 6, step: 0.5, val: 1 },
      { key: 'r', label: 'ρ', min: 0, max: 8, step: 0.5, val: 3 },
      { key: 'k', label: 'Τύπος', min: 1, max: 3, step: 1, val: 2 },
    ],
    compute(P) {
      const { x0, r, k } = P; const Lf = x0 - r, R = x0 + r;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -13, 13, -3, 3);
        T.numline(0, -12, 12, 1, 2, 0.35);
        if (k === 2) T.seg(Lf, 0, R, 0, 'blue', 14);
        if (k === 3) { T.seg(-13, 0, Lf, 0, 'red', 14); T.seg(R, 0, 13, 0, 'red', 14); }
        T.dot(Lf, 0, 'purple', 14, k !== 1); T.dot(R, 0, 'purple', 14, k !== 1); T.dot(x0, 0, 'navy', 11);
        T.txt('x₀ − ρ', Lf, 0.55, 'purple', 30); T.txt('x₀ + ρ', R, 0.55, 'purple', 30); T.txt('x₀', x0, 0.55, 'navy', 30);
      })];
      const nm = k === 1 ? 'Εξίσωση |x − x₀| = ρ: τα x που απέχουν από το x₀ απόσταση ίση με ρ' : k === 2 ? 'Ανίσωση |x − x₀| < ρ: τα x που απέχουν από το x₀ απόσταση μικρότερη από ρ' : 'Ανίσωση |x − x₀| > ρ: τα x που απέχουν από το x₀ απόσταση μεγαλύτερη από ρ';
      const s = k === 1 ? `|x − x₀| = ${fmtN(r)} ⇔ x = ${fmtN(Lf)} ή x = ${fmtN(R)}` : k === 2 ? `|x − x₀| < ${fmtN(r)} ⇔ ${fmtN(Lf)} < x < ${fmtN(R)} ⇔ x ∈ (${fmtN(Lf)}, ${fmtN(R)})` : `|x − x₀| > ${fmtN(r)} ⇔ x < ${fmtN(Lf)} ή x > ${fmtN(R)} ⇔ x ∈ (−∞, ${fmtN(Lf)}) ∪ (${fmtN(R)}, +∞)`;
      const lines = [L(nm, 'navy'), L(s, k === 1 ? 'purple' : k === 2 ? 'blue' : 'red'), L('Τύπος 1: =,  2: <,  3: >', 'gray')];
      return { formula: '|x − x₀| < ρ ⇔ x₀ − ρ < x < x₀ + ρ', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 05
  {
    id: 'trigoniki', short: 'Τριγωνική', title: 'Τριγωνική ανισότητα: |α + β| ≤ |α| + |β|',
    params: [
      { key: 'a', label: 'α', min: -6, max: 6, step: 0.5, val: 3 },
      { key: 'b', label: 'β', min: -6, max: 6, step: 0.5, val: -5 },
    ],
    compute(P) {
      const { a, b } = P;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -13, 13, -3.2, 3.2);
        T.numline(0, -12, 12, 1, 2, 0.35);
        T.arrow(0, 1.6, a, 1.6, 'blue'); T.arrow(a, 1.1, a + b, 1.1, 'red'); T.arrow(0, 0.6, a + b, 0.6, 'purple');
        T.seg(0, -0.8, Math.abs(a), -0.8, 'blue', 14); T.seg(Math.abs(a), -0.8, Math.abs(a) + Math.abs(b), -0.8, 'red', 14); T.seg(0, -1.6, Math.abs(a + b), -1.6, 'purple', 14);
        T.txt('α', a / 2, 1.95, 'blue', 30); T.txt('β', a + b / 2, 1.45, 'red', 30); T.txt('α + β', (a + b) / 2, 0.95, 'purple', 28);
      })];
      const het = a * b < 0;
      const lines = [L(`|α + β| = |${fmtN(a + b)}| = ${fmtN(Math.abs(a + b))}`, 'purple'), L(`|α| + |β| = ${fmtN(Math.abs(a))} + ${fmtN(Math.abs(b))} = ${fmtN(Math.abs(a) + Math.abs(b))}`, 'navy'),
        het ? L('Ισχύει |α + β| < |α| + |β|, γιατί οι α και β είναι ετερόσημοι', 'red') : L('Ισχύει |α + β| = |α| + |β|, γιατί οι α και β είναι ομόσημοι ή ο ένας είναι 0', 'green'),
        L(`|α · β| = ${fmtN(Math.abs(a * b))}  και  |α| · |β| = ${fmtN(Math.abs(a) * Math.abs(b))}`, 'blue')];
      return { formula: '|α + β| ≤ |α| + |β|   και   |α · β| = |α| · |β|', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 06
  {
    id: 'grafiki', short: 'Γραφική', title: 'Γραφική παράσταση της f(x) = k|x − α| + β',
    params: [
      { key: 'k', label: 'k', min: -3, max: 3, step: 0.5, val: 1 },
      { key: 'a', label: 'α', min: -6, max: 6, step: 0.5, val: 2 },
      { key: 'b', label: 'β', min: -5, max: 5, step: 0.5, val: -1 },
    ],
    compute(P) {
      const { k, a, b } = P; const ok = k !== 0 && -b / k > 0, d = k !== 0 ? -b / k : 0;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -9, 9, -6, 6.3); T.axes(1, 1, 2, 2);
        T.curve(x => Math.abs(x), -9, 9, 'lgray', 4); T.curve(x => k * Math.abs(x - a) + b, -9, 9, 'blue', 8);
        T.dot(a, b, 'red', 13); T.txt('Κορυφή', a + 1.3, b - 0.5, 'red', 28);
        if (ok) { T.dot(a - d, 0, 'green', 11); T.dot(a + d, 0, 'green', 11); }
      })];
      const rt = k === 0 ? 'Η f είναι σταθερή.' : ok ? `Ρίζες: x = ${fmtN(a - d)} και x = ${fmtN(a + d)}` : (d === 0 ? `Μία ρίζα: x = ${fmtN(a)}` : 'Δεν υπάρχουν ρίζες.');
      const lines = [L(`f(x) = ${fmtN(k)}|x${a > 0 ? ' − ' + fmtN(a) : a < 0 ? ' + ' + fmtN(-a) : ''}|${sg(b)}`, 'blue'), L(`Κορυφή: (${fmtN(a)}; ${fmtN(b)})`, 'red'), L(rt, 'green'), L('Η γκρι διακεκομμένη είναι η y = |x|', 'gray')];
      return { formula: 'f(x) = k|x − α| + β', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 07
  {
    id: 'anisosi', short: 'Ανίσωση', title: 'Ανίσωση πρώτου βαθμού και γραφική παράσταση της y = αx + β',
    params: [
      { key: 'a', label: 'α', min: -3, max: 3, step: 0.5, val: 1.5 },
      { key: 'b', label: 'β', min: -6, max: 6, step: 0.5, val: -3 },
      { key: 's', label: 'Φορά', min: 1, max: 4, step: 1, val: 1 },
    ],
    compute(P) {
      const { a, b, s } = P; const op = ['>', '≥', '<', '≤'][s - 1], opf = ['<', '≤', '>', '≥'][s - 1], strict = s === 1 || s === 3, rr = a !== 0 ? -b / a : 0;
      const rg = (a > 0 && s <= 2) || (a < 0 && s >= 3);
      const ok0 = s === 1 ? b > 0 : s === 2 ? b >= 0 : s === 3 ? b < 0 : b <= 0;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -9, 9, -6, 6.3);
        if (a !== 0) { if (rg) T.strip(rr, 9, 'red', 0.18); else T.strip(-9, rr, 'red', 0.18); } else if (ok0) T.strip(-9, 9, 'red', 0.18);
        T.axes(1, 1, 2, 2); T.curve(x => a * x + b, -9, 9, 'blue', 8);
        if (a !== 0) { T.seg(rr, -6, rr, 6.3, 'red', 3, [10, 8]); T.dot(rr, 0, 'red', 13, strict); }
      })];
      const sb = b > 0 ? ' + ' + fmtN(b) : b < 0 ? ' − ' + fmtN(-b) : '';
      let line1, lines;
      if (a !== 0) {
        const ivs = rg ? (strict ? '(' : '[') + fmtN(rr) + ', +∞)' : '(−∞, ' + fmtN(rr) + (strict ? ')' : ']');
        line1 = `${fmtN(a)}x${sb} ${op} 0 ⇔ x ${a > 0 ? op : opf} ${fmtN(rr)} ⇔ x ∈ ${ivs}`;
        lines = [L(line1, 'blue')];
      } else { lines = [L(`0 · x${sb} ${op} 0 ⇔ ${fmtN(b)} ${op} 0`, 'blue'), ok0 ? L('Για α = 0 η ανίσωση είναι αληθής για κάθε x', 'green') : L('Για α = 0 η ανίσωση είναι αδύνατη', 'red')]; }
      lines.push(L('Φορά 1: >,  2: ≥,  3: <,  4: ≤', 'gray'));
      return { formula: 'αx + β > 0 ⇔ x > −β/α αν α > 0, και x < −β/α αν α < 0', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 08
  {
    id: 'systima', short: 'Σύστημα', title: 'Σύστημα ανισώσεων: τομή και ένωση διαστημάτων',
    params: [
      { key: 'a', label: 'α', min: -9, max: 6, step: 0.5, val: -5 },
      { key: 'wa', label: 'Πλάτος Α', min: 1, max: 10, step: 0.5, val: 6 },
      { key: 'c', label: 'γ', min: -9, max: 6, step: 0.5, val: 0 },
      { key: 'wc', label: 'Πλάτος Β', min: 1, max: 10, step: 0.5, val: 7 },
    ],
    compute(P) {
      const { a, wa, c, wc } = P; const b = a + wa, d = c + wc, lo = Math.max(a, c), hi = Math.min(b, d), ne = lo <= hi;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -13, 13, -5.2, 2.8);
        T.numline(0, -12, 12, 1, 2, 0.5);
        T.seg(a, 2, b, 2, 'blue', 14); T.dot(a, 2, 'blue', 13); T.dot(b, 2, 'blue', 13); T.txt('Α', -12.4, 2, 'blue', 40);
        T.seg(c, 1, d, 1, 'red', 14); T.dot(c, 1, 'red', 13); T.dot(d, 1, 'red', 13); T.txt('Β', -12.4, 1, 'red', 40);
        if (ne) { T.seg(lo, -1.2, hi, -1.2, 'purple', 14); T.dot(lo, -1.2, 'purple', 13); T.dot(hi, -1.2, 'purple', 13); }
        T.txt('Α ∩ Β', -12.2, -1.2, 'purple', 34); T.seg(a, -2.6, b, -2.6, 'green', 14); T.seg(c, -2.6, d, -2.6, 'green', 14); T.txt('Α ∪ Β', -12.2, -2.6, 'green', 34);
      })];
      const lines = [L(`Α = [${fmtN(a)}, ${fmtN(b)}],   Β = [${fmtN(c)}, ${fmtN(d)}]`, 'navy'), L(ne ? `Α ∩ Β = [${fmtN(lo)}, ${fmtN(hi)}]` : 'Α ∩ Β = ∅', 'purple'),
        L(ne ? `Α ∪ Β = [${fmtN(Math.min(a, c))}, ${fmtN(Math.max(b, d))}]` : `Α ∪ Β = [${fmtN(a)}, ${fmtN(b)}] ∪ [${fmtN(c)}, ${fmtN(d)}]`, 'green'), L('Η τομή περιέχει τους αριθμούς που ανήκουν και στα δύο σύνολα', 'gray')];
      return { formula: 'Σύστημα ανισώσεων: η λύση είναι η τομή των συνόλων λύσεων', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 09
  {
    id: 'xn', short: 'Εξίσωση xᵛ', title: 'Η εξίσωση xᵛ = α και οι ρίζες της',
    params: [
      { key: 'n', label: 'ν', min: 1, max: 8, step: 1, val: 3 },
      { key: 'al', label: 'α', min: -8, max: 8, step: 0.5, val: 2 },
    ],
    compute(P) {
      const { n, al } = P; const od = n % 2 === 1, xr = Math.pow(Math.abs(al), 1 / n), x1 = od ? Math.sign(al) * xr : xr;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -9, 9, -10, 10); T.axes(1, 1, 2, 2);
        T.curve(x => Math.pow(x, n), -9, 9, 'blue', 8); T.seg(-9, al, 9, al, 'red', 6);
        if (od || al >= 0) T.dot(x1, al, 'green', 13); if (!od && al > 0) T.dot(-xr, al, 'green', 13);
      })];
      const e1 = od ? `x = ${rootS(n)}(${fmtN(al)}) = ${fmtN(x1)}` : al > 0 ? `x = ±${rootS(n)}(${fmtN(al)}) = ±${fmtN(xr)}` : al === 0 ? 'x = 0' : 'Η εξίσωση είναι αδύνατη';
      const e2 = od ? 'ν περιττός: μία πραγματική ρίζα για κάθε α' : al > 0 ? 'ν άρτιος και α > 0: δύο ρίζες αντίθετες' : al === 0 ? 'ν άρτιος και α = 0: μία ρίζα, το 0' : 'ν άρτιος και α < 0: καμία πραγματική ρίζα';
      const lines = [L(`x${sup(n)} = ${fmtN(al)}`, 'blue'), L(e1, 'green'), L(e2, 'gray'), L('Μπλε: y = xᵛ.  Κόκκινη: y = α.  Οι ρίζες είναι οι τετμημένες των κοινών σημείων.', 'gray')];
      return { formula: 'xᵛ = α', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 10
  {
    id: 'xnanis', short: 'Ανίσωση xᵛ', title: 'Ανισώσεις της μορφής xᵛ ⋚ α και γραφική επίλυση',
    params: [
      { key: 'n', label: 'ν', min: 1, max: 8, step: 1, val: 2 },
      { key: 'al', label: 'α', min: -8, max: 8, step: 0.5, val: 4 },
      { key: 's', label: 'Φορά', min: 1, max: 4, step: 1, val: 1 },
    ],
    compute(P) {
      const { n, al, s } = P; const od = n % 2 === 1, xr = Math.pow(Math.abs(al), 1 / n), x1 = od ? Math.sign(al) * xr : xr;
      const test = x => { const v = Math.pow(x, n); return s === 1 ? v < al : s === 2 ? v <= al : s === 3 ? v > al : v >= al; };
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -9, 9, -10, 10); const st = 0.04;
        for (let x = -9; x < 9; x += st) if (test(x + st / 2)) T.strip(x, x + st + 0.02, 'red', 0.16);
        T.axes(1, 1, 2, 2); T.curve(x => Math.pow(x, n), -9, 9, 'blue', 8); T.seg(-9, al, 9, al, 'red', 6);
      })];
      const R = fmtN(xr), nR = fmtN(-xr), Ro = fmtN(x1);
      const sol = od ? (s === 1 ? `(−∞, ${Ro})` : s === 2 ? `(−∞, ${Ro}]` : s === 3 ? `(${Ro}, +∞)` : `[${Ro}, +∞)`)
        : s === 1 ? (al > 0 ? `(${nR}, ${R})` : '∅') : s === 2 ? (al > 0 ? `[${nR}, ${R}]` : al === 0 ? '{0}' : '∅')
        : s === 3 ? (al > 0 ? `(−∞, ${nR}) ∪ (${R}, +∞)` : al === 0 ? '(−∞, 0) ∪ (0, +∞)' : 'ℝ') : (al > 0 ? `(−∞, ${nR}] ∪ [${R}, +∞)` : 'ℝ');
      const lines = [L(`x${sup(n)} ${['<', '≤', '>', '≥'][s - 1]} ${fmtN(al)}`, 'blue'), L('Σύνολο λύσεων: ' + sol, 'red'), L('Φορά 1: <,  2: ≤,  3: >,  4: ≥', 'gray'),
        L('Οι λύσεις είναι τα x για τα οποία η μπλε καμπύλη βρίσκεται κάτω ή πάνω από την κόκκινη ευθεία', 'gray')];
      return { formula: 'Ανισώσεις xᵛ ⋚ α: ανάγνωση της λύσης από το γράφημα', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 11
  {
    id: 'anoxi', short: 'Ανοχή', title: 'Εφαρμογή: έλεγχος ανοχής διάστασης με την ανίσωση |d − N| ≤ ε',
    params: [
      { key: 'N', label: 'N', min: 24.9, max: 25.1, step: 0.01, val: 25 },
      { key: 'tl', label: 'ε', min: 0.01, max: 0.1, step: 0.01, val: 0.04 },
    ],
    compute(P) {
      const { N, tl } = P; const lst = [25.02, 24.97, 25.06, 25.00, 24.95, 25.03, 24.99, 25.04, 24.96, 25.01];
      const okL = lst.filter(v => Math.abs(v - N) <= tl + 1e-6), bdL = lst.filter(v => Math.abs(v - N) > tl + 1e-6);
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, 24.88, 25.12, -1.9, 1.9);
        T.fillRect(N - tl, -1.3, N + tl, 1.3, 'green', 0.13); T.seg(N - tl, -1.3, N - tl, 1.3, 'green', 3); T.seg(N + tl, -1.3, N + tl, 1.3, 'green', 3); T.seg(N, -1.3, N, 1.3, 'green', 3, [10, 8]);
        T.seg(24.9, 0, 25.1, 0, 'gray', 4);
        for (let i = 0; i <= 20; i++) { const x = 24.9 + i * 0.01; T.seg(x, -0.14, x, 0.14, 'gray', 3); }
        for (let i = 0; i <= 4; i++) { const x = 24.9 + i * 0.05; T.txt(fmtN(Math.round(x * 100) / 100), x, -0.4, 'gray', 28); }
        okL.forEach((v, i) => T.dot(v, 0.35 + 0.3 * ((i + 1) % 3), 'green', 13)); bdL.forEach((v, i) => T.dot(v, 0.35 + 0.3 * ((i + 1) % 3), 'red', 13));
      })];
      const f3 = v => String(Math.round(v * 1000) / 1000).replace('.', ',');
      const lines = [L(`|d − N| ≤ ε ⇔ N − ε ≤ d ≤ N + ε ⇔ d ∈ [${f3(N - tl)}; ${f3(N + tl)}]`, 'navy'), L(`Αποδεκτά τεμάχια: ${okL.length} από 10`, 'green'), L(`Απορριπτέα τεμάχια: ${bdL.length} από 10`, 'red'),
        L('Οι 10 μετρήσεις (σε mm) εμφανίζονται ως σημεία: πράσινα αποδεκτά, κόκκινα απορριπτέα', 'gray')];
      return { formula: '|d − N| ≤ ε', ops, lines, lines3: lines };
    },
  },
  // ---------------------------------------------------------------- 12
  {
    id: 'rizes', short: 'Ρίζες', title: 'Εφαρμογή: πλευρά τετραγώνου από το εμβαδόν, ακμή κύβου από τον όγκο',
    params: [
      { key: 'EE', label: 'Ε (m²)', min: 1, max: 36, step: 1, val: 16 },
      { key: 'VV', label: 'V (m³)', min: 1, max: 64, step: 1, val: 27 },
    ],
    compute(P) {
      const { EE, VV } = P; const sq = Math.sqrt(EE), cb = Math.cbrt(VV), hh = 0.5 * cb;
      const ops = [cv((gc, W, H) => {
        const T = plot(gc, W, H, -1, 19, -1.5, 12.4); const y0 = 0.5;
        T.poly([[0.5, y0], [0.5 + sq, y0], [0.5 + sq, y0 + sq], [0.5, y0 + sq]], 'green', 0.30);
        const x = 10;
        T.poly([[x, y0], [x + cb, y0], [x + cb, y0 + cb], [x, y0 + cb]], 'blue', 0.30);
        T.poly([[x, y0 + cb], [x + cb, y0 + cb], [x + cb + hh, y0 + cb + hh], [x + hh, y0 + cb + hh]], 'blue', 0.12);
        T.poly([[x + cb, y0], [x + cb + hh, y0 + hh], [x + cb + hh, y0 + cb + hh], [x + cb, y0 + cb]], 'blue', 0.50);
        T.txt('x', 0.5 + sq / 2, y0 + sq / 2, 'navy', 40); T.txt('x', x + cb / 2, y0 + cb / 2, 'navy', 40);
      })];
      const lines = [L(`Τετράγωνο με εμβαδόν ${fmtN(EE)} m²: πλευρά ${fmtN(sq)} m`, 'green'), L(`Κύβος με όγκο ${fmtN(VV)} m³: ακμή ${fmtN(cb)} m`, 'blue'),
        L(`x² = ${fmtN(EE)} ⇒ x = √${fmtN(EE)} ≈ ${fmtN(sq)}`, 'green'), L(`x³ = ${fmtN(VV)} ⇒ x = ∛${fmtN(VV)} ≈ ${fmtN(cb)}`, 'blue')];
      return { formula: 'x² = Ε ⇒ x = √Ε   και   x³ = V ⇒ x = ∛V', ops, lines, lines3: lines };
    },
  },
];
function sup(n) { return ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸'][n] || '^' + n; }
const rootS = n => (n === 2 ? '√' : n === 3 ? '∛' : n === 4 ? '∜' : n + '√');

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
    const per = 6, w = (PW - (per - 1) * 0.008) / per; const y0 = -0.415;
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
  uiSub.textContent = TSUB;
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
  window.__ani = {
    setState, states: STATES, refresh, getResult: () => lastResult, interactives, camera, panel, root, dyn, THREE,
    setParam(key, v) { S().P[key] = v; refresh(); updatePanelLabels(); },
    click(label, idx = 0) { const m = interactives.filter(x => x.parent && x.userData.label === label)[idx]; if (m) m.userData.onClick(); return !!m; },
    cur: () => cur,
  };
}
