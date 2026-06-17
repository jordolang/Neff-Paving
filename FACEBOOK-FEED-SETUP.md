# Facebook Album → Website Gallery Feed

The owner posts photos to the **"Website Feed"** album on the Neff Paving & Concrete
Facebook Page from his phone. Once a day, a GitHub Action pulls any new photos,
optimizes them, and publishes them to the gallery on neffpaving.co — they appear on
the site within ~24 hours with **no further action required** from him.

This is a **two-way sync**: a photo deleted from the album is also removed from the site.

---

## How it works

```
Owner posts to FB "Website Feed" album
            │
            ▼
GitHub Action (daily, 09:00 UTC)  ──►  scripts/fetch-facebook-album.js
            │                              • fetch album photos via Graph API
            │                              • download + convert new ones to WebP
            │                              • write assets/gallery/facebook/
            │                              • regenerate src/data/facebook-images.js
            ▼
Auto-commit straight to main (admin PAT bypasses branch protection)
            │
            ▼
Push → Vercel auto-deploys + GitHub Pages re-deploys
            │
            ▼
Gallery shows a "Latest" filter populated from the album
```

> **Fully automatic — no PR, no merge.** `main` is protected, so the job pushes
> using an admin Personal Access Token (`GALLERY_SYNC_TOKEN`) that's allowed to
> bypass the protection. New photos publish on their own within ~24h.

| Piece | File |
|---|---|
| Sync script | `scripts/fetch-facebook-album.js` |
| Daily job | `.github/workflows/facebook-gallery-sync.yml` |
| Generated manifest | `src/data/facebook-images.js` (do not edit by hand) |
| Photos | `assets/gallery/facebook/` |
| Gallery integration | `src/components/gallery-filter.js` + "Latest" button in `index.html` |

---

## One-time setup (≈15 minutes)

You need a **long-lived Facebook Page access token** with permission to read the
Page's photos, stored as a GitHub Actions secret. Do this once.

### 1. Create a Meta (Facebook) app
1. Go to <https://developers.facebook.com/apps/> → **Create App**.
2. Use case: **Other** → type **Business** → name it e.g. "Neff Paving Website Feed".
3. Select the Business Portfolio that owns the Neff Paving & Concrete Page.

### 2. Get a Page access token
1. Open the **Graph API Explorer**: <https://developers.facebook.com/tools/explorer/>.
2. Top-right: select your new app.
3. **User or Page** dropdown → **Get Page Access Token** → pick the Neff Paving Page.
4. Add these permissions (Add a Permission): `pages_read_engagement`, `pages_show_list`.
5. Click **Generate Access Token** and approve. Copy the token (this short-lived one lasts ~1 hour).

### 3. Make the token long-lived (non-expiring)
Short-lived page tokens expire in an hour. Exchange it for a long-lived one, which —
for a Page token derived from a long-lived user token — **does not expire** unless the
password changes or access is revoked.

1. In the Graph API Explorer, get a **long-lived user token**, or use the
   **Access Token Debugger** (<https://developers.facebook.com/tools/debug/accesstoken/>):
   paste your token → **Extend Access Token**.
2. Then query (replace `USER_TOKEN`):
   ```
   GET https://graph.facebook.com/v21.0/me/accounts?access_token=USER_TOKEN
   ```
   The `access_token` field on the Neff Paving Page entry is your **long-lived Page token**.
3. Verify it in the **Access Token Debugger** — "Expires" should read **Never**.

### 4. Confirm the album ID
The "Website Feed" album ID is currently **`1458301069648156`** (the script defaults to this).
To double-check, open the album on Facebook and look at the URL, or run:
```
GET https://graph.facebook.com/v21.0/PAGE_ID/albums?fields=id,name&access_token=PAGE_TOKEN
```
If the ID is different, set it as the `FB_ALBUM_ID` secret in step 5.

### 5. Add GitHub secrets
In the repo: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `FB_PAGE_TOKEN` | the long-lived Page token from step 3 (**required**) |
| `GALLERY_SYNC_TOKEN` | an admin PAT so the job can auto-push to protected `main` (**required**) |
| `FB_ALBUM_ID` | only if the album ID differs from the default (optional) |

**Creating `GALLERY_SYNC_TOKEN`:** <https://github.com/settings/tokens> →
**Generate new token (classic)** → scope **`repo`** → generate → copy → save it as
the secret above. (As a repo admin, this token is allowed to bypass branch
protection, so the daily sync can commit straight to `main`.)

### 6. Test it
- **Actions** tab → **Sync Facebook Album to Gallery** → **Run workflow**.
- It downloads the album's photo(s), commits straight to `main`, and triggers a
  deploy — no PR, no merge needed.
- The **"Latest"** gallery filter appears once at least one photo is live.

---

## Day-to-day use (for the owner)

> Open the Facebook app → Neff Paving & Concrete Page → **Photos → Albums →
> "Website Feed"** → **Add Photos**. That's it. New photos show up on the website by
> the next day. To remove one from the website, delete it from that album.

---

## Notes & troubleshooting

- **Schedule:** daily at 09:00 UTC. Change the `cron` in
  `.github/workflows/facebook-gallery-sync.yml` to adjust. You can always run it
  manually from the Actions tab.
- **Safety:** if the token is invalid or Facebook is unreachable, the job **fails
  without touching the live gallery** — it never wipes existing photos on error.
- **Token stopped working?** Page tokens can be invalidated if the Page admin
  changes their password or removes the app. Re-run steps 2–3 and update the
  `FB_PAGE_TOKEN` secret.
- **Image quality:** photos are resized to max 1600px wide and saved as WebP
  (quality 82) to keep the site fast.
