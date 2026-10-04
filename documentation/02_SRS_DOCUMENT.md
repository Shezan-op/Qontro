# Software Requirements Specification (SRS) for Qontro

**Document Reference:** QONTRO-SRS-V2.0  
**Standard Compliance:** IEEE Std 830-1998 Format  
**Product Name:** Qontro (Multi-Tenant Founder Command Cockpit & AI Operations System)  
**Target Scope:** Boutique Agencies, Software Consultancies, and Digital Studios (3–25 members)  
**Status:** Approved for Production  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **Qontro**, a multi-tenant operations operating system engineered for boutique agencies, software consultancies, and digital product studios. It defines functional behaviors, system constraints, user roles, security baselines, and database interfaces required for engineering implementation and automated verification.

### 1.2 Scope of the System
Qontro delivers a unified operational command system combining five functional subsystems:
1. **Executive Command Cockpit:** Real-time project health scoring, cash flow risk detection, team burnout radar, and triage prompts.
2. **Execution & Task Management:** Skill-routed Kanban board, audit trails, and progress metrics.
3. **Company Memory:** Standard Operating Procedures (SOPs), contract templates, and company knowledge base with 1-click duplication.
4. **Finance Lite & Invoicing:** Receivables tracking, expense recording in minor currency units (cents), net profit estimation, and printable PDF invoice generation.
5. **AI Operations Engine:** DeepSeek-V4 LLM integration delivering human-gated workload rebalancing and risk mitigation recommendations.

### 1.3 Definitions, Acronyms, and Abbreviations
- **SOP:** Standard Operating Procedure.
- **RLS:** Row Level Security (PostgreSQL database-layer multi-tenant access control).
- **HITL:** Human-in-the-Loop governance (AI outputs require human approval before execution).
- **FCP / TTI:** First Contentful Paint / Time to Interactive.
- **SSR:** Server-Side Rendering (Next.js App Router).
- **WIP:** Work In Progress.
- **JWT:** JSON Web Token (Supabase authentication).
- **Minor Units (Cents):** Storing monetary values as 64-bit integers (`bigint`) to avoid floating-point drift.

---

## 2. Overall Description

### 2.1 Product Perspective
Qontro operates as an independent, multi-tenant SaaS application deployed to edge-ready cloud infrastructure. It replaces disparate point solutions (Jira + Notion + Wave + Slack silos) with a single normalized database schema and a consolidated web frontend.

```
+--------------------------------------------------------------------+
|                         CLIENT BROWSER                             |
|  React 19 / Next.js 16 Client App (Zustand Optimistic Store)       |
+--------------------------------------------------------------------+
                                | (HTTPS / WSS)
                                v
+--------------------------------------------------------------------+
|                     APPLICATION & EDGE ROUTING                     |
|  - Next.js Edge Middleware (`middleware.ts` session verification)  |
|  - Next.js Route Handlers (`/api/ai`, `/auth/callback`)            |
+--------------------------------------------------------------------+
                |                                    |
                v                                    v
+-------------------------------+   +--------------------------------+
|      SUPABASE POSTGRESQL      |   |       OLLAMA CLOUD / AI        |
|  - 13 Tables with RLS         |   |  - DeepSeek-V4-Flash Model     |
|  - Database Views & Triggers  |   |  - Structured Triage Payload   |
+-------------------------------+   +--------------------------------+
```

### 2.2 User Classes and Characteristics

| User Role | Description & Responsibilities | System Access Level |
| :--- | :--- | :--- |
| **Workspace Owner (Founder)** | Agency founder or executive. Reviews morning briefings, approves AI reallocations, manages billing, and oversees all projects. | Full administrative read/write/delete access across all workspace entities. |
| **Project Manager (Admin)** | Delivery leads. Creates projects, defines tasks, assigns team members based on skill graphs, and records client milestones. | Read/write access to projects, tasks, memory, and clients. Restricted from company-level billing configuration. |
| **Team Member** | Developers, designers, and copywriters. Moves task cards, logs progress, reads SOPs, and views personal skill ratings. | Read/write access to assigned tasks; read-only access to unrestricted company memory; no access to financial ledger. |
| **Client (External)** | Client stakeholders. Reviews project milestones, checks task statuses in review, and views finalized invoices. | Strictly scoped read-only access to their assigned project deliverables and invoices. |

