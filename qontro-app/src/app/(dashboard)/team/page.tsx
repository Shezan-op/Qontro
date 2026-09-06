'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Award, 
  Activity, 
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Layers
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

export default function TeamPage() {
  const { members, skills, tasks } = useAppStore();
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const memberSkills = skills.filter((s) => s.user_id === selectedMember?.user_id);
  const memberTasks = tasks.filter((t) => t.assigned_to === selectedMember?.id);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-zinc-100" />
            Team & Operational Skill Matrix
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track individual capabilities, task verification scores, and real-time operational capacity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Member Directory List */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 font-mono">
            Workspace Members ({members.length})
          </div>

          <div className="space-y-2">
            {members.map((member) => {
              const isSelected = member.id === selectedMemberId;
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer space-y-1.5",
                    isSelected
                      ? "bg-[#101015] border-zinc-600 shadow-sm"
                      : "bg-[#08080a] border-[#1f1f26] hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white font-mono">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{member.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{member.designation}</div>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded",
                      member.workload_percentage >= 85 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      member.workload_percentage >= 60 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}>
                      {member.workload_percentage}% Load
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Detailed Member Profile & Verified Skill Graph */}
        <div className="lg:col-span-2 space-y-4">
          {selectedMember && (
            <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-6 space-y-6 shadow-sm">
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#18181f]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-bold text-white font-mono">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{selectedMember.name}</h2>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                        {selectedMember.role}
                      </span>
                    </div>
                    <div className="text-xs text-sky-400 font-medium">{selectedMember.designation}</div>
                    <div className="text-[10.5px] text-zinc-500 mt-0.5 font-mono">{selectedMember.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#040406] p-3 rounded-lg border border-[#18181f]">
                  <div>
                    <div className="text-[9.5px] text-zinc-500 font-mono uppercase">Current Workload</div>
                    <div className="text-lg font-bold text-white font-mono">{selectedMember.workload_percentage}%</div>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Activity className={cn(
                      "w-4 h-4",
                      selectedMember.workload_percentage >= 85 ? "text-rose-400" :
                      selectedMember.workload_percentage >= 60 ? "text-amber-400" : "text-emerald-400"
                    )} />
                  </div>
                </div>
              </div>

              {/* Verified Skill Graph */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Verified Skill Ratings (Scored via Workflows)
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {memberSkills.map((sk) => (
                    <div key={sk.id} className="p-3 rounded-lg bg-[#040406] border border-[#18181f] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">{sk.skill_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-mono">({sk.verified_tasks_count} verified tasks)</span>
                          <span className="font-bold text-emerald-400 font-mono text-xs">{sk.score} / 10</span>
                        </div>
                      </div>

                      <div className="w-full h-1 bg-[#101015] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${sk.score * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {memberSkills.length === 0 && (
                    <div className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-lg">
                      No explicit skill scores recorded for this member yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Tasks Assigned to Member */}
              <div className="space-y-3 pt-4 border-t border-[#18181f]">
                <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-sky-400" />
                  Active Tasks Under Management ({memberTasks.length})
                </h3>

                <div className="space-y-2">
                  {memberTasks.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-[#040406] border border-[#18181f] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-zinc-200">{t.title}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{t.project_name}</div>
                      </div>
                      <span className={cn(
                        "text-[8.5px] uppercase font-bold px-1.5 py-0.2 rounded font-mono",
                        t.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" :
                        t.status === 'blocked' ? "bg-rose-500/10 text-rose-400" : "bg-sky-500/10 text-sky-400"
                      )}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                  {memberTasks.length === 0 && (
                    <div className="text-xs text-zinc-500 py-4 text-center">No active tasks assigned.</div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
