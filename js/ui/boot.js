/* ---------------------------------------------------------
   起動（ころたま）
   --------------------------------------------------------- */
(function () {
  function unlock() { try { MQ.sfx.unlock(); MQ.bgm.wake(); } catch (e) { /* なし */ } }
  ['touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { passive: true }); });

  function start() {
    MQ.stage.fit();
    const s = MQ.save.settings();
    MQ.sfx.setEnabled(s.sound !== false);
    MQ.bgm.setEnabled(s.sound !== false && s.music !== false);   // おんがく（v0.1.15・はじめは あり）
    MQ.voice.setPitch(s.pitch || 'high');
    try { MQ.voice.refresh(); } catch (e) { /* なし */ }
    const kid = MQ.save.kid();
    if (kid && kid.mon) MQ.ui.home.open();
    else MQ.ui.start.open();
  }
  // Service Worker（オフライン・ホーム画面）。file:// では 入れない
  function sw() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').catch(function () { /* なし */ });
  }
  MQ.boot = { start: start, sw: sw };
  if (!window.__MQ_NO_AUTOBOOT) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
    sw();
  }
})();
