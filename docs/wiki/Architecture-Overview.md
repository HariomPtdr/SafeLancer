# Architecture Overview

## System Design

SafeLancer is a full-stack web application split into two independently deployed services.

```
┌─────────────────────────────────────────┐
│            FRONTEND (Vercel)            │
│  React 18 + Vite + Tailwind + Three.js  │
│  ┌──────────────────────────────────┐   │
│  │  React Router (20+ routes)       │   │
│  │  Axios + JWT auto-injection      │   │
│  │  Socket.io client (real-time)    │   │
│  │  SimplePeer (WebRTC video)       │   │
│  └──────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │ HTTPS / WSS
┌─────────────────▼───────────────────────┐
│            BACKEND (Render.com)         │
│         Node.js + Express.js            │
│  ┌──────────────────────────────────┐   │
│  │  12 API route modules            │   │
│  │  Socket.io server                │   │
│  │  3 node-cron scheduled jobs      │   │
│  │  Passport.js (Google OAuth)      │   │
│  │  Multer (file upload to memory)  │   │
│  └──────────────────────────────────┘   │
│       │              │            │     │
│  MongoDB          AWS S3      Razorpay  │
│  Atlas            (files)    (payments) │
└─────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend framework | React 18 | UI rendering |
| Build tool | Vite | Fast HMR, optimized builds |
| Styling | Tailwind CSS + inline styles | Utility-first + dynamic theming |
| 3D / Animation | Three.js, GSAP | Landing page hero, animations |
| HTTP client | Axios | API calls with JWT interceptor |
| Real-time | Socket.io | Chat, typing, meeting events |
| Video calls | SimplePeer (WebRTC) | P2P video interviews |
| Backend framework | Express.js | REST API |
| Database | MongoDB + Mongoose | Data persistence |
| Auth | JWT + Passport.js | Session management + Google OAuth |
| File storage | AWS S3 | Persistent file storage |
| Payments | Razorpay | Indian payment gateway |
| Deepfake detection | RealityDefender + ffmpeg | Video authenticity verification |
| PDF generation | PDFKit | Proof of delivery certificates |
| Scheduler | node-cron | Auto-release, penalty enforcement |
| Deployment (API) | Render.com | Always-on Node.js hosting |
| Deployment (Web) | Vercel | CDN-distributed React SPA |

---

## Data Flow: Milestone Escrow

```
Client                   SafeLancer API              Freelancer
  │                           │                           │
  │── POST /milestones/fund ──▶│                           │
  │   (Razorpay order)         │                           │
  │◀── order_id ──────────────│                           │
  │                           │                           │
  │── Razorpay payment ───────▶│                           │
  │── POST verify-payment ────▶│                           │
  │   ✅ funded                │── notify (socket) ───────▶│
  │                           │                           │
  │                           │◀── POST /submit ──────────│
  │                           │   (file + video)           │
  │                           │   SHA-256 hash computed    │
  │                           │   uploaded to S3           │
  │                           │   status → submitted       │
  │◀── notify (socket) ───────│                           │
  │                           │                           │
  │── POST /review ───────────▶│                           │
  │   (approve/reject)         │                           │
  │                           │── payout (Razorpay) ──────▶│
  │                           │   status → released        │
```

---

## Folder Structure

### Backend (`/server`)

```
server/
├── index.js              # App bootstrap, socket.io, cron jobs
├── middleware/
│   └── auth.js           # JWT verify + ban check
├── models/               # 12 Mongoose schemas
│   ├── User.js
│   ├── Portfolio.js
│   ├── Job.js
│   ├── Contract.js
│   ├── Milestone.js
│   ├── Dispute.js
│   ├── Message.js
│   ├── Transaction.js
│   ├── Rating.js
│   ├── ContactMessage.js
│   ├── DemoRequest.js
│   └── Negotiation.js
├── routes/               # 12 Express routers
├── services/
│   ├── stateMachine.js   # Milestone state transitions
│   └── releaseService.js # Payment release logic
└── utils/
    ├── s3.js             # AWS S3 upload utility
    ├── realityDefender.js # Deepfake detection
    ├── profileCompletion.js
    └── isTestMode.js
```

### Frontend (`/client/src`)

```
src/
├── App.jsx               # React Router with role guards
├── api/index.js          # Axios instance + JWT interceptor
├── pages/                # 30 pages (LandingPage → AdminDashboard)
├── components/           # 17 reusable components
│   ├── Navbar.jsx        # App navbar with mobile hamburger
│   ├── StaticLayout.jsx  # Layout for public pages
│   ├── AiDetectionBadge.jsx
│   ├── Hero3D.jsx
│   └── ...
└── utils/
    ├── useIsMobile.js    # Responsive hook
    └── profileCompletion.js
```

---

## Cron Jobs

Three automated jobs run on the backend server:

| Schedule | Job | Action |
|----------|-----|--------|
| `0 * * * *` (every hour) | Auto-release | Release milestones stuck in `review` past 72-hour deadline |
| `30 * * * *` | Client penalty | Apply 5% penalty to clients who miss 48-hour payment window |
| `45 * * * *` | Freelancer penalty | Penalize/ban freelancers who miss submission deadline |
