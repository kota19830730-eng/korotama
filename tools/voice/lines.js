/* ---------------------------------------------------------
   声の 文を ぜんぶ 書き出す（ころたま v0.1.7・ずんだもんの 録音用）
     node tools/voice/lines.js → tools/voice/lines.json（{ key: ひらがなの 文, text: 読ませる 形（かん字・スペースなし） } の ならび）
   文は「。！？」で 区切った 1文ずつ（voice.js も 同じ 区切りで 再生する）。名前（お子さん・生きもの）は 入れない＝voice.js が 外す。
   足した 声の 文が ここに 無いと、その 文だけ 端末の 声に なる（smoke が 見る）。
   --------------------------------------------------------- */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const ctx = { window: null, console: console, document: undefined }; ctx.window = ctx; vm.createContext(ctx);
['js/core/util.js', 'js/core/tasks.js', 'js/content/kakusu.js', 'js/content/kotoba.js', 'js/core/text.js'].forEach(function (p) { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); });
const T = ctx.MQ.tasks, X = ctx.MQ.text;
const num = T.num;
const out = [];
function add(s) { String(s).replace(/([。！？!?])/g, '$1|').split('|').map(function (t) { return t.trim(); }).filter(Boolean).forEach(function (t) { if (out.indexOf(t) < 0) out.push(t); }); }

/* ---- もんだい（tasks.js の 型を ぜんぶ） ---- */
for (let n = 1; n <= 10; n++) {
  T.FOODS.forEach(function (f) { add(f.name + 'を ' + num(n) + ' ちょうだい'); });
  add('ぴったり ' + num(n) + '！ ありがとう！');
  T.THINGS.forEach(function (th) { T.COLORS.forEach(function (c) { if (n <= 4) add(c.name + ' ' + th.name + 'を ' + num(n) + ' ください'); }); });
}
add('まだ たりないよ。あと ' + num(1)); add('ちょっと おおいね。ひとつ もどそう'); add('あと ' + num(1) + ' ほしいな');
T.THINGS.forEach(function (th) { T.COLORS.forEach(function (c) { add('わあ、' + c.name + ' ' + th.name + 'だ！ ありがとう！'); }); });
T.COLORS.forEach(function (c) { add('それは ' + c.say + 'だね。'); add(c.say + 'は どれかな？'); });
T.FOODS.forEach(function (f) { add('それは ' + f.name + 'だね。'); });   // ごはん：ちがう 食べものを おした とき（v0.1.10）
const base = T.COLORS.slice(0, 4);
T.SHAPES.forEach(function (s) {
  add(s.adj + ' おもちゃは どれ？'); add('そう！ ' + s.name + 'だね！'); add('それは ' + s.name + 'だね。'); add(s.name + 'は どれかな？');
  base.forEach(function (c) { add(c.name + ' ' + s.adj + ' おもちゃは どれ？'); add('そう！ ' + c.name + ' ' + s.name + 'だね！'); add('それは ' + c.say + 'の ' + s.name + 'だね。'); add(c.name + ' ' + s.name + 'は どれかな？'); });
});
/* ---- ねんちょう（v0.1.11）：あわせる・わける・すうじ。文は 短く 区切って ある ので 何回も 作って 文を 集める ---- */
for (let n = 1; n <= 20; n++) add(T.read(n));          // タッチで かぞえる「いち、に、さん」
for (let i = 0; i < 40000; i++) {
  const t = i % 2 ? T.sum() : T.numeral();
  [t.line, t.ok].forEach(add);
  for (let v = 1; v <= 20; v++) { add(t.wrong1(v)); add(t.wrong2(v)); }
}
/* ---- くらべっこ（v0.1.12）：4つの 段階 × モード ---- */
['s', 'm', 'l', 'k'].forEach(function (st) {
  for (let i = 0; i < 20000; i++) {
    const t = T.compare(st);
    [t.line, t.ok, t.wrong2(t.options[0])].forEach(add);
    t.options.forEach(function (o) { if (!o.ok) add(t.wrong1(o)); });
  }
});
/* ---- もじ（v0.1.13）：4つの 段階 × モード・字を タッチして 読む 1字（ことばも） ---- */
['s', 'm', 'l', 'k'].forEach(function (st) {
  for (let i = 0; i < 20000; i++) {
    const t = T.hira(st);
    [t.line, t.ok].forEach(add);
    if (t.mode === 'build') { t.tiles.forEach(function (o) { add(o.kana); }); for (let k = 0; k < t.letters.length; k++) t.tiles.forEach(function (o) { add(t.wrong1(o, k)); add(t.wrong2(o, k)); }); }
    else { add(t.wrong2(t.options[0])); t.options.forEach(function (o) { if (!o.ok) add(t.wrong1(o)); if (o.kana) add(o.kana); }); }
    if (t.letter) add(t.letter);
    if (t.mode === 'read' || t.mode === 'build') t.ans.w.split('').forEach(add);   // タッチで 読む 1字
  }
});
/* ---- 画面の 声（js/ui/*.js の say・名前は 外した 形） ---- */
[
  'おはよう！ きょうは なにを する？', 'こんにちは！ なにを する？', 'こんばんは！ なにを する？',
  'えへへ！', 'くすぐったい！', 'だいすき！', 'いっしょに あそぼう！',
  'わあ！ おおきく なった！ ありがとう！',
  'たまごを とんとん して みて！', 'あと ' + num(2) + '！', 'あと ' + num(1) + '！', 'わあ！', 'うまれた！ よろしくね！',
  'こんにちは！ わたしの こえ、きこえる？ いっしょに あそぼうね。',
  'なにか かいてね', 'もう すこし 大きく かいてね'
].forEach(add);
for (let n = 1; n <= 5; n++) add('できた！ スタンプ ' + num(n) + 'め！ うれしいよ！');
/* js/ui/*.js の say('…') の 文字列も ひろう（手で 書き忘れた ぶん） */
['js/ui/care.js', 'js/ui/shop.js', 'js/ui/play.js', 'js/ui/home.js', 'js/ui/start.js', 'js/ui/kazu.js', 'js/ui/kurabe.js', 'js/ui/moji.js'].forEach(function (f) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  (src.match(/say\('([^']+)'/g) || []).forEach(function (m) { add(m.slice(5, -1)); });
  (src.match(/pick\(\[([^\]]+)\]/g) || []).forEach(function (m) { (m.match(/'([^']+)'/g) || []).forEach(function (q) { add(q.slice(1, -1)); }); });
});
const V = (function () { const c = { window: null, console: console }; c.window = c; c.MQ = ctx.MQ; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/core/voice.js'), 'utf8'), c); return c.MQ.voice; })();
function spoken(s) { let o = X._up(X._up(s, 6), 6); return V.kanaRead(o.replace(/[ 　]+/g, '')); }
const list = out.map(function (k) { return { key: k.replace(/[ 　]+/g, ''), text: spoken(k) }; });
fs.writeFileSync(path.join(__dirname, 'lines.json'), JSON.stringify(list, null, 1));
console.log('lines: ' + list.length);
if (require.main === module) list.slice(0, 12).forEach(function (l) { console.log(l.key + ' → ' + l.text); });
module.exports = list;
