/**
 * POST /api/send-form — emails a website form submission to the office.
 *
 * Replaces FormSubmit, which bound its activation to the form's origin: the
 * neffpaving.co -> neffpaving.com move silently broke every form on the site
 * for two days, and re-activating it depended on a third party's emailed link.
 * This endpoint owns delivery instead, via Resend's REST API.
 *
 * The form pages stay static — they POST JSON here, and only this function
 * holds the API key. Dependency-free CommonJS (Node 18+ global fetch), matching
 * the other function in this directory.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10000;

/**
 * Sender must be on a domain verified with Resend — not where replies go.
 * Overridable so delivery can start on Resend's shared sender (which only
 * reaches the account owner's own address) before neffpaving.com DNS is
 * verified, without a code change.
 */
const FROM = process.env.FORM_FROM_EMAIL || 'Neff Paving Website <forms@neffpaving.com>';
const TO = process.env.FORM_TO_EMAIL || 'neffpavingzanesville@gmail.com';

// Every form on the site, so an unknown `form` value can't be used to send
// arbitrary mail through this endpoint.
const FORMS = {
  contact: { subject: 'Website contact', label: 'Contact message', required: ['name', 'email'] },
  estimate: { subject: 'New estimate request', label: 'Estimate request', required: ['name', 'phone', 'email'] },
  careers: { subject: 'Employment application', label: 'Job application', required: ['name', 'email'] },
  'delete-my-data': { subject: 'Data deletion request', label: 'Data deletion request', required: ['name', 'email'] },
};

const MAX_FIELD_LEN = 5000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // matches the careers form's own cap

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

/** Human label for a field name: project_type -> Project type */
const labelFor = (key) =>
  key.replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

/**
 * Keep only submitted values worth emailing. Drops control fields, empties, and
 * anything absurdly long, and hard-caps the count so a crafted payload can't
 * inflate the message.
 */
function collectFields(body) {
  return Object.entries(body)
    .filter(([k, v]) =>
      k !== 'form' && k !== 'attachment' && !k.startsWith('_') &&
      (typeof v === 'string' || typeof v === 'number') &&
      String(v).trim() !== ''
    )
    .slice(0, 40)
    .map(([k, v]) => [k, String(v).slice(0, MAX_FIELD_LEN)]);
}

function renderText(label, fields) {
  return [
    label.toUpperCase(),
    '='.repeat(label.length),
    '',
    ...fields.map(([k, v]) => `${labelFor(k)}: ${v}`),
  ].join('\n');
}

function renderHtml(label, fields) {
  const rows = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${escapeHtml(
          labelFor(k)
        )}</td><td style="padding:6px 0">${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;color:#111">
  <h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(label)}</h2>
  <table style="border-collapse:collapse">${rows}</table>
</div>`;
}

/** Resend rejects an unverified or malformed attachment; validate before sending. */
function buildAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') return null;
  const { filename, content } = attachment;
  if (typeof filename !== 'string' || typeof content !== 'string' || !content) return null;
  // base64 inflates by ~4/3; check the decoded size against the form's cap
  if ((content.length * 3) / 4 > MAX_ATTACHMENT_BYTES) return null;
  return { filename: filename.slice(0, 200), content };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Never imply success: the page's email fallback depends on an honest failure.
    console.error('[send-form] RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Email is not configured' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid request body' });
  }

  const form = FORMS[body.form];
  if (!form) {
    return res.status(400).json({ ok: false, error: 'Unknown form' });
  }

  // Honeypot: real people leave it empty. Report success so bots don't retune.
  if (typeof body._gotcha === 'string' && body._gotcha.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const missing = form.required.filter(
    (k) => typeof body[k] !== 'string' || body[k].trim() === ''
  );
  if (missing.length) {
    return res.status(400).json({ ok: false, error: `Missing: ${missing.join(', ')}` });
  }

  const fields = collectFields(body);
  const name = String(body.name || '').slice(0, 120);
  const payload = {
    from: FROM,
    to: TO,
    subject: `${form.subject} — ${name}`,
    text: renderText(form.label, fields),
    html: renderHtml(form.label, fields),
  };

  // Replying to the notification should reach the customer, not the site.
  if (typeof body.email === 'string' && body.email.includes('@')) {
    payload.reply_to = body.email.slice(0, 200);
  }

  const attachment = buildAttachment(body.attachment);
  if (attachment) payload.attachments = [attachment];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const resend = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!resend.ok) {
      const detail = await resend.text().catch(() => '');
      console.error('[send-form] Resend rejected the send:', resend.status, detail.slice(0, 500));
      return res.status(502).json({ ok: false, error: 'Could not send the message' });
    }

    const { id } = await resend.json().catch(() => ({}));
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('[send-form] send failed:', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not send the message' });
  } finally {
    clearTimeout(timer);
  }
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// exported for unit tests
module.exports.FORMS = FORMS;
module.exports.renderText = renderText;
module.exports.collectFields = collectFields;
