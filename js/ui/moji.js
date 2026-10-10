/* ---------------------------------------------------------
   もじ（ころたま v0.1.13・④ ひらがな）
   ユーザー 2026-10-09「お願い致します」（③の つぎ＝④ひらがな）。5つめの あそび。4つの 段階 ぜんぶ（もんだいは tasks.hira）。
   身に つく こと：
     ちいさい   … はじめの 音を 聞きわける（字は 出さない）
     なかくらい … 音と 字を むすぶ（大きな 字を 見せる・聞いた 字を 2まいから）
     おおきい   … 絵 → はじめの 字（にた 字を まぜる）・聞いた 字を 3まいから
     ねんちょう … ことばを 読む（字を 読んで 同じ 絵）・字を ならべて ことばを つくる
   字の カード・ことばの 字を タッチすると その 字を 声で 読む（読みの おてほん）。
   ばつなし：1回め＝ヒント／2回め＝声で 答え＋正解が 光る。3回で できた！
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.moji = (function () {
  const h = MQ.util.h;
  let round = 0, task = null, misses = 0, busy = false, step = 0;
  let els = {};

  function open() { round = 0; next(); }
  function next() {
    task = MQ.tasks.hira(MQ.save.kid().stage);
    misses = 0; busy = false; step = 0;
    render();
    setTimeout(function () { els.bl.say(task.line); }, 250);
    MQ.ui.nudge.arm({ screen: 'screen-moji', busy: function () { return busy; }, say: function (t, q) { els.bl.say(q ? t + ' ' + task.line : t); },
      targets: function () { return (els.btns || []).filter(function (x, i) { return task.mode === 'build' ? task.options[i].kana === task.letters[step] && !x.disabled : task.options[i].ok; }); } });
  }
  function picNode(x, size) {
    // size＝見せたい 大きさ（px）。食べものは 52px・形は 90px の 絵を 拡大、キャラクターは まわりに あきが ある ので 1.5ばい
    if (x.food) return h('div', { class: 'mpic', style: { transform: 'scale(' + (size / 52) + ')' } }, [MQ.ui.foodNode(x.food)]);
    if (x.shape) return h('div', { class: 'mpic', style: { transform: 'scale(' + (size / 90) + ')' } }, [MQ.ui.shapeNode(x.shape, MQ.tasks.COLORS[2])]);
    return h('img', { class: 'mpic__img', src: MQ.charart.url(x.chr, 1), alt: '', style: { width: Math.round(size * 1.5) + 'px', height: Math.round(size * 1.5) + 'px' } });
  }
  function kanaCard(c, cls) { return h('button', { class: 'kana' + (cls ? ' ' + cls : ''), type: 'button', 'aria-label': c, 'data-v': c }, [h('span', { text: c })]); }
  function readOut(c) { MQ.sfx.tap(); MQ.ui.speak(c); }
  function finishOk(b) {
    busy = true;
    if (b) b.classList.add('is-ok');
    MQ.sfx.correct();
    els.mon.mood('happy', 1400);
    els.bl.say(task.ok, function () {
      round++;
      if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('moji');
      else next();
    });
  }
  function miss(o, b) {
    MQ.sfx.tap();
    b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
    els.mon.mood('sad');
    misses++;
    if (misses >= 2) els.btns.forEach(function (x, i) {
      const ok = task.mode === 'build' ? task.options[i].kana === task.letters[step] && !x.disabled : task.options[i].ok;
      if (ok) x.classList.add('is-glow');
    });
    els.bl.say(misses === 1 ? task.wrong1(o, step) : task.wrong2(o, step));
  }
  function pick(o, b) {
    if (busy) return;
    if (task.mode === 'build') {
      if (o.kana !== task.letters[step]) { miss(o, b); return; }
      b.disabled = true; b.classList.add('is-used'); b.classList.remove('is-glow');
      els.slots[step].appendChild(h('span', { text: o.kana }));
      els.slots[step].classList.add('is-full');
      step++; misses = 0;
      els.btns.forEach(function (x) { x.classList.remove('is-glow'); });
      if (step >= task.letters.length) { finishOk(null); return; }
      MQ.sfx.tap(); MQ.ui.speak(o.kana);
      return;
    }
    if (!o.ok) { miss(o, b); return; }
    finishOk(b);
  }
  function stageNode() {
    const t = task;
    if (t.mode === 'sound' && t.showLetter) return h('div', { class: 'mshow' }, [(function () { const k = kanaCard(t.letter, 'kana--big'); k.onclick = function () { readOut(t.letter); }; return k; })()]);
    if (t.mode === 'first') return h('div', { class: 'mshow' }, [h('div', { class: 'mcard' }, [picNode(t.ans, 78)])]);
    if (t.mode === 'read') {
      return h('div', { class: 'mshow mword' }, t.ans.w.split('').map(function (c) { const k = kanaCard(c, 'kana--word'); k.onclick = function () { readOut(c); }; return k; }));
    }
    if (t.mode === 'build') {
      els.slots = t.letters.map(function () { return h('div', { class: 'mslot' }); });
      return h('div', { class: 'mshow mbuild' }, [h('div', { class: 'mcard' }, [picNode(t.ans, 66)]), h('div', { class: 'mslots' }, els.slots)]);
    }
    return null;
  }
  function answersNode() {
    const t = task;
    const btns = t.options.map(function (o) {
      const b = o.word ? h('button', { class: 'toy mtoy', type: 'button', 'aria-label': o.word.w }, [picNode(o.word, t.options.length >= 3 ? 72 : 96)]) : kanaCard(o.kana);
      b.onclick = function () { pick(o, b); };
      return b;
    });
    els.btns = btns;
    if (t.options[0].word) return h('div', { class: 'toys' + (btns.length >= 3 ? ' toys--many' : '') }, btns);
    return h('div', { class: 'kanas' + (btns.length >= 4 ? ' kanas--4' : btns.length === 2 ? ' kanas--2' : '') }, btns);
  }
  function hintText() {
    const t = task;
    if (t.mode === 'sound') return t.showLetter ? '「' + t.letter + '」の 字を タッチすると 読みます。絵の 名前を いっしょに 言って、はじめの 音を くらべてみて' : '字は 出しません。絵の 名前を いっしょに ゆっくり 言って「はじめの 音」を 聞きわける 練習です';
    if (t.mode === 'hear') return '聞いた 音の 字を さがします。字の カードを まちがえても 声で 教えます';
    if (t.mode === 'first') return '「' + t.ans.w + '」の はじめの 字。形の にた 字（ね・れ／い・り など）を まぜて あります';
    if (t.mode === 'read') return '上の 字を タッチすると 1字ずつ 読みます。読めたら 同じ 絵を えらびます';
    return '字を はじめから じゅんに タッチして「' + t.ans.w + '」を つくります。1つ よけいな 字が まざって います';
  }
  function render() {
    const mon = MQ.ui.monNode(130);
    const bl = MQ.ui.balloon('');
    els = { mon: mon, bl: bl };
    mon.addEventListener('click', function () { MQ.ui.quietTap(mon); });   // もんだい中は うなずく/首を かしげる だけ（C・v0.1.16）
    const show = stageNode();
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(task.line); } }),
      h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '26px', top: '40px' } }, [mon]),
        h('div', { style: { position: 'absolute', left: '176px', top: '20px', width: '204px' } }, [bl])
      ]),
      h('div', { class: 'wrap col', style: { gap: '14px', paddingTop: '8px' } }, [show, answersNode(), MQ.ui.hintBox(hintText())])
    ]);
    MQ.ui.mount('screen-moji', page);
    MQ.ui.show('screen-moji');
  }
  return { open: open, next: next, state: function () { return { round: round, task: task, misses: misses, step: step }; } };
})();
