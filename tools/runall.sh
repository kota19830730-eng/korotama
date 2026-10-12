# 全モードを 流す：bash tools/runall.sh → $OUT/runall.txt（エラー 0 で ない 行を 見る：grep -v "エラー: 0" ）。care:k は kazu に 移る ので 入れない
D="$(dirname "$0")"; OUT="${OUT:-${TEMP:-/tmp}/korotama-shot}"; mkdir -p "$OUT"
R="$OUT/runall.txt"; : > "$R"
for m in start setup draw "pmon:dragon" "pmon:dragon:3" "presets" "presets:cool:pick" canvas preview "egg:hatch" "eggs:1" "eggs:2" "eggs:4" "eggs:5" regrow roll v03 "nudge:moji:k" "nudge:kurabe:l" rest "donelearn:find" ppplay bugfix install "install:ios" home "home:k" hold "hold:mouse" care "care:m" "care:l" bugfix2 shop "shop:l" play "play:l" done "done:grow" parent kazu kflow kurabe "kuflow:s" "kuflow:k" moji "mjflow:s" "mjflow:k" tokei "tkflow:s" "tkflow:k" wk "wk::night" kaku kakupad kakuplace sagasu maneko help story "print:nurie" album parentv2 wkflow crayons guide guideflow fbask fbguide fbparent setupbd flow; do
  r=$(bash "$D/shot.sh" "$m" 520 1000 600000 2>&1 | grep -E "エラー|ERROR|NG|REJECT|FAIL")
  echo "== $m :: $r" >> "$R"
done
echo DONE >> "$R"
