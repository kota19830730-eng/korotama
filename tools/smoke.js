/* ---------------------------------------------------------
   ころたま の ロジックの テスト（ブラウザ なし）：node tools/smoke.js
   見る もの：読みこみ順・もんだいの 作り（3だんかい × 3しゅるい を たくさん）・きろく・声の えらび方・ことば（かん字を つかわない）
   --------------------------------------------------------- */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
let fails = 0;
function ok(cond, msg) { if (cond) console.log('OK   ' + msg); else { fails++; console.log('FAIL ' + msg); } }

// にせの ブラウザ
const store = {};
const ctx = {
  window: null, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout, Date: Date, Math: Math, JSON: JSON,
  localStorage: { getItem: function (k) { return store[k] == null ? null : store[k]; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } },
  document: { createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {}, toggle: function () {} }, setAttribute: function () {}, appendChild: function () {}, addEventListener: function () {}, getContext: function () { return null; } }; }, addEventListener: function () {}, readyState: 'complete', documentElement: { style: { setProperty: function () {} } }, body: { appendChild: function () {} }, getElementById: function () { return null; }, querySelectorAll: function () { return []; } },
  navigator: { userAgent: 'node' }, performance: { now: function () { return Date.now(); } }
};
ctx.window = ctx;
ctx.addEventListener = function () {};
ctx.window.__MQ_NO_AUTOBOOT = true;
vm.createContext(ctx);

// index.html の じゅんばんで 読む（画面の ファイルは DOM が いる ので core と content だけ）
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = (index.match(/<script src="([^"]+)"><\/script>/g) || []).map(function (s) { return s.match(/src="([^"]+)"/)[1]; });
ok(scripts.length >= 15, 'index.html の script ' + scripts.length + 'こ');
const CORE = scripts.filter(function (s) { return /js\/(core|content)\//.test(s); });
CORE.forEach(function (f) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  try { vm.runInContext(code, ctx, { filename: f }); } catch (e) { fails++; console.log('FAIL 読みこみ ' + f + ': ' + e.message); }
});
const MQ = ctx.MQ;
ok(MQ && MQ.util && MQ.save && MQ.voice && MQ.trace && MQ.tasks && MQ.cutout && MQ.blocks && MQ.sfx && MQ.stage, 'core/content が ぜんぶ 読めた');
// harness が 同じ じゅんばんか
const harness = fs.readFileSync(path.join(ROOT, 'tools/harness.html'), 'utf8');
const hs = (harness.match(/<script src="\.\.\/([^"]+)"><\/script>/g) || []).map(function (s) { return s.match(/src="\.\.\/([^"]+)"/)[1]; });
ok(JSON.stringify(hs) === JSON.stringify(scripts), 'harness と index の 読みこみ順が 同じ');

/* ---- もんだい ---- */
const KANJI = /[一-鿿]/;
['s', 'm', 'l'].forEach(function (st) {
  const L = MQ.tasks.LIMIT[st];
  let maxN = 0, kanji = 0, lines = {};
  for (let i = 0; i < 300; i++) {
    const c = MQ.tasks.count(st);
    maxN = Math.max(maxN, c.n);
    if (c.n < 1 || c.n > L.n) { fails++; console.log('FAIL count n ' + c.n); }
    if (c.basket < c.n + 1) { fails++; console.log('FAIL basket ' + c.basket + ' < n+1'); }
    if (KANJI.test(c.line + c.ok + c.more + c.over)) kanji++;
    lines[c.line] = 1;
    const s = MQ.tasks.shop(st);
    if (s.colors.length !== L.colors) { fails++; console.log('FAIL shop colors ' + s.colors.length); }
    if (s.colors.indexOf(s.want) < 0) { fails++; console.log('FAIL shop want not on shelf'); }
    if (KANJI.test(s.line + s.ok + s.more + s.wrongColor(s.colors[0]))) kanji++;
    const p = MQ.tasks.shape(st);
    const oks = p.options.filter(function (o) { return o.ok; });
    if (oks.length !== 1) { fails++; console.log('FAIL shape ok count ' + oks.length); }
    if (st === 'l' && p.options.length !== L.shapes + 1) { fails++; console.log('FAIL shape l options ' + p.options.length); }
    if (st !== 'l' && p.options.length !== L.shapes) { fails++; console.log('FAIL shape options ' + p.options.length); }
    if (st === 'l') {
      // 同じ かたちで ちがう 色が 1つ まざる・正解は その 色
      const same = p.options.filter(function (o) { return o.shape === p.want; });
      if (same.length !== 2 || !same.some(function (o) { return o.ok && o.color === p.color; })) { fails++; console.log('FAIL shape l color mix'); }
    }
    if (KANJI.test(p.line + p.ok + p.wrong(p.options[0]))) kanji++;
  }
  ok(maxN <= L.n, st + ': ごはんの かず さいだい ' + maxN + '（上限 ' + L.n + '）');
  ok(kanji === 0, st + ': 声の 文に かん字が ない');
  ok(Object.keys(lines).length >= 6, st + ': ごはんの 文 ' + Object.keys(lines).length + 'しゅるい');
});
ok(MQ.tasks.num(1) === 'ひとつ' && MQ.tasks.num(10) === 'とお', 'かずの ことば（ひとつ〜とお）');

/* ---- きろく ---- */
MQ.save.reset();
ok(MQ.save.kid() === null, 'はじめは 子ども なし');
MQ.save.newKid({ name: 'ゆう', stage: 'm' });
MQ.save.setMon({ id: 'my-x', name: 'ぴょん', png: 'data:1', png2: 'data:2', png3: 'data:3', trace: true, area: 'sansu' });
ok(MQ.save.kid().mon.name === 'ぴょん' && MQ.save.monPng() === 'data:1', '生きものを ほぞん・すがた 1');
const day = new Date(2026, 9, 9, 10).getTime();
for (let i = 0; i < 7; i++) MQ.save.stamp('count', day);
ok(MQ.save.stampsToday(day) === 5, '1日 5こまで（' + MQ.save.stampsToday(day) + '）');
ok(MQ.save.kid().done.count === 7, 'できた 回数は ぜんぶ 数える');
ok(MQ.save.growth() === 1, '5こでは すがた 1');
for (let i = 0; i < 5; i++) MQ.save.stamp('shape', day + 86400000);
ok(MQ.save.stampsTotal() === 10 && MQ.save.growth() === 2 && MQ.save.monPng() === 'data:2', '6こで すがた 2（いま ' + MQ.save.stampsTotal() + '）');
for (let i = 0; i < 5; i++) MQ.save.stamp('color', day + 2 * 86400000);
ok(MQ.save.growth() === 3 && MQ.save.monPng() === 'data:3', '15こで すがた 3');
ok(!MQ.save.exportMon, 'まなびモンスターへ つれていく は なし（ユーザー決定 2026-10-09「世界観が 違う」）');
const all = MQ.save.exportText();
MQ.save.reset();
ok(MQ.save.kid() === null, 'ぜんぶ 消せる');
MQ.save.importText(all);
ok(MQ.save.kid() && MQ.save.kid().name === 'ゆう' && MQ.save.stampsTotal() === 15, 'ファイルから もどせる');
let bad = false; try { MQ.save.importText('{"x":1}'); } catch (e) { bad = true; }
ok(bad, 'ちがう ファイルは ことわる');
// 古い／こわれた きろく
store[MQ.save.KEY] = '{"v":1,"kid":{"name":"a"},"settings":{}}'; MQ.save._set(null);
ok(MQ.save.kid().stage === 's' && typeof MQ.save.kid().stamps === 'object' && MQ.save.kid().done.count === 0, 'こわれた きろくを なおす');

