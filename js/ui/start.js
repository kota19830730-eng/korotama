/* ---------------------------------------------------------
   はじめの 画面 → おうちの人の 設定 → 絵を とる／かく → たまご（ころたま）
     MQ.ui.start.open()  … タイトル
     MQ.ui.setup.open()  … おうちの人が さいしょに 決める（名前・だんかい・声）
     MQ.ui.draw.open()   … 写真を とる か ゆびで かく → ブロックの すがた（MQ.trace）→ えらぶ → たまごへ
     MQ.ui.egg.open()    … たまごを 3回 とんとん → かえる → おうちへ
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;

  /* ---- タイトル ---- */
  MQ.ui.start = {
    open: function () {
      const kid = MQ.save.kid();
      const has = !!(kid && kid.mon);
      const egg = eggNode(has ? MQ.save.monPng() : '');
      const page = h('div', { class: 'page' }, [
        h('div', { class: 'top' }, [h('span'), (function () {
          const b = h('button', { class: 'rbtn', type: 'button', 'aria-label': 'おうちの人（ながおし）', html: MQ.ui.SVG.lock, style: { color: '#7a6652' } });
          MQ.ui.hold(b, 1500, function () { MQ.ui.parent.open(); });
          return b;
        })()]),
        h('div', { class: 'page__body' }, [h('div', { class: 'wrap col', style: { alignItems: 'center', gap: '26px', paddingTop: '30px' } }, [
          h('div', { class: 'title' }, [h('h1', { class: 'title__logo', text: 'ころたま' }), h('p', { class: 'title__sub', text: 'きみの えが たまごから うまれる' })]),
          h('div', { style: { position: 'relative', width: '200px', height: '230px' } }, [
            h('div', { style: { position: 'absolute', left: '30px', top: '0' } }, [egg]),
            h('div', { class: 'nest', style: { position: 'absolute', left: '0', top: '160px' } }, [h('i', { class: 'nest__a' }), h('i', { class: 'nest__b' })]),
            h('span', { class: 'sparkle', style: { left: '-10px', top: '20px' }, html: MQ.ui.SVG.sparkle }),
            h('span', { class: 'sparkle', style: { left: '180px', top: '60px', animationDelay: '.5s' }, html: MQ.ui.SVG.sparkle })
          ]),
          has
            ? h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'あそぶ', onclick: function () { MQ.sfx.tap(); MQ.ui.home.open(); } })
            : h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'はじめる', onclick: function () { MQ.sfx.tap(); MQ.ui.setup.open(); } }),
          h('p', { class: 'note', style: { textAlign: 'center' }, text: has ? 'おうちの人の 画面は 右上を 長おし' : 'さいしょは おうちの人と いっしょに' })
        ])])
      ]);
      MQ.ui.mount('screen-start', page);
      MQ.ui.show('screen-start');
    }
  };
  function eggNode(png) {
    const egg = h('div', { class: 'egg' });
    const cols = png ? paletteOf(png) : ['#8fd27a', '#f2c94c', '#8fd27a', '#f2c94c', '#f2c94c'];
    const pos = [[20, 40, 26], [86, 70, 20], [50, 110, 30], [96, 128, 16], [26, 150, 18]];
    pos.forEach(function (p, i) { egg.appendChild(h('i', { class: 'egg__dot', style: { left: p[0] + 'px', top: p[1] + 'px', width: p[2] + 'px', height: p[2] + 'px', background: cols[i % cols.length] } })); });
    return egg;
  }
  /* ブロックの 絵から 目立つ 色を 5つ（白と 黒は のぞく） */
  function paletteOf(png) {
    const out = [];
    try {
      const im = new Image(); im.src = png;
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d'); g.drawImage(im, 0, 0, 64, 64);
      const d = g.getImageData(0, 0, 64, 64).data;
      const cnt = {};
      for (let i = 0; i < 64 * 64; i++) {
        if (d[i * 4 + 3] < 40) continue;
        const r = d[i * 4] >> 4, gg = d[i * 4 + 1] >> 4, b = d[i * 4 + 2] >> 4;
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        if (mx - mn < 3 && (mx > 11 || mx < 5)) continue;   // 白っぽい・黒っぽい
        const k = r + ',' + gg + ',' + b;
        cnt[k] = (cnt[k] || 0) + 1;
      }
      Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 5).forEach(function (k) {
        const p = k.split(',').map(function (v) { return (parseInt(v, 10) * 16 + 8); });
        out.push('rgb(' + p.join(',') + ')');
      });
    } catch (e) { /* 読めなければ 下の 色 */ }
    while (out.length < 5) out.push(['#8fd27a', '#f2c94c', '#f0a3a0', '#6f8fd6', '#f2b544'][out.length]);
    return out;
  }
  MQ.ui.eggNode = eggNode;
  MQ.ui.paletteOf = paletteOf;

  /* ---- おうちの人の 設定（さいしょ） ---- */
  MQ.ui.setup = {
    open: function () {
      const kid = MQ.save.kid() || { name: '', stage: 's' };
      let stage = kid.stage || 's';
      let pitch = MQ.save.settings().pitch || 'normal';
      let rate = MQ.save.settings().rate || 'slow';
      let vkind = MQ.save.settings().voiceKind || 'zunda';
      const name = h('input', { class: 'field', type: 'text', maxlength: '8', placeholder: 'お子さんの 名前（なくても OK）', value: kid.name || '' });
      const segs = {};
      const STAGE_NOTE = { s: 'ちいさい：数は 3まで・色 3つ・形 2つ。お皿に くぼみ（数えやすくする印）あり。', m: 'なかくらい：数は 5まで・色 4つ・形 3つ。お皿に くぼみ あり。', l: 'おおきい：数は 10まで・色 5つ・形 4つ＋色。くぼみ なし（自分で「あげる」）。', k: 'ねんちょう：ごはん＝あわせる・わける（ぜんぶで いくつ？ のこりは？）・おみせ＝数字を 読む（1〜20）。小学校の たし算・ひき算の 手まえです。' };
      const stageNote = h('p', { class: 'note', style: { marginTop: '8px' }, text: STAGE_NOTE[stage] || STAGE_NOTE.s });
      function segRow(items, cur, onPick) {
        const row = h('div', { class: 'seg' + (items.length === 2 || items.length === 4 ? ' seg--2' : '') });
        items.forEach(function (it) {
          const b = h('button', { class: 'seg__b' + (it.id === cur ? ' is-on' : ''), type: 'button' }, [h('span', { text: it.name }), it.sub ? h('small', { text: it.sub }) : null]);
          b.onclick = function () { MQ.sfx.tap(); row.querySelectorAll('.seg__b').forEach(function (x) { x.classList.remove('is-on'); }); b.classList.add('is-on'); onPick(it.id); };
          row.appendChild(b);
        });
        return row;
      }
      const voiceNote = h('p', { class: 'note', text: MQ.voice.ready() ? 'この端末には 日本語の 声が 入っています。' : '日本語の 声が 見つかりません。声が 出ない ときは 画面の 字幕を 読んであげてください。' });
      const page = h('div', { class: 'page pp' }, [
        h('div', { class: 'page__body' }, [h('div', { class: 'wrap col' }, [
          h('h1', { class: 'pp__title', text: 'さいしょに 決めること' }),
          h('p', { class: 'note', text: 'ここは おうちの人の 画面です。あとから 右上の かぎを 長おしして 変えられます。' }),
          h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'お子さんの 段階' }),
            segRow([{ id: 's', name: 'ちいさい', sub: '3〜4さい' }, { id: 'm', name: 'なかくらい', sub: '4〜5さい' }, { id: 'l', name: 'おおきい', sub: '5〜6さい' }, { id: 'k', name: 'ねんちょう', sub: '6さい・数字' }], stage, function (v) { stage = v; stageNote.textContent = STAGE_NOTE[v]; }),
            stageNote]),
          h('div', { class: 'card' }, [h('p', { class: 'card__title', text: '声' }),
            segRow([{ id: 'zunda', name: 'ずんだもん', sub: '録音した 声' }, { id: 'device', name: '端末の 声', sub: '高さ・はやさを 変えられる' }], vkind, function (v) { vkind = v; MQ.save.setSetting('voiceKind', v); MQ.voice.setKind(v); }),
            segRow([{ id: 'normal', name: 'ふつうの 声' }, { id: 'high', name: '高めの 声' }], pitch, function (v) { pitch = v; MQ.save.setSetting('pitch', v); MQ.voice.setPitch(v); }),
            segRow([{ id: 'slow', name: 'ゆっくり' }, { id: 'normal', name: 'ふつうの はやさ' }], rate, function (v) { rate = v; MQ.save.setSetting('rate', v); MQ.voice.setRate(v); }),
            h('p', { class: 'note', style: { marginTop: '10px' }, text: '音楽と 効果音（音楽は おうちの 画面だけ・声の あいだは 小さく なります）' }),
            (function () { const st = MQ.save.settings(); return segRow([{ id: 'all', name: '両方 あり', sub: 'おすすめ' }, { id: 'sfx', name: '効果音だけ', sub: '音楽なし' }, { id: 'none', name: 'なし' }], (st.sound === false ? 'none' : st.music === false ? 'sfx' : 'all'), function (v) { MQ.save.setSetting('sound', v !== 'none'); MQ.save.setSetting('music', v === 'all'); MQ.sfx.setEnabled(v !== 'none'); MQ.bgm.setEnabled(v === 'all'); }); })(),
            h('div', { class: 'row', style: { marginTop: '10px' } }, [h('button', { class: 'btn', type: 'button', text: '声を ためす', onclick: function () { MQ.sfx.tap(); MQ.voice.setPitch(pitch); MQ.voice.setRate(rate); MQ.voice.setKind(vkind); MQ.voice.say('こんにちは！ わたしの こえ、きこえる？ いっしょに あそぼうね。', { pitch: pitch }); } })]),
            voiceNote]),
          h('div', { class: 'card' }, [h('p', { class: 'card__title', text: 'お子さんの 名前' }), name]),
          h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'つぎへ：絵を とる', onclick: function () {
            MQ.sfx.tap();
            const cur = MQ.save.kid();
            if (cur) MQ.save.update(function (d) { d.kid.name = (name.value || '').trim(); d.kid.stage = stage; });
            else MQ.save.newKid({ name: (name.value || '').trim(), stage: stage });
            MQ.ui.draw.open();
          } }),
          h('button', { class: 'btn btn--ghost btn--wide', type: 'button', text: 'もどる', onclick: function () { MQ.sfx.tap(); if (MQ.save.kid() && MQ.save.kid().mon) MQ.ui.parent.open(); else MQ.ui.start.open(); } })
        ])])
      ]);
      MQ.ui.mount('screen-setup', page);
      MQ.ui.show('screen-setup');
    }
  };

  /* ---- 絵を とる／かく ---- */
  let lastResult = null;   // { png, cool, src }
  let lastKind = 'paper';   // 'paper'＝紙の 絵／'object'＝ぬいぐるみ・おもちゃ（v0.1.17）
  MQ.ui.draw = {
    open: function () {
      const kid = MQ.save.kid();
      const fileIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'visually-hidden' });
      fileIn.addEventListener('change', function () {
        const f = fileIn.files && fileIn.files[0];
        if (!f) return;
        MQ.sfx.shutter();
        const r = new FileReader();
        r.onload = function () { const im = new Image(); im.onload = function () { fromImage(im, true); }; im.src = String(r.result); };
        r.readAsDataURL(f);
      });
      const page = h('div', { class: 'page pp' }, [
        h('div', { class: 'page__body' }, [h('div', { class: 'wrap col' }, [
          h('h1', { class: 'pp__title', text: 'お子さんの 絵を 入れる' }),
          h('p', { class: 'note', text: '紙に かいた 絵を 写真に とるか、画面に ゆびで かきます。写真は 外に 送りません（この端末の 中だけ）。' }),
          h('button', { class: 'btn btn--gold btn--big btn--wide row', type: 'button', style: { justifyContent: 'center' }, onclick: function () { MQ.sfx.tap(); fileIn.click(); } }, [MQ.ui.icon('camera', 'ico--btn'), h('span', { text: '紙の 絵を 写真に とる' })]),
          h('button', { class: 'btn btn--green btn--big btn--wide row', type: 'button', style: { justifyContent: 'center' }, onclick: function () { MQ.sfx.tap(); openCanvas(); } }, [MQ.ui.icon('pencil', 'ico--btn'), h('span', { text: '画面に ゆびで かく' })]),
          h('p', { class: 'note', text: 'コツ：白い 紙に、太めの 線で、1まいに 1つ。明るい ところで とると きれいに なります。' }),
          h('p', { class: 'note', text: 'ぬいぐるみや おもちゃも OK：床や 机の 上に 1つだけ おいて、まん中に 大きく うつる ように とります。うまく 切りぬけない ときは、白い 紙や 白い 布の 上に おくと きれいに なります。' }),
          h('button', { class: 'btn btn--clay btn--big btn--wide row', type: 'button', style: { justifyContent: 'center' }, onclick: function () { MQ.sfx.tap(); openPresets('cute'); } }, [MQ.ui.icon('sparkle', 'ico--btn'), h('span', { text: 'キャラクターから えらぶ' })]),
          h('p', { class: 'note', text: 'かわいい 8体・かっこいい 8体 から。絵は あとからでも 入れかえられます。' }),
          kid && kid.mon ? h('button', { class: 'btn btn--ghost btn--wide', type: 'button', text: 'いまの ままで よい（もどる）', onclick: function () { MQ.sfx.tap(); MQ.ui.parent.open(); } }) : null,
          fileIn
        ])])
      ]);
      MQ.ui.mount('screen-draw', page);
      MQ.ui.show('screen-draw');
    }
  };

  /* 画面に ゆびで かく：白い 紙 ＋ クレヨン 5色 ＋ けしゴム。できたら 写真と 同じ 道を 通す */
  function openCanvas() {
    const cv = h('canvas', { class: 'draw__cv', width: '640', height: '640' });
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 640, 640);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const COLS = [['#3a3330', 'くろ'], ['#e0493a', 'あか'], ['#4f7fd9', 'あお'], ['#f2c94c', 'きいろ'], ['#6cc24a', 'みどり']];
    let col = COLS[0][0], width = 22, drawing = false, last = null, strokes = 0;
    const crayons = h('div', { class: 'crayons' });
    const btns = COLS.map(function (c, i) {
      const b = h('button', { class: 'crayon' + (i === 0 ? ' is-on' : ''), type: 'button', 'aria-label': c[1], style: { background: c[0] } });
      b.onclick = function () { MQ.sfx.tap(); col = c[0]; width = 22; crayons.querySelectorAll('.crayon').forEach(function (x) { x.classList.remove('is-on'); }); b.classList.add('is-on'); };
      crayons.appendChild(b); return b;
    });
    const eraser = h('button', { class: 'crayon crayon--eraser', type: 'button', 'aria-label': 'けしゴム' });
    eraser.onclick = function () { MQ.sfx.tap(); col = '#ffffff'; width = 60; crayons.querySelectorAll('.crayon').forEach(function (x) { x.classList.remove('is-on'); }); eraser.classList.add('is-on'); };
    crayons.appendChild(eraser);
    function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 640]; }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drawing = true; last = pos(e); strokes++; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* なし */ } g.beginPath(); g.fillStyle = col; g.arc(last[0], last[1], width / 2, 0, Math.PI * 2); g.fill(); });
    cv.addEventListener('pointermove', function (e) { if (!drawing) return; e.preventDefault(); const p = pos(e); g.strokeStyle = col; g.lineWidth = width; g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { drawing = false; }); });
    cv.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    cv.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    const page = h('div', { class: 'page' }, [
      h('div', { class: 'page__body' }, [h('div', { class: 'wrap draw' }, [
        h('p', { class: 'balloon__tx', text: 'すきな ものを かいてね', style: { margin: '0' } }),
        cv, crayons,
        h('div', { class: 'row', style: { width: '320px' } }, [
          h('button', { class: 'btn', type: 'button', text: 'ぜんぶ けす', onclick: function () { MQ.sfx.tap(); g.fillStyle = '#fff'; g.fillRect(0, 0, 640, 640); strokes = 0; } }),
          h('button', { class: 'btn btn--gold btn--big', type: 'button', text: 'できた！', style: { flex: '1' }, onclick: function () {
            MQ.sfx.tap();
            if (!strokes) { MQ.ui.toast('なにか かいてね'); return; }
            const im = new Image(); im.onload = function () { fromImage(im, false); }; im.src = cv.toDataURL('image/png');
          } })
        ]),
        h('button', { class: 'btn btn--ghost', type: 'button', text: 'もどる', onclick: function () { MQ.sfx.tap(); MQ.ui.draw.open(); } })
      ])])
    ]);
    MQ.ui.mount('screen-draw', page);
    MQ.ui.show('screen-draw');
  }
  MQ.ui.draw.openCanvas = openCanvas;

  /* さいしょから いる キャラクターから えらぶ（かわいい／かっこいい） */
  function openPresets(groupId) {
    groupId = groupId || 'cute';
    const tabs = h('div', { class: 'seg seg--2' });
    MQ.presets.GROUPS.forEach(function (g) {
      const b = h('button', { class: 'seg__b' + (g.id === groupId ? ' is-on' : ''), type: 'button' }, [h('span', { text: g.name })]);
      b.onclick = function () { MQ.sfx.tap(); openPresets(g.id); };
      tabs.appendChild(b);
    });
    const grid = h('div', { class: 'pgrid' });
    MQ.presets.list(groupId).forEach(function (pz) {
      const b = h('button', { class: 'ptile', type: 'button', 'aria-label': pz.name }, [MQ.blocks.imgBox(pz.png, { size: 96 }), h('span', { text: pz.name })]);
      b.onclick = function () {
        MQ.sfx.tap();
        lastResult = { png: pz.png, sets: [], dark: false, preset: pz };
        openPreview(null, false, pz);
      };
      grid.appendChild(b);
    });
    const page = h('div', { class: 'page pp' }, [
      h('div', { class: 'page__body' }, [h('div', { class: 'wrap col' }, [
        h('h1', { class: 'pp__title', text: 'キャラクターを えらぶ' }),
        h('p', { class: 'note', text: 'お子さんに「どれが いい？」と きいて、タップしてください。' }),
        tabs, grid,
        (MQ.save.kid() && MQ.save.kid().mon) ? h('button', { class: 'btn btn--ghost btn--wide', type: 'button', text: 'いまの ままで よい（もどる）', onclick: function () { MQ.sfx.tap(); MQ.ui.parent.open(); } })
          : h('button', { class: 'btn btn--ghost btn--wide', type: 'button', text: 'もどる', onclick: function () { MQ.sfx.tap(); MQ.ui.draw.open(); } })
      ])])
    ]);
    MQ.ui.mount('screen-draw', page);
    MQ.ui.show('screen-draw');
  }
  MQ.ui.draw.openPresets = openPresets;

  /* 写真／ゆびの 絵 → そのまま／絵本ふう（js/core/cutout.js）→ えらぶ。v0.1.4 から ブロックには しない（ユーザー決定） */
  function fromImage(im, isPhoto) {
    // 紙の 絵（白い 紙が 見つかる）は いままでの cutout、床・机の 上の ぬいぐるみ・おもちゃは subject（v0.1.17）
    const paper = !isPhoto || !MQ.subject || MQ.subject.isPaper(im, null);
    let res = null;
    if (paper) {
      const crop = isPhoto ? (MQ.trace.autoCrop(im) || MQ.trace.defaultCrop(im)) : { x: 0, y: 0, w: 1, h: 1 };
      try { res = MQ.cutout.fromImage(im, crop); } catch (e) { res = null; }
    } else {
      try { res = MQ.subject.fromImage(im, { x: 0, y: 0, w: 1, h: 1 }); } catch (e) { res = null; }
    }
    if (!res || !res.raw || res.drawn < 30) {
      MQ.ui.toast(isPhoto ? (paper ? '絵が 見つかりません。明るい ところで、絵を 大きく とってね' : 'なにを とったか わかりません。白い 紙か 白い 布の 上に おいて、明るい ところで とってね') : 'もう すこし 大きく かいてね', 3200);
      return;
    }
    lastKind = paper ? 'paper' : 'object';
    lastResult = { png: res.raw.png, sets: [{ tag: 'raw', name: 'そのまま', set: res.raw }, { tag: 'soft', name: '絵本ふう', set: res.soft }], dark: res.dark };
    openPreview(im, isPhoto);
  }
  MQ.ui.draw.fromImage = fromImage;

  function openPreview(im, isPhoto, preset) {
    const kid = MQ.save.kid() || {};
    const choices = preset ? [{ tag: 'preset', name: preset.name, png: lastResult.png, set: preset }] : lastResult.sets.map(function (x) { return { tag: x.tag, name: x.name, png: x.set.png, set: x.set }; });
    let pick = 0;
    const nameIn = h('input', { class: 'field', type: 'text', maxlength: '8', placeholder: '生きものの 名前', value: preset ? preset.name : ((kid.mon && kid.mon.name) || 'たまごちゃん') });
    const row = h('div', { class: 'preview' });
    choices.forEach(function (c, i) {
      const b = h('button', { class: 'preview__b' + (i === 0 ? ' is-on' : ''), type: 'button' }, [MQ.blocks.imgBox(c.png, { size: 128 }), h('span', { text: c.name })]);
      b.onclick = function () { MQ.sfx.tap(); pick = i; row.querySelectorAll('.preview__b').forEach(function (x) { x.classList.remove('is-on'); }); b.classList.add('is-on'); };
      row.appendChild(b);
    });
    const page = h('div', { class: 'page pp' }, [
      h('div', { class: 'page__body' }, [h('div', { class: 'wrap col' }, [
        h('h1', { class: 'pp__title', text: 'この すがたで いい？' }),
        h('p', { class: 'note', text: 'お子さんと いっしょに えらんでください。' + (lastResult.dark ? ' 写真が 暗めです。うまく 出て いなければ もう一度 明るい ところで。' : '') + (!preset && lastKind === 'object' ? ' まわりが のこって いたり 一部が 消えて いたら、白い 紙や 白い 布の 上に おいて とりなおすと きれいに なります。' : '') }),
        row,
        h('div', { class: 'card' }, [h('p', { class: 'card__title', text: '生きものの 名前（声で よびます）' }), nameIn]),
        h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'たまごに する', onclick: function () {
          MQ.sfx.tap();
          const c = choices[pick];
          const name = (nameIn.value || '').trim() || 'たまごちゃん';
          makeMon(c.png, name, function (mon) { MQ.save.setMon(mon); MQ.ui.egg.open(); }, preset, c.set);
        } }),
        h('button', { class: 'btn btn--ghost btn--wide', type: 'button', text: preset ? 'ほかの キャラクター' : isPhoto ? 'とりなおす' : 'かきなおす', onclick: function () { MQ.sfx.tap(); if (preset) openPresets(preset.group); else if (isPhoto) MQ.ui.draw.open(); else openCanvas(); } })
      ])])
    ]);
    MQ.ui.mount('screen-draw', page);
    MQ.ui.show('screen-draw');
  }

  /* まなびモンスターと 同じ 形の「じぶんの モンスター」を 作る。2・3段階めの 絵（png2／png3）は set（presets.js の キャラクター か cutout.js の そのまま／絵本ふう）から。
     v0.1.4 から monstergen の evoPng（ブロック）は 使わない */
  function makeMon(png, name, cb, preset, set) {
    const mon = { id: 'my-' + MQ.util.uid(), name: name, area: 'sansu', png: png, trace: true, from: 'tamago' };
    if (preset) { mon.trace = false; mon.preset = preset.id; }
    if (set) { if (set.png2) mon.png2 = set.png2; if (set.png3) mon.png3 = set.png3; }
    cb(mon);
  }
  MQ.ui.makeMon = makeMon;

  /* ---- たまご ---- */
  MQ.ui.egg = {
    open: function () {
      const kid = MQ.save.kid();
      const mon = kid && kid.mon;
      const png = mon ? mon.png : '';
      let taps = 0;
      const egg = eggNode(png);
      const crack = h('svg', { class: 'egg__crack' });
      crack.innerHTML = '<svg viewBox="0 0 140 180" fill="none" stroke="#4a3b32" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="140" height="180"><path class="c1" d="M40 60 L56 74 L48 90" opacity="0"/><path class="c2" d="M96 48 L84 66 L94 80 L80 96" opacity="0"/><path class="c3" d="M48 90 L66 100 L58 120 L76 132" opacity="0"/></svg>';
      egg.appendChild(crack);
      const dots = h('div', { class: 'dots3' }, [h('i'), h('i'), h('i')]);
      const scene = MQ.ui.sceneNode(380);
      const nest = h('div', { class: 'nest', style: { position: 'absolute', left: '100px', top: '262px' } }, [h('i', { class: 'nest__a' }), h('i', { class: 'nest__b' })]);
      const eggBox = h('button', { class: 'item', type: 'button', 'aria-label': 'たまごを とんとん', style: { position: 'absolute', left: '130px', top: '96px', width: '140px', height: '180px' } }, [egg]);
      const finger = h('div', { class: 'finger', style: { left: '236px', top: '226px' } });
      scene.appendChild(nest); scene.appendChild(eggBox); scene.appendChild(finger);
      const bl = MQ.ui.balloon('');
      const monBox = h('div', { style: { position: 'absolute', left: '120px', top: '110px', display: 'none' } });
      scene.appendChild(monBox);
      const page = h('div', { class: 'page' }, [
        h('div', { class: 'top' }, [h('span'), h('span')]),
        scene,
        h('div', { class: 'wrap col', style: { gap: '14px' } }, [bl, dots, MQ.ui.hintBox('「なにが でて くるかな？」と きいてみて。3回 たたくと かえります')])
      ]);
      MQ.ui.mount('screen-egg', page);
      MQ.ui.show('screen-egg');
      setTimeout(function () { bl.say('たまごを とんとん して みて！'); }, 300);
      eggBox.onclick = function () {
        if (taps >= 3) return;
        taps++;
        MQ.sfx.tap();
        egg.classList.remove('is-wobble'); void egg.offsetWidth; egg.classList.add('is-wobble');
        const c = crack.querySelector('.c' + taps); if (c) c.setAttribute('opacity', '1');
        dots.querySelectorAll('i')[taps - 1].classList.add('is-on');
        if (taps < 3) { bl.say('あと ' + MQ.tasks.num(3 - taps) + '！'); return; }
        finger.style.display = 'none';
        bl.say('わあ！');
        setTimeout(function () {
          egg.classList.add('is-hatch');
          MQ.sfx.rare();
          setTimeout(function () {
            eggBox.style.display = 'none';
            monBox.style.display = '';
            monBox.appendChild(MQ.ui.monNode(160));
            monBox.firstChild.mood('happy');
            MQ.ui.confetti(scene, 30);
            const nm = mon ? mon.name : 'たまごちゃん';
            bl.say('うまれた！ ' + nm + 'だよ。よろしくね！', function () {
              page.querySelector('.wrap').appendChild(h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'おうちへ', onclick: function () { MQ.sfx.tap(); MQ.ui.home.open(); } }));
            });
          }, 500);
        }, 500);
      };
    }
  };
})();
