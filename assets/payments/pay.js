/**
 * /pay/ — Venmo payment step, then Calendly.
 *
 * Main path (no Calendly event params): the client has just agreed on the
 * site and lands here with ?agreed=<policyVersion>&at=<UTC time>. They
 * enter their full name and preferred session date. The Venmo button and
 * desktop QR stay inert until both are filled; the note is
 * "One-hour session – {name} – {date}". After they tap "Pay $500 with
 * Venmo", step 3 appears: "I've sent payment — choose my time" opens the
 * Calendly booking URL (validated with HolisticAllowedUrl.calendly) with
 * the name prefilled and UTM tags recording the agreement and payment tap.
 *
 * Name, date and tap state are kept in sessionStorage so a return from
 * the Venmo app does not lose them.
 *
 * Legacy path: if Calendly event params are present (invitee name and
 * event_start_time), the page still builds the Venmo note from those
 * details as it did when payment came after booking.
 *
 * Thank-you path: ?booked=1 shows a short "You're booked" message, which
 * is the better after-booking redirect now that payment happens first.
 *
 * Every value from the URL or the form is treated as untrusted: trimmed,
 * stripped of control characters, length-capped, and written with
 * textContent only. Links to Calendly are re-checked by HolisticAllowedUrl.
 * Nothing is sent anywhere.
 */
