---
description: Deploy VeriSchol to Render (backend) and Vercel (frontend)
---

# VeriSchol Deployment Workflow

This workflow guides you through deploying the VeriSchol application to production.

## Prerequisites

- GitHub repository with VeriSchol code
- Render account (https://render.com)
- Vercel account (https://vercel.com)

---

## Step 1: Push Code to GitHub

```bash
cd n:\Projects\cyber
git init
git add .
git commit -m "Initial commit - VeriSchol Secure Research Platform"
git remote add origin https://github.com/YOUR_USERNAME/verischol.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. Go to https://dashboard.render.com
2. Click **New** → **Blueprint**
3. Connect your GitHub account and select the verischol repository
4. Render will detect `backend/render.yaml` and show:
   - **verischol-db** (PostgreSQL Free)
   - **verischol-api** (Web Service Free)
5. Click **Apply**
6. Wait for deployment (5-10 minutes for first deploy)

### After Backend Deployment:

7. Go to the **verischol-api** service in Render dashboard
8. Click **Shell** tab
9. Run database migration:
   ```bash
   npm run db:migrate
   ```
10. Copy the **Service URL** (e.g., `https://verischol-api.onrender.com`)

---

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://verischol-api.onrender.com/api` (your Render URL + /api)
5. Click **Deploy**
6. Copy the **Production URL** (e.g., `https://verischol.vercel.app`)

---

## Step 4: Configure CORS on Backend

1. Go back to Render dashboard → **verischol-api**
2. Click **Environment** tab
3. Add Environment Variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Vercel URL (e.g., `https://verischol.vercel.app`)
4. Click **Save Changes** (service will redeploy)

---

## Step 5: Verify Deployment

// turbo
1. Visit your Vercel frontend URL
2. Try logging in with demo credentials:
   - Admin: real@gmail.com / Prithiv@123
   - Researcher: researcher1@example.com / Prithiv@123
3. Test creating a project and research data
4. Test the integrity verification flow

---

## Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify database connection in Environment variables
- Run `npm run db:migrate` in Render shell

### CORS errors
- Ensure `FRONTEND_URL` is set correctly in Render
- Include full URL with https://

### Database errors
- Run migration: `npm run db:migrate`
- Check Render PostgreSQL status

### OTP not working
- OTP is displayed in demo mode
- Check browser console for the demo OTP value

---

## Custom Domain (Optional)

### Render Custom Domain
1. Dashboard → verischol-api → Settings → Custom Domains

### Vercel Custom Domain
1. Dashboard → Project → Settings → Domains
2. Add your domain and configure DNS

---

## Environment Variables Reference

### Backend (Render)
| Variable | Description | Auto-Generated |
|----------|-------------|----------------|
| DB_HOST | PostgreSQL host | ✅ (from database) |
| DB_PORT | Database port | ✅ |
| DB_NAME | Database name | ✅ |
| DB_USER | Database user | ✅ |
| DB_PASSWORD | Database password | ✅ |
| JWT_SECRET | JWT signing key | ✅ |
| SYSTEM_SALT | Hashing salt | ✅ |
| FRONTEND_URL | Vercel URL | ❌ Manual |

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL + /api |
