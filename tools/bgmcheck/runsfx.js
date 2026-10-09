// node run.js <src> <names> <out.wav>
// 本当の 時計で 動かす（OfflineAudioContext の 書き出しは virtual-time では おわらない）
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const [src, names, out, timbre] = process.argv.slice(2);
const dir = __dirname.replace(/\\/g, '/');
const url = 'file:///' + dir + '/sfx.html?src=' + src + '&names=' + names + (timbre ? '&timbre=' + timbre : '');
const t0 = Date.now();
const txt = execFileSync('node', [path.join(__dirname, 'cdpwait.js'), url, '60'], { maxBuffer: 300 * 1024 * 1024 }).toString();
const m = /STATS ([^\n]*)\nWAV ([A-Za-z0-9+/=]+)\nEND/.exec(txt);
if (!m) { console.log('FAILED', txt.slice(0, 800)); process.exit(1); }
fs.writeFileSync(out, Buffer.from(m[2], 'base64'));
console.log(path.basename(out), m[1], 'total=' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
