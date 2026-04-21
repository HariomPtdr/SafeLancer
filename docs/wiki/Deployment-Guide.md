# Deployment Guide

SafeLancer uses a split deployment:
- **Frontend** → Vercel (global CDN)
- **Backend API** → Render.com (Singapore region)
- **Database** → MongoDB Atlas
- **File storage** → AWS S3

---

## Backend — Render.com

### Initial Deploy

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Region:** Singapore (closest to India)
   - **Plan:** Free (auto-sleeps after 15min of inactivity)
5. Add all environment variables (see [Environment Variables](Environment-Variables))
6. Click **Create Web Service**

### Health Check

Render uses `GET /api/health` to verify the service is running. This is already configured in `render.yaml`.

### Waking up the free tier

Free Render services sleep after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. For production use, upgrade to a paid plan or use a service like [UptimeRobot](https://uptimerobot.com) to ping `/api/health` every 5 minutes.

### Manual redeploy

In the Render dashboard → your service → **Manual Deploy → Deploy latest commit**

---

## Frontend — Vercel

### Initial Deploy

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Configure:
   - **Root directory:** `client`
   - **Framework preset:** Vite
   - **Build command:** `npm run build` (auto-detected)
   - **Output directory:** `dist` (auto-detected)
4. Add environment variables:
   ```
   VITE_API_URL = https://your-render-service.onrender.com
   VITE_RAZORPAY_KEY_ID = rzp_live_xxxxxxxxxxxx
   ```
5. Click **Deploy**

### SPA Routing

`client/vercel.json` contains the SPA rewrite rule so React Router works on direct URL loads:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Automatic deploys

Every push to `main` automatically triggers a Vercel redeploy.

---

## Database — MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write access
3. Go to **Network Access → Add IP** → allow `0.0.0.0/0` (or Render's static IP if on paid plan)
4. Go to **Connect → Connect your application** → copy the connection string
5. Set `MONGO_URI` in Render env vars (replace `<password>` with your user's password)

---

## AWS S3 — File Storage

### Create Bucket
1. AWS Console → S3 → **Create bucket**
2. Name: `safelancer-uploads` (must be globally unique)
3. Region: `ap-south-1` (Mumbai)
4. **Uncheck "Block all public access"** → confirm

### Bucket Policy (public read)
In bucket → **Permissions → Bucket Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::safelancer-uploads/*"
  }]
}
```

### IAM User (write access for backend)
1. AWS Console → IAM → **Users → Create user**
2. Name: `safelancer-server`
3. **Permissions → Attach policies → AmazonS3FullAccess**
4. After creating → **Security credentials → Create access key** → Application outside AWS
5. Copy **Access Key ID** and **Secret Access Key**
6. Add to Render env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION`

---

## Google OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com) → New project
2. **APIs & Services → Credentials → Create credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   ```
   https://your-render-service.onrender.com/api/auth/google/callback
   ```
5. Copy Client ID + Secret → add to Render env vars

---

## Post-Deploy Checklist

- [ ] Backend health check returns `{"status":"ok"}` at `/api/health`
- [ ] Frontend loads at Vercel URL
- [ ] Login (email/password) works
- [ ] Google OAuth redirects correctly
- [ ] File upload saves to S3 (check bucket)
- [ ] Razorpay test payment completes
- [ ] Admin account created (via MongoDB Atlas → update role field)
- [ ] Contact form saves to DB (check admin Messages tab)

---

## Updating the Deployment

```bash
# Just push to main — both Render and Vercel auto-deploy
git push origin main
```
