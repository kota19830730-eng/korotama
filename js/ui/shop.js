/* ---------------------------------------------------------
   おみせ（いろ＋かず）：お客が「あかい ケーキを ふたつ ください」（ころたま）
   たなの 品を タップ → はこへ。ちがう 色は 声で「それは あおだね。あかは どれかな？」（はこには 入らない）。
   はこが いっぱいに なったら 正解。3回で できた！
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.shop = (function () {
  const h = MQ.util.h;
  let round = 0, task = null, placed = 0, busy = false;
  let els = {};
  const CUSTOMERS = [['#6f8fd6', '#4b69b0', '#9bb3ea'], ['#f08cb0', '#c45f88', '#f7b8cf'], ['#f49a2e', '#c77318', '#ffbd6b'], ['#9a6fd1', '#6f4aa8', '#bfa3e6']];

  function customerNode(i) {
    const c = CUSTOMERS[i % CUSTOMERS.length];
    return h('div', { class: 'customer' }, [
      h('i', { style: { left: '26px', top: '14px', width: '92px', height: '96px', background: c[0], boxShadow: 'inset -10px -10px 0 ' + c[1] + ', inset 8px 8px 0 ' + c[2], borderRadius: '46px 46px 10px 10px' } }),
      h('i', { style: { left: '44px', top: '44px', width: '16px', height: '20px', background: '#fffdf7' } }),
      h('i', { style: { left: '84px', top: '44px', width: '16px', height: '20px', background: '#fffdf7' } }),
      h('i', { style: { left: '50px', top: '50px', width: '8px', height: '12px', background: '#2f2a26' } }),
      h('i', { style: { left: '90px', top: '50px', width: '8px', height: '12px', background: '#2f2a26' } }),
      h('i', { style: { left: '62px', top: '80px', width: '20px', height: '8px', background: '#2f2a26', borderRadius: '0 0 8px 8px' } }),
      h('i', { style: { left: '36px', top: '108px', width: '26px', height: '16px', background: c[1] } }),
      h('i', { style: { left: '82px', top: '108px', width: '26px', height: '16px', background: c[1] } }),
      h('i', { style: { left: '30px', top: '130px', width: '84px', height: '8px', borderRadius: '50%', background: 'rgba(60,70,40,.22)' } })
    ]);
  }
  function open() {
    if (MQ.save.kid() && MQ.save.kid().stage === 'k') { MQ.ui.kazu.open('color'); return; }   // ねんちょう＝すうじを よむ（kazu.js）
    round = 0; next();
  }
  function next() {
    const kid = MQ.save.kid();
    task = MQ.tasks.shop(kid.stage);
    placed = 0; busy = false;
    render();
    setTimeout(function () { els.bl.say(task.line, null, MQ.ui.colorDots(task.want, task.n, true)); }, 250);
  }
  function render() {
    const bl = MQ.ui.balloon('');
    const shelf = h('div', { class: 'shelf' });
    const box = h('div', { class: 'box' });
    els = { bl: bl, shelf: shelf, box: box };
    paint();
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(task.line, null, MQ.ui.colorDots(task.want, task.n, true)); } }),
      h('div', { class: 'awning' }), h('div', { class: 'awning2' }),
      h('div', { class: 'field2' }, [
        h('div', { style: { position: 'absolute', left: '20px', top: '40px' } }, [customerNode(round)]),
        h('div', { style: { position: 'absolute', left: '166px', top: '26px', width: '214px' } }, [bl])
      ]),
      h('div', { class: 'wrap col', style: { gap: '12px', paddingTop: '0' } }, [
        shelf, h('div', { class: 'shelf__edge', style: { marginTop: '-12px' } }), box,
        MQ.ui.hintBox('ちがう 色を おしたら「' + task.want.say + 'は どれ？」と きいてみて。はこが いっぱいに なると お客さんが よろこびます')
      ])
    ]);
    MQ.ui.mount('screen-shop', page);
    MQ.ui.show('screen-shop');
  }
  function paint() {
    const shelf = els.shelf, box = els.box;
    shelf.innerHTML = ''; box.innerHTML = '';
    task.colors.forEach(function (c) {
      const b = h('button', { class: 'item', type: 'button', 'aria-label': c.say + 'の ' + task.thing.name, style: { width: '80px', height: '90px' } }, [MQ.ui.thingNode(task.thing.id, c)]);
      b.onclick = function () {
        if (busy) return;
        if (c.id !== task.want.id) {
          MQ.sfx.tap();
          b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
          els.bl.say(task.wrongColor(c), null, MQ.ui.colorDots(task.want, task.n, true));
          return;
        }
        MQ.sfx.coin();
        placed++;
        paint();
        if (placed >= task.n) {
          busy = true;
          MQ.sfx.correct();
          MQ.ui.confetti(box.parentNode, 16);
          els.bl.say(task.ok, function () {
            round++;
            if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('color');
            else next();
          });
        } else els.bl.say(task.more, null, MQ.ui.colorDots(task.want, task.n - placed, true));
      };
      shelf.appendChild(b);
    });
    for (let i = 0; i < task.n; i++) {
      box.appendChild(h('div', { class: 'bslot' + (i < placed ? ' is-full' : '') }, [i < placed ? MQ.ui.thingNode(task.thing.id, task.want) : null]));
    }
  }
  return { customer: customerNode, open: open, next: next, state: function () { return { round: round, task: task, placed: placed }; } };
})();
