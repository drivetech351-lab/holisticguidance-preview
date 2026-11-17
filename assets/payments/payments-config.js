/**
 * Payments configuration for holisticguidance.life
 *
 * Switching from Stripe (preferred) to Square, or the other way,
 * is a config change only. Do not edit payments.js or the page markup
 * to swap providers.
 *
 * How to switch later:
 *   1. Set `provider` to "stripe" or "square".
 *   2. Fill in only that provider's public fields (never secret keys).
 *   3. Set `enabled` to true only after the live integration is approved.
 *
 * Leave `enabled` false until then. The page will show a finished
 * "coming soon" placeholder and will not start any payment.
 *
 * This file must never hold secret keys. Publishable / application
 * identifiers and a hosted Payment Link or checkout URL only.
 */
window.HOLISTIC_PAYMENTS = {
  provider: 'stripe', // 'stripe' | 'square'
  enabled: false,

  stripe: {
    publishableKey: '', // pk_... public key only; never a secret key
    paymentLinkUrl: ''  // https URL on buy.stripe.com or checkout.stripe.com only
  },

  square: {
    applicationId: '',  // Square application id (public)
    locationId: '',     // Square location id
    checkoutUrl: ''     // https URL on square.link or checkout.square.site only
  }
};
