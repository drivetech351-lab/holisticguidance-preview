/**
 * Allow only https URLs on hosted provider domains.
 * This site never hosts a form that collects names, emails, or card data.
 * Scheduling and payment stay on Calendly / Stripe / Square hosted pages.
 */
(function (global) {
  'use strict';

  var HOSTS = {
    calendly: ['calendly.com', 'www.calendly.com'],
    stripe: ['buy.stripe.com', 'checkout.stripe.com'],
    square: ['square.link', 'checkout.square.site']
  };

  function allowedHttpsUrl(value, list) {
    if (!value || typeof value !== 'string') return '';
    try {
      var url = new URL(value);
      if (url.protocol !== 'https:') return '';
      if (url.username || url.password) return '';
      if (url.port && url.port !== '443') return '';
      var host = url.hostname.toLowerCase();
      for (var i = 0; i < list.length; i++) {
        if (host === list[i]) return url.href;
      }
    } catch (err) {}
    return '';
  }

  global.HolisticAllowedUrl = {
    calendly: function (value) { return allowedHttpsUrl(value, HOSTS.calendly); },
    stripe: function (value) { return allowedHttpsUrl(value, HOSTS.stripe); },
    square: function (value) { return allowedHttpsUrl(value, HOSTS.square); }
  };
})(window);
