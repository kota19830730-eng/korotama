# 録音した 声（まなびたまご）

この フォルダの mp3 は **VOICEVOX：ずんだもん** で 作った 声です。

- 声：VOICEVOX（https://voicevox.hiroshiba.jp/ ）の「ずんだもん（ノーマル）」。クレジット表記：**VOICEVOX:ずんだもん**
- 文の 一覧：`tools/voice/lines.json`（`node tools/voice/lines.js` で 作る）
- 作り方：`tools/voice/render.js`（VOICEVOX の エンジンを 127.0.0.1:50021 で 立てて `node tools/voice/render.js`。ffmpeg で 48kbps モノラルの mp3 に）
- `bank.json`＝「文（ひらがな・スペースなし）→ ファイル名」。`js/core/voice.js` が 文ごとに ここを 引いて 鳴らす。無い 文は 端末の 声（Web Speech）。
- 名前（お子さん・生きもの）は 録音に 入れない（voice.js が 読む 前に 外す）。
- 通信は しない（アプリと いっしょに 配る。Service Worker が 使った 文から キャッシュする）。
