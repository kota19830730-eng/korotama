/* ---------------------------------------------------------
   おうち（ホーム）と できた！（まなびたまご）
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
      const scene = MQ.ui.sceneNode(400);
      const mon = MQ.ui.monNode(160);
      scene.appendChild(h('div', { style: { position: 'absolute', left: '120px', top: '236px' } }, [mon]));
      const bl = MQ.ui.balloon('');
      scene.appendChild(h('div', { style: { position: 'absolute', left: '118px', top: '70px', width: '262px' } }, [bl]));
      mon.addEventListener('click', function () { MQ.sfx.tap(); mon.mood('happy'); bl.say(MQ.util.pick(['えへへ！', 'くすぐったい！', 'だいすき！', 'いっしょに あそぼう！'])); });
      const go = function (fn) { return function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); fn(); }; };
      const page = h('div', { class: 'page' }, [
        MQ.ui.topBar({}),
        scene,
        h('div', { class: 'wrap col', style: { gap: '12px', paddingTop: '22px' } }, [
          h('div', { class: 'bigs' }, [
            h('button', { class: 'big big--gold', type: 'button', 'aria-label': 'ごはん', html: MQ.ui.SVG.bowl, style: { color: '#4a3b32' }, onclick: go(function () { MQ.ui.care.open(); }) }),
            h('button', { class: 'big big--green', type: 'button', 'aria-label': 'あそぶ', html: MQ.ui.SVG.ball, style: { color: '#fbf4e4' }, onclick: go(function () { MQ.ui.play.open(); }) }),
            h('button', { class: 'big big--clay', type: 'button', 'aria-label': 'おみせ', html: MQ.ui.SVG.shop, style: { color: '#fbf4e4' }, onclick: go(function () { MQ.ui.shop.open(); }) })
          ]),
          h('div', { class: 'bigs__labels' }, [h('span', { text: 'ごはん' }), h('span', { text: 'あそぶ' }), h('span', { text: 'おみせ' })]),
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
        bl.say(opts.grew ? ('わあ！ ' + nm + 'が おおきく なった！ ありがとう！') : ('できた！ スタンプ ' + MQ.tasks.num(n) + 'め！ ' + nm + 'も うれしいって！'));
      }, 300);
    }
  };
})();
