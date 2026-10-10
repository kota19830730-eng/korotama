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
    return { v: 1, kid: null, settings: { voice: true, pitch: 'normal', rate: 'slow', voiceKind: 'zunda', hint: true, sound: true, music: true, nudge: true, timeLimit: 0 } };   // v0.3：nudge＝まよった ときの 手助け／timeLimit＝遊ぶ 時間の めやす（分・0＝なし）
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
    /* v0.2 ワクワクの しかけ（2026-10-10） */
    ['draw', 'find', 'mane', 'help', 'story'].forEach(function (x) { if (k.done[x] == null) k.done[x] = 0; });
    if (!k.log || typeof k.log !== 'object') k.log = {};           // { 日づけ: [ { k: しゅるい, t: 時こく } ] }（E おはなし・H アルバム）
    if (!k.grewAt || typeof k.grewAt !== 'object') k.grewAt = {};  // { 2: 時こく, 3: 時こく }（H）
    if (!k.items || typeof k.items !== 'object') k.items = {};    // A：{ foods:[{png,at}], hat:{png,at}, friend:{png,at}, garden:[{png,at,x}] }
    if (!Array.isArray(k.items.foods)) k.items.foods = [];
    if (!Array.isArray(k.items.garden)) k.items.garden = [];
    if (k.items.hat === undefined) k.items.hat = null;
    if (k.items.hatOn === undefined) k.items.hatOn = true;
    if (k.items.friend === undefined) k.items.friend = null;
    if (!Array.isArray(k.finds)) k.finds = [];                     // C：[{ png, what, at }]（12まで）
    if (!k.help || typeof k.help !== 'object') k.help = {};        // D：{ 日づけ: おてつだいの id }
    if (!Array.isArray(k.chores)) k.chores = null;                 // D：おうちの人が えらんだ おてつだい（null＝はじめの 6つ）
    if (k.birthday == null) k.birthday = '';                       // G：'MM-DD'
    return k;
  }
  // 入らなかった とき（端末の 保存の 空きが ない）は false。おうちの人に 1回だけ しらせる（2026-10-10：だまって 記録が きえて いた）
  let warned = false;
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) {
      if (!warned && typeof window !== 'undefined' && window.MQ && MQ.ui && MQ.ui.toast) { warned = true; try { MQ.ui.toast('保存できませんでした。端末の空き容量が足りないかもしれません。おうちの人の画面で録音した声を消すと、空きが増えます', 6000); } catch (e2) { /* なし */ } }
      return false;
    }
  }
  function kid() { return load().kid; }
  function settings() { return load().settings; }
  function setSetting(k, v) { load().settings[k] = v; write(); }
  function update(fn) { fn(load()); write(); }

  function newKid(opts) {
    load();
    data.kid = ensureKid({ name: (opts && opts.name) || '', stage: (opts && opts.stage) || 's', mon: null, stamps: {}, done: { count: 0, color: 0, shape: 0, compare: 0, moji: 0, tokei: 0, draw: 0, find: 0, mane: 0, help: 0, story: 0 }, created: Date.now() });
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
    if (kind) logEvent(kind, now);
    write();
    return data.kid.stamps[k];
  }
  /* その日に した こと（E・H）。1日 40まで */
  function logEvent(kind, now) {
    const k = data && data.kid; if (!k) return;
    const d = today(now);
    const list = k.log[d] || (k.log[d] = []);
    if (list.length < 40) list.push({ k: kind, t: now || Date.now() });
    const days = Object.keys(k.log).sort();
    while (days.length > 400) delete k.log[days.shift()];
  }
  function note(kind, now) { load(); logEvent(kind, now); if (data.kid && data.kid.done[kind] != null) data.kid.done[kind]++; write(); }
  function dayLog(now) { const k = kid(); return k ? (k.log[today(now)] || []) : []; }
  function helpCount() { const k = kid(); return k ? Object.keys(k.help || {}).length : 0; }
  function stampsToday(now) { const k = kid(); return k ? (k.stamps[today(now)] || 0) : 0; }
  function stampsTotal() { const k = kid(); if (!k) return 0; return Object.keys(k.stamps).reduce(function (a, d) { return a + (k.stamps[d] || 0); }, 0); }
  // いまの すがた（1〜3）
  function growth() {
    const t = stampsTotal() + helpCount();   // おてつだい（D）も 1つ 1こ ぶん
    return t >= GROW_AT[2] ? 3 : t >= GROW_AT[1] ? 2 : 1;
  }
  function nextGrowAt() { const g = growth(); return g >= 3 ? null : GROW_AT[g]; }
  function growPoints() { return stampsTotal() + helpCount(); }
  function markGrew(g, now) { update(function (d) { if (d.kid && !d.kid.grewAt[g]) d.kid.grewAt[g] = now || Date.now(); }); }
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
           today: today, stamp: stamp, note: note, dayLog: dayLog, helpCount: helpCount, growPoints: growPoints, markGrew: markGrew, stampsToday: stampsToday, stampsTotal: stampsTotal, growth: growth, nextGrowAt: nextGrowAt, monPng: monPng, reset: reset,
           exportText: exportText, importText: importText, _set: function (d) { data = d; } };
})();
