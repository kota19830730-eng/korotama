/* ---------------------------------------------------------
   おえかき「かいた ものが ほんとうに なる」（ころたま v0.2・A）
   ユーザー決定 2026-10-10「全て入れましょう」。
   えらぶ（たべもの／ぼうし／おともだち／おにわの かざり）→ ゆびで かく → 絵が 生きものの せかいに 出てくる：
     たべもの … 生きものが たべる＋ごはん（かず）の かごに まざる（「かいた ごはんを みっつ ちょうだい」）
     ぼうし   … 生きものが かぶる（どの 画面でも）
     おともだち … おうちに すむ（さわると はねる）
     おにわ   … おうちの にわに かざる（3つまで）
   知育：かく（手の うごき・表現）＋ じぶんの 絵が つかわれる よろこび。おうちの人は「なにを かいたの？」と きいて ことばを 引き出す。
     MQ.ui.kaku.open()      … えらぶ 画面
     MQ.ui.kaku.pad(kind)   … かく 画面
     MQ.ui.kaku.place(kind, png) … 絵を 生きものの せかいに 出す（テストでも つかう）
     MQ.ui.pad(opts)        … ゆびで かく 部品（kaku・ほかでも つかえる）
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  /* <lines> */
  const KINDS = [
    { id: 'food', name: 'たべもの', ask: 'おいしい たべものを かいてね！', cls: 'big--gold' },
    { id: 'hat', name: 'ぼうし', ask: 'すてきな ぼうしを かいてね！', cls: 'big--blue' },
    { id: 'friend', name: 'おともだち', ask: 'おともだちを かいてね！', cls: 'big--pink' },
    { id: 'garden', name: 'おにわ', ask: 'おにわに かざる ものを かいてね！', cls: 'big--green' }
  ];
  const DONE_LINE = {
    food: ['わあ、おいしそう！ いただきます！', 'ごはんの かごにも いれて おくね。'],
    hat: ['すてきな ぼうし！ にあう？'],
    friend: ['おともだちが きた！ よろしくね！', 'おうちで いっしょに すむよ。'],
    garden: ['おにわに かざったよ！ きれい！']
  };
  /* </lines> */
  const ICON = {
    food: function () { return MQ.ui.foodNode('apple'); },
    hat: function () { return h('div', { class: 'kk__ico', html: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="36" rx="20" ry="6" fill="#3458a8"/><path d="M12 36c0-14 4-24 12-24s12 10 12 24z" fill="#4f7fd9"/><rect x="12" y="28" width="24" height="5" fill="#f2b544"/></svg>' }); },
    friend: function () { return h('div', { class: 'kk__ico', html: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="28" rx="16" ry="15" fill="#f08cb0"/><circle cx="18" cy="25" r="4" fill="#fff"/><circle cx="30" cy="25" r="4" fill="#fff"/><circle cx="19" cy="26" r="2" fill="#3a3330"/><circle cx="31" cy="26" r="2" fill="#3a3330"/><path d="M19 33q5 4 10 0" stroke="#3a3330" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M12 16l4 6M36 16l-4 6" stroke="#c45f88" stroke-width="3" stroke-linecap="round"/></svg>' }); },
    garden: function () { return h('div', { class: 'kk__ico', html: '<svg viewBox="0 0 48 48"><path d="M24 44V22" stroke="#4e9a35" stroke-width="3"/><path d="M24 34c-6-1-9-5-9-8 5 0 8 3 9 8z" fill="#6cc24a"/><g fill="#f2c94c"><circle cx="24" cy="10" r="6"/><circle cx="32" cy="16" r="6"/><circle cx="29" cy="25" r="6"/><circle cx="19" cy="25" r="6"/><circle cx="16" cy="16" r="6"/></g><circle cx="24" cy="18" r="5" fill="#e0493a"/></svg>' }); }
  };

  /* ---- ゆびで かく 部品 ---- */
  MQ.ui.pad = function (opts) {
    opts = opts || {};
    const S = 640;
    const cv = h('canvas', { class: 'draw__cv', width: String(S), height: String(S) });
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const COLS = MQ.ui.CRAYONS;
    let col = COLS[0][0], width = 22, drawing = false, last = null, strokes = 0;
    const crayons = h('div', { class: 'crayons crayons--many' });
    COLS.forEach(function (c, i) {
      const b = h('button', { class: 'crayon' + (i === 0 ? ' is-on' : ''), type: 'button', 'aria-label': c[1], style: { background: c[0] } });
      b.onclick = function () { MQ.sfx.tap(); col = c[0]; width = 22; crayons.querySelectorAll('.crayon').forEach(function (x) { x.classList.remove('is-on'); }); b.classList.add('is-on'); };
      crayons.appendChild(b);
    });
    const eraser = h('button', { class: 'crayon crayon--eraser', type: 'button', 'aria-label': 'けしゴム' });
    eraser.onclick = function () { MQ.sfx.tap(); col = '#ffffff'; width = 60; crayons.querySelectorAll('.crayon').forEach(function (x) { x.classList.remove('is-on'); }); eraser.classList.add('is-on'); };
    crayons.appendChild(eraser);
    function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * S, (e.clientY - r.top) / r.height * S]; }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drawing = true; last = pos(e); strokes++; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* なし */ } g.beginPath(); g.fillStyle = col; g.arc(last[0], last[1], width / 2, 0, Math.PI * 2); g.fill(); });
    cv.addEventListener('pointermove', function (e) { if (!drawing) return; e.preventDefault(); const p = pos(e); g.strokeStyle = col; g.lineWidth = width; g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { drawing = false; }); });
    cv.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    cv.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    return {
      canvas: cv, ctx: g, crayons: crayons,
      strokes: function () { return strokes; },
      clear: function () { g.fillStyle = '#fff'; g.fillRect(0, 0, S, S); strokes = 0; },
      mark: function () { strokes++; }
    };
  };

  /* 絵を 小さく（保存の 大きさを へらす）：たて・よこ 長い ほうを px に */
  function shrink(png, px, cb) {
    const im = new Image();
    im.onload = function () {
      const k = Math.min(1, px / Math.max(im.width, im.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL('image/png'));
    };
    im.onerror = function () { cb(png); };
    im.src = png;
  }
  MQ.ui.shrinkPng = shrink;

  function choose() {
    const bl = MQ.ui.balloon('');
    const mon = MQ.ui.monNode(120);
    mon.addEventListener('click', function () { MQ.ui.quietTap(mon); });
    const grid = h('div', { class: 'kk__grid' }, KINDS.map(function (k) {
      return h('div', { class: 'bigs__it' }, [h('button', { class: 'big ' + k.cls, type: 'button', 'aria-label': k.name, onclick: function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); pad(k.id); } }, [ICON[k.id]()]), h('span', { text: k.name })]);
    }));
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(ASK); } }),
      h('div', { class: 'wrap col', style: { gap: '14px', alignItems: 'center' } }, [mon, bl, grid,
        MQ.ui.hintBox('かいた 絵が 生きものの せかいに 出てきます。たべもの＝ごはんの あそびに まざる／ぼうし＝かぶる／おともだち・おにわ＝おうちに すむ')])
    ]);
    MQ.ui.mount('screen-kaku', page);
    MQ.ui.show('screen-kaku');
    setTimeout(function () { bl.say(ASK); }, 250);
  }
  /* <lines> */ const ASK = 'なにを かこうかな？ たべもの？ ぼうし？ おともだち？ おにわの かざり？'; /* </lines> */

  function pad(kind) {
    const k = KINDS.filter(function (x) { return x.id === kind; })[0] || KINDS[0];
    const P = MQ.ui.pad();
    const bl = MQ.ui.balloon('', { cls: 'balloon--slim' });
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(k.ask); } }),
      h('div', { class: 'page__body' }, [h('div', { class: 'wrap draw' }, [
        bl, P.canvas, P.crayons,
        h('div', { class: 'row', style: { width: '380px' } }, [
          h('button', { class: 'btn', type: 'button', text: 'ぜんぶ けす', onclick: function () { MQ.sfx.tap(); P.clear(); } }),
          h('button', { class: 'btn btn--gold btn--big', type: 'button', text: 'できた！', style: { flex: '1' }, onclick: function () {
            MQ.sfx.tap();
            if (!P.strokes()) { bl.say('なにか かいてね'); return; }
            const im = new Image();
            im.onload = function () {
              let res = null;
              try { res = MQ.cutout.fromImage(im, { x: 0, y: 0, w: 1, h: 1 }); } catch (e) { res = null; }
              if (!res || !res.raw || res.drawn < 30) { bl.say('もう すこし おおきく かいてね'); return; }
              shrink(res.raw.png, 200, function (png) { place(kind, png); });
            };
            im.src = P.canvas.toDataURL('image/png');
          } })
        ]),
        MQ.ui.hintBox('「なにを かいたの？」と きいてみて。お子さんの ことばで 名前を 言えたら 大成功です')
      ])])
    ]);
    MQ.ui.mount('screen-kaku', page);
    MQ.ui.show('screen-kaku');
    setTimeout(function () { bl.say(k.ask); }, 250);
    MQ.ui.kaku._pad = P;
  }

  /* かいた 絵を 生きものの せかいへ */
  function place(kind, png) {
    MQ.save.update(function (d) {
      const it = d.kid.items, rec = { png: png, at: Date.now() };
      if (kind === 'food') { it.foods.push(rec); while (it.foods.length > 6) it.foods.shift(); }
      else if (kind === 'hat') { it.hat = rec; it.hatOn = true; }
      else if (kind === 'friend') it.friend = rec;
      else { it.garden.push(rec); while (it.garden.length > 3) it.garden.shift(); }
    });
    const scene = MQ.ui.sceneNode(300, { season: MQ.season.of(MQ.season.now(), MQ.save.kid()) });
    const mon = MQ.ui.monNode(150, kind === 'hat' ? MQ.save.monPng() : null);   // ぼうしは とんで きてから かぶる
    const monBox = h('div', { style: { position: 'absolute', left: '210px', top: '120px' } }, [mon]);
    scene.appendChild(monBox);
    const art = h('img', { class: 'kk__art is-appear', src: png, alt: '', style: { left: '60px', top: '60px' } });
    scene.appendChild(art);
    for (let i = 0; i < 10; i++) scene.appendChild(h('i', { class: 'kk__spark', style: { left: (60 + Math.random() * 110) + 'px', top: (60 + Math.random() * 110) + 'px', animationDelay: (i * 0.06) + 's' } }));
    const bl = MQ.ui.balloon('');
    const page = h('div', { class: 'page' }, [MQ.ui.topBar({}), scene, h('div', { class: 'wrap col', style: { gap: '12px', paddingTop: '10px' } }, [bl])]);
    MQ.ui.mount('screen-kaku', page);
    MQ.ui.show('screen-kaku');
    MQ.sfx.rare();
    const lines = DONE_LINE[kind] || DONE_LINE.garden;
    setTimeout(function () {
      art.classList.remove('is-appear');
      art.classList.add('is-go--' + kind);
      if (kind === 'food') setTimeout(function () { mon.mood('eat', 1500); MQ.sfx.correct(); }, 700);
      if (kind === 'hat') setTimeout(function () { art.style.display = 'none'; monBox.innerHTML = ''; const m2 = MQ.ui.monNode(150); monBox.appendChild(m2); m2.mood('jump'); MQ.sfx.jump(); }, 800);
      if (kind === 'friend' || kind === 'garden') setTimeout(function () { mon.mood('happy'); MQ.sfx.pop(); }, 700);
    }, 1100);
    setTimeout(function () {
      bl.say(lines.join(' '), function () { setTimeout(function () { MQ.ui.finish('draw'); }, 600); });
    }, 1300);
  }

  MQ.ui.kaku = { open: choose, pad: pad, place: place, KINDS: KINDS, ASK: ASK, DONE_LINE: DONE_LINE };
})();
