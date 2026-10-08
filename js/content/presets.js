/* ---------------------------------------------------------
   さいしょから いる キャラクター（まなびたまご）
   絵を かかなくても えらべる「かわいい」8体 と「かっこいい」8体。
   絵は まなびモンスターの monstergen（体の 形 85しゅるい）で その場で 組み立てる（手で 座標を 打たない）。
     MQ.presets.GROUPS                 … [{ id, name }]
     MQ.presets.list(groupId)          … [{ id, name, group, kind, png }]（png は 1回 作ったら おぼえる）
     MQ.presets.get(id)
   色は [r, g, b]。f は monstergen.make() の 特徴（main・accent・eyes・horns・wings・teeth）。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.presets = (function () {
  const GROUPS = [{ id: 'cute', name: 'かわいい' }, { id: 'cool', name: 'かっこいい' }];
  const DEF = [
    // かわいい
    { id: 'rabbit', group: 'cute', name: 'うさぴょん', kind: 'rabbit', f: { main: [245, 190, 205], accent: [255, 240, 245], eyes: 2 } },
    { id: 'cat', group: 'cute', name: 'にゃんこ', kind: 'cat', f: { main: [244, 170, 80], accent: [255, 235, 200], eyes: 2 } },
    { id: 'chick', group: 'cute', name: 'ぴよちゃん', kind: 'bird', f: { main: [250, 215, 70], accent: [245, 140, 60], eyes: 2 } },
    { id: 'penguin', group: 'cute', name: 'ぺんた', kind: 'penguin', f: { main: [70, 90, 130], accent: [255, 250, 240], eyes: 2 } },
    { id: 'bear', group: 'cute', name: 'くまごろう', kind: 'bear', f: { main: [180, 120, 70], accent: [240, 210, 170], eyes: 2 } },
    { id: 'pig', group: 'cute', name: 'ぶうた', kind: 'pig', f: { main: [245, 160, 170], accent: [255, 205, 210], eyes: 2 } },
    { id: 'sheep', group: 'cute', name: 'もこもこ', kind: 'sheep', f: { main: [250, 245, 235], accent: [90, 80, 80], eyes: 2 } },
    { id: 'frog', group: 'cute', name: 'けろりん', kind: 'frog', f: { main: [110, 200, 90], accent: [230, 240, 150], eyes: 2 } },
    // かっこいい
    { id: 'dragon', group: 'cool', name: 'ドラゴ', kind: 'dragon', f: { main: [220, 70, 60], accent: [250, 190, 60], eyes: 2, horns: 2 } },
    { id: 'robot', group: 'cool', name: 'ロボくん', kind: 'robot', f: { main: [90, 130, 220], accent: [230, 235, 245], eyes: 2 } },
    { id: 'lion', group: 'cool', name: 'ライオ', kind: 'lion', f: { main: [240, 170, 60], accent: [170, 90, 40], eyes: 2, teeth: true } },
    { id: 'shark', group: 'cool', name: 'シャーク', kind: 'shark', f: { main: [90, 140, 190], accent: [230, 240, 250], eyes: 2, teeth: true } },
    { id: 'wolf', group: 'cool', name: 'ウルフ', kind: 'wolf', f: { main: [120, 125, 140], accent: [230, 230, 235], eyes: 2 } },
    { id: 'knight', group: 'cool', name: 'ナイト', kind: 'knight', f: { main: [200, 205, 215], accent: [60, 90, 180], eyes: 2 } },
    { id: 'ninja', group: 'cool', name: 'にんにん', kind: 'ninja', f: { main: [60, 60, 80], accent: [220, 60, 60], eyes: 2 } },
    { id: 'rocket', group: 'cool', name: 'ロケッタ', kind: 'rocket', f: { main: [230, 70, 60], accent: [240, 240, 250], eyes: 2 } }
  ];
  const cache = {};
  function build(d) {
    const G = MQ.monsterGen;
    if (!G || !G.make) return null;
    const f = Object.assign({ horns: 0, wings: false, skull: false, teeth: false, legs: 2 }, d.f);
    const m = G.make(f, d.kind);
    if (!m) return null;
    return { shape: m.shape, colors: m.colors };
  }
  function pngOf(d) {
    if (cache[d.id]) return cache[d.id];
    const m = build(d);
    if (!m) return '';
    let url = '';
    try { url = MQ.monsterGen.png(m.shape, m.colors); } catch (e) { url = ''; }
    cache[d.id] = url;
    return url;
  }
  function entry(d) { return { id: d.id, name: d.name, group: d.group, kind: d.kind, png: pngOf(d) }; }
  function list(groupId) { return DEF.filter(function (d) { return !groupId || d.group === groupId; }).map(entry); }
  function get(id) { const d = DEF.filter(function (x) { return x.id === id; })[0]; return d ? entry(d) : null; }
  return { GROUPS: GROUPS, DEF: DEF, list: list, get: get, build: build };
})();
