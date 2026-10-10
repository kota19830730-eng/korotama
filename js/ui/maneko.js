/* ---------------------------------------------------------
   ことばの まねっこ（ころたま v0.2・B の 子ども がわ）
   生きもの「『いちご』って いってみて！」（絵を 見せる）→ 大きな マイクを おして 言う（声の 大きさで 輪が ひろがる）→
   生きものが その 声を 高く して まねっこ（ぴょんと はねる）→ ほめる。3つで できた！
   はんていは しない（ばつなし）。マイクが つかえない 端末は「いっしょに いってみよう」で おうちの人が ○。
     MQ.ui.maneko.open()
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  let round = 0, w = null, used = [], els = {}, rec = null, busy = false, raf = 0, miss = 0, last = '';

  function picOf(p) {
    if (p.type === 'food') return MQ.ui.foodNode(p.id);
    const col = MQ.tasks.COLORS.filter(function (c) { return c.id === (p.color || 'red'); })[0] || MQ.tasks.COLORS[0];
    if (p.type === 'thing') return MQ.ui.thingNode(p.id, col);
    if (p.type === 'shape') return MQ.ui.shapeNode(p.id, col);
    return h('div', { class: 'mn__greet', html: GREET[p.id] || '' });
  }
  // あいさつの 絵（ありがとう＝ハート・こんにちは＝手を ふる・いただきます＝手を あわせる・おやすみ＝つき）
  const GREET = {
    thanks: '<svg viewBox="0 0 64 64"><path d="M32 54C18 44 8 36 8 24a11 11 0 0 1 24-6 11 11 0 0 1 24 6c0 12-10 20-24 30z" fill="#f08cb0"/></svg>',
    hello: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="#f2c94c"/><circle cx="24" cy="28" r="3" fill="#3a3330"/><circle cx="40" cy="28" r="3" fill="#3a3330"/><path d="M22 38q10 8 20 0" stroke="#3a3330" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M52 10l4-4M56 18h5M50 4V0" stroke="#e0493a" stroke-width="2.4" stroke-linecap="round"/></svg>',
    itadakimasu: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="50" rx="22" ry="6" fill="#d2765c"/><path d="M12 44h40a20 20 0 0 1-40 0z" fill="#fffdf7"/><path d="M20 38c4-6 20-6 24 0" fill="#fffdf7" stroke="#e3d6bd" stroke-width="2"/><path d="M22 14c2-4 6-4 6 0M34 14c2-4 6-4 6 0" stroke="#b98c45" stroke-width="2" fill="none"/></svg>',
    oyasumi: '<svg viewBox="0 0 64 64"><path d="M40 8a24 24 0 1 0 16 36A20 20 0 0 1 40 8z" fill="#f2c94c"/><path d="M48 14l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#f2b544"/></svg>'
  };

  function open() { close(); round = 0; used = []; next(); }
  // 画面を はなれる（おうちへ）：録音を 止めて、あとから とどく 録音の おわりは すてる（2026-10-10 バグ直し：おうちで 声が 流れて まねっこに 引きもどされて いた）
  let session = 0;
  function close() { session++; endLoop(); if (rec) { const r = rec; rec = null; try { r.stop(); } catch (e) { /* なし */ } } busy = false; }
  function here() { return MQ.ui.current === 'screen-maneko'; }
  function next() {
    w = MQ.mane.word(MQ.save.kid().stage, used);
    used.push(w.say);
    busy = false; miss = 0;
    render();
    setTimeout(function () { els.bl.say(w.line + ' マイクを おして、いってみてね。'); }, 250);
  }
  function render() {
    const mon = MQ.ui.monNode(130);
    mon.addEventListener('click', function () { if (busy) return; MQ.ui.quietTap(mon); });
    const bl = MQ.ui.balloon('');
    const ring = h('i', { class: 'mn__ring' });
    const mic = h('button', { class: 'mn__mic', type: 'button', 'aria-label': 'マイク', html: MQ.ui.SVG.mic }, []);
    mic.insertBefore(ring, mic.firstChild);
    mic.onclick = function () { if (busy) return; if (rec) stopRec(); else startRec(); };
    const say = h('button', { class: 'btn btn--wide mn__ok', type: 'button', text: 'マイクなしで：言えた！（おうちの人）' });
    MQ.ui.hold(say, 700, function () { if (busy || rec) return; praise('parent'); });
    els = { mon: mon, bl: bl, mic: mic, ring: ring };
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(w.line); } }),
      h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '28px', top: '40px' } }, [mon]),
        h('div', { class: 'mn__pic', style: { position: 'absolute', left: '226px', top: '44px' } }, [picOf(w.pic)])
      ]),
      h('div', { class: 'wrap col', style: { gap: '12px', paddingTop: '6px', alignItems: 'center' } }, [
        bl,
        mic,
        h('div', { class: 'dots3' }, [0, 1, 2].map(function (i) { return h('i', { class: i < round ? 'is-on' : '' }); })),
        say,
        MQ.ui.hintBox('マイクを押して言うと、言い終わったところで自動で止まり、生きものが高い声でまねします（声は保存しません）。声が聞こえなかったときはほめずに、もう一度さそいます。マイクが使えないときは、言えたら下のボタンを長押ししてください')
      ])
    ]);
    MQ.ui.mount('screen-maneko', page);
    MQ.ui.show('screen-maneko');
  }
  function startRec() {
    MQ.ui.stopSpeak(); MQ.sfx.tap();
    if (!MQ.family.micOk()) { els.bl.say('マイクが つかえないみたい。いっしょに いってみよう！ ' + w.say + '！'); return; }
    els.mic.classList.add('is-rec');
    els.mon.mood('tilt', 3000);
    MQ.sfx.pop();   // 「どうぞ」の あいず
    const my = session;
    rec = MQ.family.record({
      max: 6000, autoStop: true, waitMs: 4500, silenceMs: 800,   // 言いおわったら 自動で 止まる（もう一度 おさなくて いい）
      onStart: function () { loop(); },
      onDone: function (r) {
        if (my !== session || !here()) return;
        endLoop(); rec = null; els.mic.classList.remove('is-rec');
        const j = MQ.mane.judge(r.vad, w.say);
        last = j;
        if (j === 'none') { heard(); return; }
        echo(r.blob, r.vad, j);
      },
      onError: function () { if (my !== session) return; endLoop(); rec = null; els.mic.classList.remove('is-rec'); els.bl.say('マイクが つかえないみたい。いっしょに いってみよう！ ' + w.say + '！'); }
    });
  }
  function stopRec() { if (rec) rec.stop(); }
  function loop() {
    const r = rec; if (!r) return;
    const lv = r.level();
    els.ring.style.transform = 'scale(' + (1 + lv * 0.8).toFixed(2) + ')';
    raf = requestAnimationFrame(loop);
  }
  function endLoop() { cancelAnimationFrame(raf); if (els.ring) els.ring.style.transform = ''; }
  // 何も きこえなかった：ほめない・まねっこ しない。もう一度（2回めからは いっしょに 言う お手本つき）
  function heard() {
    miss++;
    els.mon.mood('tilt', 1200);
    els.bl.say(miss === 1 ? MQ.mane.MSG.none1 : MQ.mane.MSG.none2 + ' ' + w.say + '！');
  }
  function echo(blob, vad, j) {
    busy = true;
    // 声の ところだけ 鳴らす（前後の しずかな ところを 切る＝すぐ まねっこが はじまる）
    const cut = vad && vad.measured && vad.start >= 0 ? { from: Math.max(0, vad.start - 120) / 1000, to: (vad.end + 260) / 1000 } : {};
    els.bl.say('まねっこ するよ！', function () {
      els.mon.mood('jump', 1400);
      MQ.family.playBlob(blob, { rate: 1.35, from: cut.from, to: cut.to, onend: function () { if (here()) praise(j); } });
    });
  }
  // j：good・parent＝しっかり ほめる／quiet・short＝「いえたね」＋つぎの めあて／unknown（はかれない 端末）＝まねっこ できたよ
  function praise(j) {
    busy = true;
    const strong = j === 'good' || j === 'parent';
    MQ.sfx.correct();
    els.mon.mood(strong ? 'happy' : 'nod');
    const msg = strong ? MQ.util.pick(MQ.mane.PRAISE) : j === 'quiet' ? MQ.mane.MSG.quiet : j === 'short' ? MQ.mane.MSG.short : 'まねっこ できたよ！';
    els.bl.say(msg, function () {
      round++;
      if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('mane');
      else next();
    });
  }
  MQ.ui.maneko = { open: open, close: close, state: function () { return { round: round, word: w, rec: !!rec, miss: miss, last: last, busy: busy }; }, _start: startRec, _stop: stopRec };
})();
