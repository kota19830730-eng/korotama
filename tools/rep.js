// tools/rep.js：パッチの 道具（CRLF の ファイルも LF で 置きかえて もどす）。使い方：const rep = require('./tools/rep.js'); rep('js/ui/x.js', [[古い, 新しい]])
// rep(file, [[old, new], ...])：CRLF の ファイルも LF で 置きかえて もどす。old が ちょうど 1回 ない ときは 止まる
const fs = require('fs');
const ROOT = require('path').join(__dirname, '..') + '/';
module.exports = function rep(file, pairs) {
  const p = ROOT + file;
  let s = fs.readFileSync(p, 'utf8');
  const crlf = /\r\n/.test(s);
  if (crlf) s = s.replace(/\r\n/g, '\n');
  pairs.forEach(function (pr, i) {
    const n = s.split(pr[0]).length - 1;
    if (n !== 1) throw new Error(file + ' #' + i + ' 見つかった数 ' + n + ': ' + pr[0].slice(0, 60));
    s = s.split(pr[0]).join(pr[1]);
  });
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(p, s);
  console.log('ok', file, pairs.length);
};