/* ---- 声 ---- */
MQ.voice.setFake({ getVoices: function () { return [{ name: 'Google US English', lang: 'en-US' }, { name: 'Otoya', lang: 'ja-JP' }, { name: 'Kyoko', lang: 'ja-JP' }]; }, cancel: function () {}, speak: function () {}, addEventListener: function () {}, Utterance: function (t) { this.text = t; } });
ok(MQ.voice.ready() && MQ.voice.voiceFor().name === 'Kyoko', '日本語の 声は Kyoko を 先に えらぶ');
MQ.voice.setFake({ getVoices: function () { return [{ name: 'Google US English', lang: 'en-US' }]; }, cancel: function () {}, speak: function () {}, addEventListener: function () {}, Utterance: function (t) { this.text = t; } });
ok(!MQ.voice.ready(), '日本語の 声が なければ ready false');
let spoken = null; const spokenAll = [];
MQ.voice.setFake({ getVoices: function () { return [{ name: 'O-ren', lang: 'ja-JP' }]; }, cancel: function () {}, speak: function (u) { spoken = u; spokenAll.push(u); }, addEventListener: function () {}, Utterance: function (t) { this.text = t; } });
MQ.voice.setPitch('high');
ok(MQ.voice.say('こんにちは') && spoken && spoken.pitch === 1.1 && spoken.text === 'こんにちは', '高めの 声＝pitch 1.1（上げすぎると 機械っぽい）');
ok(spoken.rate === 0.78, 'ゆっくり＝rate 0.78');
MQ.voice.setRate('normal'); MQ.voice.say('x'); ok(spoken.rate === 0.9, 'ふつうの はやさ＝0.9'); MQ.voice.setRate('slow');
MQ.voice.setPitch('normal'); MQ.voice.say('x'); ok(spoken.pitch === 1.0, 'はじめの 声は ふつう＝pitch 1.0'); MQ.voice.setPitch('high');
ok(MQ.voice.spokenForm('きょうは なにを する？') === '今日は何をする？' && MQ.voice.spokenForm('いっしょに あそぼう！') === '一緒に遊ぼう！', '声に 出す 形＝かん字に して スペースなし（イントネーションの ため）');
MQ.voice.say('ゆうちゃん、おはよう！ きょうは なにを する？'); ok(spoken.text === '今日は何をする？', '読む 文は かん字・スペースなし');
(function () { const n0 = spokenAll ? spokenAll.length : 0; MQ.voice.say('こんにちは！ げんき？ あそぼう。'); ok(spokenAll && spokenAll.length - n0 === 3 && spokenAll[spokenAll.length - 1].text === '遊ぼう。', '文ごとに 3つに 区切って 読む（かん字で）'); })();
MQ.voice.setPitch('normal');
MQ.voice.say('x'); ok(spoken.pitch === 1.0, 'ふつうの 声＝pitch 1.0');

/* ---- 子どもの 画面の ことば：ui の 文に かん字が ない（おうちの人むけ と 名前の 入力は のぞく） ---- */
['js/ui/care.js', 'js/ui/shop.js', 'js/ui/play.js'].forEach(function (f) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const says = (src.match(/say\('([^']+)'/g) || []).map(function (s) { return s.slice(5, -1); });
  ok(!says.some(function (s) { return KANJI.test(s); }), f + ' の 声の 文に かん字なし（' + says.length + '本）');
});

/* ---- 絵本ふうの キャラクター（charart）と 成長の 姿 ---- */
(function () {
  const ids = MQ.charart.list();
  ok(ids.length === 16, 'charart 16体');
  ok(ids.every(function (id) { return /^<svg/.test(MQ.charart.svg(id)); }), 'charart ぜんぶ SVG');
  ok(ids.every(function (id) { const a = MQ.charart.svg(id, 1), b = MQ.charart.svg(id, 2), c = MQ.charart.svg(id, 3); return a !== b && b !== c && a !== c && b.length > a.length && c.length > a.length; }), 'charart 2・3段階めは 絵が ちがう（姿が 立派に）');
  ok(ids.every(function (id) { return MQ.charart.ART[id].length === 1; }), 'charart ART[id](gr)＝段階で 描き分ける（v0.1.4）');
  ok(MQ.charart.SCALE[0] < MQ.charart.SCALE[1] && MQ.charart.SCALE[1] < MQ.charart.SCALE[2], 'charart 1→2→3 で 大きく なる');
  ok(!/ribbon|crown/.test(fs.readFileSync(path.join(ROOT, 'js/content/charart.js'), 'utf8')), 'charart リボン・かんむりの かざりは ない（ユーザー決定）');
  ok(!/stroke="#000|#000000|black/.test(ids.map(function (id) { return MQ.charart.svg(id, 3); }).join('')), 'charart 黒い ふちなし');
  const ps = MQ.presets.list();
  ok(ps.length === 16 && ps.every(function (p) { return p.png && p.png2 && p.png3 && p.png !== p.png2; }), 'presets 16体に png・png2・png3');
})();

ok(scripts.indexOf('js/core/cutout.js') > scripts.indexOf('js/core/trace.js') && scripts.indexOf('js/content/monstergen.js') < 0, 'cutout.js は trace.js の あと・monstergen.js は もう 読まない（v0.1.4）');
ok(MQ.text && MQ.text.fit('きょうは なにを する？') === 'きょうは なにを する？', 'text.fit は 画面の 字を 変えない（声だけ）');
ok(MQ.trace.parts && MQ.trace.parts.prepare && MQ.trace.parts.foregroundMask, 'trace.parts（cutout が 借りる 道具）');
/* ---- 写真の 主役を 切りぬく（ぬいぐるみ・おもちゃ・v0.1.17） ---- */
(function () {
  ok(MQ.subject && MQ.subject.isPaper && MQ.subject.mask && MQ.subject.fromImage && MQ.subject.PAPER_MIN > 0, 'subject.js（主役の 切りぬき）が 読めた');
  ok(scripts.indexOf('js/core/subject.js') > scripts.indexOf('js/core/cutout.js'), 'subject.js は cutout.js の あと（stages を 借りる）');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), hz = fs.readFileSync(path.join(ROOT, 'tools/harness.html'), 'utf8');
  ok(sw.indexOf('./js/core/subject.js') >= 0 && hz.indexOf('js/core/subject.js') >= 0, 'subject.js は sw.js の FILES と harness にも');
  // 紙らしさ：白い 紙（明るく 色みなし）は 1・茶色の 床は 0
  const W = 40, H = 40, p = new Uint8ClampedArray(W * H * 4);
  for (let k = 0; k < W * H; k++) { p[k * 4] = 245; p[k * 4 + 1] = 242; p[k * 4 + 2] = 236; p[k * 4 + 3] = 255; }
  ok(MQ.subject.paperness(p, W, H) > 0.9, '紙らしさ：白い 紙は 0.9 いじょう');
  for (let k = 0; k < W * H; k++) { p[k * 4] = 160; p[k * 4 + 1] = 110; p[k * 4 + 2] = 70; }
  ok(MQ.subject.paperness(p, W, H) < 0.1, '紙らしさ：茶色の 床は 0.1 みまん');
  // 主役の マスク：床（茶）の まん中に 白い まる → まるが 主役・床は 背景
  const W2 = 80, H2 = 80, q = new Uint8ClampedArray(W2 * H2 * 4);
  let inside = 0;
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const k = y * W2 + x; const d = Math.sqrt((x - 40) * (x - 40) + (y - 42) * (y - 42)); const on = d < 18; if (on) inside++; const line = (x % 20 === 0); q[k * 4] = on ? 240 : line ? 90 : 165 + ((x * 7 + y * 3) % 5); q[k * 4 + 1] = on ? 232 : line ? 60 : 112; q[k * 4 + 2] = on ? 215 : line ? 40 : 70; q[k * 4 + 3] = 255; }
  const r = MQ.subject.mask(q, W2, H2);
  let hit = 0, miss = 0; for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const k = y * W2 + x; const d = Math.sqrt((x - 40) * (x - 40) + (y - 42) * (y - 42)); if (r && r.m[k]) { if (d < 20) hit++; else miss++; } }
  ok(r && hit > inside * 0.85 && miss < inside * 0.1, '主役の マスク：床の まん中の 白い まる（' + hit + '/' + inside + '・はみ出し ' + miss + '）');
})();

