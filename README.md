# SafeLancer

> **Hackathon Project** — A cryptographic escrow platform that makes freelance work trustworthy for both sides.

![SafeLancer](https://img.shields.io/badge/SafeLancer-Hackathon%20Project-FF6803?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Render](https://img.shields.io/badge/API-Render-46E3B7?style=flat-square&logo=render)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)

---

## What is SafeLancer?

SafeLancer replaces blind faith in freelancing with **cryptographic proof**. Clients fund milestones into escrow before work begins. Freelancers submit SHA-256 hashed deliverables. Payment releases automatically or after approval, and every dispute has an immutable audit trail.

Built as a full-stack hackathon project by a team of 6 developers.

---

## Features

### Core Escrow System
- **11-state milestone escrow machine** - pending_deposit -> funded -> in_progress -> submitted -> review -> approved -> released
- **Sequential phase funding** - Phase N cannot be funded until Phase N-1 is approved
- **Auto-release** - If the client does not review within 72 hours, payment auto-releases to the freelancer
- **2% + 2% platform fee** - 2% added to client payment, 2% deducted from freelancer payout

### Cryptographic Proof of Delivery
- **SHA-256 file hashing** - every deliverable (code + demo video) is hashed on upload
- **Tamper-proof PDF certificates** - downloadable proof-of-delivery for any milestone
- **Public verification endpoint** - anyone can verify a hash without accessing the file

### Dispute Resolution
- **Auto-triggered disputes** - second client rejection auto-raises a dispute with evidence auto-compiled
- **Evidence portal** - both parties upload files and text evidence
- **Admin resolution** - release to freelancer / refund to client / split (configurable %)

### Deepfake Detection (RealityDefender)
- Demo videos analyzed for AI-generation via RealityDefender API
- Frame extraction via ffmpeg + metadata forensics
- Results: AUTHENTIC | FAKE | SUSPICIOUS | UNABLE_TO_EVALUATE

### Payments (Razorpay)
- Escrow funding via Razorpay payment orders
- Automated freelancer payouts on milestone approval
- Penalty payments for late clients (5% of milestone amount)
- Dispute refunds + split payments

### Authentication
- Email/password with bcrypt
- Google OAuth 2.0 (Passport.js)
- JWT-based session management
- Rate-limited login (account lockout after failed attempts)

### Real-time Collaboration
- Socket.io chat per contract room
- Typing indicators
- WebRTC video calls via SimplePeer

### Admin Dashboard
- Platform statistics, freelancer verification queue, user management
- Dispute resolution modal with full context
- Payment history, transaction logs, contact form inbox

### File Storage
- AWS S3 for production
- Local disk fallback for development (zero config required)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Three.js, GSAP |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Real-time | Socket.io, SimplePeer (WebRTC) |
| Auth | JWT, Passport.js, Google OAuth 2.0 |
| Payments | Razorpay |
| File Storage | AWS S3 |
| Deepfake Detection | RealityDefender API + ffmpeg |
| PDF Generation | PDFKit |
| Deployment | Vercel (frontend), Render.com (backend) |
| Scheduler | node-cron (3 automated jobs) |

---

## Project Structure

```
freelock/
├── client/                   # React 18 + Vite frontend
│   ├── src/
│   │   ├── pages/            # 30 page components
│   │   ├── components/       # 17 reusable components
│   │   ├── utils/            # Hooks and helpers
│   │   ├── api/index.js      # Axios with JWT auto-injection
│   │   └── App.jsx           # React Router (20+ routes)
│   ├── vercel.json           # SPA rewrite for Vercel
│   └── vite.config.js
├── server/                   # Node.js + Express backend
│   ├── models/               # 12 Mongoose schemas
│   ├── routes/               # 12 route files (50+ endpoints)
│   ├── services/             # stateMachine.js, releaseService.js
│   ├── utils/                # s3.js, realityDefender.js, etc.
│   ├── middleware/auth.js    # JWT verification + ban check
│   ├── index.js              # App entry, socket.io, cron jobs
│   └── render.yaml           # Render.com deploy config
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Razorpay test account
- Google Cloud Console OAuth credentials

### 1. Clone
```bash
git clone https://github.com/HariomPtdr/SafeLancer.git
cd SafeLancer
```

### 2. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment variables

**server/.env** (copy from server/.env.example):
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/freelock
JWT_SECRET=your_strong_random_secret_here
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_ACCOUNT_NUMBER=1112220000xxxx
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=ap-south-1
REALITY_DEFENDER_API_KEY=your_rd_key
```

**client/.env**:
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### 4. Run
```bash
# Terminal 1 - Backend (port 5000)
cd server && npm run dev

# Terminal 2 - Frontend (port 5173)
cd client && npm run dev
```

Open http://localhost:5173

---

## Deployment

### Backend - Render.com
1. Connect GitHub repo, set root directory to **server**
2. Build: `npm install` | Start: `npm start`
3. Add all env vars above

### Frontend - Vercel
1. Connect GitHub repo, set root directory to **client**, preset: Vite
2. Add `VITE_API_URL=https://your-render-service.onrender.com`

### Google OAuth callback
Add to Google Cloud Console OAuth credentials:
```
https://your-render-service.onrender.com/api/auth/google/callback
```

---

## API Overview

| Category | Base Path | Description |
|----------|-----------|-------------|
| Auth | /api/auth | Register, login, Google OAuth, penalty payment |
| Portfolio | /api/portfolio | Profile, avatar, resume, samples |
| Jobs | /api/jobs | Post, browse, apply, hire |
| Contracts | /api/contracts | Create, view, withdraw |
| Milestones | /api/milestones | Fund, submit, review, release |
| Files | /api/files | Upload, verify hash, PDF certificate |
| Disputes | /api/disputes | Raise, evidence, resolve |
| Messages | /api/messages | Contract chat |
| Transactions | /api/transactions | Payment history |
| Ratings | /api/ratings | Post-project ratings |
| Admin | /api/admin | Stats, verification, user management |
| Contact | /api/contact | Contact form |

Full API docs: [BACKEND_API.md](./BACKEND_API.md)

---

## Wiki

Comprehensive documentation available in the [GitHub Wiki](https://github.com/HariomPtdr/SafeLancer/wiki):

- [Architecture Overview](https://github.com/HariomPtdr/SafeLancer/wiki/Architecture-Overview)
- [Escrow & Milestone System](https://github.com/HariomPtdr/SafeLancer/wiki/Escrow-and-Milestone-System)
- [Cryptographic Proof of Delivery](https://github.com/HariomPtdr/SafeLancer/wiki/Cryptographic-Proof-of-Delivery)
- [Dispute Resolution](https://github.com/HariomPtdr/SafeLancer/wiki/Dispute-Resolution)
- [API Reference](https://github.com/HariomPtdr/SafeLancer/wiki/API-Reference)
- [Deployment Guide](https://github.com/HariomPtdr/SafeLancer/wiki/Deployment-Guide)
- [Environment Variables](https://github.com/HariomPtdr/SafeLancer/wiki/Environment-Variables)

---


## License

Built for a hackathon and shared for educational purposes.

---

<p align="center">SafeLancer &mdash; Cryptographic escrow for the future of work.</p>
