/* ---------------------------------------------------------
   画面で どこでも つかう 部品（ころたま）
     show / toast
     speak(text, cb)     … 声で 読んで、おわったら cb（声が ない 端末は 字の 長さぶん 待つ）
     balloon(text)       … 字幕の ふきだし（おうちの人が 読む・「ひとりで あそぶ」なら かくす。声が ない 端末では かならず 出す）
     monNode(size)       … いまの 生きもの
     topBar(opts)        … スタンプ ＋ おうちの人（長おし）
     foodNode / thingNode / shapeNode … 食べもの・おみせの 品・かたちの おもちゃ（CSS で 描く）
     hold(el, ms, fn)    … 長おし（おうちの人の 画面に 入る かぎ）
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  let toastT = null;
  let speakT = null;

  MQ.ui.show = function (id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('is-active', s.id === id); });
    try { if (MQ.bgm) MQ.bgm.forScreen(id); } catch (e) { /* 音が なくても 画面は 進む */ }
    MQ.ui.current = id;
  };
  MQ.ui.mount = function (id, node) {
    const sec = document.getElementById(id);
    if (!sec) return;
    sec.innerHTML = '';
    sec.appendChild(node);
  };
  MQ.ui.toast = function (text, ms) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('is-on'); }, ms || 1800);
  };

  /* ---- アイコン（絵文字は つかわない・線で 描く） ---- */
  const SVG = {
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.2l1.5-7L2 9.4l7-.8z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    bowl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-2 2-2 2-4"/><path d="M13 7c0-2 2-2 2-4"/></svg>',
    ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c-3 3-3 15 0 18"/><path d="M12 3c3 3 3 15 0 18"/><path d="M3 12h18"/></svg>',
    shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11v9h14v-9"/><path d="M10 20v-5h4v5"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M13 7l3 3"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="#f2b544"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v17"/><path d="M8 20h8"/><path d="M5 6h14"/><path d="M5 6l-3 6a3 3 0 0 0 6 0z"/><path d="M19 6l-3 6a3 3 0 0 0 6 0z"/></svg>',
    moji: '<svg viewBox="0 0 24 24"><text x="12" y="19" text-anchor="middle" font-size="19" font-weight="700" fill="currentColor" font-family="sans-serif">あ</text></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
    /* v0.2 */
    crayon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19l2-6 9-9 3 3-9 9z"/><path d="M7 13l4 4"/><path d="M14 6l3 3"/><path d="M3 21c2 0 3-1 4-2"/></svg>',
    lens: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L21 21"/><path d="M7.5 8.5a3 3 0 0 1 3-2"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6z"/><path d="M12 6v14.5"/><path d="M17 2.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="currentColor"/></svg>',
    letter: '<svg viewBox="0 0 24 24" fill="#fffdf7" stroke="#c8705a" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7" fill="none"/><path d="M12 15.5c-1.5-1.2-2.6-2-2.6-3.1 0-.8.6-1.3 1.3-1.3.5 0 1 .3 1.3.8.3-.5.8-.8 1.3-.8.7 0 1.3.5 1.3 1.3 0 1.1-1.1 1.9-2.6 3.1z" fill="#e0493a" stroke="none"/></svg>',
    camera2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="8"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/></svg>'
  };
  /* クレヨンの 色（指で かく 画面・2026-10-10 ユーザー「使える色の種類増やして。少なすぎる」→ 5〜6色 から 15色＋けしゴム） */
  MQ.ui.CRAYONS = [['#3a3330', 'くろ'], ['#8a8580', 'はいいろ'], ['#8a5a2b', 'ちゃいろ'], ['#e0493a', 'あか'], ['#f08cb0', 'ピンク'], ['#f49a2e', 'オレンジ'], ['#f2b48a', 'はだいろ'], ['#f2c94c', 'きいろ'], ['#a5d64a', 'きみどり'], ['#4fa83a', 'みどり'], ['#5cc1e6', 'みずいろ'], ['#3f6fd6', 'あお'], ['#2a3f8f', 'こん'], ['#9a5ac8', 'むらさき'], ['#d4a52c', 'きんいろ']];
  MQ.ui.icon = function (name, cls) { return h('span', { class: 'ico' + (cls ? ' ' + cls : ''), html: SVG[name] || '' }); };
  MQ.ui.SVG = SVG;

  /* ---- 声 ---- */
  function voiceOn() { return !!MQ.save.settings().voice && MQ.voice.ready(); }
  MQ.ui.voiceOn = voiceOn;
  // 読む。おわったら cb。声が ない／切って ある ときは 字の 長さぶん（1字 110ms・さいてい 900ms）待ってから cb
  let speaking = false;
  MQ.ui.isSpeaking = function () { return speaking; };   // 読んで いる 最中か（背景の タップで 声を かさねない ために 見る・v0.1.16）
  /* 2026-10-10 バグ直し：
     ・べつの 声で 読みかえられた（もういちど きく・タップの 声）ときは 前の cb を すてずに とって おき、いちばん 新しい 声が おわったら つづけて よぶ（すてると 遊びが 先へ 進まず 固まった）
     ・stopSpeak（おうちへ・おうちの人へ）は とって おいた cb を ぜんぶ すてる（古い cb で 遊びの 画面に 引きもどされたり スタンプが ついたり して いた）
     ・古い 声の おわりの 合図は tok が ちがうので 何も しない */
  let pending = [], tok = 0;
  function flush() { const list = pending; pending = []; list.forEach(function (f) { f(); }); }
  MQ.ui.speak = function (text, cb, opts) {
    clearTimeout(speakT);
    speaking = true;
    const my = ++tok;
    if (cb) pending.push(cb);
    const done = function () { if (my !== tok) return; tok++; clearTimeout(speakT); speaking = false; try { MQ.bgm.duck(false); } catch (e) { /* なし */ } flush(); };
    if (voiceOn()) {
      try { MQ.bgm.duck(true); } catch (e) { /* なし */ }   // 声の あいだ 音楽を 小さく（v0.1.15）
      MQ.voice.setPitch(MQ.save.settings().pitch || 'normal');
      MQ.voice.setRate(MQ.save.settings().rate || 'slow');
      MQ.voice.setKind(MQ.save.settings().voiceKind || 'zunda');
      const kid = MQ.save.kid(); MQ.voice.setNames([kid && kid.name, kid && kid.mon && kid.mon.name]);
      const ok = MQ.voice.say(text, { onend: done });
      if (ok) { speakT = setTimeout(done, Math.min(12000, 1500 + String(text).length * 260)); return; }   // 保険（onend が 来ない 端末）
    }
    speakT = setTimeout(done, (opts && opts.quick) ? 300 : Math.max(900, String(text).length * 110));
  };
  MQ.ui.stopSpeak = function () { clearTimeout(speakT); speaking = false; tok++; pending = []; MQ.voice.stop(); try { MQ.bgm.duck(false); } catch (e) { /* なし */ } };

  /* 字幕の ふきだし。say(text) で 字を かえて 読む */
  MQ.ui.balloon = function (text, opts) {
    opts = opts || {};
    const tx = h('div', { class: 'balloon__tx', text: text || '' });
    const el = h('div', { class: 'balloon' + (opts.cls ? ' ' + opts.cls : '') }, [h('span', { class: 'ico', style: { color: '#d2765c' }, html: SVG.speaker }), h('div', {}, [tx])]);
    const pics = h('div', { class: 'pics' });
    tx.parentNode.appendChild(pics);
    pics.style.display = 'none';
    function visible() { return !!MQ.save.settings().hint || !voiceOn(); }
    el.classList.toggle('is-hidden', !visible());
    el.say = function (t, cb, picsNodes) {
      tx.textContent = t;
      pics.innerHTML = '';
      if (picsNodes && picsNodes.length) { picsNodes.forEach(function (n) { pics.appendChild(n); }); pics.style.display = ''; }
      else pics.style.display = 'none';
      el.classList.toggle('is-hidden', !visible());
      el.classList.add('is-talking');
      MQ.ui.speak(t, function () { el.classList.remove('is-talking'); if (cb) cb(); });
    };
    el.replay = function () { el.say(tx.textContent); };
    return el;
  };

  /* ---- 生きもの ----
     mood(名前, ms)：動き。名前と 長さは MOODS（css の keyframes と 1対1・smoke が 見る）。
     sleep()／wake()：うたた寝（zzz）と 起きる。hearts()：なでなでの ハート。blush()：てれる ほっぺ。 */
  const MOODS = { roll: 1500, happy: 1300, eat: 1500, sad: 700, jump: 900, spin: 1000, shy: 1200, yawn: 1700, tickle: 1200, nod: 1100, tilt: 1200, look: 2100, pat: 1300, wake: 800 };
  MQ.ui.MOODS = MOODS;
  MQ.ui.monNode = function (size, png) {
    size = size || 160;
    const src = png || MQ.save.monPng();
    const wrap = h('div', { class: 'mon', style: { width: size + 'px', height: size + 'px' } });
    if (src) {
      const bx = MQ.blocks.imgBox(src, { size: size, alt: '' });
      wrap.appendChild(bx);
      // A（v0.2）：かいた ぼうしを かぶる（体と いっしょに うごく ように 絵の 中に 入れる）
      const kid0 = MQ.save.kid();
      const hat = !png && kid0 && kid0.items && kid0.items.hat && kid0.items.hatOn !== false ? kid0.items.hat : null;
      if (hat && hat.png) {
        bx.style.position = 'relative';
        bx.appendChild(h('img', { class: 'mon__hat', src: hat.png, alt: '', style: { width: Math.round(size * 0.58) + 'px', left: Math.round(size * 0.21) + 'px', top: Math.round(-size * 0.2) + 'px' } }));
        wrap.hasHat = true;
      }
    }
    wrap.appendChild(h('div', { class: 'mon__shadow' }));
    let moodT = null;
    wrap.mood = function (m, ms) {
      clearTimeout(moodT);
      Object.keys(MOODS).forEach(function (k) { wrap.classList.remove('is-' + k); });
      if (m) {
        if (wrap.classList.contains('is-sleep')) wrap.wake(true);
        void wrap.offsetWidth; wrap.classList.add('is-' + m);
        moodT = setTimeout(function () { wrap.classList.remove('is-' + m); }, ms || MOODS[m] || 1300);
      }
    };
    wrap.sleep = function () {
      wrap.mood(null);
      if (wrap.classList.contains('is-sleep')) return;
      wrap.classList.add('is-sleep');
      [1, 2, 3].forEach(function (i) { wrap.appendChild(h('span', { class: 'mon__zz mon__zz--' + i, text: 'z' })); });
    };
    wrap.wake = function (quiet) {
      if (!wrap.classList.contains('is-sleep')) return false;
      wrap.classList.remove('is-sleep');
      Array.prototype.slice.call(wrap.querySelectorAll('.mon__zz')).forEach(function (z) { z.parentNode.removeChild(z); });
      if (!quiet) wrap.mood('wake');
      return true;
    };
    wrap.isAsleep = function () { return wrap.classList.contains('is-sleep'); };
    wrap.hearts = function (n) {
      for (let i = 0; i < (n || 5); i++) {
        const hv = h('i', { class: 'heart', style: { left: (size * 0.2 + Math.random() * size * 0.6) + 'px', top: (size * 0.15 + Math.random() * size * 0.3) + 'px', animationDelay: (i * 0.12) + 's' } });
        wrap.appendChild(hv);
        setTimeout(function () { if (hv.parentNode) hv.parentNode.removeChild(hv); }, 1800);
      }
    };
    wrap.blush = function () {
      [0.22, 0.64].forEach(function (x) {
        const b = h('i', { class: 'blush', style: { left: Math.round(size * x) + 'px', top: Math.round(size * 0.5) + 'px' } });
        wrap.appendChild(b);
        setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1200);
      });
    };
    return wrap;
  };
  /* もんだいの 画面で 生きものを タップした とき（C・v0.1.16）：うなずく／首を かしげる を こうたい。声も 背景も 動かさない（気が 散らない） */
  let quietN = 0;
  MQ.ui.quietTap = function (mon) {
    MQ.sfx.tap();
    mon.mood(quietN++ % 2 === 0 ? 'nod' : 'tilt');
  };

  /* ---- 長おし（おうちの人の かぎ） ---- */
  /* v0.1.18：iPad では 長おしの とちゅうで Safari が 画像の メニューや スクロールに 取って pointercancel が 来て、
     何も 起きなかった → ①さわる 端末は touch で 見る（touchstart で preventDefault＝メニュー・スクロールを 止める）
     ②pointercancel・pointerleave では 止めない（touchend／touchcancel・pointerup で 止める）
     ③短く はなしたら 案内の トースト（おうちの人は ここを ながおし）④押して いる あいだ 金の 輪が たまる（css の .is-hold） */
  MQ.ui.hold = function (el, ms, fn) {
    let t = null, down = false, at = 0, touching = false;
    el.style.setProperty('--hold-ms', ms + 'ms');
    function start() {
      if (down) return;
      down = true; at = Date.now(); el.classList.add('is-hold');
      t = setTimeout(function () { down = false; el.classList.remove('is-hold'); fn(); }, ms);
    }
    function end() {
      if (!down) return;
      down = false; el.classList.remove('is-hold'); clearTimeout(t);
      const held = Date.now() - at;
      if (held < ms) MQ.ui.toast(held < 300 ? 'おうちの人は ここを ' + (ms / 1000) + 'びょう ながおし' : 'もう すこし ながく おしてね', 2200);
    }
    el.addEventListener('touchstart', function (e) { e.preventDefault(); touching = true; start(); }, { passive: false });
    el.addEventListener('touchend', function (e) { e.preventDefault(); end(); }, { passive: false });
    el.addEventListener('touchcancel', end);
    el.addEventListener('pointerdown', function (e) { if (touching || e.pointerType === 'touch') return; start(); });
    el.addEventListener('pointerup', function (e) { if (touching || e.pointerType === 'touch') return; end(); });
    el.addEventListener('mouseleave', function () { if (!touching) end(); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('click', function (e) { e.preventDefault(); });
  };
  /* かぎの ボタン（おうちの人の 画面へ）：ボタン＋下の 小さな 字「おうちの人」 */
  MQ.ui.lockButton = function () {
    const b = h('button', { class: 'rbtn rbtn--lock', type: 'button', 'aria-label': 'おうちの人（ながおし）', html: SVG.lock, style: { color: '#7a6652' } });
    MQ.ui.hold(b, 1500, function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); MQ.ui.parent.open(); });
    return h('div', { class: 'lockwrap' }, [b, h('small', { class: 'lockwrap__t', text: 'おうちの人' })]);
  };

  /* ---- 上の 段 ---- */
  /* v0.4（2026-10-11 ユーザー「ころたまなんだー と 思われる 機能」→ 1＋2＋4）：スタンプは たまご。遊びの しゅるいで 色が かわる。
     opts.roll＝さいごの たまごが ころころ 転がって くる（できた！）。row.crack(i)＝たまごが われる／row.party()＝5こ そろった お祝い */
  const EGG_COL = { count: '#f2b544', color: '#d2765c', shape: '#7fb069', compare: '#6f8fd6', moji: '#f08cb0', tokei: '#4fb3a9', draw: '#e98a9b', find: '#6fb6e0', mane: '#a8c94c' };
  MQ.ui.EGG_COL = EGG_COL;
  const EGG_D = 'M12 1.5C18 1.5 22 11 22 18.5C22 25.5 17.5 29 12 29C6.5 29 2 25.5 2 18.5C2 11 6 1.5 12 1.5Z';
  function eggSvg(col) {
    if (!col) return '<svg viewBox="0 0 24 30"><path d="' + EGG_D + '" fill="none" stroke="#d9c8a6" stroke-width="2.2" stroke-dasharray="3.2 2.6"/></svg>';
    return '<svg viewBox="0 0 24 30"><path d="' + EGG_D + '" fill="#fffdf7"/><path d="M17 6C20.5 10 22 15 22 18.5C22 25.5 17.5 29 12 29C16.5 26.5 19 22.5 19 17.5C19 13 18.4 9 17 6Z" fill="#ecdfc2"/>' +
      '<circle cx="9" cy="12" r="3.2" fill="' + col + '"/><circle cx="15" cy="19" r="3.8" fill="' + col + '"/><circle cx="8.5" cy="23" r="2.2" fill="' + col + '"/>' +
      '<path class="egg-s__crack" d="M3 15.5L7 13L10 16.5L13.5 13L16.5 16.5L21 14" fill="none" stroke="#4a3b32" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  MQ.ui.eggSvg = eggSvg;
  MQ.ui.stampRow = function (opts) {
    opts = opts || {};
    const n = MQ.save.stampsToday();
    const kinds = MQ.save.eggsToday ? MQ.save.eggsToday() : [];
    const row = h('div', { class: 'stamps stamps--egg', 'aria-label': 'きょうの たまご ' + n + 'こ' });
    const cells = [];
    for (let i = 0; i < 5; i++) {
      const on = i < n;
      const c = h('div', { class: 'stamp egg-s' + (on ? ' is-on' : '') + (on && opts.roll && i === n - 1 ? ' is-roll' : ''), html: eggSvg(on ? (EGG_COL[kinds[i]] || '#f2b544') : '') });
      cells.push(c); row.appendChild(c);
    }
    row.crack = function (i) { const c = cells[i]; if (!c) return null; c.classList.remove('is-roll'); c.classList.add('is-crack'); return c; };
    row.party = function () { cells.forEach(function (c, i) { c.classList.remove('is-roll'); c.style.animationDelay = (i * 0.12) + 's'; c.classList.add('is-party'); }); };
    return row;
  };
  /* たまごから 出てくる 庭の かざり（花・ちょうちょ・旗） */
  MQ.ui.giftSvg = function (kind) {
    if (kind === 'butterfly') return '<svg viewBox="0 0 40 40"><ellipse cx="12" cy="15" rx="9" ry="10" fill="#f2b544"/><ellipse cx="28" cy="15" rx="9" ry="10" fill="#f2b544"/><ellipse cx="13" cy="28" rx="7" ry="7" fill="#f08cb0"/><ellipse cx="27" cy="28" rx="7" ry="7" fill="#f08cb0"/><rect x="18.5" y="9" width="3" height="24" rx="1.5" fill="#4a3b32"/></svg>';
    if (kind === 'flag') return '<svg viewBox="0 0 40 40"><rect x="9" y="4" width="3" height="34" rx="1.5" fill="#8c6a4a"/><path d="M12 5h22l-5 7 5 7H12z" fill="#e0493a"/></svg>';
    return '<svg viewBox="0 0 40 40"><rect x="18.5" y="20" width="3" height="18" fill="#5b8a49"/><path d="M21 30c4-6 9-6 11-5-2 5-7 7-11 5z" fill="#7fb069"/><g fill="#f08cb0"><circle cx="20" cy="9" r="6"/><circle cx="29" cy="15" r="6"/><circle cx="25" cy="25" r="6"/><circle cx="15" cy="25" r="6"/><circle cx="11" cy="15" r="6"/></g><circle cx="20" cy="17" r="5" fill="#f2c94c"/></svg>';
  };
  MQ.ui.topBar = function (opts) {
    opts = opts || {};
    const left = opts.home ? h('button', { class: 'rbtn', type: 'button', 'aria-label': 'おうちへ', html: SVG.home, onclick: function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); MQ.ui.home.open(); } }) : MQ.ui.stampRow();
    let right;
    if (opts.replay) right = h('button', { class: 'rbtn rbtn--clay', type: 'button', 'aria-label': 'もういちど きく', html: SVG.speaker, style: { color: '#fbf4e4' }, onclick: function () { MQ.sfx.tap(); opts.replay(); } });
    else {
      right = MQ.ui.lockButton();
    }
    return h('div', { class: 'top' }, [left, right]);
  };
  MQ.ui.hintBox = function (text) {
    return h('div', { class: 'hint' + (MQ.save.settings().hint ? '' : ' is-hidden'), text: 'おうちの人へ：' + text });
  };

  /* ---- もの ---- */
  MQ.ui.foodNode = function (id, small) {
    if (/^my/.test(id)) {   // A（v0.2）：かいた たべもの
      const f = MQ.tasks.foodById(id);
      return h('div', { class: 'food food--my' + (small ? ' food--small' : '') }, [f && f.png ? h('img', { src: f.png, alt: '' }) : null]);
    }
    return h('div', { class: 'food food--' + id + (small ? ' food--small' : '') });
  };
  MQ.ui.thingNode = function (thingId, color) {
    return h('div', { class: 'thing thing--' + thingId, style: { '--c': color.hex, '--d': color.dark } }, [h('i', { class: 't1' }), h('i', { class: 't2' }), h('i', { class: 't3' })]);
  };
  MQ.ui.shapeNode = function (shapeId, color) {
    return h('div', { class: 'shape shape--' + shapeId, style: { '--c': color.hex, '--d': color.dark } });
  };
  MQ.ui.colorDots = function (color, n, square) {
    const list = [];
    for (let i = 0; i < n; i++) list.push(h('i', { class: square ? 'pics__sq' : 'pics__dot', style: { background: color.hex, display: 'block' } }));
    return list;
  };

  /* ---- 絵本の ばめん（ホーム・たまご で つかう）
     opts.live   … 背景を 押せる（B・おうち だけ）。太陽＝にっこり＋光／雲＝雨 → 3回に 1回 にじ／木＝ゆれて 葉が 落ちる・2回に 1回 ことり／
                   家＝まどの 明かり・けむり・ドア／丘＝押した ところに 花・2回に 1回 ちょうちょ／夜の 空＝ながれぼし・月＝まばたき
     opts.night  … 夜（19時〜5時）。省くと 本当の 時計で 決める
     opts.decor  … スタンプの 合計（D）：2こ ごとに 花（8本まで）・6こ と 12こ で ちょうちょ・15こ で 家に 旗
     opts.say(t) … 反応の ひとこと（home.js が 声に 出す。読んで いる 最中は 出さない）
     sc.react(name, x, y) … テスト用（harness）。name＝sun|moon|cloud|tree|house|hill|sky */
  const FLOWER_AT = [[118, -156], [146, -140], [174, -124], [14, -96], [54, -86], [200, -100], [100, -92], [128, -80]];
  const FLOWER_COLS = ['#f08cb0', '#f2b544', '#e0493a', '#b07ad8', '#fffdf7', '#f49a2e'];
  const STAR_AT = [[20, 10], [60, 30], [120, 8], [150, 36], [190, 14], [224, 46], [300, 70], [350, 8], [386, 40], [96, 60], [262, 24], [336, 52]];
  function isNightNow() { const hr = new Date().getHours(); return hr >= 19 || hr < 5; }
  MQ.ui.isNightNow = isNightNow;
  MQ.ui.sceneNode = function (height, opts) {
    opts = opts || {};
    const H = height;
    // 2026-10-10：背景が 高い ときは そら（くも・おひさま）を 少し 下げる（上の はしで 雲が 切れて いた）
    const Y = Math.max(0, Math.min(26, Math.round((H - 252) / 5)));
    const night = opts.night != null ? !!opts.night : isNightNow();
    const P = {};
    P.sun = h('div', { class: 'scene__sun', style: { left: '196px', top: (8 + Y) + 'px', width: '56px', height: '56px' } },
      [h('i', { class: 's-eye s-eye--l' }), h('i', { class: 's-eye s-eye--r' }), h('i', { class: 's-mouth' })].concat([0, 45, 90, 135, 180, 225, 270, 315].map(function (r) { return h('i', { class: 's-ray', style: { '--r': r + 'deg' } }); })));
    P.moon = h('div', { class: 'scene__moon', style: { left: '200px', top: (10 + Y) + 'px' } });
    P.cloud1 = h('div', { class: 'scene__cloud', style: { left: '30px', top: (10 + Y) + 'px', width: '90px', height: '34px' } });
    P.cloud2 = h('div', { class: 'scene__cloud', style: { left: '60px', top: (Y ? Y : -4) + 'px', width: '52px', height: '34px' } });
    P.hill1 = h('div', { class: 'scene__hill', style: { left: '-80px', top: (H - 180) + 'px', width: '320px', height: '220px', background: 'var(--grass)' } });
    P.hill2 = h('div', { class: 'scene__hill', style: { left: '190px', top: (H - 160) + 'px', width: '340px', height: '240px', background: 'var(--grass2)' } });
    P.ground = h('div', { class: 'scene__ground', style: { top: (H - 76) + 'px', height: '80px' } });
    P.trunk = h('div', { class: 'scene__trunk', style: { left: '332px', top: (H - 164) + 'px' } });
    P.leaf1 = h('div', { class: 'scene__leaf', style: { left: '300px', top: (H - 238) + 'px', width: '80px', height: '80px', background: '#6f9f5a' } });
    P.leaf2 = h('div', { class: 'scene__leaf', style: { left: '324px', top: (H - 258) + 'px', width: '56px', height: '56px', background: '#84b56a' } });
    P.chimney = h('div', { class: 'scene__chimney', style: { left: '78px', top: (H - 186) + 'px' } });
    P.roof = h('div', { class: 'scene__roof', style: { left: '10px', top: (H - 178) + 'px' } });
    P.house = h('div', { class: 'scene__house', style: { left: '20px', top: (H - 150) + 'px' } });
    P.win = h('div', { class: 'scene__win' + (night ? ' is-on' : ''), style: { left: '80px', top: (H - 138) + 'px' } });
    P.door = h('div', { class: 'scene__door', style: { left: '46px', top: (H - 124) + 'px' } });
    const sc = h('div', { class: 'scene' + (night ? ' is-night' : '') + (opts.live ? ' is-live' : ''), style: { height: H + 'px' } },
      [night ? P.moon : P.sun, P.cloud1, P.cloud2, P.hill1, P.hill2, P.ground, P.trunk, P.leaf1, P.leaf2, P.chimney, P.roof, P.house, P.win, P.door]);
    if (night) STAR_AT.forEach(function (s, i) { sc.appendChild(h('i', { class: 'star', style: { left: s[0] + 'px', top: s[1] + 'px', animationDelay: (i * 0.37 % 2.2) + 's', width: (i % 3 === 0 ? 8 : 5) + 'px', height: (i % 3 === 0 ? 8 : 5) + 'px' } })); });
    sc.parts = P;
    sc.night = night;
    const fx = h('div', { class: 'scene__fx', style: { position: 'absolute', inset: '0', pointerEvents: 'none' } });   // 落ちる 葉・雨・ハートなど（上に のる）
    sc.appendChild(fx);
    sc.fx = fx;
    function temp(el, ms) { fx.appendChild(el); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ms); return el; }
    function say(t) { if (opts.say) opts.say(t); }
    const counts = { cloud: 0, tree: 0, hill: 0 };
    const blooms = [];
    sc.flower = function (x, y, color, cls) {
      const f = h('div', { class: 'flower ' + (cls || 'is-bloom'), style: { left: x + 'px', top: y + 'px', '--c': color || MQ.util.pick(FLOWER_COLS) } }, [h('i', { class: 'f-stem' }), h('i', { class: 'f-petal' }), h('i', { class: 'f-core' })]);
      sc.appendChild(f);
      return f;
    };
    const R = {
      sun: function () {
        P.sun.classList.remove('is-smile'); void P.sun.offsetWidth; P.sun.classList.add('is-smile');
        setTimeout(function () { P.sun.classList.remove('is-smile'); }, 1800);
        MQ.sfx.sun(); say(MQ.util.pick(['おひさま ぽかぽか！', 'あったかいね！']));
      },
      moon: function () {
        P.moon.classList.remove('is-wink'); void P.moon.offsetWidth; P.moon.classList.add('is-wink');
        setTimeout(function () { P.moon.classList.remove('is-wink'); }, 1400);
        MQ.sfx.moon(); say(MQ.util.pick(['おつきさま こんばんは！', 'おほしさま きらきら！']));
      },
      cloud: function () {
        counts.cloud++;
        [P.cloud1, P.cloud2].forEach(function (c) { c.classList.remove('is-rain'); void c.offsetWidth; c.classList.add('is-rain'); setTimeout(function () { c.classList.remove('is-rain'); }, 1400); });
        for (let i = 0; i < 7; i++) temp(h('i', { class: 'drop', style: { left: (40 + i * 11 + Math.random() * 6) + 'px', top: (42 + Y) + 'px', animationDelay: (Math.random() * 0.35) + 's', '--dy': (70 + Math.random() * 40) + 'px' } }), 1600);
        MQ.sfx.rain();
        if (counts.cloud % 3 === 0) {
          setTimeout(function () {
            const rb = h('div', { class: 'rainbow', style: { left: '100px', top: (22 + Y) + 'px' } });
            ['#e0493a', '#f49a2e', '#f2c94c', '#7fb069', '#4f7fd9', '#b07ad8'].forEach(function (c, i) { rb.appendChild(h('i', { style: { '--c': c, left: (i * 7) + 'px', top: (i * 7) + 'px', width: (220 - i * 14) + 'px', height: (220 - i * 14) + 'px' } })); });
            temp(rb, 3300); MQ.sfx.rainbow(); say('わあ、にじが でた！ きれい！');   // 「にじだ」は voice.clockRead が「2時だ」に する ので「にじが」
          }, 900);
        } else say(MQ.util.pick(['あめ ぱらぱら', 'あめが ふってきた！']));
      },
      tree: function () {
        counts.tree++;
        [P.leaf1, P.leaf2, P.trunk].forEach(function (c) { c.classList.remove('is-sway'); void c.offsetWidth; c.classList.add('is-sway'); setTimeout(function () { c.classList.remove('is-sway'); }, 1000); });
        for (let i = 0; i < 4; i++) temp(h('i', { class: 'fleaf', style: { left: (304 + Math.random() * 70) + 'px', top: (H - 196 + Math.random() * 30) + 'px', animationDelay: (i * 0.15) + 's', '--dx': (-40 + Math.random() * 40) + 'px', '--dy': (110 + Math.random() * 50) + 'px', background: i % 2 ? '#84b56a' : '#6f9f5a' } }), 2300);
        MQ.sfx.rustle();
        if (counts.tree % 2 === 0) { temp(h('i', { class: 'bird', style: { left: '336px', top: (H - 226) + 'px', '--dx': '-230px', '--dy': '-60px' } }), 2300); setTimeout(function () { MQ.sfx.bird(); }, 200); say(MQ.util.pick(['ことりさん、ばいばい！', 'ことりさんが とんだ！'])); }
        else say(MQ.util.pick(['さらさら', 'はっぱが おちたよ']));
      },
      house: function () {
        P.house.classList.remove('is-knock'); void P.house.offsetWidth; P.house.classList.add('is-knock');
        P.win.classList.add('is-on');
        P.door.classList.add('is-open');
        for (let i = 0; i < 3; i++) temp(h('i', { class: 'smoke', style: { left: '78px', top: (H - 192) + 'px', animationDelay: (i * 0.3) + 's', '--dx': (4 + i * 8) + 'px' } }), 2600);
        MQ.sfx.knock(); setTimeout(function () { MQ.sfx.door(); }, 350);
        setTimeout(function () { P.house.classList.remove('is-knock'); P.door.classList.remove('is-open'); if (!night) P.win.classList.remove('is-on'); }, 1800);
        say(MQ.util.pick(['ただいま！', 'だれか いるかな？', 'とんとん！']));
      },
      hill: function (x, y) {
        counts.hill++;
        x = x == null ? 140 : x; y = y == null ? H - 120 : y;
        const f = sc.flower(Math.round(x - 11), Math.round(y - 30));
        blooms.push(f);
        if (blooms.length > 6) { const old = blooms.shift(); if (old.parentNode) old.parentNode.removeChild(old); }
        MQ.sfx.pop();
        if (counts.hill % 2 === 0) { temp(h('i', { class: 'butterfly is-fly', style: { left: Math.round(x - 60) + 'px', top: Math.round(y - 40) + 'px', '--c': MQ.util.pick(['#f2b544', '#f08cb0', '#7fb0e0']) } }), 3100); setTimeout(function () { MQ.sfx.flutter(); }, 300); say(MQ.util.pick(['ちょうちょ だ！', 'ちょうちょさん、こんにちは！'])); }
        else say(MQ.util.pick(['おはなが さいた！', 'きれいな おはな！']));
      },
      sky: function (x, y) {
        if (!night) return;
        temp(h('i', { class: 'shoot', style: { left: Math.round((x == null ? 200 + Math.random() * 160 : x) - 30) + 'px', top: Math.round(y == null ? 20 + Math.random() * 50 : y) + 'px' } }), 1100);
        MQ.sfx.shoot(); say(MQ.util.pick(['ながれぼし！', 'おねがい ごとを しよう！']));
      }
    };
    sc.react = function (name, x, y) { if (R[name]) R[name](x, y); };
    sc.counts = counts;
    if (opts.live) {
      // 押す 場所は 見えない 丸い ボタン（64px いじょう・3さいの 指でも 当たる）。丘と 空は ばめん 自体の クリック（押した 場所に 花・ながれぼし）
      function tapBtn(x, y, w, hh, label, fn) {
        const b = h('button', { class: 'scene__tap', type: 'button', 'aria-label': label, style: { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' } });
        b.onclick = function (e) { e.stopPropagation(); fn(); };
        sc.appendChild(b);
        return b;
      }
      sc.taps = {
        sun: tapBtn(186, -2 + Y, 76, 76, night ? 'おつきさま' : 'おひさま', function () { R[night ? 'moon' : 'sun'](); }),
        cloud: tapBtn(20, Y ? Y - 4 : -8, 110, 60, 'くも', R.cloud),
        tree: tapBtn(296, H - 262, 90, 110, 'き', R.tree),
        house: tapBtn(6, H - 190, 100, 100, 'いえ', R.house)
      };
      sc.addEventListener('click', function (e) {
        if (e.target !== sc && !/scene__(hill|ground)/.test(e.target.className || '')) return;
        const r = sc.getBoundingClientRect(), s = (MQ.stage && MQ.stage.size) ? (MQ.stage.size().scale || 1) : 1;
        const x = (e.clientX - r.left) / s, y = (e.clientY - r.top) / s;
        if (y < H - 180) R.sky(x, y); else R.hill(x, y);
      });
    }
    /* D：スタンプの 合計で 背景に ものが ふえる（2こ ごとに 花・6こ／12こ で ちょうちょ・15こ で 旗） */
    sc.decorate = function (total) {
      total = total || 0;
      const n = Math.min(FLOWER_AT.length, Math.floor(total / 2));
      for (let i = 0; i < n; i++) sc.flower(FLOWER_AT[i][0], H + FLOWER_AT[i][1], FLOWER_COLS[i % FLOWER_COLS.length], 'is-deco').style.animationDelay = (i * 0.5) + 's';
      if (total >= 6) sc.appendChild(h('i', { class: 'butterfly is-deco', style: { left: '176px', top: (H - 150) + 'px', '--c': '#f2b544' } }));
      if (total >= 12) sc.appendChild(h('i', { class: 'butterfly is-deco', style: { left: '0px', top: (H - 124) + 'px', '--c': '#f08cb0', animationDelay: '-2s' } }));
      if (total >= 15) sc.appendChild(h('i', { class: 'scene__flag', style: { left: '106px', top: (H - 180) + 'px' } }));
      sc.decorCount = { flowers: n, butterflies: (total >= 6 ? 1 : 0) + (total >= 12 ? 1 : 0), flag: total >= 15 };
    };
    if (opts.decor != null) sc.decorate(opts.decor);
    /* G（v0.2）：きせつの かざり（はる＝さくら／なつ＝ひまわり／あき＝もみじ／ふゆ＝ゆき）＋ 行事・誕生日の かざり（さわると 声で 教える） */
    if (opts.season) {
      const se = opts.season;
      sc.classList.add('is-' + se.season);
      const fall = { spring: 'petal', autumn: 'mleaf', winter: 'snow' }[se.season];
      if (fall) for (let i = 0; i < (se.season === 'winter' ? 12 : 7); i++) sc.insertBefore(h('i', { class: 'fall fall--' + fall, style: { left: Math.round(10 + (i * 53) % 380) + 'px', animationDelay: (-i * 1.3) + 's', animationDuration: (7 + (i % 3) * 1.6) + 's' } }), fx);
      if (se.season === 'summer') [[118, -112], [148, -98]].forEach(function (p) { sc.insertBefore(h('i', { class: 'sunflower', style: { left: p[0] + 'px', top: (H + p[1]) + 'px' } }, [h('i', { class: 'sf-stem' }), h('i', { class: 'sf-head' })]), fx); });
      let told = false;
      sc.addEventListener('click', function () { if (told || !opts.live) return; told = true; setTimeout(function () { say(se.seasonInfo.tell); }, 1600); }, true);
      const ev = se.birthday ? 'birthday' : se.event;
      if (ev && EVENT_SVG[ev]) {
        const b = h('button', { class: 'evsticker', type: 'button', 'aria-label': ev, html: EVENT_SVG[ev], style: { left: '256px', top: (6 + Y) + 'px' } });   // そらの 右（おひさまと 木の あいだ）
        b.onclick = function (e) { e.stopPropagation(); MQ.sfx.rainbow(); b.classList.remove('is-boing'); void b.offsetWidth; b.classList.add('is-boing'); say(se.birthday ? 'おたんじょうび おめでとう！ ろうそくを ふーって してね。' : se.eventInfo.tell); if (se.birthday) { try { MQ.bgm.play('birthday'); } catch (x) { /* なし */ } } };
        sc.appendChild(b);
        sc.eventBtn = b;
      }
    }
    return sc;
  };
  /* ---- G（v0.2）：行事の かざり（絵本ふうの SVG・黒い ふちなし） ---- */
  const EVENT_SVG = {
    newyear: '<svg viewBox="0 0 60 60"><path d="M20 22l4-14 4 14z" fill="#7fb069"/><path d="M28 18l4-14 4 14z" fill="#6cc24a"/><path d="M36 24l4-12 4 12z" fill="#7fb069"/><rect x="20" y="22" width="8" height="22" fill="#9ccf7c"/><rect x="28" y="18" width="8" height="26" fill="#86c26a"/><rect x="36" y="24" width="8" height="20" fill="#9ccf7c"/><ellipse cx="18" cy="44" rx="8" ry="6" fill="#4e9a35"/><ellipse cx="46" cy="44" rx="8" ry="6" fill="#4e9a35"/><rect x="14" y="42" width="36" height="14" rx="3" fill="#d9b06a"/><path d="M14 47h36M14 51h36" stroke="#b98c45" stroke-width="1.6"/></svg>',
    setsubun: '<svg viewBox="0 0 60 60"><path d="M10 26h40l-4 26H14z" fill="#d9b06a"/><path d="M10 26h40" stroke="#b98c45" stroke-width="3"/><g fill="#f3e2b6"><circle cx="22" cy="24" r="4"/><circle cx="30" cy="22" r="4"/><circle cx="38" cy="24" r="4"/><circle cx="26" cy="18" r="4"/><circle cx="34" cy="18" r="4"/></g><g fill="#e8d199"><circle cx="48" cy="54" r="3"/><circle cx="8" cy="52" r="3"/></g></svg>',
    hina: '<svg viewBox="0 0 60 60"><path d="M6 54l10-26h12l8 26z" fill="#4f7fd9"/><circle cx="22" cy="20" r="8" fill="#fbe3cf"/><path d="M14 18c2-8 14-8 16 0" fill="#3a3330"/><path d="M28 54l8-24h12l8 24z" fill="#e0493a"/><circle cx="42" cy="22" r="8" fill="#fbe3cf"/><path d="M34 20c2-8 14-8 16 0" fill="#3a3330"/><rect x="38" y="10" width="8" height="4" rx="1" fill="#f2b544"/><g fill="#3a3330"><circle cx="19" cy="21" r="1.2"/><circle cx="25" cy="21" r="1.2"/><circle cx="39" cy="23" r="1.2"/><circle cx="45" cy="23" r="1.2"/></g><rect x="4" y="54" width="54" height="5" rx="2" fill="#d2765c"/></svg>',
    kodomo: '<svg viewBox="0 0 60 60"><rect x="8" y="4" width="3" height="54" rx="1.5" fill="#b98c45"/><circle cx="9.5" cy="5" r="3" fill="#f2b544"/><path d="M11 12h34l8 6-8 6H11z" fill="#3a5fb0"/><circle cx="18" cy="18" r="3" fill="#fffdf7"/><circle cx="18" cy="18" r="1.4" fill="#3a3330"/><path d="M11 28h30l7 6-7 6H11z" fill="#e0493a"/><circle cx="17" cy="34" r="3" fill="#fffdf7"/><circle cx="17" cy="34" r="1.4" fill="#3a3330"/><path d="M26 15l4 3-4 3M34 15l4 3-4 3M25 31l4 3-4 3M33 31l4 3-4 3" stroke="rgba(255,255,255,.6)" stroke-width="1.6" fill="none"/></svg>',
    tanabata: '<svg viewBox="0 0 60 60"><path d="M30 58V6" stroke="#6cc24a" stroke-width="3"/><path d="M30 14l-16 8M30 24l18 6M30 34l-18 6M30 44l14 4" stroke="#7fb069" stroke-width="2.2"/><g><rect x="10" y="22" width="5" height="12" fill="#f08cb0"/><rect x="45" y="30" width="5" height="12" fill="#f2c94c"/><rect x="9" y="40" width="5" height="12" fill="#4f7fd9"/><rect x="42" y="47" width="5" height="10" fill="#e0493a"/></g><path d="M44 6l1.6 3.4 3.6.4-2.7 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.5 3.6-.4z" fill="#f2b544"/></svg>',
    halloween: '<svg viewBox="0 0 60 60"><path d="M30 14c0-6 4-8 8-8" stroke="#5b8a49" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="30" cy="36" rx="24" ry="19" fill="#f49a2e"/><path d="M22 18c-4 8-4 28 0 36M38 18c4 8 4 28 0 36" stroke="#d9773a" stroke-width="2" fill="none"/><path d="M18 30l6-5 2 6zM42 30l-6-5-2 6z" fill="#7a3e12"/><path d="M18 40c6 6 18 6 24 0l-4 2-2-3-3 3-3-3-3 3-3-3-2 3z" fill="#7a3e12"/></svg>',
    xmas: '<svg viewBox="0 0 60 60"><path d="M30 6l14 18h-6l12 14h-8l10 12H8l10-12h-8l12-14h-6z" fill="#4e9a35"/><rect x="26" y="50" width="8" height="8" fill="#9c6b3c"/><path d="M30 1l2 4.5 4.8.4-3.6 3.2 1 4.8L30 11.4 25.8 14l1-4.8-3.6-3.2 4.8-.4z" fill="#f2b544"/><g><circle cx="24" cy="30" r="2.6" fill="#e0493a"/><circle cx="36" cy="38" r="2.6" fill="#4f7fd9"/><circle cx="20" cy="44" r="2.6" fill="#f2c94c"/><circle cx="40" cy="47" r="2.6" fill="#e0493a"/></g><rect x="44" y="48" width="14" height="10" rx="1" fill="#e0493a"/><path d="M51 48v10M44 53h14" stroke="#f2c94c" stroke-width="2"/></svg>',
    birthday: '<svg viewBox="0 0 60 60"><rect x="8" y="30" width="44" height="24" rx="4" fill="#fbe3cf"/><path d="M8 36c4 4 8-2 11 2s7-2 11 2 7-2 11 2 7-2 11 0v-6H8z" fill="#f08cb0"/><rect x="8" y="50" width="44" height="4" fill="#e9b9c9"/><g fill="#e0493a"><circle cx="18" cy="44" r="2"/><circle cx="30" cy="46" r="2"/><circle cx="42" cy="44" r="2"/></g><g><rect x="17" y="18" width="3" height="12" fill="#4f7fd9"/><rect x="28.5" y="16" width="3" height="14" fill="#f2c94c"/><rect x="40" y="18" width="3" height="12" fill="#7fb069"/></g><g fill="#f49a2e"><path d="M18.5 11c2 3 2 5 0 6-2-1-2-3 0-6z"/><path d="M30 9c2 3 2 5 0 6-2-1-2-3 0-6z"/><path d="M41.5 11c2 3 2 5 0 6-2-1-2-3 0-6z"/></g></svg>'
  };
  MQ.ui.EVENT_SVG = EVENT_SVG;
  MQ.ui.decorOf = function (total) { total = total || 0; return { flowers: Math.min(FLOWER_AT.length, Math.floor(total / 2)), butterflies: (total >= 6 ? 1 : 0) + (total >= 12 ? 1 : 0), flag: total >= 15 }; };

  /* ---- かみふぶき ---- */
  MQ.ui.confetti = function (parent, n) {
    const cols = ['#f2b544', '#d2765c', '#7fb069', '#4f7fd9', '#f08cb0'];
    for (let i = 0; i < (n || 24); i++) {
      const c = h('i', { class: 'confetti', style: { left: Math.round(Math.random() * 380) + 'px', top: '0', background: cols[i % cols.length], animationDelay: (Math.random() * 0.6) + 's' } });
      parent.appendChild(c);
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 2400);
    }
  };

  /* ---- あそびの おわり：スタンプ → できた！ ---- */
  // 2026-10-10：2回 よばれても スタンプは 1つ（2回 タップ・録音の おわりが 2回 などの 保険）。できた！の 画面に いる あいだの 2回めは すてる
  MQ.ui.finish = function (kind, mon) {
    if (MQ.ui.current === 'screen-done') return;
    const before = MQ.save.growth(), n0 = MQ.save.stampsToday(), d0 = MQ.ui.decorOf(MQ.save.stampsTotal());
    MQ.save.stamp(kind);
    const after = MQ.save.growth(), d1 = MQ.ui.decorOf(MQ.save.stampsTotal());
    if (after > before) MQ.save.markGrew(after);
    // v0.4：2こ ごとに ふえる 庭の かざりは「たまごから 出てくる」
    const gift = d1.flag && !d0.flag ? 'flag' : d1.butterflies > d0.butterflies ? 'butterfly' : d1.flowers > d0.flowers ? 'flower' : '';
    const o = { grew: after > before, full: MQ.save.stampsToday() === n0, kind: kind, gift: gift };
    // 2：すがたが かわる ときは たまごに もどって、とんとんで 大きく なって 出てくる
    if (o.grew && MQ.ui.egg && MQ.ui.egg.regrow) { MQ.ui.egg.regrow(function () { MQ.ui.done.open(o); }); return; }
    MQ.ui.done.open(o);
  };

  /* ---- A2 まよった ときの 手助け（v0.3・2026-10-11）----
     もんだいの 画面が arm({ screen, say(文, 問題も 言う か), targets(), busy() }) を よぶ。
     手が とまって 15秒（声の あいだ・答えた あとは 数えない）→「ゆっくりで いいよ。もういちど いうね」＋問題／さらに 15秒 → 正解を 光らせる。どこかを さわると 数えなおし */
  MQ.ui.nudge = (function () {
    let st = null, timer = null, hooked = false;
    function stop() { st = null; clearInterval(timer); timer = null; }
    function touch() { if (st) st.idle = 0; }
    function arm(o) {
      stop();
      if (MQ.save.settings().nudge === false) return;
      if (!hooked) { hooked = true; document.addEventListener('pointerdown', touch, true); document.addEventListener('touchstart', touch, { capture: true, passive: true }); }
      const my = st = { screen: o.screen, say: o.say, targets: o.targets, busy: o.busy, idle: 0, step: 0, ms: o.ms || MQ.coach.NUDGE_MS };
      timer = setInterval(function () { tick(my, 250); }, 250);
    }
    function tick(my, dt) {
      if (st !== my) return;
      if (MQ.ui.current !== my.screen) { stop(); return; }
      if (document.hidden || MQ.ui.isSpeaking() || (my.busy && my.busy())) { my.idle = 0; return; }
      my.idle += dt;
      if (my.idle >= my.ms) fire(my);
    }
    function fire(my) {
      my = my || st; if (!my) return;
      my.idle = 0; my.step++;
      if (my.step === 1) { my.say(MQ.coach.NUDGE.again, true); return; }
      ((my.targets && my.targets()) || []).forEach(function (el) { if (el && el.classList) el.classList.add('is-glow'); });
      my.say(MQ.coach.NUDGE.glow, false);
      stop();
    }
    return { arm: arm, stop: stop, fire: function () { fire(null); }, state: function () { return st ? { screen: st.screen, step: st.step, idle: st.idle } : null; } };
  })();

  /* ---- C1 遊ぶ 時間を 数える（v0.3）：子どもの 画面が 出て いて、90秒 いないに さわって いる あいだ だけ ---- */
  MQ.ui.playClock = (function () {
    const SKIP = { 'screen-start': 1, 'screen-setup': 1, 'screen-parent': 1 };
    let lastTouch = Date.now(), last = Date.now(), acc = 0;
    function flush() { if (acc) { acc = 0; MQ.save.update(function () { /* addPlay の ぶんを 書く */ }); } }
    function tick() {
      const now = Date.now(), dt = Math.min(now - last, 10000); last = now;
      if (document.hidden || !MQ.ui.current || SKIP[MQ.ui.current] || !MQ.save.kid()) return;
      if (now - lastTouch > 90000) return;
      MQ.coach.addPlay(dt); acc += dt;
      if (acc >= 30000) flush();
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', function () { lastTouch = Date.now(); }, true);
      document.addEventListener('touchstart', function () { lastTouch = Date.now(); }, { capture: true, passive: true });
      document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); last = Date.now(); });
      setInterval(tick, 5000);
    }
    return { tick: tick, flush: flush, touch: function () { lastTouch = Date.now(); } };
  })();
})();
