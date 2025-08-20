# 🚀 Life Tracker Pro - Deployment Guide

This guide will walk you through deploying your first web application! We'll start with the frontend and then add the backend.

## 📋 Prerequisites

- [x] Git installed on your computer
- [x] GitHub account
- [x] Vercel account (free at vercel.com)
- [x] Railway account (free at railway.app) - for backend later

## 🎯 Step 1: Deploy Frontend to Vercel (Easiest!)

### 1.1 Initialize Git Repository (if not already done)
```bash
# In your project folder
git init
git add .
git commit -m "Initial commit - Life Tracker Pro ready for deployment"
```

### 1.2 Push to GitHub
1. Go to [github.com](https://github.com) and create a new repository called `life-tracker`
2. **Don't** initialize with README (your project already has files)
3. Copy the commands GitHub shows you:

```bash
git remote add origin https://github.com/YOUR_USERNAME/life-tracker.git
git branch -M main
git push -u origin main
```

### 1.3 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click **"New Project"**
3. Import your `life-tracker` repository
4. Vercel will auto-detect it's a React app
5. **Important**: Add these Environment Variables:
   - `REACT_APP_API_BASE_URL` = `https://your-backend-url.railway.app` (we'll get this later)
   - `REACT_APP_ENVIRONMENT` = `production`
6. Click **"Deploy"**

🎉 **Your frontend is now live!** You'll get a URL like `https://life-tracker-xyz.vercel.app`

## 🔧 Step 2: Deploy Backend to Railway

### 2.1 Prepare Backend for Production
First, let's create a production start script:

**package.json** (already configured):
- ✅ `"start": "node dist/server/index.js"`
- ✅ `"build:server": "tsc -p tsconfig.server.json"`

### 2.2 Create Railway Configuration
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Create **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `life-tracker` repository
4. Railway will auto-detect Node.js

### 2.3 Configure Railway Environment
Add these variables in Railway dashboard:
- `NODE_ENV` = `production`
- `PORT` = `8000`
- `DATABASE_URL` = `./database/life_tracker.db` (Railway will handle SQLite)

### 2.4 Set Build & Start Commands
In Railway settings:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 2.5 Update Frontend Environment
1. Go back to your Vercel dashboard
2. Update the `REACT_APP_API_BASE_URL` environment variable
3. Set it to your Railway backend URL (something like `https://life-tracker-production-xyz.up.railway.app`)
4. Redeploy your frontend

## 🧪 Step 3: Test Your Deployment

1. Visit your Vercel URL
2. Check if the app loads
3. Test basic functionality
4. Check browser console for any errors

## 📊 Current Build Status

- **Frontend Size**: ~2MB (optimized)
- **Backend**: Node.js + SQLite
- **Database**: 12 tables initialized
- **Environment**: Production ready

## 🛠 Alternative Deployment Options

### For Frontend:
- **Netlify**: Similar to Vercel, drag-and-drop friendly
- **GitHub Pages**: Free but limited (static only)

### For Backend:
- **Heroku**: Classic option (has free tier limitations)
- **DigitalOcean App Platform**: More advanced
- **AWS/Azure**: Enterprise level

## 🔍 Troubleshooting

### Common Issues:
1. **Build fails**: Check package.json scripts
2. **API calls fail**: Verify CORS and environment variables
3. **Database errors**: Check SQLite file permissions

### Debug Commands:
```bash
# Test production build locally
npm run build
npx serve -s build

# Test backend locally
npm run build:server
npm start
```

## 🎯 What You'll Learn:

✅ **Git-based deployments**: Push code → Auto deploy  
✅ **Environment variables**: Different configs for dev/prod  
✅ **Static hosting**: How frontend apps are served  
✅ **API deployment**: Backend server management  
✅ **Domain management**: Custom URLs and routing  

---

**Next Steps**: Once deployed, you can:
- Add a custom domain
- Set up monitoring
- Add CI/CD pipelines
- Scale your application

Happy deploying! 🚀