(function (global) {
  'use strict';

  var STORE_KEY = 'holisticguidance.pay.v1';
  var config = global.HOLISTIC_VENMO_PAY || {};
  var handle = /^[A-Za-z0-9_-]{1,40}$/.test(config.handle || '') ? config.handle : 'VENMO_HANDLE';
  var amount = /^\d+(\.\d{1,2})?$/.test(String(config.amount)) ? String(config.amount) : '500';
  var baseNote = typeof config.note === 'string' && config.note ? config.note : 'One-hour session';

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  function clean(value, max) {
    if (typeof value !== 'string') return '';
    var s = value.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, ' ')
      .replace(/\s+/g, ' ').trim();
    if (s.length > max) s = s.slice(0, max).trim();
    return s;
  }

  function params() {
    try { return new URLSearchParams(global.location.search); } catch (err) { return null; }
  }

  function isoStamp(d) {
    return (d || new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  function loadStore() {
    try {
      var raw = global.sessionStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === 'object' ? o : {};
    } catch (err) {
      return {};
    }
  }

  function saveStore(o) {
    try { global.sessionStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch (err) {}
  }

  function clientNameFromQuery(q) {
    if (!q) return '';
    var full = clean(q.get('invitee_full_name'), 60);
    if (full) return full;
    return clean([q.get('invitee_first_name') || '', q.get('invitee_last_name') || ''].join(' '), 60);
  }

  function hasCalendlyEvent(q) {
    if (!q) return false;
    return !!(clean(q.get('event_start_time'), 40) || clientNameFromQuery(q) ||
      clean(q.get('invitee_uuid'), 80) || clean(q.get('invitee_email'), 80));
  }

  function agreementFrom(q, store) {
    var agreed = clean((q && q.get('agreed')) || '', 64);
    var at = clean((q && q.get('at')) || '', 40);
    if (!/^[A-Za-z0-9._-]{1,64}$/.test(agreed)) agreed = '';
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(at)) at = '';
    if (!agreed) agreed = clean(store.agreed || '', 64);
    if (!at) at = clean(store.at || '', 40);
    if (!/^[A-Za-z0-9._-]{1,64}$/.test(agreed)) agreed = '';
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(at)) at = '';
    var sched = global.HOLISTIC_SCHEDULING || {};
    if (!agreed && typeof sched.policyVersion === 'string') {
      agreed = clean(sched.policyVersion, 64);
    }
    return { agreed: agreed, at: at };
  }

  /**
   * Calendly sends event_start_time in the invitee's own time zone,
   * e.g. 2026-11-20T15:00:00-05:00. Read the wall-clock parts as given
   * so the page shows the time the client picked.
   */
  function sessionTime(q) {
    var raw = q ? clean(q.get('event_start_time'), 40) : '';
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(raw);
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5];
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
    var dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    var h12 = h % 12 === 0 ? 12 : h % 12;
    var time = h12 + ':' + (mi < 10 ? '0' : '') + mi + ' ' + (h < 12 ? 'AM' : 'PM');
    return {
      long: DAYS[dow] + ', ' + MONTHS[mo - 1] + ' ' + d + ', ' + y + ' \u00b7 ' + time,
      short: MONTHS[mo - 1].slice(0, 3) + ' ' + d + ', ' + y + ' ' + time
    };
  }

  function formatPrefDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    var mo = +m[2], d = +m[3], y = +m[1];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    return MONTHS[mo - 1].slice(0, 3) + ' ' + d + ', ' + y;
  }

  function todayIso() {
    var n = new Date();
    var mo = n.getMonth() + 1, d = n.getDate();
    return n.getFullYear() + '-' + (mo < 10 ? '0' : '') + mo + '-' + (d < 10 ? '0' : '') + d;
  }

  function buildNote(name, whenOrDate) {
    var parts = [baseNote];
    if (name) parts.push(name);
    if (whenOrDate && whenOrDate.short) parts.push(whenOrDate.short);
    else if (typeof whenOrDate === 'string' && whenOrDate) parts.push(whenOrDate);
    return parts.join(' \u2013 ');
  }

  function venmoUrl(note) {
    return 'https://venmo.com/u/' + encodeURIComponent(handle) +
      '?txn=pay&amount=' + encodeURIComponent(amount) +
      '&note=' + encodeURIComponent(note);
  }

  function safeCalendly(value) {
    if (!global.HolisticAllowedUrl) return '';
    return global.HolisticAllowedUrl.calendly(value);
  }

  function calendlyUrl(name, agreement, tapAt) {
    var sched = global.HOLISTIC_SCHEDULING || {};
    var base = safeCalendly(sched.bookingUrl || '');
    if (!base) return '';
    try {
      var u = new URL(base);
      if (name) u.searchParams.set('name', name);
      u.searchParams.set('utm_source', 'holisticguidance.life');
      u.searchParams.set('utm_medium', 'venmo_paid');
      if (agreement.agreed) u.searchParams.set('utm_campaign', agreement.agreed);
      if (agreement.at) u.searchParams.set('utm_content', 'agreed_' + agreement.at);
      if (tapAt) u.searchParams.set('utm_term', tapAt);
      return safeCalendly(u.href);
    } catch (err) {
      return base;
    }
  }

  function renderQr(url, show) {
    var fig = document.querySelector('[data-venmo-qr]');
    if (!fig) return;
    var img = fig.querySelector('img');
    if (!show || !url || typeof global.qrcode !== 'function' || !img) { fig.hidden = true; return; }
    try {
      var qr = global.qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      var cells = qr.getModuleCount() + 8;
      var cell = Math.max(2, Math.floor(328 / cells));
      img.src = qr.createDataURL(cell, 4 * cell);
      img.width = cells * cell;
      img.height = cells * cell;
      fig.hidden = false;
    } catch (err) {
      fig.hidden = true;
    }
  }

  function setText(sel, value, hideIfEmpty) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.textContent = value || '';
    if (hideIfEmpty) el.hidden = !value;
  }

  function setMode(mode) {
    var wrap = document.querySelector('[data-pay-wrap]') || document.querySelector('.pay-wrap');
    if (wrap) wrap.setAttribute('data-pay-mode', mode);
  }

  function setVenmo(url, enabled) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-venmo-pay]'), function (a) {
      a.setAttribute('aria-disabled', enabled ? 'false' : 'true');
      if (enabled && url) {
        a.setAttribute('href', url);
        a.removeAttribute('tabindex');
      } else {
        a.removeAttribute('href');
        a.setAttribute('tabindex', '-1');
      }
    });
    renderQr(url, enabled && !!url);
  }

  function setCalendlyLink(url, visible) {
    var wrap = document.querySelector('[data-pay-step3]');
    var a = document.querySelector('[data-pay-calendly]');
    if (a) {
      if (url) {
        a.setAttribute('href', url);
        a.removeAttribute('aria-disabled');
      } else {
        a.removeAttribute('href');
        a.setAttribute('aria-disabled', 'true');
      }
    }
    if (wrap) wrap.hidden = !visible;
  }

  function applyThanks(q) {
    setMode('thanks');
    setText('[data-pay-heading]', "You're booked", false);
    setText('[data-pay-confirm]', 'Your session is confirmed once payment is received.', false);
    var steps = document.querySelector('[data-pay-steps]');
    if (steps) steps.hidden = true;
    var fields = document.querySelector('[data-pay-fields]');
    if (fields) fields.hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll('[data-venmo-pay]'), function (a) {
      a.hidden = true;
    });
    var name = clientNameFromQuery(q);
    var when = sessionTime(q);
    setText('[data-pay-for]', name, true);
    setText('[data-pay-when]', when ? when.long : '', true);
    setVenmo('', false);
    setCalendlyLink('', false);
  }

  function applyPostBooking(q) {
    setMode('post');
    var name = clientNameFromQuery(q);
    var when = sessionTime(q);
    var note = buildNote(name, when);
    var url = venmoUrl(note);
    setText('[data-pay-heading]', "You're booked", false);
    setText('[data-pay-when]', when ? when.long : '', true);
    setText('[data-pay-for]', name, true);
    setText('[data-pay-confirm]', 'Complete payment if you still need to. Your session is confirmed once payment is received.', false);
    var steps = document.querySelector('[data-pay-steps]');
    if (steps) steps.hidden = true;
    var fields = document.querySelector('[data-pay-fields]');
    if (fields) fields.hidden = true;
    setVenmo(url, true);
    setCalendlyLink('', false);
  }

  function applyPreBooking(q) {
    setMode('pre');
    var store = loadStore();
    var agreement = agreementFrom(q, store);
    var fields = document.querySelector('[data-pay-fields]');
    var nameEl = document.querySelector('[data-pay-name]');
    var dateEl = document.querySelector('[data-pay-date]');
    if (fields) fields.hidden = false;
    if (dateEl && !dateEl.getAttribute('min')) dateEl.setAttribute('min', todayIso());

    if (nameEl && !nameEl.value && store.name) nameEl.value = clean(String(store.name), 60);
    if (dateEl && !dateEl.value && store.date && formatPrefDate(store.date)) dateEl.value = store.date;

    function state() {
      var name = nameEl ? clean(nameEl.value, 60) : '';
      var iso = dateEl ? clean(dateEl.value, 10) : '';
      var pref = formatPrefDate(iso);
      var ready = !!(name && pref);
      return { name: name, iso: iso, pref: pref, ready: ready };
    }

    function persist(extra) {
      var s = state();
      var next = {
        name: s.name,
        date: s.iso,
        agreed: agreement.agreed,
        at: agreement.at,
        tapped: !!(extra && extra.tapped) || !!store.tapped,
        tapAt: (extra && extra.tapAt) || store.tapAt || ''
      };
      store = next;
      saveStore(next);
      return next;
    }

    function refresh(opts) {
      var s = state();
      var justTapped = opts && opts.tapped;
      var saved = persist(justTapped ? { tapped: true, tapAt: isoStamp() } : null);
      var url = s.ready ? venmoUrl(buildNote(s.name, s.pref)) : '';
      setVenmo(url, s.ready);
      var showStep3 = s.name && (saved.tapped || justTapped);
      var cal = showStep3 ? calendlyUrl(s.name, agreement, saved.tapAt) : '';
      setCalendlyLink(cal, showStep3);
      return url;
    }

    refresh();

    function onField() { refresh(); }
    if (nameEl && !nameEl.getAttribute('data-bound')) {
      nameEl.setAttribute('data-bound', '1');
      nameEl.addEventListener('input', onField);
      nameEl.addEventListener('change', onField);
    }
    if (dateEl && !dateEl.getAttribute('data-bound')) {
      dateEl.setAttribute('data-bound', '1');
      dateEl.addEventListener('input', onField);
      dateEl.addEventListener('change', onField);
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-venmo-pay]'), function (a) {
      if (a.getAttribute('data-bound')) return;
      a.setAttribute('data-bound', '1');
      a.addEventListener('click', function (e) {
        var s = state();
        if (!s.ready) { e.preventDefault(); if (nameEl && !s.name) nameEl.focus(); else if (dateEl) dateEl.focus(); return; }
        refresh({ tapped: true });
      });
    });
  }

  function apply() {
    var q = params();
    if (q && q.get('booked') === '1') { applyThanks(q); return; }
    if (hasCalendlyEvent(q)) { applyPostBooking(q); return; }
    applyPreBooking(q);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  global.HolisticVenmoPay = {
    build: function (n, w) { return venmoUrl(buildNote(n, w)); },
    calendly: function (n, agreed, at, tapAt) {
      return calendlyUrl(n, { agreed: agreed || '', at: at || '' }, tapAt || '');
    }
  };
})(window);
