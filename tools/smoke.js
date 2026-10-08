/* ---------------------------------------------------------
   まなびたまご の ロジックの テスト（ブラウザ なし）：node tools/smoke.js
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
const ex = JSON.parse(MQ.save.exportMon());
ok(ex.app === 'manabi-tamago' && ex.mon.id === 'my-x' && ex.mon.png && ex.mon.area === 'sansu' && ex.mon.trace === true, 'つれていく ファイル＝まなびモンスターの custom と 同じ 形');
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
let spoken = null;
MQ.voice.setFake({ getVoices: function () { return [{ name: 'O-ren', lang: 'ja-JP' }]; }, cancel: function () {}, speak: function (u) { spoken = u; }, addEventListener: function () {}, Utterance: function (t) { this.text = t; } });
MQ.voice.setPitch('high');
ok(MQ.voice.say('こんにちは') && spoken && spoken.pitch === 1.35 && spoken.text === 'こんにちは', '高めの 声＝pitch 1.35');
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
ok(MQ.trace.parts && MQ.trace.parts.prepare && MQ.trace.parts.foregroundMask, 'trace.parts（cutout が 借りる 道具）');

console.log(fails ? '\n' + fails + ' FAIL' : '\nALL OK');
process.exit(fails ? 1 : 0);
