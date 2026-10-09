/* ---------------------------------------------------------
   ねんちょう（6さい）の かず（ころたま v0.1.11）
   ユーザー決定 2026-10-09「オススメで」＝4つめの 段階「ねんちょう」に
     ごはん＝かずの あわせる・わける（小1の たし算・ひき算の 手まえ）
     おみせ＝すうじを よむ（数と 数字を むすぶ・1〜20）
   身に つく こと：
     あわせる「りんご ふたつと みかん みっつ、ぜんぶで いくつ？」→ 2つの まとまりを 1つに して 数える
     わける「クッキー いつつ。ふたつ たべたら のこりは？」→ へった あとの 数（食べた ぶんは うすく 見える）
     すうじ「じゅうよんの はこを ください」→ 聞いた 数の 数字を さがす／ケーキの 数と 同じ 数字
   こたえは 数字の ふだ（3〜4まい）を タップ。ばつなし：1回め＝ゆびで かぞえる ように さそう、2回め＝声で 答えを 教える。
   おさら／トレイの ものを タッチすると「いち、に、さん」と 番号が つく（1対1で かぞえる）。ぜんぶ ついたら つぎの タッチで 消える。
   ごはん・おみせの 画面（screen-care／screen-shop）を そのまま 使う。3回で できた！
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.kazu = (function () {
  const h = MQ.util.h;
  let kind = 'count', round = 0, task = null, misses = 0, busy = false, counted = 0, introT = null;
  let els = {};

  function screenId() { return kind === 'count' ? 'screen-care' : 'screen-shop'; }
  function open(k) { kind = k === 'color' ? 'color' : 'count'; round = 0; next(); }
  function next() {
    clearTimeout(introT);
    task = kind === 'count' ? MQ.tasks.sum() : MQ.tasks.numeral();
    misses = 0; busy = false; counted = 0;
    render();
    introT = setTimeout(intro, 250);
  }
  /* わける：まず ぜんぶ 見せて「いつつ あるよ」→ 生きものが 食べる → うすく なって「のこりは いくつ？」 */
  function intro() {
    if (task.mode !== 'take') { els.bl.say(task.line); return; }
    busy = true;
    els.bl.say(task.line1, function () {
      if (!els.tray) return;
      els.mon.mood('eat', 1500);
      MQ.sfx.tap();
      els.tray.querySelectorAll('.cnt.is-gone').forEach(function (b) { b.classList.add('is-eaten'); });
      busy = false;
      els.bl.say(task.line2);
    });
  }
  function replay() {
    if (task.mode === 'take' && !els.tray.querySelector('.is-eaten')) return;
    els.bl.say(task.line);
  }
  /* タッチで かぞえる */
  function countBtn(node, label, gone) {
    const b = h('button', { class: 'item cnt' + (gone ? ' is-gone' : ''), type: 'button', 'aria-label': label }, [node, h('b', { class: 'cnt__n' })]);
    b.onclick = function () {
      if (b.classList.contains('is-eaten') || busy) return;
      const all = Array.prototype.slice.call(els.tray.querySelectorAll('.cnt:not(.is-eaten)'));
      if (b.classList.contains('is-on')) {
        if (counted < all.length) return;            // とちゅうで 同じのを おした ときは なにも しない
        all.forEach(function (x) { x.classList.remove('is-on'); x.querySelector('.cnt__n').textContent = ''; });
        counted = 0;
        MQ.sfx.tap();
        return;
      }
      counted++;
      b.classList.add('is-on');
      b.querySelector('.cnt__n').textContent = String(counted);
      MQ.sfx.tap();
      MQ.ui.speak(MQ.tasks.read(counted));
    };
    return b;
  }
  function trayNode() {
    const t = task;
    if (t.kind === 'sum' && t.mode === 'add') {
      const tray = h('div', { class: 'plate tray2' + (t.ans > 6 ? ' is-many' : '') });
      [[t.foodA, t.a], [t.foodB, t.b]].forEach(function (g) {
        const grp = h('div', { class: 'grp' });
        for (let i = 0; i < g[1]; i++) grp.appendChild(countBtn(MQ.ui.foodNode(g[0].id), g[0].name));
        tray.appendChild(grp);
      });
      return tray;
    }
    if (t.kind === 'sum') {
      const tray = h('div', { class: 'plate' + (t.n > 6 ? ' is-many' : '') });
      for (let i = 0; i < t.n; i++) tray.appendChild(countBtn(MQ.ui.foodNode(t.food.id), t.food.name, i >= t.n - t.k));
      return tray;
    }
    if (t.mode === 'see') {
      const tray = h('div', { class: 'box tray5' });
      for (let i = 0; i < t.ans; i++) tray.appendChild(countBtn(MQ.ui.thingNode(t.thing.id, t.color), t.thing.name));
      return tray;
    }
    return null;
  }
  function cardsNode() {
    const row = h('div', { class: 'numcards' + (task.choices.length === 4 ? ' numcards--4' : '') + (task.mode === 'hear' ? ' numcards--box' : '') });
    task.choices.forEach(function (v) {
      const style = task.mode === 'hear' ? { '--c': task.color.hex, '--d': task.color.dark } : null;
      const b = h('button', { class: 'numcard', type: 'button', 'aria-label': String(v), 'data-v': String(v), style: style }, [h('span', { text: String(v) })]);
      b.onclick = function () { pick(v, b); };
      row.appendChild(b);
    });
    return row;
  }
  function pick(v, b) {
    if (busy) return;
    if (v !== task.ans) {
      MQ.sfx.tap();
      b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
      b.classList.add('is-no');
      if (els.mon) els.mon.mood('sad');
      misses++;
      els.bl.say(misses === 1 ? task.wrong1(v) : task.wrong2(v));
      return;
    }
    busy = true;
    b.classList.add('is-ok');
    MQ.sfx.correct();
    if (els.mon) els.mon.mood(kind === 'count' ? 'eat' : 'happy', 1500);
    else MQ.ui.confetti(els.wrap, 16);
    els.bl.say(task.ok, function () {
      round++;
      if (round >= MQ.tasks.ROUNDS) MQ.ui.finish(kind);
      else next();
    });
  }
  function hintText() {
    const t = task;
    if (t.mode === 'add') return '「ぜんぶで いくつ？」。食べものを タッチすると「いち、に、さん」と かぞえます。2つの まとまりを 1つに して 数えて、数字の ふだを えらびます';
    if (t.mode === 'take') return '食べた ぶんは うすく なります。のこって いる ものを タッチして かぞえ、数字の ふだを えらびます（ひき算の 手まえ）';
    if (t.mode === 'hear') return '聞いた 数の 数字を さがします。10より 大きい 数は 2回 まちがえると「14は 1と 4」と 書き方を 教えます';
    return t.thing.name + 'を タッチして かぞえてから、同じ 数字の ふだを えらびます（数と 数字を むすぶ）';
  }
  function render() {
    const bl = MQ.ui.balloon('');
    const tray = trayNode();
    const wrap = h('div', { class: 'wrap col', style: { gap: '14px', paddingTop: kind === 'count' ? '8px' : '0' } }, [tray, cardsNode(), MQ.ui.hintBox(hintText())]);
    let mon = null, top;
    if (kind === 'count') {
      mon = MQ.ui.monNode(130);
      mon.addEventListener('click', function () { MQ.sfx.tap(); mon.mood('happy'); });
      top = [h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '26px', top: '40px' } }, [mon]),
        h('div', { style: { position: 'absolute', left: '176px', top: '20px', width: '204px' } }, [bl])
      ])];
    } else {
      top = [h('div', { class: 'awning' }), h('div', { class: 'awning2' }), h('div', { class: 'field2' }, [
        h('div', { style: { position: 'absolute', left: '20px', top: '40px' } }, [MQ.ui.shop.customer(round)]),
        h('div', { style: { position: 'absolute', left: '166px', top: '26px', width: '214px' } }, [bl])
      ])];
    }
    els = { bl: bl, mon: mon, tray: tray, wrap: wrap };
    const page = h('div', { class: 'page' }, [MQ.ui.topBar({ home: true, replay: replay })].concat(top, [wrap]));
    MQ.ui.mount(screenId(), page);
    MQ.ui.show(screenId());
  }
  return { open: open, next: next, state: function () { return { kind: kind, round: round, task: task, misses: misses, counted: counted }; } };
})();
