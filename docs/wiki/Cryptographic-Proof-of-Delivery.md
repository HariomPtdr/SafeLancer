# Cryptographic Proof of Delivery

## Overview

Every deliverable submitted through SafeLancer is cryptographically hashed using SHA-256. This creates an immutable, tamper-evident record that either party can verify independently — without accessing the original file.

---

## How It Works

### 1. Upload
When a freelancer submits a milestone, they upload:
- **Code/deliverable file** (up to 100 MB)
- **Demo video** (up to 100 MB)

Both files are held in memory (never written to disk before hashing).

### 2. Hash Computation
```javascript
const fileHash  = crypto.createHash('sha256').update(codeBuffer).digest('hex');
const videoHash = crypto.createHash('sha256').update(videoBuffer).digest('hex');
```

The raw file buffer is hashed — identical to hashing the file on your own machine.

### 3. Storage
The hash is stored in the Milestone document:
```
milestone.submissionFileHash  = "a3f9c2..."
milestone.submissionVideoHash = "7b1e4d..."
```

The files themselves are uploaded to AWS S3.

### 4. Verification
Anyone can verify a delivered file by:
1. Computing the SHA-256 hash of their local copy
2. Submitting it to `POST /api/files/verify-hash`
3. The API returns the matching milestone details (project, client, freelancer, date)

---

## Public Verification Endpoint

**`POST /api/files/verify-hash`** — No authentication required.

```json
// Request
{ "hash": "a3f9c2e1d4b8f7..." }

// Response (if match found)
{
  "found": true,
  "milestone": {
    "title": "Phase 1 — Backend API",
    "status": "released",
    "submittedAt": "2026-04-15T10:30:00Z"
  },
  "contract": { "hashId": "...", "amount": 10000 },
  "freelancer": { "name": "..." },
  "client": { "name": "..." }
}
```

---

## PDF Certificate of Delivery

**`GET /api/files/certificate/:hash`** — No authentication required.

Generates a downloadable PDF containing:
- SHA-256 hash of the delivered file
- Milestone title and description
- Project start/end dates
- Client and freelancer names
- SafeLancer platform signature

These certificates can be presented as legal evidence of delivery.

---

## Dispute Evidence

When a dispute is raised, the system auto-compiles:
```
evidenceSummary: {
  submissionHashes: [fileHash, videoHash],
  deadlineExtensionCount: N,
  inaccuracyNotes: ["Client rejection reason 1", ...],
  autoCompiled: true,
  compiledAt: Date
}
```

This ensures the dispute panel always has cryptographic evidence available, regardless of what either party claims.

---

## Client-Side Verification Page

`/verify/:hash` — Public page where anyone can paste a SHA-256 hash and see the matching delivery record.

---

## Security Properties

| Property | Guarantee |
|----------|-----------|
| Tamper detection | Any change to the file produces a completely different hash |
| Non-repudiation | Freelancer cannot deny delivering the file (hash was recorded at submission time) |
| Client protection | Client cannot claim a different file was delivered |
| Public verifiability | No account required to verify |
| Collision resistance | SHA-256 has no known practical collisions |
