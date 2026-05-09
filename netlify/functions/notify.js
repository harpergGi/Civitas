const https = require('https');

const BRIAN_EMAIL = 'harper.gi.76@gmail.com';
const BRIAN_SMS = '9164900063@tmomail.net';
const FROM = 'Civitas <notifications@notify.civitasca.com>';
const RESEND_KEY = process.env.RESEND_API_KEY;

async function sendEmail(to, subject, html, text) {
  // This is the fix! We only add HTML or Text if they actually exist, avoiding the "null" crash.
  const emailData = { from: FROM, to: [to], subject };
  if (html) emailData.html = html;
  if (text) emailData.text = text;
  
  const payload = JSON.stringify(emailData);
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer ' + RESEND_KEY
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(raw));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { type, name, email } = JSON.parse(event.body);

    if (type === 'reset') {
      // Password reset notification to Brian's Email
      await sendEmail(
        BRIAN_EMAIL,
        'Password Reset Request — ' + (name || email),
        '<div style="background:#0a1628;padding:2rem;font-family:Arial,sans-serif;color:#fff;"><h2 style="color:#c9a84c;">Password Reset Requested</h2><p style="color:#8a9bb5;">A user has requested a password reset.</p><div style="background:#111f3a;border-left:3px solid #c9a84c;padding:1rem;margin:1rem 0;"><p style="margin:0;"><strong>Email:</strong> ' + email + '</p></div><p style="color:#8a9bb5;">No action required from you unless this looks suspicious.</p></div>',
        null
      );
      
      // Password reset notification to Brian's T-Mobile Text
      await sendEmail(
        BRIAN_SMS,
        'Civitas Reset',
        null,
        'Password reset requested for ' + email + ' on Civitas.'
      );
    } else {
      // New registration notification to Brian's Email
      await sendEmail(
        BRIAN_EMAIL,
        'New Account Request — ' + name,
        '<div style="background:#0a1628;padding:2rem;font-family:Arial,sans-serif;color:#fff;"><h2 style="color:#c9a84c;">New Civitas Account Request</h2><p style="color:#8a9bb5;">Someone just registered and is waiting for your approval.</p><div style="background:#111f3a;border-left:3px solid #c9a84c;padding:1rem;margin:1rem 0;"><p style="margin:0 0 0.5rem;"><strong>Name:</strong> ' + name + '</p><p style="margin:0;"><strong>Email:</strong> ' + email + '</p></div><a href="https://civitasca.com/account.html#approvals" style="background:#c9a84c;color:#0a1628;padding:0.75rem 1.5rem;text-decoration:none;font-weight:bold;display:inline-block;margin-top:0.5rem;">Review Request</a></div>',
        null
      );
      
      // New registration notification to Brian's T-Mobile Text
      await sendEmail(
        BRIAN_SMS,
        'New Civitas Reg',
        null,
        'New account request from ' + name + ' (' + email + '). Approve at civitasca.com'
      );
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
