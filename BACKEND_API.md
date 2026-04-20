# FreeLock — Backend & API Reference

## Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (7-day tokens, stored in `localStorage`)
- **Realtime**: Socket.io
- **File storage**: Local `/uploads` via Multer (max 50 MB per file)
- **Payments**: Razorpay (test-mode auto-detects missing/placeholder key)
- **PDF generation**: PDFKit (delivery certificates)
- **Scheduling**: node-cron (hourly auto-release job)

**Start server**: `cd server && node index.js` (port from `.env PORT`, fallback 5000)

---

## Auth Middleware (`middleware/auth.js`)

Every protected route uses the `auth` middleware:

```
Authorization: Bearer <jwt-token>
```

- Decodes token → sets `req.user = { id, role, name }`
- Returns `401` if header is missing or token is invalid

---

## Route Files & Mount Points

| Mount point | File |
|-------------|------|
| `/api/auth` | `routes/auth.js` |
| `/api/portfolio` | `routes/portfolio.js` |
| `/api/jobs` | `routes/jobs.js` |
| `/api/demos` | `routes/demos.js` |
| `/api/negotiations` | `routes/negotiations.js` |
| `/api/contracts` | `routes/contracts.js` |
| `/api/milestones` | `routes/milestones.js` |
| `/api/files` | `routes/files.js` |
| `/api/disputes` | `routes/disputes.js` |
| `/api/ratings` | `routes/ratings.js` |
| `/api/messages` | `routes/messages.js` |
| `/api/health` | inline in `index.js` |
| `/uploads/*` | static file serving |

---

## API Endpoints

### Auth — `/api/auth`

#### `POST /api/auth/register`
**Public** | Creates a new user + blank portfolio entry.

Request body:
```json
{ "name": "string", "email": "string", "password": "string", "role": "client|freelancer" }
```

Validations:
- Name: 2–50 chars
- Email: basic regex
- Role: must be `client` or `freelancer` (cannot register as admin)
- Password: min 8 chars, must contain uppercase, lowercase, digit, and special char

Response `201`:
```json
{ "token": "jwt", "user": { "id", "name", "email", "role" } }
```

---

#### `POST /api/auth/login`
**Public** | Returns JWT on valid credentials.

Request body:
```json
{ "email": "string", "password": "string" }
```

Brute-force protection:
- 5 failed attempts → account locked for 15 minutes
- Responds `423` with minutes remaining when locked

Response `200`:
```json
{ "token": "jwt", "user": { "id", "name", "email", "role", "rating" } }
```

---

#### `GET /api/auth/me`
**Auth required** | Returns current user + portfolio. Recalculates `completionPercent` on every call.

Response `200`:
```json
{ "user": { ...userDoc }, "portfolio": { ...portfolioDoc } }
```

---

### Portfolio — `/api/portfolio`

#### `GET /api/portfolio/:userId`
**Public** | Returns portfolio + populated user stats.

Populates: `user { name, email, role, rating, totalJobsCompleted, onTimeDeliveryRate }`

---

#### `POST /api/portfolio/update`
**Auth required** | Upserts own portfolio fields.

Request body (all optional):
```json
{
  "bio", "skills": [], "githubUrl", "linkedinUrl", "portfolioUrl",
  "hourlyRate", "availability", "companyName", "industry"
}
```

Automatically recalculates `completionPercent` before saving.

---

#### `POST /api/portfolio/upload-sample`
**Auth required** | Multipart upload. Adds a project sample entry.

Form fields: `file` (binary), `title` (string, optional), `description` (string, optional)

Computes SHA-256 hash of file. Returns:
```json
{ "sample": { "title", "description", "fileUrl", "fileHash", "uploadedAt" }, "portfolio": {...}, "completionPercent": 0 }
```

---

#### `POST /api/portfolio/upload-resume`
**Auth required** | Multipart upload. Sets `resumeUrl` on portfolio.

Form field: `resume` (binary)

Returns: `{ "resumeUrl", "portfolio", "completionPercent" }`

---

### Jobs — `/api/jobs`

> **Route ordering note**: Named routes (`/my-jobs`, `/my-applications`, `/freelancers/browse`) are defined BEFORE `/:id` to prevent Express matching them as IDs.

#### `POST /api/jobs`
**Auth — client only** | Creates a new job listing.

Request body:
```json
{ "title", "description", "budget": 0, "skills": [], "deadline": "ISO date" }
```

---

