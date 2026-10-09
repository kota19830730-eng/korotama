/* ---------------------------------------------------------
   こえ（まなびたまご）
   字が 読めない 子の ために、画面の ことばは ぜんぶ 声で 読む（Web Speech API・端末に 入って いる 日本語の 声）。
   音声ファイルも 通信も 使わない。声が 入って いない 端末では ready() が false → 画面は 字幕を かならず 出す。
     say(text, opts)  … 読む（前のを 止めてから）。opts.onend／opts.pitch。かえり値：読めたか
     ready()          … 日本語の 声が あるか
     setPitch('high'|'normal')／setRate('slow'|'normal')
   高めの 声（ユーザー決定 2026-10-08）＝ pitch 1.35 → v0.1.5 で 1.15 に（「AI すぎる」）。
   ゆっくり（ユーザー決定 2026-10-09「もう少し 悠長に」）＝ rate 0.74・文（。！？）ごとに 区切って 読む＝文の あいだに 息つぎが 入る。声は 女性の 名前を 先に えらぶ（Kyoko・O-ren・Google 日本語・Nanami・Haruka・Ayumi・Sayaka）。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.voice = (function () {
  const PREFER = ['kyoko', 'o-ren', 'google 日本語', 'nanami', 'haruka', 'ayumi', 'sayaka', 'japanese'];
  const PITCH = { high: 1.15, normal: 1.0 };
  const RATE = { slow: 0.74, normal: 0.88 };
  let pitch = 'high', rate = 'slow';
  let list = [];
  let fakeApi = null;      // テスト用

  function api() { return fakeApi || (typeof window !== 'undefined' && window.speechSynthesis) || null; }
  function Utter() { return (fakeApi && fakeApi.Utterance) || (typeof window !== 'undefined' && window.SpeechSynthesisUtterance) || null; }
  function refresh() {
    const s = api();
    try { list = s ? (s.getVoices() || []) : []; } catch (e) { list = []; }
    return list;
  }
  function init() {
    const s = api();
    if (!s) return;
    refresh();
    try { s.addEventListener('voiceschanged', refresh); } catch (e) { try { s.onvoiceschanged = refresh; } catch (e2) { /* なし */ } }
  }
  function jaVoices() {
    const all = list.length ? list : refresh();
    return all.filter(function (v) { return /^ja/i.test(v.lang || '') || /ja[-_]JP/i.test(v.lang || ''); });
  }
  function voiceFor() {
    const ja = jaVoices();
    if (!ja.length) return null;
    for (let i = 0; i < PREFER.length; i++) {
      const hit = ja.filter(function (v) { return (v.name || '').toLowerCase().indexOf(PREFER[i]) >= 0; });
      if (hit.length) return hit[0];
    }
    const def = ja.filter(function (v) { return v.default; });
    return def[0] || ja[0];
  }
  function ready() { return !!(api() && Utter() && voiceFor()); }
  function stop() { const s = api(); try { if (s) s.cancel(); } catch (e) { /* なし */ } }
  function say(text, opts) {
    opts = opts || {};
    const s = api(), U = Utter();
    if (!s || !U || !text) { if (opts.onend) setTimeout(opts.onend, 0); return false; }
    const v = voiceFor();
    if (!v) { if (opts.onend) setTimeout(opts.onend, 0); return false; }
    stop();
    // 文ごとに 区切る（。！？ の あとで 息つぎ）→ ゆっくり 悠長に 聞こえる
    const parts = String(text).replace(/([。！？!?])[ 　]*/g, '$1|').split('|').map(function (t) { return t.trim(); }).filter(Boolean);   // lookbehind は 古い Safari で 落ちる ので 使わない
    if (!parts.length) parts.push(String(text));
    try {
      parts.forEach(function (t, i) {
        const u = new U(t);
        u.voice = v; u.lang = v.lang || 'ja-JP';
        u.rate = opts.rate || RATE[rate] || RATE.slow;
        u.pitch = PITCH[opts.pitch || pitch] || PITCH.high;
        u.volume = 1;
        if (i === parts.length - 1 && opts.onend) { u.onend = function () { opts.onend(); }; u.onerror = function () { opts.onend(); }; }
        s.speak(u);
      });
    } catch (e) { if (opts.onend) setTimeout(opts.onend, 0); return false; }
    return true;
  }
  function setPitch(p) { pitch = PITCH[p] ? p : 'high'; }
  function setRate(r) { rate = RATE[r] ? r : 'slow'; }
  function setFake(f) { fakeApi = f; list = []; }
  init();
  return { say: say, stop: stop, ready: ready, setPitch: setPitch, setRate: setRate, RATE: RATE, voiceFor: voiceFor, voices: jaVoices, refresh: refresh, setFake: setFake, PITCH: PITCH };
})();
