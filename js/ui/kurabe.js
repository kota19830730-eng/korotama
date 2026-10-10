/* ---------------------------------------------------------
   くらべっこ（ころたま v0.1.12・③ くらべる・じゅんばん）
   ユーザー 2026-10-09「つぎは ③で」「4から5歳は大丈夫？」→ 4つめの あそびに して 4つの 段階 ぜんぶで あそべる ように した。
   身に つく こと（もんだいの 中身は tasks.compare）：
     おおきい／ちいさい・ながい／みじかい（ならべて くらべる）
     おおい／すくない（数えて くらべる・ならびの 長さに だまされない）
     まえから／うしろから なんばんめ（じゅんばんの 数）
     数字の おおきい／ちいさい（1〜20）
   ばつなし：1回め＝くらべ方を さそう／2回め＝答えを 声で 教えて 正解を 光らせる（おさらには 数の 番号、ならびには 数えた 番号）。3回で できた！
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.kurabe = (function () {
  const h = MQ.util.h;
  let round = 0, task = null, misses = 0, busy = false, kids = [];
  let els = {};

  function open() { round = 0; next(); }
  function next() {
    const kid = MQ.save.kid();
    task = MQ.tasks.compare(kid.stage);
    misses = 0; busy = false;
    kids = MQ.util.sample(MQ.charart.list(), task.n || 1);
    render();
    setTimeout(function () { els.bl.say(task.line); }, 250);
  }
  function badge(el, n) {
    let b = el.querySelector('.cnt__n');
    if (!b) { b = h('b', { class: 'cnt__n' }); el.appendChild(b); }
    b.textContent = String(n);
    el.classList.add('is-on');
  }
  /* 2回め まちがえた とき：答えを 見せる */
  function teach() {
    els.btns.forEach(function (b, i) { if (task.options[i].ok) b.classList.add('is-glow'); });
    if (task.mode === 'more') {
      els.btns.forEach(function (b) { b.querySelectorAll('.cnt').forEach(function (c, i) { badge(c, i + 1); }); });
    }
    if (task.mode === 'order') {
      for (let k = 1; k <= task.ord; k++) { const pos = task.back ? task.n - k : k - 1; badge(els.btns[pos], k); }
    }
  }
  function pick(o, b) {
    if (busy) return;
    if (!o.ok) {
      MQ.sfx.tap();
      b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
      els.mon.mood('sad');
      misses++;
      if (misses >= 2) teach();
      els.bl.say(misses === 1 ? task.wrong1(o) : task.wrong2(o));
      return;
    }
    busy = true;
    b.classList.add('is-ok');
    MQ.sfx.correct();
    els.mon.mood('happy', 1400);
    els.bl.say(task.ok, function () {
      round++;
      if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('compare');
      else next();
    });
  }
  function optionNode(o, i) {
    const t = task;
    if (t.mode === 'size') {
      return h('button', { class: 'toy', type: 'button', 'aria-label': 'おおきさ ' + o.scale }, [h('div', { style: { transform: 'scale(' + o.scale + ')' } }, [MQ.ui.foodNode(t.food.id)])]);
    }
    if (t.mode === 'long') {
      return h('button', { class: 'snakebtn', type: 'button', 'aria-label': 'ながさ ' + o.scale }, [
        h('div', { class: 'snake', style: { width: Math.round(40 + o.scale * 250) + 'px', '--c': t.color.hex, '--d': t.color.dark } }, [h('i', { class: 'snake__eye' })])
      ]);
    }
    if (t.mode === 'more') {
      const items = [];
      for (let k = 0; k < o.n; k++) items.push(h('div', { class: 'cnt' }, [MQ.ui.foodNode(t.food.id)]));
      return h('button', { class: 'morepl' + (o.wide ? ' is-wide' : ''), type: 'button', 'aria-label': String(o.n) }, items);
    }
    if (t.mode === 'order') {
      return h('button', { class: 'runner cnt', type: 'button', 'aria-label': (i + 1) + 'ばん' }, [h('img', { src: MQ.charart.url(kids[i], 1), alt: '' })]);
    }
    return h('button', { class: 'numcard', type: 'button', 'aria-label': String(o.n), 'data-v': String(o.n) }, [h('span', { text: String(o.n) })]);
  }
  function answersNode() {
    const t = task;
    const btns = t.options.map(function (o, i) { const b = optionNode(o, i); b.onclick = function () { pick(o, b); }; return b; });
    els.btns = btns;
    if (t.mode === 'size') return h('div', { class: 'toys' + (btns.length >= 3 ? ' toys--many' : '') }, btns);
    if (t.mode === 'long') return h('div', { class: 'snakes' }, btns);
    if (t.mode === 'more') return h('div', { class: 'mores' }, btns);
    if (t.mode === 'order') return h('div', { class: 'race' + (t.n > 5 ? ' race--many' : '') }, [h('div', { class: 'race__flag' }), h('div', { class: 'race__row' }, btns)]);
    return h('div', { class: 'numcards numcards--2' }, btns);
  }
  function hintText() {
    const t = task;
    if (t.mode === 'size') return 'ならべて「どっちが ' + t.word + '？」。2回 まちがえると 正解が 光ります';
    if (t.mode === 'long') return 'へびの しっぽは 左で そろって います。右の はしを くらべると わかります';
    if (t.mode === 'more') return 'おさらを タッチして 答えます。わからない ときは 指で 1つずつ かぞえて くらべてみて。' + (t.options.some(function (o) { return o.wide; }) ? '少ない ほうを わざと 広く ならべて います（ならびの 長さに だまされない 練習）' : '');
    if (t.mode === 'order') return '旗の ある ほうが「まえ」です。' + (t.back ? '「うしろから」は 右の はしから かぞえます。' : '') + '指で「いち、に、さん」と かぞえてみて';
    return '2つの 数字の どちらが ' + t.word + 'か。わからない ときは「いち、に、さん…」と 数えて、あとに 出てくる ほうが 大きい と 教えてあげて';
  }
  function render() {
    const mon = MQ.ui.monNode(130);
    const bl = MQ.ui.balloon('');
    els = { mon: mon, bl: bl };
    mon.addEventListener('click', function () { MQ.ui.quietTap(mon); });   // もんだい中は うなずく/首を かしげる だけ（C・v0.1.16）
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(task.line); } }),
      h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '26px', top: '40px' } }, [mon]),
        h('div', { style: { position: 'absolute', left: '176px', top: '20px', width: '204px' } }, [bl])
      ]),
      h('div', { class: 'wrap col', style: { gap: '14px', paddingTop: '8px' } }, [answersNode(), MQ.ui.hintBox(hintText())])
    ]);
    MQ.ui.mount('screen-kurabe', page);
    MQ.ui.show('screen-kurabe');
  }
  return { open: open, next: next, state: function () { return { round: round, task: task, misses: misses }; } };
})();
