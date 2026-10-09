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
  function count(stage) {
    if (stage === 'k') return sum();
    const L = lim(stage);
    const n = U.randInt(1, L.n);
    const food = U.pick(FOODS);
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
      more: 'あと ' + num(1) + ' ほしいな'
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
  return { sum: sum, numeral: numeral, read: read, READ: READ, MIX: MIX, foodById: function (id) { return FOODS.filter(function (f) { return f.id === id; })[0] || null; }, count: count, shop: shop, shape: shape, num: num, FOODS: FOODS, COLORS: COLORS, THINGS: THINGS, SHAPES: SHAPES, LIMIT: LIMIT, ROUNDS: 3 };
})();
