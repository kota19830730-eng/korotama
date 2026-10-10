/* ---------------------------------------------------------
   きせつ・行事・たんじょうび（ころたま v0.2・G）。DOM を 知らない。
   おうちの 背景に きせつの かざり（はる＝さくら／なつ＝ひまわり／あき＝もみじ／ふゆ＝ゆき）と 行事の かざりが 出る。
   かざりを さわると その 行事の ことを 声で 教える。お子さんの 誕生日は ケーキと うた。生きものの 生まれた 日（1年ごと）も。
   知育：きせつと 行事の ことば（日本の 1年）。
     of(date, kid) → { season, event, birthday, monBirthday, greet }
     SEASONS／EVENTS … 名前・おしえる 文
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.season = (function () {
  const SEASONS = {
    spring: { name: 'はる', greet: 'はるだね。さくらが きれい！', tell: 'はるは さくらが さく きせつ。あたたかく なるね。' },
    summer: { name: 'なつ', greet: 'なつだね。ひまわりが さいてるよ！', tell: 'なつは ひまわりが さく きせつ。あついから おみずを のもうね。' },
    autumn: { name: 'あき', greet: 'あきだね。はっぱが あかく なったよ！', tell: 'あきは はっぱが あかや きいろに なる きせつ。どんぐりも おちてるよ。' },
    winter: { name: 'ふゆ', greet: 'ふゆだね。ゆきが ふってきた！', tell: 'ふゆは さむい きせつ。ゆきが ふる ことも あるよ。' }
  };
  // 行事：月日の はんい（はじめ〜おわり）。かざりの 絵は common.js の eventNode
  const EVENTS = [
    { id: 'newyear', from: '01-01', to: '01-07', greet: 'あけまして おめでとう！ ことしも よろしくね！', tell: 'おしょうがつは あたらしい いちねんの はじまり。かどまつを かざるよ。' },
    { id: 'setsubun', from: '02-01', to: '02-03', greet: 'もうすぐ せつぶん！ おには そと！ ふくは うち！', tell: 'せつぶんは まめを まいて、おにを おいはらう ひだよ。' },
    { id: 'hina', from: '02-25', to: '03-03', greet: 'もうすぐ ひなまつり！', tell: 'ひなまつりは おひなさまを かざって、げんきに そだつ ことを おいわいする ひだよ。' },
    { id: 'kodomo', from: '04-25', to: '05-05', greet: 'もうすぐ こどもの ひ！ こいのぼりが およいでるよ！', tell: 'こどもの ひは こいのぼりを あげて、こどもが げんきに そだつ ことを おいわいする ひだよ。' },
    { id: 'tanabata', from: '07-01', to: '07-07', greet: 'もうすぐ たなばた！ おねがい ごとは なにかな？', tell: 'たなばたは ささに たんざくを かざって、おねがい ごとを する ひだよ。' },
    { id: 'halloween', from: '10-20', to: '10-31', greet: 'もうすぐ ハロウィン！ かぼちゃが にっこり！', tell: 'ハロウィンは かぼちゃを かざって、おばけの かっこうを して あそぶ ひだよ。' },
    { id: 'xmas', from: '12-01', to: '12-25', greet: 'もうすぐ クリスマス！ ツリーが きらきら！', tell: 'クリスマスは ツリーを かざって、プレゼントを たのしみに する ひだよ。' }
  ];
  const BIRTHDAY = { greet: 'おたんじょうび おめでとう！ きょうは とくべつな ひ！', tell: 'おたんじょうび おめでとう！ ろうそくを ふーって してね。' };
  const MON_BIRTHDAY = { greet: 'きょうは わたしが うまれた ひ！ いっしょに いてくれて ありがとう！' };
  function md(d) { return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  // 2月29日 うまれは うるう年で ない 年は 2月28日に おいわい（2026-10-10）
  function sameDay(b, d) { if (b === md(d)) return true; const y = d.getFullYear(); const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; return b === '02-29' && !leap && md(d) === '02-28'; }
  function seasonOf(d) { const m = d.getMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'; }
  function eventOf(d) { const k = md(d); return EVENTS.filter(function (e) { return k >= e.from && k <= e.to; })[0] || null; }
  function of(date, kid) {
    const d = date instanceof Date ? date : new Date(date || Date.now());
    const s = seasonOf(d), ev = eventOf(d);
    const bday = !!(kid && kid.birthday && sameDay(kid.birthday, d));
    let monB = false;
    if (kid && kid.created) { const c = new Date(kid.created); monB = sameDay(md(c), d) && c.getFullYear() < d.getFullYear(); }
    const greet = bday ? BIRTHDAY.greet : monB ? MON_BIRTHDAY.greet : ev ? ev.greet : null;
    return { season: s, seasonInfo: SEASONS[s], event: ev ? ev.id : null, eventInfo: ev, birthday: bday, monBirthday: monB, greet: greet };
  }
  let fixed = null;   // テスト用（harness）：日づけを 決めうち
  function now() { return fixed ? new Date(fixed) : new Date(); }
  function lines() {
    const out = [BIRTHDAY.greet, BIRTHDAY.tell, MON_BIRTHDAY.greet];
    Object.keys(SEASONS).forEach(function (k) { out.push(SEASONS[k].greet, SEASONS[k].tell); });
    EVENTS.forEach(function (e) { out.push(e.greet, e.tell); });
    return out;
  }
  return { SEASONS: SEASONS, EVENTS: EVENTS, of: of, now: now, setNow: function (d) { fixed = d || null; }, lines: lines, md: md };
})();
