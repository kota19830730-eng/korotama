/* ---------------------------------------------------------
   おやすみの 画面（ころたま v0.3・C1 遊ぶ 時間の めやす・2026-10-11）
   おうちの人が きめた 時間を こえて おうちに もどると、ここに なる（home.open が よぶ）。
   とりあげるのでは なく「生きものが 先に ねむる」。おやすみの おはなしは 聞ける。
   続ける ときは おうちの人が かぎ → 「今日だけ あと10分」。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.rest = (function () {
  const h = MQ.util.h;
  function open() {
    MQ.ui.stopSpeak();
    const R = MQ.coach.REST;
    const scene = MQ.ui.sceneNode(300, { night: true });
    const mon = MQ.ui.monNode(160);
    scene.appendChild(h('div', { style: { position: 'absolute', left: '200px', top: '128px' } }, [mon]));
    const bl = MQ.ui.balloon('');
    mon.addEventListener('click', function () { MQ.sfx.snore(); bl.say(R.tapSleep); });
    const limit = Number(MQ.save.settings().timeLimit) || 0;
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({}),
      scene,
      h('div', { class: 'wrap col', style: { gap: '14px', paddingTop: '12px', alignItems: 'center' } }, [
        bl,
        h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'おはなしを きく', onclick: function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); MQ.ui.ohanashi.open(); } }),
        MQ.ui.hintBox('きょうの 遊ぶ時間（' + limit + '分）に なりました。続ける ときは、右上の かぎを 長おしして「今日だけ あと' + MQ.coach.EXTEND_MIN + '分」を 押して ください')
      ])
    ]);
    MQ.ui.mount('screen-rest', page);
    MQ.ui.show('screen-rest');
    mon.mood('yawn');
    setTimeout(function () {
      if (MQ.ui.current !== 'screen-rest') return;
      mon.sleep();
      bl.say(R.tired + ' ' + R.sleepy + ' ' + R.bye + ' ' + R.story);
    }, 600);
    MQ.ui.rest._t = { mon: mon, bl: bl };
  }
  return { open: open };
})();