/* ---- 録音した 声（ずんだもん・v0.1.7） ---- */
(function () {
  const lines = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voice/lines.json'), 'utf8'));
  const keys = new Set(lines.map(function (l) { return l.key; }));
  ok(lines.length >= 300, '声の 文の 一覧 ' + lines.length + '（tools/voice/lines.json）');
  // 画面の say('…') の 文（名前なし）が ぜんぶ 一覧に ある
  let miss = [];
  ['js/ui/care.js', 'js/ui/shop.js', 'js/ui/play.js', 'js/ui/home.js', 'js/ui/start.js', 'js/ui/common.js'].forEach(function (p) {
    const src = fs.readFileSync(path.join(ROOT, p), 'utf8');
    (src.match(/say\('([^']+)'/g) || []).forEach(function (m) {
      m.slice(5, -1).replace(/([。！？!?])/g, '$1|').split('|').map(function (x) { return x.trim().replace(/[ 　]+/g, ''); }).filter(Boolean).forEach(function (k) { if (!keys.has(k)) miss.push(k); });
    });
  });
  ok(!miss.length, '画面の 声の 文は ぜんぶ 録音の 一覧に ある' + (miss.length ? '：' + miss.join(' / ') : ''));
  MQ.voice.setNames(['ゆう', 'ドラゴ']);
  ok(MQ.voice.stripNames('ゆうちゃん、おはよう！ きょうは なにを する？') === 'おはよう！ きょうは なにを する？' && MQ.voice.stripNames('うまれた！ ドラゴだよ。よろしくね！') === 'うまれた！ よろしくね！' && MQ.voice.stripNames('できた！ スタンプ ひとつめ！ ドラゴも うれしいよ！') === 'できた！ スタンプ ひとつめ！ うれしいよ！', '名前を 外して 読む');
  MQ.voice.setNames([]);
  const bp = path.join(ROOT, 'assets/voice/bank.json');
  if (fs.existsSync(bp)) {
    const bank = JSON.parse(fs.readFileSync(bp, 'utf8'));
    const nob = lines.filter(function (l) { return !bank[l.key]; });
    ok(!nob.length, '録音（bank.json）に ぜんぶ ある' + (nob.length ? '：' + nob.length + ' 文 たりない' : '・' + Object.keys(bank).length + ' 文'));
    ok(Object.keys(bank).every(function (k) { return fs.existsSync(path.join(ROOT, 'assets/voice', bank[k])); }), '録音の mp3 が ぜんぶ ある');
    MQ.voice._setBank(bank); MQ.voice.setKind('zunda');
    ok(MQ.voice.clipFor('おはよう！') && MQ.voice.clipFor('りんごを みっつ ちょうだい'), 'clipFor で 文 → mp3');
    MQ.voice._setBank(null);
  } else console.log('--   bank.json は まだ ない（tools/voice/render.js で 録音する）');
})();

/* ---- ごはん：かごに ほかの 食べもの（v0.1.10） ---- */
(function () {
  let bad = 0;
  ['s', 'm', 'l'].forEach(function (st) {
    for (let k = 0; k < 300; k++) {
      const c = MQ.tasks.count(st);
      const mine = c.basket.filter(function (id) { return id === c.food.id; }).length;
      const other = c.basket.filter(function (id) { return id !== c.food.id; });
      const kinds = new Set(other).size;
      if (mine !== c.n + 1 || other.length < MQ.tasks.MIX[st].kinds || other.length > MQ.tasks.MIX[st].n || kinds !== MQ.tasks.MIX[st].kinds || c.basket.length > 14) bad++;
      if (!/^それは .+だね。/.test(c.wrong(MQ.tasks.foodById(other[0])))) bad++;
    }
  });
  ok(!bad, 'ごはん：かごに ほかの 食べもの（s 1しゅるい2こ／m 2しゅるい3こ／l 3しゅるい4こ）・ほしい ものは n＋1 こ');
})();

