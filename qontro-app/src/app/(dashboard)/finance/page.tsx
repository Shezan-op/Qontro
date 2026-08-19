'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Download,
  Building2,
  TrendingDown,
  Trash2,
  FileText
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Invoice, InvoiceStatus, Expense, Client } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function FinancePage() {
  const { 
    invoices, 
    expenses, 
    clients, 
    projects, 
    addInvoice, 
    updateInvoiceStatus, 
    deleteInvoice, 
    addExpense, 
    deleteExpense, 
    addClient 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'clients'>('invoices');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [pdfPreviewInvoice, setPdfPreviewInvoice] = useState<Invoice | null>(null);

  // Invoice form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState(12000);
  const [projectName, setProjectName] = useState(projects[0]?.name || 'Apex Dynamics Portal');
  const [dueDate, setDueDate] = useState('2026-09-05');

  // Expense form
  const [expenseName, setExpenseName] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('software');
  const [expenseAmount, setExpenseAmount] = useState(500);

  // Client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Calculations
  const totalSettledRevenue = invoices.filter((i) => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfitEstimate = totalSettledRevenue - totalExpenses;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    addInvoice({
      workspace_id: 'ws_prod_01',
      invoice_number: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      client_name: clientName,
      client_email: clientEmail,
      amount: Number(amount),
      currency: 'USD',
      status: 'sent',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      project_name: projectName,
      items: [
        {
          id: `itm_${Date.now()}`,
          description: `Engineering & design sprint for ${projectName}`,
          quantity: 1,
          unit_price: Number(amount),
          amount: Number(amount),
        },
      ],
    });

    setClientName('');
    setClientEmail('');
    setShowInvoiceModal(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName.trim()) return;

    addExpense({
      workspace_id: 'ws_prod_01',
      name: expenseName,
      category: expenseCategory,
      amount: Number(expenseAmount),
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
    });

    setExpenseName('');
    setShowExpenseModal(false);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    addClient({
      workspace_id: 'ws_prod_01',
      name: newClientName,
      company_name: newClientCompany,
      email: newClientEmail,
      status: 'active',
    });

    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setShowClientModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Money Flow & Receivables
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track business revenue health, expenses, client contracts, and generate compliant PDF invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3 py-2 rounded-lg bg-[#222222] border border-[#333333] hover:bg-[#2a2a2a] text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <TrendingDown className="w-4 h-4 text-rose-400" />
            Record Expense
          </button>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 space-y-1 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Settled Revenue
          </div>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSettledRevenue)}</div>
          <div className="text-[10px] text-gray-500">Paid into company account</div>
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 space-y-1 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Pending Receivables
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalPending)}</div>
          <div className="text-[10px] text-gray-500">Unsettled client invoices</div>
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 space-y-1 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            Total Expenses
          </div>
          <div className="text-2xl font-bold text-rose-400">{formatCurrency(totalExpenses)}</div>
          <div className="text-[10px] text-gray-500">Payroll, software & tools</div>
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 space-y-1 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" />
            Estimated Net Profit
          </div>
          <div className={cn("text-2xl font-bold", netProfitEstimate >= 0 ? "text-white" : "text-red-400")}>
            {formatCurrency(netProfitEstimate)}
          </div>
          <div className="text-[10px] text-gray-500">Revenue minus expenses</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-medium transition-colors",
            activeTab === 'invoices' ? "bg-[#2a2a2a] text-white font-semibold" : "text-gray-400 hover:text-gray-200"
          )}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-medium transition-colors",
            activeTab === 'expenses' ? "bg-[#2a2a2a] text-white font-semibold" : "text-gray-400 hover:text-gray-200"
          )}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-medium transition-colors",
            activeTab === 'clients' ? "bg-[#2a2a2a] text-white font-semibold" : "text-gray-400 hover:text-gray-200"
          )}
        >
          Clients Directory ({clients.length})
        </button>
      </div>

      {/* 1. Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161616] border-b border-[#2a2a2a] text-gray-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">PDF & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-gray-300">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-gray-200">{inv.invoice_number}</td>
                    <td className="py-3 px-4 font-medium text-white">{inv.client_name}</td>
                    <td className="py-3 px-4 text-gray-400">{inv.project_name}</td>
                    <td className="py-3 px-4 text-gray-400">{inv.due_date}</td>
                    <td className="py-3 px-4 font-bold text-white">{formatCurrency(inv.amount)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                        className={cn(
                          "text-[10px] font-bold uppercase px-2 py-1 rounded border focus:outline-none cursor-pointer",
                          inv.status === 'paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          inv.status === 'overdue' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          inv.status === 'sent' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        )}
                      >
                        <option value="draft" className="bg-[#1a1a1a]">Draft</option>
                        <option value="sent" className="bg-[#1a1a1a]">Sent</option>
                        <option value="paid" className="bg-[#1a1a1a]">Paid</option>
                        <option value="overdue" className="bg-[#1a1a1a]">Overdue</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setPdfPreviewInvoice(inv)}
                        className="px-2 py-1 rounded bg-[#222222] hover:bg-[#2c2c2c] text-[11px] text-gray-200 transition-colors inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> View PDF
                      </button>
                      <button
                        onClick={() => deleteInvoice(inv.id)}
                        className="text-gray-500 hover:text-red-400 p-1"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                      No invoices created. Click &quot;Create Invoice&quot; to generate your first invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Expense Ledger</h3>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:opacity-90"
            >
              + Add Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161616] border-b border-[#2a2a2a] text-gray-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Expense</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-gray-300">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{exp.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{exp.date}</td>
                    <td className="py-3 px-4 font-bold text-rose-400">{formatCurrency(exp.amount)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                      No operational expenses recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Clients Directory Tab */}
      {activeTab === 'clients' && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Client Directory</h3>
            <button
              onClick={() => setShowClientModal(true)}
              className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:opacity-90"
            >
              + Add Client
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {clients.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{c.company_name}</div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {c.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400">{c.name} • {c.email}</div>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-500 text-xs">
                No client accounts created yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Generation Preview Modal */}
      {pdfPreviewInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-2xl w-full max-w-2xl p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">QONTRO INVOICE</h2>
                <div className="text-xs text-gray-500">Hyperion Labs Inc • billing@qontro.io</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{pdfPreviewInvoice.invoice_number}</div>
                <div className="text-xs text-gray-500">Due: {pdfPreviewInvoice.due_date}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold uppercase text-gray-400 text-[10px]">Billed To:</div>
                <div className="font-bold text-sm">{pdfPreviewInvoice.client_name}</div>
                <div className="text-gray-600">{pdfPreviewInvoice.client_email}</div>
              </div>
              <div className="text-right">
                <div className="font-bold uppercase text-gray-400 text-[10px]">Project Scope:</div>
                <div className="font-medium text-sm">{pdfPreviewInvoice.project_name}</div>
                <div className="text-gray-600">Status: {pdfPreviewInvoice.status.toUpperCase()}</div>
              </div>
            </div>

            <table className="w-full text-left text-xs border-t border-b py-2">
              <thead>
                <tr className="border-b text-gray-500 text-[10px] uppercase">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 font-medium">Software Engineering & Product Architecture Sprint</td>
                  <td className="py-3 text-right font-bold">{formatCurrency(pdfPreviewInvoice.amount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center text-sm pt-2">
              <span className="font-bold">Total Due:</span>
              <span className="text-xl font-extrabold">{formatCurrency(pdfPreviewInvoice.amount)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setPdfPreviewInvoice(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-xs font-semibold hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-semibold text-white">Generate Client Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Dynamics Corp"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Client Billing Email</label>
                  <input
                    type="email"
                    placeholder="billing@client.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Invoice Amount (USD)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Related Project</label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  {projects.length === 0 && (
                    <option value="General Milestone">General Milestone</option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:opacity-90"
                >
                  Dispatch Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-semibold text-white">Record Operating Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Expense Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS & Supabase Cloud Hosting"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
                >
                  <option value="software">Software / SaaS</option>
                  <option value="contractor">Contractor Payout</option>
                  <option value="payroll">Payroll</option>
                  <option value="marketing">Marketing & Ads</option>
                  <option value="office">Office & Infra</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-1.5 text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-black font-semibold rounded-lg"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-semibold text-white">Add New Client</h3>
              <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Apex Robotics Corp"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Billing Email</label>
                <input
                  type="email"
                  required
                  placeholder="billing@apex.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-3 py-1.5 text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-black font-semibold rounded-lg"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