#### `GET /api/jobs`
**Public** | Lists all `open` jobs with optional filters.

Query params:
- `search` — regex on title (case-insensitive)
- `skills` — comma-separated, MongoDB `$in`
- `minBudget` / `maxBudget` — numeric range

Sorted by `createdAt` descending.

---

#### `GET /api/jobs/my-jobs`
**Auth required** | Client's own posted jobs (all statuses).

Populates: `bids.freelancer { name, rating, totalJobsCompleted }`

---

#### `GET /api/jobs/my-applications`
**Auth — freelancer only** | All jobs the freelancer has bid on.

Returns array of:
```json
{
  "job": { "_id", "title", "budget", "client" },
  "bid": { ...bidFields },
  "contractId": "objectId | null",
  "negotiationId": "objectId | null"
}
```

`contractId` filled if `bid.status === 'hired'`, `negotiationId` filled if `bid.status === 'negotiating'`.

---

#### `GET /api/jobs/:id`
**Public** | Single job detail.

Populates: `client { name, email, rating, totalJobsCompleted }`, `bids.freelancer { name, rating, totalJobsCompleted }`

---

#### `POST /api/jobs/:id/apply`
**Auth — freelancer only** | Apply to a job (cover letter only, no price).

Request body:
```json
{ "proposal": "cover letter text" }
```

Creates bid with status `applied`. Fails if already applied or job is not `open`.

---

#### `GET /api/jobs/:id/applications`
**Auth — client only (job owner)** | All applicants with portfolio data.

Returns:
```json
{
  "job": { "_id", "title", "budget", "status" },
  "applications": [ { ...bid, "portfolio": {...} } ]
}
```

---

### Hiring Pipeline Actions (all: Auth — client only, job owner)

#### `PATCH /api/jobs/:id/applications/:bidId/shortlist`
Moves bid `applied` → `shortlisted`. Sets `shortlistedAt`.

#### `PATCH /api/jobs/:id/applications/:bidId/schedule-interview`
Moves bid `shortlisted` → `interview_scheduled`. Generates `meetingRoomId = 'interview-' + uuid`.

Request body: `{ "scheduledAt": "ISO date" }` (required)

#### `PATCH /api/jobs/:id/applications/:bidId/interview-done`
Moves bid `interview_scheduled` → `interviewed`. Sets `interviewDoneAt`.

#### `PATCH /api/jobs/:id/applications/:bidId/hire`
Requires `bid.status === 'interviewed'`. Creates Contract at `job.budget` with:
- `milestoneCount: 3`, `timeline: 30 days`
- Auto-generates milestones (advance 10% + 3 phases)
- Rejects all other non-hired/non-rejected bids
- Sets `job.status = 'in_progress'`

Response: `{ "contract", "job" }`

#### `PATCH /api/jobs/:id/applications/:bidId/negotiate`
Requires `bid.status === 'interviewed'`. Creates Negotiation with `job.budget` as first round offer.

Sets `bid.status = 'negotiating'`. Response: `{ "negotiationId", "job" }`

#### `PATCH /api/jobs/:id/applications/:bidId/reject`
Sets `bid.status = 'rejected'`.

Request body: `{ "reason": "optional string" }`

---

#### `GET /api/jobs/freelancers/browse`
**Public** | Filter-based freelancer discovery.

Query params:
- `skills` — comma-separated
- `minRating` — numeric
- `availability` — string match
- `maxRate` — numeric hourly rate cap

Sorted by `user.rating` descending. Only returns portfolios with `isVisible: true`.

---

### Demo Requests — `/api/demos`

#### `POST /api/demos/request`
**Auth — client only** | Send a demo/meeting request to a freelancer.

Request body:
```json
{ "freelancerId": "objectId", "message": "string", "proposedAt": "ISO date" }
```

---

#### `GET /api/demos/my-requests`
**Auth required** | Client sees their sent requests.

Populates: `freelancer { name, email, rating }`

---

#### `GET /api/demos/incoming`
**Auth required** | Freelancer sees received requests.

Populates: `client { name, email, rating }`

---

#### `PATCH /api/demos/:id/accept`
**Auth — freelancer (owns request)** | Accepts a demo request.

Generates `meetingRoomId = 'room-' + uuid`. Sets `status = 'accepted'`.

Request body: `{ "meetingAt": "ISO date" }` (optional)

---

#### `PATCH /api/demos/:id/reject`
**Auth — freelancer (owns request)** | Sets `status = 'rejected'`.

