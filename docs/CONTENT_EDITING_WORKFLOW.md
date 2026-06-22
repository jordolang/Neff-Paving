# Content Editing Workflow Guide

**For:** Office staff and content editors  
**Purpose:** How to edit website content using the CMS

---

## Quick Start

### Access the CMS

1. Navigate to your site's admin URL:
   - **Local development:** http://localhost:3000/admin/
   - **Production:** https://your-domain.com/admin/

2. Click "Login with GitHub"

3. Authorize the application (first time only)

4. You'll see the CMS dashboard with three collections:
   - **Homepage** - Hero section, stats, introduction
   - **Services** - Asphalt and concrete service listings
   - **Gallery** - Project photos and captions

---

## Editing Homepage Content

### Hero Section

The hero section is the first thing visitors see on your homepage.

**To edit:**

1. Click "Homepage" in the left sidebar
2. Click "Homepage Content"
3. Expand "Hero Section"
4. Edit any of these fields:
   - **Badge** - Award or recognition text (e.g., "Top Paving Contractor")
   - **Eyebrow** - Small text above main title
   - **Title** - Main headline (use `<span class="accent">` for highlighted words)
   - **Subtitle** - Supporting text below title
   - **Motto** - Tagline or slogan
   - **CTA Buttons** - Call-to-action button text and links
   - **Social Proof** - Stats and ratings displayed in hero

5. Click "Save" when done

### Stats Band

The stats band shows key metrics (years of experience, projects completed, etc.)

**To edit:**

1. In "Homepage Content", scroll to "Stats"
2. Each stat has three fields:
   - **Number** - The metric value (e.g., "26+")
   - **Label** - What it represents (e.g., "Years of Excellence")
   - **Description** - Additional context

3. Click "Save" when done

### Introduction Section

The introduction section provides detailed information about your company.

**To edit:**

1. Scroll to "Introduction Section"
2. Edit these fields:
   - **Eyebrow** - Category or section label
   - **Heading** - Section title
   - **Lead** - Main paragraph text
   - **Key Points** - Bullet points with icons
   - **CTA** - Call-to-action button and note
   - **Stat Cards** - Additional statistics

3. Click "Save" when done

---

## Editing Services

### Adding a New Service

1. Click "Services" in the left sidebar
2. Click "Services Content"
3. Scroll to either "Asphalt Services" or "Concrete Services"
4. Click "Add Service" under the appropriate category
5. Fill in:
   - **Name** - Service name
   - **Description** - What the service includes
   - **Icon** - Icon identifier (ask developer for options)
   - **Features** - List of features/benefits
   - **Image** - Service photo (optional)
6. Click "Save"

### Editing an Existing Service

1. Click "Services" in the left sidebar
2. Click "Services Content"
3. Find the service you want to edit
4. Update any fields
5. Click "Save"

---

## Managing Gallery Images

### Adding a New Gallery Item

1. Click "Gallery" in the left sidebar
2. Click "New Gallery"
3. Fill in:
   - **Image** - Upload or select image
   - **Title** - Image title (shown in gallery)
   - **Alt Text** - Description for accessibility
   - **Category** - Select: commercial, residential, equipment, or concrete
4. Click "Save"

### Editing Gallery Captions

1. Click "Gallery" in the left sidebar
2. Find the image you want to edit
3. Click on it to open
4. Update Title or Alt Text
5. Click "Save"

### Deleting a Gallery Item

1. Open the gallery item
2. Click "Delete entry" (red button at top)
3. Confirm deletion

---

## Publishing Changes

### Editorial Workflow (If Enabled)

When editorial workflow is enabled, changes go through three stages:

1. **Draft** - Initial save, not yet published
2. **In Review** - Ready for review (optional)
3. **Ready** - Approved and will be published

**To publish:**

1. Save your changes
2. Click "Set status" → "In Review" (optional)
3. Click "Set status" → "Ready"
4. Click "Publish now"

### Simple Workflow (Direct Publish)

If editorial workflow is disabled:

1. Save your changes
2. Changes are immediately committed to the repository
3. Site will rebuild automatically (if CI/CD is set up)

---

## Verifying Your Changes

### Check Git Commit

After publishing, verify your changes were saved:

1. Go to your GitHub repository
2. Check "Recent commits"
3. You should see a new commit with your changes
4. Click on the commit to see what changed

### Check the Live Site

After the site rebuilds (usually 2-5 minutes):

1. Visit your website
2. Navigate to the page you edited
3. Verify your changes appear correctly
4. Check on mobile and desktop views

---

## Common Tasks

