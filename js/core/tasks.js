/* ---------------------------------------------------------
   もんだい（ころたま）。DOM を 知らない。
   3つの あそび × 4だんかい（s ちいさい 3〜4さい／m なかくらい 4〜5さい／l おおきい 5〜6さい／k ねんちょう 6さい・v0.1.11）
   ねんちょう（k）だけ ごはん＝sum（あわせる・わける）／おみせ＝numeral（すうじを よむ）に かわる（小1の たし算・ひき算と 数字の 手まえ）。
     count(stage) … ごはん：「りんごを みっつ ちょうだい」（かず）
     shop(stage)  … おみせ：「あかい ケーキを ふたつ ください」（いろ＋かず）
     shape(stage) … あそぶ：「まるい おもちゃは どれ？」（かたち）
   かずの ことばは 読み上げが まちがえない ように ひらがな（ひとつ・ふたつ…）。
   ばつは ない。まちがえたら 声で 正しい ほうを 教える（教える 段階・まなびモンスターとは ぎゃく）。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.tasks = (function () {
  const U = MQ.util;
  const NUM = ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'];
  const FOODS = [
    { id: 'apple', name: 'りんご' }, { id: 'orange', name: 'みかん' }, { id: 'strawberry', name: 'いちご' },
    { id: 'grape', name: 'ぶどう' }, { id: 'banana', name: 'バナナ' }, { id: 'onigiri', name: 'おにぎり' }, { id: 'cookie', name: 'クッキー' }
  ];
  const COLORS = [
    { id: 'red', name: 'あかい', say: 'あか', hex: '#e0493a', dark: '#b7362a' },
    { id: 'blue', name: 'あおい', say: 'あお', hex: '#4f7fd9', dark: '#3458a8' },
    { id: 'yellow', name: 'きいろい', say: 'きいろ', hex: '#f2c94c', dark: '#c9a12e' },
    { id: 'green', name: 'みどりの', say: 'みどり', hex: '#6cc24a', dark: '#4e9a35' },
    { id: 'pink', name: 'ピンクの', say: 'ピンク', hex: '#f08cb0', dark: '#c45f88' },
    { id: 'purple', name: 'むらさきの', say: 'むらさき', hex: '#9a6fd1', dark: '#6f4aa8' }
  ];
  const THINGS = [{ id: 'cake', name: 'ケーキ' }, { id: 'flower', name: 'おはな' }, { id: 'ball', name: 'ボール' }];
  const SHAPES = [
    { id: 'circle', name: 'まる', adj: 'まるい' }, { id: 'triangle', name: 'さんかく', adj: 'さんかくの' },
    { id: 'square', name: 'しかく', adj: 'しかくの' }, { id: 'star', name: 'ほし', adj: 'ほしの' }, { id: 'heart', name: 'ハート', adj: 'ハートの' }
  ];
  const LIMIT = { s: { n: 3, colors: 3, shapes: 2 }, m: { n: 5, colors: 4, shapes: 3 }, l: { n: 10, colors: 5, shapes: 4 }, k: { n: 10, colors: 6, shapes: 5 } };
  // 数字の 読み（すうじの ふだ・かぞえる 声）。ひらがな（読み上げが まちがえない）
  const READ = ['ぜろ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう', 'じゅういち', 'じゅうに', 'じゅうさん', 'じゅうよん', 'じゅうご', 'じゅうろく', 'じゅうなな', 'じゅうはち', 'じゅうきゅう', 'にじゅう'];
  function read(n) { return READ[n] || String(n); }
  function lim(stage) { return LIMIT[stage] || LIMIT.s; }
  function num(n) { return NUM[n] || String(n); }

  /* ごはん：N こ。ちいさい・なかくらいは おさらに くぼみ（1対1で かぞえる）。おおきいは くぼみなし＋生きものを タップして「あげる」
     v0.1.10（ユーザー「りんごしか ないから タッチするだけ。ほかの 果物も まぜた ほうが」）：かごに ほかの 食べものを まぜる＝「えらぶ」＋「かぞえる」。
     まぜる しゅるい／こ数：ちいさい 1しゅるい 2こ／なかくらい 2しゅるい 3こ／おおきい 3しゅるい 4こ。ほしい 食べものは n＋1 こ（ちょうど だけに しない）。
     basket＝食べものの id の ならび（まぜて ある） */
  const MIX = { s: { kinds: 1, n: 2 }, m: { kinds: 2, n: 3 }, l: { kinds: 3, n: 4 }, k: { kinds: 3, n: 4 } };
  /* A（v0.2）：お子さんが かいた たべもの。ある ときは 3回に 1回 くらい それを ほしがる（名前は「かいた ごはん」） */
  let EXTRA = [];
  function setExtraFoods(list) { EXTRA = (list || []).filter(function (x) { return x && x.png; }).map(function (x, i) { return { id: 'my' + i, name: MY_FOOD, png: x.png }; }); }
  const MY_FOOD = 'かいた ごはん';
  function count(stage) {
    if (stage === 'k') return sum();
    const L = lim(stage);
    const n = U.randInt(1, L.n);
    const food = EXTRA.length && Math.random() < 0.35 ? U.pick(EXTRA) : U.pick(FOODS);
    const mx = MIX[stage] || MIX.s;
    const others = U.sample(FOODS.filter(function (f) { return f !== food; }), mx.kinds);
    const want = n + 1;
    const nOther = Math.max(mx.kinds, Math.min(mx.n, 14 - want));   // かごは 14こまで（10こ ほしい ときは まぜる 数を へらす）
    const basket = [];
    for (let i = 0; i < want; i++) basket.push(food.id);
    for (let i = 0; i < nOther; i++) basket.push(others[i % others.length].id);
    return {
      kind: 'count', food: food, n: n, slots: stage !== 'l', basket: U.shuffle(basket), others: others,
      line: food.name + 'を ' + num(n) + ' ちょうだい',
      wrong: function (f) { return 'それは ' + f.name + 'だね。' + food.name + 'を ' + num(n) + ' ちょうだい'; },
      ok: 'ぴったり ' + num(n) + '！ ありがとう！',
      more: 'まだ たりないよ。あと ' + num(1),
      moreFor: function (left) { return 'まだ たりないよ。あと ' + num(Math.max(1, left)); },   // 2026-10-10：のこりの 数を 正しく（5こ たりないのに「あと ひとつ」と 言って いた）
      over: 'ちょっと おおいね。ひとつ もどそう'
    };
  }
  /* おみせ：いろ（＋かず）。たなには いろちがいが ならぶ */
  function shop(stage) {
    const L = lim(stage);
    const thing = U.pick(THINGS);
    const cols = U.sample(COLORS, L.colors);
    const want = U.pick(cols);
    if (stage === 'k') return numeral();
    const n = stage === 's' ? U.randInt(1, 2) : stage === 'm' ? U.randInt(1, 3) : U.randInt(2, 4);
    return {
      kind: 'shop', thing: thing, colors: cols, want: want, n: n,
      line: want.name + ' ' + thing.name + 'を ' + num(n) + ' ください',
      ok: 'わあ、' + want.name + ' ' + thing.name + 'だ！ ありがとう！',
      wrongColor: function (c) { return 'それは ' + c.say + 'だね。' + want.say + 'は どれかな？'; },
      more: 'あと ' + num(1) + ' ほしいな',
      moreFor: function (left) { return 'あと ' + num(Math.max(1, left)) + ' ほしいな'; }
    };
  }
  /* あそぶ：かたち。おおきいは いろも つく（「あかい まる」） */
  function shape(stage) {
    const L = lim(stage);
    const opts = U.sample(SHAPES, L.shapes);
    const want = U.pick(opts);
    const withColor = stage === 'l' || stage === 'k';
    const base = COLORS.slice(0, 4);
    const col = withColor ? U.pick(base) : null;
    const options = opts.map(function (s) {
      const c = withColor ? (s === want ? col : U.pick(base.filter(function (x) { return x !== col; }))) : U.pick(base);
      return { shape: s, color: c, ok: s === want };
    });
    // おおきい：同じ かたちで ちがう 色も 1つ まぜる（いろも 見る）
    if (withColor) {
      const other = U.pick(base.filter(function (x) { return x !== col; }));
      options.push({ shape: want, color: other, ok: false });
    }
    return {
      kind: 'shape', want: want, color: col, options: U.shuffle(options),
      line: (col ? col.name + ' ' : '') + want.adj + ' おもちゃは どれ？',
      ok: 'そう！ ' + (col ? col.name + ' ' : '') + want.name + 'だね！',
      wrong: function (o) { return 'それは ' + (withColor && o.shape === want ? o.color.say + 'の ' + o.shape.name : o.shape.name) + 'だね。' + (col ? col.name + ' ' : '') + want.name + 'は どれかな？'; }
    };
  }
  /* ---- ねんちょう（k）：数字の ふだを えらぶ。choices＝ans を ふくむ ちがう 数 cnt こ（1〜max） ---- */
  function choices(ans, cnt, max, near) {
    const set = [ans];
    const cand = U.shuffle((near || []).concat([ans - 1, ans + 1, ans + 2, ans - 2])).filter(function (v) { return v >= 1 && v <= max; });
    cand.forEach(function (v) { if (set.length < cnt && set.indexOf(v) < 0) set.push(v); });
    while (set.length < cnt) { const v = U.randInt(1, max); if (set.indexOf(v) < 0) set.push(v); }
    return U.shuffle(set);
  }
  /* ごはん（k）：あわせる「りんごが ふたつ、みかんが みっつ。ぜんぶで いくつ？」／わける「クッキーが いつつ。ふたつ たべたら のこりは いくつ？」
     まちがえた とき：1回め＝「それは ろくだね。」＋ゆびで かぞえる ように さそう／2回め＝答えを 声で 教える（ばつなし・教える 段階）。
     おさらの 食べものを タッチすると「いち、に、さん」と 数字の 読みで かぞえる（ui）。 */
  function sum(mode) {
    mode = mode || (Math.random() < 0.5 ? 'add' : 'take');
    if (mode === 'add') {
      const a = U.randInt(1, 5), b = U.randInt(1, Math.min(5, 10 - a));
      const pair = U.sample(FOODS.filter(function (f) { return f.id !== 'banana'; }), 2);
      const ans = a + b;
      return {
        kind: 'sum', mode: 'add', a: a, b: b, foodA: pair[0], foodB: pair[1], ans: ans, choices: choices(ans, 3, 10),
        line: pair[0].name + 'が ' + num(a) + '。' + pair[1].name + 'が ' + num(b) + '。ぜんぶで いくつ？',
        ok: 'そう！ ぜんぶで ' + num(ans) + '！ ありがとう！',
        wrong1: function (v) { return 'それは ' + read(v) + 'だね。ゆびで タッチして かぞえて みよう。'; },
        wrong2: function (v) { return 'それは ' + read(v) + 'だね。' + num(a) + 'と ' + num(b) + 'で ' + num(ans) + 'だよ。'; }
      };
    }
    const n = U.randInt(3, 10), k = U.randInt(1, Math.min(4, n - 1));
    const food = U.pick(FOODS.filter(function (f) { return f.id !== 'banana'; }));
    const ans = n - k;
    return {
      kind: 'sum', mode: 'take', n: n, k: k, food: food, ans: ans, choices: choices(ans, 3, 10, [n]),
      line1: food.name + 'が ' + num(n) + ' あるよ。',
      line2: num(k) + ' たべたよ。のこりは いくつ？',
      line: food.name + 'が ' + num(n) + ' あるよ。' + num(k) + ' たべたよ。のこりは いくつ？',
      ok: 'そう！ のこりは ' + num(ans) + '！',
      wrong1: function (v) { return 'それは ' + read(v) + 'だね。のこって いる ものを タッチして かぞえて みよう。'; },
      wrong2: function (v) { return 'それは ' + read(v) + 'だね。' + num(n) + 'から ' + num(k) + ' たべて、のこりは ' + num(ans) + 'だよ。'; }
    };
  }
  /* おみせ（k）：すうじを よむ。hear＝「じゅうよんの はこを ください」（1〜20 の ふだ 4まい）／see＝ケーキの 数と 同じ 数字の ふだ（1〜10・3まい）
     10より 大きい 数は 2回め まちがえたら「じゅうよんは、いちと よんって かくよ。」（2けたの 読み方） */
  function numeral(mode) {
    mode = mode || (Math.random() < 0.5 ? 'hear' : 'see');
    if (mode === 'hear') {
      const t = Math.random() < 0.5 ? U.randInt(1, 10) : U.randInt(11, 20);
      const near = t > 10 ? [t - 10, t + 1, t - 1] : t === 6 ? [9, 5, 7] : t === 9 ? [6, 8, 10] : [t + 10];
      const tip = t > 10 ? read(t) + 'は、' + read(Math.floor(t / 10)) + 'と ' + read(t % 10) + 'って かくよ。' : '';
      return {
        kind: 'numeral', mode: 'hear', ans: t, choices: choices(t, 4, 20, near), color: U.pick(COLORS),
        line: read(t) + 'の はこを ください',
        ok: 'そう！ ' + read(t) + '！ ありがとう！',
        wrong1: function (v) { return 'それは ' + read(v) + 'だね。' + read(t) + 'は どれかな？'; },
        wrong2: function (v) { return 'それは ' + read(v) + 'だね。' + (tip || '') + read(t) + 'は どれかな？'; }
      };
    }
    const n = U.randInt(3, 10);
    const thing = U.pick(THINGS), col = U.pick(COLORS);
    return {
      kind: 'numeral', mode: 'see', ans: n, choices: choices(n, 3, 10), thing: thing, color: col,
      line: thing.name + 'は いくつ あるかな？ おなじ すうじを えらんでね',
      ok: 'そう！ ' + read(n) + '！ ありがとう！',
      wrong1: function (v) { return 'それは ' + read(v) + 'だね。' + thing.name + 'を タッチして かぞえて みよう。'; },
      wrong2: function (v) { return 'それは ' + read(v) + 'だね。' + thing.name + 'は ' + num(n) + '。' + read(n) + 'は どれかな？'; }
    };
  }
  /* ---- くらべっこ（v0.1.12・③）：くらべる・じゅんばん。4つの 段階 ぜんぶ ----
     s（3〜4さい）：おおきい／ちいさい・ながい／みじかい を 2つから
     m（4〜5さい）：いちばん おおきい／ながい を 3つから・おさら 2つの おおい／すくない（5こまで・2こ いじょう ちがう）
     l（5〜6さい）：おおい／すくない（8こまで・1こ ちがいも・すくない ほうを 広く ならべる＝見た目に だまされない）・まえから なんばんめ（5にん）
     k（6さい）  ：なんばんめ（8にん・まえから／うしろから）・数字の ふだ 2まいで おおきい／ちいさい かず（1〜20）
     options＝{ ok, … }。まちがえた とき 1回め＝くらべ方を さそう／2回め＝答えを 声で 教えて 正解を 光らせる（ui）。 */
  const ORD = ['', 'いちばんめ', 'にばんめ', 'さんばんめ', 'よんばんめ', 'ごばんめ', 'ろくばんめ', 'ななばんめ', 'はちばんめ'];
  const CMP_FOODS = FOODS.filter(function (f) { return f.id !== 'banana' && f.id !== 'onigiri'; });   // しろい おにぎりは しろい おさらに とける
  const CMP_MODES = { s: ['size', 'long'], m: ['size', 'long', 'more'], l: ['more', 'more', 'order'], k: ['order', 'bignum'] };
  function cmpSize(stage, mode) {
    const big = Math.random() < 0.5;
    const three = stage !== 's';
    const scales = mode === 'size' ? (three ? [1.45, 1.0, 0.6] : [1.45, 0.7]) : (three ? [1.0, 0.66, 0.34] : [1.0, 0.45]);
    const food = U.pick(CMP_FOODS);
    const word = mode === 'size' ? (big ? 'おおきい' : 'ちいさい') : (big ? 'ながい' : 'みじかい');
    const other = mode === 'size' ? (big ? 'ちいさい' : 'おおきい') : (big ? 'みじかい' : 'ながい');
    const name = mode === 'size' ? food.name : 'へび';
    const want = big ? 0 : scales.length - 1;
    const options = scales.map(function (k, i) { return { scale: k, ok: i === want }; });
    return {
      kind: 'cmp', mode: mode, food: food, color: U.pick(COLORS), options: U.shuffle(options), word: word,
      line: (three ? 'いちばん ' + word + ' ' + name + 'は どれ？' : word + ' ' + name + 'は どっち？'),
      ok: 'そう！ ' + (three ? 'いちばん ' : '') + word + 'ね！',
      wrong1: function () { return three ? 'ほかと くらべて みよう。いちばん ' + word + 'のは どれかな？' : 'それは ' + other + 'ね。' + word + 'のは どっちかな？'; },
      wrong2: function () { return 'ひかって いるのが ' + (three ? 'いちばん ' : '') + word + 'よ。'; }
    };
  }
  function cmpMore(stage) {
    const max = stage === 'm' ? 5 : 8, gap = stage === 'm' ? 2 : 1;
    let a, b;
    do { a = U.randInt(1, max); b = U.randInt(1, max); } while (Math.abs(a - b) < gap);
    const more = Math.random() < 0.5;
    const food = U.pick(CMP_FOODS);
    const word = more ? 'おおい' : 'すくない';
    const ans = more ? Math.max(a, b) : Math.min(a, b);
    const options = [{ n: a, ok: a === ans }, { n: b, ok: b === ans }];
    // おおきい（5〜6さい）：すくない ほうを 広く ならべる（ならびの 長さに だまされない）
    const spread = stage !== 'm';
    options.forEach(function (o) { o.wide = spread && o.n === Math.min(a, b); });
    return {
      kind: 'cmp', mode: 'more', food: food, options: options, word: word, a: a, b: b, ans: ans,
      line: food.name + 'が ' + word + ' おさらは どっち？',
      ok: 'そう！ ' + num(ans) + 'の ほうが ' + word + 'ね！',
      wrong1: function (o) { return 'それは ' + num(o.n) + 'だね。かぞえて くらべて みよう。'; },
      wrong2: function () { return num(Math.min(a, b)) + 'と ' + num(Math.max(a, b)) + '。' + num(ans) + 'の ほうが ' + word + 'ね。'; }
    };
  }
  function cmpOrder(stage) {
    const n = stage === 'k' ? 8 : 5;
    const back = stage === 'k' && Math.random() < 0.4;
    const ord = U.randInt(1, back ? 5 : n);
    const from = back ? 'うしろから' : 'まえから';
    const want = back ? n - ord : ord - 1;      // ならびの 番号（0＝いちばん まえ）
    const options = [];
    for (let i = 0; i < n; i++) options.push({ pos: i, ok: i === want });
    const counts = [];
    for (let i = 1; i <= ord; i++) counts.push(read(i));
    return {
      kind: 'cmp', mode: 'order', n: n, back: back, ord: ord, options: options,
      line: from + ' ' + ORD[ord] + 'の こは どれ？',
      ok: 'そう！ ' + from + ' ' + ORD[ord] + '！',
      wrong1: function (o) { const k = back ? n - o.pos : o.pos + 1; return 'それは ' + from + ' ' + ORD[k] + 'だね。' + (back ? 'うしろから' : 'はたの ほうから') + ' かぞえて みよう。'; },
      wrong2: function () { return counts.join('、') + '。ひかって いる こだよ。'; }
    };
  }
  function cmpNum() {
    let a, b;
    do { a = U.randInt(1, 20); b = U.randInt(1, 20); } while (a === b || Math.abs(a - b) > 9);
    const big = Math.random() < 0.5;
    const word = big ? 'おおきい' : 'ちいさい';
    const ans = big ? Math.max(a, b) : Math.min(a, b);
    return {
      kind: 'cmp', mode: 'bignum', options: [{ n: a, ok: a === ans }, { n: b, ok: b === ans }], word: word, ans: ans,
      line: word + ' かずは どっち？',
      ok: 'そう！ ' + read(ans) + 'の ほうが ' + word + 'ね！',
      wrong1: function (o) { return 'それは ' + read(o.n) + 'だね。かずを いって くらべて みよう。'; },
      wrong2: function () { return read(ans) + 'の ほうが ' + word + 'ね。'; }
    };
  }
  function compare(stage, mode) {
    stage = CMP_MODES[stage] ? stage : 's';
    mode = mode || U.pick(CMP_MODES[stage]);
    if (mode === 'size' || mode === 'long') return cmpSize(stage, mode);
    if (mode === 'more') return cmpMore(stage);
    if (mode === 'order') return cmpOrder(stage);
    return cmpNum();
  }
  /* ---- もじ（v0.1.13・④ ひらがな）。4つの 段階 ----
     s（3〜4さい）：はじめの おとを 聞きわける（字は 出さない）「はじめが「う」の ものは どれ？」絵 2つ
     m（4〜5さい）：おとと 字を むすぶ＝上を 絵 3つ＋大きな 字を 見せる／「「ね」の もじは どれ？」字 2まい
     l（5〜6さい）：絵 → はじめの 字（3まい・ね／れ・い／り など にた 字を まぜる）／聞いた 字（3まい・にた 字）
     k（6さい）  ：ことばを 読む（字を 読んで 同じ 絵）・字を ならべて ことばを つくる（はじめから じゅんに）
     絵は ゲームに ある もの だけ（食べもの・キャラクター・ほし）。だく音（ぶ）は ねんちょう だけ。 */
  const WORDS = [
    { w: 'りんご', food: 'apple' }, { w: 'みかん', food: 'orange' }, { w: 'いちご', food: 'strawberry' },   // おにぎりは しろい カードに とける ので 入れない
    { w: 'うさぎ', chr: 'rabbit' }, { w: 'ねこ', chr: 'cat' }, { w: 'ひよこ', chr: 'chick' }, { w: 'くま', chr: 'bear' }, { w: 'かえる', chr: 'frog' },
    { w: 'ひつじ', chr: 'sheep' }, { w: 'おおかみ', chr: 'wolf' }, { w: 'にんじゃ', chr: 'ninja' }, { w: 'ほし', shape: 'star' },
    { w: 'ぶた', chr: 'pig', k: true }, { w: 'ぶどう', food: 'grape', k: true }
  ];
  WORDS.forEach(function (x) { x.i = x.w.charAt(0); });
  const LOOK = { ね: ['れ', 'わ'], い: ['り', 'こ'], り: ['い', 'け'], お: ['あ', 'す'], く: ['へ', 'し'], ほ: ['は', 'ま'], み: ['め', 'あ'], ひ: ['し', 'つ'], か: ['や', 'が'], う: ['つ', 'ら'], に: ['こ', 'た'], ぶ: ['ふ', 'ぷ'] };
  const HIRA_MODES = { s: ['sound'], m: ['sound', 'hear'], l: ['first', 'hear'], k: ['read', 'build'] };
  function q(c) { return '「' + c + '」'; }
  function wordsFor(stage) { return WORDS.filter(function (x) { return stage === 'k' || !x.k; }); }
  function hira(stage, mode) {
    stage = HIRA_MODES[stage] ? stage : 's';
    mode = mode || U.pick(HIRA_MODES[stage]);
    const pool = wordsFor(stage);
    if (mode === 'sound') {
      const n = stage === 's' ? 2 : 3;
      const ans = U.pick(pool);
      const others = U.sample(pool.filter(function (x) { return x.i !== ans.i; }), 12).filter(function (x, i, a) { return a.findIndex(function (y) { return y.i === x.i; }) === i; }).slice(0, n - 1);
      const options = U.shuffle([ans].concat(others).map(function (x) { return { word: x, ok: x === ans }; }));
      return {
        kind: 'hira', mode: 'sound', ans: ans, letter: ans.i, showLetter: stage !== 's', options: options,
        line: 'はじめが ' + q(ans.i) + 'の ものは どれ？',
        ok: 'そう！ ' + ans.w + 'の ' + q(ans.i) + '！',
        wrong1: function (o) { return 'それは ' + o.word.w + '。' + q(o.word.i) + 'から はじまるね。'; },
        wrong2: function () { return q(ans.i) + 'から はじまるのは ' + ans.w + 'だよ。'; }
      };
    }
    if (mode === 'hear' || mode === 'first') {
      const n = stage === 'm' ? 2 : 3;
      const ansW = U.pick(pool.filter(function (x) { return LOOK[x.i]; }));
      const c = ansW.i;
      const dis = (stage === 'm' ? U.sample(pool.filter(function (x) { return x.i !== c; }).map(function (x) { return x.i; }), 1) : LOOK[c].slice(0, n - 1));
      const options = U.shuffle([c].concat(dis).map(function (x) { return { kana: x, ok: x === c }; }));
      if (mode === 'hear') return {
        kind: 'hira', mode: 'hear', letter: c, options: options,
        line: q(c) + 'の もじは どれ？',
        ok: 'そう！ ' + q(c) + '！',
        wrong1: function (o) { return 'それは ' + q(o.kana) + 'だね。' + q(c) + 'は どれかな？'; },
        wrong2: function () { return 'ひかって いるのが ' + q(c) + 'だよ。'; }
      };
      return {
        kind: 'hira', mode: 'first', ans: ansW, letter: c, options: options,
        line: ansW.w + 'の はじめの もじは どれ？',
        ok: 'そう！ ' + ansW.w + 'の ' + q(c) + '！',
        wrong1: function (o) { return 'それは ' + q(o.kana) + 'だね。もういちど よく みて みよう。'; },
        wrong2: function () { return ansW.w + 'の はじめは ' + q(c) + '。ひかって いる もじだよ。'; }
      };
    }
    if (mode === 'read') {
      const ans = U.pick(pool.filter(function (x) { return x.w.length <= 3; }));
      const others = U.sample(pool.filter(function (x) { return x !== ans; }), 2);
      const options = U.shuffle([ans].concat(others).map(function (x) { return { word: x, ok: x === ans }; }));
      return {
        kind: 'hira', mode: 'read', ans: ans, options: options,
        line: 'なんて かいて あるかな？ おなじ えを えらんでね',
        ok: 'そう！ ' + ans.w + '！',
        wrong1: function (o) { return 'それは ' + o.word.w + 'だね。もじを タッチして ひとつずつ よんで みよう。'; },
        wrong2: function () { return ans.w.split('').map(q).join('') + 'で ' + ans.w + 'だよ。'; }
      };
    }
    // build：字を ならべて ことばを つくる
    const ans = U.pick(pool.filter(function (x) { return x.w.length <= 3; }));
    const letters = ans.w.split('');
    const extra = U.pick((LOOK[letters[0]] || ['あ']).concat(['あ', 'す', 'た']).filter(function (x) { return letters.indexOf(x) < 0; }));
    const tiles = U.shuffle(letters.concat([extra]).map(function (c, i) { return { kana: c, id: i }; }));
    return {
      kind: 'hira', mode: 'build', ans: ans, letters: letters, tiles: tiles, options: tiles,
      line: ans.w + 'を つくろう。はじめの もじから タッチしてね',
      ok: 'できた！ ' + ans.w + '！',
      wrong1: function (o, step) { return 'それは ' + q(o.kana) + 'だね。' + ans.w + '。つぎの もじは なにかな？'; },
      wrong2: function (o, step) { return 'つぎは ' + q(letters[step]) + 'だよ。'; }
    };
  }
  /* ---- とけい（v0.1.14・⑤）。4つの 段階 ----
     s（3〜4さい）：あさ・ひる・よる の 絵（2つから）
     m（4〜5さい）：あさ・ひる・よる（3つから）・「あさの つぎは？」（一日の じゅんばん）
     l（5〜6さい）：「さんじの とけいは どれ？」ちょうどの 時刻（3つ・はりを ぎゃくに した とけいも まぜる）
     k（6さい）  ：「よじはんの とけいは どれ？」・「この とけいは なんじ？」（ちょうど／はん） */
  const DAY = [
    { id: 'asa', name: 'あさ', tip: 'あさは おひさまが ひくくて、そらが あかるく なって くるよ。', ok: 'おひさまが のぼって きたね！' },
    { id: 'hiru', name: 'ひる', tip: 'ひるは おひさまが そらの うえに あるよ。', ok: 'おひさまが うえに あるね！' },
    { id: 'yoru', name: 'よる', tip: 'よるは そらが くらくて、おつきさまが でるよ。', ok: 'おつきさまが でて いるね！' }
  ];
  const JI = ['', 'いちじ', 'にじ', 'さんじ', 'よじ', 'ごじ', 'ろくじ', 'しちじ', 'はちじ', 'くじ', 'じゅうじ', 'じゅういちじ', 'じゅうにじ'];
  const CLOCK_MODES = { s: ['day'], m: ['day', 'next'], l: ['hour'], k: ['pick', 'read'] };
  function jiName(h, half) { return JI[h] + (half ? 'はん' : ''); }
  function hourOf(h) { return ((h - 1 + 12) % 12) + 1; }
  function clock(stage, mode) {
    stage = CLOCK_MODES[stage] ? stage : 's';
    mode = mode || U.pick(CLOCK_MODES[stage]);
    if (mode === 'day') {
      const n = stage === 's' ? 2 : 3;
      const ans = U.pick(DAY);
      const opts = n === 3 ? DAY.slice() : [ans, U.pick(DAY.filter(function (d) { return d !== ans; }))];
      return {
        kind: 'clock', mode: 'day', ans: ans, options: U.shuffle(opts.map(function (d) { return { day: d, ok: d === ans }; })),
        line: ans.name + 'は どれ？',
        ok: 'そう！ ' + ans.name + 'だね。' + ans.ok,
        wrong1: function (o) { return 'それは ' + o.day.name + 'だね。' + ans.tip; },
        wrong2: function () { return 'ひかって いるのが ' + ans.name + 'だよ。'; }
      };
    }
    if (mode === 'next') {
      const i = U.randInt(0, 2), from = DAY[i], ans = DAY[(i + 1) % 3];
      return {
        kind: 'clock', mode: 'next', from: from, ans: ans, options: U.shuffle(DAY.map(function (d) { return { day: d, ok: d === ans }; })),
        line: from.name + 'の つぎは どれ？',
        ok: 'そう！ ' + from.name + 'の つぎは ' + ans.name + '！',
        wrong1: function (o) { return 'それは ' + o.day.name + 'だね。あさ、ひる、よる、また あさ の じゅんばんだよ。'; },
        wrong2: function () { return from.name + 'の つぎは ' + ans.name + 'だよ。'; }
      };
    }
    const half = mode !== 'hour' && Math.random() < 0.6;
    const h = U.randInt(1, 12);
    const ans = { h: h, half: half };
    let opts;
    if (mode === 'hour') {
      const other = U.pick([hourOf(h + 1), hourOf(h - 1), hourOf(h + 3)]);
      const swap = h !== 12 && h !== 6 ? { h: 12, half: false, swapOf: h } : { h: hourOf(h + 2), half: false };   // はりを ぎゃく（みじかい はりが 12・ながい はりが h）
      opts = [ans, { h: other, half: false }, swap];
    } else if (half) {
      opts = [ans, { h: h, half: false }, { h: hourOf(h - 1), half: true }];   // 「はん」で ない／みじかい はりの 見まちがい（ひとつ 前の 数字）
    } else {
      opts = [ans, { h: h, half: true }, { h: hourOf(h + 1), half: false }];
    }
    const options = U.shuffle(opts.map(function (c) { return { clock: c, ok: c === ans }; }));
    const nm = jiName(h, half);
    const teach = half ? 'ながい はりが したの ろくを さしたら はん。みじかい はりは ' + read(h) + 'と ' + read(hourOf(h + 1)) + 'の あいだだよ。'
      : 'みじかい はりが ' + read(h) + '、ながい はりが うえの じゅうにで ' + nm + 'だよ。';
    const base = {
      kind: 'clock', mode: mode, ans: ans, options: options, name: nm,
      ok: 'そう！ ' + nm + '！',
      wrong2: function () { return teach; }
    };
    if (mode === 'read') {
      base.line = 'この とけいは なんじ？';
      base.wrong1 = function (o) { return 'それは ' + jiName(o.clock.h, o.clock.half) + 'だね。ながい はりと みじかい はりを よく みて みよう。'; };
      return base;
    }
    base.line = nm + 'の とけいは どれ？';
    base.wrong1 = function (o) {
      if (o.clock.swapOf) return 'それは はりが ぎゃくだね。みじかい はりが なんじかを おしえて くれるよ。';
      return 'それは ' + jiName(o.clock.h, o.clock.half) + 'の とけいだね。' + (o.clock.half !== half ? 'ながい はりを みて みよう。' : 'みじかい はりを みて みよう。');
    };
    return base;
  }
  return { clock: clock, CLOCK_MODES: CLOCK_MODES, DAY: DAY, JI: JI, jiName: jiName, hira: hira, HIRA_MODES: HIRA_MODES, WORDS: WORDS, LOOK: LOOK, compare: compare, CMP_MODES: CMP_MODES, ORD: ORD, sum: sum, numeral: numeral, read: read, READ: READ, MIX: MIX, foodById: function (id) { return FOODS.concat(EXTRA).filter(function (f) { return f.id === id; })[0] || null; }, setExtraFoods: setExtraFoods, MY_FOOD: MY_FOOD, count: count, shop: shop, shape: shape, num: num, FOODS: FOODS, COLORS: COLORS, THINGS: THINGS, SHAPES: SHAPES, LIMIT: LIMIT, ROUNDS: 3 };
})();
