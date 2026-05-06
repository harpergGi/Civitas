const https = require('https');

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { name, email } = JSON.parse(event.body);

    const emailPayload = JSON.stringify({
      from: 'Civitas <notifications@notify.civitasca.com>',
      to: ['harper.gi.76@gmail.com'],
      subject: 'New Account Request — ' + name,
      html: '<div style="background:#0a1628;padding:2rem;font-family:Arial,sans-serif;color:#ffffff;"><h2 style="color:#c9a84c;">New Civitas Account Request</h2><p style="color:#8a9bb5;">Someone just registered and is waiting for your approval.</p><div style="background:#111f3a;border-left:3px solid #c9a84c;padding:1rem;margin:1rem 0;"><p style="margin:0 0 0.5rem;"><strong>Name:</strong> ' + name + '</p><p style="margin:0;"><strong>Email:</strong> ' + email + '</p></div><p style="color:#8a9bb5;">Log in to approve or deny:</p><a href="https://civitasca.com/account.html#approvals" style="background:#c9a84c;color:#0a1628;padding:0.75rem 1.5rem;text-decoration:none;font-weight:bold;display:inline-block;margin-top:0.5rem;">Review Request</a></div>'
    });

    const smsPayload = JSON.stringify({
      from: 'Civitas <notifications@notify.civitasca.com>',
      to: ['9164900063@tmomail.net'],
      subject: 'New Civitas Request',
      text: 'New account request from ' + name + ' (' + email + '). Approve at civitasca.com/account.html'
    });

    const sendEmail = (payload) => new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY
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

    await sendEmail(emailPayload);
    await sendEmail(smsPayload);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
