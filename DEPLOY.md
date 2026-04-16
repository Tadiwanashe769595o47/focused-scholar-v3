# Focused Scholar V3 - Deploy to Render

## Prerequisites
- GitHub account with the focused-scholar-v3 repository
- Supabase project (you already have one)

## Step 1: Push Code to GitHub
Make sure the latest code is pushed to GitHub:
```bash
git add -A
git commit -m "deploy: prepare for web deployment"
git push origin master
```

## Step 2: Deploy to Render

### Option A: From Render Dashboard (Recommended)
1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub and select the `focused-scholar-v3` repository
4. Configure:
   - **Name**: `focused-scholar-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run build && npm run start`
5. Click **"Create Web Service"**

### Option B: From render.yaml (Faster)
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New"** → **"Blueprint"**
3. Select your GitHub repository
4. Render will detect the `render.yaml` file
5. Fill in environment variables:
   - `SUPABASE_URL`: `https://bpvwkmkwecjqwjyvtzuh.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdndrbWt3ZWNqcXdqeXZ0enVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTE0NTMsImV4cCI6MjA5MTUyNzQ1M30.tvxInTWS0sAU3iX5G0qPcmPdr5mjLA5NIEdtNp-CjCY`
   - `SUPABASE_SERVICE_ROLE_KEY`: (get from Supabase Settings → API)
   - `JWT_SECRET`: Generate a secure random string (e.g., use a password generator)
   - `DEEPSEEK_API_KEY`: `sk-76d1d49725e5451db9aa6728a097a600`
   - `TEACHER_ACCESS_CODE`: `123456`
   - `HOLIDAY_ACCESS_CODE`: `789012`
   - `PARENT_ACCESS_CODE`: `parent123`
6. Click **"Apply"**

## Step 3: Wait for Deployment
- Build takes ~2-3 minutes
- Once complete, you'll get a URL like: `https://focused-scholar-api.onrender.com`
- Test it: visit `/api/health` (e.g., `https://focused-scholar-api.onrender.com/api/health`)

## Step 4: Deploy Frontend (Static Site)
The API is now running! You have two options for the frontend:

### Option A: Deploy Frontend to Render (Static)
1. In Render dashboard, click **"New"** → **"Static Site"**
2. Connect your GitHub repo
3. Build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL`: `https://your-api-url.onrender.com/api`
5. Deploy - you'll get a frontend URL

### Option B: Use Netlify or Vercel (Easier)
1. Push code to GitHub
2. Go to [Netlify.com](https://netlify.com) or [Vercel.com](https://vercel.com)
3. Import the repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variable: `VITE_API_URL=https://focused-scholar-api.onrender.com/api`
7. Deploy

## Testing
After deployment, test:
1. Login page works
2. Can take a quiz
3. AI Tutor responds

## Troubleshooting
- If API fails: Check Render logs (click on the service → "Logs")
- Common issue: Missing environment variables
- If timeout: Increase the timeout in render.yaml

## Cost
- **Render Free Tier**: 750 hours/month, sleeps after 15 min inactive
- **Supabase Free Tier**: Included
- **DeepSeek**: Pay per API call (very cheap for text)

That's it! Your app is now online and accessible to all students.