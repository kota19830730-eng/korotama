/* ---------------------------------------------------------
   子どもの 絵を そのまま／絵本ふうに（ころたま v0.1.4）
   ユーザー決定（2026-10-09）「今回の 作品は ブロックの ことは 忘れて。そのままか、絵柄を 合わせるように デフォルメに」
   → 64マスの ブロック（trace.js の traceCells）は 使わず、
     raw ＝ そのまま（紙を 消して 絵だけを 切りぬく・ふちは やわらかく）
     soft＝ 絵本ふう（色を クレヨンの 色に そろえ、ぬりむらを 平らに、線は その 色の こい色に＝charart と 同じ 世界）
   の 2まいを 作る。紙を 見つける・絵の 場所を 見つける ところは trace.js の 道具（MQ.trace.parts）を 借りる。
     MQ.cutout.fromImage(img, crop) → { raw: { png, png2, png3 }, soft: { png, png2, png3 }, drawn, dark }
     MQ.cutout.grow(canvas, grade)  → 成長の 姿（1 ちび＝小さく／2 こども＝はね／3 立派＝大きく・大きな はね）
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.cutout = (function () {
  const OUT = 256;
  const INK = [74, 59, 50];          // #4a3b32（charart の 線の 色）
  const PAPER = [255, 253, 247];     // #fffdf7
  /* クレヨンの 色（色あい → 色）。charart と 同じ 系統 */
  const PAL = [[0, [226, 87, 74]], [25, [244, 154, 46]], [52, [248, 214, 78]], [95, [134, 200, 106]], [150, [95, 191, 154]], [190, [92, 193, 216]], [215, [92, 147, 200]], [245, [111, 154, 230]], [280, [155, 123, 209]], [320, [229, 143, 180]], [345, [246, 163, 184]]];
  const BROWN = [185, 130, 88];
  let lastInfo = null;

  function lum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function hueOf(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d < 1) return 0;
    let h = mx === r ? (g - b) / d : mx === g ? 2 + (b - r) / d : 4 + (r - g) / d;
    h *= 60; if (h < 0) h += 360;
    return h;
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  /* 色の ラベル：0＝線（えんぴつ・黒）／1＝紙の 白（白く のこした ところ）／2〜＝クレヨンの 色（色 × 明るさ 3だんかい） */
  function labelOf(r, g, b, thr) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), ch = mx - mn, L = lum(r, g, b);
    const inkD = Math.max(18, thr.d * 1.1);   // 紙より これだけ 暗ければ 線（うすい えんぴつも）
    if (ch < Math.max(30, thr.s * 1.2)) return (255 - L) > inkD ? 0 : 1;
    const h = hueOf(r, g, b);
    if (L < 95 && h >= 10 && h <= 50) return 2 + PAL.length * 3;   // こげ茶
    let best = 0, bd = 999;
    PAL.forEach(function (p, i) { let d = Math.abs(h - p[0]); if (d > 180) d = 360 - d; if (d < bd) { bd = d; best = i; } });
    const v = L > 200 ? 2 : L < 100 ? 0 : 1;
    return 2 + best * 3 + v;
  }
  function colorOf(lab) {
    if (lab === 0) return INK;
    if (lab === 1) return PAPER;
    if (lab === 2 + PAL.length * 3) return BROWN;
    const i = Math.floor((lab - 2) / 3), v = (lab - 2) % 3;
    const c = PAL[i][1];
    return v === 0 ? mix(c, [40, 30, 30], 0.3) : v === 2 ? mix(c, [255, 255, 255], 0.4) : c;
  }
  function darken(c) { return [c[0] * 0.52, c[1] * 0.48, c[2] * 0.48]; }

  /* ---- マスクの 道具 ---- */
  function dilate(m, w, h, r) { return MQ.trace.parts.dilate(m, w, h, r); }
  function erode(m, w, h, r) {
    const inv = new Uint8Array(m.length);
    for (let k = 0; k < m.length; k++) inv[k] = m[k] ? 0 : 1;
    const d = dilate(inv, w, h, r);
    for (let k = 0; k < m.length; k++) inv[k] = d[k] ? 0 : 1;
    return inv;
  }
  function close(m, w, h, r) { return erode(dilate(m, w, h, r), w, h, r); }
  /* やわらかい ふち：マスクを ぼかして 0〜255 の アルファに */
  function softAlpha(m, w, h, r) {
    const a = new Float32Array(w * h);
    const n = (2 * r + 1) * (2 * r + 1);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let c = 0;
        for (let dy = -r; dy <= r; dy++) {
          const yy = Math.min(h - 1, Math.max(0, y + dy));
          for (let dx = -r; dx <= r; dx++) { const xx = Math.min(w - 1, Math.max(0, x + dx)); c += m[yy * w + xx]; }
        }
        a[y * w + x] = c / n;
      }
    }
    return a;
  }

  /* ---- 絵を OUT×OUT の canvas に おさめる（下を そろえる） ---- */
  function place(src, W, H, box) {
    const cv = document.createElement('canvas');
    cv.width = OUT; cv.height = OUT;
    const g = cv.getContext('2d');
    const bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1;
    const k = Math.min((OUT * 0.9) / bw, (OUT * 0.9) / bh);
    const dw = bw * k, dh = bh * k;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(src, box.x0, box.y0, bw, bh, (OUT - dw) / 2, OUT * 0.95 - dh, dw, dh);
    return cv;
  }

  /* そのまま：紙を すかして 絵だけ */
  function renderRaw(q, m, W, H, box, thr) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const od = g.createImageData(W, H);
    const a = softAlpha(m, W, H, 1);
    const gain = Math.min(3.2, Math.max(1, 110 / Math.max(24, thr.d * 2)));   // うすい えんぴつ（紙との 差が 小さい）ほど こく
    for (let k = 0; k < W * H; k++) {
      let r = q[k * 3], gg = q[k * 3 + 1], b = q[k * 3 + 2];
      const L = lum(r, gg, b), d = 255 - L, ch = Math.max(r, gg, b) - Math.min(r, gg, b);
      if (d > thr.d * 0.6 && ch < 40) { const L2 = Math.max(40, 255 - d * gain); const t = L2 / Math.max(1, L); r *= t; gg *= t; b *= t; }
      else if (ch >= 40) { const mean = (r + gg + b) / 3; r = mean + (r - mean) * 1.25; gg = mean + (gg - mean) * 1.25; b = mean + (b - mean) * 1.25; }
      od.data[k * 4] = Math.round(Math.min(255, Math.max(0, r))); od.data[k * 4 + 1] = Math.round(Math.min(255, Math.max(0, gg))); od.data[k * 4 + 2] = Math.round(Math.min(255, Math.max(0, b)));
      od.data[k * 4 + 3] = Math.round(a[k] * 255);
    }
    g.putImageData(od, 0, 0);
    return place(cv, W, H, box);
  }

  /* 絵本ふう：色を クレヨンに そろえ・ぬりむらを 平らに・線は その 色の こい色・ふちは まるく */
  function renderSoft(q, m, W, H, box, thr) {
    const n = W * H;
    const lab = new Int16Array(n).fill(-1);
    for (let k = 0; k < n; k++) if (m[k]) lab[k] = labelOf(q[k * 3], q[k * 3 + 1], q[k * 3 + 2], thr);
    // 色の 中の えんぴつの すじ（3×3 で 線が 4わり みまん）は 線では ない → まわりの 色に
    const ink = new Uint8Array(n);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = y * W + x;
        if (lab[k] !== 0) continue;
        let c = 0, t = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          t++; if (lab[yy * W + xx] === 0) c++;
        }
        ink[k] = c >= t * 0.4 ? 1 : 0;
      }
    }
    for (let k = 0; k < n; k++) if (lab[k] === 0 && !ink[k]) lab[k] = -2;   // あとで まわりの 色に
    {   // 線を 1px ふとらせる（えんぴつの 線は 細すぎる）
      const keep = new Uint8Array(n); for (let k = 0; k < n; k++) keep[k] = lab[k] === 0 ? 1 : 0;
      const fat = dilate(keep, W, H, 1);
      for (let k = 0; k < n; k++) if (fat[k] && m[k] && lab[k] !== 0) lab[k] = 0;
    }
    // 線いがいは まわり（7×7）で いちばん 多い 色に（ぬりむら・えんぴつの すじを 平らに）
    const out = new Int16Array(n);
    const cnt = new Int32Array(2 + PAL.length * 3 + 1);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = y * W + x;
        if (lab[k] === -1) { out[k] = -1; continue; }
        if (lab[k] === 0) { out[k] = 0; continue; }
        cnt.fill(0);
        let best = -1, bv = 0;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const l = lab[yy * W + xx];
          if (l < 1) continue;
          cnt[l]++; if (cnt[l] > bv) { bv = cnt[l]; best = l; }
        }
        out[k] = best < 0 ? 1 : best;
      }
    }
    // 線の 色：まわり（半径 4）の 色の こい色。色が なければ 線の 色
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const od = g.createImageData(W, H);
    const rgb = new Float32Array(n * 3);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = y * W + x;
        if (out[k] < 0) continue;
        let c;
        if (out[k] === 0) {
          cnt.fill(0);
          let best = -1, bv = 0;
          for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            const l = out[yy * W + xx];
            if (l < 2) continue;
            cnt[l]++; if (cnt[l] > bv) { bv = cnt[l]; best = l; }
          }
          c = best > 0 ? darken(colorOf(best)) : INK;
        } else c = colorOf(out[k]);
        rgb[k * 3] = c[0]; rgb[k * 3 + 1] = c[1]; rgb[k * 3 + 2] = c[2];
      }
    }
    // 1-2-1 の ぼかしで ギザギザを とる（絵の 中だけ）
    const a = softAlpha(m, W, H, 2);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = y * W + x;
        let r = 0, gg = 0, b = 0, wsum = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const kk = yy * W + xx;
          if (out[kk] < 0) continue;
          const wgt = (dx ? 1 : 2) * (dy ? 1 : 2);
          r += rgb[kk * 3] * wgt; gg += rgb[kk * 3 + 1] * wgt; b += rgb[kk * 3 + 2] * wgt; wsum += wgt;
        }
        if (!wsum) continue;
        od.data[k * 4] = Math.round(r / wsum); od.data[k * 4 + 1] = Math.round(gg / wsum); od.data[k * 4 + 2] = Math.round(b / wsum);
        od.data[k * 4 + 3] = Math.round(a[k] * 255);
      }
    }
    g.putImageData(od, 0, 0);
    return place(cv, W, H, box);
  }

  /* ---- 成長の 姿（子どもの 絵）：1 ちび＝小さく／2 こども＝ふつうの 大きさ＋小さな はね／3 立派＝大きく＋大きな はね ---- */
  const SCALE = [0.78, 0.9, 1.0];
  function wing(g, cx, cy, w, h, dir, fill, edge) {
    g.save();
    g.translate(cx, cy); g.scale(dir, 1);
    g.fillStyle = edge;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(w * 0.5, -h * 0.9, w, -h * 0.55);
    g.quadraticCurveTo(w * 0.86, -h * 0.2, w * 0.74, -h * 0.1);
    g.quadraticCurveTo(w * 0.7, h * 0.2, w * 0.48, h * 0.26);
    g.quadraticCurveTo(w * 0.4, h * 0.5, w * 0.18, h * 0.46);
    g.quadraticCurveTo(w * 0.06, h * 0.3, 0, 0);
    g.closePath(); g.fill();
    g.fillStyle = fill;
    g.beginPath();
    g.moveTo(w * 0.06, 0);
    g.quadraticCurveTo(w * 0.5, -h * 0.76, w * 0.9, -h * 0.5);
    g.quadraticCurveTo(w * 0.78, -h * 0.2, w * 0.68, -h * 0.1);
    g.quadraticCurveTo(w * 0.64, h * 0.14, w * 0.46, h * 0.18);
    g.quadraticCurveTo(w * 0.38, h * 0.38, w * 0.2, h * 0.34);
    g.quadraticCurveTo(w * 0.1, h * 0.22, w * 0.06, 0);
    g.closePath(); g.fill();
    g.restore();
  }
  function grow(base, grade) {
    const cv = document.createElement('canvas');
    cv.width = OUT; cv.height = OUT;
    const g = cv.getContext('2d');
    const s = SCALE[Math.min(3, Math.max(1, grade)) - 1];
    if (grade >= 2) {
      const big = grade === 3;
      const w = big ? OUT * 0.36 : OUT * 0.24, h = big ? OUT * 0.3 : OUT * 0.2;
      const fill = big ? '#f8e3a8' : '#fdf3e0', edge = big ? '#d9b25a' : '#e4cfa6';
      const cy = OUT * (big ? 0.5 : 0.56);
      wing(g, OUT * 0.5 - OUT * 0.3 * s, cy, w, h, -1, fill, edge);
      wing(g, OUT * 0.5 + OUT * 0.3 * s, cy, w, h, 1, fill, edge);
    }
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const d = OUT * s;
    g.drawImage(base, (OUT - d) / 2, OUT * 0.95 - d * 0.95, d, d);
    return cv;
  }
  function stages(base) {
    return { png: grow(base, 1).toDataURL('image/png'), png2: grow(base, 2).toDataURL('image/png'), png3: grow(base, 3).toDataURL('image/png') };
  }

  /* 写真／ゆびの 絵（img）の わく（crop）の 中の 絵を 切りぬく。かえり値 { raw, soft, drawn, dark } ／ 絵が なければ drawn: 0 */
  function fromImage(img, crop) {
    const T = MQ.trace.parts;
    const cv = T.workCanvas(img, crop || MQ.trace.defaultCrop(img));
    const W = cv.width, H = cv.height;
    let data;
    try { data = cv.getContext('2d').getImageData(0, 0, W, H); } catch (e) { return { drawn: 0, error: 'canvas' }; }
    const prep = T.prepare(data.data, W, H);
    const q = prep.q, thr = { d: prep.auto.d, s: prep.auto.s };
    let fg = T.foregroundMask(q, W, H, thr);
    fg = T.keepMain(fg, W, H);
    const box = T.bbox(fg, W, H);
    if (!box || box.n < 30) return { drawn: 0, dark: prep.noisy };
    const m = close(fg, W, H, 2);
    const raw = renderRaw(q, m, W, H, box, thr);
    const soft = renderSoft(q, m, W, H, box, thr);
    lastInfo = { drawn: box.n, box: box, W: W, H: H, dark: prep.noisy };
    return { raw: stages(raw), soft: stages(soft), drawn: box.n, dark: prep.noisy, box: box };
  }
  return { fromImage: fromImage, grow: grow, stages: stages, info: function () { return lastInfo; }, OUT: OUT, SCALE: SCALE };
})();
