#!/bin/bash
# 画面写真＋ログ：bash tools/shot.sh <mode> [w h] [budget]  → $OUT/<mode>.png とログ（OUT は はじめ %TEMP%/korotama-shot）
P="$(cygpath -m "$(cd "$(dirname "$0")/.." && pwd)")"
OUT="${OUT:-${TEMP:-/tmp}/korotama-shot}"; mkdir -p "$OUT"
C="/c/Program Files/Google/Chrome/Application/chrome.exe"
M="$1"; W="${2:-520}"; H="${3:-1000}"; B="${4:-120000}"
N=$(echo "$M" | tr ':' '_')
"$C" --headless=new --disable-gpu --user-data-dir="$OUT/ud_$N" --hide-scrollbars --virtual-time-budget=$B --window-size=$W,$H --screenshot="$OUT/$N.png" "file:///$P/tools/harness.html#$M" >/dev/null 2>&1
"$C" --headless=new --disable-gpu --user-data-dir="$OUT/ud_$N" --virtual-time-budget=$B --dump-dom "file:///$P/tools/harness.html#$M" 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const i=s.lastIndexOf('<pre id=\"log\">');console.log(s.slice(i+14,s.indexOf('</pre>',i)).replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&'))})"
