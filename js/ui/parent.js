/* ---------------------------------------------------------
   おうちの人の 画面（まなびたまご）：段階・声・字幕・きょうの きろく・つれていく・絵を とりなおす・消す
   入り方：子どもの 画面の 右上の かぎを 1.5秒 長おし
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.parent = (function () {
  const h = MQ.util.h;

  function seg(items, cur, onPick, two) {
    const row = h('div', { class: 'seg' + (two ? ' seg--2' : '') });
    items.forEach(function (it) {
      const b = h('button', { class: 'seg__b' + (it.id === cur ? ' is-on' : ''), type: 'button' }, [h('span', { text: it.name }), it.sub ? h('small', { text: it.sub }) : null]);
      b.onclick = function () { MQ.sfx.tap(); row.querySelectorAll('.seg__b').forEach(function (x) { x.classList.remove('is-on'); }); b.classList.add('is-on'); onPick(it.id); };
      row.appendChild(b);
    });
    return row;
  }
  function fileName() {
    const d = new Date();
    return 'manabi-tamago-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '.json';
  }
  /* ファイルに 保存（iPhone／iPad は 共有メニュー、ほかは ダウンロード）。まなびモンスターの v14.46 と 同じ 作り */
  function saveFile(text, name, title) {
    let file = null;
    try { file = new File([text], name, { type: 'application/json' }); } catch (e) { file = null; }
    const ua = navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    if (ios && file && navigator.share && navigator.canShare) {
      let ok = false;
      try { ok = navigator.canShare({ files: [file] }); } catch (e) { ok = false; }
      if (ok) return navigator.share({ files: [file], title: title }).then(function () { MQ.ui.toast('保存しました'); }).catch(function (e) { if (!(e && e.name === 'AbortError')) download(); });
    }
    download();
    function download() {
      try {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        MQ.ui.toast('ファイルに 保存しました');
      } catch (e) { MQ.ui.toast('保存できませんでした'); }
    }
  }

  function open() {
    MQ.ui.stopSpeak();
    const kid = MQ.save.kid();
    const st = MQ.save.settings();
    const hasMon = !!(kid && kid.mon);
    const nameIn = h('input', { class: 'field', type: 'text', maxlength: '8', placeholder: 'お子さんの 名前', value: kid ? kid.name : '' });
    nameIn.addEventListener('change', function () { if (kid) MQ.save.update(function (d) { d.kid.name = (nameIn.value || '').trim(); }); });
    const done = kid ? kid.done : { count: 0, color: 0, shape: 0 };
    const page = h('div', { class: 'page pp' }, [
      h('div', { class: 'page__body' }, [h('div', { class: 'wrap col' }, [
        h('div', { class: 'row', style: { justifyContent: 'space-between' } }, [
          h('h1', { class: 'pp__title', text: 'おうちの人の 画面' }),
          h('button', { class: 'btn', type: 'button', text: hasMon ? '子どもの 画面へ' : 'もどる', onclick: function () { MQ.sfx.tap(); if (hasMon) MQ.ui.home.open(); else MQ.ui.start.open(); } })
        ]),
        kid ? h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'お子さんの 段階' }),
          seg([{ id: 's', name: 'ちいさい', sub: '3〜4さい' }, { id: 'm', name: 'なかくらい', sub: '4〜5さい' }, { id: 'l', name: 'おおきい', sub: '5〜6さい' }], kid.stage, function (v) { MQ.save.update(function (d) { d.kid.stage = v; }); }),
          h('p', { class: 'note', style: { marginTop: '8px' }, text: 'ちいさい：数 3まで・色 3つ・形 2つ（お皿に くぼみ）／なかくらい：数 5まで・色 4つ・形 3つ／おおきい：数 10まで・色 5つ・形 4つ＋色（くぼみ なし・自分で「あげる」）' })]) : null,
        h('div', { class: 'card' }, [h('p', { class: 'card__title', text: '声と 字幕' }),
          h('div', { class: 'kv', style: { marginBottom: '6px' } }, [h('span', { text: '声の 高さ' })]),
          seg([{ id: 'high', name: '高めの 声' }, { id: 'normal', name: 'ふつうの 声' }], st.pitch || 'high', function (v) { MQ.save.setSetting('pitch', v); MQ.voice.setPitch(v); }, true),
          h('div', { class: 'kv', style: { margin: '12px 0 6px' } }, [h('span', { text: '字幕と おうちの人への 声かけヒント' })]),
          seg([{ id: 'on', name: '出す', sub: 'いっしょに 遊ぶ' }, { id: 'off', name: '出さない', sub: 'ひとりで 遊ぶ' }], st.hint ? 'on' : 'off', function (v) { MQ.save.setSetting('hint', v === 'on'); }, true),
          h('div', { class: 'kv', style: { margin: '12px 0 6px' } }, [h('span', { text: '声の 読み上げ' })]),
          seg([{ id: 'on', name: '読む' }, { id: 'off', name: '読まない' }], st.voice ? 'on' : 'off', function (v) { MQ.save.setSetting('voice', v === 'on'); }, true),
          h('div', { class: 'row', style: { marginTop: '12px' } }, [h('button', { class: 'btn btn--wide', type: 'button', text: 'この端末で 声が 出るか ためす', onclick: function () { MQ.sfx.tap(); MQ.voice.setPitch(MQ.save.settings().pitch || 'high'); const ok = MQ.voice.say('こんにちは！ わたしの こえ、きこえる？'); if (!ok) MQ.ui.toast('日本語の 声が 見つかりません', 2600); } })]),
          h('p', { class: 'note', style: { marginTop: '8px' }, text: MQ.voice.ready() ? '日本語の 声：' + ((MQ.voice.voiceFor() || {}).name || 'あり') : '日本語の 声が 見つかりません。声が 出ない あいだは 字幕を かならず 出します。' })]),
        kid ? h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'お子さんの 名前（声で よびます）' }), nameIn]) : null,
        kid ? h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'きろく' }),
          h('div', { class: 'col', style: { gap: '4px' } }, [
            h('div', { class: 'kv' }, [h('span', { text: 'きょうの スタンプ' }), h('b', { text: MQ.save.stampsToday() + ' こ' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'ぜんぶの スタンプ' }), h('b', { text: MQ.save.stampsTotal() + ' こ（すがた ' + MQ.save.growth() + '）' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'ごはん（かず）' }), h('b', { text: done.count + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'おみせ（いろ）' }), h('b', { text: done.color + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'あそぶ（かたち）' }), h('b', { text: done.shape + ' 回' })])
          ])]) : null,
        hasMon ? h('div', { class: 'card', style: { background: '#fff4df', border: '2px solid #f2b544' } }, [h('p', { class: 'card__title', text: '小学生に なったら' }),
          h('div', { class: 'row', style: { marginBottom: '8px' } }, [MQ.blocks.imgBox(MQ.save.monPng(), { size: 64 }), h('span', { text: kid.mon.name })]),
          h('p', { class: 'note', text: '育てた 生きものを「まなびモンスター」の 相棒として つれていけます。ファイルに 保存して、まなびモンスターで 読みこみます（読みこみは まなびモンスターの つぎの 版で）。' }),
          h('button', { class: 'btn btn--gold btn--wide', type: 'button', text: 'まなびモンスターへ つれていく（ファイルに 保存）', onclick: function () { MQ.sfx.tap(); saveFile(MQ.save.exportMon(), fileName(), 'まなびたまごの 生きもの'); } })]) : null,
        h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'そのほか' }),
          h('div', { class: 'col', style: { gap: '8px' } }, [
            h('button', { class: 'btn btn--wide', type: 'button', text: hasMon ? '絵を とりなおす（生きものが かわります）' : '絵を とる', onclick: function () { MQ.sfx.tap(); if (!kid) MQ.save.newKid({}); MQ.ui.draw.open(); } }),
            h('button', { class: 'btn btn--wide', type: 'button', text: 'きろくを ファイルに 保存', onclick: function () { MQ.sfx.tap(); saveFile(MQ.save.exportText(), fileName().replace('.json', '-all.json'), 'まなびたまごの きろく'); } }),
            h('button', { class: 'btn btn--wide', type: 'button', text: 'ファイルから もどす', onclick: function () {
              MQ.sfx.tap();
              const inp = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden' });
              inp.addEventListener('change', function () {
                const f = inp.files && inp.files[0]; if (!f) return;
                const r = new FileReader();
                r.onload = function () { try { MQ.save.importText(String(r.result)); MQ.ui.toast('もどしました'); open(); } catch (e) { MQ.ui.toast('まなびたまごの ファイルでは ないようです', 2600); } };
                r.readAsText(f);
              });
              document.body.appendChild(inp); inp.click();
            } }),
            h('button', { class: 'btn btn--wide', type: 'button', style: { color: '#a4533e' }, text: 'きろくを ぜんぶ 消す', onclick: function () { MQ.sfx.tap(); if (window.confirm('生きものと スタンプを ぜんぶ 消します。よろしいですか？')) { MQ.save.reset(); MQ.ui.start.open(); } } })
          ])]),
        h('p', { class: 'note', text: 'このアプリは 何も 外に 送りません。写真も 記録も この端末の 中だけです。' })
      ])])
    ]);
    MQ.ui.mount('screen-parent', page);
    MQ.ui.show('screen-parent');
  }
  return { open: open, saveFile: saveFile };
})();
