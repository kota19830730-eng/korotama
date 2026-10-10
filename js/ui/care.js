/* ---------------------------------------------------------
   ごはん（かず）：「りんごを みっつ ちょうだい」（ころたま）
   かごから タップで おさらへ（ドラッグは 3さいには むずかしい）。おさらの ものを タップすると かごへ もどる。
   かごには ほかの 食べものも まざって いる（v0.1.10）。ちがう ものを おすと のせずに「それは みかんだね。りんごを …」と 声で 教える（ばつなし）。
   ちいさい・なかくらい＝おさらに くぼみ（N こ）→ ぜんぶ うまったら 正解。
   おおきい＝くぼみなし → 生きものを タップして「あげる」→ 多い／少ない を 声で 教える。
   3回で できた！
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.care = (function () {
  const h = MQ.util.h;
  let round = 0, task = null, placed = 0, busy = false;
  let els = {};

  function open() {
    if (MQ.save.kid() && MQ.save.kid().stage === 'k') { MQ.ui.kazu.open('count'); return; }   // ねんちょう＝あわせる・わける（kazu.js）
    round = 0;
    next();
  }
  function next() {
    const kid = MQ.save.kid();
    task = MQ.tasks.count(kid.stage);
    placed = 0; busy = false;
    render();
    setTimeout(function () { els.bl.say(task.line, null, foodPics(task.n)); }, 250);
  }
  function foodPics(n) {
    const list = [];
    for (let i = 0; i < n; i++) list.push(h('span', { style: { display: 'inline-block', transform: 'scale(.45)', margin: '-14px', width: '52px', height: '52px' } }, [MQ.ui.foodNode(task.food.id)]));
    return list;
  }
  function render() {
    const mon = MQ.ui.monNode(130);
    const bl = MQ.ui.balloon('');
    const plate = h('div', { class: 'plate' });
    const basket = h('div', { class: 'basket' });
    els = { mon: mon, bl: bl, plate: plate, basket: basket };
    paint();
    const kid = MQ.save.kid();
    mon.addEventListener('click', function () {
      if (busy) return;
      if (!task.slots) { MQ.sfx.tap(); judge(); }   // おおきい：生きものを タップ ＝ あげる
      else MQ.ui.quietTap(mon);   // もんだい中は うなずく/首を かしげる だけ（C・v0.1.16）
    });
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(task.line, null, foodPics(task.n)); } }),
      h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '26px', top: '40px' } }, [mon]),
        h('div', { style: { position: 'absolute', left: '176px', top: '20px', width: '204px' } }, [bl])
      ]),
      h('div', { class: 'wrap col', style: { gap: '14px', paddingTop: '8px' } }, [
        plate, basket,
        MQ.ui.hintBox((task.slots ? '「' + task.food.name + 'は どれ？」と えらんでから「いち、に、さん」と かぞえて。くぼみが ぜんぶ うまると 正解です' : '「' + task.food.name + 'だけ」を おさらに のせたら、生きものを タップして「あげる」。多い・少ないは 声で 教えます') + '。ちがう 食べものを おしても 声で 教えます')
      ])
    ]);
    MQ.ui.mount('screen-care', page);
    MQ.ui.show('screen-care');
  }
  function paint() {
    const plate = els.plate, basket = els.basket;
    plate.innerHTML = ''; basket.innerHTML = '';
    basket.classList.toggle('is-many', task.basket.length > 10);
    plate.classList.toggle('is-many', Math.max(task.slots ? task.n : 0, placed) > 6);
    const slots = task.slots ? task.n : Math.max(placed, 0);
    for (let i = 0; i < Math.max(slots, placed); i++) {
      const full = i < placed;
      const s = h('button', { class: 'slot' + (full ? ' is-full' : ''), type: 'button', 'aria-label': full ? 'もどす' : 'くぼみ' }, [full ? MQ.ui.foodNode(task.food.id) : null]);
      if (full) s.onclick = function () { if (busy) return; MQ.sfx.tap(); placed--; paint(); };
      plate.appendChild(s);
    }
    if (!task.slots && !placed) plate.appendChild(h('div', { class: 'note', text: 'おさら' }));
    let left = placed;   // おさらに のせた ぶんだけ、かごの ほしい 食べものを へらす
    task.basket.forEach(function (id) {
      if (id === task.food.id && left > 0) { left--; return; }
      const f = MQ.tasks.foodById(id) || task.food;
      const b = h('button', { class: 'item', type: 'button', 'aria-label': f.name }, [MQ.ui.foodNode(id)]);
      b.onclick = function () {
        if (busy) return;
        if (id !== task.food.id) {   // ちがう 食べもの：のせない・声で 教える
          MQ.sfx.tap();
          els.mon.mood('sad');
          els.bl.say(task.wrong(f), null, foodPics(task.n));
          return;
        }
        if (task.slots && placed >= task.n) return;
        MQ.sfx.tap();
        placed++;
        plate.classList.remove('is-pop'); void plate.offsetWidth; plate.classList.add('is-pop');
        paint();
        if (task.slots && placed === task.n) judge();
      };
      basket.appendChild(b);
    });
  }
  function judge() {
    if (busy) return;
    if (placed === task.n) {
      busy = true;
      MQ.sfx.correct();
      els.mon.mood('eat', 1500);
      els.bl.say(task.ok, function () {
        round++;
        if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('count');
        else next();
      });
      return;
    }
    els.mon.mood('sad');
    if (placed < task.n) els.bl.say(placed === 0 ? task.line : task.more, null, foodPics(task.n));
    else els.bl.say(task.over, null, foodPics(task.n));
  }
  return { open: open, next: next, state: function () { return { round: round, task: task, placed: placed }; } };
})();
