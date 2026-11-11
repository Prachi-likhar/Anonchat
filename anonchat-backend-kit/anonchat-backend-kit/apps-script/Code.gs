/**
 * Anonymous Community Chat — OTP mailer.
 * Deploy as Web app (Execute as: Me, Access: Anyone). Set Script properties:
 *   SHARED_SECRET = same value as backend APPS_SCRIPT_SECRET
 *   SHEET_ID      = id of the Google Sheet with a tab named "log"
 */
function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var body = JSON.parse(e.postData.contents || '{}');

    if (!body.secret || body.secret !== props.getProperty('SHARED_SECRET')) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.to || '')) {
      return json_({ ok: false, error: 'bad_email' });
    }

    var type = body.type === 'reset_password' ? 'reset_password' : 'verify_email';
    var code = String(body.code || '');
    if (!/^\d{6}$/.test(code)) return json_({ ok: false, error: 'bad_code' });
    var ttl = Number(body.ttlMin) || 10;

    var subject = type === 'verify_email'
      ? 'Your Anonymous Chat verification code'
      : 'Your Anonymous Chat password reset code';
    var html =
      '<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto">' +
      '<h2>Anonymous Chat</h2>' +
      '<p>' + (type === 'verify_email' ? 'Use this code to verify your email:' : 'Use this code to reset your password:') + '</p>' +
      '<p style="font-size:32px;letter-spacing:6px;font-weight:bold">' + code + '</p>' +
      '<p>It expires in ' + ttl + ' minutes. If you did not request it, ignore this email.</p></div>';

    MailApp.sendEmail({ to: body.to, subject: subject, htmlBody: html, name: 'Anonymous Chat' });
    log_(props.getProperty('SHEET_ID'), maskEmail_(body.to), type, 'sent');   // never log the code
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server_error' });
  }
}

function doGet() { return json_({ ok: true, service: 'otp-mailer' }); }

function maskEmail_(email) {
  var p = email.split('@');
  return p[0].charAt(0) + '***@' + p[1];
}
function log_(sheetId, masked, type, status) {
  try {
    var sh = SpreadsheetApp.openById(sheetId).getSheetByName('log');
    sh.appendRow([new Date(), masked, type, status]);
  } catch (e) { /* logging must never break sending */ }
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
