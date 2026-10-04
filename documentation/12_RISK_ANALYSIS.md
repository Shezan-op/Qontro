# Risk Analysis & Mitigation Strategy: Qontro

**Document Reference:** QONTRO-RISK-V1.0  
**Methodology:** Qualitative & Quantitative Risk Assessment (Failure Mode & Effects Analysis - FMEA)  
**Status:** Approved for Production Operations  

---

## 1. Risk Assessment Framework

Risks are evaluated using a standard 5x5 Probability and Impact scoring matrix:
- **Probability (P):** Scale of 1 (Rare, <5%) to 5 (Almost Certain, >80%).
- **Impact (I):** Scale of 1 (Insignificant) to 5 (Catastrophic / Total System Outage).
- **Risk Score (R):** $R = P \times I$ (Low: 1–6, Medium: 8–12, High: 15–25).

---

## 2. Risk Assessment Matrix

```
       5 |  [RSK-03]      [RSK-01]      [RSK-05]
I      4 |  [RSK-07]      [RSK-02]      [RSK-04]
M      3 |  [RSK-09]      [RSK-06]      [RSK-08]
P      2 |  [RSK-10]      [RSK-11]      [   ]
A      1 |  [   ]         [   ]         [   ]
C        +-----------------------------------------
T            1            2             3             4            5
                           P R O B A B I L I T Y
```

---

## 3. Detailed Risk Registry & Mitigation Protocols

### 3.1 Technical & Architecture Risks

#### Risk RSK-01: Cross-Tenant Data Leakage in Multi-Tenant Database
- **Probability:** 2 (Low) | **Impact:** 5 (Catastrophic) | **Risk Score:** 10 (High)
- **Description:** A flaw in application-level queries exposes one agency's proprietary project deliverables, client contracts, or financial billing records to another workspace.
- **Root Cause:** Relying solely on client-side or application-level `WHERE workspace_id = ...` filters.
- **Mitigation Protocol:**
  1. Enabled PostgreSQL Row Level Security (RLS) on all 8 tables at the database kernel level.
  2. Implemented security definer function `is_workspace_member(workspace_id)` verifying `auth.uid()` against `workspace_members`.
  3. Continuous automated penetration test cases (`TC-SEC-01` and `TC-SEC-02`) verifying zero-row returns for unauthorized cross-tenant requests.

#### Risk RSK-02: Client-Side State Divergence / UI Desynchronization
- **Probability:** 3 (Moderate) | **Impact:** 4 (Major) | **Risk Score:** 12 (High)
- **Description:** Rapid drag-and-drop actions on the Kanban board result in visual card state differing from the persisted database state due to failed background network calls.
- **Mitigation Protocol:**
  1. Implemented Zustand optimistic updates with snapshot rollback mechanisms on network catch blocks.
  2. Applied debounce locks on rapid card drag events to prevent race conditions during state persistence.
  3. Integrated automatic toast notifications alerting users if a background update fails.

#### Risk RSK-03: External AI API Latency or Outage (Ollama Cloud)
- **Probability:** 3 (Moderate) | **Impact:** 3 (Moderate) | **Risk Score:** 9 (Medium)
- **Description:** DeepSeek-V4 API becomes slow (>5s) or returns 503 during peak load, blocking the user from receiving operational triage briefings.
- **Mitigation Protocol:**
  1. Set an aggressive 4000ms fetch timeout on external API requests in `/api/ai`.
  2. Implemented a deterministic local rule-based fallback engine that evaluates workload thresholds and overdue invoices internally, returning valid operational advice with 100% uptime.

---

### 3.2 Security & Compliance Risks

#### Risk RSK-04: Session Cookie Hijacking or Stale Token Invalidation
- **Probability:** 2 (Low) | **Impact:** 4 (Major) | **Risk Score:** 8 (Medium)
- **Description:** User authentication tokens stored insecurely in local storage are susceptible to XSS extraction.
- **Mitigation Protocol:**
  1. Migrated all token persistence to `HttpOnly`, `SameSite=Lax`, `Secure` browser cookies managed by `@supabase/ssr`.
  2. Next.js edge middleware (`src/middleware.ts`) automatically intercepts and refreshes expired sessions before route rendering.

#### Risk RSK-05: AI Prompt Injection / Operational Hallucination
- **Probability:** 2 (Low) | **Impact:** 4 (Major) | **Risk Score:** 8 (Medium)
- **Description:** Malicious or ambiguous task descriptions trick the AI into recommending destructive reallocations or leaking private document content.
- **Mitigation Protocol:**
  1. Locked LLM generation temperature to `0.3` for deterministic reasoning.
  2. Hard-coded system prompt boundaries restricting the AI strictly to triage analysis.
  3. **Strict Human-in-the-Loop Barrier:** The AI has zero write permissions. All actions remain in a staging state (`ai_recommendations`) until an authenticated human clicks **Approve**.

---

### 3.3 Financial & Operational Risks

#### Risk RSK-06: Unsettled Receivables / Inaccurate Net Profit Calculations
- **Probability:** 2 (Low) | **Impact:** 3 (Moderate) | **Risk Score:** 6 (Low)
- **Description:** Floating-point arithmetic errors in invoice calculations or duplicate invoice numbers create discrepancy in client billing.
- **Mitigation Protocol:**
  1. All database currency fields use PostgreSQL `numeric(12, 2)` instead of binary floating-point numbers.
  2. Added database-level unique constraint on `(workspace_id, invoice_number)`.
  3. Invoices are linked directly to project entities, enabling automated detection of unpaid milestones before final deliverables are handed off to clients.

---

## 4. Contingency & Disaster Recovery Runbooks

| Incident Scenario | Trigger Condition | Automated Action | Manual Remediation Step |
| :--- | :--- | :--- | :--- |
| **Supabase Outage** | Database connection refused / HTTP 500. | Zustand store shifts to local in-memory fallback cache. | Inspect Supabase status dashboard; notify team via status banner. |
| **AI Gateway Failure** | Ollama Cloud returns 5xx or timeout. | Next.js route `/api/ai` catches exception and executes local heuristic triage. | Verify API key and billing quota on Ollama console. |
| **Accidental Project Deletion** | Admin triggers project deletion. | System cascade deletes child tasks while retaining audit history. | Restore project snapshot from Supabase daily PITR backup. |
