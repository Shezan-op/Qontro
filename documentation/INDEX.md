# Qontro Documentation Suite: Master Index

Welcome to the complete technical and operational documentation suite for **Qontro** (Founder Command Cockpit & AI Operations System for boutique agencies and consultancies).

All documents are structured and written according to senior software engineering standards with zero artificial fluff.

---

## Documentation Manifest

| # | Document Title | File Link | Description & Key Topics |
| :---: | :--- | :--- | :--- |
| **01** | **Project Report** | [`01_PROJECT_REPORT.md`](file:///c:/Users/techt/qontro/documentation/01_PROJECT_REPORT.md) | Complete final-year capstone report covering problem domain, 5 agency modules, 13-table architecture, evaluation, and benchmarks. |
| **02** | **SRS Document** | [`02_SRS_DOCUMENT.md`](file:///c:/Users/techt/qontro/documentation/02_SRS_DOCUMENT.md) | IEEE 830-compliant Software Requirements Specification defining functional and non-functional requirements across 13 tables. |
| **03** | **Software Design Document** | [`03_SOFTWARE_DESIGN_DOCUMENT.md`](file:///c:/Users/techt/qontro/documentation/03_SOFTWARE_DESIGN_DOCUMENT.md) | System architecture, Zustand optimistic state flow with client UUID preservation, sequence models, and component design. |
| **04** | **Database Design Document** | [`04_DATABASE_DESIGN_DOCUMENT.md`](file:///c:/Users/techt/qontro/documentation/04_DATABASE_DESIGN_DOCUMENT.md) | Relational PostgreSQL schema, ER diagram, table dictionaries for all 13 tables, B-Tree indexes, RLS policies, and triggers. |
| **05** | **API Documentation** | [`05_API_DOCUMENTATION.md`](file:///c:/Users/techt/qontro/documentation/05_API_DOCUMENTATION.md) | Complete API endpoint specification for `/api/ai`, auth routes, PostgREST queries, typed service methods, and request/response schemas. |
| **06** | **Testing Report** | [`06_TESTING_REPORT.md`](file:///c:/Users/techt/qontro/documentation/06_TESTING_REPORT.md) | Verification and QA report with 40 test cases, bug resolution log (split-brain & XSS fixes), and automated testing blueprint. |
| **07** | **User Manual** | [`07_USER_MANUAL.md`](file:///c:/Users/techt/qontro/documentation/07_USER_MANUAL.md) | Operational user manual for agency founders, developers, and project managers operating the Kanban board, SOPs, and billing. |
| **08** | **Admin Manual** | [`08_ADMIN_MANUAL.md`](file:///c:/Users/techt/qontro/documentation/08_ADMIN_MANUAL.md) | System administration guide covering RBAC permissions, skill scoring baselines, AI model routing, and security policies. |
| **09** | **Deployment Guide** | [`09_DEPLOYMENT_GUIDE.md`](file:///c:/Users/techt/qontro/documentation/09_DEPLOYMENT_GUIDE.md) | Step-by-step production deployment manual for Supabase Cloud (unified 13-table SQL), Vercel Edge, and environment variables. |
| **10** | **README.md** | [`10_README.md`](file:///c:/Users/techt/qontro/documentation/10_README.md) | Developer quickstart guide, repository topology, tech stack summary, and available scripts. |
| **11** | **Project Plan** | [`11_PROJECT_PLAN.md`](file:///c:/Users/techt/qontro/documentation/11_PROJECT_PLAN.md) | 12-week Agile development roadmap, Work Breakdown Structure (WBS), Gantt chart, milestones, and retrospective. |
| **12** | **Risk Analysis** | [`12_RISK_ANALYSIS.md`](file:///c:/Users/techt/qontro/documentation/12_RISK_ANALYSIS.md) | Formal FMEA risk matrix covering technical, security, financial, and operational risks with active mitigation protocols. |
| **13** | **Final Presentation** | [`13_FINAL_PRESENTATION.md`](file:///c:/Users/techt/qontro/documentation/13_FINAL_PRESENTATION.md) | Slide-by-slide final viva defense and investor demo presentation deck with speaker notes and anticipated examiner Q&A. |
| **14** | **Future Scope Document** | [`14_FUTURE_SCOPE_DOCUMENT.md`](file:///c:/Users/techt/qontro/documentation/14_FUTURE_SCOPE_DOCUMENT.md) | Strategic product roadmap covering Phases 2 through 4 (Client Magic Links, Stripe Webhooks, Git Integration, Desktop Agent). |

---

## Technical Architecture Summary

- **Frontend & Edge:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS v4
- **State Management:** Zustand with client-side optimistic UI state and preserved client UUID synchronization
- **Database & Security:** Supabase Cloud (PostgreSQL 15+ with Row Level Security on all 13 tables)
- **AI Triage Gateway:** DeepSeek-V4-Flash Cloud via Ollama Cloud REST API (governed under human-in-the-loop sign-off)
