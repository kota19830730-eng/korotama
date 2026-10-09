/* ---------------------------------------------------------
   きろく（ころたま）
   localStorage に 1つだけ。外には 何も 送らない。
     kid       … { name, stage('s'|'m'|'l'|'k'), mon, stamps{日づけ: 数}, done{count,color,shape,compare,moji,tokei}, created }
     kid.mon   … まなびモンスターの「じぶんの モンスター」と 同じ 形
                 { id:'my-…', name, png, png2, png3, trace:true, area:'sansu' } → そのまま つれていける
     settings  … { voice, pitch('normal'|'high'), rate('slow'|'normal'), voiceKind('zunda'|'device'), hint, sound, music }
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.save = (function () {
  const KEY = 'manabi-tamago-save-v1';   // 名前は「ころたま」に なったが キーは そのまま（変えると 記録が 消える）
  const STAGES = { s: 'ちいさい', m: 'なかくらい', l: 'おおきい', k: 'ねんちょう' };
  const GROW_AT = [0, 6, 15];          // スタンプの 合計で すがたが かわる（1→2 は 6こ・2→3 は 15こ）
  let data = null;

  function fresh() {
    return { v: 1, kid: null, settings: { voice: true, pitch: 'normal', rate: 'slow', voiceKind: 'zunda', hint: true, sound: true, music: true } };
  }
  function load() {
    if (data) return data;
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? JSON.parse(raw) : fresh();
    } catch (e) { data = fresh(); }
    if (!data || typeof data !== 'object') data = fresh();
    if (!data.settings) data.settings = fresh().settings;
    (function (def) { Object.keys(def).forEach(function (k) { if (data.settings[k] === undefined) data.settings[k] = def[k]; }); })(fresh().settings);   // 足りない 設定は はじめの 値（music は v0.1.15 から）
    if (data.kid) ensureKid(data.kid);
    return data;
  }
  function ensureKid(k) {
    if (!k.stage || !STAGES[k.stage]) k.stage = 's';
    if (!k.stamps || typeof k.stamps !== 'object') k.stamps = {};
    if (!k.done) k.done = { count: 0, color: 0, shape: 0 };
    if (k.done.compare == null) k.done.compare = 0;   // くらべっこ（v0.1.12）
    if (k.done.moji == null) k.done.moji = 0;         // もじ（v0.1.13）
    if (k.done.tokei == null) k.done.tokei = 0;       // とけい（v0.1.14）
    if (!k.name) k.name = '';
    return k;
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 入らなければ あきらめる */ }
  }
  function kid() { return load().kid; }
  function settings() { return load().settings; }
  function setSetting(k, v) { load().settings[k] = v; write(); }
  function update(fn) { fn(load()); write(); }

  function newKid(opts) {
    load();
    data.kid = ensureKid({ name: (opts && opts.name) || '', stage: (opts && opts.stage) || 's', mon: null, stamps: {}, done: { count: 0, color: 0, shape: 0, compare: 0, moji: 0, tokei: 0 }, created: Date.now() });
    write();
    return data.kid;
  }
  function setMon(mon) {
    load();
    if (!data.kid) newKid({});
    data.kid.mon = mon;
    write();
  }
  function today(now) {
    const d = new Date(now || Date.now());
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  // きょうの スタンプを 1つ ふやす（1日 さいだい 5こ）。かえり値：きょうの 数
  function stamp(kind, now) {
    load();
    if (!data.kid) return 0;
    const k = today(now);
    const n = (data.kid.stamps[k] || 0);
    if (n < 5) data.kid.stamps[k] = n + 1;
    if (kind && data.kid.done[kind] != null) data.kid.done[kind]++;
    write();
    return data.kid.stamps[k];
  }
  function stampsToday(now) { const k = kid(); return k ? (k.stamps[today(now)] || 0) : 0; }
  function stampsTotal() { const k = kid(); if (!k) return 0; return Object.keys(k.stamps).reduce(function (a, d) { return a + (k.stamps[d] || 0); }, 0); }
  // いまの すがた（1〜3）
  function growth() {
    const t = stampsTotal();
    return t >= GROW_AT[2] ? 3 : t >= GROW_AT[1] ? 2 : 1;
  }
  function nextGrowAt() { const g = growth(); return g >= 3 ? null : GROW_AT[g]; }
  function monPng() {
    const k = kid();
    if (!k || !k.mon) return '';
    const g = growth();
    return (g === 3 && k.mon.png3) || (g >= 2 && k.mon.png2) || k.mon.png;
  }
  function reset() { data = fresh(); write(); }
  function exportText() { return JSON.stringify(load()); }
  function importText(text) {
    const d = JSON.parse(text);
    if (!d || d.v !== 1 || !d.settings) throw new Error('bad');
    data = d; if (data.kid) ensureKid(data.kid); write(); return true;
  }

  return { KEY: KEY, STAGES: STAGES, GROW_AT: GROW_AT, load: load, kid: kid, settings: settings, setSetting: setSetting, update: update, newKid: newKid, setMon: setMon,
           today: today, stamp: stamp, stampsToday: stampsToday, stampsTotal: stampsTotal, growth: growth, nextGrowAt: nextGrowAt, monPng: monPng, reset: reset,
           exportText: exportText, importText: importText, _set: function (d) { data = d; } };
})();
