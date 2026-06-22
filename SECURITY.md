# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
privately rather than opening a public issue.

- **Preferred:** Use GitHub's [private vulnerability reporting](https://github.com/jordolang/neff-paving/security/advisories/new)
  (Security tab → "Report a vulnerability").
- **Email:** jordolang@gmail.com

Please include:
- A description of the issue and its potential impact
- Steps to reproduce (proof-of-concept if possible)
- Any suggested remediation

We aim to acknowledge reports within **5 business days** and to provide a
remediation timeline after triage.

## Scope

This is a static marketing website (Vite + vanilla JS) deployed to GitHub Pages
and Vercel. In-scope concerns include:

- Exposed secrets or API keys in source or build output
- Cross-site scripting (XSS) via user-facing forms
- Vulnerable third-party dependencies
- Misconfigured security headers or deployment settings

## Handling of Secrets

This repository must never contain live credentials. API keys for maps and
third-party services are kept out of source control (`.env*` is gitignored;
see `.env.example` for the expected shape). Map functionality uses keyless
providers (Leaflet + Esri) specifically to avoid credential exposure.

If you find a committed secret, treat it as compromised: it should be **revoked
and rotated**, not merely deleted from the latest commit.

## Automated Protections

- **Secret scanning** with push protection (blocks known secret patterns)
- **Dependabot** security updates and weekly dependency PRs
- **CodeQL** static analysis on every push and pull request to `main`