Request body: `{ "reason": "optional string" }`

---

#### `PATCH /api/demos/:id/complete`
**Auth required** | Marks demo as completed.

Request body: `{ "convertedToJob": bool, "jobId": "objectId" }` (optional)

---

### Negotiations — `/api/negotiations`

#### `POST /api/negotiations/start`
**Auth — client only** | Starts a negotiation from scratch (direct API call, not from pipeline).

Request body:
```json
{
  "jobId": "objectId",
  "freelancerId": "objectId",
  "initialOffer": {
    "amount": 0,
    "timeline": 30,
    "milestoneCount": 3,
    "scope": "string",
    "message": "string"
  }
}
```

Creates Negotiation with `currentRound: 1`, `maxRounds: 4`, expires in 48 hours.

---

#### `GET /api/negotiations/my-negotiations`
**Auth required** | All negotiations for the current user (client or freelancer).

Populates: `job { title }`, `client { name }`, `freelancer { name }`

---

#### `GET /api/negotiations/:id`
**Auth required** | Single negotiation detail.

Populates: `job`, `client`, `freelancer`, `rounds.proposedBy { name, role }`

---

#### `POST /api/negotiations/:id/respond`
**Auth — participant only (client or freelancer)** | Respond to an active negotiation.

Request body:
```json
{
  "action": "accept | reject | counter",
  "amount": 0,
  "timeline": 30,
  "scope": "string",
  "milestoneCount": 3,
  "message": "string"
}
```

- **accept** → marks negotiation `agreed`, auto-creates Contract + Milestones, sets job `in_progress`
- **reject** → marks negotiation `rejected`
- **counter** → adds new round; if `currentRound >= maxRounds`, expires the negotiation

Response on accept: `{ "negotiation", "contract", "milestones" }`

---

### Contracts — `/api/contracts`

#### `GET /api/contracts/my-contracts`
**Auth required** | Client's active/past contracts.

Populates: `freelancer { name, email, rating }`, `job { title }`

---

#### `GET /api/contracts/my-work`
**Auth required** | Freelancer's active/past contracts.

Populates: `client { name, email, rating }`, `job { title }`

---

#### `GET /api/contracts/:id`
**Auth — participant or admin** | Contract detail with all milestones.

Response: `{ "contract": {...}, "milestones": [...] }`

---

#### `POST /api/contracts/:id/withdraw`
**Auth — client (owner)** | Request contract withdrawal using 50% completion rule.

Completion formula:
```
completionRatio = (approved_milestones + in_progress_milestones * 0.5) / total_milestones
```

- `completionRatio <= 0.5` → free withdrawal. All `funded`/`in_progress` milestones refunded via Razorpay, contract set to `withdrawn`.
- `completionRatio > 0.5` → blocked. Returns `allowed: false` with amount owed.

Response:
```json
{ "allowed": bool, "completionPercent": 0, "amountOwed": 0, "message": "string" }
```

---

### Milestones — `/api/milestones`

#### `GET /api/milestones/contract/:contractId`
**Auth required** | All milestones for a contract, sorted by `milestoneNumber`.

---

#### `GET /api/milestones/:id`
**Auth required** | Single milestone.

---

#### `POST /api/milestones/:id/fund`
**Auth — client (owner)** | Creates Razorpay order; transitions `pending_deposit → funded`.

Test mode (no real key): generates `order_test_<timestamp>` instead.

Response includes `razorpayOrderId` and `razorpayKeyId` for frontend checkout.

---

#### `POST /api/milestones/:id/verify-payment`
**Auth — client (owner)** | Verifies Razorpay signature after successful checkout; saves `razorpayPaymentId`.

Request body:
```json
{ "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }
```

---

#### `POST /api/milestones/:id/start`
**Auth — freelancer (owner)** | Transitions `funded → in_progress`.

---

#### `POST /api/milestones/:id/submit`
**Auth — freelancer (owner)** | Multipart upload. Computes SHA-256 hash.

Form fields: `file` (binary, optional), `submissionNote` (string), `fileHash` (if no file uploaded), `fileUrl`

Performs TWO sequential transitions: `in_progress → submitted → review`
- `submitted` sets `submittedAt` + `autoReleaseAt` (72 hours later)
- Returns milestone in `review` state

---

#### `POST /api/milestones/:id/review`
**Auth — client (owner)** | Approve or reject submitted work.

