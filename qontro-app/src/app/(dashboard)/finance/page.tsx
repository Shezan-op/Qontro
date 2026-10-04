'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Download, 
  TrendingDown, 
  Trash2, 
  FileText,
  X,
  Building2,
  Users,
  Receipt
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Invoice, InvoiceStatus, Expense, Client } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { QontroSupabaseService } from '@/services/supabaseService';

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
    addClient,
    currentWorkspace
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'clients'>('invoices');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [pdfPreviewInvoice, setPdfPreviewInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfitEstimate = totalSettledRevenue - totalExpenses;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const invoiceNumber = await QontroSupabaseService.generateInvoiceNumber(currentWorkspace.id);

    addInvoice({
      workspace_id: currentWorkspace.id,
      invoice_number: invoiceNumber,
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
      workspace_id: currentWorkspace.id,
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
      workspace_id: currentWorkspace.id,
      name: newClientName,
      company_name: newClientCompany,
      email: newClientEmail,
      phone: '',
      status: 'active',
    });

    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setShowClientModal(false);
  };

  const handleDownloadPDF = async () => {
    if (!pdfPreviewInvoice) return;
    setIsGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById('invoice-print-area');
      if (!element) return;

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Invoice_${pdfPreviewInvoice.invoice_number}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-zinc-100" />
            Money Flow & Receivables
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track business revenue health, operational burn, client contracts, and generate PDF invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#0e0e13] border border-[#1f1f26] hover:bg-zinc-800 text-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            Record Expense
          </button>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-4 space-y-1">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
            Settled Revenue
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{formatCurrency(totalSettledRevenue)}</div>
          <div className="text-[10px] text-zinc-500 font-mono">Paid into account</div>
        </div>

        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-4 space-y-1">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
            Pending Receivables
          </div>
          <div className="text-xl font-bold text-white font-mono">{formatCurrency(totalPending)}</div>
          <div className="text-[10px] text-zinc-500 font-mono">Unsettled invoices</div>
        </div>

        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-4 space-y-1">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
            Total Expenses
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono">{formatCurrency(totalExpenses)}</div>
          <div className="text-[10px] text-zinc-500 font-mono">Infra, API & tools</div>
        </div>

        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-4 space-y-1">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
            Estimated Net Profit
          </div>
          <div className={cn("text-xl font-bold font-mono", netProfitEstimate >= 0 ? "text-white" : "text-rose-400")}>
            {formatCurrency(netProfitEstimate)}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">Revenue minus burn</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#18181f] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
            activeTab === 'invoices' ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm" : "text-zinc-400 hover:text-white"
          )}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
            activeTab === 'expenses' ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm" : "text-zinc-400 hover:text-white"
          )}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={cn(
            "px-3 py-1.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
            activeTab === 'clients' ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm" : "text-zinc-400 hover:text-white"
          )}
        >
          Clients Directory ({clients.length})
        </button>
      </div>

      {/* 1. Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0c10] border-b border-[#18181f] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">PDF & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14141c] text-zinc-300">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-zinc-300 font-medium">{inv.invoice_number}</td>
                    <td className="py-2.5 px-4 font-semibold text-white">{inv.client_name}</td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px]">{inv.project_name}</td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px]">{inv.due_date}</td>
                    <td className="py-2.5 px-4 font-bold text-white font-mono">{formatCurrency(inv.amount)}</td>
                    <td className="py-2.5 px-4">
                      <select
                        value={inv.status}
                        onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                        className="bg-[#0d0d12] border border-[#22222a] rounded px-2 py-0.5 text-[10px] font-mono text-zinc-200 focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setPdfPreviewInvoice(inv)}
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10.5px] text-zinc-200 border border-zinc-800 transition-colors inline-flex items-center gap-1 cursor-pointer font-mono"
                      >
                        <FileText className="w-3 h-3 text-sky-400" /> View PDF
                      </button>
                      <button
                        onClick={() => deleteInvoice(inv.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
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
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] overflow-hidden">
          <div className="p-3.5 border-b border-[#18181f] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-mono uppercase">Operational Expense Ledger</h3>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3 py-1 bg-white text-black font-semibold text-xs rounded-md hover:bg-zinc-200 cursor-pointer"
            >
              + Add Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0c10] border-b border-[#18181f] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-4">Expense Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14141c] text-zinc-300">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-white">{exp.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px]">{exp.date}</td>
                    <td className="py-2.5 px-4 font-bold text-rose-400 font-mono">{formatCurrency(exp.amount)}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs">
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
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#18181f]">
            <h3 className="text-xs font-bold text-white font-mono uppercase">Client Directory</h3>
            <button
              onClick={() => setShowClientModal(true)}
              className="px-3 py-1 bg-white text-black font-semibold text-xs rounded-md hover:bg-zinc-200 cursor-pointer"
            >
              + Add Client
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {clients.map((c) => (
              <div key={c.id} className="p-3.5 rounded-lg bg-[#0d0d11] border border-[#1c1c24] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs">{c.company_name}</div>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {c.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">{c.name} • {c.email}</div>
                {c.total_billed !== undefined && (
                  <div className="text-[10px] text-zinc-400 pt-1 font-mono">
                    Billed: <strong className="text-zinc-200">{formatCurrency(c.total_billed)}</strong>
                  </div>
                )}
              </div>
            ))}
            {clients.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
                No client accounts created yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Generation Preview Modal */}
      {pdfPreviewInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-black rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-100">
            <div id="invoice-print-area" className="p-8 space-y-6 flex-1 overflow-y-auto bg-white text-black font-sans">
              <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-black font-mono">INVOICE</h2>
                  <div className="text-xs text-gray-500 font-medium">{currentWorkspace.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-black font-mono">{pdfPreviewInvoice.invoice_number}</div>
                  <div className="text-xs text-gray-500 font-mono">Due: {pdfPreviewInvoice.due_date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[9.5px] uppercase font-bold text-gray-400 font-mono">Billed To</div>
                  <div className="font-bold text-gray-900 mt-1">{pdfPreviewInvoice.client_name}</div>
                  <div className="text-gray-500 font-mono">{pdfPreviewInvoice.client_email || 'accounts@client.com'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9.5px] uppercase font-bold text-gray-400 font-mono">Issue Date</div>
                  <div className="font-semibold text-gray-800 mt-1 font-mono">{pdfPreviewInvoice.issue_date}</div>
                  <div className="text-[9.5px] uppercase font-bold text-gray-400 mt-2 font-mono">Project</div>
                  <div className="text-gray-600 font-medium">{pdfPreviewInvoice.project_name}</div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 px-3">Engineering, product architecture & milestone sprint for {pdfPreviewInvoice.project_name}</td>
                    <td className="py-3 px-3 text-right font-bold font-mono">{formatCurrency(pdfPreviewInvoice.amount)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="w-48 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-gray-500 font-mono">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(pdfPreviewInvoice.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-black border-t border-gray-200 pt-1.5 font-mono">
                    <span>Total Due:</span>
                    <span>{formatCurrency(pdfPreviewInvoice.amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-3.5 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPdfPreviewInvoice(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-black cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="px-4 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isGeneratingPdf ? 'Rendering PDF...' : 'Download PDF Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white">Create Client Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Client Company</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dynamics Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Client Billing Email</label>
                <input
                  type="email"
                  required
                  placeholder="billing@apexdynamics.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Amount ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Associated Project</label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  {projects.length === 0 && <option value="General Scope">General Scope</option>}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white">Record Operating Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Expense Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DeepSeek API Inference Tier"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="software">Software</option>
                    <option value="contractor">Contractor</option>
                    <option value="marketing">Marketing</option>
                    <option value="payroll">Payroll</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Amount ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white">Add Client Account</h3>
              <button onClick={() => setShowClientModal(false)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dynamics Corp"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Primary Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Billing Email</label>
                <input
                  type="email"
                  required
                  placeholder="marcus@apexdynamics.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
