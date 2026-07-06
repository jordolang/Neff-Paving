/**
 * GET /api/indeed-jobs — live job listings for careers.html.
 *
 * Attempts to pull the company's open postings straight from Indeed's
 * public company-jobs page and parse the job data embedded in its HTML.
 * Indeed has no public API and fronts the site with aggressive bot
 * protection, so a live pull can be denied at any time — when that
 * happens (or parsing yields nothing) the endpoint serves the curated
 * fallback from content/jobs.json instead. The response shape is the
 * same either way, and `source` says which path produced it.
 *
 * Dependency-free CommonJS Vercel function (Node 18+ global fetch).
 */

const fallback = require('../content/jobs.json');

const COMPANY_JOBS_URL = 'https://www.indeed.com/cmp/Neff-Paving/jobs';
const FETCH_TIMEOUT_MS = 8000;

// Realistic browser headers give the request its best chance of passing.
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Recursively collect objects that look like job postings (have a jobKey/jk + title). */
function collectJobObjects(node, found) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectJobObjects(item, found));
    return;
  }
  const key = node.jobKey || node.jk;
  const title = node.title || node.displayTitle || node.normTitle;
  if (typeof key === 'string' && /^[0-9a-f]{8,}$/i.test(key) && typeof title === 'string') {
    found.set(key, {
      id: key,
      title,
      location:
        node.formattedLocation || node.location || node.jobLocationCity || '',
      type: Array.isArray(node.jobTypes) ? node.jobTypes.join(', ') : node.jobType || '',
      summary: typeof node.snippet === 'string'
        ? node.snippet.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '',
      indeedUrl: 'https://www.indeed.com/viewjob?jk=' + key,
    });
  }
  Object.values(node).forEach((value) => collectJobObjects(value, found));
}

/** Best-effort extraction of postings from the company-jobs page HTML. */
function parseJobsFromHtml(html) {
  const found = new Map();

  // Preferred: the page embeds its data as JSON (window._initialData = {...};).
  for (const marker of ['window._initialData=', 'window._initialData =']) {
    const start = html.indexOf(marker);
    if (start === -1) continue;
    const jsonStart = html.indexOf('{', start);
    const end = html.indexOf(';</script>', jsonStart);
    if (jsonStart === -1 || end === -1) continue;
    try {
      collectJobObjects(JSON.parse(html.slice(jsonStart, end)), found);
    } catch (e) {
      /* fall through to the regex pass */
    }
  }

  // Fallback: scan raw HTML for jobKey/title pairs.
  if (found.size === 0) {
    const re = /"(?:jobKey|jk)"\s*:\s*"([0-9a-f]{8,})"/gi;
    let match;
    while ((match = re.exec(html)) !== null) {
      const window_ = html.slice(match.index, match.index + 1200);
      const title = /"(?:displayTitle|title|normTitle)"\s*:\s*"([^"]{2,120})"/.exec(window_);
      if (!title) continue;
      const location = /"(?:formattedLocation|location)"\s*:\s*"([^"]{2,80})"/.exec(window_);
      found.set(match[1], {
        id: match[1],
        title: title[1],
        location: location ? location[1] : '',
        type: '',
        summary: '',
        indeedUrl: 'https://www.indeed.com/viewjob?jk=' + match[1],
      });
    }
  }

  return Array.from(found.values());
}

async function fetchLiveJobs() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(COMPANY_JOBS_URL, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    // A challenge page has no job data; parse defensively either way.
    const jobs = parseJobsFromHtml(html);
    return jobs.length > 0 ? jobs : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  const liveJobs = await fetchLiveJobs();

  const payload = liveJobs
    ? { source: 'indeed', indeedCompanyUrl: COMPANY_JOBS_URL, jobs: liveJobs }
    : {
        source: 'fallback',
        indeedCompanyUrl: fallback.indeedCompanyUrl || COMPANY_JOBS_URL,
        jobs: Array.isArray(fallback.jobs) ? fallback.jobs : [],
      };

  // Cache at the edge: live results for an hour, a blocked attempt for
  // 10 minutes so a temporary denial doesn't pin the fallback all day.
  res.setHeader(
    'Cache-Control',
    liveJobs ? 's-maxage=3600, stale-while-revalidate=86400' : 's-maxage=600, stale-while-revalidate=3600'
  );
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json(payload);
};

// exposed for tests
module.exports.parseJobsFromHtml = parseJobsFromHtml;
