/* ---------------------------------------------------------
   絵本ふうの キャラクター（まなびたまご）
   ブロックの モンスターでは なく、A案「あたたかい 絵本ふう」の 世界に 合う まるくて やわらかい 絵（SVG）。
   きまり：黒い ふちは 使わない（ふちは 同じ 色みの こい色）／色は クレヨンの ような やわらかい 色／目は 白目＋黒目＋光／ほっぺは ピンク。
     MQ.charart.svg(id, grade)  … <svg viewBox="0 0 100 100"> の 文字列（grade 1〜3＝成長の 姿）
     MQ.charart.url(id, grade)  … data:image/svg+xml（<img src> に そのまま）
     MQ.charart.list()          … id の ならび
   成長の 姿（v0.1.4・ユーザー決定 2026-10-09「リボンや 王冠では なく 姿が どんどん 立派に」）：
     1＝ちび（小さくて まるい）→ 2＝こども（体が のびて 手足・しっぽ・はねが 出る）→ 3＝立派（大きく・その 生きもの らしい 見せ場＝たてがみ・つばさ・つの・よろい…）。
     かざりを のせるのでは なく、体そのものを 描き分ける。ART[id](g) の 中で g で 分ける。
     ★3段階めも かわいく（ユーザー 2026-10-09「3だんかいめが かっこよすぎる。もう少し 可愛く」）＝かわいい 組は 目は まるい まま・きばは 出さない・ほっぺと にっこり。かっこいい 組も つめ・手裏剣は 出さず、口は にっこり（歯は サメだけ）。
   node でも 動く（見本の ページを この ファイルから 作る ため）。
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
  function grp(inner, extra) { return el('g', extra || {}, inner); }
  const INK = '#4a3b32';
  const CHEEK = '#f0a3a0';
  const WHITE = '#fffdf7';
  /* 目：白目＋黒目＋光。kind: 'round'（ふつう）／'happy'（にっこり 線）／'sharp'（かっこいい・少し つり目） */
  function eyes(cx1, cx2, cy, r, kind) {
    r = r || 6;
    if (kind === 'happy') return stroke('M' + (cx1 - r) + ' ' + cy + ' q' + r + ' -' + (r * 1.1) + ' ' + (r * 2) + ' 0', INK, 2.8) + stroke('M' + (cx2 - r) + ' ' + cy + ' q' + r + ' -' + (r * 1.1) + ' ' + (r * 2) + ' 0', INK, 2.8);
    let s = '';
    [cx1, cx2].forEach(function (cx, i) {
      s += circle(cx, cy, r, WHITE);
      if (kind === 'sharp') s += path('M' + (cx - r) + ' ' + (cy - r * 0.9) + ' L' + (cx + r) + ' ' + (cy - r * 0.35) + ' L' + (cx + r) + ' ' + (cy - r) + ' L' + (cx - r) + ' ' + (cy - r) + ' Z', 'var(--sk, #0000)');
      s += circle(cx + (i ? 0.6 : -0.6), cy + 0.8, r * 0.55, INK);
      s += circle(cx + (i ? -0.6 : -1.8), cy - 1, r * 0.22, '#ffffff');
    });
    return s;
  }
  function cheeks(cx1, cx2, cy, rx) { return ellipse(cx1, cy, rx || 5, (rx || 5) * 0.6, CHEEK, { opacity: 0.7 }) + ellipse(cx2, cy, rx || 5, (rx || 5) * 0.6, CHEEK, { opacity: 0.7 }); }
  function smile(cx, cy, w, up) { return stroke('M' + (cx - w) + ' ' + cy + ' q' + w + ' ' + (up === false ? -6 : 7) + ' ' + (w * 2) + ' 0', INK, 2.6); }
  /* 立派な 口：わらった 口に きば 2本 */
  function fangs(cx, cy, w) { return stroke('M' + (cx - w) + ' ' + cy + ' q' + w + ' 6 ' + (w * 2) + ' 0', INK, 2.6) + path('M' + (cx - w + 2) + ' ' + cy + ' l2 4 l2 -4 Z M' + (cx + w - 6) + ' ' + cy + ' l2 4 l2 -4 Z', WHITE); }
  function feet(cx1, cx2, cy, fill, rx) { return ellipse(cx1, cy, rx || 8, 4.5, fill) + ellipse(cx2, cy, rx || 8, 4.5, fill); }
  /* うで：up なら 両手を 上げる（立派）。y は かたの 高さ */
  function arms(y, fill, up, rx) {
    rx = rx || 6;
    if (up) return ellipse(22, y - 8, rx, 11, fill, { transform: 'rotate(35 22 ' + (y - 8) + ')' }) + ellipse(78, y - 8, rx, 11, fill, { transform: 'rotate(-35 78 ' + (y - 8) + ')' });
    return ellipse(22, y, rx, 10, fill, { transform: 'rotate(-20 22 ' + y + ')' }) + ellipse(78, y, rx, 10, fill, { transform: 'rotate(20 78 ' + y + ')' });
  }
  function shadow(rx) { return ellipse(50, 94, rx || 26, 3.5, '#8f7a5a', { opacity: 0.18 }); }
  function star(cx, cy, r, fill) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' '; }
    return path(d + 'Z', fill);
  }
  function wrap(inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">' + inner + '</svg>'; }
  /* 段階ごとの 大きさ（足もと 50,94 を 中心に）：ちびは 小さく・立派は いっぱいに */
  const SCALE = [0.78, 0.9, 0.97];
  function grow(gr, inner) { const s = SCALE[gr - 1] || 1; return s === 1 ? inner : grp(inner, { transform: 'translate(50 94) scale(' + s + ') translate(-50 -94)' }); }

  /* ---- キャラクター（gr＝1 ちび／2 こども／3 立派） ---- */
  const ART = {
    /* ===== かわいい ===== */
    rabbit: function (gr) {
      const A = '#f6c6d2', B = '#e39aae', C = '#fde9ef';
      const earH = gr === 1 ? 40 : 48, earY = 46 - earH;
      let s = shadow();
      if (gr === 3) s += path('M31 46 q-3 -30 10 -52 q6 8 4 52 Z', A) + path('M35 44 q-1 -24 7 -40 q2 8 0 40 Z', C) + path('M55 46 q-4 -30 10 -52 q10 14 4 52 Z', A) + path('M59 44 q-2 -24 8 -40 q4 10 0 40 Z', C);
      else s += rect(31, earY, 14, earH, 7, A) + rect(55, earY, 14, earH, 7, A) + rect(35, earY + 5, 6, earH - 12, 3, C) + rect(59, earY + 5, 6, earH - 12, 3, C);
      if (gr >= 2) s += ellipse(76, 80, 7, 7, C) + arms(66, A, gr === 3);
      s += ellipse(50, gr === 1 ? 62 : 60, 30, gr === 1 ? 28 : 31, A) + ellipse(50, gr === 3 ? 72 : 70, gr === 3 ? 20 : 18, gr === 3 ? 17 : 14, C);
      s += feet(38, 62, 90, B, gr === 3 ? 10 : 8);
      s += eyes(40, 60, 56, 6) + cheeks(31, 69, 65) + ellipse(50, 64, 3, 2.2, B) + smile(50, 69, gr === 3 ? 6 : 5);
      return s;
    },
    cat: function (gr) {
      const A = '#f4b56a', B = '#d9893a', C = '#fde7cf';
      let s = shadow();
      if (gr >= 2) s += path('M74 76 q22 -4 18 -26 q-4 -6 -8 0 q4 16 -12 18 Z', A);
      s += path('M22 44 L26 12 L46 34 Z', A) + path('M78 44 L74 12 L54 34 Z', A) + path('M29 40 L31 22 L41 35 Z', CHEEK) + path('M71 40 L69 22 L59 35 Z', CHEEK);
      if (gr >= 2) s += arms(68, A, gr === 3);
      s += ellipse(50, 62, 30, gr === 1 ? 28 : 30, A) + ellipse(50, 72, 17, 12, C);
      s += stroke('M44 28 q6 -6 12 0', B, 3) + stroke('M40 34 q10 -8 20 0', B, 3);
      if (gr === 3) s += stroke('M24 70 q6 4 12 0 M64 70 q6 4 12 0 M28 80 q6 4 10 0 M62 80 q6 4 10 0', B, 3);
      s += feet(38, 62, 89, B);
      s += eyes(40, 60, 56, 6) + cheeks(31, 69, 65) + path('M47 63 L53 63 L50 66 Z', B) + smile(50, 68, gr === 3 ? 6 : 5);
      const wl = gr === 1 ? 12 : gr === 2 ? 16 : 20;
      s += stroke('M' + (46 - wl) + ' 62 L34 64 M' + (46 - wl) + ' 70 L34 68 M' + (54 + wl) + ' 62 L66 64 M' + (54 + wl) + ' 70 L66 68', B, 2);
      return s;
    },
    chick: function (gr) {
      const A = '#f8d64e', B = '#e0ad1f', C = '#f49a2e', R = '#e2574a';
      let s = shadow();
      if (gr === 3) {
        s += path('M60 50 q24 -30 34 -22 q-10 6 -8 14 q10 -4 12 6 q-12 2 -14 10 q10 2 6 10 q-18 -6 -30 -18 Z', '#5ea86a') + path('M62 52 q18 -22 26 -16 q-14 10 -12 22 Z', '#4f7fd9', { opacity: 0.8 });
        s += path('M22 50 q-22 -6 -22 12 q10 -4 16 4 q-6 10 4 14 q6 -12 12 -16 Z', A) + path('M78 50 q22 -6 22 12 q-10 -4 -16 4 q6 10 -4 14 q-6 -12 -12 -16 Z', A);
      }
      if (gr === 1) s += stroke('M44 26 q0 -10 6 -14 M50 24 q2 -10 10 -12 M48 25 q-6 -8 -12 -6', B, 3);
      else s += path('M40 30 q2 -12 8 -8 q2 -8 8 -4 q2 -8 8 -2 q-2 10 -10 14 Z', R);
      s += ellipse(50, 60, 30, 30, A) + ellipse(50, 70, 18, 14, '#fbe79a');
      if (gr < 3) s += ellipse(22, 62, 9, gr === 1 ? 14 : 17, A, { transform: 'rotate(20 22 62)' }) + ellipse(78, 62, 9, gr === 1 ? 14 : 17, A, { transform: 'rotate(-20 78 62)' });
      if (gr >= 2) s += stroke('M40 90 L40 96 M35 96 L40 92 L45 96 M60 90 L60 96 M55 96 L60 92 L65 96', C, 3);
      else s += feet(40, 60, 90, C, 7);
      s += eyes(40, 60, 54, 6) + cheeks(30, 70, 63) + path('M44 61 L56 61 L50 68 Z', C);
      if (gr >= 2) s += path('M47 68 q3 7 6 0 Z', R);
      return s;
    },
    penguin: function (gr) {
      const A = '#3f5276', B = '#2b3a58', C = '#fffaf0', D = '#f49a2e', Y = '#f8d64e';
      let s = shadow();
      const ry = gr === 1 ? 32 : gr === 2 ? 35 : 38, cy = gr === 1 ? 58 : 56;
      s += ellipse(50, cy, gr === 3 ? 33 : 30, ry, A) + ellipse(50, cy + 8, gr === 3 ? 21 : 19, ry - 10, C);
      if (gr === 3) s += path('M30 44 q8 -8 20 -4 q12 -4 20 4 q-6 10 -20 8 q-14 2 -20 -8 Z', Y, { opacity: 0.85 });
      const fl = gr === 1 ? 16 : gr === 2 ? 19 : 22, fx = gr === 3 ? 16 : 20, fr = gr === 3 ? 40 : 18;
      s += ellipse(fx, 62, 7, fl, A, { transform: 'rotate(' + fr + ' ' + fx + ' 62)' }) + ellipse(100 - fx, 62, 7, fl, A, { transform: 'rotate(' + (-fr) + ' ' + (100 - fx) + ' 62)' });
      s += feet(39, 61, 90, D, 8);
      s += ellipse(50, cy - 14, 20, 14, C);
      if (gr >= 2) s += path('M30 40 q-6 -8 2 -14 q4 6 4 12 Z M70 40 q6 -8 -2 -14 q-4 6 -4 12 Z', gr === 3 ? Y : D);
      s += eyes(42, 58, cy - 14, 5.5) + cheeks(33, 67, cy - 6, 4) + path('M45 ' + (cy - 8) + ' L55 ' + (cy - 8) + ' L50 ' + (cy - 2) + ' Z', D);
      return s;
    },
    bear: function (gr) {
      const A = '#b98258', B = '#8f5e3a', C = '#e9cfae';
      let s = shadow();
      s += circle(27, 34, 11, A) + circle(73, 34, 11, A) + circle(27, 34, 6, C) + circle(73, 34, 6, C);
      if (gr >= 2) s += arms(66, A, gr === 3, 7);
      s += ellipse(50, 60, 31, gr === 1 ? 29 : 32, A) + (gr === 3 ? path('M38 70 q12 -14 24 0 q-12 18 -24 0 Z', C) : ellipse(50, 72, 20, 14, C));
      s += feet(38, 62, 90, B, gr === 3 ? 10 : 8);
      s += eyes(40, 60, 53, 5.5) + cheeks(30, 70, 62) + ellipse(50, 66, 5, 3.5, B) + smile(50, 71, gr === 3 ? 6 : 5);
      return s;
    },
    pig: function (gr) {
      const A = '#f5b4bd', B = '#dd8a98', C = '#fbd7dc', M = '#8a5a4a';
      let s = shadow();
      if (gr >= 2) s += stroke('M76 70 q10 -4 8 -12 q-6 -2 -4 6 q6 2 2 8', B, 3);
      if (gr === 3) s += path('M30 36 q20 -18 40 0 q-6 -12 -20 -14 q-14 2 -20 14 Z', M);
      s += path('M26 40 L30 20 L44 36 Z', A) + path('M74 40 L70 20 L56 36 Z', A);
      if (gr >= 2) s += arms(68, A, gr === 3);
      s += ellipse(50, 62, gr === 3 ? 32 : 30, gr === 1 ? 28 : 30, A) + ellipse(50, 72, 18, 12, C);
      s += feet(38, 62, 90, B);
      s += eyes(38, 62, 54, 6) + cheeks(29, 71, 62);
      s += ellipse(50, 66, gr === 3 ? 13 : 11, gr === 3 ? 9 : 8, B) + circle(46, 66, 2.2, '#b0606e') + circle(54, 66, 2.2, '#b0606e');
      if (gr === 3) s += smile(50, 76, 5);
      return s;
    },
    sheep: function (gr) {
      const A = '#fbf6ea', B = '#e4dac3', C = '#8d8178', H = '#c9a26a';
      let s = shadow();
      const fr = gr === 1 ? 15 : gr === 2 ? 17 : 19;
      let fluff = '';
      [[30, 56], [42, 44], [58, 44], [70, 56], [34, 70], [50, 76], [66, 70], [50, 52]].forEach(function (p) { fluff += circle(p[0], p[1], fr, A); });
      if (gr === 3) fluff += circle(22, 66, 14, A) + circle(78, 66, 14, A);
      s += circle(50, 60, 24, B) + fluff;
      if (gr === 3) s += stroke('M34 50 q-16 -2 -14 -16 q2 -10 12 -8 q8 2 6 10', H, 5.5) + stroke('M66 50 q16 -2 14 -16 q-2 -10 -12 -8 q-8 2 -6 10', H, 5.5) + stroke('M26 36 q0 -4 4 -4 M74 36 q0 -4 -4 -4', '#a8824e', 2);
      else if (gr === 2) s += circle(34, 44, 4, H) + circle(66, 44, 4, H);
      s += ellipse(50, 60, 17, 15, C) + ellipse(30, 52, 7, 4, C, { transform: 'rotate(-20 30 52)' }) + ellipse(70, 52, 7, 4, C, { transform: 'rotate(20 70 52)' });
      s += rect(36, 82, gr === 3 ? 8 : 6, 12, 3, C) + rect(gr === 3 ? 56 : 58, 82, gr === 3 ? 8 : 6, 12, 3, C);
      s += circle(50, 40, 9, A);
      s += eyes(43, 57, 59, 5) + cheeks(36, 64, 65, 3.5) + smile(50, 68, 4);
      return s;
    },
    frog: function (gr) {
      const A = '#86c86a', B = '#5e9c48', C = '#d7ecb0';
      let s = shadow();
      s += circle(36, 36, 11, A) + circle(64, 36, 11, A);
      if (gr >= 2) s += ellipse(16, 78, gr === 3 ? 14 : 11, 8, A) + ellipse(84, 78, gr === 3 ? 14 : 11, 8, A) + stroke('M6 84 l-4 4 M8 86 l-2 6 M94 84 l4 4 M92 86 l2 6', B, 3);
      s += ellipse(50, 64, gr === 3 ? 34 : 32, gr === 1 ? 26 : 28, A) + ellipse(50, 74, 20, 12, C);
      if (gr >= 2) s += circle(30, 56, 3.5, B) + circle(70, 58, 3, B) + circle(50, 50, 2.5, B);
      if (gr === 3) s += circle(24, 68, 2.5, B) + circle(76, 68, 2.5, B) + circle(40, 46, 2, B) + circle(62, 48, 2, B);
      s += feet(32, 68, 90, B, gr === 3 ? 12 : 10);
      s += eyes(36, 64, 36, 7) + cheeks(30, 70, 60) + stroke('M36 64 q14 12 28 0', INK, 2.8);
      return s;
    },
    /* ===== かっこいい ===== */
    dragon: function (gr) {
      const A = '#e2574a', B = '#b53c32', C = '#f7c66b', D = '#f2a65a', F = '#f49a2e';
      let s = shadow();
      if (gr === 1) s += path('M18 60 q-12 -14 2 -26 q6 12 10 16 Z', D) + path('M82 60 q12 -14 -2 -26 q-6 12 -10 16 Z', D);
      else if (gr === 2) s += path('M20 62 q-20 -18 -4 -38 q4 10 8 14 q2 -12 10 -10 q-2 12 2 20 Z', D) + path('M80 62 q20 -18 4 -38 q-4 10 -8 14 q-2 -12 -10 -10 q2 12 -2 20 Z', D);
      else s += path('M22 64 q-28 -20 -14 -52 q6 12 10 18 q0 -16 10 -16 q-2 14 4 22 q6 -10 12 -6 q-4 12 -2 22 Z', D) + path('M78 64 q28 -20 14 -52 q-6 12 -10 18 q0 -16 -10 -16 q2 14 -4 22 q-6 -10 -12 -6 q4 12 2 22 Z', D) +
        stroke('M24 62 q-20 -16 -10 -40 M76 62 q20 -16 10 -40', B, 2);
      if (gr === 3) s += path('M44 34 l6 -10 l6 10 Z M34 40 l5 -8 l5 8 Z M56 40 l5 -8 l5 8 Z', C);
      const hh = gr === 1 ? 12 : gr === 2 ? 6 : 2;
      s += path('M36 30 L40 ' + hh + ' L48 28 Z', C) + path('M64 30 L60 ' + hh + ' L52 28 Z', C);
      if (gr >= 2) s += arms(68, A, gr === 3);
      s += ellipse(50, 60, gr === 3 ? 32 : 30, gr === 1 ? 28 : 30, A) + ellipse(50, 70, 18, 14, C);
      if (gr >= 2) s += path('M76 78 q18 2 18 -14 q-8 -2 -12 6', A) + path('M92 60 l4 -4 l2 6 Z', C);
      else s += path('M76 76 q14 2 14 -10 q-6 -2 -10 4', A);
      s += feet(38, 62, 90, B);
      s += eyes(40, 60, 54, 6, 'sharp') + cheeks(30, 70, 63, 4) + (gr === 3 ? smile(50, 68, 6) : fangs(50, 68, 7));
      if (gr === 3) s += path('M62 72 q10 2 14 -4 q-4 8 -14 8 Z', F) + path('M64 74 q8 0 10 -4 q-2 6 -10 6 Z', C);
      return s;
    },
    robot: function (gr) {
      const A = '#6f9ae6', B = '#4a6fb8', C = '#e8eef9', D = '#f8d64e', R = '#e2574a', V = '#2b3a58', L = '#7fd3ff';
      let s = shadow();
      if (gr === 3) s += path('M40 98 l-6 -8 l6 -2 l6 2 Z M60 98 l-6 -8 l6 -2 l6 2 Z', '#f49a2e') + path('M40 96 l-3 -5 l3 -1 l3 1 Z M60 96 l-3 -5 l3 -1 l3 1 Z', D);
      const ah = gr === 1 ? 12 : gr === 2 ? 16 : 20;
      s += rect(48, 22 - ah, 4, ah, 2, B) + circle(50, 21 - ah, gr === 3 ? 5.5 : 4.5, D);
      if (gr === 3) s += rect(2, 56, 18, 14, 5, B) + rect(80, 56, 18, 14, 5, B) + circle(11, 63, 4, V) + circle(89, 63, 4, V);
      else if (gr === 2) s += rect(8, 58, 14, 10, 4, B) + rect(78, 58, 14, 10, 4, B);
      s += rect(20, 22, 60, 40, 14, A) + rect(27, 28, 46, 26, 9, gr === 3 ? V : C);
      s += rect(26, 62, 48, 28, 10, A) + rect(34, 68, 32, 8, 4, B) + circle(42, 82, 3, D) + circle(50, 82, 3, R) + circle(58, 82, 3, '#86c86a');
      if (gr === 3) s += star(50, 72, 4, D);
      s += rect(gr === 3 ? 6 : 8, 66, 12, gr === 3 ? 24 : 22, 6, B) + rect(gr === 3 ? 82 : 80, 66, 12, gr === 3 ? 24 : 22, 6, B);
      s += feet(38, 62, 92, B, 9);
      if (gr === 3) s += circle(40, 41, 5.5, L) + circle(60, 41, 5.5, L) + circle(40, 41, 2.6, V) + circle(60, 41, 2.6, V) + circle(38.5, 39.5, 1.6, '#ffffff') + circle(58.5, 39.5, 1.6, '#ffffff') + stroke('M42 51 q8 5 16 0', L, 2.4) + cheeks(31, 69, 48, 3.5);
      else s += rect(34, 36, 12, 12, 4, INK) + rect(54, 36, 12, 12, 4, INK) + circle(38, 40, 2, '#ffffff') + circle(58, 40, 2, '#ffffff') + stroke('M42 51 q8 4 16 0', INK, 2.4);
      return s;
    },
    lion: function (gr) {
      const A = '#f2b24a', B = '#c9843a', C = '#fce2b0', M = '#a8622a';
      let s = shadow();
      const mr = gr === 1 ? 11 : gr === 2 ? 14 : 17, mo = gr === 1 ? 30 : gr === 2 ? 32 : 35;
      let mane = '';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; mane += circle(50 + Math.cos(a) * mo, 56 + Math.sin(a) * (mo - 2), mr, gr === 3 && i % 2 ? M : B); }
      if (gr >= 2) s += path('M76 80 q18 0 16 -18 q-6 -2 -8 6 q2 10 -8 12 Z', A) + circle(93, 62, 5, B);
      s += mane + circle(50, 56, mo, B);
      if (gr >= 2) s += arms(70, A, gr === 3);
      s += ellipse(50, 58, 25, 24, A) + ellipse(50, 68, 15, 11, C);
      s += circle(32, 36, 6, A) + circle(68, 36, 6, A);
      s += feet(38, 62, 92, B, gr === 3 ? 10 : 8);
      s += eyes(40, 60, 53, 6, 'sharp') + cheeks(31, 69, 61, 3.5) + ellipse(50, 64, 4, 3, INK) + smile(50, 69, gr === 3 ? 6 : 5);
      return s;
    },
    shark: function (gr) {
      const A = '#5c93c8', B = '#3f6fa0', C = '#eaf3fb';
      let s = shadow(gr === 3 ? 34 : 26);
      const fh = gr === 1 ? 14 : gr === 2 ? 6 : 0;
      s += path('M50 ' + fh + ' L' + (gr === 3 ? 66 : 62) + ' 42 L38 42 Z', A);
      if (gr === 3) s += path('M30 46 L36 30 L42 46 Z', A);
      s += ellipse(50, 62, gr === 3 ? 38 : 34, gr === 1 ? 24 : 26, A) + ellipse(50, 70, 24, 13, C);
      if (gr === 3) s += stroke('M22 52 q6 4 10 0 M68 52 q6 4 10 0 M28 44 q4 2 8 0', B, 3);
      s += path('M84 56 L' + (gr === 3 ? 100 : 96) + ' 42 L' + (gr === 3 ? 100 : 96) + ' 74 Z', A) + path('M14 62 L' + (gr === 3 ? -2 : 2) + ' 52 L' + (gr === 3 ? 4 : 8) + ' 72 Z', A);
      if (gr >= 2) s += path('M24 80 L10 90 L20 76 Z', A) + path('M76 80 L90 90 L80 76 Z', A);
      s += eyes(38, 62, 56, 6, 'sharp') + cheeks(28, 72, 63, 3.5);
      const tw = gr === 1 ? 12 : gr === 2 ? 16 : 20, tn = gr === 1 ? 2 : gr === 2 ? 4 : 6;
      s += stroke('M' + (50 - tw) + ' 70 q' + tw + ' 8 ' + (tw * 2) + ' 0', INK, 2.6);
      let teeth = '';
      for (let i = 0; i < tn; i++) { const x = 50 - tw + 4 + i * ((tw * 2 - 8) / Math.max(1, tn - 1)); teeth += 'M' + (x - 3) + ' 71 L' + x + ' 76 L' + (x + 3) + ' 71 Z '; }
      s += path(teeth, WHITE);
      return s;
    },
    wolf: function (gr) {
      const A = '#9aa0b0', B = '#6b7184', C = '#eef0f5';
      let s = shadow();
      if (gr >= 2) s += path('M78 74 q22 -4 18 -24 q-8 2 -12 10 q2 -12 -8 -8 q2 10 -4 20 Z', B);
      else s += path('M78 72 q16 -2 14 -18 q-8 2 -12 10', B);
      const eh = gr === 1 ? 12 : gr === 2 ? 6 : 2;
      s += path('M24 42 L26 ' + eh + ' L46 32 Z', B) + path('M76 42 L74 ' + eh + ' L54 32 Z', B) + path('M30 40 L31 ' + (eh + 12) + ' L41 34 Z', CHEEK) + path('M70 40 L69 ' + (eh + 12) + ' L59 34 Z', CHEEK);
      if (gr === 3) s += path('M20 48 q-6 10 0 24 q4 -12 10 -16 Z M80 48 q6 10 0 24 q-4 -12 -10 -16 Z', C);
      if (gr >= 2) s += arms(68, A, gr === 3);
      s += ellipse(50, 60, 30, gr === 1 ? 28 : 31, A) + (gr === 3 ? path('M36 66 q14 -14 28 0 q-14 20 -28 0 Z', C) : ellipse(50, 70, 18, 13, C));
      s += feet(38, 62, 90, B, gr === 3 ? 10 : 8);
      s += eyes(40, 60, 54, 6, 'sharp') + cheeks(31, 69, 62, 3.5) + ellipse(50, 66, 4, 3, INK) + smile(50, 71, gr === 3 ? 6 : 5);
      return s;
    },
    knight: function (gr) {
      const A = '#c9ced8', B = '#8d94a3', C = '#4f7fd9', D = '#e2574a', G = '#f8d64e';
      let s = shadow();
      if (gr === 3) s += path('M34 44 q-14 20 -10 46 l52 0 q4 -26 -10 -46 Z', D) + path('M38 46 q-10 18 -8 42 l40 0 q2 -24 -8 -42 Z', '#b53c32');
      if (gr >= 2) {
        const sy = gr === 3 ? 14 : 30, sl = gr === 3 ? 46 : 36;
        s += rect(84, sy, 5, sl, 2, A) + path('M86.5 ' + (sy - 6) + ' l-4 8 l8 0 Z', A) + rect(80, sy + sl - 4, 13, 5, 2, G) + rect(84, sy + sl, 5, 12, 2, '#8a5a3a');
      }
      const pl = gr === 1 ? 8 : gr === 2 ? 4 : 0;
      s += path('M50 ' + pl + ' q-10 8 -6 20 l12 0 q4 -12 -6 -20 Z', D);
      if (gr === 3) s += path('M44 20 q-10 -4 -14 6 l14 0 Z M56 20 q10 -4 14 6 l-14 0 Z', D);
      s += rect(28, 26, 44, 34, 18, A) + rect(32, 42, 36, 8, 4, B) + rect(36, 44, 28, 4, 2, INK);
      if (gr === 3) s += rect(22, 58, 14, 10, 5, A) + rect(64, 58, 14, 10, 5, A);
      s += rect(30, 60, 40, 28, 12, gr === 3 ? A : C) + rect(44, 60, 12, 28, 4, gr === 3 ? B : '#3a62b0');
      if (gr === 3) s += star(50, 72, 6, G);
      if (gr === 3) s += circle(20, 72, 15, D) + path('M20 61 l3 7 7 0 -5 5 2 7 -7 -4 -7 4 2 -7 -5 -5 7 0 Z', G);
      else s += circle(24, 72, 13, D) + path('M24 63 l3 6 6 0 -5 4 2 6 -6 -4 -6 4 2 -6 -5 -4 6 0 Z', G);
      s += feet(40, 60, 92, B, 8);
      s += circle(42, 46, 2.5, '#ffffff') + circle(58, 46, 2.5, '#ffffff');
      return s;
    },
    ninja: function (gr) {
      const A = '#3f4663', B = '#2b3047', C = '#f3cfa6', D = '#e2574a', S = '#c9ced8';
      let s = shadow();
      if (gr === 1) s += path('M70 44 q22 -4 24 12 q-8 -4 -18 0 Z', D) + path('M70 48 q20 8 16 20 q-8 -6 -14 -10 Z', D);
      else if (gr === 2) s += path('M70 42 q26 -8 28 14 q-8 -6 -20 -2 Z', D) + path('M70 48 q24 10 18 30 q-8 -10 -16 -16 Z', D);
      else s += path('M68 40 q30 -14 32 18 q-10 -10 -24 -4 Z', D) + path('M70 48 q30 12 22 40 q-10 -16 -20 -24 Z', D) + path('M30 40 q-30 -6 -30 20 q10 -8 24 -6 Z', D);
      if (gr >= 2) s += rect(70, 20, 5, 34, 2, S, { transform: 'rotate(30 72 37)' });
      if (gr >= 2) s += arms(68, A, gr === 3);
      s += ellipse(50, 58, 30, gr === 1 ? 28 : 30, A) + rect(26, 46, 48, 14, 7, C);
      s += rect(42, 66, 16, 14, 4, D);
      s += feet(38, 62, 90, B);
      s += eyes(40, 60, 53, 5.5, 'sharp') + cheeks(31, 69, 56, 3.5);
      if (gr === 3) s += stroke('M44 56 q6 4 12 0', INK, 2.2);
      return s;
    },
    rocket: function (gr) {
      const A = '#e2574a', B = '#b53c32', C = '#f5f3ee', D = '#f8d64e', E = '#f49a2e', S = '#c9ced8';
      let s = shadow();
      const fl = gr === 1 ? 12 : gr === 2 ? 18 : 24;
      s += path('M36 86 q0 ' + fl + ' 14 ' + fl + ' q14 0 14 -' + fl + ' Z', E) + path('M42 86 q0 ' + (fl - 2) + ' 8 ' + (fl - 2) + ' q8 0 8 -' + (fl - 2) + ' Z', D);
      if (gr === 3) s += path('M14 76 q-6 10 0 20 q6 -10 0 -20 Z M86 76 q-6 10 0 20 q6 -10 0 -20 Z', E) + rect(8, 44, 12, 34, 6, S) + rect(80, 44, 12, 34, 6, S) + path('M14 44 q-6 -10 0 -14 q6 4 0 14 Z M86 44 q-6 -10 0 -14 q6 4 0 14 Z', B);
      const fw = gr === 1 ? 10 : gr === 2 ? 16 : 20;
      s += path('M26 76 L' + (26 - fw) + ' 90 L30 84 Z', B) + path('M74 76 L' + (74 + fw) + ' 90 L70 84 Z', B);
      s += path('M50 6 q-22 14 -22 54 l0 20 l44 0 l0 -20 q0 -40 -22 -54 Z', A) + path('M50 6 q-10 10 -14 30 l28 0 q-4 -20 -14 -30 Z', C);
      if (gr === 3) s += path('M50 2 q-5 6 -6 14 l12 0 q-1 -8 -6 -14 Z', D);
      s += rect(30, 80, 40, 6, 3, B);
      if (gr >= 2) s += star(50, 70, 4, D);
      const wr = gr === 1 ? 12 : gr === 2 ? 14 : 16;
      s += circle(50, 50, wr + 3, B) + circle(50, 50, wr, '#eaf3fb');
      s += eyes(45, 55, 49, gr === 1 ? 4 : 5) + smile(50, 55, 3) + (gr >= 2 ? cheeks(41, 59, 54, 2.2) : '');
      if (gr === 3) s += star(6, 20, 4, D) + star(94, 14, 3, D) + star(92, 36, 2.5, D);
      return s;
    }
  };
  const ORDER = ['rabbit', 'cat', 'chick', 'penguin', 'bear', 'pig', 'sheep', 'frog', 'dragon', 'robot', 'lion', 'shark', 'wolf', 'knight', 'ninja', 'rocket'];
  function svg(id, grade) { const f = ART[id]; const gr = Math.min(3, Math.max(1, grade || 1)); return f ? wrap(grow(gr, f(gr))) : ''; }
  function url(id, grade) { const s = svg(id, grade); return s ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) : ''; }
  ROOT.MQ.charart = { svg: svg, url: url, list: function () { return ORDER.slice(); }, ART: ART, SCALE: SCALE };
})();