### Updating Annual Statistics

**When:** Yearly or as new milestones are reached  
**Where:** Homepage → Stats Band and Introduction → Stat Cards

1. Update "Years of Experience" number
2. Update "Projects Completed" count
3. Update customer rating if changed
4. Update any award badges (e.g., "3 Years Running")

### Adding a Seasonal Promotion

**When:** Special offers or seasonal campaigns  
**Where:** Homepage → Hero Section → Badge or Subtitle

1. Edit Badge field with promotion text
2. Or update Subtitle to include promotion details
3. Update CTA button text if needed (e.g., "Get Summer Special")

### Updating Service Pricing

**When:** Price changes or new pricing tiers  
**Where:** Services → Services Content

1. Find the service to update
2. Edit pricing in the description or features
3. Update any pricing notes
4. Verify changes on services page

### Refreshing Gallery with New Projects

**When:** New project photos are available  
**Where:** Gallery

1. Upload new project photos
2. Add descriptive titles and alt text
3. Categorize correctly (commercial/residential/etc.)
4. Consider removing old/outdated photos

---

## Best Practices

### Content Writing

✅ **Do:**
- Write clear, concise copy
- Use active voice
- Highlight benefits, not just features
- Include calls to action
- Proofread before saving

❌ **Don't:**
- Use all caps (except for acronyms)
- Include HTML code (unless instructed)
- Write very long paragraphs
- Use jargon without explanation

### Images

✅ **Do:**
- Use high-quality photos
- Write descriptive alt text for accessibility
- Choose relevant category
- Use consistent naming (e.g., "Commercial Parking Lot - 2024")

❌ **Don't:**
- Upload extremely large files (> 5MB)
- Use blurry or low-quality images
- Leave alt text empty
- Use copyrighted images without permission

### Publishing

✅ **Do:**
- Preview changes before publishing
- Verify on live site after publish
- Publish during low-traffic hours (if making major changes)
- Keep track of what you changed

❌ **Don't:**
- Publish untested changes
- Make many rapid changes without verification
- Delete content without backup
- Publish during peak business hours (if making major changes)

---

## Troubleshooting

### "Failed to persist entry"

**Cause:** Usually an authentication or permission issue  
**Solution:**
1. Refresh the page
2. Log in again
3. Verify you have write access to the repository
4. Check your internet connection

### Changes not appearing on site

**Cause:** Site hasn't rebuilt yet or cache issue  
**Solution:**
1. Wait 2-5 minutes for rebuild
2. Clear your browser cache (Cmd/Ctrl + Shift + R)
3. Check if CI/CD build succeeded (ask developer)
4. Verify commit was created in GitHub

### "Invalid YAML" or "Invalid JSON"

**Cause:** Syntax error in structured data  
**Solution:**
1. Use the CMS interface (don't edit files directly)
2. Check for special characters in text fields
3. Contact developer if error persists

### Can't upload images

**Cause:** File size too large or wrong format  
**Solution:**
1. Resize image to under 5MB
2. Use JPEG or PNG format
3. Try a different browser
4. Contact developer if issue persists

---

## Getting Help

### Quick Help

- **CMS Setup Issues:** See `docs/CMS_SETUP.md`
- **Authentication Problems:** Check GitHub OAuth configuration
- **Build Errors:** Contact developer

### Contact

For technical support or questions about the CMS:

1. Check the troubleshooting section above
2. Review the CMS setup documentation
3. Contact your web developer
4. Open an issue in the GitHub repository

---

## Technical Notes

### How Changes are Saved

When you save content in the CMS:

1. CMS creates a git commit with your changes
2. Commit is pushed to the GitHub repository
3. GitHub Actions or Vercel detects the change
4. Site rebuilds automatically with new content
5. Updated site is deployed (usually 2-5 minutes)

### Content File Locations

Content is stored in JSON files:
- Homepage: `content/homepage.json`
- Services: `content/services.json`
- Gallery: `content/gallery.json`

These files are managed by the CMS - you don't need to edit them directly.

### Backup and Recovery

All content changes are tracked in git:
- View history: Check commits in GitHub
- Restore previous version: Revert a commit (ask developer)
- Compare versions: View commit diffs in GitHub

---

## Keyboard Shortcuts

While editing in the CMS:

- **Cmd/Ctrl + S** - Save changes
- **Esc** - Close editor
- **Cmd/Ctrl + Z** - Undo
- **Cmd/Ctrl + Shift + Z** - Redo

---

**Last Updated:** 2026-06-22  
**CMS Version:** Decap CMS 3.0.0
