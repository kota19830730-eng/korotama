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
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>'
  };
  MQ.ui.icon = function (name, cls) { return h('span', { class: 'ico' + (cls ? ' ' + cls : ''), html: SVG[name] || '' }); };
  MQ.ui.SVG = SVG;

  /* ---- 声 ---- */
  function voiceOn() { return !!MQ.save.settings().voice && MQ.voice.ready(); }
  MQ.ui.voiceOn = voiceOn;
  // 読む。おわったら cb。声が ない／切って ある ときは 字の 長さぶん（1字 110ms・さいてい 900ms）待ってから cb
  let speaking = false;
  MQ.ui.isSpeaking = function () { return speaking; };   // 読んで いる 最中か（背景の タップで 声を かさねない ために 見る・v0.1.16）
  MQ.ui.speak = function (text, cb, opts) {
    clearTimeout(speakT);
    speaking = true;
    const done = function () { clearTimeout(speakT); speaking = false; try { MQ.bgm.duck(false); } catch (e) { /* なし */ } if (cb) { const f = cb; cb = null; f(); } };
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
  MQ.ui.stopSpeak = function () { clearTimeout(speakT); speaking = false; MQ.voice.stop(); try { MQ.bgm.duck(false); } catch (e) { /* なし */ } };

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
  const MOODS = { happy: 1300, eat: 1500, sad: 700, jump: 900, spin: 1000, shy: 1200, yawn: 1700, tickle: 1200, nod: 1100, tilt: 1200, look: 2100, pat: 1300, wake: 800 };
  MQ.ui.MOODS = MOODS;
  MQ.ui.monNode = function (size, png) {
    size = size || 160;
    const src = png || MQ.save.monPng();
    const wrap = h('div', { class: 'mon', style: { width: size + 'px', height: size + 'px' } });
    if (src) wrap.appendChild(MQ.blocks.imgBox(src, { size: size, alt: '' }));
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
  MQ.ui.hold = function (el, ms, fn) {
    let t = null, down = false;
    function start(e) { if (down) return; down = true; el.classList.add('is-hold'); t = setTimeout(function () { down = false; el.classList.remove('is-hold'); fn(); }, ms); }
    function end() { down = false; el.classList.remove('is-hold'); clearTimeout(t); }
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('click', function (e) { e.preventDefault(); });
  };

  /* ---- 上の 段 ---- */
  MQ.ui.stampRow = function () {
    const n = MQ.save.stampsToday();
    const row = h('div', { class: 'stamps' });
    for (let i = 0; i < 5; i++) {
      row.appendChild(h('div', { class: 'stamp' + (i < n ? ' is-on' : '') }, [i < n ? h('span', { class: 'ico', style: { color: '#fbf4e4', display: 'flex' }, html: SVG.star }) : null]));
    }
    return row;
  };
  MQ.ui.topBar = function (opts) {
    opts = opts || {};
    const left = opts.home ? h('button', { class: 'rbtn', type: 'button', 'aria-label': 'おうちへ', html: SVG.home, onclick: function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); MQ.ui.home.open(); } }) : MQ.ui.stampRow();
    let right;
    if (opts.replay) right = h('button', { class: 'rbtn rbtn--clay', type: 'button', 'aria-label': 'もういちど きく', html: SVG.speaker, style: { color: '#fbf4e4' }, onclick: function () { MQ.sfx.tap(); opts.replay(); } });
    else {
      right = h('button', { class: 'rbtn', type: 'button', 'aria-label': 'おうちの人（ながおし）', html: SVG.lock, style: { color: '#7a6652' } });
      MQ.ui.hold(right, 1500, function () { MQ.sfx.tap(); MQ.ui.parent.open(); });
    }
    return h('div', { class: 'top' }, [left, right]);
  };
  MQ.ui.hintBox = function (text) {
    return h('div', { class: 'hint' + (MQ.save.settings().hint ? '' : ' is-hidden'), text: 'おうちの人へ：' + text });
  };

  /* ---- もの ---- */
  MQ.ui.foodNode = function (id, small) { return h('div', { class: 'food food--' + id + (small ? ' food--small' : '') }); };
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
    const night = opts.night != null ? !!opts.night : isNightNow();
    const P = {};
    P.sun = h('div', { class: 'scene__sun', style: { left: '196px', top: '8px', width: '56px', height: '56px' } },
      [h('i', { class: 's-eye s-eye--l' }), h('i', { class: 's-eye s-eye--r' }), h('i', { class: 's-mouth' })].concat([0, 45, 90, 135, 180, 225, 270, 315].map(function (r) { return h('i', { class: 's-ray', style: { '--r': r + 'deg' } }); })));
    P.moon = h('div', { class: 'scene__moon', style: { left: '200px', top: '10px' } });
    P.cloud1 = h('div', { class: 'scene__cloud', style: { left: '30px', top: '10px', width: '90px', height: '34px' } });
    P.cloud2 = h('div', { class: 'scene__cloud', style: { left: '60px', top: '-4px', width: '52px', height: '34px' } });
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
        for (let i = 0; i < 7; i++) temp(h('i', { class: 'drop', style: { left: (40 + i * 11 + Math.random() * 6) + 'px', top: '42px', animationDelay: (Math.random() * 0.35) + 's', '--dy': (70 + Math.random() * 40) + 'px' } }), 1600);
        MQ.sfx.rain();
        if (counts.cloud % 3 === 0) {
          setTimeout(function () {
            const rb = h('div', { class: 'rainbow', style: { left: '100px', top: '22px' } });
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
        sun: tapBtn(186, -2, 76, 76, night ? 'おつきさま' : 'おひさま', function () { R[night ? 'moon' : 'sun'](); }),
        cloud: tapBtn(20, -8, 110, 60, 'くも', R.cloud),
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
    return sc;
  };
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
  MQ.ui.finish = function (kind, mon) {
    const before = MQ.save.growth();
    MQ.save.stamp(kind);
    const after = MQ.save.growth();
    MQ.ui.done.open({ grew: after > before });
  };
})();
