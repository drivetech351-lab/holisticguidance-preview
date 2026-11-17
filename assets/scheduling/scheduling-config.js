/**
 * Scheduling configuration for holisticguidance.life
 *
 * The #book section shows one "Book a Session" button. It opens an on-site
 * agreement step with the cancellation policy below; after the visitor ticks
 * the checkbox, "Continue to payment" goes to /pay/ in the same tab, carrying
 * the policy version (`agreed`) and the agreement time in UTC (`at`).
 *
 * /pay/ collects the client's name and preferred date, takes them through
 * Venmo, and only then opens `bookingUrl` so a time is not chosen until
 * payment has been sent.
 *
 * `bookingUrl` must be an https URL on calendly.com or www.calendly.com.
 * Other hosts are rejected. No scheduling widget or embed script is loaded.
 *
 * `cancellationPolicy` is the single source for the policy text shown in the
 * agreement step. When Eugene revises the wording, change it here (and the
 * visible #cancellation block in index.html and book.html).
 *
 * `policyVersion` is a short id for the policy text above. Change the id
 * whenever the policy text changes, so each booking records which wording
 * was agreed to. /pay/ adds it to the Calendly link as utm_campaign, with
 * the agreement time as utm_content (agreed_<UTC ISO time>).
 */
window.HOLISTIC_SCHEDULING = {
  provider: 'calendly',
  enabled: true,
  calendlyUrl: 'https://calendly.com/julia-holisticguidance',
  bookingUrl: 'https://calendly.com/julia-holisticguidance/30min?hide_gdpr_banner=1',
  policyVersion: 'cp-v3.4.2',
  cancellationPolicy: "Your session is time reserved for you alone, and I ask that it be honored. TERMS & CONDITIONS - rescheduling and cancellations up to 7 days of the appointment will allowed; admin fee of one hundred dollars will be deducted along with transaction fees; no refund within 48 hrs. * Whenever you're ready, you are always welcome to return."
};
