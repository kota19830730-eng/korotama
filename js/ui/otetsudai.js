/* ---------------------------------------------------------
   おてつだい（ころたま v0.2・D）
   おうちの ばめんの ふうとうを おす → 生きもの「おてがみ だよ！ きょうの おねがい。くつを そろえて きてくれる？」（絵つき）
   → お子さんが 本当に する → おうちの人が「できた」を 長おし → はなまる（すがたの 成長にも 1こ ぶん・1日 1つ）。
     MQ.ui.otetsudai.open()
     MQ.ui.otetsudai.ICON … おてつだいの 絵（絵本ふうの SVG）
   --------------------------------------------------------- */
window.MQ = window.MQ || {};
MQ.ui = MQ.ui || {};

(function () {
  const h = MQ.util.h;
  const ICON = {
    shoes: '<svg viewBox="0 0 80 64"><g fill="#e0493a"><path d="M8 40c0-8 4-14 10-14 4 0 6 4 10 6l6 3c4 2 4 9-2 9H12c-3 0-4-2-4-4z"/><path d="M42 40c0-8 4-14 10-14 4 0 6 4 10 6l6 3c4 2 4 9-2 9H46c-3 0-4-2-4-4z"/></g><g fill="#fffdf7"><rect x="8" y="42" width="28" height="4" rx="2"/><rect x="42" y="42" width="28" height="4" rx="2"/></g><path d="M4 52h72" stroke="#c9b48c" stroke-width="3" stroke-linecap="round"/></svg>',
    teeth: '<svg viewBox="0 0 80 64"><rect x="10" y="30" width="44" height="8" rx="4" fill="#4f7fd9" transform="rotate(-20 32 34)"/><g fill="#fffdf7" stroke="#cfd8e8" stroke-width="1.5" transform="rotate(-20 32 34)"><rect x="48" y="20" width="4" height="10" rx="1"/><rect x="53" y="19" width="4" height="11" rx="1"/><rect x="58" y="20" width="4" height="10" rx="1"/></g><g fill="#bfe3f5"><circle cx="66" cy="14" r="4"/><circle cx="72" cy="24" r="3"/><circle cx="62" cy="6" r="2.5"/></g></svg>',
    toys: '<svg viewBox="0 0 80 64"><rect x="12" y="30" width="56" height="28" rx="4" fill="#d9b06a"/><rect x="12" y="30" width="56" height="7" fill="#c49a52"/><circle cx="28" cy="24" r="9" fill="#e0493a"/><rect x="40" y="14" width="14" height="14" rx="2" fill="#4f7fd9"/><path d="M58 28l6-12 6 12z" fill="#f2c94c"/></svg>',
    hands: '<svg viewBox="0 0 80 64"><path d="M22 52V24a4 4 0 0 1 8 0v14V16a4 4 0 0 1 8 0v22V18a4 4 0 0 1 8 0v20-12a4 4 0 0 1 8 0v18c0 10-6 14-16 14h-4c-8 0-12-4-12-6z" fill="#fbd9bd"/><g fill="#bfe3f5" stroke="#8cc8e6" stroke-width="1.4"><circle cx="16" cy="18" r="6"/><circle cx="62" cy="12" r="5"/><circle cx="66" cy="28" r="4"/><circle cx="10" cy="34" r="4"/></g></svg>',
    clothes: '<svg viewBox="0 0 80 64"><path d="M28 8l-16 8 6 12 6-3v31h32V25l6 3 6-12-16-8c-2 5-6 8-12 8s-10-3-12-8z" fill="#6cc24a"/><circle cx="40" cy="30" r="2.4" fill="#fffdf7"/><circle cx="40" cy="40" r="2.4" fill="#fffdf7"/></svg>',
    chopsticks: '<svg viewBox="0 0 80 64"><ellipse cx="40" cy="50" rx="30" ry="8" fill="#fffdf7" stroke="#e3d6bd" stroke-width="2"/><path d="M14 18l50 26M20 12l50 26" stroke="#b5654a" stroke-width="4" stroke-linecap="round"/><path d="M14 18l10 5M20 12l10 5" stroke="#e0493a" stroke-width="5" stroke-linecap="round"/></svg>',
    itadakimasu: '<svg viewBox="0 0 80 64"><ellipse cx="40" cy="54" rx="26" ry="6" fill="#d2765c"/><path d="M14 48h52a26 26 0 0 1-52 0z" fill="#fffdf7"/><path d="M22 40c4-8 32-8 36 0" fill="#fffdf7" stroke="#e3d6bd" stroke-width="2"/><path d="M30 26c2-6 6-6 6 0M44 26c2-6 6-6 6 0" stroke="#b98c45" stroke-width="2.4" fill="none"/></svg>',
    thanks: '<svg viewBox="0 0 80 64"><path d="M40 58C24 46 12 38 12 24a13 13 0 0 1 28-7 13 13 0 0 1 28 7c0 14-12 22-28 34z" fill="#f08cb0"/><path d="M28 22a6 6 0 0 1 8-4" stroke="#fffdf7" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    towel: '<svg viewBox="0 0 80 64"><rect x="12" y="38" width="56" height="12" rx="3" fill="#7fb0e0"/><rect x="16" y="26" width="48" height="12" rx="3" fill="#f2c94c"/><rect x="20" y="14" width="40" height="12" rx="3" fill="#f08cb0"/><path d="M12 44h56M16 32h48M20 20h40" stroke="rgba(255,255,255,.5)" stroke-width="1.6"/></svg>',
    trash: '<svg viewBox="0 0 80 64"><path d="M22 22h36l-4 36H26z" fill="#7fb069"/><rect x="18" y="16" width="44" height="7" rx="3" fill="#5b8a49"/><path d="M32 30v20M40 30v20M48 30v20" stroke="#5b8a49" stroke-width="2.4"/><path d="M54 4l-6 8" stroke="#c9b48c" stroke-width="4" stroke-linecap="round"/></svg>',
    water: '<svg viewBox="0 0 80 64"><path d="M14 30h30v22H14z" fill="#4fb3a8"/><path d="M44 34l18-12" stroke="#4fb3a8" stroke-width="5" stroke-linecap="round"/><path d="M18 30c0-8 22-8 22 0" stroke="#33877e" stroke-width="3" fill="none"/><g fill="#8cc8e6"><path d="M66 28c2 3 2 5 0 6-2-1-2-3 0-6z"/><path d="M70 38c2 3 2 5 0 6-2-1-2-3 0-6z"/></g><path d="M66 60V46" stroke="#4e9a35" stroke-width="3"/><circle cx="66" cy="44" r="5" fill="#f08cb0"/></svg>',
    table: '<svg viewBox="0 0 80 64"><rect x="6" y="30" width="68" height="8" rx="3" fill="#b98c45"/><path d="M14 38v20M66 38v20" stroke="#9c6b3c" stroke-width="5" stroke-linecap="round"/><rect x="30" y="18" width="22" height="12" rx="4" fill="#7fb0e0"/><g fill="#fffdf7"><path d="M58 16l2 4 4 1-4 1-2 4-2-4-4-1 4-1z"/></g></svg>'
  };

  function open() {
    const kid = MQ.save.kid();
    const c = MQ.chores.today(kid);
    const done = MQ.chores.doneToday(kid);
    const mon = MQ.ui.monNode(140);
    mon.addEventListener('click', function () { MQ.ui.quietTap(mon); });
    const bl = MQ.ui.balloon('');
    const card = h('div', { class: 'ot__card' + (done ? ' is-done' : '') }, [h('div', { class: 'ot__ico', html: ICON[c.id] || '' }), h('div', { class: 'ot__mark', html: HANA })]);
    const btn = h('button', { class: 'btn btn--gold btn--big btn--wide', type: 'button', text: 'おうちの人：できた！（ながおし）' });
    let fin = false;
    MQ.ui.hold(btn, 1000, function () {
      if (fin) return; fin = true;
      const before = MQ.save.growth();
      MQ.save.update(function (d) { d.kid.help[MQ.save.today()] = c.id; });
      MQ.save.note('help');
      const after = MQ.save.growth();
      if (after > before) MQ.save.markGrew(after);
      card.classList.add('is-done');
      MQ.sfx.clear(); mon.mood('jump', 1400); MQ.ui.confetti(card.parentNode, 24);
      bl.say('はなまる！ ありがとう！ ' + c.ok, function () {
        const go = function () { if (after > before) MQ.ui.done.open({ grew: true }); else MQ.ui.home.open(); };
        if (!MQ.family.play('help', { onend: function () { setTimeout(go, 400); } })) setTimeout(go, 600);
      });
    });
    const page = h('div', { class: 'page' }, [
      MQ.ui.topBar({ home: true, replay: function () { bl.say(c.ask); } }),
      h('div', { class: 'wrap col', style: { gap: '12px', alignItems: 'center', paddingTop: '4px' } }, [
        h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-end' } }, [mon, h('div', { class: 'ot__env', html: MQ.ui.SVG.letter })]),
        bl, card,
        done ? h('button', { class: 'btn btn--wide', type: 'button', text: 'おうちへ', onclick: function () { MQ.sfx.tap(); MQ.ui.home.open(); } }) : btn,
        MQ.ui.hintBox('きょうの おてつだい：' + c.label + '。できたら 見て あげて、ボタンを 長おし。1日 1つで、すがたの 成長にも 数えます。おてつだいの しゅるいは おうちの人の 画面で えらべます')
      ])
    ]);
    MQ.ui.mount('screen-help', page);
    MQ.ui.show('screen-help');
    MQ.sfx.door();
    setTimeout(function () { bl.say(done ? 'きょうの おてつだい、ありがとう！' : 'おてがみ だよ！ きょうの おねがい。' + c.ask + ' できたら おうちの ひとに みせてね。'); }, 300);
  }
  const HANA = '<svg viewBox="0 0 48 48"><g fill="none" stroke="#e0493a" stroke-width="3.2" stroke-linecap="round"><path d="M24 7c9 0 16 6 16 15s-7 16-16 16S8 32 8 23c0-8 6-14 14-14 7 0 12 5 12 12s-5 11-11 11-9-4-9-9 4-8 8-8"/></g><path d="M10 40c4 2 6 6 6 6M38 40c-4 2-6 6-6 6" stroke="#7fb069" stroke-width="3" stroke-linecap="round" fill="none"/></svg>';
  MQ.ui.otetsudai = { open: open, ICON: ICON };
})();
