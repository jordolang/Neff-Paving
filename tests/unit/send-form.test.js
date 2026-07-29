/**
 * /api/send-form is the site's only path from a form to the office inbox, so
 * its failure modes matter as much as its happy path: it must never report
 * success it didn't achieve (the pages' email fallback keys off an honest
 * failure), and it must not become an open relay.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const handler = require('../../api/send-form.js')

function mockRes () {
  const res = { statusCode: null, body: null, headers: {} }
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (payload) => { res.body = payload; return res }
  res.setHeader = (k, v) => { res.headers[k] = v }
  return res
}

const post = (body) => ({ method: 'POST', body })

/** Last JSON payload handed to Resend. */
const sentPayload = () => JSON.parse(global.fetch.mock.calls[0][1].body)

describe('/api/send-form', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_123' }),
      text: async () => ''
    }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete process.env.RESEND_API_KEY
  })

  it('rejects anything but POST', async () => {
    const res = mockRes()
    await handler({ method: 'GET' }, res)
    expect(res.statusCode).toBe(405)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refuses an unknown form rather than relaying arbitrary mail', async () => {
    const res = mockRes()
    await handler(post({ form: 'anything', name: 'X', email: 'x@example.com' }), res)
    expect(res.statusCode).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects a submission missing required fields', async () => {
    const res = mockRes()
    await handler(post({ form: 'estimate', name: 'Pat' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/phone/)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fails loudly when the API key is missing, never claiming success', async () => {
    delete process.env.RESEND_API_KEY
    const res = mockRes()
    await handler(post({ form: 'contact', name: 'Pat', email: 'p@example.com' }), res)
    expect(res.statusCode).toBe(500)
    expect(res.body.ok).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('reports failure when Resend rejects the send', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 422, text: async () => 'domain not verified' })
    const res = mockRes()
    await handler(post({ form: 'contact', name: 'Pat', email: 'p@example.com' }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.ok).toBe(false)
  })

  it('reports failure when the request throws', async () => {
    global.fetch.mockRejectedValue(new Error('network down'))
    const res = mockRes()
    await handler(post({ form: 'contact', name: 'Pat', email: 'p@example.com' }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.ok).toBe(false)
  })

  it('sends a valid estimate to the office with the customer as reply-to', async () => {
    const res = mockRes()
    await handler(post({
      form: 'estimate',
      name: 'Pat Olsen',
      phone: '740-555-0111',
      email: 'pat@example.com',
      project_type: 'Driveway',
      area_sqft: '1200',
      _template: 'table'
    }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)

    const [url, init] = global.fetch.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers.Authorization).toBe('Bearer re_test_key')

    const payload = sentPayload()
    expect(payload.to).toBe('neffpavingzanesville@gmail.com')
    expect(payload.subject).toContain('Pat Olsen')
    expect(payload.reply_to).toBe('pat@example.com')
    expect(payload.text).toContain('740-555-0111')
    expect(payload.text).toContain('Driveway')
    expect(payload.text).toContain('1200')
    // control fields must not reach the office email
    expect(payload.text).not.toContain('_template')
  })

  it('silently absorbs a honeypot hit without emailing', async () => {
    const res = mockRes()
    await handler(post({
      form: 'contact', name: 'Bot', email: 'bot@example.com', _gotcha: 'filled'
    }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('escapes submitted markup in the HTML body', async () => {
    const res = mockRes()
    await handler(post({
      form: 'contact',
      name: 'Pat',
      email: 'p@example.com',
      message: '<script>alert(1)</script>'
    }), res)
    const payload = sentPayload()
    expect(payload.html).not.toContain('<script>')
    expect(payload.html).toContain('&lt;script&gt;')
  })

  it('carries a resume attachment through', async () => {
    const res = mockRes()
    await handler(post({
      form: 'careers',
      name: 'Sam',
      email: 's@example.com',
      attachment: { filename: 'resume.pdf', content: 'JVBERi0xLjQK' }
    }), res)
    const payload = sentPayload()
    expect(payload.attachments).toHaveLength(1)
    expect(payload.attachments[0].filename).toBe('resume.pdf')
  })

  it('drops an oversized attachment instead of failing the whole send', async () => {
    const res = mockRes()
    await handler(post({
      form: 'careers',
      name: 'Sam',
      email: 's@example.com',
      attachment: { filename: 'huge.pdf', content: 'A'.repeat(20 * 1024 * 1024) }
    }), res)
    expect(res.statusCode).toBe(200)
    expect(sentPayload().attachments).toBeUndefined()
  })
})
