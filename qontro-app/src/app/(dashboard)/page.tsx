'use client';

import React from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  FolderGit2, 
  Sparkles, 
  TrendingUp, 
  Users,
  Check,
  X,
  ArrowRight,
  Zap,
  Activity,
  Plus,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCurrency, cn } from '@/lib/utils';

export default function CommandCockpitPage() {
  const { 
    projects, 
    tasks, 
    members, 
    invoices, 
    aiRecommendations,
    approveAIRecommendation,
    dismissAIRecommendation 
  } = useAppStore();

  // Metrics computation
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'warning' || p.status === 'critical');
  const atRiskProjects = projects.filter((p) => p.status === 'warning' || p.status === 'critical');
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
  const overloadedMembers = members.filter((m) => m.workload_percentage >= 85);
  
  const pendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const totalPendingCash = pendingInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const overdueCash = invoices.filter((i) => i.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);

  const pendingRecs = aiRecommendations.filter((r) => r.status === 'pending');
  const hasZeroProjects = projects.length === 0;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Executive Operations Header */}
      <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              FOUNDER OPERATIONS COCKPIT · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {hasZeroProjects 
                ? "Workspace initialized and ready for production operations."
                : `Tracking ${activeProjects.length} active initiatives · ${urgentTasks.length} urgent blockers · ${pendingRecs.length} AI action items.`}
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              {hasZeroProjects
                ? "Launch your first client project or add teammates to track live velocity and automated workload balancing."
                : `Operations summary: ${atRiskProjects.length} projects require risk mitigation. ${formatCurrency(totalPendingCash)} pending across client accounts.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {hasZeroProjects ? (
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Launch Project
              </Link>
            ) : (
              <Link
                href="/ai-ops"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                Review AI Actions ({pendingRecs.length})
              </Link>
            )}
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#141418] hover:bg-[#1c1c22] text-zinc-200 border border-[#272730] font-medium text-xs transition-colors"
            >
              Execution Board
            </Link>
          </div>
        </div>

        {/* 4 Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#18181f]">
          <div className="p-3.5 rounded-lg bg-[#0d0d11] border border-[#1a1a22]">
            <div className="text-[10.5px] font-mono text-zinc-400 font-medium">AT-RISK INITIATIVES</div>
            <div className="text-lg font-bold text-white font-mono mt-1 flex items-center gap-1.5">
              <span>{atRiskProjects.length}</span>
              <span className="text-xs text-zinc-400 font-normal">/ {projects.length} total</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0d11] border border-[#1a1a22]">
            <div className="text-[10.5px] font-mono text-zinc-400 font-medium">CRITICAL BLOCKERS</div>
            <div className="text-lg font-bold text-white font-mono mt-1 flex items-center gap-1.5">
              <span>{urgentTasks.length}</span>
              <span className="text-xs text-zinc-400 font-normal">urgent tasks</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0d11] border border-[#1a1a22]">
            <div className="text-[10.5px] font-mono text-zinc-400 font-medium">CAPACITY OVERLOADS</div>
            <div className="text-lg font-bold text-white font-mono mt-1 flex items-center gap-1.5">
              <span>{overloadedMembers.length}</span>
              <span className="text-xs text-zinc-400 font-normal">members &gt;80%</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0d11] border border-[#1a1a22]">
            <div className="text-[10.5px] font-mono text-zinc-400 font-medium">PENDING RECEIVABLES</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {formatCurrency(totalPendingCash)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: AI Recommendations & Projects */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Decision Hub */}
          <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#18181f]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">AI Operations Triage</h2>
                <span className="text-[10px] font-mono text-zinc-400">({pendingRecs.length} pending actions)</span>
              </div>
              <Link href="/ai-ops" className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1">
                Deep Triage Console <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingRecs.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-4 rounded-lg bg-[#0d0d11] border border-[#1c1c24] space-y-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {rec.type}
                        </span>
                        <h3 className="text-xs font-bold text-zinc-100">{rec.title}</h3>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{rec.description}</p>
                    </div>

                    {rec.match_score && (
                      <div className="shrink-0 text-right px-2 py-1 rounded bg-[#08080b] border border-[#22222a]">
                        <div className="text-xs font-bold text-emerald-400 font-mono">{rec.match_score}%</div>
                        <div className="text-[8.5px] text-zinc-500 uppercase font-mono">Precision</div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#050507] p-2.5 rounded border border-[#16161c] space-y-1">
                    {rec.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-zinc-300">
                        <span className="w-1 h-1 rounded-full bg-zinc-500 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => dismissAIRecommendation(rec.id)}
                      className="px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => approveAIRecommendation(rec.id)}
                      className="px-3 py-1 rounded text-xs font-semibold bg-white hover:bg-zinc-200 text-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3 h-3 text-black" /> Approve Action
                    </button>
                  </div>
                </div>
              ))}

              {pendingRecs.length === 0 && (
                <div className="text-center py-8 text-xs text-zinc-400 bg-[#0d0d11] rounded-lg border border-[#18181f]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  All operations running smoothly. No critical bottlenecks detected.
                </div>
              )}
            </div>
          </div>

          {/* Active Projects & Velocity */}
          <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#18181f]">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">Active Projects & Velocity</h2>
                <span className="text-[10px] font-mono text-zinc-400">({projects.length} initiatives)</span>
              </div>
              <Link href="/projects" className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-lg space-y-2">
                <div>No active projects in this workspace.</div>
                <Link href="/projects" className="inline-block px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold">
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3.5 rounded-lg bg-[#0d0d11] border border-[#1c1c24] space-y-2.5 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <h3 className="text-xs font-bold text-zinc-100 truncate">{project.name}</h3>
                        <div className="text-[10px] text-zinc-400 truncate">{project.client_name}</div>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase",
                        project.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        project.status === 'warning' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        project.status === 'critical' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      )}>
                        {project.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        {(() => {
                          const prjTasks = tasks.filter(t => t.project_id === project.id);
                          const done = prjTasks.filter(t => t.status === 'completed').length;
                          return <span>TASKS: {done}/{prjTasks.length}</span>;
                        })()}
                        <span className="text-zinc-300 font-bold">{project.health_score}% HEALTH</span>
                      </div>
                      <div className="w-full h-1 bg-[#050507] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            project.health_score >= 80 ? "bg-emerald-400" :
                            project.health_score >= 50 ? "bg-amber-400" : "bg-rose-400"
                          )}
                          style={{ width: `${project.health_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-[10.5px] text-zinc-400 border-t border-[#18181f] font-mono">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className="font-bold text-zinc-200">{formatCurrency(project.budget)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Team Bandwidth & Cash Flow */}
        <div className="space-y-6">
          
          {/* Team Bandwidth */}
          <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#18181f]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">Team Bandwidth</h2>
              </div>
              <Link href="/team" className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1">
                Skill Matrix <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {members.map((member) => (
                <div key={member.id} className="p-2.5 rounded-lg bg-[#0d0d11] border border-[#1c1c24] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{member.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{member.designation}</div>
                    </div>
                    <span className={cn(
                      "text-[11px] font-bold font-mono",
                      member.workload_percentage >= 85 ? "text-rose-400" :
                      member.workload_percentage >= 60 ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {member.workload_percentage}%
                    </span>
                  </div>

                  <div className="w-full h-1 bg-[#050507] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        member.workload_percentage >= 85 ? "bg-rose-500" :
                        member.workload_percentage >= 60 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${member.workload_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Flow Snapshot */}
          <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#18181f]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">Money Flow</h2>
              </div>
              <Link href="/finance" className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1">
                Invoices <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0d0d11] border border-[#1c1c24] space-y-1">
              <div className="text-[10px] text-zinc-400 font-mono uppercase">Total Pending Receivables</div>
              <div className="text-xl font-bold text-white font-mono tracking-tight">{formatCurrency(totalPendingCash)}</div>
              {overdueCash > 0 && (
                <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium pt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {formatCurrency(overdueCash)} overdue (Action required)
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">Recent Invoices</div>
              {invoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="p-2.5 rounded-lg bg-[#0d0d11] border border-[#1c1c24] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-zinc-200">{inv.client_name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{inv.invoice_number}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-zinc-100">{formatCurrency(inv.amount)}</div>
                    <span className={cn(
                      "text-[8.5px] uppercase font-bold",
                      inv.status === 'paid' ? "text-emerald-400" :
                      inv.status === 'overdue' ? "text-rose-400" : "text-sky-400"
                    )}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

