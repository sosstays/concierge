// Netlify Function: adds a guest to MailerLite when they opt in to marketing.
// Runs server-side so the MailerLite API key never reaches the browser.
//
// Required environment variable (set in Netlify site settings):
//   MAILERLITE_API_KEY   — MailerLite API token
// Optional:
//   MAILERLITE_GROUP_ID  — MailerLite group/list ID to add the subscriber to
//
// Note: the "booking_id" custom field must exist in your MailerLite account
// (Subscribers → Custom fields) before it'll actually be stored on the record.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, email, marketingConsent, bookingId } = data;

  // Respect consent — only subscribe guests who ticked the marketing checkbox.
  if (!marketingConsent) {
    return { statusCode: 200, body: JSON.stringify({ skipped: true }) };
  }

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error('MAILERLITE_API_KEY is not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  const payload = {
    email,
    fields: { name: name || '', booking_id: bookingId || '' },
  };
  if (process.env.MAILERLITE_GROUP_ID) {
    payload.groups = [process.env.MAILERLITE_GROUP_ID];
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('MailerLite request failed', response.status, result);
      return { statusCode: 502, body: JSON.stringify({ error: 'MailerLite request failed' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Unexpected error calling MailerLite', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error' }) };
  }
};
