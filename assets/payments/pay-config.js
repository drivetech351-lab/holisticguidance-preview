/**
 * Venmo payment settings for /pay/
 *
 * ONE-LINE SWAP: replace VENMO_HANDLE below with the Venmo username (no @).
 * The button link and the desktop QR code are both built in the browser
 * from these values, so nothing else needs regenerating.
 *
 * URL shape (built by pay.js):
 *   https://venmo.com/u/{handle}?txn=pay&amount=500&note={note}
 * where {note} is "One-hour session – {client name} – {date}".
 * In the main (pre-booking) flow the client types their name and a
 * preferred session date, and the date has no time. In the older
 * post-booking flow (Calendly redirect params present) the date includes
 * the session time, e.g. "Nov 20, 2026 3:00 PM".
 */
window.HOLISTIC_VENMO_PAY = {
  handle: 'VENMO_HANDLE',
  amount: 500,
  note: 'One-hour session'
};
