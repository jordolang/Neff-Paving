# CMS Setup Guide - Decap CMS with GitHub OAuth

This document explains how to set up authentication for the Decap CMS (formerly Netlify CMS) admin interface at `/admin/` so that authorized users can edit website content.

---

## Overview

Decap CMS is a git-based content management system that stores all content directly in this GitHub repository. When someone edits content through the CMS interface:

1. They authenticate via GitHub OAuth
2. Changes are saved as JSON files in the `content/` folder
3. Each save creates a git commit (with editorial workflow, changes go through pull requests)
4. The build process reads these JSON files to generate the website

**No database required** — everything is version-controlled in git.

---

## Authentication Options

Decap CMS needs a GitHub OAuth app to authenticate users. There are two approaches:

1. **Netlify OAuth Proxy** (recommended for quick setup) — uses Netlify's free authentication service
2. **Self-hosted OAuth** — runs your own authentication server (for advanced users)

This guide covers **Option 1: Netlify OAuth Proxy**, which is already configured in `public/admin/config.yml`.

---

## One-Time Setup (≈10 minutes)

### Prerequisites

- Admin access to the `jordolang/neff-paving` GitHub repository
- A Netlify account (free tier works fine)

### Step 1: Deploy to Netlify

The CMS admin interface needs to be hosted somewhere to use Netlify's OAuth proxy. If you're already deploying to Netlify (recommended), you can use that deployment. Otherwise:

1. Go to [app.netlify.com](https://app.netlify.com/) and sign in
2. Click **Add new site → Import an existing project**
3. Connect to GitHub and select the `jordolang/neff-paving` repository
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**

> **Note:** You can use Netlify purely for CMS authentication even if you deploy the main site to GitHub Pages or elsewhere. The CMS admin UI just needs to be accessible at some Netlify URL.

### Step 2: Create a GitHub OAuth App

1. Go to GitHub → **Settings → Developer settings → OAuth Apps** → [New OAuth App](https://github.com/settings/applications/new)

2. Fill in the application details:
   ```
   Application name: Neff Paving CMS
   Homepage URL: https://your-site.netlify.app
   Authorization callback URL: https://api.netlify.com/auth/done
   ```
   
   **Important:** The callback URL must be exactly `https://api.netlify.com/auth/done` for Netlify's OAuth proxy to work.

3. Click **Register application**

4. On the next page:
   - Copy the **Client ID** (you'll need this in step 3)
   - Click **Generate a new client secret**
   - Copy the **Client Secret** immediately (it won't be shown again)

### Step 3: Configure Netlify OAuth

1. In your Netlify site dashboard, go to **Site settings → Access control → OAuth**

2. Click **Install provider** under "Authentication providers"

3. Select **GitHub** and enter:
   - **Client ID:** (from step 2)
   - **Client Secret:** (from step 2)

4. Click **Install**

### Step 4: Update Site URL (if needed)

If your production site is **not** hosted on Netlify (e.g., you're using GitHub Pages as the main site), you need to allow CORS access:

1. In Netlify: **Site settings → Build & deploy → Environment**
2. Add an environment variable:
   ```
   NETLIFY_CORS_ALLOWED_ORIGINS=https://your-production-site.com
   ```

This allows the CMS admin interface on your production site to authenticate through Netlify's OAuth proxy.

### Step 5: Verify Configuration

Check that `public/admin/config.yml` has the correct settings:

```yaml
backend:
  name: github
  repo: jordolang/neff-paving
  branch: main
  base_url: https://api.netlify.com
  auth_endpoint: auth
```

- `repo`: Must match your GitHub repository
- `branch`: Must match your default branch (usually `main`)
- `base_url` and `auth_endpoint`: These point to Netlify's OAuth proxy

---

## Testing the CMS

### Local Development

When running locally (`npm run dev`), you can use **test mode** to explore the CMS without authentication:

1. Update `public/admin/config.yml` temporarily:
   ```yaml
   # Comment out the production backend
   # backend:
   #   name: github
   #   ...
   
   # Add this for local testing
   local_backend: true
   ```

2. Run the local backend server:
   ```bash
   npx netlify-cms-proxy-server
   ```

3. In another terminal, start the dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000/admin/` — you'll have full access without authentication

**Important:** Revert these changes before deploying to production.

### Production Testing

1. Deploy your site with the admin interface included (it's in `public/admin/`)

2. Visit `https://your-site.com/admin/`

3. Click **Login with GitHub**

4. Authorize the OAuth app

5. You should see the CMS dashboard with collections:
   - Homepage
   - Services  
   - Gallery

6. Try editing content:
   - Click on **Homepage → Homepage Content**
   - Edit a field (e.g., change the hero title)
   - Click **Save**
   - With `publish_mode: editorial_workflow`, this creates a draft
   - Click **Publish** to create a pull request or commit directly (depending on permissions)

---

## User Access Control

### Who Can Access the CMS?

By default, **anyone who can authenticate with GitHub** can access the CMS interface. To restrict access:

1. **Private repository:** Making the repo private limits access to collaborators only
2. **GitHub Teams:** Use Netlify Identity (paid) or branch protection rules
3. **Branch Protection:** Require pull request reviews for the `main` branch so editors can create drafts but need approval to publish

### Recommended Setup for Small Teams

1. Keep the repository **private** (only collaborators can access)
2. Add trusted users as **repository collaborators** with **write** access:
   - Repo Settings → Collaborators → Add people
3. Enable **branch protection** on `main`:
   - Settings → Branches → Add rule for `main`
   - Check: "Require a pull request before merging"
   - Check: "Require approvals" (set to 1)
   
This way, editors can create content drafts, but changes require approval before going live.

---

## Editorial Workflow

The current configuration uses `publish_mode: editorial_workflow`, which provides a three-stage content lifecycle:

1. **Drafts** - Work in progress, not yet ready for review
2. **In Review** - Ready for review, creates a pull request
3. **Ready** - Approved and published to the main branch

To change this to direct publishing (skip the review process):

```yaml
# In public/admin/config.yml
publish_mode: simple
```

With `simple` mode, clicking **Publish** commits directly to the `main` branch.

---

## Day-to-Day Usage (for Content Editors)

> **Accessing the CMS:**  
> 1. Go to `https://your-site.com/admin/`  
> 2. Click **Login with GitHub**  
> 3. Edit content in the dashboard  
> 4. Click **Save** (creates draft) → **Publish** (creates commit/PR)  
> 
> Changes appear on the website within minutes after publishing (automatic rebuild).

### Editing Homepage Content

1. Click **Homepage → Homepage Content**
2. Edit any section:
   - **Hero Section:** Main banner text and call-to-action buttons
   - **Stats Band:** Company statistics (years in business, projects completed)
   - **Introduction:** About section with key selling points
3. Click **Save** when done
4. Review in the preview pane (right side)
5. Click **Publish** to go live

### Managing Services

1. Click **Services → Services Content**
2. Expand **Asphalt Services** or **Concrete Services**
3. Edit existing services or add new ones:
   - Service name and description
   - Features/benefits list
   - Optional icon and image
4. Save and publish

### Managing Gallery Images

1. Click **Gallery** (this is a folder collection, so you'll see a list)
2. Click **New Gallery** to add an image:
   - Upload the image file
   - Add title and alt text (for accessibility)
   - Choose a category (Commercial, Residential, Equipment, Concrete)
3. Or click an existing entry to edit/delete it
4. Save and publish

**Note:** Gallery images are stored in `public/images/cms/` and referenced in JSON files in `content/gallery/`.

---

## Troubleshooting

### "Error: Failed to load config.yml"

- **Cause:** The admin interface can't find or parse the config file
- **Fix:** Check that `public/admin/config.yml` exists and has valid YAML syntax (no tabs, proper indentation)

### "Error: Not Found" when accessing /admin/

- **Cause:** The admin interface files aren't in the build output
- **Fix:** Ensure `public/admin/index.html` and `public/admin/config.yml` exist and are copied to `dist/admin/` during build

### Authentication fails / "OAuth Error"

- **Cause:** GitHub OAuth app misconfiguration
- **Fix:** 
  1. Verify the callback URL is exactly `https://api.netlify.com/auth/done`
  2. Check that Client ID and Secret are correctly entered in Netlify
  3. Confirm the repository name in `config.yml` matches GitHub

### Changes don't appear on the site after publishing

- **Cause:** The build process isn't reading the JSON content files
- **Fix:**
  1. Check that `content/*.json` files were updated (look at git history)
  2. Verify the build ran successfully (check GitHub Actions or Netlify logs)
  3. Ensure `src/utils/content-loader.js` is importing content correctly

### "Cannot read properties of undefined" in console

- **Cause:** Content structure doesn't match what the code expects
- **Fix:** 
  1. Compare JSON structure in `content/*.json` with the CMS config field definitions
  2. Ensure required fields are populated
  3. Check browser console for specific property names

### Media uploads failing

- **Cause:** GitHub API rate limits or repository permissions
- **Fix:**
  1. Verify the authenticated user has **write** access to the repo
  2. Check GitHub OAuth app permissions include `repo` scope
  3. Try smaller image files (< 5MB recommended)

---

## Advanced: Self-Hosted OAuth (Alternative)

If you don't want to use Netlify's OAuth proxy, you can run your own authentication server:

### Option A: netlify-cms-github-oauth-provider

A lightweight Node.js server that handles GitHub OAuth:

1. Deploy [netlify-cms-github-oauth-provider](https://github.com/vencax/netlify-cms-github-oauth-provider) to Heroku, Railway, or similar
2. Update `config.yml`:
   ```yaml
   backend:
     name: github
     repo: jordolang/neff-paving
     branch: main
     base_url: https://your-auth-server.herokuapp.com
   ```
3. Set environment variables on the server:
   - `OAUTH_CLIENT_ID`: GitHub OAuth app client ID
   - `OAUTH_CLIENT_SECRET`: GitHub OAuth app client secret
   - `REDIRECT_URL`: `https://your-site.com/admin/`

### Option B: Netlify Functions (serverless)

Use Netlify Functions to handle OAuth without a separate server:

1. Create `netlify/functions/auth.js` (see Decap CMS docs for code)
2. Update `config.yml`:
   ```yaml
   backend:
     name: github
     repo: jordolang/neff-paving
     branch: main
     base_url: /.netlify/functions
     auth_endpoint: auth
   ```

Both options require more setup but give you full control over authentication.

---

## Security Best Practices

1. **Never commit secrets:** Keep OAuth client secrets in Netlify environment variables, not in code
2. **Use HTTPS only:** The admin interface should always be served over HTTPS (GitHub blocks OAuth over HTTP)
3. **Rotate secrets regularly:** Regenerate OAuth client secrets annually
4. **Monitor access logs:** Check GitHub's OAuth app access logs for suspicious activity
5. **Limit permissions:** Only give CMS users the minimum GitHub repository access they need (Write, not Admin)
6. **Enable 2FA:** Require two-factor authentication for all users who can access the CMS

---

## Reference Links

- [Decap CMS Documentation](https://decapcms.org/docs/)
- [GitHub OAuth Apps Guide](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app)
- [Netlify OAuth Provider Setup](https://docs.netlify.com/visitor-access/oauth-provider-tokens/)
- [Editorial Workflow Guide](https://decapcms.org/docs/configuration-options/#publish-mode)

---

## Support

For issues with:
- **CMS configuration:** Check `public/admin/config.yml` against the Decap CMS docs
- **GitHub authentication:** Verify OAuth app settings and Netlify provider configuration
- **Content not appearing:** Review build logs and `src/utils/content-loader.js`
- **Access control:** Check GitHub repository collaborator settings

For general questions, refer to the [Decap CMS community discussions](https://github.com/decaporg/decap-cms/discussions).
