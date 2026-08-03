/* =============================================================
   main.js — countdown, maps, dynamic guest rows, RSVP submit
   ============================================================= */
(function () {
  'use strict';

  var CFG = window.CONFIG || {};
  var MAX_GUESTS = CFG.maxGuests || 10;

  /* ==========================================================
     Topbar — reveal after the hero
     ========================================================== */
  function initTopbar() {
    var bar = document.getElementById('topbar');
    var hero = document.querySelector('.hero');
    if (!bar || !hero) return;

    var io = new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { rootMargin: '-75% 0px 0px 0px' });

    io.observe(hero);
  }

  /* ==========================================================
     Countdown
     ========================================================== */
  function initCountdown() {
    var grid = document.getElementById('countdown-grid');
    var done = document.getElementById('countdown-done');
    if (!grid) return;

    var target = new Date(CFG.weddingDate).getTime();
    if (isNaN(target)) {
      console.warn('[wedding] Անվավեր weddingDate՝ js/config.js-ում։ / Invalid weddingDate in js/config.js');
      return;
    }

    var cells = {
      days:    grid.querySelector('[data-cd="days"]'),
      hours:   grid.querySelector('[data-cd="hours"]'),
      minutes: grid.querySelector('[data-cd="minutes"]'),
      seconds: grid.querySelector('[data-cd="seconds"]')
    };

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var diff = target - Date.now();

      if (diff <= 0) {
        grid.hidden = true;
        if (done) done.hidden = false;
        clearInterval(timer);
        return;
      }

      var s = Math.floor(diff / 1000);
      cells.days.textContent    = String(Math.floor(s / 86400));
      cells.hours.textContent   = pad(Math.floor(s / 3600) % 24);
      cells.minutes.textContent = pad(Math.floor(s / 60) % 60);
      cells.seconds.textContent = pad(s % 60);
    }

    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ==========================================================
     Map links — built from data-lat / data-lng
     Both are HTTPS universal links: on a phone they hand off to
     the installed Google Maps / Yandex app, otherwise they open
     the web version. No dead links if the app is missing.
     ========================================================== */
  var ICON_PIN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.8"/></svg>';

  var ICON_NAV =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>';

  function initMapLinks() {
    var domain = CFG.yandexDomain || 'yandex.com';
    var labels = CFG.mapLabels || { google: 'Google Maps', yandex: 'Yandex Navi' };

    document.querySelectorAll('[data-maps]').forEach(function (box) {
      var item = box.closest('[data-lat][data-lng]');
      if (!item) return;

      var lat = item.getAttribute('data-lat');
      var lng = item.getAttribute('data-lng');
      if (!lat || !lng) return;

      var venue = item.querySelector('.tl__venue');
      var name  = venue ? venue.textContent.trim() : '';

      // Google Maps — directions to the point from the user's location
      var g = 'https://www.google.com/maps/dir/?api=1&destination=' +
              encodeURIComponent(lat + ',' + lng) + '&travelmode=driving';

      // Yandex Maps — route from current position (`~`) to the point
      var y = 'https://' + domain + '/maps/?rtext=~' +
              encodeURIComponent(lat + ',' + lng) + '&rtt=auto&z=17';

      box.innerHTML =
        link(g, 'maplink--google', ICON_PIN, labels.google, name) +
        link(y, 'maplink--yandex', ICON_NAV, labels.yandex, name);
    });
  }

  function link(href, cls, icon, label, venue) {
    var aria = venue ? label + ' — ' + venue : label;
    return '<a class="maplink ' + cls + '" href="' + href + '" target="_blank" ' +
           'rel="noopener noreferrer" aria-label="' + esc(aria) + '">' +
           icon + '<span>' + esc(label) + '</span></a>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ==========================================================
     Photos

     HTML-ում միշտ placeholder-ն է (.svg) — այն երբեք չի կոտրվում։
     Այստեղ ստուգում ենք՝ կա՞ իրական նկարը, և եթե այո, փոխարինում ենք։
     Այսպիսով նկար ավելացնելը ֆայլ գցելու պարզ գործողություն է՝
     առանց կոդ խմբագրելու։

     The HTML always ships the .svg placeholder, so nothing can break.
     Here we test whether the real photo exists and swap it in if so —
     which makes adding photos a pure drag-and-drop operation.
     ========================================================== */
  function initPhotos() {
    var p = CFG.photos || {};

    probe(p.hero,   function (url) { swapImg('hero', url); });
    probe(p.story1, function (url) { swapImg('story1', url); });
    probe(p.story2, function (url) { swapImg('story2', url); });
  }

  function probe(url, onFound) {
    if (!url) return;
    var im = new Image();
    im.onload = function () { onFound(url); };
    im.onerror = function () {
      console.info('[wedding] Նկարը չգտնվեց, մնում է ժամանակավորը / photo not found:', url);
    };
    im.src = url;
  }

  function swapImg(key, url) {
    var el = document.querySelector('img[data-photo="' + key + '"]');
    if (el) el.src = url;
  }

  /* ==========================================================
     Scroll reveal
     ========================================================== */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        setTimeout(function () { en.target.classList.add('is-in'); }, i * 90);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     RSVP
     ========================================================== */
  function initRsvp() {
    var form     = document.getElementById('rsvp-form');
    var list     = document.getElementById('guests');
    var tpl      = document.getElementById('guest-tpl');
    var addBtn   = document.getElementById('add-guest');
    var maxNote  = document.getElementById('guest-max');
    var countEl  = document.getElementById('guest-count');
    var submitBt = document.getElementById('submit-btn');
    var thanks   = document.getElementById('rsvp-thanks');
    var againBt  = document.getElementById('rsvp-again');

    if (!form || !list || !tpl) return;

    /* ---- guest rows ---- */
    function rows() { return Array.prototype.slice.call(list.querySelectorAll('.guest')); }

    function renumber() {
      var all = rows();
      all.forEach(function (row, i) {
        row.querySelector('.guest__n').textContent = String(i + 1);
        row.classList.toggle('guest--first', i === 0);
      });

      var n = all.length;
      if (countEl) countEl.textContent = n + ' հյուր';
      if (maxNote) maxNote.hidden = n < MAX_GUESTS;
      if (addBtn)  addBtn.disabled = n >= MAX_GUESTS;
    }

    function addRow(focus) {
      if (rows().length >= MAX_GUESTS) return;

      var node = tpl.content.firstElementChild.cloneNode(true);

      node.querySelector('.guest__rm').addEventListener('click', function () {
        if (rows().length <= 1) return;
        node.classList.add('is-out');
        setTimeout(function () { node.remove(); renumber(); }, 220);
      });

      node.querySelectorAll('input').forEach(function (inp) {
        inp.addEventListener('input', function () {
          inp.classList.remove('is-invalid');
          hideErr('guests');
        });
      });

      list.appendChild(node);
      renumber();
      if (focus) node.querySelector('input').focus();
    }

    if (addBtn) addBtn.addEventListener('click', function () { addRow(true); });
    addRow(false); // always start with one row

    /* ---- errors ---- */
    function showErr(key, msg) {
      var el = form.querySelector('[data-err="' + key + '"]');
      if (!el) return;
      if (msg) el.textContent = msg;
      el.hidden = false;
    }
    function hideErr(key) {
      var el = form.querySelector('[data-err="' + key + '"]');
      if (el) el.hidden = true;
    }

    form.querySelectorAll('input[name="attending"]').forEach(function (r) {
      r.addEventListener('change', function () { hideErr('attending'); });
    });

    /* ---- validate + collect ---- */
    function collect() {
      var ok = true;

      var picked = form.querySelector('input[name="attending"]:checked');
      if (!picked) { showErr('attending'); ok = false; }

      var guests = [];
      var firstBad = null;

      rows().forEach(function (row) {
        var fi = row.querySelector('input[name="firstName"]');
        var li = row.querySelector('input[name="lastName"]');
        var f  = fi.value.trim();
        var l  = li.value.trim();

        if (!f) { fi.classList.add('is-invalid'); firstBad = firstBad || fi; ok = false; }
        if (!l) { li.classList.add('is-invalid'); firstBad = firstBad || li; ok = false; }

        if (f && l) guests.push({ firstName: f, lastName: l });
      });

      if (firstBad) { showErr('guests'); firstBad.focus(); }
      if (!ok) return null;

      return {
        attending: picked.value,          // 'yes' | 'no'
        guests: guests,
        guestCount: guests.length,
        submittedAt: new Date().toISOString()
      };
    }

    /* ---- submit ---- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideErr('network');

      var payload = collect();
      if (!payload) return;

      var url = (CFG.appsScriptUrl || '').trim();

      if (!url) {
        console.group('[wedding] Փորձնական ռեժիմ / Test mode — appsScriptUrl is empty');
        console.log('Այս տվյալները կուղարկվեին Google Sheets՝ / Would be sent to Google Sheets:');
        console.log(JSON.stringify(payload, null, 2));
        console.groupEnd();
        succeed(payload);
        return;
      }

      setLoading(true);

      send(url, payload)
        .then(function () { succeed(payload); })
        .catch(function (err) {
          console.error('[wedding] RSVP submit failed:', err);
          showErr('network',
            'Չհաջողվեց ուղարկել։ Խնդրում ենք փորձել կրկին կամ գրել մեզ ուղիղ։');
        })
        .finally(function () { setLoading(false); });
    });

    function setLoading(on) {
      if (!submitBt) return;
      submitBt.disabled = on;
      submitBt.classList.toggle('is-loading', on);
      submitBt.querySelector('.btn__text').textContent = on ? 'Ուղարկվում է' : 'Ուղարկել';
    }

    function succeed(payload) {
      var txt = payload.attending === 'yes'
        ? 'Ձեր պատասխանը գրանցված է։ Սպասում ենք Ձեզ։'
        : 'Ձեր պատասխանը գրանցված է։ Ափսոսում ենք։';

      document.getElementById('thanks-text').textContent = txt;
      form.hidden = true;
      thanks.hidden = false;
      thanks.classList.add('is-in');
      thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (againBt) {
      againBt.addEventListener('click', function () {
        thanks.hidden = true;
        form.hidden = false;
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  /* ----------------------------------------------------------
     Send to the Apps Script Web App.

     Content-Type is text/plain on purpose: it keeps the request
     "simple" so the browser skips the CORS preflight, which
     Apps Script does not answer. The body is still JSON and is
     read server-side from e.postData.contents.

     If the response is unreadable for CORS reasons we retry
     once with no-cors — the write still lands in the Sheet, we
     just can't read the confirmation back.
     ---------------------------------------------------------- */
  function send(url, payload) {
    var body = JSON.stringify(payload);

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
      redirect: 'follow'
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().catch(function () { return { result: 'success' }; });
      })
      .then(function (data) {
        if (data && data.result === 'error') throw new Error(data.message || 'Apps Script error');
        return data;
      })
      .catch(function (err) {
        console.warn('[wedding] Direct POST failed, retrying opaque:', err.message);
        return fetch(url, { method: 'POST', mode: 'no-cors', body: body })
          .then(function () { return { result: 'success', opaque: true }; });
      });
  }

  /* ==========================================================
     Boot
     ========================================================== */
  function boot() {
    initTopbar();
    initCountdown();
    initMapLinks();
    initPhotos();
    initReveal();
    initRsvp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
