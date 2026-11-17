/**
 * Venmo payment settings for /pay/
 *
 * ONE-LINE SWAP: change the `handle` value below to a different Venmo
 * username (no @). Nothing else needs regenerating. The button deep
 * link (amount $500 and note) and the desktop QR code are both built
 * in the browser from these values.
 *
 * Current business profile: guidance-life
 *   handle: 'guidance-life'
 *
 * If handle is missing, empty, or set back to the VENMO_HANDLE
 * placeholder, the pay page stays in "handle not set" mode: it does
 * not link to venmo.com, does not show a QR code, and never displays
 * the placeholder string. Visitors then see a short notice that Venmo
 * payment details will be shared with them directly, and can still
 * continue to choose a time in Calendly.
 *
 * URL shape when the handle is set (built by pay.js):
 *   https://venmo.com/u/{handle}?txn=pay&amount=500&note={note}
 * where {note} is "Holistic Guidance session – {client name} – {date}".
 * In the main (pre-booking) flow the client types their name and a
 * preferred session date, and the date has no time. In the older
 * post-booking flow (Calendly redirect params present) the date includes
 * the session time, e.g. "Nov 20, 2026 3:00 PM".
 */
window.HOLISTIC_VENMO_PAY = {
  handle: 'guidance-life',
  amount: 500,
  note: 'Holistic Guidance session'
};
