# Google Maps API Billing Account Issue - Fix Guide

## Current Error

```
UserProjectAccountProblem
The project to be billed is associated with a closed billing account.
The billing account for the owning project is disabled in state closed
```

## What This Means

Your Google Maps API key is working correctly and loading properly, but the Google Cloud billing account associated with the API key has been closed or disabled. This prevents the Maps API from functioning.

## How to Fix This

### Option 1: Reactivate the Existing Billing Account (Fastest)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/billing

2. **Check Billing Account Status:**
   - Look for your billing accounts
   - Find the one in "CLOSED" state
   - Click on it to view details

3. **Reactivate the Account:**
   - If there's an option to reactivate, click it
   - You may need to:
     - Update payment method
     - Resolve any outstanding charges
     - Accept new terms of service

4. **Link to Your Project:**
   - Go to: https://console.cloud.google.com/
   - Select your Neff Paving project
   - Go to Billing in the left menu
   - Link the reactivated billing account

### Option 2: Create a New API Key with Active Billing (Recommended)

1. **Create New Google Cloud Project:**
   ```
   - Go to: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Name: "Neff Paving Maps"
   - Click "Create"
   ```

2. **Set Up Billing:**
   ```
   - In the new project, go to Billing
   - Click "Link a billing account"
   - Create a new billing account OR select an active one
   - Add payment method (credit/debit card)
   ```

3. **Enable Required APIs:**
   ```
   - Go to: https://console.cloud.google.com/apis/library
   - Search and enable each:
     ✓ Maps JavaScript API
     ✓ Places API
     ✓ Geocoding API
     ✓ Maps Static API (for screenshots)
   ```

4. **Create New API Key:**
   ```
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the new API key
   ```

5. **Restrict the API Key (Important for Security):**
   ```
   - Click on the API key you just created
   - Under "Application restrictions":
     - Select "HTTP referrers (web sites)"
     - Add your domains:
       - https://neffpaving.co/*
       - https://*.vercel.app/*
       - http://localhost:* (for development)

   - Under "API restrictions":
     - Select "Restrict key"
     - Select only the APIs you need:
       ✓ Maps JavaScript API
       ✓ Places API
       ✓ Geocoding API
       ✓ Maps Static API

   - Click "Save"
   ```

6. **Update Your API Key:**
   ```bash
   # Edit .env.local file
   nano .env.local

   # Replace with new API key:
   VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE
   ```

7. **Update dist/config-loader.js:**
   ```bash
   # Edit dist/config-loader.js
   nano dist/config-loader.js

   # Replace line 10:
   googleMapsApiKey: 'YOUR_NEW_API_KEY_HERE',
   ```

8. **Commit and Deploy:**
   ```bash
   git add dist/config-loader.js
   git commit -m "Update Google Maps API key with active billing account"
   git push origin silly-jones
   ```

### Option 3: Use a Different Existing API Key

If you have another Google Cloud project with an active billing account:

1. **Get the API Key:**
   - Go to: https://console.cloud.google.com/
   - Select the project with active billing
   - Go to APIs & Services → Credentials
   - Copy an existing API key OR create a new one

2. **Enable Required APIs** (if not already enabled)
   - Follow step 3 from Option 2 above

3. **Update Your API Key:**
   - Follow steps 6-8 from Option 2 above

## Important Security Notes

⚠️ **After creating/updating your API key:**

1. **Set Application Restrictions:**
   - Only allow specific domains (prevents API key theft)
   - Add your production domain and localhost

2. **Set API Restrictions:**
   - Only enable the APIs you actually use
   - Reduces risk if key is compromised

3. **Monitor Usage:**
   - Set up billing alerts in Google Cloud Console
   - Monitor for unusual activity

4. **Set Usage Limits:**
   - Go to: https://console.cloud.google.com/google/maps-apis/quotas
   - Set reasonable daily limits to prevent unexpected charges

## Cost Estimates

Google Maps pricing (as of 2024):
- **Maps JavaScript API:** $7 per 1,000 map loads (first 28,000 loads free per month)
- **Places API:** $17 per 1,000 requests (but you get $200 free credit monthly)
- **Static Maps API:** $2 per 1,000 requests

For a typical small business website:
- **Expected monthly usage:** < 5,000 map loads
- **Expected cost:** $0 (covered by free tier)

## Verifying the Fix

After updating the API key:

1. **Clear browser cache:**
   ```
   - Chrome: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Clear data
   ```

2. **Test the maps:**
   - Visit your website
   - Check the main page map (office location)
   - Check the estimate form map
   - Open browser console (F12) to verify no errors

3. **Check for the success message:**
   - You should see: "✅ Google Maps API key loaded successfully"
   - No errors about billing

## Still Having Issues?

If you still see billing errors:

1. **Wait 5-10 minutes** - API key changes can take time to propagate
2. **Check project billing status** - Ensure billing account is truly active
3. **Verify API key is from the correct project** - Check in Google Cloud Console
4. **Contact Google Cloud Support** - They can help with billing account issues

## Quick Command Reference

```bash
# Update .env.local with new API key
echo 'VITE_GOOGLE_MAPS_API_KEY=your_new_key_here' > .env.local

# Update dist/config-loader.js (manual edit required)
nano dist/config-loader.js

# Commit changes
git add dist/config-loader.js
git commit -m "Update Google Maps API key"
git push origin silly-jones

# Set Vercel environment variable (in Vercel dashboard)
# Go to: https://vercel.com/your-project/settings/environment-variables
# Add: VITE_GOOGLE_MAPS_API_KEY = your_new_key_here
```

## Need Help?

- **Google Cloud Support:** https://cloud.google.com/support
- **Google Maps Platform Docs:** https://developers.google.com/maps/documentation
- **Billing Help:** https://cloud.google.com/billing/docs
