/* ---------------------------------------------------------
   本物さがし（ころたま v0.2・C）。DOM を 知らない。
   生きものが「あかい ものを もってきて！」→ お子さんが 部屋から さがして カメラに 見せる（か おうちの人に 見せる）。
   いろの おだいは 写真の どこかに その 色が あれば OK（v0.2.1・ゆかの 色が 大きくても よい）。なければ まんなかの 色の 名前を 教える（ばつなし）。
   かたちの おだい（いろ×かたちも）は おうちの人が ○。
   おだいは いろと かたちだけ（ユーザー決定 2026-10-10「リンゴとか その時に 家に ない 場合が ある」）＝どの 家にも かならず ある ものだけ。ながい・ふわふわ・おおきい・かず は やめた。
   知育：いろ・かたち・かずを くらしの 中で 見つける（画面の 中で おぼえた ことを 本物に つなげる）。
     mission(stage, avoid) → { id, type:'color'|'judge', color?, line, ok, pic }
     classify(rgba, w, h)  → { id, share, ranks:[{id,share}] } … まんなかの 色（いろの 名前）
     match(m, cls)         → true／false
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.find = (function () {
  // 色の id と 名前（tasks.js の COLORS と 同じ id・orange／white／black は 写真用に 足した）
  const CNAME = { red: 'あか', orange: 'オレンジ', yellow: 'きいろ', green: 'みどり', blue: 'あお', purple: 'むらさき', pink: 'ピンク', white: 'しろ', black: 'くろ', brown: 'ちゃいろ' };
  const ADJ = { red: 'あかい', yellow: 'きいろい', green: 'みどりの', blue: 'あおい', pink: 'ピンクの', purple: 'むらさきの' };
  const M = {
    color: function (id) { return { id: 'c-' + id, type: 'color', color: id, line: ADJ[id] + ' ものを さがして、みせてね！', ok: 'あった！ ' + ADJ[id] + ' ものだね！ ありがとう！', pic: { type: 'color', id: id } }; },
    judge: function (id, line, ok, pic) { return { id: id, type: 'judge', line: line, ok: ok, pic: pic }; }
  };
  const JUDGE = {
    round: M.judge('round', 'まるい ものを さがして、みせてね！', 'まるい ものだね！ ありがとう！', { type: 'shape', id: 'circle' }),
    square: M.judge('square', 'しかくい ものを さがして、みせてね！', 'しかくい ものだね！ ありがとう！', { type: 'shape', id: 'square' }),
    redround: M.judge('redround', 'あかくて まるい ものを さがして、みせてね！', 'あかくて まるい！ よく みつけたね！', { type: 'shape', id: 'circle', color: 'red' }),
    yellowround: M.judge('yellowround', 'きいろくて まるい ものを さがして、みせてね！', 'きいろくて まるい！ よく みつけたね！', { type: 'shape', id: 'circle', color: 'yellow' }),
    bluesquare: M.judge('bluesquare', 'あおくて しかくい ものを さがして、みせてね！', 'あおくて しかくい！ よく みつけたね！', { type: 'shape', id: 'square', color: 'blue' }),
    greensquare: M.judge('greensquare', 'みどりで しかくい ものを さがして、みせてね！', 'みどりで しかくい！ よく みつけたね！', { type: 'shape', id: 'square', color: 'green' })
  };
  const PLAN = {
    s: ['c:red', 'c:blue', 'c:yellow', 'c:green'],
    m: ['c:red', 'c:blue', 'c:yellow', 'c:green', 'c:pink', 'j:round', 'j:square'],
    l: ['c:purple', 'c:pink', 'c:green', 'c:blue', 'c:yellow', 'j:round', 'j:square', 'j:redround'],
    k: ['j:redround', 'j:yellowround', 'j:bluesquare', 'j:greensquare', 'c:purple', 'c:pink', 'j:round', 'j:square']
  };
  function mission(stage, avoid) {
    const plan = PLAN[stage] || PLAN.s;
    let p, n = 0;
    do { p = plan[Math.floor(Math.random() * plan.length)]; } while (avoid && avoid.indexOf(p) >= 0 && n++ < 30);
    const m = p[0] === 'c' ? M.color(p.slice(2)) : JUDGE[p.slice(2)];
    return Object.assign({ key: p }, m);
  }
  /* 写真の まんなか（はば・たかさの 半分）の 色。うすい・くらい・しろい 点は 数えない */
  function hsv(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d > 0) { h = mx === r ? (g - b) / d : mx === g ? 2 + (b - r) / d : 4 + (r - g) / d; h *= 60; if (h < 0) h += 360; }
    return [h, mx ? d / mx : 0, mx / 255];
  }
  function hueId(h, s, v) {
    if (h >= 345 || h < 12) return (s < 0.5 && v > 0.75) ? 'pink' : 'red';
    if (h < 38) return (v < 0.55) ? 'brown' : 'orange';
    if (h < 70) return 'yellow';
    if (h < 165) return 'green';
    if (h < 255) return 'blue';
    if (h < 290) return 'purple';
    return 'pink';
  }
  /* ゆるい 色の はば（写真ぜんたいで さがす 用）。ゆか（オレンジ〜ちゃいろ・h 18〜42）には かからない ように */
  const LOOSE = {
    red: function (h, s, v) { return (h >= 335 || h < 16) && s >= 0.35 && v >= 0.25; },
    yellow: function (h, s, v) { return h >= 44 && h < 72 && s >= 0.35 && v >= 0.45; },
    green: function (h, s, v) { return h >= 72 && h < 170 && s >= 0.2 && v >= 0.2; },
    blue: function (h, s, v) { return h >= 170 && h < 258 && s >= 0.2 && v >= 0.2; },
    purple: function (h, s, v) { return h >= 245 && h < 330 && s >= 0.15 && v >= 0.15; },
    pink: function (h, s, v) { return (h >= 290 || h < 14) && s >= 0.15 && v >= 0.55; }
  };
  const ANY_MIN = 0.03;   // 写真の 3% いじょう あれば OK
  /* 照明の 補正（v40・2026-11-07）。ユーザー「照明が くらかったり オレンジよりの 色だと 色を 正しく 認識しない」。
     光の 強さ（線形）で 計算する：
     ① 明るい 上位 2わりの うち 色が つよすぎない 点（白い かべ・紙・服）＝部屋の 光の 色 → 打ち消す（ずれが 小さい ふつうの 部屋は しない）
     ② 白っぽい ところが ない（もの だけが 大きく うつる）ときは 色は かえない（写真 ぜんたいの 平均で 合わせると その ものの 色を 消す＝みどりの りんごが 黄色に なった）
     ③ 暗い 写真（明るい 点が sRGB 150 未満）だけ 明るく（色あいを かえない：どれかが 255 で 止める）
     ネットの 写真 38まいに 光を かけて はかった（未就学児アプリ/さがすテスト）：あたり ふつう 32→33・暗い 23→33・電球色 25→27・暗い＋電球色 14→30 */
  const LIN = new Float32Array(256);
  for (let v = 0; v < 256; v++) { const x = v / 255; LIN[v] = x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
  function enc(x) { x = Math.max(0, Math.min(1, x)); return 255 * (x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055); }
  let lastFix = null;
  function balance(px, w, h) {
    const n = w * h, Y = new Float32Array(n);
    if (!n) return px;
    for (let i = 0; i < n; i++) Y[i] = px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11;
    const yHi = Array.from(Y).sort(function (a, b) { return a - b; })[Math.floor(n * 0.8)];
    let r = 0, g = 0, b = 0, c = 0;
    for (let i = 0; i < n; i++) {
      if (Y[i] < yHi) continue;
      const R = px[i * 4], G = px[i * 4 + 1], B = px[i * 4 + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      if (mx < 8 || mx > 252 || (mx - mn) / mx > 0.6) continue;   // とんだ 点・色の つよい 点は つかわない
      r += LIN[R]; g += LIN[G]; b += LIN[B]; c++;
    }
    let gr = 1, gg = 1, gb = 1;
    const white = c >= n * 0.03;
    if (white) {
      const m = (r + g + b) / 3;
      gr = Math.min(3, Math.max(0.5, m / Math.max(1e-6, r)));
      gg = Math.min(3, Math.max(0.5, m / Math.max(1e-6, g)));
      gb = Math.min(3, Math.max(0.5, m / Math.max(1e-6, b)));
      const dev = Math.max(gr, gg, gb) / Math.min(gr, gg, gb) - 1, st = Math.min(1, Math.max(0, (dev - 0.15) / 0.3));
      gr = Math.pow(gr, st); gg = Math.pow(gg, st); gb = Math.pow(gb, st);
    }
    const mxs = new Float32Array(n);
    for (let i = 0; i < n; i++) mxs[i] = Math.max(LIN[px[i * 4]] * gr, LIN[px[i * 4 + 1]] * gg, LIN[px[i * 4 + 2]] * gb);
    const p95 = Array.from(mxs).sort(function (a, b) { return a - b; })[Math.floor(n * 0.95)];
    const ex = p95 >= 0.31 ? 1 : Math.min(25, Math.max(1, 0.72 / Math.max(1e-4, p95)));
    lastFix = { gain: [gr, gg, gb].map(function (v) { return Math.round(v * 100) / 100; }), ex: Math.round(ex * 100) / 100, white: white };
    if (gr === 1 && gg === 1 && gb === 1 && ex === 1) return px;
    const o = new Uint8ClampedArray(px.length);
    for (let i = 0; i < n; i++) {
      const R = LIN[px[i * 4]] * gr, G = LIN[px[i * 4 + 1]] * gg, B = LIN[px[i * 4 + 2]] * gb, k = Math.min(ex, 1 / Math.max(1e-6, R, G, B));
      o[i * 4] = enc(R * k); o[i * 4 + 1] = enc(G * k); o[i * 4 + 2] = enc(B * k); o[i * 4 + 3] = 255;
    }
    return o;
  }
  function classify(px, w, h) {
    px = balance(px, w, h);
    const cnt = {}; let tot = 0, white = 0, black = 0;
    const x0 = Math.floor(w * 0.25), x1 = Math.ceil(w * 0.75), y0 = Math.floor(h * 0.25), y1 = Math.ceil(h * 0.75);
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
      const i = (y * w + x) * 4; const c = hsv(px[i], px[i + 1], px[i + 2]);
      tot++;
      if (c[2] < 0.18) { black++; continue; }
      if (c[1] < 0.22) { if (c[2] > 0.8) white++; continue; }
      const id = hueId(c[0], c[1], c[2]);
      cnt[id] = (cnt[id] || 0) + 1;
    }
    // 写真ぜんたい：おだいの 色が すこしでも あるか（ゆるい 色の はば・v0.2.1）
    const any = {}; let all = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; const c = hsv(px[i], px[i + 1], px[i + 2]);
      all++;
      Object.keys(LOOSE).forEach(function (k) { if (LOOSE[k](c[0], c[1], c[2])) any[k] = (any[k] || 0) + 1; });
    }
    Object.keys(any).forEach(function (k) { any[k] /= Math.max(1, all); });
    const ranks = Object.keys(cnt).map(function (k) { return { id: k, share: cnt[k] / Math.max(1, tot) }; }).sort(function (a, b) { return b.share - a.share; });
    let top = ranks[0] && ranks[0].share >= 0.12 ? ranks[0] : null;
    if (!top) top = { id: white / tot > 0.5 ? 'white' : black / tot > 0.5 ? 'black' : 'none', share: 0 };
    return { id: top.id, share: top.share, ranks: ranks, any: any };
  }
  function match(m, cls) {
    if (!m || m.type !== 'color' || !cls) return false;
    if (cls.id === m.color) return true;
    // 写真の どこかに おだいの 色が あれば OK（ゆかの 色が 大きくても かまわない）
    if (cls.any && (cls.any[m.color] || 0) >= ANY_MIN) return true;
    // 2ばんめでも ちかければ OK（あかと ピンク、むらさきと あお は まちがえやすい）
    const r = cls.ranks.filter(function (x) { return x.id === m.color; })[0];
    return !!(r && cls.ranks[0] && r.share >= 0.12 && r.share >= cls.ranks[0].share * 0.6);
  }
  function seen(cls) { return CNAME[cls.id] ? 'それは ' + CNAME[cls.id] + 'だね。' : 'いろが よく みえないね。'; }
  function lines() {
    const out = ['もってきたら、カメラで みせてね。', 'みつけたら、おうちの ひとに みせてね。', 'みつかった？', 'これかな？', 'もういちど さがして みよう！', 'ちかくで とってみてね。', 'いろんな もの、みつけたね！'];
    Object.keys(CNAME).forEach(function (k) { out.push('それは ' + CNAME[k] + 'だね。'); });
    out.push('いろが よく みえないね。');
    Object.keys(ADJ).forEach(function (k) { const m = M.color(k); out.push(m.line, m.ok, ADJ[k] + ' ものは あるかな？'); });
    Object.keys(JUDGE).forEach(function (k) { out.push(JUDGE[k].line, JUDGE[k].ok); });
    return out;
  }
  return { mission: mission, classify: classify, balance: balance, lastFix: function () { return lastFix; }, match: match, seen: seen, CNAME: CNAME, ADJ: ADJ, PLAN: PLAN, lines: lines };
})();
