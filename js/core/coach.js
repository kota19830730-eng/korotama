/* ---------------------------------------------------------
   ほめ方・手助け・遊ぶ時間（ころたま v0.3・2026-10-11 ユーザー決定「A1＋A2＋C1」）
     A1 何が できたかを 言って ほめる：MQ.coach.learned(しゅるい, 段階) → できた！の 声（子ども）／parentText → きょうの れんしゅう（おうちの人）
     A2 まよった ときの 手助け：NUDGE の 文（画面の しかけは common.js の MQ.ui.nudge）
     C1 遊ぶ 時間の めやす：addPlay／playedMs／limitMs／tired／remainMs／extend（DOM を 知らない）
   声の 文は tools/voice/lines.js が ここから ひろう（足したら 録音）。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.coach = (function () {
  /* A1：しゅるい × 段階（s ちいさい／m なかくらい／l おおきい／k ねんちょう）。中身は tasks.js の 段階の 表に 合わせる */
  const LEARN = {
    count: { s: 'みっつまで かぞえられたね。', m: 'いつつまで かぞえられたね。', l: 'とおまで かぞえられたね。', k: 'あわせたり わけたり して、かずが わかったね。' },
    color: { s: 'いろの なまえが わかったね。', m: 'いろと かずを たしかめて えらべたね。', l: 'いろと かずを たしかめて えらべたね。', k: 'すうじが よめたね。' },
    shape: { s: 'かたちの なまえが わかったね。', m: 'かたちの なまえが わかったね。', l: 'かたちと いろを よく みわけられたね。', k: 'かたちと いろを よく みわけられたね。' },
    compare: { s: 'おおきさや ながさを くらべられたね。', m: 'おおきさや ながさ、かずを くらべられたね。', l: 'かずを くらべたり、なんばんめかを かぞえたり できたね。', k: 'なんばんめかや、すうじの おおきさが わかったね。' },
    moji: { s: 'ことばの はじめの おとが わかったね。', m: 'ひらがなの おとが わかったね。', l: 'にて いる ひらがなも みわけられたね。', k: 'ひらがなで ことばが よめたね。' },
    tokei: { s: 'あさと ひると よるが わかったね。', m: 'あさ、ひる、よるの じゅんばんが わかったね。', l: 'とけいで なんじか よめたね。', k: 'とけいの はんも よめたね。' },
    find: { s: 'おうちの なかで いろを みつけられたね。' },
    mane: { s: 'ことばを じょうずに まねできたね。' },
    draw: { s: 'じぶんで かいた えが でて きたね。' }
  };
  const PARENT = {
    count: { s: '3までの数を、1つずつ指さして数える', m: '5までの数を数える', l: '10までの数を数え、多い・少ないを確かめる', k: '合わせていくつ・残りはいくつ（たし算・ひき算の手前）' },
    color: { s: '色の名前（3色）', m: '色と数（4色・3つまで）を同時に聞き取る', l: '色と数（5色・4つまで）を同時に聞き取る', k: '数字を読む（1〜20）' },
    shape: { s: '形の名前（2つから選ぶ）', m: '形の名前（3つから選ぶ）', l: '形と色の両方を見分ける', k: '形と色の両方を見分ける（5つから）' },
    compare: { s: '大きい・小さい、長い・短いを比べる', m: '大きさ・長さ・数の多い少ないを比べる', l: '数を比べる・前から何番目かを数える', k: '何番目か・数字の大小（1〜20）' },
    moji: { s: 'ことばの最初の音を聞き分ける', m: 'ひらがなと音を結びつける', l: '似ているひらがなを見分ける', k: 'ひらがなを読む・ことばを作る' },
    tokei: { s: '朝・昼・夜', m: '朝・昼・夜の順番', l: '時計で「〇時」を読む', k: '時計で「〇時半」を読む' },
    find: { s: '家の中で色・形を見つける' },
    mane: { s: 'ことばをまねして言う' },
    draw: { s: '絵を描いて、名前をつける' }
  };
  function pickOf(table, kind, stage) { const t = table[kind]; if (!t) return ''; return t[stage] || t.s || ''; }
  function learned(kind, stage) { return pickOf(LEARN, kind, stage); }
  function parentText(kind, stage) { return pickOf(PARENT, kind, stage); }

  /* A2：まよった ときの 声（1回め＝もういちど 言う／2回め＝正解を 光らせる） */
  const NUDGE = { again: 'ゆっくりで いいよ。 もういちど いうね。', glow: 'ひかって いる ところを みてごらん。' };
  const NUDGE_MS = 15000;   // 手が とまって から（声の あいだは 数えない）

  /* C1：遊ぶ 時間の めやす（分）。0＝なし（はじめ） */
  const LIMITS = [0, 10, 15, 20, 30];
  const EXTEND_MIN = 10;
  const SOON_MS = 3 * 60 * 1000;   // のこり 3分で「もう すこしで おやすみ」
  const REST = {
    tired: 'たくさん あそんだね。',
    sleepy: 'ちょっと ねむく なっちゃった。',
    bye: 'また あしたね！',
    story: 'ねる まえに、おはなしを きこうか。',
    soon: 'あと すこしで、おやすみの じかんだよ。',
    tapSleep: 'すやすや… また あしたね！'
  };

  function today(now) { return MQ.save.today(now); }
  function limitMs() { const m = Number(MQ.save.settings().timeLimit) || 0; return m > 0 ? m * 60000 : 0; }
  function extraMs(now) { const e = MQ.save.settings().timeExtra; return e && e.day === today(now) ? (e.ms || 0) : 0; }
  function playedMs(now) { const k = MQ.save.kid(); return k && k.playMs ? (k.playMs[today(now)] || 0) : 0; }
  // 1回ぶん 足す（保存は 呼ぶ がわが まとめて）。14日より 前は すてる
  function addPlay(ms, now) {
    const d = MQ.save.load();
    if (!d.kid) return;
    const k = d.kid;
    if (!k.playMs || typeof k.playMs !== 'object') k.playMs = {};
    const t = today(now);
    k.playMs[t] = (k.playMs[t] || 0) + ms;
    const days = Object.keys(k.playMs).sort();
    while (days.length > 14) delete k.playMs[days.shift()];
  }
  function remainMs(now) { const L = limitMs(); return L ? L + extraMs(now) - playedMs(now) : Infinity; }
  function tired(now) { return remainMs(now) <= 0; }
  function soon(now) { const r = remainMs(now); return r > 0 && r <= SOON_MS; }
  function extend(now) {
    const cur = extraMs(now);
    // まだ 時間が のこって いても ふえる。のこりが マイナスなら 0 から 10分（あそんだ ぶんを 足して そろえる）
    const over = Math.max(0, -remainMs(now));
    MQ.save.setSetting('timeExtra', { day: today(now), ms: cur + over + EXTEND_MIN * 60000 });
    return remainMs(now);
  }

  /* v0.4（2026-10-11）：たまごの スタンプ・成長は たまごから */
  const EGG = {
    full: 'きょうの たまごは もう いっぱい！',
    gift: { flower: 'たまごから おはなが でて きた！', butterfly: 'たまごから ちょうちょが でて きた！', flag: 'たまごから はたが でて きた！' },
    garden: 'おにわに かざったよ。',
    five: 'きょうの たまご、ぜんぶ そろったね！ ころころ！',
    regrow: 'あれれ？ たまごに なっちゃった！ とんとん して みて！',
    out: 'ぱかっ！ でて きた！'
  };
  return { EGG: EGG, LEARN: LEARN, PARENT: PARENT, learned: learned, parentText: parentText, NUDGE: NUDGE, NUDGE_MS: NUDGE_MS,
           LIMITS: LIMITS, EXTEND_MIN: EXTEND_MIN, REST: REST, limitMs: limitMs, playedMs: playedMs, addPlay: addPlay, remainMs: remainMs, tired: tired, soon: soon, extend: extend };
})();