### 2.3 Operating Environment
- **Client Platforms:** Modern web browsers (Chromium 115+, Firefox 118+, Safari 17+, Edge 115+) on Desktop (1280px+) and Mobile (375px+).
- **Backend Infrastructure:** Node.js 18+/20+ LTS runtime (Next.js 16 App Router on Turbopack / Vercel Edge).
- **Database Engine:** PostgreSQL 15+ hosted on Supabase Cloud with RLS.
- **Inference Engine:** DeepSeek-V4-Flash over Ollama Cloud REST API (`https://api.ollama.com/v1/chat/completions`).

---

## 3. Specific Functional Requirements

### 3.1 Module 1: Authentication & Workspace Multi-Tenancy

- **FR-AUTH-01 (Session Management):** The system shall manage user authentication via Supabase Auth using secure, HTTP-only cookie storage managed through `@supabase/ssr`.
- **FR-AUTH-02 (Edge Token Refresh):** Next.js edge middleware (`middleware.ts`) shall refresh expired session tokens on incoming requests without disrupting client state.
- **FR-AUTH-03 (Automated Workspace Provisioning):** On user registration, the system shall execute an atomic trigger (`handle_new_user`) creating a default workspace and owner membership record.
- **FR-AUTH-04 (Tenant Data Isolation):** The system shall enforce workspace data boundaries across all database queries using PostgreSQL Row Level Security (RLS) keys (`workspace_id`).
- **FR-AUTH-05 (Workspace Creation & Switcher):** Authenticated users shall be able to create additional workspaces and switch between them via the header dropdown, reloading workspace datasets from Supabase.

### 3.2 Module 2: Founder Command Cockpit

- **FR-CP-01 (Morning Briefing Synthesis):** The dashboard shall compute an operational briefing summarising:
  1. Count of projects with health scores below 75%.
  2. Count of overdue or blocked tasks.
  3. Total value of overdue and pending invoices.
  4. Team members with workload capacity exceeding 85%.
- **FR-CP-02 (Quick Actions):** The dashboard shall provide one-click shortcut buttons to trigger task creation, project initialization, or AI recommendation triage.
- **FR-CP-03 (Real-Time Health Radar):** The cockpit shall dynamically calculate project health scores on a scale of 0 to 100 based on completed vs overdue task ratios.

### 3.3 Module 3: Execution Board & Task Management

- **FR-TSK-01 (Kanban Status Pipeline):** The execution board shall support 6 discrete task states: `backlog`, `todo`, `doing`, `review`, `blocked`, and `completed`.
- **FR-TSK-02 (Optimistic Drag-and-Drop):** The UI shall allow dragging task cards across columns with optimistic client-side state updates completing in under 16ms, persisting to Supabase in the background.
- **FR-TSK-03 (Skill Tag Routing):** When creating or assigning a task requiring specific skills (e.g. `React`, `Figma`), the system shall evaluate the workspace member skill graph and present match scores.
- **FR-TSK-04 (Immutable Task History):** Every modification to a task's priority, assignee, status, or deadline shall append a row to `task_history` containing `actor_name`, `previous_value`, `new_value`, and `created_at`.
- **FR-TSK-05 (Task Comments):** Users shall be able to post threaded comments on tasks to document implementation progress or delivery roadblocks, stored in `task_comments`.
- **FR-TSK-06 (Client UUID Preservation):** To prevent split-brain ID divergence between optimistic store state and Supabase, task creation shall preserve client-generated UUIDs across child comments and history.

### 3.4 Module 4: Company Memory & Documentation

- **FR-MEM-01 (Knowledge Repository):** The system shall store documents categorized under `sop`, `contract`, `template`, `meeting_notes`, and `guide`.
- **FR-MEM-02 (Template Duplication):** The UI shall provide a 1-click **Duplicate Template** action that creates an editable clone of standard contracts or SOPs.
- **FR-MEM-03 (Access Restriction):** Documents marked with `is_restricted = true` shall be visible only to users with `owner` or `admin` roles.
- **FR-MEM-04 (Tag-Based Search & XSS Sanitization):** The memory index shall support instant search filtering across titles, tags, and document content, with HTML/Markdown sanitized via DOMPurify to eliminate stored XSS.

### 3.5 Module 5: Finance Lite & Receivables

