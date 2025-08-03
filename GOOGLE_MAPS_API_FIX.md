# Google Maps API Fix Instructions

## Current Issue
The Google Maps API is returning a `RefererNotAllowedMapError` for the URL: `https://www.neffpaving.co/estimate-form`

## Solution Steps

### 1. Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project that contains the Maps JavaScript API key

### 2. Navigate to API Credentials
1. Go to **APIs & Services** → **Credentials**
2. Find the API key: `AIzaSyA7VWDFVhPwWzWrkLxQQ1bktzQvikLoDXk`
3. Click on the API key name to edit it

### 3. Add Website Restrictions
Under **Application restrictions**, add the following URLs:

```
https://www.neffpaving.co/*
https://www.neffpaving.com/*
https://neffpaving.co/*
https://neffpaving.com/*
http://localhost:3000/*
http://localhost:5173/*
https://neff-paving.vercel.app/*
https://*.vercel.app/*
```

### 4. Enable Required APIs
Make sure these APIs are enabled for your project:
- Maps JavaScript API
- Places API
- Geocoding API
- Directions API

### 5. Save Changes
Click **Save** and wait 5-10 minutes for changes to propagate.

## Code Changes Applied

I've already made the following improvements to the estimate-form.html:

1. **Added async loading**: Added `async defer` and `loading=async` to prevent performance warnings
2. **Improved geolocation handling**: Added proper error handling and security checks
3. **Fixed initialization**: Removed duplicate initMap calls

## Testing
After updating the Google Cloud Console:
1. Clear browser cache
2. Test the estimate form at https://www.neffpaving.co/estimate-form
3. Check browser console for any remaining errors

## Alternative Solution (If API Key Issues Persist)

Consider creating a new API key specifically for production with proper restrictions, or use environment variables to manage different keys for different environments.