/* ---------------------------------------------------------
   ことばの まねっこ（ころたま v0.2・B の 子ども がわ）。DOM を 知らない。
   生きものが 絵を 見せて「○○って いってみて！」→ お子さんが マイクに 言う → 生きものが 高い 声で まねっこ して かえす。
   はんていは しない（ばつなし）。声が 出せた こと・まねっこ される たのしさで「ことばを 口に 出す」を ふやす。
   知育：ことばの はつおん・ことばの かず（語彙）。段階で ことばの 長さが のびる
     s＝2〜3おん／m＝3〜4おん／l＝4〜5おん・あいさつ／k＝みじかい 文（2語文）
     word(stage) → { say, pic:{ type:'food'|'thing'|'shape'|'none', id, color }, line, after }
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.mane = (function () {
  const W = {
    s: [['いちご', 'food', 'strawberry'], ['りんご', 'food', 'apple'], ['まる', 'shape', 'circle', 'red'], ['ほし', 'shape', 'star', 'yellow'], ['ケーキ', 'thing', 'cake', 'pink'], ['ボール', 'thing', 'ball', 'blue'], ['ぶどう', 'food', 'grape'], ['ハート', 'shape', 'heart', 'pink']],
    m: [['みかん', 'food', 'orange'], ['バナナ', 'food', 'banana'], ['クッキー', 'food', 'cookie'], ['しかく', 'shape', 'square', 'green'], ['おはな', 'thing', 'flower', 'yellow'], ['いちご', 'food', 'strawberry'], ['ケーキ', 'thing', 'cake', 'pink'], ['ボール', 'thing', 'ball', 'red']],
    l: [['おにぎり', 'food', 'onigiri'], ['さんかく', 'shape', 'triangle', 'blue'], ['ありがとう', 'none', 'thanks'], ['こんにちは', 'none', 'hello'], ['いただきます', 'none', 'itadakimasu'], ['クッキー', 'food', 'cookie'], ['バナナ', 'food', 'banana'], ['おやすみなさい', 'none', 'oyasumi']],
    k: [['りんごを たべる', 'food', 'apple'], ['ボールで あそぶ', 'thing', 'ball', 'red'], ['おはなが さいた', 'thing', 'flower', 'pink'], ['いちごが すき', 'food', 'strawberry'], ['ほしが ひかる', 'shape', 'star', 'yellow'], ['ケーキを たべる', 'thing', 'cake', 'pink'], ['おにぎりを つくる', 'food', 'onigiri'], ['バナナは きいろ', 'food', 'banana']]
  };
  const PRAISE = ['じょうず！', 'いい こえ！', 'はっきり きこえたよ！', 'まねっこ できたよ！'];
  function line(sayWord) { return '「' + sayWord + '」って いってみて！'; }
  function word(stage, avoid) {
    const list = W[stage] || W.s;
    let w, n = 0;
    do { w = list[Math.floor(Math.random() * list.length)]; } while (avoid && avoid.indexOf(w[0]) >= 0 && n++ < 20);
    return { say: w[0], pic: { type: w[1], id: w[2], color: w[3] || null }, line: line(w[0]) };
  }
  /* 声の しらべ（v0.2.1）：何も 言わなかったら ほめない。言えたら かならず まねっこ して ほめる（ばつなし）。
       judge(vad, ことば) → 'none'（きこえない＝もう一度）／'quiet'（小さい）／'short'（みじかい）／'good'／'unknown'（はかれない 端末＝いままで どおり） */
  const MSG = {
    none1: 'あれ？ きこえなかったよ。もういちど いってみて！',
    none2: 'おおきな こえで、いっしょに いってみよう。せーの！',
    quiet: 'こえ、きこえたよ！ こんどは もっと おおきな こえで いってみよう！',
    short: 'こえ、きこえたよ！ こんどは さいごまで いってみよう！'
  };
  function mora(t) { return String(t).replace(/[ 　、。！？]/g, '').replace(/[ゃゅょぁぃぅぇぉャュョァィゥェォ]/g, '').length; }
  function judge(vad, sayWord) {
    if (!vad || !vad.measured) return 'unknown';
    if (vad.voicedMs < 150) return 'none';
    if (vad.peak < 0.04) return 'quiet';
    if (vad.voicedMs < Math.max(200, mora(sayWord) * 80) * 0.5) return 'short';
    return 'good';
  }
  function lines() {
    const out = ['マイクを おして、いってみてね。', MSG.none1, MSG.none2, MSG.quiet, MSG.short, 'きいてるよ！', 'まねっこ するよ！', 'もういちど いってみる？', 'マイクが つかえないみたい。いっしょに いってみよう！', 'もっと おおきな こえで いってみて！'].concat(PRAISE);
    Object.keys(W).forEach(function (k) { W[k].forEach(function (w) { out.push(line(w[0])); out.push(w[0] + '！'); }); });
    return out;
  }
  return { W: W, word: word, judge: judge, mora: mora, MSG: MSG, PRAISE: PRAISE, line: line, lines: lines };
})();
