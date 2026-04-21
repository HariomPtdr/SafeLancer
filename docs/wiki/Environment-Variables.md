# Environment Variables

## Backend (`server/.env`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port (Render assigns this automatically) |
| `MONGO_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/freelock` | MongoDB connection string |
| `JWT_SECRET` | Yes | `super_secret_random_string_min_32_chars` | JWT signing secret — keep this private |
| `CLIENT_URL` | Yes | `https://your-app.vercel.app` | Frontend URL for CORS whitelist (comma-separated for multiple) |
| `SERVER_URL` | Yes | `https://your-api.onrender.com` | Backend URL used in Google OAuth callback |
| `GOOGLE_CLIENT_ID` | Yes* | `xxx.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | `GOCSPX-...` | Google OAuth client secret |
| `RAZORPAY_KEY_ID` | Yes* | `rzp_live_xxxxxxxxxxxx` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Yes* | `your_secret` | Razorpay API secret |
| `RAZORPAY_ACCOUNT_NUMBER` | Yes* | `1112220000xxxx` | Bank account for payouts |
| `AWS_ACCESS_KEY_ID` | No** | `AKIA...` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | No** | `wJalr...` | AWS IAM secret key |
| `AWS_S3_BUCKET` | No** | `safelancer-uploads` | S3 bucket name |
| `AWS_REGION` | No** | `ap-south-1` | AWS region (default: ap-south-1) |
| `REALITY_DEFENDER_API_KEY` | No | `rd_...` | RealityDefender deepfake detection key |
| `NODE_ENV` | No | `production` | Set to `test` to skip Razorpay live calls |

\* Required for full functionality. The app will start without these but those features won't work.

\*\* If not set, the app falls back to saving files to local disk at `/server/uploads/`. On Render, these are lost on every redeploy — set up S3 for production.

---

## Frontend (`client/.env`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `https://your-api.onrender.com` | Backend base URL |
| `VITE_RAZORPAY_KEY_ID` | Yes | `rzp_live_xxxxxxxxxxxx` | Razorpay public key for payment modal |

---

## Setting up environment variables on Render

1. Go to your service on [render.com](https://render.com)
2. Click **Environment** in the left sidebar
3. Add each variable as a key-value pair
4. Click **Save Changes** — Render will automatically redeploy

## Setting up environment variables on Vercel

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings → Environment Variables**
3. Add each variable, select environments (Production / Preview / Development)
4. Redeploy for changes to take effect

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add to **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   https://your-api.onrender.com/api/auth/google/callback
   ```
5. Copy the **Client ID** and **Client Secret** to your env vars

---

## Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. **Test mode** — use `rzp_test_*` keys for development
3. **Live mode** — complete KYC, use `rzp_live_*` keys for production
4. For payouts: set `RAZORPAY_ACCOUNT_NUMBER` to your linked bank account

---

## AWS S3 Setup

1. Create S3 bucket (e.g. `safelancer-uploads`, region `ap-south-1`)
2. Disable "Block all public access" for the bucket
3. Add bucket policy for public read:
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
4. Create IAM user → Attach `AmazonS3FullAccess` policy → Generate access keys
5. Add keys to env vars
