# OTP via Google Sheets + Apps Script

**Flow:** Backend generates the 6-digit OTP → stores only its hash → POSTs `{secret, type, to, code, ttlMin}` to the Apps Script Web App → script emails the user with `MailApp.sendEmail` and appends a row to a Google Sheet (log: timestamp, masked email, type, status — **never the OTP, never the full email**).

## Setup steps (give these to the owner)
1. Create a Google Sheet `AnonChat OTP Log` with a tab `log` (headers: `time | to_masked | type | status`).
2. Extensions → Apps Script → paste `apps-script/Code.gs`.
3. Project Settings → Script properties: add `SHARED_SECRET` (same as backend `APPS_SCRIPT_SECRET`) and `SHEET_ID`.
4. Deploy → New deployment → type **Web app** → Execute as **Me**, access **Anyone** → copy the `/exec` URL into `APPS_SCRIPT_URL`.
5. After editing the script, create a **new version** of the deployment (the URL stays the same).
6. Quota: consumer Gmail ≈ 100 recipients/day, Google Workspace ≈ 1,500/day — **log this limit in DECISIONS.md and warn the owner**; it caps daily signups/resets. Plan B: swap `otpService` implementation for SMTP/Resend/SendGrid (keep interface `sendOtp(email, code, type)`).

## Backend `services/otpService.js` requirements
- `generateOtp()` → `crypto.randomInt(100000, 1000000).toString()`.
- `hash(code, userId)` → sha256(code + ':' + userId + ':' + OTP_PEPPER) (add `OTP_PEPPER` to env).
- `sendOtp({email, code, type})`: `axios.post(APPS_SCRIPT_URL, body, {timeout: 10000, maxRedirects: 5, headers:{'Content-Type':'application/json'}})`. Apps Script answers via a 302 redirect for `ContentService` output; axios follows it with GET — that is expected. Treat `data.ok === true` as success.
- Failure → don't crash registration: delete the OTP row, respond 503 `EMAIL_SERVICE_UNAVAILABLE`, log (without the email).
- Dev fallback: console print when `APPS_SCRIPT_URL` empty and `NODE_ENV!=='production'`.
- Verify the exact redirect/response behaviour with `web-research` (developers.google.com/apps-script/guides/web) before finalising, and note findings in DECISIONS.md.
