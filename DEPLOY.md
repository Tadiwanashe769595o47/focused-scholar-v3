# Focused Scholar V3 - Deploy to Cloud

## Choose Your Hosting

### Option 1: Railway (Recommended)
- Better free tier - no spin-down
- Faster cold starts
- Simpler setup

### Option 2: Render
- More well-known
- Free tier spins down after 15 min inactivity

---

## Deploy to Railway

### Step 1: Push Code to GitHub
```bash
git add -A
git commit -m "deploy: prepare for web deployment"
git push origin master
```

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) → Sign up (use GitHub)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `focused-scholar-v3` repository
4. Railway will auto-detect the `railway.json` config
5. **Add Environment Variables** in Railway dashboard:

| Variable | Value |
|----------|-------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://bpvwkmkwecjqwjyvtzuh.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdndrbWt3ZWNqcXdqeXZ0enVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTE0NTMsImV4cCI6MjA5MTUyNzQ1M30.tvxInTWS0sAU3iX5G0qPcmPdr5mjLA5NIEdtNp-CjCY` |
| `SUPABASE_SERVICE_ROLE_KEY` | (get from Supabase → Settings → API) |
| `JWT_SECRET` | Generate a secure random string (e.g., use a password generator) |
| `DEEPSEEK_API_KEY` | `sk-76d1d49725e5451db9aa6728a097a600` |
| `TEACHER_ACCESS_CODE` | `123456` |
| `HOLIDAY_ACCESS_CODE` | `789012` |
| `PARENT_ACCESS_CODE` | `parent123` |

6. Click **"Deploy"**

### Step 3: Wait for Deploy
- First deploy takes ~3-4 minutes
- Once done, you'll get a URL like: `https://focused-scholar-api.up.railway.app`
- Test: visit `https://your-url.up.railway.app/api/health`

---

## Deploy to Render (Alternative)

### Step 1: Push Code
```bash
git push origin master
```

### Step 2: Create Web Service
1. Go to [render.com](https://render.com) → Sign up
2. Click **"New"** → **"Web Service"**
3. Connect GitHub → Select `focused-scholar-v3`
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm run build && npm run start`
5. Add same environment variables as above
6. Click **"Create"**

---

## Deploy Frontend (Web App)

Your API is now running! Now deploy the frontend so students can access it.

### Option A: Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com) → Sign up
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub → Select `focused-scholar-v3`
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variable:
   - `VITE_API_URL`: `https://your-api-url.up.railway.app/api`
6. Deploy!

### Option B: Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up
2. Click **"Add New..."** → **"Project"**
3. Import `focused-scholar-v3`
4. Configure:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variable:
   - `VITE_API_URL`: `https://your-api-url.up.railway.app/api`
6. Deploy!

---

## Important: Update App Code

After you get your API URL, update this file to point to it:

### Option A: For Students (Standalone App)
If students will use the downloadable installer:
1. I'll need to rebuild with the new API URL
2. Or they can manually update

### Option B: For Web App
If using the web version (Netlify/Vercel):
- The frontend is already configured to use the environment variable
- Just make sure `VITE_API_URL` is set correctly

---

## Testing Your Deployment

After everything is deployed, test:
1. ✅ Visit your frontend URL
2. ✅ Try to log in
3. ✅ Start a quiz
4. ✅ Test the AI Tutor
5. ✅ Check Supabase - do you see new student records?

---

## Cost Summary

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Railway** | $5 credit/month | Enough for ~500 students |
| **Supabase** | Free | Database + Auth |
| **Netlify/Vercel** | 100GB bandwidth | Plenty for study app |
| **DeepSeek** | Pay per use | ~$0.001 per 1K tokens |

---

## Troubleshooting

### API Returns 502/500
- Check Railway/Render logs
- Missing environment variables?

### CORS Errors
- Make sure frontend `VITE_API_URL` ends with `/api`
- Check that API is running

### Database Issues
- Verify SUPABASE_URL and keys are correct
- Check Supabase logs

Want me to help you deploy step by step?