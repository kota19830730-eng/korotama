// 聞きくらべの ページを 作る（ころたま v0.1.15）：WAV を 22kHz モノラルに して template.html に 埋めこむ
//   node build.js → kikikurabe.html（Artifact で 公開して ユーザーに 聞いて もらう・公開の 前に）
const fs = require('fs');
const path = require('path');
const D = __dirname;
const ROOT = path.join(D, '..', '..');
function readWav(f) {
  const b = fs.readFileSync(path.join(D, f));
  const sr = b.readUInt32LE(24), n = (b.length - 44) / 4;
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = b.readInt16LE(44 + i * 4) / 32768; R[i] = b.readInt16LE(46 + i * 4) / 32768; }
  return { sr: sr, L: L, R: R };
}
function toWav(w, outSr, maxSec) {
  const ratio = w.sr / outSr;
  const n = Math.min(Math.floor(w.L.length / ratio), Math.floor(outSr * maxSec));
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(outSr, 24); buf.writeUInt32LE(outSr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  const fade = Math.floor(outSr * 0.5), win = Math.max(1, Math.round(ratio));
  for (let i = 0; i < n; i++) {
    const i0 = Math.floor(i * ratio);
    let s = 0;
    for (let k = 0; k < win; k++) { const j = Math.min(i0 + k, w.L.length - 1); s += (w.L[j] + w.R[j]) / 2; }
    let v = s / win;
    if (i > n - fade) v *= (n - i) / fade;
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
  }
  return 'data:audio/wav;base64,' + buf.toString('base64');
}
const SR = 22050;
const clips = { home_fm: ['home_fm.wav', 18], home_kalimba: ['home_kalimba.wav', 18], home_tine: ['home_tine.wav', 18], sfx1_fm: ['sfx1_fm.wav', 8.6], sfx1_kalimba: ['sfx1_kalimba.wav', 8.6], sfx1_tine: ['sfx1_tine.wav', 8.6],
                done: ['done.wav', 12], field: ['field.wav', 15], sfx_old1: ['sfx_old1.wav', 8.6], sfx_new2: ['sfx2_fm.wav', 5.8], sfx_old2: ['sfx_old2.wav', 5.8] };
let html = fs.readFileSync(path.join(D, 'template.html'), 'utf8');
Object.keys(clips).forEach(function (k) {
  const uri = toWav(readWav(clips[k][0]), SR, clips[k][1]);
  if (html.indexOf('{{' + k + '}}') < 0) throw new Error('no slot ' + k);
  html = html.split('{{' + k + '}}').join(uri);
});
// ずんだもんの 声（duck の ためし）
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/voice/bank.json'), 'utf8'));
[['voice1', 'おはよう！'], ['voice2', 'きょうはなにをする？']].forEach(function (p) {
  const f = bank[p[1]];
  const uri = 'data:audio/mpeg;base64,' + fs.readFileSync(path.join(ROOT, 'assets/voice', f)).toString('base64');
  html = html.split('{{' + p[0] + '}}').join(uri);
});
if (/\{\{/.test(html)) throw new Error('slot left');
const out = path.join(D, 'kikikurabe.html');
fs.writeFileSync(out, html);
console.log(out, (html.length / 1024 / 1024).toFixed(2) + ' MB');
