/* ---------------------------------------------------------
   紙に もどす（ころたま v0.2・F）＋ せいちょう アルバム（H）
   おうちの人の 画面から：ぬりえ／たてる おにんぎょう（工作）／がんばり しょうじょう／アルバム を A4 で 印刷（PDF 保存も）。
   ぬった ぬりえを 写真に とると、その 色の すがたに（おうちの人の 画面「ぬりえを 写真で とりこむ」→ 絵を とる 道）。
   おうちの人むけ なので 大人の 文章（ずんだもんの 名前は 出さない）。紙の 中の 子ども向けの ことばだけ ひらがな。
     MQ.ui.print.open(kind)   … kind＝'nurie'|'craft'|'award'|'album'（画面で 下見 → 印刷）
     MQ.ui.print.lineArt(src, cb) … 絵 → 線だけの ぬりえ（cb(dataURL)）
     MQ.ui.album.open()       … アルバムの 画面
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;

  /* 絵 → ぬりえの 線（ふちと 色の さかいを 線に・中は 白） */
  function lineArt(src, cb) {
    const im = new Image();
    im.onload = function () {
      const N = 480, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
      const g = cv.getContext('2d');
      const k = Math.min(N / im.width, N / im.height) * 0.92, w = im.width * k, hh = im.height * k;
      g.drawImage(im, (N - w) / 2, (N - hh) / 2, w, hh);
      const d = g.getImageData(0, 0, N, N).data;
      const L = new Float32Array(N * N), A = new Uint8Array(N * N);
      for (let i = 0; i < N * N; i++) { const a = d[i * 4 + 3]; const lum = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]; A[i] = a > 90 && lum < 238 ? 1 : 0; /* 白い 紙の ところは 外（ふちの 四角い 線を 出さない） */ L[i] = a > 90 ? (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) : 255; }
      const out = g.createImageData(N, N), o = out.data;
      o.fill(255);   /* はしの 1マスも 白に（0の ままだと 黒い 四角い わくに なる） */
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
        const i = y * N + x;
        const edgeA = A[i] && (!A[i - 1] || !A[i + 1] || !A[i - N] || !A[i + N]);
        const gx = L[i + 1] - L[i - 1], gy = L[i + N] - L[i - N];
        const edgeL = A[i] && Math.sqrt(gx * gx + gy * gy) > 58;
        const dark = A[i] && L[i] < 70;   // くろい 線（目・口）は そのまま
        const inside = x > (N - w) / 2 + 3 && x < (N + w) / 2 - 3 && y > (N - hh) / 2 + 3 && y < (N + hh) / 2 - 3;   /* 絵の ふちの 四角は 線に しない */
        const on = inside && (edgeA || edgeL || dark);
        const v = on ? 58 : 255;
        o[i * 4] = v; o[i * 4 + 1] = v; o[i * 4 + 2] = v; o[i * 4 + 3] = 255;
      }
      // 線を 少し ふとく
      const thick = g.createImageData(N, N), t = thick.data;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let m = 255;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < N && xx >= 0 && xx < N) m = Math.min(m, o[(yy * N + xx) * 4]); }
        const i = (y * N + x) * 4; t[i] = t[i + 1] = t[i + 2] = m; t[i + 3] = 255;
      }
      g.putImageData(thick, 0, 0);
      cb(cv.toDataURL('image/png'));
    };
    im.onerror = function () { cb(''); };
    im.src = src;
  }

  function fmt(t) { const d = new Date(t); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
  function kidName() { const k = MQ.save.kid(); return (k && k.name) || ''; }
  function monName() { const k = MQ.save.kid(); return (k && k.mon && k.mon.name) || 'たまごちゃん'; }

  /* ---- 紙（A4・mm で 組む） ---- */
  const SHEETS = {
    nurie: { title: 'ぬりえ', note: 'キャラクターを線だけにした絵です。クレヨンでぬった後に写真で取り込むと、その色の姿になります。', build: function (cb) {
      lineArt(MQ.save.monPng(), function (url) {
        cb(h('div', { class: 'ps ps--nurie' }, [
          h('div', { class: 'ps__head' }, [h('span', { text: monName() + 'を ぬってね' })]),
          h('img', { class: 'ps__big', src: url, alt: '' }),
          h('div', { class: 'ps__foot', text: 'ころたま' + (kidName() ? '　なまえ：' + kidName() : '　なまえ：') })
        ]));
      });
    } },
    craft: { title: '立てるおにんぎょう（工作）', note: '太い線で切り抜き、真ん中の点線で山折りにして、下ののりしろを貼り合わせると立ちます。', build: function (cb) {
      const png = MQ.save.monPng();
      cb(h('div', { class: 'ps ps--craft' }, [
        h('div', { class: 'ps__head' }, [h('span', { text: 'たてる ' + monName() })]),
        h('div', { class: 'ps__cut' }, [
          h('div', { class: 'ps__half ps__half--back' }, [h('img', { src: png, alt: '' })]),
          h('div', { class: 'ps__fold' }),
          h('div', { class: 'ps__half' }, [h('img', { src: png, alt: '' })]),
          h('div', { class: 'ps__tab' }, [h('span', { text: 'のりしろ' })])
        ]),
        h('p', { class: 'ps__how', text: '① ふとい せんで きる　② まんなかの てんせんで やまおり　③ のりしろを はって たてる' }),
        h('div', { class: 'ps__foot', text: 'ころたま' })
      ]));
    } },
    award: { title: 'がんばり賞状', note: 'スタンプとおてつだいの数を入れた賞状です。', build: function (cb) {
      const k = MQ.save.kid();
      cb(h('div', { class: 'ps ps--award' }, [
        h('div', { class: 'ps__frame' }, [
          h('p', { class: 'ps__aw', text: 'しょうじょう' }),
          h('p', { class: 'ps__nm', text: (kidName() || '　　　　') + ' さん' }),
          h('img', { class: 'ps__mid', src: MQ.save.monPng(), alt: '' }),
          h('p', { class: 'ps__tx', text: 'あなたは ' + monName() + 'と いっしょに まいにち たくさん あそび、スタンプを ' + MQ.save.stampsTotal() + 'こ、おてつだいを ' + MQ.save.helpCount() + 'かい がんばりました。' }),
          h('p', { class: 'ps__tx', text: 'ここに その がんばりを たたえます。' }),
          h('p', { class: 'ps__dt', text: fmt(Date.now()) + '　おうちの ひとより' })
        ])
      ]));
      void k;
    } },
    album: { title: '成長アルバム', note: 'アルバムの内容をA4にまとめます。', build: function (cb) {
      cb(h('div', { class: 'ps ps--album' }, [h('div', { class: 'ps__head' }, [h('span', { text: monName() + 'の せいちょう アルバム' })])].concat(albumEntries(true)).concat([h('div', { class: 'ps__foot', text: 'ころたま　' + fmt(Date.now()) })])));
    } }
  };

  /* ---- アルバムの 中身（画面と 紙で つかう） ---- */
  function albumEntries(paper) {
    const k = MQ.save.kid(); if (!k || !k.mon) return [];
    const mon = k.mon, out = [];
    const ent = function (t, img, title, text) { out.push(h('div', { class: 'al__e' + (paper ? ' al__e--p' : '') }, [img ? h('img', { class: 'al__img', src: img, alt: '' }) : h('div', { class: 'al__img al__img--none' }), h('div', { class: 'al__tx' }, [h('p', { class: 'al__d', text: t ? fmt(t) : '' }), h('p', { class: 'al__t', text: title }), text ? h('p', { class: 'al__s', text: text }) : null])])); };
    const days = Object.keys(k.log || {}).length;
    const done = k.done || {};
    const total = ['count', 'color', 'shape', 'compare', 'moji', 'tokei', 'draw', 'find', 'mane'].reduce(function (a, x) { return a + (done[x] || 0); }, 0);
    out.push(h('div', { class: 'al__stats' }, [
      ['遊んだ日', days + '日'], ['あそび', total + '回'], ['スタンプ', MQ.save.stampsTotal() + '個'], ['おてつだい', MQ.save.helpCount() + '回']
    ].map(function (x) { return h('div', { class: 'al__st' }, [h('b', { text: x[1] }), h('span', { text: x[0] })]); })));
    ent(k.created, mon.png, mon.name + 'が生まれた', mon.trace ? 'お子さんの絵から生まれました' : 'キャラクターから選びました');
    if (k.grewAt && k.grewAt[2]) ent(k.grewAt[2], mon.png2 || mon.png, '姿が変わった（2段階目）', 'スタンプとおてつだいが' + MQ.save.GROW_AT[1] + '個になりました');
    if (k.grewAt && k.grewAt[3]) ent(k.grewAt[3], mon.png3 || mon.png, '立派な姿に（3段階目）', 'スタンプとおてつだいが' + MQ.save.GROW_AT[2] + '個になりました');
    const it = k.items || {};
    const drawn = [];
    (it.foods || []).forEach(function (x) { drawn.push([x, '描いた食べもの']); });
    if (it.hat) drawn.push([it.hat, '描いた帽子']);
    if (it.friend) drawn.push([it.friend, '描いたおともだち']);
    (it.garden || []).forEach(function (x) { drawn.push([x, 'お庭の飾り']); });
    drawn.sort(function (a, b) { return a[0].at - b[0].at; }).forEach(function (x) { ent(x[0].at, x[0].png, x[1], null); });
    (k.finds || []).forEach(function (f) { ent(f.at, f.png, '見つけたもの', f.what || ''); });
    return out;
  }

  let printRoot = null;
  function doPrint(sheet) {
    if (printRoot && printRoot.parentNode) printRoot.parentNode.removeChild(printRoot);
    printRoot = h('div', { id: 'print-root' }, [sheet.cloneNode(true)]);
    document.body.appendChild(printRoot);
    document.body.classList.add('is-printing');
    const done = function () { document.body.classList.remove('is-printing'); if (printRoot && printRoot.parentNode) printRoot.parentNode.removeChild(printRoot); printRoot = null; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { try { window.print(); } catch (e) { /* なし */ } setTimeout(done, 1500); }, 300);
  }

  function open(kind) {
    const S = SHEETS[kind] || SHEETS.nurie;
    const holder = h('div', { class: 'ps__prev' });
    const page = h('div', { class: 'page pp' }, [
      h('div', { class: 'page__body' }, [h('div', { class: 'wrap col' }, [
        h('div', { class: 'row', style: { justifyContent: 'space-between' } }, [h('h1', { class: 'pp__title', text: S.title }), h('button', { class: 'btn', type: 'button', text: 'もどる', onclick: function () { MQ.sfx.tap(); if (kind === 'album') MQ.ui.album.open(); else MQ.ui.parent.open(); } })]),
        h('p', { class: 'note', text: S.note }),
        holder,
        h('button', { class: 'btn btn--gold btn--big btn--wide row', type: 'button', style: { justifyContent: 'center' }, onclick: function () { MQ.sfx.tap(); const sh = holder.querySelector('.ps'); if (sh) doPrint(sh); } }, [MQ.ui.icon('print', 'ico--btn'), h('span', { text: '印刷する・PDF保存' })]),
        kind === 'nurie' ? h('button', { class: 'btn btn--wide', type: 'button', text: 'ぬったぬりえを写真で取り込む', onclick: function () { MQ.sfx.tap(); MQ.ui.draw.open(); } }) : null,
        h('p', { class: 'note', text: '印刷画面で「PDFに保存」を選ぶとファイルにできます。用紙はA4です。' })
      ])])
    ]);
    MQ.ui.mount('screen-print', page);
    MQ.ui.show('screen-print');
    S.build(function (sheet) { holder.innerHTML = ''; holder.appendChild(sheet); MQ.ui.print._sheet = sheet; });
  }
  MQ.ui.print = { open: open, lineArt: lineArt, SHEETS: SHEETS, doPrint: doPrint };

  /* ---- アルバム（H） ---- */
  MQ.ui.album = {
    open: function () {
      const k = MQ.save.kid();
      const page = h('div', { class: 'page pp' }, [
        h('div', { class: 'page__body' }, [h('div', { class: 'wrap col' }, [
          h('div', { class: 'row', style: { justifyContent: 'space-between' } }, [h('h1', { class: 'pp__title', text: '成長アルバム' }), h('button', { class: 'btn', type: 'button', text: 'もどる', onclick: function () { MQ.sfx.tap(); MQ.ui.parent.open(); } })]),
          h('p', { class: 'note', text: (k && k.mon ? k.mon.name + 'と' : '') + 'お子さんの歩みです。生まれた日、姿が変わった日、描いた絵、見つけたものが日付順に残ります（この端末の中だけに保存）。' }),
          h('div', { class: 'al' }, albumEntries(false)),
          h('button', { class: 'btn btn--gold btn--big btn--wide row', type: 'button', style: { justifyContent: 'center' }, onclick: function () { MQ.sfx.tap(); open('album'); } }, [MQ.ui.icon('print', 'ico--btn'), h('span', { text: '印刷・PDF保存' })])
        ])])
      ]);
      MQ.ui.mount('screen-album', page);
      MQ.ui.show('screen-album');
    },
    entries: albumEntries
  };
})();