/* ---- ねんちょう（k・v0.1.11）：あわせる・わける・すうじを よむ ---- */
(function () {
  let bad = [], modes = {};
  for (let i = 0; i < 2000; i++) {
    const s = MQ.tasks.count('k'), n = MQ.tasks.shop('k'), p = MQ.tasks.shape('k');
    [s, n].forEach(function (t) {
      modes[t.mode] = 1;
      const max = t.mode === 'hear' ? 20 : 10;
      if (t.choices.indexOf(t.ans) < 0 || new Set(t.choices).size !== t.choices.length || t.choices.some(function (v) { return v < 1 || v > max; })) bad.push('choices ' + t.mode);
      if (t.choices.length !== (t.mode === 'hear' ? 4 : 3)) bad.push('choices len ' + t.mode);
      if (KANJI.test(t.line + t.ok + t.wrong1(t.choices[0]) + t.wrong2(t.choices[0]))) bad.push('kanji ' + t.mode);
    });
    if (s.kind !== 'sum' || n.kind !== 'numeral') bad.push('kind');
    if (s.mode === 'add' && (s.a + s.b !== s.ans || s.ans > 10 || s.foodA === s.foodB)) bad.push('add');
    if (s.mode === 'take' && (s.n - s.k !== s.ans || s.ans < 1 || s.k < 1)) bad.push('take');
    if (n.mode === 'see' && (n.ans < 3 || n.ans > 10)) bad.push('see');
    if (p.options.length !== 6 || p.options.filter(function (o) { return o.ok; }).length !== 1 || !p.color) bad.push('shape k');
  }
  ok(!bad.length && modes.add && modes.take && modes.hear && modes.see, 'ねんちょう：あわせる（10まで）・わける（のこり 1いじょう）・すうじ（ふだに 答えが 1まい）・形 5つ＋色' + (bad.length ? '：' + bad.slice(0, 4).join(' / ') : ''));
  ok(MQ.tasks.read(14) === 'じゅうよん' && MQ.tasks.read(20) === 'にじゅう' && MQ.tasks.numeral('hear').wrong2 && /いちと よんって かくよ/.test((function () { let t; do { t = MQ.tasks.numeral('hear'); } while (t.ans !== 14); return t.wrong2(4); })()), 'ねんちょう：数字の 読みと 2けたの 書き方「じゅうよんは、いちと よんって かくよ」');
  ok(MQ.save.STAGES.k === 'ねんちょう', 'きろく：段階 k（ねんちょう）');
  ok(scripts.indexOf('js/ui/kazu.js') > scripts.indexOf('js/ui/shop.js') && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./js/ui/kazu.js') > 0, 'kazu.js を 読む（index・sw）');
  // ねんちょうの 声の 文が ぜんぶ 録音の 一覧に ある
  const keys = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voice/lines.json'), 'utf8')).map(function (l) { return l.key; }));
  const miss = {};
  for (let i = 0; i < 3000; i++) {
    const t = i % 2 ? MQ.tasks.sum() : MQ.tasks.numeral();
    const all = [t.line, t.ok];
    t.choices.forEach(function (v) { all.push(t.wrong1(v), t.wrong2(v)); });
    for (let c = 1; c <= 10; c++) all.push(MQ.tasks.read(c));
    all.join('|').replace(/([。！？!?])/g, '$1|').split('|').map(function (x) { return x.trim().replace(/[ 　]+/g, ''); }).filter(Boolean).forEach(function (k) { if (!keys.has(k) && k !== '。') miss[k] = 1; });
  }
  ok(!Object.keys(miss).length, 'ねんちょうの 声の 文は ぜんぶ 録音の 一覧に ある' + (Object.keys(miss).length ? '：' + Object.keys(miss).slice(0, 5).join(' / ') : ''));
})();

/* ---- くらべっこ（v0.1.12） ---- */
(function () {
  const bad = [], seen = {};
  const keys = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voice/lines.json'), 'utf8')).map(function (l) { return l.key; }));
  const miss = {};
  ['s', 'm', 'l', 'k'].forEach(function (st) {
    for (let i = 0; i < 2000; i++) {
      const t = MQ.tasks.compare(st);
      seen[st + ':' + t.mode] = 1;
      if (MQ.tasks.CMP_MODES[st].indexOf(t.mode) < 0) bad.push(st + ' mode ' + t.mode);
      if (t.options.filter(function (o) { return o.ok; }).length !== 1) bad.push(st + ' ok ' + t.mode);
      if ((t.mode === 'size' || t.mode === 'long') && t.options.length !== (st === 's' ? 2 : 3)) bad.push('size n');
      if (t.mode === 'more') { if (t.a === t.b || Math.max(t.a, t.b) > (st === 'm' ? 5 : 8) || (st === 'm' && Math.abs(t.a - t.b) < 2)) bad.push('more'); if (st === 'l' && !t.options.some(function (o) { return o.wide; })) bad.push('wide'); }
      if (t.mode === 'order') { const w = t.options.filter(function (o) { return o.ok; })[0].pos; if ((t.back ? t.n - w : w + 1) !== t.ord || t.n !== (st === 'k' ? 8 : 5)) bad.push('order'); }
      if (t.mode === 'bignum' && (t.options[0].n === t.options[1].n || t.options.some(function (o) { return o.n < 1 || o.n > 20; }))) bad.push('bignum');
      const all = [t.line, t.ok, t.wrong2(t.options[0])];
      t.options.forEach(function (o) { if (!o.ok) all.push(t.wrong1(o)); });
      if (KANJI.test(all.join(''))) bad.push('kanji ' + t.mode);
      all.join('|').replace(/([。！？!?])/g, '$1|').split('|').map(function (x) { return x.trim().replace(/[ 　]+/g, ''); }).filter(Boolean).forEach(function (k) { if (!keys.has(k)) miss[k] = 1; });
    }
  });
  ok(!bad.length && Object.keys(seen).length === 9, 'くらべっこ：s 大小・長短 2択／m 3択＋おおい（5まで・2 ちがい）／l おおい（8まで・広く ならべる）＋まえから なんばんめ（5）／k なんばんめ（8・うしろからも）＋数字の 大小' + (bad.length ? '：' + bad.slice(0, 4).join(' / ') : ' ' + Object.keys(seen).sort().join(',')));
  ok(!Object.keys(miss).length, 'くらべっこの 声の 文は ぜんぶ 録音の 一覧に ある' + (Object.keys(miss).length ? '：' + Object.keys(miss).slice(0, 5).join(' / ') : ''));
  ok(scripts.indexOf('js/ui/kurabe.js') > 0 && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./js/ui/kurabe.js') > 0 && fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').indexOf('screen-kurabe') > 0, 'kurabe.js と screen-kurabe（index・sw）');
  MQ.save._set(null); const k0 = MQ.save.newKid({}); ok(k0.done.compare === 0, 'きろく：done.compare');
})();

