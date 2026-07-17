// ==UserScript==
// @name         Amazon Checkout Restock-Check
// @namespace    restock-check.local
// @version      1.3
// @description  Lädt die Checkout-Seite neu, bis die "Menge nicht verfügbar"-Meldung verschwindet, dann Dauer-Alarm (Fullscreen-Flash + Beep) mit Ack-Button
// @match        https://www.amazon.de/gp/buy/*
// @match        https://www.amazon.de/checkout/*
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const MIN_MS = 10000;
  const MAX_MS = 25000;
  const BEEP_INTERVAL_MS = 2000;
  const FLASH_INTERVAL_MS = 500;

  const ERROR_PATTERNS = [
    'nicht mehr verfügbar',
    'maximal verfügbare Menge',
    'Es gab ein Problem mit einigen Artikeln'
  ];

  let audioCtx = null;
  let beepTimer = null;
  let flashTimer = null;
  let soundHint = null;
  let overlay = null;

  function errorPresent() {
    const text = document.body.innerText || '';
    return ERROR_PATTERNS.some(p => text.includes(p));
  }

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function beepOnce() {
    try {
      const ctx = ensureAudio();
      if (ctx.state !== 'running') {
        if (soundHint) soundHint.style.display = '';
        return;
      }
      if (soundHint) soundHint.style.display = 'none';
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => osc.stop(), 700);
    } catch (e) { /* ignorieren */ }
  }

  function startAlarmLoop(testMode) {
    beepOnce();
    beepTimer = setInterval(beepOnce, BEEP_INTERVAL_MS);

    // Fullscreen-Flash-Overlay: liegt über der ganzen Seite, lässt aber
    // Klicks durch (pointer-events:none), damit man weiter bestellen kann
    overlay = document.createElement('div');
    overlay.id = 'restock-flash-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99998;pointer-events:none;' +
      'background:' + (testMode ? '#ffaa00' : '#00cc00') + ';' +
      'opacity:0;transition:opacity 0.15s;';
    document.body.appendChild(overlay);

    let flip = false;
    const baseTitle = document.title;
    flashTimer = setInterval(() => {
      flip = !flip;
      overlay.style.opacity = flip ? '0.55' : '0';
      document.title = (flip ? '🔴🔴🔴 ' : '✅✅✅ ') + baseTitle;
    }, FLASH_INTERVAL_MS);
  }

  function stopAlarmLoop() {
    if (beepTimer) { clearInterval(beepTimer); beepTimer = null; }
    if (flashTimer) { clearInterval(flashTimer); flashTimer = null; }
    if (overlay) { overlay.remove(); overlay = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
  }

  function showBanner(testMode) {
    const banner = document.createElement('div');
    banner.id = 'restock-banner';
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'background:' + (testMode ? '#c80' : '#0a0') + ';color:#fff;' +
      'font-size:20px;font-weight:bold;text-align:center;padding:12px;' +
      'display:flex;align-items:center;justify-content:center;gap:16px;';

    const label = document.createElement('span');
    label.textContent = testMode
      ? '🧪 TESTMODUS – Alarm-Probelauf'
      : '✅ ARTIKEL VERFÜGBAR – Reload gestoppt';
    banner.appendChild(label);

    soundHint = document.createElement('button');
    soundHint.textContent = '🔊 Ton aktivieren';
    soundHint.style.cssText =
      'font-size:16px;padding:6px 14px;cursor:pointer;display:none;' +
      'border:2px solid #fff;border-radius:6px;background:transparent;color:#fff;';
    soundHint.addEventListener('click', () => {
      ensureAudio();
      beepOnce();
    });
    banner.appendChild(soundHint);

    const ackBtn = document.createElement('button');
    ackBtn.textContent = '🔕 Ack';
    ackBtn.style.cssText =
      'font-size:18px;font-weight:bold;padding:6px 20px;cursor:pointer;' +
      'border:2px solid #fff;border-radius:6px;background:#fff;color:#000;';
    ackBtn.addEventListener('click', () => {
      stopAlarmLoop();
      if (testMode) {
        banner.remove();
      } else {
        label.textContent = '✅ ARTIKEL VERFÜGBAR (bestätigt)';
        ackBtn.remove();
        if (soundHint) soundHint.remove();
      }
    });
    banner.appendChild(ackBtn);

    document.body.prepend(banner);
  }

  function triggerAlarm(testMode = false) {
    if (document.getElementById('restock-banner')) return;
    if (!testMode) {
      if (typeof GM_notification === 'function') {
        GM_notification({
          title: 'Amazon: Artikel verfügbar!',
          text: 'Die Fehlermeldung ist weg – jetzt bestellen.',
          timeout: 0
        });
      }
    }
    showBanner(testMode);
    startAlarmLoop(testMode);
  }

  function scheduleReload() {
    const delay = MIN_MS + Math.random() * (MAX_MS - MIN_MS);
    document.title = `⏳ Reload in ${Math.round(delay / 1000)}s – ` + document.title;
    setTimeout(() => location.reload(), delay);
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('🧪 Alarm testen', () => triggerAlarm(true));
  }

  setTimeout(() => {
    if (errorPresent()) {
      scheduleReload();
    } else {
      triggerAlarm(false);
    }
  }, 3000);
})();
