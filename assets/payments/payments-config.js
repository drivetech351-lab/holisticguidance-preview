/**
 * Payments configuration for holisticguidance.life
 *
 * Stripe card payments on /pay/ stay off until two fields in this file
 * are set. That is the only change needed to turn the card option on:
 *
 *   1. stripe.paymentLinkUrl — the hosted Stripe Payment Link
 *      (https URL on buy.stripe.com or checkout.stripe.com only).
 *   2. enabled — set to true.
 *
 * Example (do not commit live values until Eugene approves going live):
 *   enabled: true,
 *   stripe: {
 *     publishableKey: '',
 *     paymentLinkUrl: 'https://buy.stripe.com/your_payment_link'
 *   }
 *
 * With those two set, /pay/ shows a "Pay $500 by card" option beside
 * Venmo, linking only to an allowlisted Stripe URL, then continues to
 * Calendly. With enabled false, or with an empty or disallowed URL,
 * nothing Stripe-related is rendered.
 *
 * Switching from Stripe (preferred) to Square, or the other way,
 * is also a config change only. Do not edit payments.js or the page
 * markup to swap providers. Fill in only that provider's public fields
 * (never secret keys).
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
