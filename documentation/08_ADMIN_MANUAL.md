# Administrator Manual: Qontro Management & Security

**Target Audience:** Workspace Owners, Operations Directors, DevOps Engineers, and System Administrators  
**Application Version:** 1.0 Production  

---

## 1. System Administration Overview

As a Workspace Administrator or Owner in Qontro, you control tenant configuration, role-based access permissions, team skill matrix baselines, AI model routing parameters, and financial currency defaults. This manual outlines operational procedures for managing your organization's workspace securely and efficiently.

---

## 2. Role-Based Access Control (RBAC) Matrix

Qontro enforces four discrete permission tiers to protect sensitive financial and operational data:

| Permission / Capability | Workspace Owner | Project Admin | Team Member | Client (External) |
| :--- | :---: | :---: | :---: | :---: |
| **Workspace Settings & Billing** | Full Control | Read-Only | Denied | Denied |
| **Invite / Remove Team Members** | Full Control | Full Control | Denied | Denied |
| **Create & Delete Projects** | Full Control | Full Control | Read-Only | Denied |
| **Create & Assign Tasks** | Full Control | Full Control | Read/Write | Denied |
| **Drag & Drop Task Status** | Full Control | Full Control | Full Control | Denied |
| **Edit Team Skill Matrix** | Full Control | Full Control | Denied | Denied |
| **View Internal Expenses & Profit**| Full Control | Denied | Denied | Denied |
| **Create & Settle Invoices** | Full Control | Full Control | Denied | Denied |
| **View Client Final Invoices** | Full Control | Full Control | Denied | Read-Only |
| **Access Restricted SOPs/Docs** | Full Control | Full Control | Denied | Denied |
| **Approve AI Reallocations** | Full Control | Full Control | Denied | Denied |

---

## 3. Workspace Provisioning & Configuration (`/settings`)

### 3.1 Initial Workspace Setup
When creating an organization workspace:
1. **Organization Name:** Set your studio or agency name (e.g. `Acme Digital Studio`).
2. **Workspace Slug:** Unique, URL-safe identifier (e.g. `acme-studio`). Once created, the slug cannot be modified without database administrator intervention.
3. **Default Currency:** Standard 3-letter currency code (e.g. `USD`, `EUR`, `GBP`, `CAD`). All project budgets, invoices, and expense totals automatically format to this currency symbol.
4. **Timezone:** Standard IANA timezone (e.g. `America/New_York`, `Asia/Kolkata`, `Europe/London`) for sprint deadline calculations and morning briefing timestamps.

---

## 4. Team Member Lifecycle & Skill Matrix Management

### 4.1 Inviting Members
1. Navigate to **Settings** > **Team Members** or **Team & Skills (`/team`)**.
2. Enter the new member's name, email address, and job title designation (e.g., "Lead Full-Stack Engineer").
3. Assign an initial role (`admin` or `member`).
4. Once invited, the user receives an invitation email or can log in via Supabase Auth using their registered email.

### 4.2 Establishing the Verified Skill Matrix
Skill proficiencies guide the AI Operations Engine and project managers when assigning tasks:
1. In `/team`, select a team member to open their profile.
2. Click **Add Skill** to record specific competencies (e.g. `React`, `PostgreSQL`, `Figma`, `Go`).
3. Set the baseline proficiency score from **1.0 to 10.0**:
   - `1.0 – 4.0`: Junior / Trainee (requires supervision).
   - `5.0 – 7.5`: Mid-Level (handles standard sprint tasks independently).
   - `8.0 – 10.0`: Senior / Lead Specialist (architectural review capability).
4. As members deliver tasks tagged with these skills, the system automatically increments their `verified_tasks_count` in the database.

---

## 5. Security & Row Level Security (RLS) Governance

### 5.1 Multi-Tenant Database Boundary Enforcement
Qontro does not rely solely on application-level filtering. Every PostgreSQL query is validated at the database kernel level through Supabase Row Level Security. 

To verify that RLS is active on all workspace tables, execute the following query in your Supabase SQL editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
*Expected Output: All 8 tables (`workspaces`, `workspace_members`, `skills`, `projects`, `tasks`, `invoices`, `documents`, `ai_recommendations`) must show `rowsecurity = true`.*

### 5.2 Document Access Restrictions
When storing sensitive company files (such as partner equity agreements, executive meeting notes, or employee salary bands) in **Company Memory (`/memory`)**:
1. Check the **Restricted Document (Admins Only)** toggle during creation or editing.
2. The database marks the record with `is_restricted = true`.
3. Standard `member` and `client` accounts cannot view or query these records.

---

## 6. AI Engine Configuration & Model Routing

The AI Operations Engine communicates with Ollama Cloud endpoints via Next.js Route Handlers.

### 6.1 Environment Variables Configuration
In your server deployment configuration (Vercel or Docker container environment):

```bash
# Ollama Cloud DeepSeek-V4 API Configuration
OLLAMA_API_KEY="your-verified-ollama-cloud-key"
OLLAMA_MODEL="deepseek-v4-flash:cloud"

# Supabase Admin Keys
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 6.2 Governance & Safety Boundaries
- **Inference Temperature:** The model is locked at `temperature: 0.3` in `src/app/api/ai/route.ts` to ensure consistent, deterministic operations analysis without creative divergence.
- **Human Approval Barrier:** The system enforces a mandatory human sign-off on all AI recommendations. The AI has zero direct write access to project or task tables.

---

## 7. Data Export & Disaster Recovery

### 7.1 Workspace Data Export
Administrators can generate a structured JSON backup of their entire workspace state (projects, tasks, invoices, documents, and audit histories) by triggering the export function in **Settings** > **Data Management**.

### 7.2 Backup & Restore Policy
- **Automated Snapshots:** Supabase Cloud creates automated daily point-in-time recovery (PITR) snapshots of the PostgreSQL database.
- **Soft Deletion & Cascade Rules:** Deleting a project cascades to its child tasks to maintain relational integrity, while logging an activity record in `activity_logs`.
