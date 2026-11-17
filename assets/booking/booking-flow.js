/**
 * Gated, one-screen, 3-step booking flow for #book.
 * Step 1 Begin → Step 2 Choose a time → Step 3 Payment (only after a slot is chosen).
 * Orchestrates the existing scheduling and payments modules; does not replace them.
 *
 * Hook (inert until Calendly is live and a script or popup posts a message):
 * listens for Calendly's `calendly.event_scheduled` postMessage and auto-advances
 * to Payment. No Calendly embed script is loaded here.
 */
(function (global) {
  'use strict';

  var section;
  var current = 1;
  var slotChosen = false;

  function panel(n) {
    return section.querySelector('[data-booking-step="' + n + '"]');
  }

  function setHidden(el, hide) {
    if (!el) return;
    if (hide) {
      el.setAttribute('hidden', '');
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('hidden');
      el.removeAttribute('inert');
      el.setAttribute('aria-hidden', 'false');
    }
  }

  function updateIndicator() {
    var items = section.querySelectorAll('.booking-indicator li');
    Array.prototype.forEach.call(items, function (item) {
      var n = parseInt(item.getAttribute('data-booking-indicator'), 10);
      if (n === current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-done', n < current);
    });
    section.setAttribute('data-booking-current', String(current));
  }

  function focusStep(n) {
    var el = panel(n);
    if (!el) return;
    var target = el.querySelector('[data-booking-focus]') || el.querySelector('h2') || el.querySelector('button, a');
    if (target && typeof target.focus === 'function') {
      try { target.focus(); } catch (err) {}
    }
  }

  function setStep(n, opts) {
    var options = opts || {};
    if (n === 3 && !slotChosen) return false;
    if (n < 1 || n > 3) return false;
    if (n < current && n < 2) slotChosen = false;
    current = n;
    setHidden(panel(1), n !== 1);
    setHidden(panel(2), n !== 2);
    setHidden(panel(3), n !== 3);
    updateIndicator();
    if (options.focus !== false) focusStep(n);
    return true;
  }

  function markSlotChosen(source) {
    slotChosen = true;
    setStep(3, { focus: true });
  }

  function isCalendlyOrigin(origin) {
    if (!origin) return false;
    try {
      var host = new URL(origin).hostname;
      return host === 'calendly.com' || host.slice(-13) === '.calendly.com';
    } catch (err) {
      return false;
    }
  }

  function onCalendlyMessage(event) {
    var data = event.data;
    if (!data || data.event !== 'calendly.event_scheduled') return;
    if (!isCalendlyOrigin(event.origin)) return;
    if (current !== 2 && current !== 3) return;
    markSlotChosen('calendly');
  }

  function init() {
    section = document.getElementById('book');
    if (!section) return;

    slotChosen = false;
    setStep(1, { focus: false });

    var begin = section.querySelector('[data-booking-begin]');
    if (begin) {
      begin.addEventListener('click', function () {
        setStep(2, { focus: true });
      });
    }

    section.addEventListener('click', function (e) {
      var back = e.target.closest('[data-booking-back]');
      if (!back || !section.contains(back)) return;
      var dest = parseInt(back.getAttribute('data-booking-back'), 10);
      if (dest === 1) slotChosen = false;
      setStep(dest, { focus: true });
    });

    document.addEventListener('holistic:slot-chosen', function () {
      markSlotChosen('scheduling');
    });

    // Inert until Calendly posts this event; no embed script is loaded.
    global.addEventListener('message', onCalendlyMessage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.HolisticBookingFlow = {
    init: init,
    setStep: function (n) { return setStep(n, { focus: true }); },
    hasSlotChosen: function () { return slotChosen; }
  };
})(window);
