# Dispute Resolution

## Overview

SafeLancer's dispute system protects both parties when a contract goes wrong. Disputes can be raised manually or auto-triggered by the system. An admin resolves each dispute using auto-compiled cryptographic evidence.

---

## When a Dispute is Raised

### Auto-triggered (second rejection)
When a client rejects a milestone submission for the **second time** (`inaccuracyCount >= maxRevisions`), the system automatically:
1. Transitions the milestone to `disputed`
2. Creates a Dispute record
3. Compiles evidence from the milestone history

### Manual dispute
Either the client or freelancer can raise a dispute at any time via the contract dashboard.

### Deadline breach
If a freelancer is 3+ days overdue, the system auto-raises a `deadline_breach` dispute.

### Payment default
If a client misses the 48-hour payment window, the system raises a `payment_default` dispute.

---

## Auto-Compiled Evidence

When a dispute is created, the system reads the milestone history and compiles:

```javascript
evidenceSummary: {
  submissionHashes:       ["sha256_of_file", "sha256_of_video"],
  deadlineExtensionCount: 2,
  inaccuracyNotes:        ["First rejection: missing tests", "Second rejection: wrong API"],
  autoCompiled:           true,
  compiledAt:             Date
}
```

This evidence is **immutable** — it reflects the state at the time of dispute creation and cannot be altered.

---

## Submitting Additional Evidence

After a dispute is raised, both parties can submit supporting evidence via the contract dashboard:

- **Text statements** — `POST /api/disputes/:id/evidence`
- **File uploads** — `POST /api/disputes/:id/evidence-file` (20 MB max, stored on S3)

Evidence is stored in `dispute.evidence[]`:
```javascript
{
  submittedBy: userId,
  description: "Here is the original requirements document...",
  fileUrl: "https://s3.../evidence/...",
  submittedAt: Date
}
```

---

## Admin Resolution

The admin reviews the full dispute context (available at `GET /api/admin/disputes/:id/full`) which includes:
- Complete milestone history and status transitions
- All submission hashes
- Deadline extension records
- Both parties' profiles and ratings
- All submitted evidence

The admin resolves via `PATCH /api/disputes/:id/resolve`:

```json
{
  "resolution": "release_to_freelancer | refund_to_client | split",
  "splitPercent": 60
}
```

| Resolution | What happens |
|-----------|-------------|
| `release_to_freelancer` | Full milestone amount paid out to freelancer via Razorpay |
| `refund_to_client` | Full milestone amount refunded to client via Razorpay |
| `split` | `splitPercent`% to client, remainder to freelancer |

---

## Admin Dashboard — Dispute Modal

The admin dashboard (`/admin` → Disputes tab) shows a resolution modal with:

- Side-by-side party comparison (name, rating, history)
- Auto-compiled evidence panel (hashes, deadlines, notes)
- Evidence timeline (text + file submissions from both parties)
- Split percentage slider
- Resolution buttons

---

## Dispute Types

| Type | Trigger |
|------|---------|
| `milestone` | Auto on second client rejection |
| `manual` | Either party raises via contract dashboard |
| `withdrawal` | Client withdraws mid-contract |
| `deadline_breach` | Freelancer 3+ days overdue |
| `payment_default` | Client misses 48-hour payment window |
| `freelancer_exit` | Freelancer abandons contract |