- **FR-FIN-01 (Receivables Ledger):** The finance module shall maintain invoices with statuses `draft`, `sent`, `paid`, and `overdue`.
- **FR-FIN-02 (Net Profit Calculator):** The system shall calculate live net profit estimates by subtracting total logged expenses from total `paid` invoice revenue.
- **FR-FIN-03 (Itemized PDF Generation):** The system shall generate clean, downloadable and printable invoice documents containing company branding, line items, tax details, and payment instructions via client-side PDF generation (`html2canvas` + `jsPDF`).
- **FR-FIN-04 (Client Directory):** The system shall track client accounts, primary points of contact, and cumulative lifetime billed revenue in `clients`.
- **FR-FIN-05 (Operational Expenses Ledger):** The system shall track operational outlays categorized into `software`, `contractor`, `payroll`, `marketing`, `office`, and `other`, storing monetary amounts in `amount_cents BIGINT` to avoid floating-point drift.

### 3.6 Module 6: AI Operations Engine

- **FR-AI-01 (Context Gathering):** The system shall compile workspace state (active deliverables, team bandwidth, overdue invoices, and skill ratings) into structured JSON.
- **FR-AI-02 (DeepSeek Inference):** The `/api/ai` route handler shall transmit context to the DeepSeek-V4-Flash model with low temperature (0.3) for deterministic, actionable operations advice.
- **FR-AI-03 (Human-in-the-Loop Approval):** AI recommendations shall be created in a `pending` state in `ai_recommendations`. The system shall strictly prohibit the AI engine from executing state changes without manual user confirmation via the **Approve** button.
- **FR-AI-04 (Deterministic Fallback):** If the external Ollama Cloud endpoint returns an error or times out (>5000ms), the system shall return deterministic rule-based operational advice to ensure 100% uptime.

### 3.7 Module 7: Unified Audit & Activity Logging

- **FR-AUD-01 (Workspace Activity Bus):** The system shall maintain an immutable `activity_logs` table tracking workspace-wide mutations (projects, tasks, invoices, documents, clients, expenses) for operational visibility.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance Requirements
- **NFR-PERF-01 (Optimistic UI Latency):** Client-side state transitions (moving a card, toggling a filter) shall execute in under 16ms (one animation frame).
- **NFR-PERF-02 (API Response SLA):** Supabase database REST queries shall resolve within 150ms under normal network conditions.
- **NFR-PERF-03 (Bundle Optimization):** Next.js client-side production JavaScript bundle shall not exceed 180kB initial load per route.

### 4.2 Security Requirements
- **NFR-SEC-01 (Database Isolation):** Row Level Security (RLS) shall be enabled and enforced on all 13 PostgreSQL tables.
- **NFR-SEC-02 (Key Security):** The `SUPABASE_SERVICE_ROLE_KEY` and `OLLAMA_API_KEY` shall remain strictly server-side and never exposed to the client bundle.
- **NFR-SEC-03 (Input Sanitization):** All rich text and markdown content rendered in Company Memory shall be sanitized with `isomorphic-dompurify` to prevent Cross-Site Scripting (XSS) attacks.

### 4.3 Reliability and Availability
- **NFR-REL-01 (Uptime Target):** The application shall maintain 99.9% uptime on serverless edge infrastructure.
- **NFR-REL-02 (Graceful Degradation):** In the event of network disconnection, the Zustand client store shall retain local session state and alert the user before state loss.

### 4.4 Usability & Accessibility
- **NFR-USA-01 (Dark Theme Design System):** The interface shall implement a high-contrast dark theme (slate/blue tones) with a minimum text contrast ratio of 4.5:1 meeting WCAG 2.1 AA standards.
- **NFR-USA-02 (Responsive Layouts):** All dashboard views, execution boards, and document viewers shall render seamlessly across viewports from 375px (mobile) to 2560px (ultrawide monitors).

---

## 5. System Constraints

1. **Framework Constraint:** Next.js 16 (React 19) using TypeScript for complete end-to-end type safety.
2. **Database Constraint:** PostgreSQL 15+ hosted on Supabase to leverage native RLS, foreign keys, and JWT claims across all 13 tables.
3. **AI Governance Constraint:** External AI calls routed through secure server-side route handlers, staged in `ai_recommendations` with Human-in-the-Loop approval gate.