/* ---- もじ（v0.1.13・④ ひらがな） ---- */
(function () {
  const bad = [], seen = {};
  const keys = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voice/lines.json'), 'utf8')).map(function (l) { return l.key; }));
  const miss = {};
  const HIRA = /^[ぁ-ゖー]+$/;
  ['s', 'm', 'l', 'k'].forEach(function (st) {
    for (let i = 0; i < 2000; i++) {
      const t = MQ.tasks.hira(st);
      seen[st + ':' + t.mode] = 1;
      if (MQ.tasks.HIRA_MODES[st].indexOf(t.mode) < 0) bad.push(st + ' mode');
      const all = [t.line, t.ok];
      if (t.mode === 'build') {
        if (t.tiles.length !== t.letters.length + 1 || t.letters.join('') !== t.ans.w) bad.push('build');
        t.letters.forEach(function (c) { if (!t.tiles.some(function (o) { return o.kana === c; })) bad.push('build tile'); });
        t.tiles.forEach(function (o) { all.push(o.kana, t.wrong1(o, 0), t.wrong2(o, 0)); });
      } else {
        if (t.options.filter(function (o) { return o.ok; }).length !== 1) bad.push(st + ' ok ' + t.mode);
        const want = t.mode === 'sound' ? (st === 's' ? 2 : 3) : t.mode === 'read' ? 3 : (st === 'm' ? 2 : 3);
        if (t.options.length !== want) bad.push(st + ' n ' + t.mode + ' ' + t.options.length);
        if (t.mode === 'sound' && new Set(t.options.map(function (o) { return o.word.i; })).size !== t.options.length) bad.push('sound same initial');
        if ((t.mode === 'hear' || t.mode === 'first') && (new Set(t.options.map(function (o) { return o.kana; })).size !== t.options.length || t.options.some(function (o) { return !HIRA.test(o.kana); }))) bad.push('kana');
        if (st !== 'k' && t.ans && t.ans.k) bad.push('dakuten ' + st);
        all.push(t.wrong2(t.options[0]));
        t.options.forEach(function (o) { if (!o.ok) all.push(t.wrong1(o)); if (o.kana) all.push(o.kana); });
      }
      if (KANJI.test(all.join(''))) bad.push('kanji');
      all.join('|').replace(/([。！？!?])/g, '$1|').split('|').map(function (x) { return x.trim().replace(/[ 　]+/g, ''); }).filter(Boolean).forEach(function (k) { if (!keys.has(k)) miss[k] = 1; });
    }
  });
  ok(!bad.length && Object.keys(seen).length === 7, 'もじ：s はじめの おと 2つ（字なし）／m おと 3つ＋字・聞いた 字 2まい／l 絵→字・聞いた 字（にた 字 3まい）／k 読む・ことばを つくる' + (bad.length ? '：' + bad.slice(0, 4).join(' / ') : ''));
  ok(!Object.keys(miss).length, 'もじの 声の 文は ぜんぶ 録音の 一覧に ある' + (Object.keys(miss).length ? '：' + Object.keys(miss).slice(0, 5).join(' / ') : ''));
  ok(MQ.voice.kanaRead('は') === 'ハ' && MQ.voice.kanaRead('それは「へ」だね。') === 'それは「ヘ」だね。' && MQ.voice.kanaRead('おはよう！') === 'おはよう！', '字の 名前は カタカナで 読む（「は」を「わ」と 読まない）');
  ok(scripts.indexOf('js/ui/moji.js') > 0 && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./js/ui/moji.js') > 0 && fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').indexOf('screen-moji') > 0, 'moji.js と screen-moji（index・sw）');
  MQ.save._set(null); ok(MQ.save.newKid({}).done.moji === 0, 'きろく：done.moji');
})();

/* ---- とけい（v0.1.14・⑤） ---- */
(function () {
  const bad = [], seen = {};
  const keys = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voice/lines.json'), 'utf8')).map(function (l) { return l.key; }));
  const miss = {};
  ['s', 'm', 'l', 'k'].forEach(function (st) {
    for (let i = 0; i < 2000; i++) {
      const t = MQ.tasks.clock(st);
      seen[st + ':' + t.mode] = 1;
      if (MQ.tasks.CLOCK_MODES[st].indexOf(t.mode) < 0) bad.push('mode');
      if (t.options.filter(function (o) { return o.ok; }).length !== 1) bad.push('ok ' + t.mode);
      if (t.options.length !== (st === 's' ? 2 : 3)) bad.push('n ' + st + t.mode);
      if (t.options[0].clock) {
        const sig = t.options.map(function (o) { const c = o.clock; return c.swapOf ? 'sw' + c.swapOf : c.h + (c.half ? 'h' : ''); });
        if (new Set(sig).size !== sig.length) bad.push('same clock ' + sig.join(','));
        if (t.options.some(function (o) { return o.clock.h < 1 || o.clock.h > 12; })) bad.push('h');
        if (st === 'l' && t.options.some(function (o) { return o.clock.half; })) bad.push('half in l');
      }
      const all = [t.line, t.ok, t.wrong2(t.options[0])];
      t.options.forEach(function (o) { if (!o.ok) all.push(t.wrong1(o)); });
      if (KANJI.test(all.join(''))) bad.push('kanji');
      all.join('|').replace(/([。！？!?])/g, '$1|').split('|').map(function (x) { return x.trim().replace(/[ 　]+/g, ''); }).filter(Boolean).forEach(function (k) { if (!keys.has(k)) miss[k] = 1; });
    }
  });
  ok(!bad.length && Object.keys(seen).length === 6, 'とけい：s あさ・ひる・よる 2つ／m 3つ＋つぎは？／l ちょうど（はり ぎゃくも）／k はん・読む' + (bad.length ? '：' + bad.slice(0, 4).join(' / ') : ''));
  ok(!Object.keys(miss).length, 'とけいの 声の 文は ぜんぶ 録音の 一覧に ある' + (Object.keys(miss).length ? '：' + Object.keys(miss).slice(0, 5).join(' / ') : ''));
  ok(scripts.indexOf('js/ui/tokei.js') > 0 && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./js/ui/tokei.js') > 0 && fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').indexOf('screen-tokei') > 0, 'tokei.js と screen-tokei（index・sw）');
  MQ.save._set(null); ok(MQ.save.newKid({}).done.tokei === 0, 'きろく：done.tokei');
})();

