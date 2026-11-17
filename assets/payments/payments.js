/**
 * Modular payments mount for holisticguidance.life.
 *
 * Reads window.HOLISTIC_PAYMENTS and renders into [data-payments-root].
 * Provider adapters never load a Stripe or Square SDK, never call a
 * payment API, and never collect card data on this site. The only
 * integration is a link to a hosted Payment Link or checkout URL that
 * has passed HolisticAllowedUrl. Swapping providers is a config change.
 *
 * On /pay/: when enabled is true and paymentLinkUrl (or Square's
 * checkoutUrl) is an allowed https URL, the slot shows a
 * "Pay $500 by card" link. When enabled is false, or the URL is
 * missing or rejected, the slot stays empty and hidden — nothing
 * Stripe- or Square-related is rendered.
 */
(function (global) {
  'use strict';

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

  function clearSlot(root) {
    root.innerHTML = '';
    root.hidden = true;
    root.removeAttribute('data-pay-card-ready');
  }

  function renderCardLink(root, url) {
    root.innerHTML = '';
    var link = el('a', {
      className: 'btn pay-card-btn',
      href: url,
      'data-pay-card': '1',
      'aria-disabled': 'true',
      tabindex: '-1',
      text: 'Pay $500 by card'
    });
    root.appendChild(link);
    root.hidden = false;
    root.setAttribute('data-pay-card-ready', '1');
  }

  function mountLink(root, provider, providerConfig, options) {
    if (!options.enabled) {
      clearSlot(root);
      return;
    }
    var url = checkoutUrlFor(provider, providerConfig);
    if (!url) {
      clearSlot(root);
      return;
    }
    renderCardLink(root, url);
  }

  /**
   * Stripe adapter. When enabled with an allowlisted Payment Link,
   * renders a top-level "Pay $500 by card" link. Does not load
   * Stripe.js, does not call any Stripe API, and does not collect
   * card data on this site.
   */
  var stripeAdapter = {
    id: 'stripe',
    mount: function (root, providerConfig, options) {
      mountLink(root, 'stripe', providerConfig, options);
    }
  };

  /**
   * Square adapter. Same contract as Stripe, using an allowlisted
   * hosted Square checkout URL. Does not load the Square Web Payments
   * SDK, does not call any Square API, and does not collect card data
   * on this site.
   */
  var squareAdapter = {
    id: 'square',
    mount: function (root, providerConfig, options) {
      mountLink(root, 'square', providerConfig, options);
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
