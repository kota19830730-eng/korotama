/* ---------------------------------------------------------
   あそぶ（かたち）：「まるい おもちゃは どれ？」（まなびたまご）
   おもちゃを タップ → 合って いれば 生きものが よろこぶ／ちがえば 声で 教えて もう一度。3回で できた！
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.play = (function () {
  const h = MQ.util.h;
  let round = 0, task = null, busy = false;
  let els = {};

  function open() { round = 0; next(); }
  function next() {
    const kid = MQ.save.kid();
    task = MQ.tasks.shape(kid.stage);
    busy = false;
    render();
    setTimeout(function () { els.bl.say(task.line); }, 250);
  }
  function render() {
    const mon = MQ.ui.monNode(130);
    const bl = MQ.ui.balloon('');
    els = { mon: mon, bl: bl };
    mon.addEventListener('click', function () { MQ.sfx.tap(); mon.mood('happy'); });
    const toys = h('div', { class: 'toys' + (task.options.length >= 5 ? ' toys--many' : '') });
    task.options.forEach(function (o) {
      const b = h('button', { class: 'toy', type: 'button', 'aria-label': (o.color ? o.color.say + 'の ' : '') + o.shape.name }, [MQ.ui.shapeNode(o.shape.id, o.color)]);
      b.onclick = function () {
        if (busy) return;
        if (!o.ok) {
          MQ.sfx.tap();
          b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
          mon.mood('sad');
          bl.say(task.wrong(o));
          return;
        }
        busy = true;
        b.classList.add('is-ok');
        MQ.sfx.correct();
        mon.mood('happy', 1400);
        bl.say(task.ok, function () {
          round++;
          if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('shape');
          else next();
        });
      };
      toys.appendChild(b);
    });
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(task.line); } }),
      h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '26px', top: '40px' } }, [mon]),
        h('div', { style: { position: 'absolute', left: '176px', top: '20px', width: '204px' } }, [bl])
      ]),
      h('div', { class: 'wrap col', style: { gap: '14px', paddingTop: '8px' } }, [
        toys,
        MQ.ui.hintBox('「まるは どれ？」と ゆびで さして あげても OK。ちがう ときは 声で 教えます')
      ])
    ]);
    MQ.ui.mount('screen-play', page);
    MQ.ui.show('screen-play');
  }
  return { open: open, next: next, state: function () { return { round: round, task: task }; } };
})();
