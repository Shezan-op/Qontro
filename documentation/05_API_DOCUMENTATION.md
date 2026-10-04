# API Documentation: Qontro Interface Specification

**Document Reference:** QONTRO-API-V2.0  
**Base URL (Local Development):** `http://localhost:3000` (or `http://localhost:3005`)  
**Base URL (Production):** `https://app.qontro.io` (or custom agency domain)  
**Authentication Scheme:** Bearer JWT Token (`Authorization: Bearer <supabase_jwt>`) or HTTP-Only Session Cookie  

---

## 1. Overview & Architecture

Qontro exposes two primary API layers:
1. **Application Server API (`/api/*`):** Next.js server-side Route Handlers executing edge logic, DeepSeek-V4 LLM inference orchestration, rate limiting, and auth token exchanges.
2. **Supabase PostgREST Data Service (`QontroSupabaseService`):** Typed client-side database service methods communicating directly with PostgreSQL under Row Level Security (RLS) across all 13 normalized tables.

---

## 2. Server Route Endpoints

### 2.1 DeepSeek-V4 Operational Triage Engine

- **Endpoint:** `POST /api/ai`
- **Description:** Receives aggregated workspace operational context (team workloads, active projects, urgent tasks, overdue invoices) and queries the DeepSeek-V4-Flash model to generate actionable resource rebalancing and risk mitigation plans.
- **Authentication:** Enforced (HTTP 401 if missing valid session or bearer token).
- **Rate Limiting:** 10 requests per minute per IP address.

#### Request Payload
```json
{
  "prompt": "Analyze team burnout and identify delayed project blockers for this morning's sprint.",
  "type": "executive_triage",
  "contextData": {
    "members": [
      { "name": "Ahmed Khan", "load": 95, "role": "Senior UI/UX Designer" },
      { "name": "Ajay Verma", "load": 45, "role": "Full-Stack Engineer & Copywriter" }
    ],
    "activeProjects": [
      { "name": "Apex Portal MVP", "health": 95, "deadline": "2026-09-15" }
    ],
    "urgentTasks": [
      { "title": "Design System Iconography Export", "assigned": "Ahmed Khan" }
    ],
    "pendingCash": 18500.00
  }
}
```

#### Response Payload (Success: HTTP 200 OK)
```json
{
  "success": true,
  "model": "deepseek-v4-flash:cloud",
  "response": "### Operational Triage Output (executive_triage)\n- **Workload Rebalancing:** Ahmed Khan is at 95% capacity. Shift the 'Design System Iconography Export' task to Ajay Verma (45% load) or extend deliverable by 48h to avoid burnout.\n- **Receivables Action:** $18,500 in receivables is pending. Hold final staging deployment until milestone settlement."
}
```

#### Response Payload (Fallback Mode: HTTP 200 OK)
When external Ollama Cloud endpoints are unreachable or timeout (>5000ms), the route executes deterministic heuristic triage without a 500 server crash:
```json
{
  "success": true,
  "model": "deepseek-v4-flash:cloud (Deterministic Fallback Mode)",
  "response": "### AI Operations Analysis (executive_triage)\n- **Workload Balance:** Ahmed (95%) is nearing critical burnout. Shift incoming design tasks or extend deadline.\n- **Skill Alignment:** Ajay has matching capacity for copy and frontend tasks currently waiting in review."
}
```

---

### 2.2 Supabase Authentication Callback

- **Endpoint:** `GET /auth/callback`
- **Description:** Handles OAuth code exchanges and email confirmation magic links, establishing HTTP-only session cookies.
- **Query Parameters:**
  - `code` (string, required): Authorization code provided by Supabase Auth server.
  - `next` (string, optional): Target redirect URL post-authentication (defaults to `/`).
- **Response:** HTTP 303 Redirect to destination URL with secure session cookies set in headers.

---

## 3. Data Service Interfaces (`QontroSupabaseService`)

All methods are housed in `src/services/supabaseService.ts` and interact with Supabase PostgreSQL under RLS policies:

