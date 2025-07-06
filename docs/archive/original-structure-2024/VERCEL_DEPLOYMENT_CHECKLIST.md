# Vercel Deployment Checklist

## 🔧 Environment Variables Configuration

### ✅ Admin Panel Routes (vercel.json)
The vercel.json file is already configured with the correct rewrites for the admin panel:
- `/admin` → `/admin/index.html`
- `/admin/(.*)` → `/admin/$1`

### 🔑 Required Environment Variables in Vercel Dashboard

When deploying to Vercel, you need to set these environment variables in your Vercel project settings:

#### Frontend Variables (VITE_*)
```
VITE_DEPLOY_TARGET=vercel
VITE_CDN_BASE_URL=https://raw.githubusercontent.com/jordolang/Neff-Paving/deployment/assets/videos/optimized/
VITE_BACKEND_URL=https://your-vercel-domain.vercel.app/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k
```

#### Backend Variables (Database & Authentication)
```
DB_HOST=your-vercel-postgres-host
DB_PORT=5432
DB_NAME=neff_paving_admin
DB_USER=your-vercel-postgres-user
DB_PASSWORD=your-vercel-postgres-password
JWT_SECRET=your-production-jwt-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
NODE_ENV=production
```

### 📋 Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update deployment configurations"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select your project

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add all the variables listed above
   - Set the appropriate values for your production environment

4. **Deploy**
   - Vercel will automatically deploy when you push to main
   - The admin panel will be accessible at `https://your-domain.vercel.app/admin`

### 🔐 Security Considerations

- **JWT_SECRET**: Use a strong, random secret key (minimum 32 characters)
- **ADMIN_PASSWORD**: Use a secure password, not the default 'admin123'
- **Database Credentials**: Use production database credentials
- **Google Maps API Key**: Ensure it's configured with proper restrictions

### 🌐 Available Google Maps API Keys

You have three API keys available:
- `AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k` (Primary)
- `AIzaSyDwtECO1lWeBHEBR7oAXNw5G3OYar68ySk` (Secondary)
- `AIzaSyB6igIPyhIPudzvwD6LbmgrCkxuEXvbjJE` (Backup)

### 📝 Post-Deployment Verification

After deployment, verify:
- [ ] Main website loads correctly
- [ ] Admin panel accessible at `/admin`
- [ ] Admin login works with configured credentials
- [ ] API endpoints respond correctly
- [ ] Database connections are working
- [ ] Google Maps integration functions properly

### 🚨 Troubleshooting

**Admin Panel 404 Error:**
- Verify vercel.json rewrites are correct
- Check build output includes admin directory
- Ensure VITE_BACKEND_URL is set correctly

**Database Connection Issues:**
- Verify database credentials in environment variables
- Check if database is accessible from Vercel
- Ensure database schema is properly migrated

**API Endpoints Not Working:**
- Check VITE_BACKEND_URL configuration
- Verify CORS settings in backend
- Ensure environment variables are properly set

### 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set correctly
3. Test API endpoints directly
4. Check browser console for errors
