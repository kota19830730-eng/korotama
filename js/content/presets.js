/* ---------------------------------------------------------
   さいしょから いる キャラクター（まなびたまご）
   絵を かかなくても えらべる「かわいい」8体 と「かっこいい」8体。
   絵は js/content/charart.js の 絵本ふうの SVG（ブロックの モンスターでは ない＝ユーザー決定 2026-10-09「世界観に 合わせた キャラクターに」）。
     MQ.presets.GROUPS                 … [{ id, name }]
     MQ.presets.list(groupId)          … [{ id, name, group, png, png2, png3 }]（png は SVG の data URL。png2／png3＝成長の 姿＝charart の grade 2・3）
     MQ.presets.get(id)
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.presets = (function () {
  const GROUPS = [{ id: 'cute', name: 'かわいい' }, { id: 'cool', name: 'かっこいい' }];
  const DEF = [
    { id: 'rabbit', group: 'cute', name: 'うさぴょん' },
    { id: 'cat', group: 'cute', name: 'にゃんこ' },
    { id: 'chick', group: 'cute', name: 'ぴよちゃん' },
    { id: 'penguin', group: 'cute', name: 'ぺんた' },
    { id: 'bear', group: 'cute', name: 'くまごろう' },
    { id: 'pig', group: 'cute', name: 'ぶうた' },
    { id: 'sheep', group: 'cute', name: 'もこもこ' },
    { id: 'frog', group: 'cute', name: 'けろりん' },
    { id: 'dragon', group: 'cool', name: 'ドラゴ' },
    { id: 'robot', group: 'cool', name: 'ロボくん' },
    { id: 'lion', group: 'cool', name: 'ライオ' },
    { id: 'shark', group: 'cool', name: 'シャーク' },
    { id: 'wolf', group: 'cool', name: 'ウルフ' },
    { id: 'knight', group: 'cool', name: 'ナイト' },
    { id: 'ninja', group: 'cool', name: 'にんにん' },
    { id: 'rocket', group: 'cool', name: 'ロケッタ' }
  ];
  function entry(d) { const c = MQ.charart; return { id: d.id, name: d.name, group: d.group, png: c ? c.url(d.id) : '', png2: c ? c.url(d.id, 2) : '', png3: c ? c.url(d.id, 3) : '' }; }
  function list(groupId) { return DEF.filter(function (d) { return !groupId || d.group === groupId; }).map(entry); }
  function get(id) { const d = DEF.filter(function (x) { return x.id === id; })[0]; return d ? entry(d) : null; }
  return { GROUPS: GROUPS, DEF: DEF, list: list, get: get };
})();
