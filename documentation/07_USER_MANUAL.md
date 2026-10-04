# User Manual: Operating Qontro

**Target Audience:** Agency Founders, Project Leads, Engineers, Designers, and Operations Managers  
**Application Version:** 1.0 Production  

---

## 1. Welcome to Qontro

Qontro is an all-in-one operations platform built specifically for fast-moving digital agencies and technical studios. Instead of juggling Jira for tickets, Notion for SOPs, and spreadsheets for billing, Qontro brings your projects, team bandwidth, company knowledge, and cash flow into a single high-speed dashboard.

---

## 2. Navigating the Workspace

The Qontro interface is organized into five primary sections accessible via the left sidebar:

```
+--------------------------------------------------------------------+
|  [Qontro Logo]  Acme Digital Studio                                |
|                                                                    |
|  * Command Cockpit      -> Morning briefing & executive alerts     |
|  * Projects             -> Deliverables, health scores, budgets   |
|  * Execution Board      -> Drag-and-drop Kanban & skill routing    |
|  * Team & Skills        -> Member capacity & verified skill scores |
|  * Company Memory       -> SOPs, contract templates & guides       |
|  * Finance Lite         -> Invoices, expenses & PDF generator      |
|  * AI Operations        -> DeepSeek-V4 workload triage             |
|  * Settings             -> Workspace members & preferences         |
+--------------------------------------------------------------------+
```

---

## 3. The 10-Second Morning Briefing (Command Cockpit)

When you open Qontro each morning, the **Command Cockpit (`/`)** instantly calculates four critical numbers:
1. **At-Risk Projects:** Projects with health scores below 75% or approaching tight deadlines.
2. **Urgent Blockers:** Tasks marked with `urgent` priority that remain incomplete.
3. **Overloaded Team Members:** Any engineer or designer currently operating at or above 85% capacity.
4. **Pending Receivables:** Total unsettled invoice cash (`sent` + `overdue`), with red warnings for overdue payments.

### Quick Actions
- Click **Review AI Action Plan** to immediately jump into automated workload triage.
- Click **Open Execution Board** to view the live Kanban board.
- Click **Create First Project** when setting up a new client engagement.

---

## 4. Managing Tasks on the Execution Board (`/tasks`)

The Execution Board uses a visual Kanban layout organized into five columns: `To Do`, `In Progress`, `In Review`, `Blocked / Risk`, and `Completed`.

```
+-------------+-------------+-------------+-------------+-------------+
|    TO DO    | IN PROGRESS |  IN REVIEW  |   BLOCKED   |  COMPLETED  |
|             |             |             |             |             |
| [Card: PR]  | [Card: UI]  | [Card: QA]  | [Card: API] | [Card: Auth]|
| Skill: Go   | Skill: Fig  | Skill: React| Reason: Key | Done: Aug 18|
+-------------+-------------+-------------+-------------+-------------+
```

### 4.1 Creating a Task
1. Click the **New Task** button in the top right.
2. Enter the task title and optional technical description.
3. Select the associated project from the dropdown.
4. Pick an assignee. Notice the skill badges next to member names indicating their suitability for the required tools.
5. Set the priority (`urgent`, `high`, `medium`, or `low`) and expected deadline.
6. Specify required skills (e.g. `React, Tailwind, PostgreSQL`).
7. Click **Create Task**. The card appears on your board immediately.

### 4.2 Moving and Updating Tasks
- **Drag-and-Drop:** Click and drag any card to move it between columns. The status updates instantly in local memory and syncs to the cloud in the background.
- **Task Details & Comments:** Click on any task card to open the detail drawer. Here you can read the full description, post progress comments, and review the immutable history log showing who made changes and when.

---

## 5. Team Bandwidth & Verified Skill Graphs (`/team`)

Traditional team directories only show job titles. Qontro tracks **live capacity utilization** and **verified skill proficiencies**:

- **Workload Percentage:** Color-coded capacity meters:
  - Green (0–70%): Healthy capacity; available for new deliverables.
  - Amber (71–84%): Nearing full sprint allocation.
  - Red (85–100%): Burnout risk; requires workload rebalancing.
- **Verified Skills (Scale 1.0 to 10.0):** Every team member possesses a skill graph (e.g. `React: 9.2`, `Figma: 8.8`, `PostgreSQL: 7.5`). When members complete tasks tagged with these skills, their verified task counter increments automatically.

---

## 6. Company Memory & Knowledge Base (`/memory`)

Company Memory is your agency's permanent institutional knowledge repository.

### 6.1 Creating & Organizing Documents
- Filter documents by category: `SOP`, `Contract`, `Template`, `Meeting Notes`, or `Guide`.
- Use the live search bar to query across titles, tags, and document contents.

### 6.2 1-Click Contract & SOP Duplication
When onboarding a new client:
1. Locate the **Standard Master Services Agreement (MSA)** or **SOW Template**.
2. Click the **Duplicate Template** icon.
3. Qontro instantly creates a new draft clone with `(Copy)` appended to the title, ready for client customization.

---

## 7. Finance Lite & Client Invoicing (`/finance`)

Finance Lite provides clear, unbloated visibility into your agency's cash flow.

```
+--------------------------------------------------------------------+
|  Settled Revenue: $52,000  |  Pending Cash: $18,500                |
|  Total Expenses:  $14,200  |  Net Profit Estimate: $37,800         |
+--------------------------------------------------------------------+
```

### 7.1 Issuing Invoices
1. Navigate to the **Invoices** tab and click **New Invoice**.
2. Select the client, enter the total amount, project name, and payment due date.
3. Click **Issue Invoice**. It enters the ledger with status `sent`.

### 7.2 Generating Printable PDF Invoices
1. Click the **Download / Print PDF** button on any invoice row.
2. An invoice preview opens with itemized lines, subtotal, tax breakdown, and payment instructions.
3. Click **Print / Save as PDF** to launch your browser's native print engine.

### 7.3 Logging Project Expenses
1. Click the **Expenses** tab and click **Add Expense**.
2. Enter the expense description, category (`software`, `contractor`, `payroll`, `marketing`), and amount.
3. The **Net Profit Estimate** recalculates in real-time.

---

## 8. AI Operations Engine (`/ai-ops`)

The AI Operations Engine uses DeepSeek-V4 to analyze sprint health and propose optimizations under your direct supervision.

### 8.1 Running a Triage Analysis
1. Open the `/ai-ops` page.
2. Enter a custom operations question (e.g., *"How can we unblock Kroma Studio's deadline without overtime?"*) or click **Run DeepSeek Triage**.
3. The AI reviews member workloads, open tasks, and overdue milestones to deliver a structured action plan.

### 8.2 Approving or Dismissing Recommendations
- Every AI proposal appears on a review card showing the recommended action, affected members, and skill match percentage.
- **Approve:** Applies the recommended task reassignment directly to the live board and updates member workloads.
- **Dismiss:** Discards the recommendation without altering your project state.
- **Zero Hallucination Safety:** The AI cannot modify your database without your explicit click on **Approve**.

---

## 9. Frequently Asked Questions (FAQ)

**Q: Can I use Qontro offline or during intermittent internet connectivity?**  
*A:* Yes. Qontro uses client-side state caching with Zustand. If your connection drops, you can continue managing tasks, reading SOPs, and drafting invoices. Local state will synchronize once connectivity is restored.

**Q: Can external clients see our internal expenses or team salaries?**  
*A:* No. Users assigned the `client` role are restricted to viewing only their specific project deliverables and finalized invoices. All internal financial metrics, expenses, and restricted SOPs are completely hidden.