Request body:
```json
{ "approved": bool, "note": "string", "inaccuracyNote": "string", "newDeadline": "ISO date" }
```

State transitions:
- `approved: true` → `review → approved`
- First rejection → `review → inaccurate_1`, extends deadline 7 days
- Second rejection → `review → inaccurate_2 → disputed`, auto-creates `Dispute` doc

---

#### `POST /api/milestones/:id/release`
**Auth — client (owner)** | Releases payment. Transitions `approved → released`.

Special rule: if `milestoneNumber === 1` (Phase 1), also releases the advance milestone (`milestoneNumber === 0, isAdvance: true`) if it is in `approved` state.

---

#### `POST /api/milestones/:id/schedule-meeting`
**Auth required** | Schedules a video meeting for this milestone.

Request body: `{ "scheduledAt": "ISO date" }`

Sets `meetingRoomId = 'milestone-' + uuid`, `meetingStatus = 'scheduled'`.

---

### Files — `/api/files`

#### `POST /api/files/upload`
**Auth required** | General file upload. Returns SHA-256 hash.

Form field: `file` (binary, max 50 MB)

Response: `{ "fileHash", "fileUrl", "fileName", "message" }`

---

#### `POST /api/files/verify-hash`
**Public** | Verify a SHA-256 hash against the platform database.

Request body: `{ "fileHash": "string" }`

Response:
```json
{
  "verified": true,
  "client": "name",
  "freelancer": "name",
  "milestoneTitle": "string",
  "contractHashId": "string",
  "amount": 0,
  "status": "string",
  "submittedAt": "date",
  "releasedAt": "date",
  "fileHash": "string"
}
```

---

#### `GET /api/files/certificate/:hash`
**Public** | Downloads a PDF proof-of-delivery certificate for the given SHA-256 hash.

Returns: `application/pdf` — contains client name, freelancer name, milestone details, amount, status, and the full SHA-256 hash.

---

### Disputes — `/api/disputes`

#### `POST /api/disputes/raise`
**Auth required** | Manually raise a dispute on a contract/milestone.

Request body:
```json
{ "contractId": "objectId", "milestoneId": "objectId (optional)", "reason": "string", "type": "milestone|manual|withdrawal" }
```

If `milestoneId` provided, sets milestone `status = 'disputed'`.

---

#### `POST /api/disputes/:id/evidence`
**Auth required** | Add evidence to an open dispute.

Request body: `{ "description": "string", "fileUrl": "string (optional)" }`

---

#### `PATCH /api/disputes/:id/resolve`
**Auth — admin only** | Resolve a dispute.

Request body:
```json
{ "resolution": "release_to_freelancer | refund_to_client | split", "splitPercent": 0 }
```

Side effects:
- `release_to_freelancer` → milestone `status = 'released'` (Razorpay Payouts in live mode)
- `refund_to_client` → calls `razorpay.payments.refund()`, milestone `status = 'refunded'`

---

#### `GET /api/disputes/admin/all`
**Auth — admin only** | All disputes platform-wide.

Populates: `contract { hashId, amount }`, `milestone { title, amount, status, inaccuracyNote }`, `raisedBy { name, email, role }`

---

#### `GET /api/disputes/contract/:contractId`
**Auth required** | All disputes for a specific contract.

Populates: `raisedBy { name }`, `milestone { title }`

---

### Ratings — `/api/ratings`

#### `POST /api/ratings/submit`
**Auth required** | Submit a rating after contract work.

Request body:
```json
{
  "contractId": "objectId",
  "milestoneId": "objectId (optional)",
  "ratedUserId": "objectId",
  "stars": 1–5,
  "communication": 1–5,
  "quality": 1–5,
  "timeliness": 1–5,
  "professionalism": 1–5,
  "review": "string"
}
```

Role auto-detected from `req.user.role`. Recalculates rolling average for the rated user and updates `User.rating` + `User.totalJobsCompleted`.

---

#### `GET /api/ratings/user/:userId`
**Public** | All visible ratings for a user, sorted by newest first.

Populates: `ratedBy { name, role }`

---

#### `GET /api/ratings/contract/:contractId`
**Auth required** | All ratings for a contract.

Populates: `ratedBy { name, role }`

---

### Messages — `/api/messages`

#### `GET /api/messages/:contractId`
**Auth required** | Last 100 messages for a contract, sorted ascending.

---

#### `POST /api/messages/mark-read/:contractId`
**Auth required** | Marks all unread messages in the contract as read by the current user.

---

