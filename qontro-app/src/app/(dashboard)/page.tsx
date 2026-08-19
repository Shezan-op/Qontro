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
  ShieldAlert,
  ArrowRight,
  Zap,
  Activity,
  Plus
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
    <div className="space-y-8">
      {/* 10-Second Morning Founder Briefing Card */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/40 bg-gradient-to-r from-[#091124] via-[#0d1424] to-[#06080d] p-6 md:p-8 shadow-2xl backdrop-blur-xl glow-blue">
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              Founder Morning Brief • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {hasZeroProjects 
                ? "Your workspace is clean and ready for production operations."
                : `Operations require attention across ${atRiskProjects.length} projects & ${pendingRecs.length} AI action items.`}
            </h1>
            <p className="text-xs md:text-sm text-gray-300 max-w-2xl leading-relaxed">
              {hasZeroProjects
                ? "Start by creating your first client project or inviting your team members to track verified skill graphs and live bandwidth."
                : `Active tracking: ${activeProjects.length} active projects, ${urgentTasks.length} urgent blockers, and ${formatCurrency(totalPendingCash)} in pending receivables.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasZeroProjects ? (
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                Create First Project
              </Link>
            ) : (
              <Link
                href="/ai-ops"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <Zap className="w-4 h-4" />
                Review AI Action Plan ({pendingRecs.length})
              </Link>
            )}
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-semibold text-xs transition-all"
            >
              Open Execution Board
            </Link>
          </div>
        </div>

        {/* Rapid Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="text-[11px] font-medium text-gray-400">At-Risk Projects</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1 flex items-center gap-1.5">
              {atRiskProjects.length} / {projects.length}
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="text-[11px] font-medium text-gray-400">Urgent Blockers</div>
            <div className="text-xl font-extrabold text-red-400 mt-1 flex items-center gap-1.5">
              {urgentTasks.length}
              <span className="text-xs text-gray-400 font-normal">tasks</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="text-[11px] font-medium text-gray-400">Overloaded Teammates</div>
            <div className="text-xl font-extrabold text-purple-400 mt-1 flex items-center gap-1.5">
              {overloadedMembers.length}
              <span className="text-[10px] text-gray-400 font-normal">(&gt;85% load)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="text-[11px] font-medium text-gray-400">Pending Receivables</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {formatCurrency(totalPendingCash)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Command Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: AI Recommendations & Project Health */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Decision Hub */}
          <div className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">AI Operations Recommendations</h2>
              </div>
              <span className="text-xs text-gray-400">DeepSeek-V4 Powered • Founder Approves</span>
            </div>

            <div className="space-y-3">
              {pendingRecs.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-4 rounded-xl bg-[#141824] border border-[#232938] space-y-3 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                          rec.type === 'assignment' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          rec.type === 'overload' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {rec.type}
                        </span>
                        <h3 className="text-sm font-bold text-gray-100">{rec.title}</h3>
                      </div>
                      <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">{rec.description}</p>
                    </div>

                    {rec.match_score && (
                      <div className="shrink-0 text-right">
                        <div className="text-base font-bold text-emerald-400">{rec.match_score}%</div>
                        <div className="text-[10px] text-gray-400">Skill Match</div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#090b12] p-2.5 rounded-lg border border-white/5 space-y-1">
                    {rec.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => dismissAIRecommendation(rec.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Dismiss
                    </button>
                    <button
                      onClick={() => approveAIRecommendation(rec.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Action
                    </button>
                  </div>
                </div>
              ))}

              {pendingRecs.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  All operations running smoothly. No critical bottlenecks detected.
                </div>
              )}
            </div>
          </div>

          {/* Project Health Overview */}
          <div className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Active Projects & Deadlines</h2>
              </div>
              <Link href="/projects" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                View all ({projects.length}) <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-[#1f2430] rounded-xl space-y-2">
                <div>No active projects in this workspace.</div>
                <Link href="/projects" className="inline-block px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-[#141824] border border-[#232938] space-y-3 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-gray-100 truncate">{project.name}</h3>
                        <div className="text-xs text-gray-400">{project.client_name}</div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase",
                        project.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        project.status === 'warning' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        project.status === 'critical' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      )}>
                        {project.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>Tasks ({project.completed_tasks}/{project.total_tasks})</span>
                        <span className="font-bold text-gray-200">{project.health_score}% Health</span>
                      </div>
                      <div className="w-full h-2 bg-[#090b12] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            project.health_score >= 80 ? "bg-emerald-500" :
                            project.health_score >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${project.health_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400 border-t border-white/5">
                      <div className="flex items-center gap-1 text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <span className="font-bold text-gray-200">{formatCurrency(project.budget)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Team Workload & Cash Flow Snapshot */}
        <div className="space-y-8">
          
          {/* Team Workload Meter */}
          <div className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Team Bandwidth</h2>
              </div>
              <Link href="/team" className="text-xs text-blue-400 hover:underline">
                Skill Graph
              </Link>
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="p-3 rounded-xl bg-[#141824] border border-[#232938] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-200">{member.name}</div>
                      <div className="text-[10px] text-gray-400">{member.designation}</div>
                    </div>
                    <span className={cn(
                      "text-xs font-extrabold font-mono",
                      member.workload_percentage >= 85 ? "text-red-400" :
                      member.workload_percentage >= 60 ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {member.workload_percentage}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#090b12] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        member.workload_percentage >= 85 ? "bg-red-500" :
                        member.workload_percentage >= 60 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${member.workload_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Flow & Invoicing Snapshot */}
          <div className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Money Flow</h2>
              </div>
              <Link href="/finance" className="text-xs text-blue-400 hover:underline">
                Invoices
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-[#121c2e] to-[#0c101c] border border-blue-500/30 space-y-2 glow-blue">
              <div className="text-[11px] text-gray-400">Total Pending Receivables</div>
              <div className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(totalPendingCash)}</div>
              {overdueCash > 0 && (
                <div className="text-xs text-red-400 flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {formatCurrency(overdueCash)} is overdue (Action required)
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Recent Invoices</div>
              {invoices.length === 0 ? (
                <div className="text-[11px] text-gray-400 py-3 text-center border border-dashed border-[#1f2430] rounded-lg">
                  No invoices generated yet.
                </div>
              ) : (
                invoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-lg bg-[#141824] border border-[#232938] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-200">{inv.client_name}</div>
                      <div className="text-[10px] text-gray-400">{inv.invoice_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-100">{formatCurrency(inv.amount)}</div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded",
                        inv.status === 'paid' ? "bg-emerald-500/10 text-emerald-400" :
                        inv.status === 'overdue' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
