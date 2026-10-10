/* ---------------------------------------------------------
   おうちの人の 画面（ころたま）：段階・声・字幕・きょうの きろく・絵を とりなおす・消す
   入り方：子どもの 画面の 右上の かぎを 1.5秒 長おし
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

MQ.ui.parent = (function () {
  const h = MQ.util.h;

  function seg(items, cur, onPick, two) {
    const row = h('div', { class: 'seg' + (two || items.length === 4 ? ' seg--2' : '') });
    items.forEach(function (it) {
      const b = h('button', { class: 'seg__b' + (it.id === cur ? ' is-on' : ''), type: 'button' }, [h('span', { text: it.name }), it.sub ? h('small', { text: it.sub }) : null]);
      b.onclick = function () { MQ.sfx.tap(); row.querySelectorAll('.seg__b').forEach(function (x) { x.classList.remove('is-on'); }); b.classList.add('is-on'); onPick(it.id); };
      row.appendChild(b);
    });
    return row;
  }
  function fileName() {
    const d = new Date();
    return 'korotama-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '.json';
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

  /* ホーム画面に入れる（まなびモンスターの installSection と 同じ 中身） */
  function installCard() {
    const ua = navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    let standalone = !!navigator.standalone;
    try { standalone = standalone || window.matchMedia('(display-mode: standalone)').matches; } catch (e) { /* なにもしない */ }
    const line = function (t, muted) { return h('p', { class: 'note', style: { margin: '4px 0', opacity: muted ? '.8' : '' }, text: t }); };
    const sub = function (t) { return h('div', { class: 'kv', style: { margin: '10px 0 2px' } }, [h('span', { text: t })]); };
    return h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'ホーム画面に入れる（アプリのように使う）' }),
      line(standalone ? 'いまはホーム画面のアイコンから開いています。このまま使えます。'
        : 'App Store からのインストールは不要です。ブラウザの機能で、ホーム画面にアイコンを置いてアプリのように使えます（画面が広くなり、オフラインでも遊べます）。'),
      sub('iPhone・iPad' + (ios && !standalone ? '（この端末）' : '')),
      line('1. このページを Safari で開く（LINE などアプリの中のブラウザではできません）'),
      line('2. 共有ボタン（四角から上向きの矢印）を押す。iPhone は画面の下、iPad は右上にあります'),
      line('3. 「ホーム画面に追加」→「追加」を押す'),
      line('4. これからはホーム画面の「ころたま」のアイコンから開く'),
      line('注意：Safari のタブとアイコンでは記録が別々です。Safari で遊んだ記録を移すときは、Safari で下の「きろくを ファイルに 保存」→ アイコンから開いて「ファイルから もどす」を押してください。', true),
      line('声や音楽が出ないときは、本体の消音（マナーモード）を切ってください。', true),
      sub('Android（Chrome）' + (/Android/.test(ua) && !standalone ? '（この端末）' : '')),
      line('右上の「︙」→「アプリをインストール」または「ホーム画面に追加」を押す'),
      line('新しい版を出したときは自動で切り替わります。入れ直す必要はありません。', true)
    ]);
  }

  /* ---- v0.2 ワクワクの しかけ（2026-10-10・ユーザー決定「全て入れましょう」）。大人の 文章で 書く ---- */
  /* B：おうちの人の声 */
  function familyCard() {
    const rows = h('div', { class: 'col', style: { gap: '8px' } });
    let cur = null;
    function paint() {
      rows.innerHTML = '';
      MQ.family.PHRASES.forEach(function (p) {
        const has = MQ.family.has(p.id);
        const recBtn = h('button', { class: 'btn fam__b' + (cur && cur.id === p.id ? ' is-rec' : ''), type: 'button', text: cur && cur.id === p.id ? '止める' : (has ? '録り直す' : '録音') });
        recBtn.onclick = function () {
          MQ.sfx.tap();
          if (cur && cur.id === p.id) { cur.rec.stop(); return; }
          if (cur) return;
          if (!MQ.family.micOk()) { MQ.ui.toast('この端末ではマイクが使えません', 2600); return; }
          MQ.ui.stopSpeak(); try { MQ.bgm.stop(); } catch (e) { /* なし */ }
          cur = { id: p.id };
          cur.rec = MQ.family.record({
            max: MQ.family.MAX_MS,
            onStart: function () { paint(); },
            onDone: function (r) { const id = cur.id; cur = null; MQ.family.save(id, r.blob, function (ok) { MQ.ui.toast(ok ? '保存しました' : '保存できませんでした（端末の空きが足りません）', 2400); paint(); }, r.ms); },
            onError: function () { cur = null; MQ.ui.toast('マイクを使えませんでした。ブラウザの設定でマイクを許可してください', 3200); paint(); }
          });
          paint();
        };
        rows.appendChild(h('div', { class: 'fam' }, [
          h('div', { class: 'fam__l' }, [h('b', { text: p.label + (has ? '　✓' : '') }), h('small', { text: p.where + '。例：' + p.ex })]),
          h('div', { class: 'row', style: { gap: '6px' } }, [
            recBtn,
            has ? h('button', { class: 'btn fam__b', type: 'button', text: '聞く', onclick: function () { MQ.sfx.tap(); MQ.family.play(p.id); } }) : null,
            has ? h('button', { class: 'btn fam__b', type: 'button', style: { color: '#a4533e' }, text: '消す', onclick: function () { MQ.sfx.tap(); MQ.family.remove(p.id); paint(); } }) : null
          ])
        ]));
      });
    }
    paint();
    return h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'おうちの人の声' }),
      h('p', { class: 'note', text: 'ご家族の声を録音すると、「できた！」や朝のあいさつ、おやすみのおはなしで流れます（1つ6秒まで）。おじいちゃん・おばあちゃんの声もどうぞ。録音はこの端末の中だけに保存され、外には送りません。' }),
      rows]);
  }
  /* D：おてつだい */
  function choreCard(kid) {
    const on = MQ.chores.enabled(kid).map(function (c) { return c.id; });
    const box = h('div', { class: 'chips' });
    MQ.chores.LIST.forEach(function (c) {
      const b = h('button', { class: 'chip' + (on.indexOf(c.id) >= 0 ? ' is-on' : ''), type: 'button', text: c.label });
      b.onclick = function () {
        MQ.sfx.tap();
        const i = on.indexOf(c.id);
        if (i >= 0) { if (on.length <= 1) { MQ.ui.toast('1つ以上選んでください'); return; } on.splice(i, 1); } else on.push(c.id);
        b.classList.toggle('is-on', on.indexOf(c.id) >= 0);
        MQ.save.update(function (d) { d.kid.chores = on.slice(); });
      };
      box.appendChild(b);
    });
    const t = MQ.chores.today(kid);
    return h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'おてつだい' }),
      h('p', { class: 'note', text: 'おうちの画面の封筒を押すと、キャラクターが1日1つおてつだいを頼みます。できたらボタンを長押しして「はなまる」をあげてください（姿の成長にも数えます）。頼むおてつだいを選べます。' }),
      box,
      h('p', { class: 'note', style: { marginTop: '8px' }, text: '今日のおてつだい：' + t.label + (MQ.chores.doneToday(kid) ? '（できました）' : '') + '　これまで：' + MQ.save.helpCount() + '回' })]);
  }
  /* G：誕生日 */
  function birthdayCard(kid) {
    const cur = (kid.birthday || '').split('-');
    const mSel = h('select', { class: 'field field--s' }, [h('option', { value: '', text: '月' })].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return h('option', { value: ('0' + m).slice(-2), text: m + '月' }); })));
    const dSel = h('select', { class: 'field field--s' }, [h('option', { value: '', text: '日' })].concat(Array.from({ length: 31 }, function (x, i) { return h('option', { value: ('0' + (i + 1)).slice(-2), text: (i + 1) + '日' }); })));
    mSel.value = cur[0] || ''; dSel.value = cur[1] || '';
    const saveB = function () { const v = mSel.value && dSel.value ? mSel.value + '-' + dSel.value : ''; MQ.save.update(function (d) { d.kid.birthday = v; }); };
    mSel.onchange = saveB; dSel.onchange = saveB;
    return h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'お子さんの誕生日' }),
      h('div', { class: 'row', style: { gap: '8px' } }, [mSel, dSel]),
      h('p', { class: 'note', style: { marginTop: '8px' }, text: '誕生日には、おうちの画面にケーキが出て、お祝いの歌が流れます。季節（春の桜・夏のひまわり・秋の紅葉・冬の雪）や行事（お正月・節分・ひなまつり・こどもの日・七夕・ハロウィン・クリスマス）の飾りも自動で出て、さわると由来をやさしく話します。キャラクターが生まれた日も毎年お祝いします。' })]);
  }
  /* F・H：紙で遊ぶ・アルバム */
  function paperCard() {
    const b = function (t, fn) { return h('button', { class: 'btn btn--wide', type: 'button', text: t, onclick: function () { MQ.sfx.tap(); fn(); } }); };
    return h('div', { class: 'card' }, [h('p', { class: 'card__title', text: '成長アルバム・紙で遊ぶ' }),
      h('div', { class: 'col', style: { gap: '8px' } }, [
        b('成長アルバムを見る', function () { MQ.ui.album.open(); }),
        b('ぬりえを印刷', function () { MQ.ui.print.open('nurie'); }),
        b('立てるおにんぎょう（工作）を印刷', function () { MQ.ui.print.open('craft'); }),
        b('がんばり賞状を印刷', function () { MQ.ui.print.open('award'); })
      ]),
      h('p', { class: 'note', style: { marginTop: '8px' }, text: 'ぬったぬりえを写真で取り込むと、その色の姿になります（スタンプや成長はそのまま）。' })]);
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
        hasMon ? h('div', { class: 'card' }, [h('p', { class: 'card__title', text: '生きもの（キャラクター）を かえる' }),
          h('div', { class: 'row', style: { gap: '12px', alignItems: 'center', marginBottom: '8px' } }, [
            MQ.blocks.imgBox(kid.mon.png, { size: 72 }),
            h('div', { class: 'note', style: { margin: '0' }, text: 'いまは「' + (kid.mon.name || 'たまごちゃん') + '」。とちゅうで いつでも かえられます。' })
          ]),
          h('div', { class: 'col', style: { gap: '8px' } }, [
            h('button', { class: 'btn btn--clay btn--wide', type: 'button', text: 'キャラクターから えらびなおす', onclick: function () { MQ.sfx.tap(); MQ.ui.draw.openPresets('cute'); } }),
            h('button', { class: 'btn btn--wide', type: 'button', text: 'お子さんの 絵に かえる', onclick: function () { MQ.sfx.tap(); MQ.ui.draw.open(); } })
          ]),
          h('p', { class: 'note', style: { marginTop: '8px' }, text: 'スタンプ・きろく・成長の 段階は そのまま 引きつぎます。新しい 生きものは たまごから もう一度 うまれます。' })]) : null,
        kid ? h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'お子さんの 段階' }),
          seg([{ id: 's', name: 'ちいさい', sub: '3〜4さい' }, { id: 'm', name: 'なかくらい', sub: '4〜5さい' }, { id: 'l', name: 'おおきい', sub: '5〜6さい' }, { id: 'k', name: 'ねんちょう', sub: '6さい・数字' }], kid.stage, function (v) { MQ.save.update(function (d) { d.kid.stage = v; }); }),
          h('p', { class: 'note', style: { marginTop: '8px' }, text: 'ちいさい：数 3まで・色 3つ・形 2つ（お皿に くぼみ）／なかくらい：数 5まで・色 4つ・形 3つ／おおきい：数 10まで・色 5つ・形 4つ＋色（くぼみ なし・自分で「あげる」）／ねんちょう：ごはん＝あわせる・わける（ぜんぶで いくつ？ のこりは？）・おみせ＝数字を 読む（1〜20）・形 5つ＋色' })]) : null,
        h('div', { class: 'card' }, [h('p', { class: 'card__title', text: '声と 字幕' }),
          h('div', { class: 'kv', style: { marginBottom: '6px' } }, [h('span', { text: '声の しゅるい' })]),
          seg([{ id: 'zunda', name: 'ずんだもん' }, { id: 'device', name: '端末の 声' }], st.voiceKind || 'zunda', function (v) { MQ.save.setSetting('voiceKind', v); MQ.voice.setKind(v); }, true),
          h('p', { class: 'note', text: '声：VOICEVOX：ずんだもん（録音した 声・通信は しません）。高さ・はやさは「端末の 声」の ときだけ 効きます。名前は 声では よびません。' }),
          h('div', { class: 'kv', style: { margin: '10px 0 6px' } }, [h('span', { text: '声の 高さ・はやさ（端末の 声の とき）' })]),
          seg([{ id: 'normal', name: 'ふつうの 声' }, { id: 'high', name: '高めの 声' }], st.pitch || 'normal', function (v) { MQ.save.setSetting('pitch', v); MQ.voice.setPitch(v); }, true),
          seg([{ id: 'slow', name: 'ゆっくり' }, { id: 'normal', name: 'ふつうの はやさ' }], st.rate || 'slow', function (v) { MQ.save.setSetting('rate', v); MQ.voice.setRate(v); }, true),
          h('div', { class: 'kv', style: { margin: '12px 0 6px' } }, [h('span', { text: '字幕と おうちの人への 声かけヒント' })]),
          seg([{ id: 'on', name: '出す', sub: 'いっしょに 遊ぶ' }, { id: 'off', name: '出さない', sub: 'ひとりで 遊ぶ' }], st.hint ? 'on' : 'off', function (v) { MQ.save.setSetting('hint', v === 'on'); }, true),
          h('div', { class: 'kv', style: { margin: '12px 0 6px' } }, [h('span', { text: '音楽と 効果音' })]),
          seg([{ id: 'all', name: '両方 あり', sub: 'おすすめ' }, { id: 'sfx', name: '効果音だけ', sub: '音楽なし' }, { id: 'none', name: 'なし' }], (st.sound === false ? 'none' : st.music === false ? 'sfx' : 'all'), function (v) { MQ.save.setSetting('sound', v !== 'none'); MQ.save.setSetting('music', v === 'all'); MQ.sfx.setEnabled(v !== 'none'); MQ.bgm.setEnabled(v === 'all'); }),
          h('p', { class: 'note', text: '音楽は おうち・できた！の 画面だけ（オルゴール）。もんだいの 画面は 小鳥と 風の 音だけで、声の あいだは 小さく なります。' }),
          h('div', { class: 'kv', style: { margin: '12px 0 6px' } }, [h('span', { text: '声の 読み上げ' })]),
          seg([{ id: 'on', name: '読む' }, { id: 'off', name: '読まない' }], st.voice ? 'on' : 'off', function (v) { MQ.save.setSetting('voice', v === 'on'); }, true),
          h('div', { class: 'row', style: { marginTop: '12px' } }, [h('button', { class: 'btn btn--wide', type: 'button', text: 'この端末で 声が 出るか ためす', onclick: function () { MQ.sfx.tap(); MQ.voice.setPitch(MQ.save.settings().pitch || 'normal'); MQ.voice.setRate(MQ.save.settings().rate || 'slow'); MQ.voice.setKind(MQ.save.settings().voiceKind || 'zunda'); const ok = MQ.voice.say('こんにちは！ わたしの こえ、きこえる？ いっしょに あそぼうね。'); if (!ok) MQ.ui.toast('日本語の 声が 見つかりません', 2600); } })]),
          h('p', { class: 'note', style: { marginTop: '8px' }, text: MQ.voice.ready() ? '日本語の 声：' + ((MQ.voice.voiceFor() || {}).name || 'あり') : '日本語の 声が 見つかりません。声が 出ない あいだは 字幕を かならず 出します。' })]),
        kid ? h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'お子さんの 名前（声で よびます）' }), nameIn]) : null,
        kid ? h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'きろく' }),
          h('div', { class: 'col', style: { gap: '4px' } }, [
            h('div', { class: 'kv' }, [h('span', { text: 'きょうの スタンプ' }), h('b', { text: MQ.save.stampsToday() + ' こ' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'ぜんぶの スタンプ' }), h('b', { text: MQ.save.stampsTotal() + ' こ（すがた ' + MQ.save.growth() + '）' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'ごはん（かず）' }), h('b', { text: done.count + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'おみせ（いろ）' }), h('b', { text: done.color + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'あそぶ（かたち）' }), h('b', { text: done.shape + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'くらべっこ（くらべる・じゅんばん）' }), h('b', { text: (done.compare || 0) + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'もじ（ひらがな）' }), h('b', { text: (done.moji || 0) + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'とけい（あさ・ひる・よる／時計）' }), h('b', { text: (done.tokei || 0) + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'おえかき（描いたものが出てくる）' }), h('b', { text: (done.draw || 0) + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'さがす（本物の色・形を探す）' }), h('b', { text: (done.find || 0) + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'まねっこ（ことばを言う）' }), h('b', { text: (done.mane || 0) + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'おはなし（一日のふりかえり）' }), h('b', { text: (done.story || 0) + ' 回' })]),
            h('div', { class: 'kv' }, [h('span', { text: 'おてつだい' }), h('b', { text: (done.help || 0) + ' 回' })])
          ])]) : null,
        kid && kid.mon ? familyCard() : null,
        kid && kid.mon ? choreCard(kid) : null,
        kid && kid.mon ? birthdayCard(kid) : null,
        kid && kid.mon ? paperCard() : null,
        installCard(),
        h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'そのほか' }),
          h('div', { class: 'col', style: { gap: '8px' } }, [
            hasMon ? null : h('button', { class: 'btn btn--wide', type: 'button', text: '絵を とる', onclick: function () { MQ.sfx.tap(); if (!kid) MQ.save.newKid({}); MQ.ui.draw.open(); } }),
            h('button', { class: 'btn btn--wide', type: 'button', text: 'きろくを ファイルに 保存', onclick: function () { MQ.sfx.tap(); saveFile(MQ.save.exportText(), fileName().replace('.json', '-all.json'), 'ころたまの きろく'); } }),
            h('button', { class: 'btn btn--wide', type: 'button', text: 'ファイルから もどす', onclick: function () {
              MQ.sfx.tap();
              const inp = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden' });
              inp.addEventListener('change', function () {
                const f = inp.files && inp.files[0]; if (!f) return;
                const r = new FileReader();
                r.onload = function () { try { MQ.save.importText(String(r.result)); MQ.ui.toast('もどしました'); open(); } catch (e) { MQ.ui.toast('ころたまの ファイルでは ないようです', 2600); } };
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
