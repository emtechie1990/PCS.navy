# Fixes

## 2026-11-02 — Client billing and advertising requirements

- **Problem:** The client's onboarding, advertising and billing spec (five customer types, 6-month prepay with annual renewal, geographic advertising with tracked impressions, clicks and inquiries, admin billing and ad management, social-ad promotion) had only partial support: profiles, quotes and unpriced campaign requests, with admin-editable metrics and no payment path.
- **Fix:** Stripe property-plan checkout (6 months now, automatic annual renewal) with renewal, failure and cancellation webhooks (idempotent per invoice); paid-slot check on housing posts when live payments are on; admin campaign pricing and campaign checkout; ad delivery on installation boards with server-counted impressions, clicks and inquiries (inquiries emailed via Resend when configured, always stored); admin Accounts, Billing and Advertising tabs; listing promote toggle and a Meta/TikTok catalog CSV feed. Metrics are no longer admin-editable. Sample placeholders are untouched and excluded from promotion.
- **Verified:** `backend/tests/test_catalog.py` (7 tests against a throwaway local MongoDB database); full backend suite 26 passed against a local server; a 37-step HTTP walkthrough of every new endpoint passed; frontend type-check, lint (3 existing Fast Refresh warnings) and production build passed; the sponsored ad was seen rendering on a local installation board.
- **Not working yet:** Charging needs the client's Stripe keys, the webhook events listed in the README, sandbox tests, then `PAYMENTS_ENABLED=true`. PayPal is not offered for plans or ads because renewals need a Stripe subscription. Running paid social ads happens in the client's Meta / TikTok accounts using the feed URL.

## 2026-11-02 — Payment follow-up review (after the fail-closed gate)

- **Problem:** The PayPal return page captured the order again on every refresh, so a second visit after a successful payment hit `ORDER_ALREADY_CAPTURED` and showed "cancelled" for a paid Spotlight. A new Spotlight purchase reset `featured_until` instead of adding to time still running. The backend still accepted six provider ids (Apple Pay, Google Pay, Cash App, Venmo) that the UI and checkout no longer offer, and carried a dead Venmo branch. `PAYMENTS_ENABLED` was missing from the list of keys the `pcs-shared` Render group must hold.
- **Fix:** Stripe and PayPal return handlers redirect straight to the listing when the intent is already paid, without a provider call. `_fulfil` extends an active Spotlight. `ProviderId` is `stripe | paypal` only, matching the frontend; the `VIA` alias map and `via` intent field are gone. `render.yaml` and the README name `PAYMENTS_ENABLED` as a group key.
- **Verified:** `backend/tests/test_payment_gate.py` gained three tests (paid-intent refresh for both providers, Spotlight extension); full backend suite, frontend type-check and production build passed.
- **Not working yet:** Live payments still wait on the client's sandbox checkout and webhook tests; PayPal has no webhook, so a buyer who closes the tab before the return page is never captured (no charge, no Spotlight).

## 2026-11-02 — Payment activation must be explicit

- **Problem:** Saving non-empty provider credentials activated checkout immediately, including direct API requests. Guest listings could also reach the Spotlight purchase flow.
- **Fix:** Checkout is fail-closed unless `PAYMENTS_ENABLED` is exactly `true`, requires the signed-in listing owner and an account-owned listing, and marks new payment intents as authorized. The UI disables checkout while payment setup is incomplete or the viewer does not own the listing. Stripe return/webhook handling verifies the provider reference and ignores legacy or unapproved intents.
- **Verified:** `backend/tests/test_payment_gate.py` and `backend/tests/test_security.py` passed (9 tests); Python compilation, frontend type-check, and production build passed. The linter completed with three existing Fast Refresh warnings in shared UI components.
- **Not working yet:** Live payment processing remains intentionally disabled until sandbox checkout and webhook testing are completed by the payment-account owner.
