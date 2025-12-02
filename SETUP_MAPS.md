# Google Maps API Setup Instructions

This document explains how to configure the Google Maps API key for the Neff Paving website.

## Security

The Google Maps API key is **NOT** stored in the repository for security reasons. It must be configured locally using environment variables.

## Setup Instructions

### 1. Create Environment File

Create a file named `.env.local` in the project root directory:

```bash
touch .env.local
```

### 2. Add Your API Key

Open `.env.local` and add your Google Maps API key:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_GOOGLE_MAPS_API_KEY
```

Replace `YOUR_ACTUAL_GOOGLE_MAPS_API_KEY` with your real API key from Google Cloud Console.

### 3. Verify Configuration

The `.env.local` file is already listed in `.gitignore`, so it will NOT be committed to version control.

## How It Works

### For Development (Vite)

- The `.env.local` file is automatically loaded by Vite
- The `VITE_GOOGLE_MAPS_API_KEY` variable is available as `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
- The `config.js` module exports the configuration

### For Static HTML Files

- The `config-loader.js` script loads the configuration
- During build, the `%VITE_GOOGLE_MAPS_API_KEY%` placeholder is replaced with the actual key
- The configuration is available as `window.NeffPavingConfig`

## Files Using Google Maps

The following files have been updated to use the secure configuration:

1. `index.html` - Main website (office location map)
2. `estimate-form.html` - Interactive area calculator
3. `dist/estimate-form.html` - Built version of estimate form
4. `diagnosis/map-diagnostic.html` - Map diagnostic tool
5. `server/server.js` - Server-side screenshot generation (line 217)

## Production Deployment

### GitHub Pages

For GitHub Pages deployment, you need to:

1. Set up a GitHub Action to inject the API key during build
2. Add the API key as a GitHub Secret
3. Update the build script to replace placeholders

### Vercel/Netlify

Add the environment variable in your deployment platform:

- **Variable Name:** `VITE_GOOGLE_MAPS_API_KEY`
- **Value:** Your Google Maps API key

## Fallback Behavior

If no API key is configured:

- The website will display a fallback map with static information
- Users can still view the address and click to open Google Maps
- The estimate form will show an error message

## Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key:
   - Set HTTP referrers (your domain)
   - Restrict to only necessary APIs

## Server Configuration

The server also uses a Google Maps API key for screenshot generation. Update `server/server.js` line 217 to use the environment variable instead of a hardcoded key.

## Troubleshooting

### Maps Not Loading

1. Check browser console for errors
2. Verify `.env.local` exists and contains the API key
3. Restart the development server after creating `.env.local`
4. Check that the API key has the necessary permissions in Google Cloud Console

### Billing Account Errors

**Error: "UserProjectAccountProblem - The project to be billed is associated with a closed billing account"**

This means your Google Cloud billing account is closed or disabled. See `GOOGLE_MAPS_BILLING_FIX.md` for detailed instructions on:
- Reactivating your billing account
- Creating a new API key with active billing
- Setting up a new Google Cloud project

Quick fix: Create a new API key from a Google Cloud project with active billing, then update both `.env.local` and `dist/config-loader.js`

### Build Issues

1. Ensure the build process replaces `%VITE_GOOGLE_MAPS_API_KEY%` placeholder
2. Verify environment variables are set in your deployment platform
3. Check that `config-loader.js` is being served correctly

### Common Errors

- **"RefererNotAllowedMapError"** - Add your domain to API key restrictions
- **"ApiNotActivatedMapError"** - Enable Maps JavaScript API in Google Cloud Console
- **"InvalidKeyMapError"** - Check that your API key is correct
- **Fallback map displays** - API key not configured or not loaded properly

## Security Best Practices

- ✅ Never commit `.env.local` to version control
- ✅ Use domain restrictions on your API key
- ✅ Enable only the APIs you need
- ✅ Monitor API usage in Google Cloud Console
- ✅ Set up billing alerts
- ❌ Don't share your API key publicly
- ❌ Don't hardcode API keys in source files
