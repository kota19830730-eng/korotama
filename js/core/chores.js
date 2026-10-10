/* ---------------------------------------------------------
   おてつだい（ころたま v0.2・D）。DOM を 知らない。
   生きものが 1日 1つ 本物の 用事を たのむ → お子さんが する → おうちの人が 長おしで ○ → はなまる（すがたの 成長にも 1こ ぶん）。
   知育：生活の 習慣と じぶんで できる こと（自立）。
     LIST            … おてつだい（id・子どもへの ことば ask・おうちの人の ラベル label・絵 icon）
     DEFAULT         … はじめに 入って いる 6つ
     enabled(kid)    … おうちの人が えらんだ もの（なければ DEFAULT）
     today(kid, date)… きょうの 1つ（日づけで きまる＝1日の あいだは かわらない）
     doneToday(kid, date)
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.chores = (function () {
  const LIST = [
    { id: 'shoes', label: 'くつを そろえる', ask: 'げんかんの くつを そろえて きてくれる？', ok: 'くつが ぴかっと そろったね！' },
    { id: 'teeth', label: 'はみがき', ask: 'はみがき しゅっしゅ してきてくれる？', ok: 'はが ぴかぴかだね！' },
    { id: 'toys', label: 'おもちゃを かたづける', ask: 'おもちゃを はこに しまって くれる？', ok: 'おへやが きれいに なったね！' },
    { id: 'hands', label: '手を あらう', ask: 'てを あらって きれいに してきてくれる？', ok: 'てが きれいに なったね！' },
    { id: 'clothes', label: 'じぶんで きがえる', ask: 'じぶんで おきがえ できるかな？', ok: 'じぶんで きがえられたね！' },
    { id: 'chopsticks', label: 'おはしを ならべる', ask: 'ごはんの まえに おはしを ならべて くれる？', ok: 'おはしが きれいに ならんだね！' },
    { id: 'itadakimasu', label: '「いただきます」を 言う', ask: 'ごはんの とき、げんきに いただきますって いえるかな？', ok: 'げんきな いただきます だったね！' },
    { id: 'thanks', label: '「ありがとう」を 言う', ask: 'きょう だれかに ありがとうって いえるかな？', ok: 'すてきな ありがとう だったね！' },
    { id: 'towel', label: 'タオルを たたむ', ask: 'タオルを たたんで くれる？', ok: 'タオルが きれいに たためたね！' },
    { id: 'trash', label: 'ごみを ごみばこへ', ask: 'ごみを ごみばこに すてて くれる？', ok: 'ごみばこに ぽい できたね！' },
    { id: 'water', label: '花に 水を あげる', ask: 'おはなに おみずを あげて くれる？', ok: 'おはなが よろこんでるよ！' },
    { id: 'table', label: 'テーブルを ふく', ask: 'テーブルを ふきふき してくれる？', ok: 'テーブルが ぴかぴかだね！' }
  ];
  const DEFAULT = ['shoes', 'teeth', 'toys', 'hands', 'clothes', 'chopsticks'];
  function byId(id) { return LIST.filter(function (c) { return c.id === id; })[0] || null; }
  function enabled(kid) {
    const ids = (kid && Array.isArray(kid.chores) && kid.chores.length) ? kid.chores : DEFAULT;
    const out = ids.map(byId).filter(Boolean);
    return out.length ? out : DEFAULT.map(byId);
  }
  function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  // 日づけで 1つ。つづけて 同じに ならない ように 前の 日と くらべる
  function today(kid, date) {
    const list = enabled(kid);
    const d = date || (MQ.save ? MQ.save.today() : '');
    let i = hash(d) % list.length;
    if (list.length > 1) {
      const y = new Date(new Date(d + 'T12:00:00').getTime() - 86400000);
      const yd = y.getFullYear() + '-' + ('0' + (y.getMonth() + 1)).slice(-2) + '-' + ('0' + y.getDate()).slice(-2);
      if ((hash(yd) % list.length) === i) i = (i + 1) % list.length;
    }
    return list[i];
  }
  function doneToday(kid, date) { const d = date || (MQ.save ? MQ.save.today() : ''); return !!(kid && kid.help && kid.help[d]); }
  /* 声の 文（tools/voice/lines.js が ひろう） */
  function lines() {
    const out = ['おてがみ だよ！', 'きょうの おねがい。', 'できたら おうちの ひとに みせてね。', 'はなまる！ ありがとう！', 'おうちの ひとに みてもらってね。'];
    LIST.forEach(function (c) { out.push(c.ask); out.push(c.ok); });
    return out;
  }
  return { LIST: LIST, DEFAULT: DEFAULT, byId: byId, enabled: enabled, today: today, doneToday: doneToday, lines: lines };
})();
