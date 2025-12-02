# Quick Start - Google Maps Setup

## To Enable Google Maps on Your Website

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit .env.local and add your API key:**
   ```bash
   nano .env.local
   ```

   Replace `your_google_maps_api_key_here` with your actual Google Maps API key.

3. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

That's it! Your maps will now work correctly.

## Where to Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key under "Credentials"
5. Copy the key to your `.env.local` file

## Security Notes

- ✅ `.env.local` is already in `.gitignore` - your API key will NOT be committed
- ✅ Never commit your API key to version control
- ✅ Set up domain restrictions in Google Cloud Console

## Need Help?

See `SETUP_MAPS.md` for detailed documentation.
