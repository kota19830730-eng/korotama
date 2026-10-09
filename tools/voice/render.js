/* ---------------------------------------------------------
   ずんだもんで 声を 録音する（まなびたまご v0.1.7）
     1) VOICEVOX（CPU 版）を 入れて エンジンを 立てる：%LOCALAPPDATA%\Programs\VOICEVOX\vv-engine\run.exe（http://127.0.0.1:50021）
     2) node tools/voice/render.js [--only=<key の 一部>]
        → tools/voice/lines.json の 文を 1つずつ audio_query → synthesis（speaker 3＝ずんだもん ノーマル）→ WAV → ffmpeg で mp3（48kbps モノラル）
        → assets/voice/<番号>.mp3 ＋ assets/voice/bank.json（{ 文: ファイル名 }）
     もう ある 文（bank.json に ある）は とばす。文を 足したら lines.js → render.js を 流す。
   クレジット：VOICEVOX:ずんだもん
   --------------------------------------------------------- */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'voice');
const TMP = path.join(process.env.TEMP || process.env.TMP || '.', 'tamago-voice');
const SPEAKER = Number(process.env.SPEAKER || 3);     // 3＝ずんだもん ノーマル・1＝あまあま・7＝ツンツン
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const lines = JSON.parse(fs.readFileSync(path.join(__dirname, 'lines.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
const bankPath = path.join(OUT, 'bank.json');
const bank = fs.existsSync(bankPath) ? JSON.parse(fs.readFileSync(bankPath, 'utf8')) : {};
const only = (process.argv.find(function (a) { return a.startsWith('--only='); }) || '').slice(7);

function req(method, p, body, cb) {
  const r = http.request({ host: '127.0.0.1', port: 50021, method: method, path: p, headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {} }, function (res) {
    const chunks = []; res.on('data', function (c) { chunks.push(c); }); res.on('end', function () { cb(null, res.statusCode, Buffer.concat(chunks)); });
  });
  r.on('error', function (e) { cb(e); });
  if (body) r.write(body);
  r.end();
}
function synth(text, cb) {
  req('POST', '/audio_query?speaker=' + SPEAKER + '&text=' + encodeURIComponent(text), null, function (e, st, buf) {
    if (e || st !== 200) { cb(e || new Error('audio_query ' + st)); return; }
    const q = JSON.parse(buf.toString('utf8'));
    q.speedScale = 0.95; q.pitchScale = 0; q.intonationScale = 1.1; q.volumeScale = 1.0; q.prePhonemeLength = 0.05; q.postPhonemeLength = 0.15; q.outputSamplingRate = 24000;
    req('POST', '/synthesis?speaker=' + SPEAKER, JSON.stringify(q), function (e2, st2, wav) {
      if (e2 || st2 !== 200) { cb(e2 || new Error('synthesis ' + st2)); return; }
      cb(null, wav);
    });
  });
}
let i = 0, made = 0, next = Object.keys(bank).length;
function step() {
  if (i >= lines.length) { fs.writeFileSync(bankPath, JSON.stringify(bank, null, 0)); console.log('done: ' + made + ' new, ' + Object.keys(bank).length + ' total'); return; }
  const L = lines[i++];
  if (bank[L.key] || (only && L.key.indexOf(only) < 0)) { step(); return; }
  synth(L.text, function (e, wav) {
    if (e) { console.log('NG ' + L.key + ': ' + e.message); step(); return; }
    const n = String(++next).padStart(3, '0');
    const wavP = path.join(TMP, n + '.wav'), mp3 = path.join(OUT, n + '.mp3');
    fs.writeFileSync(wavP, wav);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', wavP, '-ac', '1', '-ar', '24000', '-b:a', '48k', '-codec:a', 'libmp3lame', mp3]);
    bank[L.key] = n + '.mp3'; made++;
    if (made % 20 === 0) { fs.writeFileSync(bankPath, JSON.stringify(bank, null, 0)); console.log(made + ' … ' + L.key); }
    step();
  });
}
req('GET', '/version', null, function (e, st, buf) {
  if (e) { console.log('VOICEVOX の エンジンが 動いて いません（' + e.message + '）'); process.exit(1); }
  console.log('VOICEVOX ' + buf.toString() + ' / speaker ' + SPEAKER + ' / lines ' + lines.length);
  step();
});
