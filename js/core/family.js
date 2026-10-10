/* ---------------------------------------------------------
   おうちの人の 声（ころたま v0.2・B）＋ マイクの 道具（まねっこ でも つかう）
   ユーザー決定 2026-10-10「全て入れましょう」（壁打ちの B）。
   おうちの人が おうちの人の 画面で ことばを 録音 → できた！・朝の あいさつ・おやすみの おはなし などで まざる。
   **録音は この 端末の 中だけ**（localStorage・外には 送らない）。きろくの ファイルにも 入れない（大きい ため）。
     PHRASES                … 録音できる ことば（id・ラベル・どこで 流れるか）
     has(id)／list()／remove(id)
     record(opts)           … マイクを ひらいて 録る。かえり値＝{ stop(), level() } ／ opts.max ms で 自動で 止まる
                              opts.onDone({ blob, url, ms }) ／ opts.onError(err)
     save(id, blob, cb)     … 録った 声を 保存（data URL）
     play(id, opts)         … 保存した 声を 鳴らす。opts.onend／opts.rate（まねっこは 1.3＝高い 声）
     playBlob(blob, opts)   … 録った ばかりの 声を 鳴らす（まねっこ）
     micOk()                … マイクが つかえそうか
   --------------------------------------------------------- */
window.MQ = window.MQ || {};

