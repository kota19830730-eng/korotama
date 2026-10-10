/* ---------------------------------------------------------
   おやすみの おはなし（ころたま v0.2・E）
   よるの ばめん（くらく なる・こもりうた）で、きょう あそんだ ことを じゅんばんに 読む。
   2つ いじょう あそんだ 日は「さいしょに なにを したか おぼえてる？」（絵で 2〜3たく・ばつなし）。
   さいごに 生きものが ねむる ＋ おうちの人の「おやすみ」（録音が あれば）。
     MQ.ui.ohanashi.open(opts) … opts.log＝テスト用の その日の きろく
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  // しゅるい → 絵（ホームの ボタンと 同じ アイコン・色）
  const PIC = {
    count: ['bowl', 'big--gold', '#4a3b32'], color: ['shop', 'big--clay', '#fbf4e4'], shape: ['ball', 'big--green', '#fbf4e4'],
    compare: ['scale', 'big--blue', '#fbf4e4'], moji: ['moji', 'big--pink', '#fbf4e4'], tokei: ['clock', 'big--teal', '#fbf4e4'],
    draw: ['crayon', 'pill--rose', '#fbf4e4'], find: ['lens', 'pill--sky', '#fbf4e4'], mane: ['mic', 'pill--lime', '#fbf4e4'], help: ['letter', 'big--gold', '#fbf4e4']
  };
  function pic(kind, small) {
    const p = PIC[kind]; if (!p) return null;
    return h('div', { class: 'big st__pic ' + p[1] + (small ? ' st__pic--s' : ''), html: MQ.ui.SVG[p[0]], style: { color: p[2] } });
  }
  let st = null;
  function open(opts) {
    opts = opts || {};
    const story = MQ.story.build(opts.log || MQ.save.dayLog(), MQ.save.stampsToday());
    const scene = MQ.ui.sceneNode(300, { night: true });
    const mon = MQ.ui.monNode(150);
    scene.appendChild(h('div', { style: { position: 'absolute', left: '210px', top: '118px' } }, [mon]));
    const page_ = h('div', { class: 'st__page' });
    scene.appendChild(page_);
    const bl = MQ.ui.balloon('');
    const quiz = h('div', { class: 'st__quiz' });
    const btn = h('button', { class: 'btn btn--wide st__next', type: 'button', text: 'おうちへ', style: { display: 'none' }, onclick: function () { MQ.sfx.tap(); MQ.ui.stopSpeak(); MQ.family.stop(); MQ.ui.home.open(); } });
    const page = h('div', { class: 'page st' }, [
      MQ.ui.topBar({ home: true, replay: function () { if (st) bl.say(st.cur || ''); } }),
      scene,
      h('div', { class: 'wrap col', style: { gap: '12px', paddingTop: '10px', alignItems: 'center' } }, [bl, quiz, btn,
        MQ.ui.hintBox('きょう あそんだ ことを じゅんばんに 読みます。「さいしょに なにを した？」に いっしょに こたえて、ねる 前の おはなしに どうぞ')])
    ]);
    MQ.ui.mount('screen-story', page);
    MQ.ui.show('screen-story');
    st = { story: story, i: 0, cur: '', mon: mon, bl: bl, quiz: quiz, page: page_, btn: btn };
    MQ.ui.ohanashi._st = st;
    setTimeout(step, 400);
  }
  function show(kind) {
    st.page.innerHTML = '';
    const p = kind === 'stamp' ? h('div', { class: 'st__stamp' }, [MQ.ui.stampRow()]) : pic(kind);
    if (p) { st.page.appendChild(p); st.page.classList.remove('is-in'); void st.page.offsetWidth; st.page.classList.add('is-in'); }
  }
  function step() {
    if (!st) return;
    const pages = st.story.pages;
    if (st.i < pages.length) {
      const pg = pages[st.i++];
      show(pg.kind);
      st.cur = pg.text;
      st.bl.say(pg.text, function () { setTimeout(step, 500); });
      return;
    }
    if (st.story.quiz && !st.asked) { st.asked = true; ask(); return; }
    ending(0);
  }
  function ask() {
    const q = st.story.quiz;
    st.page.innerHTML = '';
    st.cur = q.ask;
    st.bl.say(q.ask);
    st.quiz.innerHTML = '';
    q.options.forEach(function (k) {
      const b = h('button', { class: 'st__opt', type: 'button', 'aria-label': MQ.story.KINDS[k].name }, [pic(k, true)]);
      b.onclick = function () {
        if (st.answered) return;
        MQ.sfx.tap();
        if (k === q.answer) {
          st.answered = true;
          b.classList.add('is-ok'); MQ.sfx.correct(); st.mon.mood('happy');
          st.bl.say(MQ.story.right(k), function () { st.quiz.innerHTML = ''; setTimeout(function () { ending(0); }, 400); });
        } else {
          st.mon.mood('tilt');
          b.classList.add('is-dim');
          st.quiz.querySelectorAll('.st__opt').forEach(function (x, i) { if (q.options[i] === q.answer) x.classList.add('is-hint'); });
          st.bl.say(MQ.story.wrong(k, q.answer));
        }
      };
      st.quiz.appendChild(b);
    });
  }
  function ending(i) {
    const end = st.story.end;
    if (i >= end.length) {
      st.mon.sleep(); MQ.sfx.snore();
      MQ.save.note('story');
      MQ.family.play('night', { rate: 1 });
      st.btn.style.display = '';
      st.done = true;
      return;
    }
    if (i === end.length - 1) st.mon.mood('yawn');
    st.page.innerHTML = '';
    st.cur = end[i].text;
    st.bl.say(end[i].text, function () { setTimeout(function () { ending(i + 1); }, 500); });
  }
  MQ.ui.ohanashi = { open: open, state: function () { return st; } };
})();