/* ---- おんがく（v0.1.15） ---- */
(function () {
  const bad = MQ.bgm.validate();
  ok(!bad.length, 'おんがく：楽ふが 読めて オルゴールの はんい・声部の 長さが そろう' + (bad.length ? '：' + bad.join(' / ') : ''));
  ok(MQ.bgm.SCREEN['screen-home'] === 'home' && MQ.bgm.SCREEN['screen-done'] === 'done' && MQ.bgm.SCREEN['screen-care'] === 'field' && MQ.bgm.SCREEN['screen-parent'] === null && ['care', 'shop', 'play', 'kurabe', 'moji', 'tokei'].every(function (k) { return MQ.bgm.SCREEN['screen-' + k] === 'field'; }), 'おんがく：おうち・できた！だけ 曲、もんだいの 画面は 環境音（ユーザー決定 案B）');
  MQ.save._set(null); ok(MQ.save.settings().music === true && MQ.save.settings().sound === true, '設定：おんがくは はじめ あり（古い きろくにも 足す）');
  ok(scripts.indexOf('js/core/bgm.js') > scripts.indexOf('js/core/sfx.js') && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./js/core/bgm.js') > 0, 'bgm.js を 読む（index・sw）');
  const cm = fs.readFileSync(path.join(ROOT, 'js/ui/common.js'), 'utf8');
  ok(/MQ\.bgm\.forScreen\(id\)/.test(cm) && (cm.match(/MQ\.bgm\.duck\(/g) || []).length >= 3, '画面が かわると 曲が かわる・声の あいだは 小さく（duck）');
  ['tap', 'correct', 'coin', 'clear', 'rare', 'shutter', 'unlock', 'setEnabled'].forEach(function (k) { if (typeof MQ.sfx[k] !== 'function') { fails++; console.log('FAIL sfx.' + k); } });
  ok(!/'square'|'sawtooth'/.test(fs.readFileSync(path.join(ROOT, 'js/core/sfx.js'), 'utf8')), '効果音：ピコピコの 波（square）は つかわない（絵本の 音）');
})();

/* ---- タップの 反応（v0.1.16・A＋B＋C＋D） ---- */
(function () {
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  const cm = fs.readFileSync(path.join(ROOT, 'js/ui/common.js'), 'utf8');
  const hm = fs.readFileSync(path.join(ROOT, 'js/ui/home.js'), 'utf8');
  // A：MOODS の 名前 ぜんぶに css の 動き（.mon.is-<名前> と keyframes）が ある
  const mm = /const MOODS = \{([^}]+)\}/.exec(cm);
  const moods = mm ? mm[1].match(/(\w+):/g).map(function (k) { return k.slice(0, -1); }) : [];
  const noCss = moods.filter(function (k) { return css.indexOf('.mon.is-' + k + ' .bxbox') < 0; });
  ok(moods.length >= 12 && !noCss.length, 'キャラクターの 動き ' + moods.length + 'しゅるい ぜんぶに css が ある' + (noCss.length ? '：' + noCss.join(',') : ''));
  ok(/\.mon\.is-sleep \.bxbox/.test(css) && /@keyframes zzUp/.test(css) && /wrap\.sleep = /.test(cm) && /wrap\.wake = /.test(cm), 'うたた寝（sleep／wake・zzz）');
  ['happy', 'jump', 'spin', 'shy', 'yawn', 'tickle', 'pat', 'sleep', 'wake'].forEach(function (k) { if (hm.indexOf(k + ': [') < 0) { fails++; console.log('FAIL home LINES ' + k); } });
  ok(/IDLE = \{ look: 20000, yawn: 35000, sleep: 50000 \}/.test(hm), 'ほっとくと きょろきょろ 20秒 → あくび 35秒 → うたた寝 50秒');
  // B：背景の 反応 6つ と 音
  ['sun', 'moon', 'cloud', 'tree', 'house', 'hill', 'sky'].forEach(function (k) { if (!(new RegExp('^\\s+' + k + ': function', 'm')).test(cm)) { fails++; console.log('FAIL scene react ' + k); } });
  ['sun', 'moon', 'rain', 'rainbow', 'rustle', 'bird', 'knock', 'door', 'pop', 'flutter', 'shoot', 'heart', 'tickle', 'jump', 'spin', 'yawn', 'snore', 'wake'].forEach(function (k) { if (typeof MQ.sfx[k] !== 'function') { fails++; console.log('FAIL sfx.' + k); } });
  ok(/\.rainbow/.test(css) && /\.drop/.test(css) && /\.fleaf/.test(css) && /\.bird/.test(css) && /\.smoke/.test(css) && /\.flower/.test(css) && /\.butterfly/.test(css) && /\.shoot/.test(css) && /\.scene\.is-night/.test(css), '背景の 反応の 絵（雨・にじ・葉・ことり・けむり・花・ちょうちょ・ながれぼし・夜）');
  ok(/scene__tap/.test(cm) && /tapBtn\(186, -2 \+ Y, 76, 76/.test(cm) && /tapBtn\(296, H - 262, 90, 110/.test(cm) && /tapBtn\(6, H - 190, 100, 100/.test(cm), '背景の 押す 場所は 見えない ボタン（64px いじょう）');
  ok(/const SH = 252 \+ Math\.max\(0, /.test(hm) && /justifyContent: 'space-evenly'/.test(hm) && /const Y = Math\.max\(0, Math\.min\(26/.test(cm) && !/left: '14px', top: '36px', width: '200px'/.test(hm), 'おうちの 字幕は ばめんの 下（雲・雨・けむりを かくさない）');
  ok(/MQ\.ui\.isSpeaking/.test(cm) && /if \(!MQ\.ui\.isSpeaking\(\)\) bl\.say\(t\)/.test(hm), '背景の ひとことは 読んで いる 最中は 出さない');
  ok(/にじが でた/.test(cm) && !/にじだ！/.test(cm), '「にじだ」は 声が「2時だ」に なる ので 書かない');
  // C：もんだいの 画面は うなずく／首を かしげる だけ（背景は 反応しない）
  ['care', 'play', 'kazu', 'kurabe', 'moji', 'tokei'].forEach(function (k) {
    const src = fs.readFileSync(path.join(ROOT, 'js/ui/' + k + '.js'), 'utf8');
    if (src.indexOf('MQ.ui.quietTap(mon)') < 0) { fails++; console.log('FAIL quietTap ' + k); }
    if (/sceneNode\([^)]*live/.test(src)) { fails++; console.log('FAIL live scene in ' + k); }
  });
  ok(/quietN\+\+ % 2 === 0 \? 'nod' : 'tilt'/.test(cm), 'もんだい中の タップ＝うなずく／首を かしげる を こうたい');
  ok(!/sceneNode\(380, \{[^}]*live/.test(fs.readFileSync(path.join(ROOT, 'js/ui/start.js'), 'utf8')), 'たまごの ばめんは 押せない（おうち だけ）');
  // D：スタンプで ふえる かざり
  ok(/decor: MQ\.save\.stampsTotal\(\)/.test(hm), 'おうちの かざりは スタンプの 合計で 決まる');
  ok(/Math\.floor\(total \/ 2\)/.test(cm) && /total >= 6/.test(cm) && /total >= 12/.test(cm) && /total >= 15/.test(cm), 'かざり＝2こ ごとに 花・6こ／12こ で ちょうちょ・15こ で 旗');
  // 動かすのは transform と opacity と filter だけ（軽く）：新しい keyframes に left／top／width を 入れない
  const kf = css.slice(css.indexOf('タップの 反応（v0.1.16'));
  const badKf = (kf.match(/@keyframes \w+ \{[^}]*(\{[^}]*\})+[^}]*\}/g) || []).filter(function (k) { return /\b(left|top|width|height|margin)\s*:/.test(k); });
  ok(!badKf.length, '反応の keyframes は transform／opacity だけ' + (badKf.length ? '：' + badKf.length : ''));
})();


/* ---- v0.2 ワクワクの しかけ（2026-10-10・ユーザー決定「全て入れましょう」） ---- */
(function () {
  ok(MQ.family && MQ.chores && MQ.story && MQ.season && MQ.mane && MQ.find, 'v0.2 の core（family・chores・story・season・mane・find）が 読めた');
  const keys = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voice/lines.json'), 'utf8')).map(function (l) { return l.key; }));
  const KJ = /[一-鿿]/;
  function voiced(list, name) {
    const sen = [];
    list.forEach(function (s) { String(s).replace(/([。！？!?])/g, '$1|').split('|').map(function (t) { return t.trim(); }).filter(Boolean).forEach(function (t) { sen.push(t.replace(/[ 　]+/g, '')); }); });
    const miss = sen.filter(function (t) { return !keys.has(t); });
    ok(!miss.length, name + ' の 声が 一覧に ある' + (miss.length ? '：' + miss.slice(0, 3).join(' / ') : '（' + sen.length + '）'));
    ok(!sen.some(function (t) { return KJ.test(t); }), name + ' の 声の 文に かん字なし');
  }
  // D おてつだい：日づけで 1つ・つづけて 同じに ならない
  const kid0 = { chores: null, help: {} };
  let same = 0;
  for (let d = 1; d < 28; d++) { const a = MQ.chores.today(kid0, '2026-11-' + ('0' + d).slice(-2)).id, b = MQ.chores.today(kid0, '2026-11-' + ('0' + (d + 1)).slice(-2)).id; if (a === b) same++; }
  ok(same === 0, 'おてつだい：つぎの 日は ちがう ものに なる');
  ok(MQ.chores.enabled({ chores: ['towel'] }).length === 1 && MQ.chores.enabled({ chores: [] }).length === 6, 'おてつだい：えらんだ もの／はじめの 6つ');
  voiced(MQ.chores.lines(), 'おてつだい');
  // E おはなし：じゅんばんの ことば・クイズ
  const t = Date.now();
  const st = MQ.story.build([{ k: 'moji', t: t - 50 }, { k: 'count', t: t - 90 }, { k: 'moji', t: t - 10 }, { k: 'find', t: t }], 2, function () { return 0.3; });
  ok(st.kinds.join(',') === 'count,moji,find', 'おはなし：はじめて した じゅんに 並ぶ（同じ しゅるいは 1回）');
  ok(/^はじめに、/.test(st.pages[1].text) && /^それから、/.test(st.pages[2].text) && /^さいごに、/.test(st.pages[3].text), 'おはなし：はじめに・それから・さいごに');
  ok(st.quiz && st.quiz.answer === 'count' && st.quiz.options.indexOf('count') >= 0, 'おはなし：「さいしょに なにを した？」の こたえは さいしょの あそび');
  ok(!MQ.story.build([], 0).quiz && MQ.story.build([], 0).pages.length === 2, 'おはなし：あそんで いない 日は クイズなし');
  voiced(MQ.story.lines(), 'おはなし');
  // G きせつ・行事・誕生日
  ok(MQ.season.of(new Date('2026-04-10T10:00:00')).season === 'spring' && MQ.season.of(new Date('2026-12-24T10:00:00')).event === 'xmas' && MQ.season.of(new Date('2026-10-10T10:00:00')).event === null, 'きせつ：はる・クリスマス・ふつうの 日');
  const bk = { birthday: '05-03', created: new Date('2025-07-07T10:00:00').getTime() };
  ok(MQ.season.of(new Date('2026-05-03T10:00:00'), bk).birthday && MQ.season.of(new Date('2026-07-07T10:00:00'), bk).monBirthday && !MQ.season.of(new Date('2025-07-07T10:00:00'), bk).monBirthday, 'たんじょうび：お子さん／生きものの 1年め（その日 生まれた 年は なし）');
  voiced(MQ.season.lines(), 'きせつ');
  // B まねっこ
  ['s', 'm', 'l', 'k'].forEach(function (s) { const w = MQ.mane.word(s); ok(w.say && w.line.indexOf(w.say) > 0, 'まねっこ ' + s + '：' + w.say); });
  voiced(MQ.mane.lines(), 'まねっこ');
  // まねっこ v0.2.1：何も 言わなければ ほめない（はかれた ときだけ）
  const J = MQ.mane.judge;
  ok(J({ measured: true, voicedMs: 0, peak: 0.01 }, 'いちご') === 'none' && J({ measured: true, voicedMs: 120, peak: 0.2 }, 'いちご') === 'none', 'まねっこ：だまって いたら none（ほめない）');
  ok(J({ measured: true, voicedMs: 600, peak: 0.2 }, 'いちご') === 'good' && J({ measured: true, voicedMs: 600, peak: 0.03 }, 'いちご') === 'quiet', 'まねっこ：言えた good／小さい quiet');
  ok(J({ measured: true, voicedMs: 180, peak: 0.2 }, 'おやすみなさい') === 'short' && J({ measured: true, voicedMs: 180, peak: 0.2 }, 'ほし') === 'good', 'まねっこ：長い ことばで みじかいと short');
  ok(J(null, 'いちご') === 'unknown' && J({ measured: false }, 'いちご') === 'unknown', 'まねっこ：はかれない 端末は unknown（いままで どおり）');
  ok(MQ.mane.mora('おにぎりを つくる') === 8 && MQ.mane.mora('ちゃ') === 1, 'まねっこ：おんの 数');
  ok(MQ.family.PHRASES.length === 6 && !MQ.family.has('great'), 'おうちの人の 声：6つ・はじめは 空');
  // C さがす：色を 読む
  function img(hex, bg) {
    const W = 40, H = 40, px = new Uint8ClampedArray(W * H * 4);
    const c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)], b = bg || [210, 205, 195];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, inn = Math.hypot(x - 20, y - 20) < 12; const v = inn ? c : b; px[i] = v[0]; px[i + 1] = v[1]; px[i + 2] = v[2]; px[i + 3] = 255; }
    return MQ.find.classify(px, W, H);
  }
  const want = { red: '#e0493a', blue: '#3c6fd0', yellow: '#f2c94c', green: '#5cb23a', pink: '#f08cb0', purple: '#8a5ac8' };
  Object.keys(want).forEach(function (k) { const c = img(want[k]); ok(c.id === k, 'さがす：' + k + ' を 読む（' + c.id + '）'); });
  ok(MQ.find.match({ type: 'color', color: 'red' }, img(want.red)) && !MQ.find.match({ type: 'color', color: 'blue' }, img(want.red)), 'さがす：あってる／ちがう');
  // v0.2.1 ゆかの 色が 大きくても、おだいの 色が あれば OK
  (function () {
    const W = 60, H = 60, floor = [196, 128, 70], px = new Uint8ClampedArray(W * H * 4);
    function pic(hex, r) { const c = hex ? [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)] : floor; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, v = Math.hypot(x - 30, y - 34) < r ? c : floor; px[i] = v[0]; px[i + 1] = v[1]; px[i + 2] = v[2]; px[i + 3] = 255; } return MQ.find.classify(px, W, H); }
    const pu = pic('#7a4fa8', 8);
    ok(pu.id === 'orange' && MQ.find.match({ type: 'color', color: 'purple' }, pu), 'さがす：ゆか（オレンジ）の 上の 小さな むらさき → OK');
    ok(MQ.find.match({ type: 'color', color: 'blue' }, pic('#3c6fd0', 7)) && MQ.find.match({ type: 'color', color: 'green' }, pic('#5cb23a', 7)), 'さがす：ゆかの 上の あお・みどり → OK');
    const fl = pic(null, 0);
    ok(['red', 'yellow', 'purple', 'pink', 'blue', 'green'].every(function (k) { return !MQ.find.match({ type: 'color', color: k }, fl); }), 'さがす：ゆかだけ → どの おだいも OK に しない');
  })();
  ['s', 'm', 'l', 'k'].forEach(function (s) { for (let i = 0; i < 30; i++) { const m = MQ.find.mission(s); if (!m || !m.line) { ok(false, 'さがす mission ' + s); return; } } });
  voiced(MQ.find.lines(), 'さがす');
  // さがすは いろと かたちだけ（2026-10-10：どの 家にも ある もの）
  ok(Object.keys(MQ.find.PLAN).every(function (k) { return MQ.find.PLAN[k].every(function (p) { return /^c:|^j:(round|square|redround|yellowround|bluesquare|greensquare)$/.test(p); }); }), 'さがす：おだいは いろと かたちだけ');
  // A かいた たべもの：かずの もんだいに まざる
  MQ.tasks.setExtraFoods([{ png: 'data:x' }]);
  let mine = 0; for (let i = 0; i < 300; i++) { const c = MQ.tasks.count('s'); if (c.food.id === 'my0') mine++; if (c.food.id === 'my0' && !MQ.tasks.foodById('my0')) { ok(false, 'foodById my0'); break; } }
  ok(mine > 40 && mine < 200, 'かいた たべもの：ごはんの もんだいに ときどき 出る（' + mine + '/300）');
  MQ.tasks.setExtraFoods([]);
  voiced([MQ.tasks.MY_FOOD + 'を みっつ ちょうだい', 'それは ' + MQ.tasks.MY_FOOD + 'だね。'], 'かいた ごはん');
  // きろく：新しい ところ・成長は おてつだいも 数える
  store[MQ.save.KEY] = undefined; delete store[MQ.save.KEY]; MQ.save._set(null);
  const k = MQ.save.newKid({ name: 'ゆう', stage: 's' });
  ok(k.items && Array.isArray(k.items.foods) && Array.isArray(k.finds) && k.log && k.help && k.done.draw === 0 && k.done.help === 0, 'きろく：v0.2 の 入れもの');
  MQ.save.stamp('count'); MQ.save.note('help');
  ok(MQ.save.dayLog().map(function (e) { return e.k; }).join(',') === 'count,help', 'きろく：その日に した こと');
  MQ.save.update(function (d) { for (let i = 0; i < 5; i++) d.kid.help['2026-09-0' + (i + 1)] = 'shoes'; });
  ok(MQ.save.growPoints() === 6 && MQ.save.growth() === 2, '成長：スタンプ ＋ おてつだい で 数える（1＋5＝6 → 2だんかい）');
  const old = { v: 1, kid: { name: 'a', stage: 's', stamps: {}, done: { count: 1, color: 0, shape: 0 } }, settings: {} };
  store[MQ.save.KEY] = JSON.stringify(old); MQ.save._set(null);
  const k2 = MQ.save.kid();
  ok(k2.items && k2.items.hatOn === true && Array.isArray(k2.finds) && k2.done.story === 0, '古い きろくにも v0.2 の 入れものが できる');
  // ui の 新しい 画面：声の 文に かん字なし・index と sw に 入って いる
  ['js/ui/kaku.js', 'js/ui/sagasu.js', 'js/ui/maneko.js', 'js/ui/otetsudai.js', 'js/ui/ohanashi.js'].forEach(function (f) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const says = (src.match(/(?:say|sayIfFree)\('([^']+)'/g) || []).map(function (m) { return m.slice(m.indexOf("'") + 1, -1); });
    ok(!says.some(function (s) { return KJ.test(s); }), f + ' の 声の 文に かん字なし');
    ok(index.indexOf(f) >= 0 && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./' + f) >= 0, f + ' が index と sw に ある');
  });
  ok(index.indexOf('css/v02.css') >= 0 && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./css/v02.css') >= 0, 'css/v02.css が index と sw に ある');
  ['screen-kaku', 'screen-sagasu', 'screen-maneko', 'screen-help', 'screen-story', 'screen-album', 'screen-print'].forEach(function (id) { ok(index.indexOf('id="' + id + '"') >= 0 && harness.indexOf('id="' + id + '"') >= 0, id + ' が index と harness に ある'); });
  ok(MQ.bgm.validate().length === 0 && MQ.bgm.SONGS.night && MQ.bgm.SONGS.birthday, 'おんがく：こもりうた・おたんじょうびの うた');
})();

/* ---- はじめての 案内（2026-10-10） ---- */
(function () {
  const g = fs.readFileSync(path.join(ROOT, 'js/ui/guide.js'), 'utf8');
  ok(index.indexOf('js/ui/guide.js') >= 0 && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./js/ui/guide.js') >= 0 && harness.indexOf('js/ui/guide.js') >= 0, 'guide.js が index・sw・harness に ある');
  ok(!/ずんだもん|VOICEVOX/.test(g), '案内は おうちの人むけ：ずんだもんの 名前を 出さない');
  ok((g.match(/title: '/g) || []).length === 5, '案内は 5ページ');
  ok(/guideSeen/.test(fs.readFileSync(path.join(ROOT, 'js/ui/guide.js'), 'utf8')) && /MQ.ui.guide.shouldShow()/.test(fs.readFileSync(path.join(ROOT, 'js/ui/home.js'), 'utf8')), 'はじめて おうちに 来た とき 1回だけ 出す');
  const fb = fs.readFileSync(path.join(ROOT, 'js/ui/feedback.js'), 'utf8');
  ok(index.indexOf('js/ui/feedback.js') >= 0 && index.indexOf('js/ui/feedback.js') < index.indexOf('js/ui/guide.js') && fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').indexOf('./js/ui/feedback.js') >= 0 && harness.indexOf('js/ui/feedback.js') >= 0, '感想フォーム：feedback.js が guide.js より 前・sw・harness に ある');
  ok(!/ずんだもん|VOICEVOX/.test(fb) && /fbDone/.test(fb) && /fbAskDay/.test(fb) && /length >= 2/.test(fb) && /if \(!FORM.url\) return false/.test(fb), '感想フォーム：1日1回・2日 遊んで から・送りましたで 止まる・url が ない ときは 出さない');
  ok(/MQ.ui.feedback.due\(\)/.test(fs.readFileSync(path.join(ROOT, 'js/ui/home.js'), 'utf8')) && /MQ.ui.feedback.card\(\)/.test(fs.readFileSync(path.join(ROOT, 'js/ui/parent.js'), 'utf8')), '感想フォーム：おうちの 画面で お願い・おうちの人の 画面に カード');
  ok(/d.kid.birthday = bv/.test(fs.readFileSync(path.join(ROOT, 'js/ui/start.js'), 'utf8')), 'はじめの 設定で 誕生日を 入れられる');
})();

console.log(fails ? '\n' + fails + ' FAIL' : '\nALL OK');
process.exit(fails ? 1 : 0);
