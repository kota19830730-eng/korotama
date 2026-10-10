// タップの 反応の 音（v0.1.16）を 聞く ページを 作る：node buildreact.js → react.html
// react1〜3.wav は runsfx.js で 6音ずつ 書き出した もの（1音 1.4秒・0.2秒から）
const fs = require('fs');
const path = require('path');
const D = __dirname;
function readWav(f) {
  const b = fs.readFileSync(path.join(D, f));
  const sr = b.readUInt32LE(24), n = (b.length - 44) / 4;
  const M = new Float32Array(n);
  for (let i = 0; i < n; i++) M[i] = (b.readInt16LE(44 + i * 4) + b.readInt16LE(46 + i * 4)) / 65536;
  return { sr: sr, M: M };
}
function slice(w, t0, sec, outSr) {   // 1音ぶんを 22kHz モノラルの WAV に（音量を そろえて 聞きやすく ×2）
  const ratio = w.sr / outSr, n = Math.floor(outSr * sec);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(outSr, 24); buf.writeUInt32LE(outSr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  const s0 = Math.floor(t0 * w.sr);
  for (let i = 0; i < n; i++) {
    const j = Math.min(w.M.length - 1, s0 + Math.floor(i * ratio));
    let v = w.M[j] * 2;
    if (i > n - 2000) v *= (n - i) / 2000;
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
  }
  return 'data:audio/wav;base64,' + buf.toString('base64');
}
const GROUPS = [
  ['react1.wav', [['sun', 'おひさま', 'にっこり＋光'], ['moon', 'おつきさま', '夜だけ'], ['rain', 'くも', 'あめ ぱらぱら'], ['rainbow', 'にじ', '雲を 3回目'], ['rustle', 'き', 'さらさら'], ['bird', 'ことり', '木を 2回目']]],
  ['react2.wav', [['knock', 'いえ', 'とんとん'], ['door', 'ドア', 'あく'], ['pop', 'おはな', '丘に さく'], ['flutter', 'ちょうちょ', '丘を 2回目'], ['shoot', 'ながれぼし', '夜の 空'], ['heart', 'なでなで', '長おし']]],
  ['react3.wav', [['tickle', 'くすぐったい', '3回 つづけて'], ['jump', 'ぴょん', 'タップ'], ['spin', 'くるりん', 'タップ'], ['yawn', 'あくび', '35秒 ほっとく'], ['snore', 'すやすや', '50秒で うたた寝'], ['wake', 'おきた', '寝て いる ときに タップ']]]
];
const items = [];
GROUPS.forEach(function (g) {
  const w = readWav(g[0]);
  g[1].forEach(function (it, i) { items.push({ id: it[0], name: it[1], when: it[2], src: slice(w, 0.2 + i * 1.4, i % 6 === 3 && g[0] === 'react1.wav' ? 1.4 : 1.4, 22050) }); });
});
const tpl = fs.readFileSync(path.join(D, 'react_template.html'), 'utf8');
const html = tpl.split('/*ITEMS*/[]').join(JSON.stringify(items));
fs.writeFileSync(path.join(D, 'react.html'), html);
console.log('react.html', (html.length / 1024).toFixed(0) + ' KB', items.length + ' sounds');
