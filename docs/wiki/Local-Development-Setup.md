# Local Development Setup

## Prerequisites

- **Node.js** >= 18.0.0 ([download](https://nodejs.org))
- **npm** >= 9 (comes with Node.js)
- **MongoDB** — either [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) or local MongoDB
- **Git**

Optional (for full feature set):
- Razorpay test account (for payment flows)
- Google Cloud Console project (for Google OAuth)
- AWS account (for S3 — not needed, falls back to local disk)

---

## Step 1: Clone

```bash
git clone https://github.com/HariomPtdr/SafeLancer.git
cd SafeLancer
```

---

## Step 2: Backend Setup

```bash
cd server
npm install
```

Create `server/.env` (copy from `server/.env.example`):

```bash
cp .env.example .env
```

Minimum required config for local dev:
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/freelock
JWT_SECRET=any_long_random_string_here
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

For Google OAuth (optional in dev):
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
```

For Razorpay (optional in dev, use test keys):
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_ACCOUNT_NUMBER=1234567890
```

Start the backend:
```bash
npm run dev
# Server running on http://localhost:5000
```

Verify it's working:
```bash
curl http://localhost:5000/api/health
# {"status":"ok","time":"..."}
```

---

## Step 3: Frontend Setup

```bash
cd ../client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

Start the frontend:
```bash
npm run dev
# App running on http://localhost:5173
```

---

## Step 4: Create an Admin Account

The fastest way is to register a regular account, then update the role in MongoDB:

1. Register at `http://localhost:5173/register`
2. Open your MongoDB Atlas dashboard (or use MongoDB Compass)
3. Find your user in the `users` collection
4. Change `role` from `"client"` or `"freelancer"` to `"admin"`
5. Reload the app — you'll be redirected to `/admin`

---

## Common Issues

### CORS error in browser
Make sure `CLIENT_URL` in `server/.env` matches exactly where your frontend runs:
```env
CLIENT_URL=http://localhost:5173
```

### Google OAuth redirect mismatch
In Google Cloud Console, add `http://localhost:5000/api/auth/google/callback` to authorized redirect URIs.

### Files not persisting between server restarts
Without AWS S3 configured, files save to `server/uploads/`. This directory is local and persists between restarts in dev. On Render, it's wiped on every deploy — configure S3 for production.

### Razorpay "key not found" error
Use test mode keys (`rzp_test_*`) for development. Never commit live keys to git.

### "Cannot connect to MongoDB"
- Check your `MONGO_URI` is correct
- Check your MongoDB Atlas cluster allows connections from your IP (Network Access → Add IP)

---

## Running Tests

```bash
cd server
node tests/workflow.test.js
```

The test suite runs a full escrow workflow: register users → post job → bid → hire → fund → submit → approve → release.

In test mode (`NODE_ENV=test`), Razorpay calls are mocked with `order_test_*` IDs.
