/* ---------------------------------------------------------
   おうち（ホーム）と できた！（ころたま）
     MQ.ui.home.open(opts)      … opts.night＝夜を 決めうち（テスト用）
     MQ.ui.done.open({ grew })
   v0.1.16（ユーザー決定 2026-10-10「A＋B＋C＋D ぜんぶ」）：おうちだけ にぎやか。
     A キャラクター：タップ＝うれしい／ぴょん／くるりん／てれる／あくび の どれか・3回 つづけて＝くすぐったい・長おし＝なでなで（ハート）・
                   ほっとく＝きょろきょろ（20秒）→ あくび（35秒）→ うたた寝（50秒・タップで 起きる）
     B 背景：common.js の sceneNode({ live: true })（太陽・雲・木・家・丘・夜の 空）
     D かざり：スタンプの 合計で 花・ちょうちょ・旗（sceneNode の decor）
     もんだいの 画面は C（うなずく／首を かしげる だけ・common.js の quietTap）
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;

  function greeting() {
    const se = MQ.season.of(MQ.season.now(), MQ.save.kid());
    if (se.greet) return se.greet;   // G（v0.2）：誕生日・行事の 日
    const hr = new Date().getHours();
    const kid = MQ.save.kid();
    const nm = kid && kid.name ? kid.name + 'ちゃん、' : '';
    if (hr < 10) return nm + 'おはよう！ きょうは なにを する？';
    if (hr < 17) return nm + 'こんにちは！ なにを する？';
    return nm + 'こんばんは！ なにを する？';
  }

  /* <lines> キャラクターの ひとこと（声は tools/voice/lines.js が この しるしの 中から ひろう） */
  const LINES = {
    happy: ['えへへ！', 'だいすき！', 'いっしょに あそぼう！', 'うれしいな！'],
    jump: ['ぴょん！', 'たかく とべるよ！'],
    spin: ['くるりん！', 'みてみて！'],
    shy: ['えへへ、てれちゃう', 'はずかしいな'],
    yawn: ['ふわぁ… ちょっと ねむいな', 'ふわぁ…'],
    tickle: ['くすぐったい！', 'あはは！ くすぐったいよ！'],
    pat: ['なでなで きもちいい！', 'もっと なでて！'],
    sleep: ['すやすや…'],
    wake: ['はっ！ おきたよ！', 'ふぁ… おはよう！'],
    friend: ['こんにちは！ あそぼう！', 'ぼくも ここに すんでるよ！', 'いっしょに あそぼうね！']   // A（v0.2）：かいた ともだち
  };
  /* </lines> */
  const TAPS = ['happy', 'jump', 'spin', 'shy', 'yawn'];
  const GARDEN_AT = [[4, -62], [64, -54], [186, -58]];   // おにわの かざりの 場所（ばめんの 下からの たかさ）
  const HANAMARU = '<svg viewBox="0 0 48 48"><g fill="none" stroke="#e0493a" stroke-width="3.2" stroke-linecap="round"><path d="M24 7c9 0 16 6 16 15s-7 16-16 16S8 32 8 23c0-8 6-14 14-14 7 0 12 5 12 12s-5 11-11 11-9-4-9-9 4-8 8-8"/></g><path d="M10 40c4 2 6 6 6 6M38 40c-4 2-6 6-6 6" stroke="#7fb069" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';
  const IDLE = { look: 20000, yawn: 35000, sleep: 50000 };   // ほっといた 時間（ms）

  let idleT = [];
  function clearIdle() { idleT.forEach(clearTimeout); idleT = []; }

  MQ.ui.home = {
    LINES: LINES, IDLE: IDLE, TAPS: TAPS,
    open: function (opts) {
      opts = opts || {};
      MQ.ui.stopSpeak();
      clearIdle();
      const kid = MQ.save.kid();
      if (!kid || !kid.mon) { MQ.ui.start.open(); return; }
      const SH = 252;   // v0.1.16：字幕は ばめんの 下へ（雲・雨・けむりを かくして いた）。たまごの 画面と 同じ ならび
      const bl = MQ.ui.balloon('');
      // 背景の ひとこと：読んで いる 最中は 出さない（たたくたびに 声が 切れると うるさい）
      const sayIfFree = function (t) { if (!MQ.ui.isSpeaking()) bl.say(t); };
      const se = MQ.season.of(MQ.season.now(), kid);
      const scene = MQ.ui.sceneNode(SH, { live: true, night: opts.night, decor: MQ.save.stampsTotal(), say: sayIfFree, season: se });
      const mon = MQ.ui.monNode(160);
      const monBox = h('div', { style: { position: 'absolute', left: '226px', top: (SH - 166) + 'px' } }, [mon]);
      scene.appendChild(monBox);
      /* ---- A（v0.2）：かいた ともだち・おにわの かざり ---- */
      const items = kid.items || {};
      (items.garden || []).slice(0, 3).forEach(function (g, i) {
        const pos = GARDEN_AT[i];
        const it = h('button', { class: 'garden', type: 'button', 'aria-label': 'おにわの かざり', style: { left: pos[0] + 'px', top: (SH + pos[1]) + 'px' } }, [h('img', { src: g.png, alt: '' })]);
        it.onclick = function (e) { e.stopPropagation(); MQ.sfx.pop(); it.classList.remove('is-boing'); void it.offsetWidth; it.classList.add('is-boing'); sayIfFree(MQ.util.pick(['きみが かいた かざりだね！', 'すてきな かざり！'])); };
        scene.appendChild(it);
      });
      let friend = null;
      if (items.friend && items.friend.png) {
        friend = h('button', { class: 'friend', type: 'button', 'aria-label': 'おともだち', style: { left: '128px', top: (SH - 112) + 'px' } }, [h('img', { src: items.friend.png, alt: '' })]);
        friend.onclick = function (e) { e.stopPropagation(); MQ.sfx.jump(); friend.classList.remove('is-hop'); void friend.offsetWidth; friend.classList.add('is-hop'); sayIfFree(MQ.util.pick(LINES.friend)); };
        scene.appendChild(friend);
      }
      /* ---- D（v0.2）：おてつだいの おてがみ（きょう まだ なら ふうとう が ゆれる・できたら はなまる） ---- */
      const helped = MQ.chores.doneToday(kid);
      const letter = h('button', { class: 'letter' + (helped ? ' is-done' : ''), type: 'button', 'aria-label': helped ? 'はなまる' : 'おてがみ', style: { left: '124px', top: (SH - 204) + 'px' }, html: helped ? HANAMARU : MQ.ui.SVG.letter });
      letter.onclick = function (e) { e.stopPropagation(); MQ.sfx.tap(); MQ.ui.stopSpeak(); clearIdle(); if (helped) { sayIfFree('きょうの おてつだい、ありがとう！'); return; } MQ.ui.otetsudai.open(); };
      scene.appendChild(letter);

      /* ---- A：キャラクターの 反応 ---- */
      let taps = [], last = '';
      function pickKind() { let k; do { k = MQ.util.pick(TAPS); } while (k === last && TAPS.length > 1); last = k; return k; }
      function react(kind, line) {
        clearIdle(); armIdle();
        if (mon.isAsleep()) { kind = 'wake'; }
        mon.mood(kind);
        if (kind === 'shy') mon.blush();
        if (kind === 'pat') { mon.hearts(5); if (MQ.family.has('love') && Math.random() < 0.5) { bl.say(MQ.util.pick(LINES.pat)); setTimeout(function () { MQ.family.play('love'); }, 1200); return kind; } }
        const sf = { jump: 'jump', spin: 'spin', tickle: 'tickle', pat: 'heart', yawn: 'yawn', wake: 'wake' }[kind];
        if (sf && MQ.sfx[sf]) MQ.sfx[sf](); else MQ.sfx.tap();
        bl.say(line || MQ.util.pick(LINES[kind] || LINES.happy));
        return kind;
      }
      function onTap() {
        const now = Date.now();
        taps = taps.filter(function (t) { return now - t < 1500; }); taps.push(now);
        if (mon.isAsleep()) { react('wake'); taps = []; return; }
        if (taps.length >= 3) { taps = []; react('tickle'); return; }
        react(pickKind());
      }
      // 長おし＝なでなで。みじかく はなしたら ふつうの タップ（click は 長おしの あと 出さない）
      let pressT = null, longed = false;
      mon.addEventListener('pointerdown', function (e) {
        longed = false;
        clearTimeout(pressT);
        pressT = setTimeout(function () { longed = true; react('pat'); }, 600);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { mon.addEventListener(ev, function () { clearTimeout(pressT); }); });
      mon.addEventListener('click', function () { if (longed) { longed = false; return; } onTap(); });

      /* ---- ほっとくと：きょろきょろ → あくび → うたた寝 ---- */
      function alive() { return MQ.ui.current === 'screen-home' && document.body.contains(mon); }
      function armIdle() {
        clearIdle();
        idleT.push(setTimeout(function () { if (alive() && !mon.isAsleep()) mon.mood('look'); }, IDLE.look));
        idleT.push(setTimeout(function () { if (alive() && !mon.isAsleep()) { mon.mood('yawn'); MQ.sfx.yawn(); sayIfFree(LINES.yawn[1]); } }, IDLE.yawn));
        idleT.push(setTimeout(function () { if (alive() && !mon.isAsleep()) { mon.sleep(); MQ.sfx.snore(); sayIfFree(LINES.sleep[0]); } }, IDLE.sleep));
      }
      scene.addEventListener('pointerdown', function () { if (!mon.isAsleep()) armIdle(); });   // 背景を さわっても 目は さめて いる
      armIdle();

      const go = function (fn) { return function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); clearIdle(); fn(); }; };
      const page = h('div', { class: 'page' }, [
        MQ.ui.topBar({}),
        scene,
        h('div', { class: 'wrap col', style: { gap: '8px', paddingTop: '8px', paddingBottom: '12px' } }, [
          bl,
          h('div', { class: 'bigs' }, [
            ['big--gold', 'ごはん', 'bowl', '#4a3b32', function () { MQ.ui.care.open(); }],
            ['big--green', 'あそぶ', 'ball', '#fbf4e4', function () { MQ.ui.play.open(); }],
            ['big--clay', 'おみせ', 'shop', '#fbf4e4', function () { MQ.ui.shop.open(); }],
            ['big--blue', 'くらべっこ', 'scale', '#fbf4e4', function () { MQ.ui.kurabe.open(); }],
            ['big--pink', 'もじ', 'moji', '#fbf4e4', function () { MQ.ui.moji.open(); }],
            ['big--teal', 'とけい', 'clock', '#fbf4e4', function () { MQ.ui.tokei.open(); }]
          ].map(function (it) {   // 3つずつ 2段（v0.1.13 で 5つに なった）
            return h('div', { class: 'bigs__it' }, [h('button', { class: 'big ' + it[0], type: 'button', 'aria-label': it[1], html: MQ.ui.SVG[it[2]], style: { color: it[3] }, onclick: go(it[4]) }), h('span', { text: it[1] })]);
          })),
          /* v0.2：おえかき（A）・さがしもの（C）・まねっこ（B）・おはなし（E） */
          h('div', { class: 'pills' }, [
            ['pill--rose', 'おえかき', 'crayon', function () { MQ.ui.kaku.open(); }],
            ['pill--sky', 'さがす', 'lens', function () { MQ.ui.sagasu.open(); }],
            ['pill--lime', 'まねっこ', 'mic', function () { MQ.ui.maneko.open(); }],
            ['pill--night', 'おはなし', 'book', function () { MQ.ui.ohanashi.open(); }]
          ].map(function (it) {
            return h('button', { class: 'pill ' + it[0], type: 'button', 'aria-label': it[1], onclick: go(it[3]) }, [h('span', { class: 'pill__ico', html: MQ.ui.SVG[it[2]] }), h('span', { class: 'pill__tx', text: it[1] })]);
          }))
        ])
      ]);
      MQ.ui.mount('screen-home', page);
      MQ.ui.show('screen-home');
      const greet = function () {
        bl.say(greeting(), function () {
          // B（v0.2）：おうちの人の 声（1日 1回）。誕生日 → おはよう の じゅん
          const day = MQ.save.today();
          if (se.birthday && MQ.family.once('birthday', day)) return;
          if (new Date().getHours() < 11) MQ.family.once('morning', day);
        });
        if (se.birthday) { MQ.ui.confetti(scene, 30); try { MQ.bgm.play('birthday'); } catch (e) { /* なし */ } }
        // はじめての 子：「ごはん」に ゆびの しるし（どこから はじめるか 見て わかる・さわると きえる）
        if (MQ.save.stampsTotal() === 0 && !MQ.save.helpCount()) {
          const it = page.querySelector('.bigs__it');
          if (it && !it.querySelector('.finger')) { it.style.position = 'relative'; it.appendChild(h('div', { class: 'finger finger--home' })); }
        }
      };
      // はじめての 案内（おうちの人むけ・1回だけ）。とじてから あいさつ
      if (MQ.ui.guide && MQ.ui.guide.shouldShow() && !opts.noGuide) setTimeout(function () { MQ.ui.guide.open({ onClose: function () { setTimeout(greet, 200); } }); }, 300);
      else setTimeout(greet, 250);
      // テスト用（harness）：反応を 外から 起こす
      MQ.ui.home._t = { mon: mon, scene: scene, bl: bl, react: react, onTap: onTap, sleep: function () { mon.sleep(); }, idle: armIdle, letter: letter, friend: friend, season: se };
    }
  };

  /* ---- できた！（スタンプ・ときどき おおきく なる） ---- */
  MQ.ui.done = {
    open: function (opts) {
      opts = opts || {};
      clearIdle();
      const kid = MQ.save.kid();
      const nm = kid && kid.mon ? kid.mon.name : '';
      const mon = MQ.ui.monNode(180);
      const stamps = MQ.ui.stampRow();
      const bl = MQ.ui.balloon('');
      const box = h('div', { class: 'wrap done', style: { position: 'relative', paddingTop: '36px' } }, [
        h('p', { class: 'done__big', text: opts.grew ? 'おおきく なった！' : 'できた！' }),
        mon,
        stamps,
        bl,
        h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'おうちへ', onclick: function () { MQ.sfx.tap(); MQ.ui.home.open(); } }),
        MQ.ui.hintBox('スタンプは 1日 5こまで。' + (MQ.save.nextGrowAt() ? 'ぜんぶで ' + MQ.save.nextGrowAt() + 'こ で すがたが かわります（いま ' + MQ.save.stampsTotal() + 'こ）' : 'いちばん 大きな すがたに なりました') + '。スタンプが ふえると おうちの にわに はなや ちょうちょが ふえます')
      ]);
      const page = h('div', { class: 'page' }, [box]);
      MQ.ui.mount('screen-done', page);
      MQ.ui.show('screen-done');
      MQ.sfx.clear();
      mon.mood('happy', 1400);
      MQ.ui.confetti(box, 26);
      const n = MQ.save.stampsToday();
      setTimeout(function () {
        // 名前は 声には 入れない（録音した 声（ずんだもん）に 名前は 無い ので、voice.js が 名前を 外して 読む）
        bl.say(opts.grew ? ('わあ！ ' + nm + 'が おおきく なった！ ありがとう！') : ('できた！ スタンプ ' + MQ.tasks.num(n) + 'め！ ' + nm + 'も うれしいよ！'));
      }, 300);
    }
  };
})();
