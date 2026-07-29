/**
 * The site's four forms post to a third-party backend that can reject a
 * submission at any time — it silently did exactly that for two days after the
 * domain moved. When that happens the visitor must still be handed a way to
 * reach us, carrying everything they typed, rather than a dead end.
 *
 * These tests drive each real page's markup and inline handler under a stubbed
 * fetch that returns FormSubmit's actual rejection payload.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const REJECTION = { success: 'false', message: 'This form needs Activation.' }

/** Load a page's markup + its classic inline scripts into the current DOM. */
function loadPage (file) {
  const src = readFileSync(join(ROOT, file), 'utf8')
  const body = src.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1]
  document.body.innerHTML = body

  const scripts = [...src.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(m => !/src=|type=["'](application\/ld\+json|module)["']/.test(m[1]))
    .map(m => m[2])

  for (const code of scripts) {
    // Pages guard on elements that only exist once markup is in place; any
    // unrelated init failure (maps, analytics) must not mask the assertion.
    try { new Function(code)() } catch { /* not under test */ }
  }
  document.dispatchEvent(new Event('DOMContentLoaded'))
}

function fill (values) {
  for (const [name, value] of Object.entries(values)) {
    const field = document.querySelector(`[name="${name}"]`)
    if (field) field.value = value
  }
}

async function submitAndFlush (formId) {
  document.getElementById(formId).dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true })
  )
  // let the handler's awaited fetch + json() settle
  await new Promise(r => setTimeout(r, 0))
  await new Promise(r => setTimeout(r, 0))
}

describe('form fallback when the send is rejected', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => REJECTION
    }))
    vi.stubGlobal('alert', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  const cases = [
    {
      page: 'index.html',
      formId: 'contact-form',
      statusId: 'contact-form-status',
      input: { name: 'Dana Reyes', phone: '740-555-0100', email: 'dana@example.com', message: 'Need a quote for my lot.' },
      expectInBody: ['Dana Reyes', 'Need a quote for my lot.']
    },
    {
      page: 'estimate-form.html',
      formId: 'estimate-form',
      statusId: 'form-status',
      input: { name: 'Pat Olsen', phone: '740-555-0111', email: 'pat@example.com', address: '12 Main St', notes: 'Cracked driveway' },
      expectInBody: ['Pat Olsen', 'Cracked driveway']
    },
    {
      page: 'delete-my-data.html',
      formId: 'delete-form',
      statusId: 'form-status',
      input: { name: 'Sam Diaz', email: 'sam@example.com' },
      // the page blocks submission until the requester affirms identity
      check: ['confirm'],
      expectInBody: ['Sam Diaz']
    }
  ]

  for (const c of cases) {
    it(`${c.page} offers a pre-filled email carrying the submission`, async () => {
      loadPage(c.page)
      fill(c.input)
      for (const id of c.check || []) document.getElementById(id).checked = true
      await submitAndFlush(c.formId)

      const status = document.getElementById(c.statusId)
      expect(status, 'status element should exist').toBeTruthy()

      const link = status.querySelector('a[href^="mailto:"]')
      expect(link, 'a mailto: fallback link should be offered').toBeTruthy()

      const href = decodeURIComponent(link.getAttribute('href'))
      expect(href).toContain('neffpavingzanesville@gmail.com')
      for (const fragment of c.expectInBody) {
        expect(href, `mailto: should carry "${fragment}"`).toContain(fragment)
      }
      // the visitor must not be left thinking it succeeded
      expect(status.className).toContain('err')
    })
  }

  it('does not leak FormSubmit control fields into the email body', async () => {
    loadPage('estimate-form.html')
    fill({ name: 'Pat Olsen', phone: '740-555-0111', email: 'pat@example.com' })
    await submitAndFlush('estimate-form')

    const href = decodeURIComponent(
      document.getElementById('form-status').querySelector('a[href^="mailto:"]').getAttribute('href')
    )
    expect(href).not.toContain('_template')
    expect(href).not.toContain('_captcha')
  })

  it('still succeeds normally when the backend accepts the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: 'true' })
    }))
    loadPage('estimate-form.html')
    fill({ name: 'Pat Olsen', phone: '740-555-0111', email: 'pat@example.com' })
    await submitAndFlush('estimate-form')

    const status = document.getElementById('form-status')
    expect(status.className).toContain('ok')
    expect(status.querySelector('a[href^="mailto:"]')).toBeNull()
  })
})
