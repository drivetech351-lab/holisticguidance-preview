/**
 * Booking mount for holisticguidance.life.
 *
 * Reads window.HOLISTIC_SCHEDULING and renders into [data-scheduling-root]
 * a single "Book a Session" button. The button opens an accessible modal
 * (role="dialog", aria-modal, focus trap, Esc closes) with the full
 * cancellation policy, a required agreement checkbox, and a
 * "Continue to payment" button that goes to /pay/ in the same tab once
 * the box is ticked, carrying the policy version and agreement time.
 * Payment comes next; Calendly opens only after the client says payment
 * has been sent. No scheduling widget, iframe, or embed script is loaded
 * on the page.
 * If the config is disabled or the URL is not allowed, the #book section and
 * every link to #book stay hidden, so no unfinished booking UI is shown.
 */
(function (global) {
  'use strict';

  var COPY = {
    button: 'Book a Session',
    title: 'Terms and Conditions',
    agree: 'I have read and agree to the cancellation policy.',
    cont: 'Continue to payment',
    close: 'Close'
  };

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === 'className') node.className = value;
        else if (key === 'text') node.textContent = value;
        else node.setAttribute(key, value === true ? '' : String(value));
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function safeBookingUrl(value) {
    if (!global.HolisticAllowedUrl) return '';
    return global.HolisticAllowedUrl.calendly(value);
  }

  function setBookingVisible(visible) {
    var section = document.getElementById('book');
    if (section) {
      section.hidden = !visible;
      if (visible) section.removeAttribute('aria-hidden');
      else section.setAttribute('aria-hidden', 'true');
    }
    Array.prototype.forEach.call(document.querySelectorAll('a[href$="#book"]'), function (a) {
      a.hidden = !visible;
      a.style.display = visible ? '' : 'none';
    });
  }

  /**
   * /pay/ path with the agreement record: policy version and the time
   * the box was ticked (UTC, ISO 8601). No personal data is added.
   */
  function payUrl(policyVersion) {
    try {
      var u = new URL('/holisticguidance-preview/pay/', global.location.origin);
      var stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      if (policyVersion) u.searchParams.set('agreed', String(policyVersion).slice(0, 64));
      u.searchParams.set('at', stamp);
      return u.pathname + u.search;
    } catch (err) {
      return '/holisticguidance-preview/pay/';
    }
  }

  var modal = null;

  function buildModal(policyText, policyVersion) {
    var checkbox = el('input', { type: 'checkbox', id: 'booking-agree-check', required: true });
    var cont = el('a', {
      className: 'btn booking-continue',
      href: '/holisticguidance-preview/pay/',
      'aria-disabled': 'true',
      tabindex: '-1'
    }, [COPY.cont]);
    var closeBtn = el('button', { type: 'button', className: 'booking-modal-close', 'aria-label': COPY.close }, ['\u00d7']);
    var dialog = el('div', {
      className: 'booking-modal-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'booking-modal-title',
      'aria-describedby': 'booking-modal-policy',
      tabindex: '-1'
    }, [
      closeBtn,
      el('h3', { id: 'booking-modal-title', text: COPY.title }),
      el('p', { id: 'booking-modal-policy', className: 'booking-modal-policy', text: policyText }),
      el('label', { className: 'booking-agree', 'for': 'booking-agree-check' }, [checkbox, el('span', { text: COPY.agree })]),
      el('div', { className: 'booking-modal-actions' }, [cont])
    ]);
    var overlay = el('div', { className: 'booking-modal', hidden: true }, [dialog]);
    document.body.appendChild(overlay);

    function syncContinue() {
      var ok = checkbox.checked;
      cont.setAttribute('aria-disabled', ok ? 'false' : 'true');
      cont.setAttribute('href', ok ? payUrl(policyVersion) : '/holisticguidance-preview/pay/');
      if (ok) cont.removeAttribute('tabindex');
      else cont.setAttribute('tabindex', '-1');
    }
    checkbox.addEventListener('change', syncContinue);
    cont.addEventListener('click', function (e) {
      if (!checkbox.checked) { e.preventDefault(); checkbox.focus(); return; }
      // Record what was agreed: policy version + agreement time (UTC).
      cont.setAttribute('href', payUrl(policyVersion));
    });
    closeBtn.addEventListener('click', function () { close(); });
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });

    var opener = null;
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(dialog.querySelectorAll(FOCUSABLE), function (n) {
        if (n.getAttribute('tabindex') === '-1') return false;
        return n.offsetWidth || n.offsetHeight || n.getClientRects().length;
      });
      if (!items.length) { e.preventDefault(); dialog.focus(); return; }
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    function onFocusIn(e) {
      if (!overlay.hidden && !dialog.contains(e.target)) dialog.focus();
    }

    function open(fromEl) {
      opener = fromEl || document.activeElement;
      checkbox.checked = false;
      syncContinue();
      overlay.hidden = false;
      document.documentElement.classList.add('booking-modal-open');
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('focusin', onFocusIn, true);
      checkbox.focus();
    }
    function close() {
      if (overlay.hidden) return;
      overlay.hidden = true;
      document.documentElement.classList.remove('booking-modal-open');
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn, true);
      if (opener && typeof opener.focus === 'function') opener.focus();
    }
    return { open: open, close: close };
  }

  function revealIfVisible(root) {
    var fade = root.closest('.fade');
    if (!fade) return;
    var rect = fade.getBoundingClientRect();
    if (rect.top < (global.innerHeight || 0) && rect.bottom > 0) {
      fade.classList.add('in');
    }
  }

  function init() {
    var config = global.HOLISTIC_SCHEDULING || {};
    var roots = document.querySelectorAll('[data-scheduling-root]');
    var url = config.enabled ? safeBookingUrl(config.bookingUrl) : '';
    var policy = typeof config.cancellationPolicy === 'string' ? config.cancellationPolicy : '';

    // bookingUrl is still required so /pay/ can open a validated Calendly link later.
    if (!url || !policy) { setBookingVisible(false); return; }
    setBookingVisible(true);
    if (!roots.length) return;
    var version = typeof config.policyVersion === 'string' ? config.policyVersion : '';
    if (!modal) modal = buildModal(policy, version);

    Array.prototype.forEach.call(roots, function (root) {
      root.innerHTML = '';
      var btn = el('button', {
        type: 'button',
        className: 'btn btn-book',
        'aria-haspopup': 'dialog'
      }, [COPY.button]);
      btn.addEventListener('click', function () { modal.open(btn); });
      root.appendChild(el('div', { className: 'booking-cta' }, [btn]));
      revealIfVisible(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.HolisticScheduling = {
    init: init,
    open: function () { if (modal) modal.open(); }
  };
})(window);