### Health Check

#### `GET /api/health`
**Public** | Returns `{ "status": "ok", "time": "<ISO date>" }`

---

## Socket.io Events

Server runs on same port as HTTP. Client connects once; all rooms are joined via events.

### Contract Chat Room

| Client emits | Payload | Server action |
|---|---|---|
| `join-room` | `contractId` | `socket.join(contractId)` |
| `send-message` | `{ contractId, senderId, senderName, senderRole, text, type, meetingData? }` | Saves `Message` doc, broadcasts `receive-message` to room |
| `typing` | `{ contractId, name }` | Broadcasts `user-typing` to room |
| `stop-typing` | `{ contractId }` | Broadcasts `user-stop-typing` to room |
| `request-meeting` | `{ contractId, ...data }` | Broadcasts `meeting-requested` to room |
| `respond-meeting` | `{ contractId, ...data }` | Broadcasts `meeting-response` to room |
| `call-user` | `{ contractId, signal, from }` | Broadcasts `incoming-call` to room |
| `accept-call` | `{ contractId, signal }` | Broadcasts `call-accepted` to room |
| `end-call` | `{ contractId }` | Broadcasts `call-ended` to room |

### Pre-Contract Interview Room

| Client emits | Payload | Server action |
|---|---|---|
| `join-interview` | `meetingRoomId` | `socket.join(meetingRoomId)` |
| `send-interview-message` | `{ roomId, senderId, senderName, senderRole, text }` | Broadcasts `receive-message` to room — **NOT saved to DB** |

> Interview room reuses `call-user`, `accept-call`, `end-call` — pass `meetingRoomId` as the `contractId` field in those payloads.

---

## Milestone State Machine (`services/stateMachine.js`)

All routes must call `milestoneTransition(id, nextState)` — never set `status` directly.

```
pending_deposit
    └─► funded
            └─► in_progress
                    └─► submitted         ← sets submittedAt, autoReleaseAt (+72h)
                            └─► review
                                  ├─► approved
                                  │       └─► released   ← sets releasedAt
                                  ├─► inaccurate_1
                                  │       └─► submitted  (freelancer retries)
                                  ├─► inaccurate_2
                                  │       └─► disputed
                                  │               ├─► released
                                  │               └─► refunded
                                  └─► released     (auto-release path)
```

Auto-release: `node-cron` job runs hourly (`0 * * * *`). Finds milestones in `review` with `autoReleaseAt <= now` and calls `milestoneTransition(id, 'released')`.

---

## Milestone Auto-Generation Logic

Used in two places: `routes/jobs.js` (direct hire) and `routes/negotiations.js` (negotiation accept).

Given `contract.amount`, `contract.milestoneCount`, `contract.timeline`:

```
Advance (milestoneNumber=0, isAdvance=true)
  amount = round(total * 0.10)
  deadline = now + 7 days

Phase 1..N (milestoneNumber=1..N)
  phaseAmount = round(total * 0.90 / count)
  last phase gets remainder to avoid rounding gaps
  deadline = now + (daysPerPhase * phaseNumber)
```

---

## Business Rules Summary

| Rule | Detail |
|---|---|
| Advance unlock | Advance (milestone #0) stays `approved` until Phase 1 (`milestoneNumber=1`) is **released** |
| Auto-dispute | 2nd client rejection on same milestone → auto `Dispute` doc + `status = disputed` |
| Withdrawal threshold | `completionRatio = (released + in_progress*0.5) / total`. Free if ≤ 0.5; blocked otherwise |
| Auto-release | 72 hours after `submitted` → cron releases if client hasn't reviewed |
| SHA-256 proof | Every submission hashes the file buffer; hash stored as `submissionFileHash` |
| Contract hashId | `SHA-256(_id + Date.now()).substring(0,16).toUpperCase()` |
| Rolling rating | Recalculated from all `Rating` docs for the user on each new submission |
| Razorpay test mode | Triggered when `RAZORPAY_KEY_ID` is missing or contains `'placeholder'` |
| Bid has no amount | Freelancers submit proposal text only; contract amount always comes from `job.budget` or negotiation |
| Max negotiation rounds | 4 rounds maximum; exceeding returns `status = expired` |

---

## Environment Variables

| Variable | Used for |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Token signing |
| `PORT` | Server listen port (default 5000) |
| `RAZORPAY_KEY_ID` | Razorpay API key (omit or use `placeholder` for test mode) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (for signature verification + refunds) |
