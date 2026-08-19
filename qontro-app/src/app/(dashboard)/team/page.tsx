'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Activity, 
  ShieldCheck,
  Plus
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Team & Operational Skill Graphs
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track individual capabilities, task verification scores, and live operational workload.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Member Directory List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
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
                    "p-4 rounded-xl border transition-all cursor-pointer space-y-2",
                    isSelected
                      ? "bg-[#181d2a] border-blue-500/40 shadow-lg shadow-blue-500/10"
                      : "bg-[#11131a] border-[#1f2430] hover:border-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-xs text-white">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{member.name}</div>
                        <div className="text-[10px] text-gray-400">{member.designation}</div>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full",
                      member.workload_percentage >= 85 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
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
        <div className="lg:col-span-2 space-y-6">
          {selectedMember && (
            <div className="rounded-2xl border border-[#1f2430] bg-[#11131a] p-6 space-y-6 shadow-xl">
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1f2430]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-blue-500/20">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{selectedMember.name}</h2>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">
                        {selectedMember.role}
                      </span>
                    </div>
                    <div className="text-xs text-blue-400 font-medium">{selectedMember.designation}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{selectedMember.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#161924] p-3 rounded-xl border border-[#232938]">
                  <div>
                    <div className="text-[10px] text-gray-400">Current Workload</div>
                    <div className="text-xl font-bold text-white">{selectedMember.workload_percentage}%</div>
                  </div>
                  <div className="w-12 h-12 flex items-center justify-center">
                    <Activity className={cn(
                      "w-6 h-6",
                      selectedMember.workload_percentage >= 85 ? "text-red-400" :
                      selectedMember.workload_percentage >= 60 ? "text-amber-400" : "text-emerald-400"
                    )} />
                  </div>
                </div>
              </div>

              {/* Verified Skill Graph */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Verified Skill Ratings (AI Scored via Completed Workflows)
                  </h3>
                </div>

                <div className="space-y-3">
                  {memberSkills.map((sk) => (
                    <div key={sk.id} className="p-3.5 rounded-xl bg-[#161924] border border-[#232938] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-200">{sk.skill_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">({sk.verified_tasks_count} verified tasks)</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">{sk.score} / 10</span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-[#0e1017] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${sk.score * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {memberSkills.length === 0 && (
                    <div className="text-xs text-gray-400 py-4 text-center border border-dashed border-[#1f2430] rounded-xl">
                      No explicit skill scores recorded for this member yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Tasks Assigned to Member */}
              <div className="space-y-3 pt-4 border-t border-[#1f2430]">
                <h3 className="text-sm font-semibold text-white">
                  Active Tasks Under Management ({memberTasks.length})
                </h3>

                <div className="space-y-2">
                  {memberTasks.map((t) => (
                    <div key={t.id} className="p-3 rounded-lg bg-[#161924] border border-[#232938] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-gray-200">{t.title}</div>
                        <div className="text-[10px] text-gray-400">{t.project_name}</div>
                      </div>
                      <span className={cn(
                        "text-[9px] uppercase font-bold px-2 py-0.5 rounded",
                        t.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" :
                        t.status === 'blocked' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
