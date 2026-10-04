# Future Scope & Strategic Roadmap: Qontro

**Document Reference:** QONTRO-ROADMAP-V1.0  
**Planning Horizon:** 2026–2028 (Phases 2 through 4)  
**Target Market:** Digital Agencies, Technical Consultancies, and Boutique Studios  
**Status:** Approved for Post-Launch Development  

---

## 1. Executive Summary

Qontro Version 1.0 establishes the foundational operational core: multi-tenant workspace isolation, optimistic Kanban execution boards, verified team skill graphs, company knowledge management, lightweight financial ledgers, and human-in-the-loop DeepSeek-V4 AI triage. 

This document outlines the strategic engineering roadmap for scaling Qontro from an agency operations system into an end-to-end enterprise platform.

```
+-------------------------------------------------------------------------+
|                       QONTRO SCALING ROADMAP                            |
|                                                                         |
|  [Phase 1: V1.0 Core] -> [Phase 2: 3-6 Months] -> [Phase 3: 6-12 Mo]    |
|  - Cockpit Triage         - Client Magic Links     - Git Integration    |
|  - Skill Kanban           - Stripe Webhooks        - Desktop Agent      |
|  - Company Memory         - Supabase Realtime WSS  - Multi-Model AI     |
|  - Finance Lite           - Tiptap Rich Text       - Automated Retainers|
|  - DeepSeek-V4 Triage                                                   |
+-------------------------------------------------------------------------+
```

---

## 2. Phase 2: Short-Term Enhancements (3 to 6 Months)

### 2.1 External Client Portal via Passwordless Magic Links
- **Objective:** Give agency clients direct, scoped visibility into active deliverables without giving them access to internal team discussions or financial margins.
- **Architecture:** 
  - Generate cryptographically secure, time-limited magic links (`/portal/[token]`).
  - Strict RLS policy permitting client sessions to query only tasks marked `is_client_visible = true` and finalized invoices.
  - Client milestone sign-off with digital signature capture.

### 2.2 Native Stripe & Payment Gateway Reconciliation
- **Objective:** Eliminate manual invoice status toggling by automating payment settlement.
- **Architecture:**
  - Next.js webhook route handler (`/api/webhooks/stripe`) listening for `invoice.paid` and `payment_intent.succeeded` events.
  - Automatic invoice status mutation from `sent` to `paid` with transaction ID logging in PostgreSQL.

### 2.3 Multi-User Realtime Collaboration (Supabase Realtime WebSockets)
- **Objective:** Enable multiple project managers and developers to view live Kanban card movements without refreshing the page.
- **Architecture:**
  - Connect Zustand store to Supabase PostgreSQL changefeeds (`supabase.channel('workspace_tasks')`).
  - Implement operational transformation / last-write-wins conflict resolution on concurrent task updates.

### 2.4 Enhanced Rich-Text SOP Editor (Tiptap Integration)
- **Objective:** Upgrade Company Memory from standard markdown to a block-based WYSIWYG editor supporting embedded media, checklists, callouts, and code snippets.

---

## 3. Phase 3: Medium-Term Expansion (6 to 12 Months)

### 3.1 Git Provider Integration (GitHub / GitLab / Bitbucket)
- **Objective:** Link actual code delivery directly to sprint tasks.
- **Architecture:**
  - Webhook integration matching commit messages containing task IDs (e.g. `feat: [TSK-104] implement RLS migration`).
  - Automatically transitions tasks from `doing` to `review` when pull requests open, and to `completed` when PRs merge into main branches.

### 3.2 Desktop Time Tracking & Telemetry Companion
- **Objective:** Provide automated, non-invasive work telemetry for remote agency teams.
- **Architecture:**
  - Lightweight desktop companion built in Rust / Tauri for macOS, Windows, and Linux.
  - Automatically correlates active application windows (Figma, VS Code, Terminal) with assigned tasks, updating member workload percentages dynamically.

### 3.3 Multi-Model AI Routing Engine
- **Objective:** Optimize AI inference cost and latency based on task complexity.
- **Architecture:**
  - Low-latency / High-frequency tasks (daily priority sorting): **DeepSeek-V4-Flash** or **Gemini 2.0 Flash**.
  - Complex contract analysis & scope negotiation: **Claude 3.7 Sonnet** or **OpenAI o3-mini**.
  - Internal router dispatches requests dynamically based on payload token size and complexity tier.

### 3.4 Automated Retainer Billing & Smart Payment Reminders
- **Objective:** Automate recurring monthly retainers and late invoice follow-ups.
- **Architecture:**
  - Scheduled cron triggers generating monthly recurring invoices on the 1st of each month.
  - Automated client email reminders triggered at 3 days before due date, on due date, and 7 days overdue with custom payment links.

---

## 4. Phase 4: Long-Term Enterprise Scaling (12 to 24 Months)

### 4.1 Enterprise Security & Compliance Hardening
- Implement immutable write-once audit logging for SOC2 Type II and ISO 27001 certification.
- Support SAML 2.0 / Single Sign-On (SSO) integration with Okta, Google Workspace, and Microsoft Azure AD.

### 4.2 Self-Hosted Enterprise Appliance
- Packaged Kubernetes Helm charts and Docker Compose manifests allowing enterprise defense, healthcare, and financial clients to self-host Qontro within isolated private clouds (VPC).

### 4.3 Public Developer API & Webhook Ecosystem
- RESTful public API with developer API keys and rate limiting (`https://api.qontro.io/v1`).
- Custom webhook triggers allowing agencies to connect Qontro events into Zapier, Make, and internal Slack bots.

---

## 5. Technical Scalability Projections

| Scale Metric | V1.0 Current Capacity | Phase 2 Target | Phase 4 Enterprise Target |
| :--- | :--- | :--- | :--- |
| **Concurrent Active Workspaces** | 500 | 5,000 | 50,000+ |
| **Tasks Tracked per Workspace** | 5,000 | 50,000 | 500,000+ |
| **Database Architecture** | Single Postgres Instance | Postgres + Read Replicas | Sharded Postgres / Citus Clusters |
| **AI Inference Latency** | 1.8s – 2.4s | < 1.0s (Edge Streaming) | < 500ms (Dedicated Edge Models) |
| **Global Availability** | Single Region (US-East) | Multi-Region Edge Caching | Global Active-Active Clusters |
