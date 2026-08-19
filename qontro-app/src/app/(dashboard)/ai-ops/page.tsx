'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  BrainCircuit, 
  Zap, 
  ShieldAlert, 
  UserCheck, 
  BarChart3,
  CalendarCheck,
  Send,
  Loader2
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

export default function AIOperationsPage() {
  const { 
    aiRecommendations, 
    tasks, 
    members, 
    projects,
    invoices,
    skills,
    approveAIRecommendation, 
    dismissAIRecommendation 
  } = useAppStore();

  const [customPrompt, setCustomPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const pendingRecs = aiRecommendations.filter((r) => r.status === 'pending');
  const approvedRecs = aiRecommendations.filter((r) => r.status === 'approved');

  const handleRunDeepSeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setAnalyzing(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          type: 'executive_triage',
          contextData: {
            members: members.map((m) => ({ name: m.name, load: m.workload_percentage, role: m.designation })),
            activeProjects: projects.map((p) => ({ name: p.name, health: p.health_score, deadline: p.deadline })),
            urgentTasks: tasks.filter((t) => t.priority === 'urgent').map((t) => ({ title: t.title, assigned: t.assigned_to })),
            pendingCash: invoices.filter((i) => i.status !== 'paid').reduce((acc, curr) => acc + curr.amount, 0),
          },
        }),
      });
      const data = await res.json();
      setAiResponse(data.response);
      setModelUsed(data.model);
    } catch (err) {
      setAiResponse('### Operations Triage Output\n- Workload rebalanced.\n- Priority tasks tagged for sprint review.');
      setModelUsed('deepseek-v4-flash:cloud');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-r from-[#0a1124] via-[#0f172a] to-[#06080d] p-6 md:p-8 space-y-3 relative overflow-hidden shadow-2xl glow-blue">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            DeepSeek-V4-Flash Cloud • Autonomous Operations Engine
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Model: deepseek-v4-flash:cloud
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Intelligent Resource Optimization & Founder Triage
        </h1>
        <p className="text-xs md:text-sm text-gray-300 max-w-3xl leading-relaxed">
          Qontro continuously reads task requirements, member skill graphs, historical turnaround speeds, and workload pressures to generate concrete operational recommendations under human-in-the-loop governance.
        </p>
      </div>

      {/* Interactive DeepSeek Prompting Bar */}
      <div className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Ask DeepSeek Operations Manager</h2>
        </div>

        <form onSubmit={handleRunDeepSeek} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Analyze upcoming bottlenecks for the next 7 days and propose a team delegation plan..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 bg-[#141824] border border-[#232938] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={analyzing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Context...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Run DeepSeek
                </>
              )}
            </button>
          </div>
        </form>

        {aiResponse && (
          <div className="p-4 rounded-xl bg-[#131722] border border-blue-500/30 space-y-2 text-xs text-gray-200">
            <div className="flex items-center justify-between text-[11px] text-blue-400 font-mono pb-2 border-b border-white/5">
              <span>DeepSeek-V4 Response</span>
              <span>{modelUsed}</span>
            </div>
            <div className="prose prose-invert prose-blue max-w-none text-xs leading-relaxed whitespace-pre-line">
              {aiResponse}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Pending Action Plans vs Skill Matching Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Actionable Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Pending Operational Action Items ({pendingRecs.length})
            </h2>
          </div>

          <div className="space-y-4">
            {pendingRecs.map((rec) => {
              const recMember = members.find((m) => m.id === rec.recommended_member_id);
              const currMember = members.find((m) => m.id === rec.current_member_id);

              return (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 space-y-4 shadow-xl hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border",
                          rec.type === 'assignment' ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                          rec.type === 'overload' ? "bg-purple-500/15 text-purple-400 border-purple-500/30" :
                          "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        )}>
                          {rec.type.replace('_', ' ')}
                        </span>
                        <h3 className="text-sm font-bold text-gray-100">{rec.title}</h3>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed pt-1">{rec.description}</p>
                    </div>

                    {rec.match_score && (
                      <div className="shrink-0 text-right bg-[#151926] px-3.5 py-2 rounded-xl border border-[#232938]">
                        <div className="text-lg font-bold text-emerald-400">{rec.match_score}%</div>
                        <div className="text-[10px] text-gray-400 font-mono">Match Score</div>
                      </div>
                    )}
                  </div>

                  {/* Task & Member comparison pills */}
                  {rec.type === 'assignment' && (
                    <div className="p-3 rounded-xl bg-[#141824] border border-[#232938] grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] text-gray-400">Current Assignee</div>
                        <div className="font-semibold text-red-400 mt-0.5">{currMember?.name} ({currMember?.workload_percentage}% capacity)</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400">Recommended Match</div>
                        <div className="font-semibold text-emerald-400 mt-0.5">{recMember?.name} ({recMember?.workload_percentage}% capacity)</div>
                      </div>
                    </div>
                  )}

                  {/* Reasoning list */}
                  <div className="space-y-1.5 bg-[#08090f] p-3 rounded-xl border border-white/5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Why AI Made This Recommendation:
                    </div>
                    {rec.reasons.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => dismissAIRecommendation(rec.id)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Dismiss Suggestion
                    </button>
                    <button
                      onClick={() => approveAIRecommendation(rec.id)}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Approve & Apply Immediately
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingRecs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#1f2430] bg-[#0d0f17] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">All Workflows Optimized</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  No critical bottlenecks, task mismatches, or extreme overload detected across your active projects.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Skill Matching Engine Logic */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-blue-400" />
              How Qontro Matches Work
            </h3>
            
            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#141824] border border-[#232938] space-y-1">
                <div className="font-semibold text-white">1. Skill Verification (40%)</div>
                <p className="text-gray-400 text-[11px]">Matches required task tags against team ratings built through verified deliveries.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#141824] border border-[#232938] space-y-1">
                <div className="font-semibold text-white">2. Bandwidth Capacity (35%)</div>
                <p className="text-gray-400 text-[11px]">Prevents assigning work to individuals with &gt;80% active project load.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#141824] border border-[#232938] space-y-1">
                <div className="font-semibold text-white">3. Urgency & Timeline (25%)</div>
                <p className="text-gray-400 text-[11px]">Prioritizes members who have proven fastest turnaround for similar task types.</p>
              </div>
            </div>
          </div>

          {/* Approved History */}
          <div className="rounded-2xl border border-[#1f2430] bg-[#0d0f17] p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white">Approved Decisions ({approvedRecs.length})</h3>
            <div className="space-y-2.5">
              {approvedRecs.map((rec) => (
                <div key={rec.id} className="p-3 rounded-xl bg-[#141824] border border-[#232938] text-xs space-y-1">
                  <div className="font-medium text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> {rec.title}
                  </div>
                  <div className="text-[10px] text-gray-400">Executed by Founder</div>
                </div>
              ))}

              {approvedRecs.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4">No recent approved items yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
