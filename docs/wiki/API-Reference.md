# API Reference

Base URL: `https://your-backend.onrender.com`

All protected routes require: `Authorization: Bearer <jwt_token>`

---

## Authentication — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register with email + password |
| POST | `/api/auth/login` | No | Login, returns JWT token |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/auth/google` | No | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth redirect handler |
| POST | `/api/auth/google/complete` | No | Complete Google signup (set role, name) |
| POST | `/api/auth/pay-penalty` | Yes | Create Razorpay order for penalty |
| POST | `/api/auth/pay-penalty/confirm` | Yes | Confirm penalty payment |

---

## Portfolio — `/api/portfolio`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/portfolio` | Yes | Create or update portfolio |
| GET | `/api/portfolio/:userId` | No | Get portfolio by user ID |
| POST | `/api/portfolio/upload-avatar` | Yes | Upload profile photo (10 MB max) |
| POST | `/api/portfolio/upload-sample` | Yes | Upload portfolio work sample (10 MB max) |
| POST | `/api/portfolio/upload-resume` | Yes | Upload resume PDF (10 MB max) |
| PATCH | `/api/portfolio/payout-details` | Yes | Update bank/UPI payout info |

---

## Jobs — `/api/jobs`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/jobs` | No | Browse all open jobs (paginated) |
| POST | `/api/jobs` | Yes (client) | Post a new job |
| GET | `/api/jobs/my-jobs` | Yes | Get current user's jobs |
| GET | `/api/jobs/:id` | No | Get job detail with bids |
| POST | `/api/jobs/:id/apply` | Yes (freelancer) | Submit bid with proposal |
| GET | `/api/jobs/:id/applications` | Yes (client) | List all bids |
| PATCH | `/api/jobs/:id/applications/:bidId/shortlist` | Yes (client) | Shortlist a bid |
| PATCH | `/api/jobs/:id/applications/:bidId/hire` | Yes (client) | Hire freelancer, create contract |
| PATCH | `/api/jobs/:id/applications/:bidId/reject` | Yes (client) | Reject a bid |

---

## Contracts — `/api/contracts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/contracts/my-contracts` | Yes | List user's contracts (as client) |
| GET | `/api/contracts/my-work` | Yes | List user's contracts (as freelancer) |
| GET | `/api/contracts/:id` | Yes | Get full contract with milestones |
| GET | `/api/contracts/:id/withdraw-preview` | Yes | Preview withdrawal penalties |
| POST | `/api/contracts/:id/withdraw` | Yes | Withdraw from contract |

---

## Milestones — `/api/milestones`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/milestones/contract/:contractId` | Yes | Get all milestones for a contract |
| GET | `/api/milestones/:id` | Yes | Get single milestone |
| POST | `/api/milestones/:id/fund` | Yes (client) | Create Razorpay order (escrow funding) |
| POST | `/api/milestones/:id/verify-payment` | Yes | Verify payment completed |
| POST | `/api/milestones/:id/submit` | Yes (freelancer) | Submit deliverable (file + video) |
| GET | `/api/milestones/:id/ai-check` | Yes | Get RealityDefender deepfake result |
| POST | `/api/milestones/:id/ai-recheck` | Yes | Force recheck video |
| POST | `/api/milestones/:id/extend-deadline` | Yes | Request deadline extension |
| POST | `/api/milestones/:id/review` | Yes (client) | Approve or reject submission |
| POST | `/api/milestones/:id/release` | Yes (client) | Release payment to freelancer |
| GET | `/api/milestones/file/:id/:type` | Yes* | Protected file download (token in header or `?token=`) |

*Supports `Authorization: Bearer` header or `?token=` query param for `<a>` download links.

---

## Files — `/api/files`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/files/upload` | Yes | Upload file and get SHA-256 hash |
| POST | `/api/files/verify-hash` | No | Verify a SHA-256 hash (public) |
| GET | `/api/files/certificate/:hash` | No | Generate PDF certificate of delivery |

---

## Disputes — `/api/disputes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/disputes/raise` | Yes | Manually raise a dispute |
| POST | `/api/disputes/:id/evidence` | Yes | Submit text evidence |
| POST | `/api/disputes/:id/evidence-file` | Yes | Upload evidence file (20 MB max) |
| PATCH | `/api/disputes/:id/resolve` | Yes (admin) | Resolve dispute (release/refund/split) |

**Resolve payload:**
```json
{
  "resolution": "release_to_freelancer | refund_to_client | split",
  "splitPercent": 60
}
```

---

## Messages — `/api/messages`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/messages/:contractId` | Yes | Get all messages for a contract |
| POST | `/api/messages/mark-read/:contractId` | Yes | Mark messages as read |

---

## Transactions — `/api/transactions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/transactions/:contractId` | Yes | Get payment history for a contract |

---

## Ratings — `/api/ratings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/ratings/:userId` | No | Get ratings for a user |
| POST | `/api/ratings` | Yes | Submit a rating after project |

---

## Admin — `/api/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/freelancers/pending` | Admin | Pending verification queue |
| POST | `/api/admin/freelancers/:id/verify` | Admin | Approve freelancer verification |
| GET | `/api/admin/disputes/:id/full` | Admin | Full dispute context |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users/:userId/ban` | Admin | Ban a user |
| POST | `/api/admin/users/:userId/unban` | Admin | Unban a user |
| GET | `/api/admin/payments` | Admin | All payment transactions |

---

## Contact — `/api/contact`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/contact` | No | Submit contact form |
| GET | `/api/contact` | Admin | View all contact messages |
| PATCH | `/api/contact/:id/read` | Admin | Mark message as read |

---

## Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Returns `{ status: "ok", time: "..." }` |
