/**
 * Modular payments mount for holisticguidance.life.
 *
 * Reads window.HOLISTIC_PAYMENTS and renders into [data-payments-root].
 * Provider adapters are stubs: no network calls, no Stripe or Square
 * SDK scripts, and no secret keys. Swapping providers is a config change.
 */
(function (global) {
  'use strict';

  var COPY = {
    heading: 'Book a Session',
    pendingLabel: 'Payment integration pending',
    note: '',
    button: 'Book a Session',
    comingSoon: ''
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === 'className') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'html') node.innerHTML = value;
        else node.setAttribute(key, value === true ? '' : String(value));
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function checkoutUrlFor(provider, providerConfig) {
    if (!providerConfig || !global.HolisticAllowedUrl) return '';
    if (provider === 'stripe') return global.HolisticAllowedUrl.stripe(providerConfig.paymentLinkUrl || '');
    if (provider === 'square') return global.HolisticAllowedUrl.square(providerConfig.checkoutUrl || '');
    return '';
  }

  function renderPlaceholder(root) {
    root.innerHTML = '';
    var button = el('button', {
      type: 'button',
      className: 'btn btn-payments',
      disabled: true,
      'aria-disabled': 'true',
      text: COPY.button
    });
    var panel = el('div', { className: 'payments-panel' }, [
      el('div', { className: 'flourish', 'aria-hidden': 'true' }),
      el('span', { className: 'label', text: COPY.pendingLabel }),
      el('h2', { text: COPY.heading }),
      el('div', { className: 'squiggle', 'aria-hidden': 'true' }),
      el('p', { className: 'payments-note', text: COPY.note }),
      el('div', { className: 'payments-actions' }, [button]),
      el('span', { className: 'payments-status', text: COPY.comingSoon })
    ]);
    root.appendChild(panel);
  }

  /**
   * Stripe adapter (stub).
   * Later: if enabled and paymentLinkUrl is an allowed hosted Stripe URL,
   * the button may become a link to that Payment Link / Checkout page.
   * Does not load Stripe.js, does not call any Stripe API, and does not
   * collect card data on this site.
   */
  var stripeAdapter = {
    id: 'stripe',
    mount: function (root, providerConfig, options) {
      renderPlaceholder(root);
      if (!options.enabled) return;
      var url = checkoutUrlFor('stripe', providerConfig);
      if (!url) return;
      // Hook only: left inert in this staged build. A later, approved
      // enablement can point the button at `url` without a redesign.
    }
  };

  /**
   * Square adapter (stub).
   * Later: if enabled and checkoutUrl is an allowed hosted Square URL,
   * the button may become a link to that checkout page.
   * Does not load the Square Web Payments SDK, does not call any Square
   * API, and does not collect card data on this site.
   */
  var squareAdapter = {
    id: 'square',
    mount: function (root, providerConfig, options) {
      renderPlaceholder(root);
      if (!options.enabled) return;
      var url = checkoutUrlFor('square', providerConfig);
      if (!url) return;
      // Hook only: left inert in this staged build. A later, approved
      // enablement can point the button at `url` without a redesign.
    }
  };

  var adapters = {
    stripe: stripeAdapter,
    square: squareAdapter
  };

  function revealIfVisible(root) {
    var fade = root.closest('.fade');
    if (!fade) return;
    var rect = fade.getBoundingClientRect();
    if (rect.top < (global.innerHeight || 0) && rect.bottom > 0) {
      fade.classList.add('in');
    }
  }

  function init() {
    var config = global.HOLISTIC_PAYMENTS || {};
    var provider = config.provider === 'square' ? 'square' : 'stripe';
    var adapter = adapters[provider] || adapters.stripe;
    var roots = document.querySelectorAll('[data-payments-root]');
    var options = { enabled: !!config.enabled, provider: provider };
    var providerConfig = config[provider] || {};

    Array.prototype.forEach.call(roots, function (root) {
      adapter.mount(root, providerConfig, options);
      revealIfVisible(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.HolisticPayments = {
    init: init,
    adapters: adapters
  };
})(window);
