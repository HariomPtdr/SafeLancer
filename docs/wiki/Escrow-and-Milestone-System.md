# Escrow & Milestone System

## Overview

Every paid deliverable in SafeLancer is protected by a milestone escrow. Funds are locked before work begins and released only when the client approves — or automatically after 72 hours of inactivity.

---

## 11-State Machine

Each milestone transitions through exactly these states:

```
pending_deposit
      │
      ▼ (client funds via Razorpay)
   funded
      │
      ▼ (freelancer starts work)
  in_progress
      │
      ▼ (freelancer submits file + video)
  submitted ──────────────────────────────┐
      │                                   │ (72hr no review)
      ▼ (client reviews)                  ▼
   review                           auto-released
      │
      ├──▶ approved ──▶ released (client releases payment)
      │
      ├──▶ inaccurate_1 ──▶ (freelancer resubmits)
      │         │
      │         ▼ (second rejection)
      └──▶ disputed ──▶ resolved (admin)
```

### State Descriptions

| State | Who triggers | What happens |
|-------|-------------|--------------|
| `pending_deposit` | System (on hire) | Milestone created, waiting for client to fund |
| `funded` | Client (Razorpay payment verified) | Escrow locked, freelancer notified |
| `in_progress` | Freelancer (starts work) | Work period begins, deadline clock starts |
| `submitted` | Freelancer (uploads file + video) | SHA-256 hashes computed, `autoReleaseAt = now + 72h` set |
| `review` | System (after submission) | Client has 72 hours to approve or reject |
| `approved` | Client | `paymentDueAt = now + 48h`, client must release within 48h |
| `released` | Client or auto-release | Freelancer payout triggered via Razorpay |
| `inaccurate_1` | Client (first rejection) | Freelancer must resubmit with corrections |
| `disputed` | System (second rejection) or manual | Dispute auto-created with compiled evidence |
| `refunded` | Admin (dispute resolution) | Client refunded via Razorpay |

---

## Sequential Phase Funding

Projects are broken into numbered phases. **Phase N cannot be funded until Phase N-1 is in `approved` or `released` status.**

This prevents clients from trying to pay for later work before earlier work is verified.

---

## Auto-Release (72 Hours)

When a freelancer submits deliverables, the system sets `autoReleaseAt = now + 72 hours`.

A cron job runs every hour at `:00`. Any milestone in `review` status past its `autoReleaseAt` timestamp is automatically released — the freelancer receives their payment without the client needing to act.

**Why?** Prevents the client from ghosting after good work is delivered.

---

## Advance Payment

The first milestone in every contract is an **advance payment** (typically 10–25% of total contract value, set during job posting). This:
- Signals genuine intent from the client
- Provides working capital to the freelancer
- Is marked with `isAdvance: true` in the Milestone model

---

## Platform Fee Structure

| Party | Fee | Example (₹10,000 milestone) |
|-------|-----|-----|
| Client pays | +2% added to deposit | ₹10,200 |
| Freelancer receives | -2% deducted from payout | ₹9,800 |
| Platform earns | 2% + 2% = 4% | ₹400 |

---

## Deadline Extensions

Either party can request a deadline extension. Extensions are stored in `milestone.deadlineExtensions[]` and become part of the auto-compiled dispute evidence if a dispute is raised.

---

## Revision Limits

Each phase has a configurable `maxRevisions` value set during job creation. The `inaccuracyCount` on each milestone tracks how many times the client has rejected the submission. Exceeding `maxRevisions` auto-raises a dispute.
