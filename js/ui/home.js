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
    wake: ['はっ！ おきたよ！', 'ふぁ… おはよう！']
  };
  /* </lines> */
  const TAPS = ['happy', 'jump', 'spin', 'shy', 'yawn'];
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
      const scene = MQ.ui.sceneNode(SH, { live: true, night: opts.night, decor: MQ.save.stampsTotal(), say: sayIfFree });
      const mon = MQ.ui.monNode(160);
      const monBox = h('div', { style: { position: 'absolute', left: '226px', top: (SH - 166) + 'px' } }, [mon]);
      scene.appendChild(monBox);

      /* ---- A：キャラクターの 反応 ---- */
      let taps = [], last = '';
      function pickKind() { let k; do { k = MQ.util.pick(TAPS); } while (k === last && TAPS.length > 1); last = k; return k; }
      function react(kind, line) {
        clearIdle(); armIdle();
        if (mon.isAsleep()) { kind = 'wake'; }
        mon.mood(kind);
        if (kind === 'shy') mon.blush();
        if (kind === 'pat') mon.hearts(5);
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
          MQ.ui.hintBox('おひさま・くも・き・いえ・おかも さわると うごきます')
        ])
      ]);
      MQ.ui.mount('screen-home', page);
      MQ.ui.show('screen-home');
      setTimeout(function () { bl.say(greeting()); }, 250);
      // テスト用（harness）：反応を 外から 起こす
      MQ.ui.home._t = { mon: mon, scene: scene, bl: bl, react: react, onTap: onTap, sleep: function () { mon.sleep(); }, idle: armIdle };
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
