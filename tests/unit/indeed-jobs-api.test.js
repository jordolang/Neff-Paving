import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const handler = require('../../api/indeed-jobs.js')
const { parseJobsFromHtml } = handler

function mockRes() {
    const res = {
        headers: {},
        statusCode: null,
        body: null,
        setHeader(k, v) { this.headers[k.toLowerCase()] = v },
        status(code) { this.statusCode = code; return this },
        json(payload) { this.body = payload; return this }
    }
    return res
}

describe('/api/indeed-jobs', () => {
    it('parses jobs from embedded _initialData JSON', () => {
        const html = '<html><script>window._initialData={"jobList":{"jobs":[' +
            '{"jobKey":"8e0c4ef94ff570d3","title":"Operations Manager","formattedLocation":"Zanesville, OH","jobTypes":["Full-time"],"snippet":"<b>Lead</b> daily operations."}' +
            ']}};</script></html>'
        const jobs = parseJobsFromHtml(html)
        expect(jobs).toHaveLength(1)
        expect(jobs[0]).toMatchObject({
            id: '8e0c4ef94ff570d3',
            title: 'Operations Manager',
            location: 'Zanesville, OH',
            type: 'Full-time',
            indeedUrl: 'https://www.indeed.com/viewjob?jk=8e0c4ef94ff570d3'
        })
        expect(jobs[0].summary).toBe('Lead daily operations.')
    })

    it('falls back to raw-HTML scanning when no _initialData block parses', () => {
        const html = '{"jk":"abcdef0123456789","displayTitle":"CDL Driver","formattedLocation":"Zanesville, OH"}'
        const jobs = parseJobsFromHtml(html)
        expect(jobs).toHaveLength(1)
        expect(jobs[0].title).toBe('CDL Driver')
    })

    it('dedupes postings that appear multiple times in the page', () => {
        const chunk = '{"jobKey":"1111222233334444","title":"Paver Operator"}'
        const jobs = parseJobsFromHtml(
            `<script>window._initialData={"a":[${chunk}],"b":[${chunk}]};</script>`
        )
        expect(jobs).toHaveLength(1)
    })

    it('returns no jobs for a bot-challenge page', () => {
        expect(parseJobsFromHtml('<html>Additional Verification Required</html>')).toHaveLength(0)
    })

    it('serves the curated fallback when the live pull is unavailable', async () => {
        const res = mockRes()
        await handler({}, res)
        expect(res.statusCode).toBe(200)
        expect(['indeed', 'fallback']).toContain(res.body.source)
        expect(Array.isArray(res.body.jobs)).toBe(true)
        if (res.body.source === 'fallback') {
            // Fallback must mirror content/jobs.json
            expect(res.body.jobs.length).toBeGreaterThan(0)
            expect(res.body.jobs[0].indeedUrl).toContain('indeed.com')
            expect(res.headers['cache-control']).toContain('s-maxage=600')
        }
        expect(res.body.indeedCompanyUrl).toContain('indeed.com/cmp/Neff-Paving')
    })
})
