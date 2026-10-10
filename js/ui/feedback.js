/* ---------------------------------------------------------
   感想フォームの お願い（ころたま・2026-10-10）
   ユーザー「まなびモンスターと同じように、はじめての案内に感想フォームのお願いを。
   感想を提出していないユーザーには1日1回ぐらいお願いを表示」。
   ・フォームは ころたま用の Google フォーム（FORM.url）。**url が からの あいだは 何も 出さない**。
   ・おうちの人が フォームで「送信」を 押した ときだけ 届く（アプリからは 何も 送らない）。
   ・送ったかは アプリから 分からない → おうちの人が「送りました」を 押すと 止まる（settings.fbDone）。
   ・お願いは おうちの 画面を 開いた とき、1日 1回（settings.fbAskDay）。
     使い始めた 日は 出さない＝スタンプを 2日 いじょう もらって から。はじめての 案内が 出る 日は 出さない。
     MQ.ui.feedback.due() / ask(onClose) / card() / url() / opened() / sent() / FORM
   大人の 文章で 書く。声の キャラクターの 名前は 出さない。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  const FORM = {
    url: '',      // ころたま用の Google フォーム（viewform の URL）。からの あいだは お願いを 出さない
    age: '',      // 「お子さんの年齢」の entry.＊＊＊（わかれば。段階から 入れて 開く）
    info: ''      // 「アプリの情報」の entry.＊＊＊（わかれば。段階・スタンプ・端末を 入れて 開く）
  };
  const AGE = { s: '3〜4歳', m: '4〜5歳', l: '5〜6歳', k: '6歳（年長）' };

  function dayKey(t) { const d = new Date(t || Date.now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function infoText() {
    const k = MQ.save.kid();
    const lines = [];
    let ver = '';
    try { ver = (document.querySelector('meta[name="app-version"]') || {}).content || ''; } catch (e) { /* なし */ }
    if (k) {
      const days = Object.keys(k.stamps || {}).length;
      lines.push('段階 ' + (AGE[k.stage] || k.stage || '－') + '・スタンプ ' + MQ.save.stampsTotal() + 'こ・遊んだ日 ' + days + '日' + (ver ? '・版 ' + ver : ''));
    }
    lines.push('端末 ' + String(navigator.userAgent || '').replace(/\s+/g, ' ').slice(0, 160));
    return lines.join('\n').slice(0, 600);
  }
  function url() {
    if (!FORM.url) return '';
    const q = ['usp=pp_url'];
    const k = MQ.save.kid();
    if (FORM.age && k && AGE[k.stage]) q.push(FORM.age + '=' + encodeURIComponent(AGE[k.stage]));
    if (FORM.info) q.push(FORM.info + '=' + encodeURIComponent(infoText()));
    return FORM.url + (FORM.url.indexOf('?') < 0 ? '?' : '&') + q.join('&');
  }
  function opened() { MQ.save.setSetting('fbOpenedAt', Date.now()); }
  function sent() { MQ.save.setSetting('fbDone', true); }
  function due(now) {
    if (!FORM.url) return false;
    const st = MQ.save.settings();
    if (st.fbDone) return false;
    if (st.fbAskDay === dayKey(now)) return false;
    const k = MQ.save.kid();
    return !!(k && k.mon && Object.keys(k.stamps || {}).filter(function (d) { return (k.stamps[d] || 0) > 0; }).length >= 2);
  }
  function link(text, cls, after) {
    return h('a', { class: 'btn ' + (cls || ''), href: url(), target: '_blank', rel: 'noopener', text: text,
      onclick: function () { MQ.sfx.tap(); opened(); if (after) after(); } });
  }

  /* おうちの 画面に かぶせる カード（はじめての 案内 .gd と 同じ 見た目）。出したら その日は おしまい */
  let cur = null;
  function ask(onClose) {
    if (cur || !due()) return false;
    const stage = document.getElementById('stage');
    if (!stage) return false;
    MQ.save.setSetting('fbAskDay', dayKey());
    const wasOpened = !!MQ.save.settings().fbOpenedAt;
    function close() {
      if (!cur) return;
      const c = cur; cur = null;
      if (c.parentNode) c.parentNode.removeChild(c);
      if (onClose) onClose();
    }
    const card = h('div', { class: 'gd__card fb__card' }, [
      h('div', { class: 'gd__top' }, [h('span', { class: 'gd__step', text: 'おうちの方へ' })]),
      h('h2', { class: 'gd__title', text: '感想フォームへのご協力をお願いします' }),
      h('p', { class: 'gd__p', text: wasOpened
        ? '前にフォームを開いていただき、ありがとうございます。送信がお済みでしたら「送りました」を押してください。このお願いは出なくなります。'
        : 'ころたまは、使ってくださる方の声で作り直しています。お子さんの様子（よく遊ぶあそび・むずかしそうなところ）を一言いただけると、とても助かります。1〜2分・名前なしで送れます。' }),
      h('div', { class: 'gd__end' }, [
        link('感想フォームを開く', 'btn--gold btn--big', close),
        h('button', { class: 'btn', type: 'button', text: '送りました（もう表示しない）', onclick: function () { MQ.sfx.tap(); sent(); MQ.ui.toast('ありがとうございます'); close(); } }),
        h('button', { class: 'gd__skip fb__later', type: 'button', text: 'きょうはあとで', onclick: function () { MQ.sfx.tap(); close(); } })
      ]),
      h('p', { class: 'gd__note', text: 'Googleのフォームが開きます。「送信」を押すまで何も送られません。アプリから自動で送ることはありません。' })
    ]);
    cur = h('div', { class: 'gd fb', role: 'dialog', 'aria-label': '感想フォームのお願い' }, [card]);
    stage.appendChild(cur);
    return true;
  }
  function isOpen() { return !!cur; }

  /* おうちの人の 画面の カード */
  function card() {
    if (!FORM.url) return null;
    const done = !!MQ.save.settings().fbDone;
    return h('div', { class: 'card' }, [h('p', { class: 'card__title', text: '感想を聞かせてください' }),
      h('p', { class: 'note', style: { margin: '0 0 8px' }, text: 'ころたまは、使ってくださる方の声で作り直しています。お子さんの一言（「ここが好き」「ここがむずかしい」）だけでも、とても助かります（1〜2分・名前なしでOK）。' }),
      h('div', { class: 'col', style: { gap: '8px' } }, [
        link('感想フォームを開く', 'btn--gold btn--wide'),
        done ? h('p', { class: 'note', style: { margin: '0' }, text: '感想を送っていただき、ありがとうございます。' })
          : h('button', { class: 'btn btn--wide', type: 'button', text: '送りました（お願いの表示を止める）', onclick: function () { MQ.sfx.tap(); sent(); MQ.ui.toast('ありがとうございます'); MQ.ui.parent.open(); } })
      ]),
      h('p', { class: 'note', style: { marginTop: '8px' }, text: 'Googleのフォームが開きます。「送信」を押すまで何も送られません。' })]);
  }

  /* はじめての 案内の さいごの ページ（guide.js が url の ある ときだけ 足す） */
  function guidePage() {
    return { title: '感想フォームへのご協力のお願い', need: function () { return !!FORM.url; }, body: function () {
      return [
        h('p', { class: 'gd__p', text: '使ってくださる方の声で作り直しています。しばらく遊んでみたら、一言いただけるととても助かります（1〜2分・名前なしでOK）。' }),
        h('ul', { class: 'gd__ul' }, [
          'お子さんの一言だけでも（「ここが好き」「ここがむずかしい」）',
          'しばらく遊ぶと、おうちの画面で1日1回お願いが出ます。「送りました」を押すと出なくなります',
          'おうちの人の画面からも、いつでも送れます'
        ].map(function (t) { return h('li', { text: t }); })),
        link('感想フォームを開く', 'btn--wide'),
        h('p', { class: 'gd__note', text: 'Googleのフォームが開きます。「送信」を押すまで何も送られません。' })
      ];
    } };
  }

  MQ.ui.feedback = { FORM: FORM, url: url, due: due, ask: ask, isOpen: isOpen, card: card, opened: opened, sent: sent, guidePage: guidePage, infoText: infoText };
})();
