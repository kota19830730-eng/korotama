/* ---------------------------------------------------------
   効果音（ころたま v0.1.15）
   音のファイルは 使わず、その場で 作る。はじめの タップで unlock()。
   v0.1.15（ユーザー決定 2026-10-10）：まなびモンスターの ピコピコ音（四角い 波）から、
   絵本の 世界に 合う やわらかい 音（木琴・鈴・オルゴール）に 作り直した。
     tap      … 木の 音「コッ」（木琴）
     correct  … 鈴の 3音（ド・ミ・ソ）
     coin     … 鈴 2つ（チリン）
     clear    … オルゴールの ファンファーレ（できた！）
     rare     … きらきら（上がる 鈴）
     shutter  … カメラ
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.sfx = (function () {
  let ctx = null;
  let enabled = true;

  function context() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(function () {});
    return ctx;
  }
  function env(g, t, vol, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function osc(freq, t, vol, dur, type, slideTo, attack) {
    const c = ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env(g, t, vol, attack || 0.005, dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
    o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) { /* なし */ } };
  }

  /* ---- 楽器（オルゴール）。bgm.js も これを 借りる（v0.1.15 ユーザー「ファミコンみたいで 安っぽい」→ 正弦波だけ から 作り直し）
     kind：'fm'＝オルゴール（FM・ガラスの ような きらめき）／'kalimba'＝カリンバ（あたたかい・丸い）／'tine'＝オルゴールの つめ（にごりの ある 部分音を 2本ずつ ずらして 重ねる）
     どれも「ピンを はじく チッ」と「上の オクターブの きらめき」を 足す。出口は body()（木の 箱の ひびき・高すぎる 音を 落とす） */
  const TIMBRE = { kind: 'kalimba' };   // ユーザー決定 2026-10-10「Bで」＝カリンバ（あたたかい・丸い）
  function inst(c, dest, f, t, vel, dur, kind) {
    kind = kind || TIMBRE.kind;
    const out = c.createGain(); out.connect(dest);
    const nodes = [];
    function env(g, peak, a, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d); }
    function go(o, end) { o.start(t); o.stop(t + end + 0.05); nodes.push(o); }
    if (kind === 'tine') {
      [[1, 1.0, 1], [2.76, 0.32, 0.5], [5.40, 0.13, 0.28], [8.93, 0.05, 0.16]].forEach(function (p) {
        [-5, 5].forEach(function (cents) {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'sine'; o.frequency.value = f * p[0]; o.detune.value = cents;
          env(g, vel * p[1] * 0.5, 0.003, dur * p[2]);
          o.connect(g).connect(out); go(o, dur * p[2]);
        });
      });
    } else {
      const ratio = kind === 'kalimba' ? 2.0 : 3.5, idx0 = kind === 'kalimba' ? 1.1 : 2.0, idxT = kind === 'kalimba' ? 0.16 : 0.4;
      const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), cg = c.createGain();
      car.type = 'sine'; mod.type = 'sine';
      car.frequency.value = f; mod.frequency.value = f * ratio;
      mg.gain.setValueAtTime(f * idx0, t); mg.gain.exponentialRampToValueAtTime(f * 0.02, t + idxT);
      mod.connect(mg).connect(car.frequency);
      env(cg, vel, 0.004, dur);
      car.connect(cg).connect(out); go(mod, dur); go(car, dur);
      const sp = c.createOscillator(), sg = c.createGain();
      sp.type = 'sine'; sp.frequency.value = f * 2; sp.detune.value = 7;
      env(sg, vel * (kind === 'kalimba' ? 0.08 : 0.16), 0.003, dur * 0.5);
      sp.connect(sg).connect(out); go(sp, dur * 0.5);
    }
    // ピンを はじく「チッ」
    const n = Math.floor(c.sampleRate * 0.008), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
    s.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = kind === 'kalimba' ? 2200 : 4800; bp.Q.value = 1.2; ng.gain.value = vel * (kind === 'kalimba' ? 0.5 : 0.3);
    s.connect(bp).connect(ng).connect(out); s.start(t);
    nodes[nodes.length - 1].onended = function () { try { out.disconnect(); } catch (e) { /* なし */ } };
  }
  /* 木の 箱の ひびき：低めを 少し 持ち上げ、きつい 高音を 落とす */
  function body(c) {
    const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 320; pk.Q.value = 1.1; pk.gain.value = 3.5;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500; lp.Q.value = 0.5;
    pk.connect(lp);
    return { input: pk, output: lp };
  }
  /* 部屋の ひびき（ノイズを 減らして 作る・しっぽは こもらせる） */
  function impulse(c, sec, decay) {
    const n = Math.floor(c.sampleRate * sec), buf = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let y = 0; for (let i = 0; i < n; i++) { const x = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); y += 0.28 * (x - y); d[i] = y; } }
    return buf;
  }

  let chain = null;   // 効果音の 出口（body → dry＋ひびき → destination）
  function dest() {
    const c = context();
    if (!c) return null;
    if (!chain) {
      const b = body(c), dry = c.createGain(), verb = c.createConvolver(), wet = c.createGain();
      dry.gain.value = 0.85; wet.gain.value = 0.3; verb.buffer = impulse(c, 1.4, 2.8);
      b.output.connect(dry).connect(c.destination); b.output.connect(verb).connect(wet).connect(c.destination);
      chain = b.input;
    }
    return chain;
  }
  function bell(freq, delay, vol, dur, kind) {
    const c = context();
    if (!c || !enabled) return;
    inst(c, dest(), freq, c.currentTime + (delay || 0), vol, dur, kind);
  }
  /* タップ：カリンバの みじかい 一音（1回の あそびで 何十回も 鳴る ので 軽く・みじかく） */
  function wood(freq, delay, vol) {
    const c = context();
    if (!c || !enabled) return;
    inst(c, dest(), freq, c.currentTime + (delay || 0), vol, 0.35, 'kalimba');
  }
  function noise(dur, vol, delay, hz) {
    const c = context();
    if (!c || !enabled) return;
    const t = c.currentTime + (delay || 0);
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = hz || 3000; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }

  return {
    unlock:     function () { context(); },
    inst: inst, body: body, impulse: impulse, setTimbre: function (k) { TIMBRE.kind = k; }, timbre: function () { return TIMBRE.kind; },
    setEnabled: function (on) { enabled = !!on; },
    isEnabled:  function () { return enabled; },

    tap:     function () { wood(1047, 0, 0.14); },
    correct: function () { [523, 659, 784].forEach(function (f, i) { bell(f * 2, i * 0.09, 0.2, 1.1); }); },
    coin:    function () { bell(2093, 0, 0.14, 0.5); bell(2637, 0.07, 0.14, 0.8); },
    clear:   function () {
      [523, 659, 784, 1047].forEach(function (f, i) { bell(f * 2, i * 0.11, 0.2, i === 3 ? 1.6 : 0.8); });
      [659, 784, 1047].forEach(function (f, i) { bell(f * 2, 0.5 + i * 0.07, 0.12, 1.2); });
      bell(2637, 0.75, 0.16, 1.8);
    },
    rare:    function () { [784, 988, 1175, 1568, 1976, 2349].forEach(function (f, i) { bell(f * 1.5, i * 0.06, 0.12, 0.9); }); },
    shutter: function () { noise(0.05, 0.25, 0, 4000); wood(1568, 0.04, 0.1); },
    /* ---- タップの 反応の 音（v0.1.16・ユーザー決定「背景にも 音」）。どれも カリンバの 音色の まま 小さく・みじかく ---- */
    sun:     function () { [1047, 1319, 1568].forEach(function (f, i) { bell(f, i * 0.1, 0.1, 0.9); }); },                   // おひさま：上がる 3音
    moon:    function () { bell(1568, 0, 0.08, 1.2); bell(2093, 0.12, 0.06, 1.4); },                                           // おつきさま：すんだ 2音
    rain:    function () { for (let i = 0; i < 7; i++) noise(0.04, 0.05, i * 0.11 + Math.random() * 0.04, 5000); },           // あめ：ぱらぱら
    rainbow: function () { [1047, 1175, 1319, 1568, 1760, 2093, 2349].forEach(function (f, i) { bell(f, 0.1 + i * 0.07, 0.09, 1.0); }); },   // にじ：7色の 上がる 音
    rustle:  function () { noise(0.18, 0.06, 0, 2600); noise(0.14, 0.05, 0.22, 3200); },                                      // 木：さらさら
    bird:    function () {                                                                                                     // ことり：みじかい 上がる 音 2〜3回
      const c = context(); if (!c || !enabled) return;
      const k = 2 + Math.floor(Math.random() * 2), base = 2400 + Math.random() * 800, t0 = c.currentTime + 0.05;
      for (let i = 0; i < k; i++) { const t = t0 + i * 0.15; osc(base, t, 0.05, 0.12, 'sine', base * 1.3, 0.01); }
    },
    knock:   function () { wood(330, 0, 0.12); wood(330, 0.16, 0.12); },                                                       // いえ：とんとん
    door:    function () { wood(262, 0, 0.1); bell(1319, 0.2, 0.07, 0.6); },                                                   // ドア：きい
    pop:     function () { bell(1760, 0, 0.09, 0.5); },                                                                        // おはな：ぽん
    flutter: function () { bell(2093, 0, 0.05, 0.3); bell(2349, 0.09, 0.05, 0.3); bell(2093, 0.18, 0.04, 0.3); },             // ちょうちょ
    shoot:   function () { [2349, 2093, 1760, 1568, 1319].forEach(function (f, i) { bell(f, i * 0.06, 0.08, 0.8); }); },      // ながれぼし：下がる 音
    heart:   function () { bell(1319, 0, 0.08, 0.9); bell(1568, 0.14, 0.08, 1.0); },                                           // なでなで
    tickle:  function () { [1568, 1760, 1568, 1976, 1760].forEach(function (f, i) { wood(f, i * 0.07, 0.07); }); },           // くすぐったい
    jump:    function () { bell(784, 0, 0.09, 0.4); bell(1568, 0.12, 0.1, 0.7); },                                             // ぴょん
    spin:    function () { [1047, 1319, 1568, 2093].forEach(function (f, i) { wood(f, i * 0.09, 0.07); }); },                  // くるりん
    yawn:    function () { const c = context(); if (!c || !enabled) return; osc(440, c.currentTime, 0.04, 0.9, 'sine', 330, 0.3); },   // あくび：ふわぁ
    snore:   function () { const c = context(); if (!c || !enabled) return; osc(196, c.currentTime, 0.05, 0.7, 'sine', 165, 0.3); },   // すやすや
    wake:    function () { bell(1047, 0, 0.08, 0.3); bell(1568, 0.08, 0.1, 0.6); },                                            // おきた
    /* まなびモンスターの 名前も のこして おく（よばれても 落ちない） */
    key: function () { wood(1200, 0, 0.1); }, appear: function () { bell(1047, 0, 0.1, 0.6); }, hit: function () { wood(440, 0, 0.14); }
  };
})();
