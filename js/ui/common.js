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
  MQ.ui.speak = function (text, cb, opts) {
    clearTimeout(speakT);
    const done = function () { clearTimeout(speakT); if (cb) { const f = cb; cb = null; f(); } };
    if (voiceOn()) {
      MQ.voice.setPitch(MQ.save.settings().pitch || 'normal');
      MQ.voice.setRate(MQ.save.settings().rate || 'slow');
      MQ.voice.setKind(MQ.save.settings().voiceKind || 'zunda');
      const kid = MQ.save.kid(); MQ.voice.setNames([kid && kid.name, kid && kid.mon && kid.mon.name]);
      const ok = MQ.voice.say(text, { onend: done });
      if (ok) { speakT = setTimeout(done, Math.min(12000, 1500 + String(text).length * 260)); return; }   // 保険（onend が 来ない 端末）
    }
    speakT = setTimeout(done, (opts && opts.quick) ? 300 : Math.max(900, String(text).length * 110));
  };
  MQ.ui.stopSpeak = function () { clearTimeout(speakT); MQ.voice.stop(); };

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

  /* ---- 生きもの ---- */
  MQ.ui.monNode = function (size, png) {
    size = size || 160;
    const src = png || MQ.save.monPng();
    const wrap = h('div', { class: 'mon', style: { width: size + 'px', height: size + 'px' } });
    if (src) wrap.appendChild(MQ.blocks.imgBox(src, { size: size, alt: '' }));
    wrap.appendChild(h('div', { class: 'mon__shadow' }));
    wrap.mood = function (m, ms) {
      wrap.classList.remove('is-happy', 'is-eat', 'is-sad');
      if (m) { void wrap.offsetWidth; wrap.classList.add('is-' + m); setTimeout(function () { wrap.classList.remove('is-' + m); }, ms || 1300); }
    };
    return wrap;
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

  /* ---- 絵本の ばめん（ホーム・たまご で つかう） ---- */
  MQ.ui.sceneNode = function (height) {
    const sc = h('div', { class: 'scene', style: { height: height + 'px' } }, [
      h('div', { class: 'scene__sun', style: { left: '300px', top: '22px' } }),
      h('div', { class: 'scene__cloud', style: { left: '36px', top: '54px', width: '90px', height: '34px' } }),
      h('div', { class: 'scene__cloud', style: { left: '60px', top: '42px', width: '50px', height: '34px' } }),
      h('div', { class: 'scene__hill', style: { left: '-80px', top: (height - 180) + 'px', width: '320px', height: '220px', background: 'var(--grass)' } }),
      h('div', { class: 'scene__hill', style: { left: '190px', top: (height - 160) + 'px', width: '340px', height: '240px', background: 'var(--grass2)' } }),
      h('div', { class: 'scene__ground', style: { top: (height - 76) + 'px', height: '80px' } }),
      h('div', { class: 'scene__trunk', style: { left: '310px', top: (height - 250) + 'px' } }),
      h('div', { class: 'scene__leaf', style: { left: '276px', top: (height - 300) + 'px', width: '86px', height: '86px', background: '#6f9f5a' } }),
      h('div', { class: 'scene__leaf', style: { left: '302px', top: (height - 320) + 'px', width: '64px', height: '64px', background: '#84b56a' } }),
      h('div', { class: 'scene__roof', style: { left: '30px', top: (height - 208) + 'px' } }),
      h('div', { class: 'scene__house', style: { left: '40px', top: (height - 180) + 'px' } }),
      h('div', { class: 'scene__door', style: { left: '66px', top: (height - 154) + 'px' } })
    ]);
    return sc;
  };

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
