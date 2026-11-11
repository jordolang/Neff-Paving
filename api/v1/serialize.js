'use strict';

/**
 * Row → contract JSON. Every function takes a DB row (snake_case, sometimes with joined
 * columns) and returns the camelCase shape documented in mobile/API_CONTRACT.md.
 */

const money = (v) => (v === null || v === undefined ? null : Number(v).toFixed(2));
const iso = (v) => (v ? new Date(v).toISOString() : null);
const day = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const num = (v) => (v === null || v === undefined ? null : Number(v));
const fullName = (first, last) => [first, last].filter(Boolean).join(' ').trim();
const ref = (id, name, extra = {}) => (id ? { id, name: name || '', ...extra } : null);

function address(a) {
  const x = a || {};
  return {
    line1: x.line1 || '', line2: x.line2 || '', city: x.city || '',
    state: x.state || '', zip: x.zip || '',
  };
}

/** Make a stored relative upload path absolute for the requesting client. */
function absUrl(base, u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

function company(c) {
  return {
    key: c.key, name: c.name, phone: c.phone || '', email: c.email || '',
    website: c.website || '', address: address(c.address), primaryColor: c.primary_color,
  };
}

function user(u, ctx) {
  return {
    id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
    phone: u.phone || '', avatarUrl: absUrl(ctx.base, u.avatar_url),
    address: address(u.address),
    role: ctx.role, isInternal: ctx.isInternal, permissions: ctx.permissions,
    company: { key: ctx.company.key, name: ctx.company.name, primaryColor: ctx.company.primary_color },
    notificationPrefs: { push: true, email: true, sms: false, ...(u.notification_prefs || {}) },
    publicProfile: u.public_profile, createdAt: iso(u.created_at),
  };
}

function media(m, base) {
  return {
    id: m.id, jobId: m.job_id, kind: m.kind, url: absUrl(base, m.url),
    thumbnailUrl: absUrl(base, m.thumbnail_url || (m.kind === 'photo' ? m.url : null)),
    caption: m.caption, isPublic: m.is_public,
    uploadedBy: ref(m.uploaded_by, m.uploader_name),
    latitude: num(m.latitude), longitude: num(m.longitude), createdAt: iso(m.created_at),
  };
}

function job(j, base) {
  return {
    id: j.id, title: j.title, description: j.description, status: j.status,
    serviceAddress: address(j.service_address),
    latitude: num(j.latitude), longitude: num(j.longitude),
    customer: j.customer_id
      ? { id: j.customer_id, name: j.customer_name || '', phone: j.customer_phone || '', email: j.customer_email || '' }
      : null,
    crew: ref(j.crew_id, j.crew_name),
    scheduledStart: iso(j.scheduled_start), scheduledEnd: iso(j.scheduled_end),
    completedAt: iso(j.completed_at), estimateTotal: money(j.estimate_total),
    progress: j.progress, sharedPublicly: j.shared_publicly,
    coverPhotoUrl: absUrl(base, j.cover_photo_url), createdAt: iso(j.created_at),
  };
}

function statusUpdate(s, base, mediaRows = []) {
  return {
    id: s.id, jobId: s.job_id, status: s.status, message: s.message,
    author: s.author_id ? { id: s.author_id, name: s.author_name || '', role: s.author_role || '' } : null,
    media: mediaRows.map((m) => media(m, base)),
    visibleToCustomer: s.visible_to_customer, createdAt: iso(s.created_at),
  };
}

function jobLog(l) {
  return {
    id: l.id, jobId: l.job_id, date: day(l.log_date), notes: l.notes,
    hours: l.hours === null ? null : Number(l.hours).toFixed(1),
    materials: l.materials, weather: l.weather,
    author: ref(l.author_id, l.author_name), createdAt: iso(l.created_at),
  };
}

const lineItems = (items) => (items || []).map((li) => ({
  description: li.description || '', quantity: String(li.quantity ?? '1'),
  unitPrice: money(li.unitPrice ?? 0), total: money(li.total ?? (Number(li.quantity ?? 1) * Number(li.unitPrice ?? 0))),
}));

function estimate(e, base, mediaRows = []) {
  return {
    id: e.id, customerId: e.customer_id, jobId: e.job_id, status: e.status,
    serviceType: e.service_type, description: e.description,
    serviceAddress: address(e.service_address),
    squareFeet: e.square_feet === null ? null : String(Number(e.square_feet)),
    preferredDate: day(e.preferred_date),
    lineItems: lineItems(e.line_items), total: money(e.total), validUntil: day(e.valid_until),
    notes: e.notes, customerName: e.customer_name || '',
    estimator: ref(e.estimator_id, e.estimator_name),
    media: mediaRows.map((m) => media(m, base)), createdAt: iso(e.created_at),
  };
}

function invoice(i) {
  return {
    id: i.id, number: i.number, customerId: i.customer_id, customerName: i.customer_name || '',
    jobId: i.job_id, status: i.status, issuedAt: iso(i.issued_at), dueAt: iso(i.due_at),
    lineItems: lineItems(i.line_items), subtotal: money(i.subtotal), tax: money(i.tax),
    total: money(i.total), balance: money(Number(i.total) - Number(i.paid || 0)),
  };
}

function payment(p) {
  return {
    id: p.id, invoiceId: p.invoice_id, invoiceNumber: p.invoice_number || null,
    amount: money(p.amount), method: p.method, status: p.status, createdAt: iso(p.created_at),
  };
}

function timeEntry(t) {
  const end = t.clock_out ? new Date(t.clock_out) : null;
  const hours = end ? ((end - new Date(t.clock_in)) / 36e5).toFixed(2) : null;
  return {
    id: t.id, userId: t.user_id, userName: t.user_name || undefined, jobId: t.job_id,
    jobTitle: t.job_title || null,
    clockIn: iso(t.clock_in), clockOut: iso(t.clock_out), hours, status: t.status,
    clockInLat: num(t.clock_in_lat), clockInLng: num(t.clock_in_lng), notes: t.notes,
  };
}

function timeOff(t) {
  return {
    id: t.id, userId: t.user_id, userName: t.user_name || '',
    startDate: day(t.start_date), endDate: day(t.end_date), type: t.type, reason: t.reason,
    status: t.status, reviewedBy: ref(t.reviewed_by, t.reviewer_name), createdAt: iso(t.created_at),
  };
}

function paystub(p) {
  return {
    id: p.id, userId: p.user_id, userName: p.user_name || undefined,
    periodStart: day(p.period_start), periodEnd: day(p.period_end), payDate: day(p.pay_date),
    hours: money(p.hours), gross: money(p.gross), deductions: money(p.deductions), net: money(p.net),
    pdfUrl: p.pdf_url,
  };
}

function taxPrefs(t) {
  const x = t || {};
  return {
    filingStatus: x.filing_status || 'single', allowances: x.allowances || 0,
    extraWithholding: money(x.extra_withholding || 0), payMethod: x.pay_method || 'check',
    bankName: x.bank_name || '', accountLast4: x.account_last4 || '', routingLast4: x.routing_last4 || '',
  };
}

function crew(c, members = []) {
  return {
    id: c.id, name: c.name, color: c.color, lead: ref(c.lead_id, c.lead_name),
    members: members.map((m) => ({ id: m.id, name: fullName(m.first_name, m.last_name), role: m.role, phone: m.phone || '' })),
  };
}

function schedule(s) {
  return {
    id: s.id, userId: s.user_id, userName: s.user_name || undefined, crewId: s.crew_id,
    jobId: s.job_id, jobTitle: s.job_title || '',
    start: iso(s.starts_at), end: iso(s.ends_at), notes: s.notes, address: address(s.service_address),
  };
}

function raise(r) {
  return {
    id: r.id, userId: r.user_id, userName: r.user_name || '', kind: r.kind,
    currentRate: money(r.current_rate), requestedRate: money(r.requested_rate),
    requestedPosition: r.requested_position, justification: r.justification,
    status: r.status, reviewNote: r.review_note, createdAt: iso(r.created_at),
  };
}

function review(r) {
  const initial = r.customer_last ? `${r.customer_last[0]}.` : '';
  return {
    id: r.id, jobId: r.job_id,
    customer: r.customer_id ? { id: r.customer_id, name: `${r.customer_first || ''} ${initial}`.trim() } : null,
    rating: r.rating, comment: r.comment, isPublished: r.is_published, response: r.response,
    createdAt: iso(r.created_at),
  };
}

function message(m) {
  return {
    id: m.id, threadId: m.thread_id,
    sender: m.sender_id ? { id: m.sender_id, name: m.sender_name || '', role: m.sender_role || '' } : null,
    body: m.body, createdAt: iso(m.created_at),
  };
}

function notification(n) {
  return {
    id: n.id, type: n.type, title: n.title, body: n.body, data: n.data || {},
    readAt: iso(n.read_at), createdAt: iso(n.created_at),
  };
}

module.exports = {
  money, iso, day, fullName, address, absUrl, company, user, media, job, statusUpdate, jobLog,
  estimate, invoice, payment, timeEntry, timeOff, paystub, taxPrefs, crew, schedule, raise,
  review, message, notification, lineItems,
};
