/* ---------------------------------------------------------
   おうち（ホーム）と できた！（ころたま）
     MQ.ui.home.open()
     MQ.ui.done.open({ grew })
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

  MQ.ui.home = {
    open: function () {
      MQ.ui.stopSpeak();
      const kid = MQ.save.kid();
      if (!kid || !kid.mon) { MQ.ui.start.open(); return; }
      const SH = 296;   // ボタンが 2段に なった ので 少し ひくく（v0.1.13）
      const scene = MQ.ui.sceneNode(SH);
      const mon = MQ.ui.monNode(160);
      scene.appendChild(h('div', { style: { position: 'absolute', left: '226px', top: (SH - 166) + 'px' } }, [mon]));
      const bl = MQ.ui.balloon('');
      scene.appendChild(h('div', { style: { position: 'absolute', left: '14px', top: '34px', width: '210px' } }, [bl]));
      mon.addEventListener('click', function () { MQ.sfx.tap(); mon.mood('happy'); bl.say(MQ.util.pick(['えへへ！', 'くすぐったい！', 'だいすき！', 'いっしょに あそぼう！'])); });
      const go = function (fn) { return function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); fn(); }; };
      const page = h('div', { class: 'page' }, [
        MQ.ui.topBar({}),
        scene,
        h('div', { class: 'wrap col', style: { gap: '12px', paddingTop: '14px' } }, [
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
          MQ.ui.hintBox('いっしょに「どれに する？」と きいてみて')
        ])
      ]);
      MQ.ui.mount('screen-home', page);
      MQ.ui.show('screen-home');
      setTimeout(function () { bl.say(greeting()); }, 250);
    }
  };

  /* ---- できた！（スタンプ・ときどき おおきく なる） ---- */
  MQ.ui.done = {
    open: function (opts) {
      opts = opts || {};
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
        MQ.ui.hintBox('スタンプは 1日 5こまで。' + (MQ.save.nextGrowAt() ? 'ぜんぶで ' + MQ.save.nextGrowAt() + 'こ で すがたが かわります（いま ' + MQ.save.stampsTotal() + 'こ）' : 'いちばん 大きな すがたに なりました'))
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
