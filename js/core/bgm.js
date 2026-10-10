/* ---------------------------------------------------------
   おんがく（ころたま v0.1.15）
   ユーザー決定 2026-10-10（壁打ち）：案B＝おうち・たまご・できた！ だけ やさしい オルゴール、
   もんだいの 画面は 音楽なしで 小鳥と 風の 環境音を ほんの 少し。声の あいだは 小さく する（duck）。
   音のファイルは 使わず、その場で 作る（まなびモンスターと 同じ 考え方。曲と 音色は この アプリ 専用）。
     play(name)        … 'home'（オルゴールの ワルツ・くり返す）／'done'（できた！の ジングル → おうちの 曲を 小さく）／'field'（環境音）／null＝止める
     forScreen(id)     … 画面の id から 曲を えらぶ（common.js の show() が よぶ）
     duck(on)          … 声の あいだ 小さく（MQ.ui.speak が よぶ）
     setEnabled(on)    … 設定「おんがく」
     wake()            … さいしょの タップで ひらく（iPad は touchend・click でしか ひらかない）
   オルゴールの 音＝基音＋3倍と 5.4倍の うすい 部分音（オルゴールの つめの ひびき）・はやい 立ち上がり・ゆっくり 消える。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.bgm = (function () {
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function freq(n) {   // 'c5' 'f#4' 'bb3'
    const m = /^([a-g])([#b]?)(\d)$/.exec(n);
    if (!m) return 0;
    let s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (s - 9) / 12 + (Number(m[3]) - 4));
  }
  /* 楽ふ：空白で 区切った 音。'e5' は 1はく、'e5/2' は 2はく、'-' は 休み、'-/2' は 2はく 休み */
  function parse(str) {
    const out = [];
    let t = 0;
    String(str).trim().split(/\s+/).forEach(function (tok) {
      const p = tok.split('/');
      const d = p[1] ? Number(p[1]) : 1;
      if (p[0] !== '-') out.push({ n: p[0], t: t, d: d });
      t += d;
    });
    return { notes: out, len: t };
  }
  /* ---- 曲 ---- */
  // おうち：オルゴールの ワルツ（3はく・ゆったり）。右手＝うた・左手＝分散和音。16小節で くり返す
  const HOME_R = 'e5/2 g5  d5/2 b4  c5 e5 a5  g5/3  e5/2 g5  d5/2 g5  f5 e5 d5  c5/3 ' +
                 'a5/2 g5  f5/2 a5  g5 e5 c5  d5/3  f5 a5 c6  g5/2 e5  d5 b4 d5  c5/3';
  const HOME_L = 'c4 g4 e4  g3 d4 b3  a3 e4 c4  f3 c4 a3  c4 g4 e4  g3 d4 b3  f3 c4 a3  c4 g4 e4 ' +
                 'a3 e4 c4  f3 c4 a3  c4 g4 e4  g3 d4 b3  f3 c4 a3  c4 g4 e4  g3 d4 f4  c4 e4 g4';
  // できた！：あかるい ジングル（4はく）を 1回 → おうちの 曲を 小さく
  const DONE_R = 'c5/.5 e5/.5 g5/.5 c6/.5 e6/1.5 d6/.5  c6/.5 d6/.5 e6/.5 g6/.5 e6/2';
  const DONE_L = 'c4/2 g4/2  f4/2 c4/2';
  // G（v0.2）：おたんじょうびの うた（Happy Birthday to You・作者の 権利は 切れて いる）を 1回 → おうちの 曲
  const BDAY_R = 'g5/.75 g5/.25 a5 g5  c6 b5/2  g5/.75 g5/.25 a5 g5  d6 c6/2  g5/.75 g5/.25 g6 e6  c6 b5 a5  f6/.75 f6/.25 e6 c6  d6 c6/2';
  const BDAY_L = 'c4/3  g3/3  g3/3  c4/3  c4/3  f3/3  c4/1.5 g3/1.5  c4/3';
  // E（v0.2）：おやすみの おはなしの こもりうた（ブラームスの 子守歌ふう・ゆっくり 3はく）
  const NIGHT_R = 'e5/.5 e5/.5 g5/2  e5/.5 e5/.5 g5/2  e5/.5 g5/.5 c6 b5  a5/2 g5  d5/.5 e5/.5 f5 d5  d5/.5 e5/.5 f5/2  d5/.5 f5/.5 b5/.5 a5/.5 g5  b5 c6/2';
  const NIGHT_L = 'c4/3  c4/3  e4/3  f3/3  g3/3  g3/3  g3/3  c4/3';
  const SONGS = {
    birthday: { bpm: 100, vol: 1.0, intro: [BDAY_R, BDAY_L], then: 'home', thenVol: 0.55, thenBpm: 84 },
    night: { bpm: 66, vol: 0.8, loop: [NIGHT_R, NIGHT_L] },
    home: { bpm: 84, vol: 1.0, loop: [HOME_R, HOME_L] },
    done: { bpm: 104, vol: 1.0, intro: [DONE_R, DONE_L], then: 'home', thenVol: 0.55, thenBpm: 84 }
  };

  let ctx = null, master = null, duckG = null, verb = null, dry = null;
  let enabled = true, playing = null, desired = null, timer = null, ducked = false;
  let seq = null;        // いま 鳴らして いる 曲の 進み：{ song, voices:[{notes,len,i}], bar0(秒), beat(秒), loopLen }
  let amb = null;        // 環境音の 部品
  const LOOK = 0.6;      // 先読み（秒）

  function context() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain(); master.gain.value = 0.9;
    duckG = ctx.createGain(); duckG.gain.value = 1;
    dry = ctx.createGain(); dry.gain.value = 0.8;
    verb = ctx.createConvolver(); verb.buffer = MQ.sfx.impulse(ctx, 1.8, 3.0);
    const wet = ctx.createGain(); wet.gain.value = 0.42;
    const bd = MQ.sfx.body(ctx);   // 木の 箱の ひびき（楽器と 出口は sfx.js と 共通）
    master.connect(bd.input); bd.output.connect(dry).connect(duckG);
    bd.output.connect(verb).connect(wet).connect(duckG);
    duckG.connect(ctx.destination);
    return ctx;
  }
  /* オルゴールの 1音（楽器は sfx.js の inst・音色は timbre） */
  let timbre = null;   // null＝sfx と 同じ
  function tine(f, t, vel, dur) { MQ.sfx.inst(ctx, master, f, t, vel * (0.9 + Math.random() * 0.2), dur, timbre || undefined); }
  function stopSeq() { seq = null; }
  function startSeq(name, t0) {
    const s = SONGS[name];
    if (!s) return;
    const beat = 60 / s.bpm;
    const vs = (s.intro || s.loop).map(parse);
    seq = { name: name, song: s, voices: vs, phase: s.intro ? 'intro' : 'loop', bar0: t0, beat: beat, len: Math.max.apply(null, vs.map(function (v) { return v.len; })), vol: s.vol, idx: vs.map(function () { return 0; }) };
  }
  function tick() {
    if (!ctx || !seq) return;
    const now = ctx.currentTime;
    while (seq) {
      const s = seq;
      let any = false;
      s.voices.forEach(function (v, vi) {
        while (s.idx[vi] < v.notes.length) {
          const n = v.notes[s.idx[vi]];
          const t = s.bar0 + n.t * s.beat;
          if (t > now + LOOK) { any = true; break; }
          s.idx[vi]++;
          const f = freq(n.n);
          if (f) {
            const high = f > 500;
            tine(f, Math.max(t, now + 0.01), (vi === 0 ? 0.22 : 0.11) * s.vol, high ? 2.0 : 2.8);
          }
        }
        if (s.idx[vi] < v.notes.length) any = true;
      });
      if (any) break;
      // この まとまりが おわった → つぎへ
      const end = s.bar0 + s.len * s.beat;
      if (end > now + LOOK) break;
      if (s.phase === 'intro') {
        const nx = SONGS[s.song.then];
        const beat = 60 / (s.song.thenBpm || nx.bpm);
        const vs = nx.loop.map(parse);
        seq = { name: s.name, song: nx, voices: vs, phase: 'loop', bar0: end + beat, beat: beat, len: Math.max.apply(null, vs.map(function (v) { return v.len; })), vol: s.song.thenVol || nx.vol, idx: vs.map(function () { return 0; }) };
      } else {
        s.bar0 = end; s.idx = s.voices.map(function () { return 0; });
      }
    }
  }
  /* ---- 環境音：風と 小鳥（もんだいの 画面） ---- */
  function startAmb(t0) {
    const c = ctx;
    const g = c.createGain(); g.gain.value = 0;
    g.gain.setTargetAtTime(1, t0, 0.8);
    // 風：ノイズを ひくく しぼって、ゆっくり ゆらす
    const n = Math.floor(c.sampleRate * 2), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.4;
    const wg = c.createGain(); wg.gain.value = 0.05;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.025;
    lfo.connect(lg).connect(wg.gain);
    src.connect(lp).connect(wg).connect(g);
    g.connect(duckG);
    src.start(t0); lfo.start(t0);
    amb = { g: g, src: src, lfo: lfo, next: t0 + 2 + Math.random() * 4 };
  }
  function chirp(t) {   // 小鳥：みじかい 上がる 音を 2〜3回
    const c = ctx, k = 2 + Math.floor(Math.random() * 2), base = 2600 + Math.random() * 900;
    for (let i = 0; i < k; i++) {
      const o = c.createOscillator(), g = c.createGain(), tt = t + i * 0.16;
      o.type = 'sine';
      o.frequency.setValueAtTime(base, tt); o.frequency.exponentialRampToValueAtTime(base * 1.35, tt + 0.07); o.frequency.exponentialRampToValueAtTime(base * 1.1, tt + 0.11);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.06, tt + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.12);
      o.connect(g).connect(amb.g);
      o.start(tt); o.stop(tt + 0.14);
      o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) { /* なし */ } };
    }
  }
  function ambTick() {
    if (!amb || !ctx) return;
    const now = ctx.currentTime;
    if (amb.next < now + LOOK) { chirp(Math.max(amb.next, now + 0.02)); amb.next += 5 + Math.random() * 7; }
  }
  function stopAmb() {
    if (!amb) return;
    const a = amb; amb = null;
    try { a.g.gain.setTargetAtTime(0, ctx.currentTime, 0.4); a.src.stop(ctx.currentTime + 2); a.lfo.stop(ctx.currentTime + 2); } catch (e) { /* なし */ }
  }
  /* ---- 外から ---- */
  function fadeOutSeq() {
    // いま 鳴って いる 音は そのまま 消えて いく（オルゴールは 余韻だけ）ので 予約を 止めるだけ
    stopSeq();
  }
  function play(name) {
    desired = name || null;
    if (!enabled) return;
    const c = context();
    if (!c) return;
    if (c.state !== 'running') { try { c.resume(); } catch (e) { /* なし */ } }
    if (playing === name) return;
    fadeOutSeq(); stopAmb();
    playing = name;
    if (!name) return;
    const t0 = c.currentTime + 0.12;
    if (name === 'field') startAmb(t0);
    else startSeq(name, t0);
    if (!timer) timer = setInterval(function () { tick(); ambTick(); }, 200);
    tick(); ambTick();
  }
  function stop() { desired = null; playing = null; fadeOutSeq(); stopAmb(); }
  const SCREEN = { 'screen-home': 'home', 'screen-egg': 'home', 'screen-start': 'home', 'screen-setup': null, 'screen-draw': null, 'screen-parent': null, 'screen-done': 'done',
                   'screen-care': 'field', 'screen-shop': 'field', 'screen-play': 'field', 'screen-kurabe': 'field', 'screen-moji': 'field', 'screen-tokei': 'field',
                   'screen-kaku': 'home', 'screen-sagasu': 'field', 'screen-maneko': null, 'screen-help': 'home', 'screen-story': 'night', 'screen-album': null, 'screen-print': null };
  function forScreen(id) { if (id in SCREEN) { if (SCREEN[id]) play(SCREEN[id]); else stop(); } }
  function duck(on) {
    ducked = !!on;
    if (!ctx || !duckG) return;
    duckG.gain.cancelScheduledValues(ctx.currentTime);
    duckG.gain.setTargetAtTime(on ? 0.3 : 1, ctx.currentTime, on ? 0.08 : 0.35);
  }
  function setEnabled(on) {
    enabled = !!on;
    if (!enabled) { const d = desired; stop(); desired = d; }
    else if (desired) play(desired);
  }
  // アプリが かくれた（ほかの アプリ・画面を けした）ときは 止めて、もどったら wake() で つづきを（2026-10-10：うらで 鳴りつづけて いた）
  function pause() { const d = desired; stop(); desired = d; }
  function wake() {
    if (!enabled || !ctx) return;
    if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) { /* なし */ } }
    if (desired && playing !== desired) play(desired);
  }
  /* smoke 用：楽ふが 読めるか・音の 高さが オルゴールの はんいか */
  function validate() {
    const bad = [];
    Object.keys(SONGS).forEach(function (k) {
      const s = SONGS[k];
      (s.loop || []).concat(s.intro || []).forEach(function (v, i) {
        parse(v).notes.forEach(function (n) { const f = freq(n.n); if (!f || f < 150 || f > 2200) bad.push(k + ':' + n.n); });
      });
      if (s.loop) { const ls = s.loop.map(function (v) { return parse(v).len; }); if (ls.some(function (l) { return l !== ls[0]; })) bad.push(k + ' loop len ' + ls.join('/')); }
      if (s.intro) { const ls = s.intro.map(function (v) { return parse(v).len; }); if (ls.some(function (l) { return l !== ls[0]; })) bad.push(k + ' intro len ' + ls.join('/')); if (!SONGS[s.then]) bad.push(k + ' then'); }
    });
    return bad;
  }
  function setTimbre(k) { timbre = k || null; }
  return { setTimbre: setTimbre, play: play, stop: stop, forScreen: forScreen, duck: duck, setEnabled: setEnabled, isEnabled: function () { return enabled; }, wake: wake, pause: pause, validate: validate, SONGS: SONGS, SCREEN: SCREEN, freq: freq, parse: parse,
           current: function () { return playing; }, desired: function () { return desired; }, isDucked: function () { return ducked; },
           setIntensity: function () { /* ころたまには ない（まなびモンスターの 道具と 形を そろえる） */ }, setEnrage: function () { /* 同上 */ } };
})();
