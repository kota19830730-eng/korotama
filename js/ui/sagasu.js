/* ---------------------------------------------------------
   本物さがし（ころたま v0.2・C）
   生きもの「あかい ものを さがして、みせてね！」→ お子さんが 部屋から もってくる →
     いろの おだい：カメラで とる → まんなかの 色を 読んで こたえる（ちがっても「それは あおだね。あかい ものは あるかな？」・ばつなし）
     そのほか（まるい・ながい・ふたつ…）：カメラで とるか、おうちの人が「○ あってる」
   3つ みつけたら できた！（スタンプ）。とった 写真は 小さく して アルバム（H）に のこる（12まい・この 端末の 中だけ）。
     MQ.ui.sagasu.open()
     MQ.ui.sagasu.judgeImage(img) … テスト用（写真の かわりに 絵を わたす）
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  let round = 0, mission = null, used = [], els = {}, busy = false;

  function picNode(p) {
    if (!p) return null;
    if (p.type === 'color') { const c = MQ.tasks.COLORS.filter(function (x) { return x.id === p.id; })[0]; return h('div', { class: 'sg__swatch', style: { background: c ? c.hex : '#ccc' } }); }
    if (p.type === 'shape') { const c = MQ.tasks.COLORS.filter(function (x) { return x.id === (p.color || 'yellow'); })[0]; return MQ.ui.shapeNode(p.id, c); }
    if (p.type === 'num') { const box = h('div', { class: 'sg__num' }); for (let i = 0; i < p.id; i++) box.appendChild(MQ.ui.foodNode('apple', true)); return box; }
    return h('div', { class: 'sg__ico', html: ICON[p.id] || '' });
  }
  const ICON = {
    long: '<svg viewBox="0 0 64 64"><rect x="4" y="27" width="56" height="10" rx="5" fill="#f2b544"/><path d="M60 32l-8-5v10z" fill="#3a3330"/><rect x="4" y="27" width="10" height="10" rx="3" fill="#f08cb0"/></svg>',
    soft: '<svg viewBox="0 0 64 64"><g fill="#fffdf7" stroke="#e3d6bd" stroke-width="2"><circle cx="22" cy="34" r="12"/><circle cx="34" cy="26" r="14"/><circle cx="44" cy="36" r="11"/><circle cx="30" cy="40" r="12"/></g></svg>',
    big: '<svg viewBox="0 0 64 64"><rect x="30" y="6" width="28" height="54" rx="3" fill="#b98c45"/><circle cx="52" cy="34" r="2" fill="#f2b544"/><circle cx="14" cy="44" r="6" fill="#f08cb0"/><rect x="9" y="50" width="10" height="10" rx="3" fill="#f08cb0"/></svg>'
  };

  function open() { round = 0; used = []; next(); }
  function next() {
    const kid = MQ.save.kid();
    mission = MQ.find.mission(kid.stage, used);
    used.push(mission.key);
    busy = false;
    render();
    setTimeout(function () { ask(); }, 250);
  }
  function ask() { els.bl.say(mission.line + (mission.type === 'color' ? ' もってきたら、カメラで みせてね。' : ' みつけたら、おうちの ひとに みせてね。')); }
  function render() {
    const mon = MQ.ui.monNode(130);
    mon.addEventListener('click', function () { MQ.ui.quietTap(mon); });
    const bl = MQ.ui.balloon('');
    const photo = h('div', { class: 'sg__photo' }, [picNode(mission.pic)]);
    const fileIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'visually-hidden' });
    fileIn.addEventListener('change', function () {
      const f = fileIn.files && fileIn.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function () { const im = new Image(); im.onload = function () { judgeImage(im); }; im.src = String(r.result); };
      r.readAsDataURL(f);
      fileIn.value = '';
    });
    const cam = h('button', { class: 'btn btn--gold btn--big btn--wide row', type: 'button', style: { justifyContent: 'center' }, onclick: function () { if (busy) return; MQ.sfx.tap(); MQ.ui.stopSpeak(); fileIn.click(); } }, [MQ.ui.icon('camera2', 'ico--btn'), h('span', { text: 'カメラで みせる' })]);
    const okBtn = h('button', { class: 'btn btn--wide sg__ok', type: 'button', text: 'おうちの人：みつかった（ながおし）' });
    MQ.ui.hold(okBtn, 900, function () { if (busy) return; found(null); });
    els = { mon: mon, bl: bl, photo: photo };
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: ask }),
      h('div', { class: 'field2' }, [
        h('div', { class: 'scene__hill', style: { left: '-60px', top: '130px', width: '300px', height: '160px', background: 'var(--grass)' } }),
        h('div', { class: 'scene__hill', style: { left: '190px', top: '140px', width: '300px', height: '160px', background: 'var(--grass2)' } }),
        h('div', { style: { position: 'absolute', left: '28px', top: '40px' } }, [mon]),
        h('div', { style: { position: 'absolute', left: '206px', top: '22px' } }, [photo])
      ]),
      h('div', { class: 'wrap col', style: { gap: '10px', paddingTop: '6px', alignItems: 'stretch' } }, [
        bl, h('div', { class: 'dots3' }, [0, 1, 2].map(function (i) { return h('i', { class: i < round ? 'is-on' : '' }); })),
        cam, fileIn, okBtn,
        MQ.ui.hintBox(mission.type === 'color' ? 'お部屋から さがして、カメラで 見せると 色を 読みます。読みちがいの ときは 下の ボタンを 長おし' : 'さがして きたら 見て あげて、あって いれば 下の ボタンを 長おし（写真を とっても OK）')
      ])
    ]);
    MQ.ui.mount('screen-sagasu', page);
    MQ.ui.show('screen-sagasu');
  }
  /* 写真 → 小さく（96px の jpeg）＋ まんなかの 色を 読む */
  function judgeImage(im) {
    if (busy) return;
    const W = 96, k = W / Math.max(im.width, im.height);
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k));
    const g = cv.getContext('2d'); g.drawImage(im, 0, 0, cv.width, cv.height);
    let cls = null;
    try { cls = MQ.find.classify(g.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height); } catch (e) { cls = null; }
    const thumb = cv.toDataURL('image/jpeg', 0.7);
    els.photo.innerHTML = ''; els.photo.appendChild(h('img', { src: thumb, alt: '' }));
    MQ.sfx.shutter();
    MQ.ui.sagasu._last = cls;
    if (mission.type !== 'color') { els.bl.say('これかな？ おうちの ひとに みてもらってね。'); els.pending = thumb; return; }
    if (cls && MQ.find.match(mission, cls)) { found(thumb); return; }
    els.mon.mood('tilt');
    const adj = MQ.find.ADJ[mission.color];
    els.bl.say((cls ? MQ.find.seen(cls) : 'いろが よく みえないね。') + ' ' + adj + ' ものは あるかな？ もういちど さがして みよう！', null, [picNode(mission.pic)]);
  }
  function found(thumb) {
    busy = true;
    thumb = thumb || els.pending || null;
    MQ.save.update(function (d) {
      if (!thumb) return;
      d.kid.finds.push({ png: thumb, what: mission.line.replace(/を さがして.*|を もってきて.*/, ''), at: Date.now() });
      while (d.kid.finds.length > 12) d.kid.finds.shift();
    });
    MQ.sfx.correct();
    els.mon.mood('jump');
    MQ.ui.confetti(els.photo.parentNode, 14);
    els.bl.say(mission.ok, function () {
      round++;
      if (round >= MQ.tasks.ROUNDS) MQ.ui.finish('find');
      else next();
    });
  }
  MQ.ui.sagasu = { open: open, judgeImage: judgeImage, found: function () { found(null); }, state: function () { return { round: round, mission: mission }; } };
})();