### 3.1 Service Initialization & Environment Validation

#### `QontroSupabaseService.isConfigured()`
- **Description:** Verifies whether `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are defined in the runtime environment. Allows store actions and components to branch gracefully without throwing uncaught connection errors during local development or offline test runs.
- **Returns:** `boolean`

---

### 3.2 Workspaces API

#### `QontroSupabaseService.fetchUserWorkspaces()`
- **SQL Translation:** `SELECT w.* FROM workspaces w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = auth.uid();`
- **Returns:** `Promise<Workspace[]>`

#### `QontroSupabaseService.createWorkspace(name: string, currency: string = 'USD')`
- **Description:** Atomically provisions a workspace and assigns the authenticated user as `owner`.
- **Returns:** `Promise<Workspace>`


---

### 3.3 Projects API

#### `QontroSupabaseService.fetchProjects(workspaceId: string)`
- **SQL Translation:** `SELECT * FROM projects WHERE workspace_id = $1 AND archived_at IS NULL ORDER BY created_at DESC;`
- **Returns:** `Promise<Project[]>`

#### `QontroSupabaseService.createProject(project: Omit<Project, 'id' | 'created_at' | 'health_score' | 'updated_at' | 'archived_at'>)`
- **SQL Translation:** `INSERT INTO projects (...) VALUES (...) RETURNING *;`
- **Returns:** `Promise<Project>`

#### `QontroSupabaseService.updateProject(projectId: string, patch: Partial<Project>)`
- **SQL Translation:** `UPDATE projects SET ... WHERE id = $1;`
- **Returns:** `Promise<boolean>`

#### `QontroSupabaseService.deleteProject(projectId: string)`
- **SQL Translation:** `DELETE FROM projects WHERE id = $1;`
- **Returns:** `Promise<boolean>`

---

### 3.3 Tasks & Discussion API

#### `QontroSupabaseService.fetchTasks(workspaceId: string)`
- **SQL Translation:** `SELECT *, comments:task_comments(*) FROM tasks WHERE workspace_id = $1 AND archived_at IS NULL ORDER BY created_at DESC;`
- **Returns:** `Promise<Task[]>`

#### `QontroSupabaseService.createTask(task: Task)`
- **Note:** Accepts client-generated `id` (UUID) to ensure foreign keys in `task_comments` and `task_history` remain aligned with the persisted task record.
- **SQL Translation:** `INSERT INTO tasks (id, workspace_id, title, status, ...) VALUES ($1, $2, $3, ...) RETURNING *;`
- **Returns:** `Promise<Task>`

#### `QontroSupabaseService.updateTaskStatus(taskId: string, status: string)`
- **SQL Translation:** `UPDATE tasks SET status = $2, completed_at = CASE WHEN $2 = 'completed' THEN now() ELSE NULL END WHERE id = $1;`
- **Returns:** `Promise<boolean>`

#### `QontroSupabaseService.createTaskComment(comment: Omit<TaskComment, 'id' | 'created_at' | 'updated_at'>)`
- **SQL Translation:** `INSERT INTO task_comments (...) VALUES (...) RETURNING *;`
- **Returns:** `Promise<TaskComment>`

---

### 3.4 Task History & Audit Trail API

#### `QontroSupabaseService.fetchTaskHistory(workspaceId: string, taskId?: string)`
- **SQL Translation:** `SELECT * FROM task_history WHERE workspace_id = $1 ORDER BY created_at DESC;`
- **Returns:** `Promise<TaskHistory[]>`

#### `QontroSupabaseService.createTaskHistory(entry: Omit<TaskHistory, 'id' | 'created_at'>)`
- **SQL Translation:** `INSERT INTO task_history (workspace_id, task_id, actor_name, action, previous_value, new_value) VALUES (...) RETURNING *;`
- **Returns:** `Promise<TaskHistory>`

---

### 3.5 Invoices API (Receivables)

#### `QontroSupabaseService.fetchInvoices(workspaceId: string)`
- **SQL Translation:** `SELECT * FROM invoices WHERE workspace_id = $1 ORDER BY created_at DESC;`
- **Returns:** `Promise<Invoice[]>`

#### `QontroSupabaseService.createInvoice(invoice: Omit<Invoice, 'id'>)`
- **SQL Translation:** `INSERT INTO invoices (...) VALUES (...) RETURNING *;`
- **Returns:** `Promise<Invoice>`

#### `QontroSupabaseService.updateInvoiceStatus(invoiceId: string, status: string)`
- **SQL Translation:** `UPDATE invoices SET status = $2 WHERE id = $1;`
- **Returns:** `Promise<boolean>`

---

### 3.6 Expenses API (Ledger)

#### `QontroSupabaseService.fetchExpenses(workspaceId: string)`
- **SQL Translation:** `SELECT * FROM expenses WHERE workspace_id = $1 ORDER BY created_at DESC;`
- **Returns:** `Promise<Expense[]>`

#### `QontroSupabaseService.createExpense(expense: Omit<Expense, 'id' | 'created_at'>)`
- **Note:** Stores `amount_cents` as `bigint` (e.g. $12.50 = 1250) to guarantee arithmetic precision.
- **SQL Translation:** `INSERT INTO expenses (...) VALUES (...) RETURNING *;`
- **Returns:** `Promise<Expense>`

#### `QontroSupabaseService.deleteExpense(expenseId: string)`
- **SQL Translation:** `DELETE FROM expenses WHERE id = $1;`
- **Returns:** `Promise<boolean>`

---

### 3.7 Clients Directory API

#### `QontroSupabaseService.fetchClients(workspaceId: string)`
- **SQL Translation:** `SELECT * FROM clients WHERE workspace_id = $1 ORDER BY created_at DESC;`
- **Returns:** `Promise<Client[]>`

#### `QontroSupabaseService.createClient(client: Omit<Client, 'id' | 'created_at' | 'total_billed'>)`
- **SQL Translation:** `INSERT INTO clients (...) VALUES (...) RETURNING *;`
- **Returns:** `Promise<Client>`

---

### 3.8 Company Memory Documents API

#### `QontroSupabaseService.fetchDocuments(workspaceId: string)`
- **SQL Translation:** `SELECT * FROM documents WHERE workspace_id = $1 AND archived_at IS NULL ORDER BY updated_at DESC;`
- **Returns:** `Promise<Document[]>`

#### `QontroSupabaseService.createDocument(doc: Omit<Document, 'id' | 'updated_at'>)`
- **SQL Translation:** `INSERT INTO documents (...) VALUES (...) RETURNING *;`
- **Returns:** `Promise<Document>`

---

### 3.9 AI Recommendations Governance API

#### `QontroSupabaseService.fetchAIRecommendations(workspaceId: string)`
- **SQL Translation:** `SELECT * FROM ai_recommendations WHERE workspace_id = $1 AND status = 'pending' ORDER BY created_at DESC;`
- **Returns:** `Promise<AIRecommendation[]>`

#### `QontroSupabaseService.updateAIRecommendationStatus(recId: string, status: 'approved' | 'dismissed', approvedBy?: string)`
- **SQL Translation:** `UPDATE ai_recommendations SET status = $2, approved_at = CASE WHEN $2 = 'approved' THEN now() ELSE NULL END, approved_by = $3 WHERE id = $1;`
- **Returns:** `Promise<boolean>`

---

### 3.10 Activity Logs API

#### `QontroSupabaseService.fetchActivityLogs(workspaceId: string)`
- **SQL Translation:** `SELECT * FROM activity_logs WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 50;`
- **Returns:** `Promise<ActivityLog[]>`

#### `QontroSupabaseService.createActivityLog(log: Omit<ActivityLog, 'id' | 'created_at'>)`
- **SQL Translation:** `INSERT INTO activity_logs (workspace_id, actor_name, type, action, entity_id, details) VALUES (...) RETURNING *;`
- **Returns:** `Promise<ActivityLog>`
