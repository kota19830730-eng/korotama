/* ---------------------------------------------------------
   絵本ふうの キャラクター（まなびたまご）
   ブロックの モンスターでは なく、A案「あたたかい 絵本ふう」の 世界に 合う まるくて やわらかい 絵（SVG）。
   きまり：黒い ふちは 使わない（ふちは 同じ 色みの こい色）／色は クレヨンの ような やわらかい 色／目は 白目＋黒目＋光／ほっぺは ピンク。
     MQ.charart.svg(id)  … <svg viewBox="0 0 100 100"> の 文字列
     MQ.charart.url(id)  … data:image/svg+xml（<img src> に そのまま）
     MQ.charart.list()   … id の ならび
   見本は Claude Design の キャンバス（https://claude.ai/artifact/UqVqkMtqAKBJ3BZHU3ZZD8 ）と 同じ 絵。
   node でも 動く（キャンバスの 絵を この ファイルから 作る ため）。
   --------------------------------------------------------- */
(function () {
  const ROOT = typeof window !== 'undefined' ? window : globalThis;
  ROOT.MQ = ROOT.MQ || {};

  /* ---- 部品 ---- */
  function el(tag, a, inner) {
    let s = '<' + tag;
    Object.keys(a || {}).forEach(function (k) { s += ' ' + k + '="' + a[k] + '"'; });
    return s + (inner != null ? '>' + inner + '</' + tag + '>' : '/>');
  }
  function circle(cx, cy, r, fill, extra) { return el('circle', Object.assign({ cx: cx, cy: cy, r: r, fill: fill }, extra || {})); }
  function ellipse(cx, cy, rx, ry, fill, extra) { return el('ellipse', Object.assign({ cx: cx, cy: cy, rx: rx, ry: ry, fill: fill }, extra || {})); }
  function rect(x, y, w, h, r, fill, extra) { return el('rect', Object.assign({ x: x, y: y, width: w, height: h, rx: r, ry: r, fill: fill }, extra || {})); }
  function path(d, fill, extra) { return el('path', Object.assign({ d: d, fill: fill }, extra || {})); }
  function stroke(d, color, w) { return el('path', { d: d, fill: 'none', stroke: color, 'stroke-width': w || 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); }
  const INK = '#4a3b32';
  const CHEEK = '#f0a3a0';
  /* 目：白目＋黒目＋光。kind: 'round'（ふつう）／'happy'（にっこり 線）／'sharp'（かっこいい・少し つり目） */
  function eyes(cx1, cx2, cy, r, kind) {
    r = r || 6;
    if (kind === 'happy') return stroke('M' + (cx1 - r) + ' ' + cy + ' q' + r + ' -' + (r * 1.1) + ' ' + (r * 2) + ' 0', INK, 2.8) + stroke('M' + (cx2 - r) + ' ' + cy + ' q' + r + ' -' + (r * 1.1) + ' ' + (r * 2) + ' 0', INK, 2.8);
    let s = '';
    [cx1, cx2].forEach(function (cx, i) {
      s += circle(cx, cy, r, '#fffdf7');
      if (kind === 'sharp') s += path('M' + (cx - r) + ' ' + (cy - r * 0.9) + ' L' + (cx + r) + ' ' + (cy - r * 0.35) + ' L' + (cx + r) + ' ' + (cy - r) + ' L' + (cx - r) + ' ' + (cy - r) + ' Z', 'var(--sk, #0000)');
      s += circle(cx + (i ? 0.6 : -0.6), cy + 0.8, r * 0.55, INK);
      s += circle(cx + (i ? -0.6 : -1.8), cy - 1, r * 0.22, '#ffffff');
    });
    return s;
  }
  function cheeks(cx1, cx2, cy, rx) { return ellipse(cx1, cy, rx || 5, (rx || 5) * 0.6, CHEEK, { opacity: 0.7 }) + ellipse(cx2, cy, rx || 5, (rx || 5) * 0.6, CHEEK, { opacity: 0.7 }); }
  function smile(cx, cy, w, up) { return stroke('M' + (cx - w) + ' ' + cy + ' q' + w + ' ' + (up === false ? -6 : 7) + ' ' + (w * 2) + ' 0', INK, 2.6); }
  function feet(cx1, cx2, cy, fill, rx) { return ellipse(cx1, cy, rx || 8, 4.5, fill) + ellipse(cx2, cy, rx || 8, 4.5, fill); }
  function shadow() { return ellipse(50, 94, 26, 3.5, '#8f7a5a', { opacity: 0.18 }); }
  function wrap(inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">' + inner + '</svg>'; }

  /* ---- キャラクター ---- */
  const ART = {
    /* ===== かわいい ===== */
    rabbit: function () {
      const A = '#f6c6d2', B = '#e39aae', C = '#fde9ef';
      return shadow() +
        rect(31, 6, 14, 40, 7, A) + rect(55, 6, 14, 40, 7, A) + rect(35, 11, 6, 28, 3, C) + rect(59, 11, 6, 28, 3, C) +
        ellipse(50, 62, 30, 28, A) + ellipse(50, 70, 18, 14, C) +
        feet(38, 62, 89, B) +
        eyes(40, 60, 56, 6) + cheeks(31, 69, 65) + ellipse(50, 64, 3, 2.2, B) + smile(50, 69, 5);
    },
    cat: function () {
      const A = '#f4b56a', B = '#d9893a', C = '#fde7cf';
      return shadow() +
        path('M24 44 L28 14 L46 34 Z', A) + path('M76 44 L72 14 L54 34 Z', A) + path('M30 40 L31 24 L41 35 Z', '#f0a3a0') + path('M70 40 L69 24 L59 35 Z', '#f0a3a0') +
        ellipse(50, 62, 30, 28, A) + ellipse(50, 72, 17, 12, C) +
        stroke('M44 28 q6 -6 12 0', B, 3) + stroke('M40 34 q10 -8 20 0', B, 3) +
        feet(38, 62, 89, B) +
        eyes(40, 56, 56, 6) + cheeks(31, 69, 65) + path('M47 63 L53 63 L50 66 Z', B) + smile(50, 68, 5) +
        stroke('M22 62 L34 64 M22 70 L34 68 M78 62 L66 64 M78 70 L66 68', B, 2);
    },
    chick: function () {
      const A = '#f8d64e', B = '#e0ad1f', C = '#f49a2e';
      return shadow() +
        stroke('M44 26 q0 -10 6 -14 M50 24 q2 -10 10 -12 M48 25 q-6 -8 -12 -6', B, 3) +
        ellipse(50, 60, 30, 30, A) + ellipse(50, 70, 18, 14, '#fbe79a') +
        ellipse(22, 62, 9, 14, A, { transform: 'rotate(20 22 62)' }) + ellipse(78, 62, 9, 14, A, { transform: 'rotate(-20 78 62)' }) +
        feet(40, 60, 90, C, 7) +
        eyes(40, 60, 54, 6) + cheeks(30, 70, 63) + path('M44 61 L56 61 L50 68 Z', C);
    },
    penguin: function () {
      const A = '#3f5276', B = '#2b3a58', C = '#fffaf0', D = '#f49a2e';
      return shadow() +
        ellipse(50, 58, 30, 32, A) + ellipse(50, 66, 19, 22, C) +
        ellipse(20, 62, 7, 16, A, { transform: 'rotate(18 20 62)' }) + ellipse(80, 62, 7, 16, A, { transform: 'rotate(-18 80 62)' }) +
        feet(39, 61, 90, D, 8) +
        ellipse(50, 44, 20, 14, C) + eyes(42, 58, 44, 5.5) + cheeks(33, 67, 52, 4) + path('M45 50 L55 50 L50 56 Z', D);
    },
    bear: function () {
      const A = '#b98258', B = '#8f5e3a', C = '#e9cfae';
      return shadow() +
        circle(27, 34, 11, A) + circle(73, 34, 11, A) + circle(27, 34, 6, C) + circle(73, 34, 6, C) +
        ellipse(50, 60, 31, 29, A) + ellipse(50, 72, 20, 14, C) +
        feet(38, 62, 90, B) +
        eyes(40, 60, 53, 5.5) + cheeks(30, 70, 62) + ellipse(50, 66, 5, 3.5, B) + smile(50, 71, 5);
    },
    pig: function () {
      const A = '#f5b4bd', B = '#dd8a98', C = '#fbd7dc';
      return shadow() +
        path('M26 40 L30 20 L44 36 Z', A) + path('M74 40 L70 20 L56 36 Z', A) +
        ellipse(50, 62, 30, 28, A) + ellipse(50, 72, 18, 12, C) +
        feet(38, 62, 90, B) +
        eyes(38, 62, 54, 6) + cheeks(29, 71, 62) +
        ellipse(50, 66, 11, 8, B) + circle(46, 66, 2.2, '#b0606e') + circle(54, 66, 2.2, '#b0606e');
    },
    sheep: function () {
      const A = '#fbf6ea', B = '#e4dac3', C = '#8d8178';
      let fluff = '';
      [[30, 56], [42, 44], [58, 44], [70, 56], [34, 70], [50, 76], [66, 70], [50, 52]].forEach(function (p) { fluff += circle(p[0], p[1], 15, A); });
      return shadow() + circle(50, 60, 24, B) + fluff +
        ellipse(50, 60, 17, 15, C) + ellipse(30, 52, 7, 4, C, { transform: 'rotate(-20 30 52)' }) + ellipse(70, 52, 7, 4, C, { transform: 'rotate(20 70 52)' }) +
        rect(36, 82, 6, 12, 3, C) + rect(58, 82, 6, 12, 3, C) +
        circle(50, 40, 9, A) +
        eyes(43, 57, 59, 5) + smile(50, 68, 4);
    },
    frog: function () {
      const A = '#86c86a', B = '#5e9c48', C = '#d7ecb0';
      return shadow() +
        circle(36, 36, 11, A) + circle(64, 36, 11, A) +
        ellipse(50, 64, 32, 26, A) + ellipse(50, 74, 20, 12, C) +
        feet(32, 68, 90, B, 10) +
        eyes(36, 64, 36, 7) + cheeks(30, 70, 60) + stroke('M36 64 q14 12 28 0', INK, 2.8);
    },
    /* ===== かっこいい ===== */
    dragon: function () {
      const A = '#e2574a', B = '#b53c32', C = '#f7c66b', D = '#f2a65a';
      return shadow() +
        path('M18 60 q-12 -14 2 -26 q6 12 10 16 Z', D) + path('M82 60 q12 -14 -2 -26 q-6 12 -10 16 Z', D) +
        path('M36 30 L40 12 L48 28 Z', C) + path('M64 30 L60 12 L52 28 Z', C) +
        ellipse(50, 60, 30, 28, A) + ellipse(50, 70, 18, 14, C) +
        path('M76 76 q14 2 14 -10 q-6 -2 -10 4', A) +
        feet(38, 62, 90, B) +
        eyes(40, 60, 54, 6, 'sharp') + cheeks(30, 70, 63, 4) + stroke('M43 68 q7 6 14 0', INK, 2.6) + path('M45 68 L47 72 L49 68 Z M51 68 L53 72 L55 68 Z', '#fffdf7');
    },
    robot: function () {
      const A = '#6f9ae6', B = '#4a6fb8', C = '#e8eef9', D = '#f8d64e';
      return shadow() +
        rect(48, 10, 4, 12, 2, B) + circle(50, 9, 4.5, D) +
        rect(20, 22, 60, 40, 14, A) + rect(27, 28, 46, 26, 9, C) +
        rect(26, 62, 48, 28, 10, A) + rect(34, 68, 32, 8, 4, B) + circle(42, 82, 3, D) + circle(50, 82, 3, '#e2574a') + circle(58, 82, 3, '#86c86a') +
        rect(8, 64, 12, 22, 6, B) + rect(80, 64, 12, 22, 6, B) +
        feet(38, 62, 92, B, 9) +
        rect(34, 36, 12, 12, 4, INK) + rect(54, 36, 12, 12, 4, INK) + circle(38, 40, 2, '#ffffff') + circle(58, 40, 2, '#ffffff') +
        stroke('M42 51 q8 4 16 0', INK, 2.4);
    },
    lion: function () {
      const A = '#f2b24a', B = '#c9843a', C = '#fce2b0';
      let mane = '';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; mane += circle(50 + Math.cos(a) * 30, 56 + Math.sin(a) * 28, 11, B); }
      return shadow() + mane + circle(50, 56, 30, B) +
        ellipse(50, 58, 25, 24, A) + ellipse(50, 68, 15, 11, C) +
        circle(32, 36, 6, A) + circle(68, 36, 6, A) +
        feet(38, 62, 92, B) +
        eyes(40, 60, 53, 6, 'sharp') + ellipse(50, 64, 4, 3, INK) + smile(50, 69, 5);
    },
    shark: function () {
      const A = '#5c93c8', B = '#3f6fa0', C = '#eaf3fb';
      return shadow() +
        path('M50 14 L62 42 L38 42 Z', A) +
        ellipse(50, 62, 34, 24, A) + ellipse(50, 70, 24, 13, C) +
        path('M84 56 L96 44 L96 72 Z', A) + path('M14 62 L2 54 L8 70 Z', A) +
        eyes(38, 62, 56, 6, 'sharp') +
        stroke('M38 70 q12 8 24 0', INK, 2.6) + path('M42 71 L45 76 L48 71 Z M52 71 L55 76 L58 71 Z', '#fffdf7');
    },
    wolf: function () {
      const A = '#9aa0b0', B = '#6b7184', C = '#eef0f5';
      return shadow() +
        path('M24 42 L26 12 L46 32 Z', B) + path('M76 42 L74 12 L54 32 Z', B) +
        ellipse(50, 60, 30, 28, A) + ellipse(50, 70, 18, 13, C) +
        path('M78 72 q16 -2 14 -18 q-8 2 -12 10', B) +
        feet(38, 62, 90, B) +
        eyes(40, 60, 54, 6, 'sharp') + ellipse(50, 66, 4, 3, INK) + smile(50, 71, 5);
    },
    knight: function () {
      const A = '#c9ced8', B = '#8d94a3', C = '#4f7fd9', D = '#e2574a', G = '#f8d64e';
      return shadow() +
        path('M50 8 q-10 8 -6 20 l12 0 q4 -12 -6 -20 Z', D) +
        rect(28, 26, 44, 34, 18, A) + rect(32, 42, 36, 8, 4, B) + rect(36, 44, 28, 4, 2, INK) +
        rect(30, 60, 40, 28, 12, C) + rect(44, 60, 12, 28, 4, '#3a62b0') +
        circle(24, 72, 13, D) + path('M24 63 l3 6 6 0 -5 4 2 6 -6 -4 -6 4 2 -6 -5 -4 6 0 Z', G) +
        feet(40, 60, 92, B, 8) +
        circle(42, 46, 2.5, '#ffffff') + circle(58, 46, 2.5, '#ffffff');
    },
    ninja: function () {
      const A = '#3f4663', B = '#2b3047', C = '#f3cfa6', D = '#e2574a';
      return shadow() +
        path('M70 44 q22 -4 24 12 q-8 -4 -18 0 Z', D) + path('M70 48 q20 8 16 20 q-8 -6 -14 -10 Z', D) +
        ellipse(50, 58, 30, 28, A) + rect(26, 46, 48, 14, 7, C) +
        rect(42, 66, 16, 14, 4, D) +
        feet(38, 62, 90, B) +
        eyes(40, 60, 53, 5.5, 'sharp') + cheeks(31, 69, 56, 3.5);
    },
    rocket: function () {
      const A = '#e2574a', B = '#b53c32', C = '#f5f3ee', D = '#f8d64e', E = '#f49a2e';
      return shadow() +
        path('M36 86 q0 12 14 12 q14 0 14 -12 Z', E) + path('M42 86 q0 10 8 10 q8 0 8 -10 Z', D) +
        path('M26 76 L16 90 L30 84 Z', B) + path('M74 76 L84 90 L70 84 Z', B) +
        path('M50 6 q-22 14 -22 54 l0 20 l44 0 l0 -20 q0 -40 -22 -54 Z', A) + path('M50 6 q-10 10 -14 30 l28 0 q-4 -20 -14 -30 Z', C) +
        rect(30, 80, 40, 6, 3, B) +
        circle(50, 50, 15, B) + circle(50, 50, 12, '#eaf3fb') +
        eyes(45, 55, 49, 4) + smile(50, 55, 3);
    }
  };
  const ORDER = ['rabbit', 'cat', 'chick', 'penguin', 'bear', 'pig', 'sheep', 'frog', 'dragon', 'robot', 'lion', 'shark', 'wolf', 'knight', 'ninja', 'rocket'];
  function svg(id) { const f = ART[id]; return f ? wrap(f()) : ''; }
  function url(id) { const s = svg(id); return s ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) : ''; }
  ROOT.MQ.charart = { svg: svg, url: url, list: function () { return ORDER.slice(); }, ART: ART };
})();
