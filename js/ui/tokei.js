/* ---------------------------------------------------------
   とけい（ころたま v0.1.14・⑤）
   ユーザー 2026-10-09「次をお願い致します」（④の つぎ＝⑤とけい）。6つめの あそび。4つの 段階 ぜんぶ（もんだいは tasks.clock）。
   身に つく こと：
     ちいさい   … あさ・ひる・よる（そらの ようすで 見わける）
     なかくらい … あさ・ひる・よる と 一日の じゅんばん（あさの つぎは ひる）
     おおきい   … ちょうどの 時刻（みじかい はり＝なんじ・ながい はりが うえの 12）
     ねんちょう … 「はん」（ながい はりが したの 6・みじかい はりは 数字の あいだ）と 時計を 読む
   とけいの はり：みじかい はり＝こげ茶・ながい はり＝オレンジ（色で 見わけ やすく）。
   ばつなし：1回め＝見る ところを 教える／2回め＝声で 答え＋正解が 光る。3回で できた！
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.tokei = (function () {
  const h = MQ.util.h;
  let round = 0, task = null, misses = 0, busy = false;
  let els = {};

  /* アナログ時計（SVG）。c＝{ h, half, swapOf }。swapOf＝はりを ぎゃくに した まちがいの 時計 */
  function clockSvg(c) {
    let s = '<svg viewBox="0 0 100 100" class="clk">';
    s += '<circle cx="50" cy="50" r="46" fill="#fffdf7" stroke="#c9955a" stroke-width="5"/>';
    for (let i = 0; i < 60; i += 5) { const a = i * 6 * Math.PI / 180; s += '<line x1="' + (50 + 41 * Math.sin(a)).toFixed(1) + '" y1="' + (50 - 41 * Math.cos(a)).toFixed(1) + '" x2="' + (50 + 44 * Math.sin(a)).toFixed(1) + '" y2="' + (50 - 44 * Math.cos(a)).toFixed(1) + '" stroke="#c9b48c" stroke-width="2"/>'; }
    for (let n = 1; n <= 12; n++) { const a = n * 30 * Math.PI / 180; s += '<text x="' + (50 + 34 * Math.sin(a)).toFixed(1) + '" y="' + (50 - 34 * Math.cos(a) + 4.2).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#4a3b32" font-family="sans-serif">' + n + '</text>'; }
    const hourA = c.swapOf ? 0 : ((c.h % 12) + (c.half ? 0.5 : 0)) * 30;
    const minA = c.swapOf ? (c.swapOf % 12) * 30 : (c.half ? 180 : 0);
    function hand(deg, len, w, col) { const a = deg * Math.PI / 180; return '<line x1="50" y1="50" x2="' + (50 + len * Math.sin(a)).toFixed(1) + '" y2="' + (50 - len * Math.cos(a)).toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }
    s += hand(minA, 28, 4.5, '#e07a3a') + hand(hourA, 19, 7, '#4a3b32');
    s += '<circle cx="50" cy="50" r="4.5" fill="#4a3b32"/></svg>';
    return s;
  }
  /* あさ・ひる・よる の そら（SVG） */
  function daySvg(id) {
    const sky = { asa: '#ffd9a8', hiru: '#9fd0f2', yoru: '#2c3a6b' }[id];
    let s = '<svg viewBox="0 0 100 80" class="day"><rect x="0" y="0" width="100" height="80" rx="12" fill="' + sky + '"/>';
    if (id === 'asa') s += '<rect x="0" y="40" width="100" height="14" fill="#ffe9c9"/><circle cx="30" cy="56" r="14" fill="#f49a2e"/>';
    if (id === 'hiru') s += '<circle cx="50" cy="20" r="12" fill="#f2c94c"/><ellipse cx="22" cy="34" rx="12" ry="6" fill="#fff"/><ellipse cx="80" cy="30" rx="10" ry="5" fill="#fff"/>';
    if (id === 'yoru') s += '<circle cx="66" cy="22" r="11" fill="#fff3b0"/><circle cx="72" cy="18" r="10" fill="' + sky + '"/>' + [[18, 14], [34, 28], [84, 40], [12, 40], [48, 12]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="#fff3b0"/>'; }).join('');
    s += '<path d="M0 58 Q 30 50 60 58 T 100 56 V 68 a12 12 0 0 1 -12 12 H 12 a12 12 0 0 1 -12 -12 Z" fill="' + (id === 'yoru' ? '#3e5a3a' : '#7fb069') + '"/>';
    if (id === 'yoru') s += '<rect x="66" y="48" width="18" height="14" fill="#6b5a4a"/><rect x="72" y="52" width="6" height="6" fill="#ffe08a"/><path d="M63 49 L75 40 L87 49 Z" fill="#8a4a3a"/>';
    else s += '<rect x="66" y="48" width="18" height="14" fill="#e3b98a"/><rect x="72" y="52" width="6" height="6" fill="#9fc3e6"/><path d="M63 49 L75 40 L87 49 Z" fill="#d2765c"/>';
    return s + '</svg>';
  }
  function timeText(c) { return c.h + 'じ' + (c.half ? 'はん' : ''); }

  function open() { round = 0; next(); }
  function next() {
    task = MQ.tasks.clock(MQ.save.kid().stage);
    misses = 0; busy = false;
    render();
    setTimeout(function () { els.bl.say(task.line); }, 250);
  }
  function pick(o, b) {
    if (busy) return;
    if (!o.ok) {
      MQ.sfx.tap();
      b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
      els.mon.mood('sad');
      misses++;
      if (misses >= 2) els.btns.forEach(function (x, i) { if (task.options[i].ok) x.classList.add('is-glow'); });
      els.bl.say(misses === 1 ? task.wrong1(o) : task.wrong2(o));
      return;
    }
    busy = true;
    b.classList.add('is-ok');
    MQ.sfx.correct();
    els.mon.mood('happy', 1400);
    els.bl.say(task.ok, function () {
      round++;
      if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('tokei');
      else next();
    });
  }
  function stageNode() {
    if (task.mode === 'next') return h('div', { class: 'tshow' }, [h('div', { class: 'tcardbig', html: daySvg(task.from.id) }), h('div', { class: 'tarrow' }), h('div', { class: 'tq', text: '？' })]);
    if (task.mode === 'read') return h('div', { class: 'tshow' }, [h('div', { class: 'tclockbig', html: clockSvg(task.ans) })]);
    return null;
  }
  function answersNode() {
    const t = task;
    const btns = t.options.map(function (o) {
      let b;
      if (o.day) b = h('button', { class: 'toy tday', type: 'button', 'aria-label': o.day.name, html: daySvg(o.day.id) });
      else if (t.mode === 'read') b = h('button', { class: 'ttext', type: 'button', 'aria-label': timeText(o.clock) }, [h('span', { text: timeText(o.clock) })]);
      else b = h('button', { class: 'toy tclock', type: 'button', 'aria-label': timeText(o.clock), html: clockSvg(o.clock) });
      b.onclick = function () { pick(o, b); };
      return b;
    });
    els.btns = btns;
    if (t.mode === 'read') return h('div', { class: 'ttexts' }, btns);
    return h('div', { class: 'toys' + (btns.length >= 3 ? ' toys--many' : '') + (t.mode === 'hour' || t.mode === 'pick' ? ' toys--clock' : '') }, btns);
  }
  function hintText() {
    const t = task;
    if (t.mode === 'day') return 'そらの 色・おひさま・おつきさまを 見て えらびます。「いま は あさ？ よる？」と 毎日の 話にも つなげてみて';
    if (t.mode === 'next') return '一日の じゅんばん（あさ → ひる → よる → また あさ）。「あさ ごはんの つぎは？」と 生活の 話に つなげてみて';
    if (t.mode === 'hour' || !t.ans.half) return 'みじかい はり（こげ茶）が「なんじ」、ながい はり（オレンジ）が うえの 12 で ちょうど。はりを ぎゃくに した 時計も まざって います';
    return 'ながい はり（オレンジ）が したの 6 なら「はん」。そのとき みじかい はりは 数字と 数字の あいだに あります。本物の 時計でも いっしょに 見てみて';
  }
  function render() {
    const mon = MQ.ui.monNode(130);
    const bl = MQ.ui.balloon('');
    els = { mon: mon, bl: bl };
    mon.addEventListener('click', function () { MQ.sfx.tap(); mon.mood('happy'); });
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(task.line); } }),
      h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '26px', top: '40px' } }, [mon]),
        h('div', { style: { position: 'absolute', left: '176px', top: '20px', width: '204px' } }, [bl])
      ]),
      h('div', { class: 'wrap col', style: { gap: '14px', paddingTop: '8px' } }, [stageNode(), answersNode(), MQ.ui.hintBox(hintText())])
    ]);
    MQ.ui.mount('screen-tokei', page);
    MQ.ui.show('screen-tokei');
  }
  return { open: open, next: next, clockSvg: clockSvg, daySvg: daySvg, state: function () { return { round: round, task: task, misses: misses }; } };
})();
