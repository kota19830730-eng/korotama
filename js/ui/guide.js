/* ---------------------------------------------------------
   はじめての 案内（ころたま・2026-10-10）
   ユーザー「初めてプレイする時に誕生日の設定やこんなことができるみたいな説明、チュートリアル的なものがあるとわかりやすい」。
   おうちの人 向けの 5ページ（大人の 文章・声の キャラクター名は 出さない）。はじめて おうちに 来た とき 1回だけ 出る（settings.guideSeen）。
   もう いちど 見る：おうちの人の 画面「使い方の案内を見る」。誕生日は はじめの 設定（start.js）でも 入れられる。
     MQ.ui.guide.open(opts)  … opts.onClose()／opts.page（テスト用）
     MQ.ui.guide.PAGES
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  function ico(name, cls, color) { return h('span', { class: 'gd__ico ' + cls, html: MQ.ui.SVG[name] || '', style: { color: color || '#fbf4e4' } }); }
  function item(icon, title, text) { return h('div', { class: 'gd__item' }, [icon, h('div', { class: 'gd__it' }, [h('b', { text: title }), h('span', { text: text })])]); }
  const PAGES = [
    { title: 'ころたまへようこそ', body: function () {
      return [h('div', { class: 'gd__hero' }, [MQ.ui.monNode(120)]),
        h('p', { class: 'gd__p', text: 'お子さんの絵（またはキャラクター）から生まれた生きものと遊びながら、数・色・形・ひらがな・時計を学ぶアプリです。' }),
        h('p', { class: 'gd__p', text: '字が読めなくても、すべて声で案内します。はじめのうちは、ぜひ隣で一緒に遊んでください。この案内は5ページです。' })];
    } },
    { title: '6つの学び', body: function () {
      return [h('div', { class: 'gd__list' }, [
        item(ico('bowl', 'big--gold', '#4a3b32'), 'ごはん', '数を数える（年長はたし算・ひき算の手前）'),
        item(ico('ball', 'big--green'), 'あそぶ', '形を見分ける'),
        item(ico('shop', 'big--clay'), 'おみせ', '色と数（年長は数字を読む）'),
        item(ico('scale', 'big--blue'), 'くらべっこ', '大きい・長い・多い、順番'),
        item(ico('moji', 'big--pink'), 'もじ', 'ひらがなの音と字'),
        item(ico('clock', 'big--teal'), 'とけい', '朝・昼・夜から時計の読み方まで')
      ]), h('p', { class: 'gd__note', text: '1回3問です。まちがえても×はなく、声で正しい答えを教えます。むずかしさはおうちの人の画面で変えられます。' })];
    } },
    { title: '4つのお楽しみ', body: function () {
      return [h('div', { class: 'gd__list' }, [
        item(ico('crayon', 'pill--rose'), 'おえかき', '描いた食べもの・帽子・おともだちが、生きものの世界に出てきます'),
        item(ico('lens', 'pill--sky'), 'さがす', 'お部屋で本物を探して、カメラで見せます'),
        item(ico('mic', 'pill--lime'), 'まねっこ', 'ことばを言うと、生きものが高い声でまねします'),
        item(ico('book', 'pill--night'), 'おはなし', '寝る前に、その日遊んだことを順番にふりかえります')
      ])];
    } },
    { title: '毎日のしかけ', body: function () {
      return [h('div', { class: 'gd__list' }, [
        item(ico('star', 'big--gold'), 'スタンプ', '遊ぶとスタンプ（1日5つまで）。たまると生きものの姿が立派になります'),
        item(h('span', { class: 'gd__ico gd__ico--paper', html: MQ.ui.SVG.letter }), 'おてがみ', 'おうちの画面の封筒から、1日1つおてつだいのお願いが届きます'),
        item(ico('sparkle', 'gd__ico--paper'), 'さわると動く', '空・雲・木・家・丘をさわると反応します。季節や行事で景色も変わります')
      ])];
    } },
    { title: 'おうちの人の画面', body: function () {
      return [h('div', { class: 'gd__lock' }, [h('span', { class: 'gd__ico gd__ico--paper', html: MQ.ui.SVG.lock, style: { color: '#7a6652' } }), h('p', { class: 'gd__p', text: '右上のかぎを長押しすると開きます（お子さんが間違えて入らないように）。' })]),
        h('ul', { class: 'gd__ul' }, ['むずかしさ（段階）の変更', 'ご家族の声の録音（できた！やおやすみで流れます）', 'お子さんの誕生日（当日はお祝いします）', 'おてつだいの種類', 'ぬりえ・工作・賞状の印刷、成長アルバム'].map(function (t) { return h('li', { text: t }); })),
        h('p', { class: 'gd__note', text: '写真・録音・記録はこの端末の中だけに保存し、外には送りません。' })];
    } }
  ];

  let cur = null;
  function open(opts) {
    opts = opts || {};
    close(true);
    const stage = document.getElementById('stage');
    if (!stage) return;
    let i = Math.max(0, Math.min(PAGES.length - 1, opts.page || 0));
    const card = h('div', { class: 'gd__card' });
    const ov = h('div', { class: 'gd', role: 'dialog', 'aria-label': '使い方の案内' }, [card]);
    cur = { ov: ov, onClose: opts.onClose };
    function paint() {
      const P = PAGES[i], last = i === PAGES.length - 1;
      card.innerHTML = '';
      card.appendChild(h('div', { class: 'gd__top' }, [
        h('span', { class: 'gd__step', text: (i + 1) + ' / ' + PAGES.length }),
        h('button', { class: 'gd__skip', type: 'button', text: last ? '' : 'とばす', onclick: function () { MQ.sfx.tap(); close(); } })
      ]));
      card.appendChild(h('h2', { class: 'gd__title', text: P.title }));
      card.appendChild(h('div', { class: 'gd__body' }, P.body()));
      card.appendChild(h('div', { class: 'gd__dots' }, PAGES.map(function (x, k) { return h('i', { class: k === i ? 'is-on' : '' }); })));
      card.appendChild(h('div', { class: 'gd__nav' }, [
        i > 0 ? h('button', { class: 'btn', type: 'button', text: 'もどる', onclick: function () { MQ.sfx.tap(); i--; paint(); } }) : h('span'),
        last
          ? h('div', { class: 'gd__end' }, [
              h('button', { class: 'btn', type: 'button', text: 'おうちの人の画面を開く', onclick: function () { MQ.sfx.tap(); close(true); markSeen(); MQ.ui.parent.open(); } }),
              h('button', { class: 'btn btn--gold btn--big', type: 'button', text: 'あそびはじめる', onclick: function () { MQ.sfx.tap(); close(); } })])
          : h('button', { class: 'btn btn--gold btn--big', type: 'button', text: 'つぎへ', onclick: function () { MQ.sfx.tap(); i++; paint(); } })
      ]));
      MQ.ui.guide._i = i;
    }
    paint();
    stage.appendChild(ov);
  }
  function markSeen() { MQ.save.setSetting('guideSeen', true); }
  function close(silent) {
    if (!cur) return;
    const c = cur; cur = null;
    if (c.ov.parentNode) c.ov.parentNode.removeChild(c.ov);
    if (!silent) { markSeen(); if (c.onClose) c.onClose(); }
  }
  function isOpen() { return !!cur; }
  function shouldShow() { return MQ.save.settings().guideSeen !== true; }
  MQ.ui.guide = { open: open, close: close, isOpen: isOpen, shouldShow: shouldShow, PAGES: PAGES };
})();
