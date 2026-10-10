/* ---------------------------------------------------------
   ホーム画面に 入れる（Android の Chrome・ころたま 2026-10-11）
   ユーザー「アンドロイド端末だけど インストールしますか？と 出てこない」。
   ころたまは インストールの 条件を みたして いる（Chrome の getInstallabilityErrors は から）が、
   Chrome は「インストールしますか？」を 自分からは あまり 出さない。
   → beforeinstallprompt を うけて とって おき、アプリの がわから おうちの人に「ホーム画面に入れますか？」と きく。
   ・おうちの 画面を 開いた とき（はじめての 案内・感想の お願いが 出ない 日）。「あとで」なら 3日 出さない
   ・おうちの人の 画面の「ホーム画面に入れる」カードにも ボタン
   ・iPhone・iPad は この しくみが ない → 同じ ときに「共有ボタン →「ホーム画面に追加」」の 手順を 絵つきで 見せる（ユーザー 2026-10-11「iPhone・iPad は ホーム画面に入れる 仕組みを 誘導して」）。
     LINE などの アプリの 中の ブラウザは 入れられない → 「Safari で開く」を 案内。Chrome（iOS）は アドレスバーの 共有ボタン。
     Safari の タブからは 入れたか 分からない → 「もう入れました」で 止まる
   ・入れたら（appinstalled）もう 出さない
     MQ.ui.install.can() / due() / ask(onClose) / prompt(cb) / isOpen() / _fake(ev)（テスト用）
   大人の 文章で 書く。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  const LATER_DAYS = 3;
  let deferred = null, cur = null;

  function standalone() {
    try { if (window.matchMedia('(display-mode: standalone)').matches) return true; } catch (e) { /* なし */ }
    return !!navigator.standalone;
  }
  function can() { return !!deferred && !standalone() && !MQ.save.settings().installed; }
  let fakeUA = null;   // テスト用
  function ua() { return fakeUA != null ? fakeUA : (navigator.userAgent || ''); }
  function ios() { const u = ua(); return /iPad|iPhone|iPod/.test(u) || (fakeUA == null && navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1); }
  function ipad() { const u = ua(); return /iPad/.test(u) || (fakeUA == null && navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1); }
  function iosWhere() { const u = ua(); return /Line\/|FBAN|FBAV|Instagram|MicroMessenger|KAKAOTALK|YJApp|GSA\//.test(u) ? 'inapp' : /CriOS|FxiOS|EdgiOS/.test(u) ? 'chrome' : 'safari'; }
  function iosNeed() { return ios() && !standalone() && !MQ.save.settings().installed; }
  function due() {
    if (!can() && !iosNeed()) return false;
    const t = MQ.save.settings().installLater || 0;
    return Date.now() - t > LATER_DAYS * 86400000;
  }
  function prompt(cb) {
    if (!deferred) { if (cb) cb(false); return; }
    const ev = deferred;
    deferred = null;   // 1回しか つかえない
    try {
      ev.prompt();
      Promise.resolve(ev.userChoice).then(function (r) {
        const ok = !!(r && r.outcome === 'accepted');
        if (ok) MQ.save.setSetting('installed', true);
        if (cb) cb(ok);
      }).catch(function () { if (cb) cb(false); });
    } catch (e) { if (cb) cb(false); }
  }
  function ask(onClose) {
    if (cur || !due()) return false;
    if (!can()) return askIos(onClose);
    const stage = document.getElementById('stage');
    if (!stage) return false;
    function close() {
      if (!cur) return;
      const c = cur; cur = null;
      if (c.parentNode) c.parentNode.removeChild(c);
      if (onClose) onClose();
    }
    const card = h('div', { class: 'gd__card fb__card' }, [
      h('div', { class: 'gd__top' }, [h('span', { class: 'gd__step', text: 'おうちの方へ' })]),
      h('h2', { class: 'gd__title', text: 'ホーム画面に入れますか？' }),
      h('p', { class: 'gd__p', text: 'ホーム画面にアイコンができて、アプリのように開けます。画面が広くなり、電波のないところでも遊べます。無料で、ストアからのダウンロードはいりません。' }),
      h('div', { class: 'gd__end' }, [
        h('button', { class: 'btn btn--gold btn--big', type: 'button', text: 'ホーム画面に入れる', onclick: function () {
          MQ.sfx.tap();
          prompt(function (ok) { if (ok) MQ.ui.toast('ホーム画面に入れました。これからはアイコンから開いてください'); else MQ.save.setSetting('installLater', Date.now()); });
          close();
        } }),
        h('button', { class: 'gd__skip fb__later', type: 'button', text: 'あとで', onclick: function () { MQ.sfx.tap(); MQ.save.setSetting('installLater', Date.now()); close(); } })
      ]),
      h('p', { class: 'gd__note', text: 'あとからでも、おうちの人の画面（右上のかぎを長おし）→「ホーム画面に入れる」から入れられます。' })
    ]);
    cur = h('div', { class: 'gd fb', role: 'dialog', 'aria-label': 'ホーム画面に入れる' }, [card]);
    stage.appendChild(cur);
    return true;
  }
  /* iPhone・iPad：手順を 絵つきで（Safari／Chrome／アプリの 中の ブラウザ） */
  const SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="#2f7de1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-2"/><path d="M12 3v12M8.5 6.5L12 3l3.5 3.5"/></svg>';
  const ADD = '<svg viewBox="0 0 24 24" fill="none" stroke="#3a3330" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  function step(n, nodes) { return h('li', { class: 'ins__step' }, [h('b', { class: 'ins__n', text: String(n) })].concat(nodes)); }
  function ico(svg) { return h('span', { class: 'ins__ico', html: svg }); }
  function askIos(onClose) {
    const stage = document.getElementById('stage');
    if (!stage) return false;
    function close() {
      if (!cur) return;
      const c = cur; cur = null;
      if (c.parentNode) c.parentNode.removeChild(c);
      if (onClose) onClose();
    }
    const where = iosWhere(), pad = ipad();
    let steps;
    if (where === 'inapp') steps = [
      step(1, [h('span', { text: 'LINE などのアプリの中では、ホーム画面に入れられません。画面の右上か右下の「…」や共有ボタンを押します' })]),
      step(2, [h('span', { text: '「Safari で開く」（または「ブラウザで開く」）を選びます' })]),
      step(3, [h('span', { text: 'Safari で開いたら、もう一度この案内が出ます' })])
    ];
    else steps = [
      step(1, [h('span', { text: where === 'chrome' ? 'アドレスバーの右にある共有ボタン' : pad ? '画面の右上にある共有ボタン' : '画面の下にある共有ボタン' }), ico(SHARE), h('span', { text: 'を押します（見つからないときは「…」を押すと出てきます）' })]),
      step(2, [h('span', { text: 'メニューを下に動かして' }), ico(ADD), h('span', { text: '「ホーム画面に追加」を押します' })]),
      step(3, [h('span', { text: '右上の「追加」を押します。これからはホーム画面の「ころたま」のアイコンから開いてください' })])
    ];
    const played = MQ.save.stampsTotal && MQ.save.stampsTotal() > 0;
    const card = h('div', { class: 'gd__card fb__card' }, [
      h('div', { class: 'gd__top' }, [h('span', { class: 'gd__step', text: 'おうちの方へ' })]),
      h('h2', { class: 'gd__title', text: 'ホーム画面に入れましょう' }),
      h('p', { class: 'gd__p', text: 'アイコンから開くと、アプリのように画面が広くなり、電波のないところでも遊べます。無料で、App Store からのダウンロードはいりません。' }),
      h('ol', { class: 'ins__steps' }, steps),
      played ? h('p', { class: 'gd__note', text: 'いまの記録はアイコンに自動では移りません。移すときは、おうちの人の画面の「きろくを ファイルに 保存」→ アイコンから開いて「ファイルから もどす」を押してください。' }) : null,
      h('div', { class: 'gd__end' }, [
        h('button', { class: 'btn btn--gold btn--big', type: 'button', text: 'わかりました', onclick: function () { MQ.sfx.tap(); MQ.save.setSetting('installLater', Date.now()); close(); } }),
        h('button', { class: 'gd__skip fb__later', type: 'button', text: 'もう入れました（表示しない）', onclick: function () { MQ.sfx.tap(); MQ.save.setSetting('installed', true); close(); } })
      ]),
      h('p', { class: 'gd__note', text: 'この案内は、おうちの人の画面（右上のかぎを長おし）→「ホーム画面に入れる」でも見られます。' })
    ]);
    cur = h('div', { class: 'gd fb ins', role: 'dialog', 'aria-label': 'ホーム画面に入れる' }, [card]);
    stage.appendChild(cur);
    return true;
  }
  function isOpen() { return !!cur; }
  // ほかの お知らせ（はじめての 案内・感想の お願い）が 出て いない ときだけ
  function quiet() { return !document.querySelector('#stage .gd'); }

  function onEvent(e) {
    try { e.preventDefault(); } catch (x) { /* なし */ }   // Chrome の 小さな バーの かわりに 自分で きく
    deferred = e;
    // おうちの 画面に いる あいだに とどいたら その場で（はじめの 1回は ここが 多い）
    setTimeout(function () { if (MQ.ui.current === 'screen-home' && quiet()) ask(); }, 1500);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', onEvent);
    window.addEventListener('appinstalled', function () { deferred = null; try { MQ.save.setSetting('installed', true); } catch (e) { /* なし */ } });
  }
  MQ.ui.install = { ios: ios, iosNeed: iosNeed, showIos: function (cb) { MQ.save.setSetting('installLater', 0); return askIos(cb); }, _ua: function (u) { fakeUA = u; }, can: can, due: due, ask: ask, prompt: prompt, isOpen: isOpen, standalone: standalone, _fake: onEvent };
})();