MQ.family = (function () {
  const KEY = 'manabi-tamago-family-v1';
  const PHRASES = [
    { id: 'morning', label: 'おはよう', where: '朝（11時まで）に はじめて おうちに 来た とき', ex: '「おはよう、○○ちゃん！」' },
    { id: 'great', label: 'すごいね', where: 'できた！の とき（2回に 1回くらい）', ex: '「すごいね！ よく できたね！」' },
    { id: 'love', label: 'だいすき', where: 'キャラクターを なでなで（長おし）した とき', ex: '「だいすきだよ」' },
    { id: 'help', label: 'ありがとう', where: 'おてつだいが できた とき', ex: '「おてつだい ありがとう！ たすかったよ」' },
    { id: 'night', label: 'おやすみ', where: 'おやすみの おはなしの さいご', ex: '「おやすみ。また あした あそぼうね」' },
    { id: 'birthday', label: 'おたんじょうび', where: 'お子さんの 誕生日に おうちに 来た とき', ex: '「おたんじょうび おめでとう！」' }
  ];
  const MAX_MS = 6000;
  let store = null;
  let actx = null, playing = null;

  function load() {
    if (store) return store;
    try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
    return store;
  }
  function write() { try { localStorage.setItem(KEY, JSON.stringify(store)); return true; } catch (e) { return false; } }
  function has(id) { const s = load(); return !!(s[id] && s[id].data); }
  function list() { const s = load(); return PHRASES.filter(function (p) { return has(p.id); }).map(function (p) { return { id: p.id, label: p.label, at: s[p.id].at, ms: s[p.id].ms }; }); }
  function remove(id) { load(); delete store[id]; write(); }
  function clear() { store = {}; write(); }
  function setRaw(id, data, ms) { load(); store[id] = { data: data, at: Date.now(), ms: ms || 0 }; return write(); }   // テスト用

  function ctx() {
    if (actx) return actx;
    const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    try { actx = new AC(); } catch (e) { actx = null; }
    return actx;
  }
  function micOk() {
    return !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof window !== 'undefined' && window.MediaRecorder) || !!fakeMic;
  }
  let fakeMic = null;   // テスト用：{ blob() } を わたすと マイクの かわりに それを かえす
  function setFakeMic(f) { fakeMic = f; }

  /* マイクで 録る。level() は 0〜1（声の 大きさ・画面の 輪を 動かす） */
  function record(opts) {
    opts = opts || {};
    const max = opts.max || MAX_MS;
    let stream = null, rec = null, chunks = [], t0 = Date.now(), stopped = false, timer = null, an = null, buf = null, fakeT = 0;
    const api = {
      level: function () {
        if (fakeMic) { fakeT++; return 0.3 + 0.3 * Math.abs(Math.sin(fakeT / 3)); }
        if (!an) return 0;
        an.getByteTimeDomainData(buf);
        let m = 0; for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128));
        return Math.min(1, m / 64);
      },
      stop: function () {
        if (stopped) return; stopped = true; clearTimeout(timer);
        if (fakeMic) { const b = fakeMic.blob(); setTimeout(function () { if (opts.onDone) opts.onDone({ blob: b, url: URL.createObjectURL(b), ms: Date.now() - t0 }); }, 30); return; }
        try { if (rec && rec.state !== 'inactive') rec.stop(); else finish(); } catch (e) { finish(); }
      },
      ms: function () { return Date.now() - t0; }
    };
    function finish() {
      if (stream) stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* なし */ } });
      const type = (rec && rec.mimeType) || (chunks[0] && chunks[0].type) || 'audio/webm';
      const blob = new Blob(chunks, { type: type });
      if (!blob.size) { if (opts.onError) opts.onError(new Error('empty')); return; }
      if (opts.onDone) opts.onDone({ blob: blob, url: URL.createObjectURL(blob), ms: Date.now() - t0 });
    }
    if (fakeMic) { timer = setTimeout(api.stop, max); if (opts.onStart) setTimeout(opts.onStart, 0); return api; }
    if (!micOk()) { setTimeout(function () { if (opts.onError) opts.onError(new Error('nomic')); }, 0); return api; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (s) {
      stream = s;
      if (stopped) { finish(); return; }
      try { rec = new MediaRecorder(s); } catch (e) { if (opts.onError) opts.onError(e); return; }
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = finish;
      try { const c = ctx(); if (c) { const src = c.createMediaStreamSource(s); an = c.createAnalyser(); an.fftSize = 512; buf = new Uint8Array(an.fftSize); src.connect(an); } } catch (e) { an = null; }
      t0 = Date.now();
      rec.start();
      timer = setTimeout(api.stop, max);
      if (opts.onStart) opts.onStart();
    }).catch(function (e) { stopped = true; if (opts.onError) opts.onError(e); });
    return api;
  }
  function blobToData(blob, cb) { const r = new FileReader(); r.onload = function () { cb(String(r.result)); }; r.onerror = function () { cb(''); }; r.readAsDataURL(blob); }
  function save(id, blob, cb, ms) {
    blobToData(blob, function (data) {
      if (!data) { if (cb) cb(false); return; }
      load(); store[id] = { data: data, at: Date.now(), ms: ms || 0 };
      const ok = write();
      if (!ok) delete store[id];
      if (cb) cb(ok);
    });
  }
  function stop() { if (playing) { try { playing.stop(); } catch (e) { try { playing.pause(); } catch (e2) { /* なし */ } } playing = null; } }
  /* 鳴らす：Web Audio で（rate を 上げると 高い 声＝まねっこ）。だめなら <audio> */
  function playData(arrayBufOrUrl, opts) {
    opts = opts || {};
    stop();
    let ended = false;
    const end = function () { if (ended) return; ended = true; try { MQ.bgm.duck(false); } catch (e) { /* なし */ } if (opts.onend) opts.onend(); };
    try { MQ.bgm.duck(true); } catch (e) { /* なし */ }
    const c = ctx();
    const viaTag = function () {
      try {
        const a = new Audio(typeof arrayBufOrUrl === 'string' ? arrayBufOrUrl : '');
        a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false;
        a.playbackRate = opts.rate || 1;
        a.onended = end; a.onerror = end;
        playing = a;
        const p = a.play(); if (p && p.catch) p.catch(end);
      } catch (e) { end(); }
    };
    if (!c || typeof arrayBufOrUrl === 'string' && !/^data:|^blob:/.test(arrayBufOrUrl)) { viaTag(); return; }
    if (c.state !== 'running') { try { c.resume(); } catch (e) { /* なし */ } }
    const getBuf = typeof arrayBufOrUrl === 'string' ? fetch(arrayBufOrUrl).then(function (r) { return r.arrayBuffer(); }) : Promise.resolve(arrayBufOrUrl);
    getBuf.then(function (ab) { return new Promise(function (res, rej) { const p = c.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(function () { /* rej で うける */ }); }); }).then(function (b) {
      const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = opts.rate || 1;
      const g = c.createGain(); g.gain.value = opts.vol || 1.2; s.connect(g); g.connect(c.destination);
      s.onended = end; playing = s; s.start();
      setTimeout(end, (b.duration / (opts.rate || 1)) * 1000 + 600);   // 保険
    }).catch(function () { if (typeof arrayBufOrUrl === 'string') viaTag(); else end(); });
  }
  function play(id, opts) {
    const s = load();
    if (!s[id] || !s[id].data) { if (opts && opts.onend) setTimeout(opts.onend, 0); return false; }
    playData(s[id].data, opts);
    return true;
  }
  function playBlob(blob, opts) { blob.arrayBuffer ? blob.arrayBuffer().then(function (ab) { playData(ab, opts); }) : playData(URL.createObjectURL(blob), opts); }
  /* 1日 1回だけ 流す（朝の あいさつ・誕生日）。かえり値：流したか */
  function once(id, day, opts) {
    if (!has(id)) return false;
    const k = 'manabi-tamago-family-once';
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { seen = {}; }
    if (seen[id] === day) return false;
    seen[id] = day; try { localStorage.setItem(k, JSON.stringify(seen)); } catch (e) { /* なし */ }
    return play(id, opts);
  }
  return { KEY: KEY, PHRASES: PHRASES, MAX_MS: MAX_MS, has: has, list: list, remove: remove, clear: clear, record: record, save: save, play: play, playBlob: playBlob, stop: stop, once: once, micOk: micOk, setFakeMic: setFakeMic, _setRaw: setRaw, _reset: function () { store = null; } };
})();
