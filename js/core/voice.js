/* ---------------------------------------------------------
   こえ（ころたま）
   字が 読めない 子の ために、画面の ことばは ぜんぶ 声で 読む（Web Speech API・端末に 入って いる 日本語の 声）。
   音声ファイルも 通信も 使わない。声が 入って いない 端末では ready() が false → 画面は 字幕を かならず 出す。
     say(text, opts)  … 読む（前のを 止めてから）。opts.onend／opts.pitch。かえり値：読めたか
     ready()          … 日本語の 声が あるか
     setPitch('high'|'normal')／setRate('slow'|'normal')
   高めの 声（ユーザー決定 2026-10-08）＝ pitch 1.35 → v0.1.5 で 1.15 に（「AI すぎる」）。
   ゆっくり（ユーザー決定 2026-10-09「もう少し 悠長に」）＝ rate 0.74・文（。！？）ごとに 区切って 読む＝文の あいだに 息つぎが 入る。
   イントネーション（ユーザー 2026-10-09「話し方・イントネーションが おかしい」）＝ v0.1.6 で spokenForm()：
     ① 文節の スペースを 外す（「きょうは なにを する？」の スペースごとに 声が 切れて 単語読みに なって いた）
     ② ひらがなを かん字に して 読ませる（「いっしょに あそぼう」→「一緒に遊ぼう」。かな だけだと 声の エンジンが ことばの 切れ目と アクセントを まちがえる）
        ＝ まなびモンスターの 辞書（js/content/kotoba.js・js/core/text.js の _up）を 声だけに 使う。画面の 字幕は 変えない
     ③ はじめの 声は「ふつう」（pitch 1.0）。高めは 1.1 まで（上げるほど 機械っぽく なる）
   録音した 声（v0.1.7・ユーザー「音声 AI の 種類 変えれないの？ ずんだもんとか フリーの あるやん」）：
     VOICEVOX の ずんだもん で 文（約320）を PC で 録音 → assets/voice/*.mp3 ＋ bank.json（文 → ファイル）。
     say() は 文ごとに bank に あれば その mp3 を Web Audio で 鳴らし、無い 文だけ 端末の 声（Web Speech）で 読む。
     名前（お子さん・生きもの）は 録音に 無い ので、読む 前に 外す（setNames）。しゅるいは setKind('zunda'|'device')。
     クレジット：VOICEVOX:ずんだもん（おうちの人の 画面に 書く）。通信は しない（mp3 は アプリと いっしょに 入って いる）。声は 女性の 名前を 先に えらぶ（Kyoko・O-ren・Google 日本語・Nanami・Haruka・Ayumi・Sayaka）。
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.voice = (function () {
  const PREFER = ['kyoko', 'o-ren', 'google 日本語', 'nanami', 'haruka', 'ayumi', 'sayaka', 'japanese'];
  const PITCH = { high: 1.1, normal: 1.0 };
  const RATE = { slow: 0.78, normal: 0.9 };
  let pitch = 'normal', rate = 'slow';
  let kind = 'zunda';              // 'zunda'＝録音した 声／'device'＝端末の 声
  let bank = null;                 // { 文: ファイル名 }
  let names = [];                  // 読む 前に 外す ことば（名前）
  const BASE = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/js\/core\/voice\.js.*$/, '') : '';
  let actx = null, playing = [];
  const bufCache = {};
  function audioCtx() {
    if (actx) return actx;
    const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    try { actx = new AC(); } catch (e) { actx = null; }
    return actx;
  }
  function unlock() { const c = audioCtx(); if (c && c.state !== 'running') { try { c.resume(); } catch (e) { /* なし */ } } }
  function loadBank() {
    if (bank || typeof fetch !== 'function') return;
    fetch(BASE + 'assets/voice/bank.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { bank = j || {}; }).catch(function () { bank = {}; });
  }
  function hasBank() { return !!(bank && Object.keys(bank).length); }
  function clipFor(sentence) { if (!bank) return null; const k = String(sentence).replace(/[ 　]+/g, ''); return bank[k] || null; }
  function stopClips() { playing.forEach(function (s) { try { s.stop(); } catch (e) { /* なし */ } }); playing = []; }
  function loadBuf(file, cb) {
    const c = audioCtx(); if (!c) { cb(null); return; }
    if (bufCache[file]) { cb(bufCache[file]); return; }
    fetch(BASE + 'assets/voice/' + file).then(function (r) { return r.arrayBuffer(); }).then(function (ab) { return new Promise(function (res, rej) { c.decodeAudioData(ab, res, rej); }); })
      .then(function (buf) { bufCache[file] = buf; cb(buf); }).catch(function () { cb(null); });
  }
  function playClip(file, rateK, cb) {
    const c = audioCtx(); if (!c) { cb(false); return; }
    unlock();
    loadBuf(file, function (buf) {
      if (!buf) { cb(false); return; }
      const src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = rateK; src.connect(c.destination);
      src.onended = function () { playing = playing.filter(function (x) { return x !== src; }); cb(true); };
      playing.push(src); try { src.start(); } catch (e) { cb(false); }
    });
  }
  /* 名前を 外す（録音に 名前は 無い） */
  function stripNames(s) {
    names.forEach(function (n) { if (!n) return; ['ちゃん、', 'ちゃん。', 'だよ。', 'が ', 'も ', 'は ', 'の ', ''].forEach(function (t) { s = s.split(n + t).join(''); }); });
    return s;
  }
  /* 声に 出す 形：かん字に して スペースを 外す（字幕は もとの まま） */
  function spokenForm(text) {
    let s = stripNames(String(text));
    try { if (window.MQ && MQ.text && MQ.text._up) { s = MQ.text._up(s, 6); s = MQ.text._up(s, 6); } } catch (e) { /* 辞書が なければ そのまま */ }
    return kanaRead(s.replace(/[ 　]+/g, ''));
  }
  /* 字の 名前を 読む とき（もじ v0.1.13）：「は」「へ」や 1字だけの 文は 助詞と まちがえて「わ」「え」と 読まれる → カタカナに する */
  function kata(t) { return t.replace(/[ぁ-ゖ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) + 0x60); }); }
  function kanaRead(s) {
    s = s.replace(/「([ぁ-ゖ]{1,4})」/g, function (m, t) { return '「' + kata(t) + '」'; });
    if (/^[ぁ-ゖ][。！？!?]?$/.test(s)) s = kata(s);
    return s;
  }
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
  function ready() { return (kind === 'zunda' && hasBank() && !!audioCtx()) || !!(api() && Utter() && voiceFor()); }
  function stop() { stopClips(); const s = api(); try { if (s) s.cancel(); } catch (e) { /* なし */ } }
  function say(text, opts) {
    opts = opts || {};
    if (!text) { if (opts.onend) setTimeout(opts.onend, 0); return false; }
    stop();
    // 録音した 声（ずんだもん）：文ごとに bank に あれば mp3、無い 文だけ 端末の 声
    if (kind === 'zunda' && hasBank() && audioCtx()) {
      const raw = stripNames(String(text)).replace(/([。！？!?])/g, '$1|').split('|').map(function (t) { return t.trim(); }).filter(Boolean);
      const rateK = (RATE[rate] || RATE.slow) >= 0.9 ? 1.0 : 0.94;
      let i = 0;
      const next = function () {
        if (i >= raw.length) { if (opts.onend) opts.onend(); return; }
        const sen = raw[i++];
        const file = clipFor(sen);
        if (file) playClip(file, rateK, function () { next(); });
        else sayDevice(sen, { pitch: opts.pitch, rate: opts.rate, onend: next });
      };
      next();
      return true;
    }
    return sayDevice(text, opts);
  }
  /* 端末の 声（Web Speech） */
  function sayDevice(text, opts) {
    opts = opts || {};
    const s = api(), U = Utter();
    if (!s || !U || !text) { if (opts.onend) setTimeout(opts.onend, 0); return false; }
    const v = voiceFor();
    if (!v) { if (opts.onend) setTimeout(opts.onend, 0); return false; }
    // 文ごとに 区切る（。！？ の あとで 息つぎ）→ ゆっくり 悠長に 聞こえる
    const parts = spokenForm(text).replace(/([。！？!?])/g, '$1|').split('|').map(function (t) { return t.trim(); }).filter(Boolean);
    if (!parts.length) parts.push(String(text));
    try {
      parts.forEach(function (t, i) {
        const u = new U(t);
        u.voice = v; u.lang = v.lang || 'ja-JP';
        u.rate = opts.rate || RATE[rate] || RATE.slow;
        u.pitch = PITCH[opts.pitch || pitch] || PITCH.normal;
        u.volume = 1;
        if (i === parts.length - 1 && opts.onend) { u.onend = function () { opts.onend(); }; u.onerror = function () { opts.onend(); }; }
        s.speak(u);
      });
    } catch (e) { if (opts.onend) setTimeout(opts.onend, 0); return false; }
    return true;
  }
  function setPitch(p) { pitch = PITCH[p] ? p : 'normal'; }
  function setRate(r) { rate = RATE[r] ? r : 'slow'; }
  /* 文の mp3 を 先に 読んで おく（検査にも）：cb(長さ 秒 ／ 読めなければ 0） */
  function preload(sentence, cb) { const f = clipFor(sentence); if (!f) { cb(0); return; } loadBuf(f, function (buf) { cb(buf ? buf.duration : 0); }); }
  function setKind(k) { kind = k === 'device' ? 'device' : 'zunda'; }
  function setNames(list) { names = (list || []).filter(Boolean).map(String).sort(function (a, b) { return b.length - a.length; }); }
  function setFake(f) { fakeApi = f; list = []; }
  init();
  loadBank();
  if (typeof document !== 'undefined') ['touchend', 'click', 'keydown', 'pointerdown'].forEach(function (ev) { document.addEventListener(ev, unlock, { passive: true }); });
  return { say: say, stop: stop, ready: ready, setPitch: setPitch, setRate: setRate, RATE: RATE, spokenForm: spokenForm, kanaRead: kanaRead, setKind: setKind, setNames: setNames, preload: preload, kind: function () { return kind; }, hasBank: hasBank, clipFor: clipFor, _setBank: function (b) { bank = b; }, stripNames: stripNames, voiceFor: voiceFor, voices: jaVoices, refresh: refresh, setFake: setFake, PITCH: PITCH };
})();
