/* ---------------------------------------------------------
   おやすみの おはなし（ころたま v0.2・E）。DOM を 知らない。
   その日に あそんだ ことを じゅんばんに 入れた みじかい お話を 作る。
   知育：1日を ふりかえる（記憶）＋ じゅんばんの ことば（はじめに・それから・さいごに）＋ ねる 前の 習慣。
   さいごに「さいしょに なにを したかな？」（2つ いじょう あそんだ 日だけ）。
     build(dayLog, stamps) → { pages:[{ text, kind }], quiz: { ask, options:[kind], answer: kind } | null }
     KINDS               … しゅるい → 話の 文・みじかい 名前
     lines()             … 声の 文 ぜんぶ（録音 用）
   文は ぜんぶ 決まった 形（録音した 声で 読める ように 組み合わせを 少なく）。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.story = (function () {
  const KINDS = {
    count: { did: 'ごはんを たべたね。', name: 'ごはん' },
    color: { did: 'おみせで おかいものを したね。', name: 'おみせ' },
    shape: { did: 'かたちの おもちゃで あそんだね。', name: 'かたち' },
    compare: { did: 'くらべっこを したね。', name: 'くらべっこ' },
    moji: { did: 'もじの おけいこを したね。', name: 'もじ' },
    tokei: { did: 'とけいを よんだね。', name: 'とけい' },
    draw: { did: 'すてきな えを かいたね。', name: 'おえかき' },
    find: { did: 'いろんな ものを さがしたね。', name: 'さがしもの' },
    mane: { did: 'ことばの まねっこを したね。', name: 'まねっこ' },
    help: { did: 'おてつだいも してくれたね。', name: 'おてつだい' }
  };
  const ORDER = ['はじめに、', 'それから、', 'さいごに、'];
  const NUM = ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ'];
  const OPEN = 'きょうの おはなし、はじまり はじまり。';
  const NONE = 'きょうは ゆっくり やすんだ いちにち だったね。';
  const END = ['たくさん あそんで、ねむく なっちゃった。', 'あしたも いっしょに あそぼうね。', 'おやすみなさい。'];
  const QUIZ = 'さいしょに なにを したか おぼえてる？';
  function stampLine(n) { return 'たまごを ' + NUM[Math.min(6, n)] + ' もらったね。'; }   // v0.4：スタンプは たまご
  function right(kind) { return 'そう！ さいしょは ' + KINDS[kind].name + 'だったね！ よく おぼえてたね。'; }
  function wrong(kind, ans) { return KINDS[kind].name + 'も したね。さいしょは ' + KINDS[ans].name + 'だったよ。'; }

  // その日の しゅるいを はじめて した じゅんに（同じ しゅるいは 1回）
  function kindsOf(dayLog) {
    const seen = [];
    (dayLog || []).slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (e) { if (KINDS[e.k] && seen.indexOf(e.k) < 0) seen.push(e.k); });
    return seen;
  }
  function build(dayLog, stamps, rnd) {
    rnd = rnd || Math.random;
    const ks = kindsOf(dayLog);
    const pages = [{ text: OPEN, kind: 'open' }];
    if (!ks.length) pages.push({ text: NONE, kind: 'none' });
    // 話に 入れるのは 3つまで（はじめに・それから・さいごに）。4つ いじょうの 日は まんなかを 1つ えらぶ
    let pick = ks;
    if (ks.length > 3) pick = [ks[0], ks[1 + Math.floor(rnd() * (ks.length - 2))], ks[ks.length - 1]];
    pick.forEach(function (k, i) {
      const pre = pick.length === 1 ? '' : i === 0 ? ORDER[0] : i === pick.length - 1 ? ORDER[2] : ORDER[1];
      pages.push({ text: pre + KINDS[k].did, kind: k });
    });
    if (stamps > 0) pages.push({ text: stampLine(stamps), kind: 'stamp' });
    let quiz = null;
    if (ks.length >= 2) {
      const others = ks.slice(1);
      const opts = [ks[0]].concat(others.sort(function () { return rnd() - 0.5; }).slice(0, 2));
      quiz = { ask: QUIZ, options: opts.sort(function () { return rnd() - 0.5; }), answer: ks[0] };
    }
    const end = END.map(function (t) { return { text: t, kind: 'end' }; });
    return { pages: pages, quiz: quiz, end: end, kinds: ks };
  }
  function lines() {
    const out = [OPEN, NONE, QUIZ].concat(END);
    Object.keys(KINDS).forEach(function (k) {
      out.push(KINDS[k].did);
      ORDER.forEach(function (o) { out.push(o + KINDS[k].did); });
      out.push(right(k));
      Object.keys(KINDS).forEach(function (a) { if (a !== k) out.push(wrong(k, a)); });
    });
    for (let n = 1; n <= 6; n++) out.push(stampLine(n));
    return out;
  }
  return { KINDS: KINDS, build: build, kindsOf: kindsOf, right: right, wrong: wrong, lines: lines, QUIZ: QUIZ };
})();
