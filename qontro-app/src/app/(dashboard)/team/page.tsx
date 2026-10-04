'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Award, 
  Activity, 
  Briefcase, 
  UserPlus, 
  Mail, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { WorkspaceRole } from '@/types';

export default function TeamPage() {
  const { 
    members, 
    skills, 
    tasks, 
    invitations, 
    addInvitation, 
    cancelInvitation, 
    currentWorkspace 
  } = useAppStore();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member');
  const [inviteName, setInviteName] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const memberSkills = skills.filter(
    (s) => s.member_id === selectedMember?.id || s.user_id === selectedMember?.user_id
  );
  const memberTasks = tasks.filter((t) => t.assigned_to === selectedMember?.id);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setSubmittingInvite(true);
      setErrorMessage(null);

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await addInvitation({
        workspace_id: currentWorkspace.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        token,
        expires_at: expiresAt.toISOString(),
      });

      setInviteEmail('');
      setInviteName('');
      setInviteDesignation('');
      setShowInviteModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue workspace invitation';
      setErrorMessage(msg);
    } finally {
      setSubmittingInvite(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#18181f]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-sky-400" />
            Team & Operational Skill Matrix
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track individual capabilities, task verification scores, and real-time operational capacity.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-semibold text-xs transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Teammate</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Member Directory List & Invitations */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 font-mono">
              Active Members ({members.length})
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

          {/* Pending Invitations Section (Rule 13) */}
          {invitations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#18181f]">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 font-mono">
                Pending Invitations ({invitations.filter((i) => i.status === 'pending').length})
              </div>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-lg bg-[#060608] border border-[#18181f] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-medium truncate max-w-[150px]">
                        <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="truncate">{inv.email}</span>
                      </div>
                      <span className={cn(
                        "text-[8.5px] uppercase font-bold px-1 py-0.2 rounded font-mono",
                        inv.status === 'pending' ? "bg-amber-500/10 text-amber-400" :
                        inv.status === 'accepted' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      )}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Role: {inv.role}</span>
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => cancelInvitation(inv.id)}
                          className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                    <div className="text-[9.5px] text-zinc-500 font-mono uppercase">Calculated Workload</div>
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
                  {memberSkills.map((sk) => {
                    const skillName = sk.skill_name || sk.name || 'Core Skill';
                    const scorePct = sk.score <= 10 ? sk.score * 10 : sk.score;
                    return (
                      <div key={sk.id} className="p-3 rounded-lg bg-[#040406] border border-[#18181f] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-200">{skillName}</span>
                            {sk.is_verified && (
                              <span title="Verified Skill">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({sk.verified_tasks_count || 0} verified tasks)
                            </span>
                            <span className="font-bold text-emerald-400 font-mono text-xs">
                              {sk.score} {sk.score <= 10 ? '/ 10' : '%'}
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-1 bg-[#101015] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, scorePct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {memberSkills.length === 0 && (
                    <div className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-lg">
                      No explicit skill scores recorded for this member yet. Skills automatically verify upon task completion.
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                Invite Workspace Teammate
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-zinc-400 hover:text-white p-0.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Teammate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="engineer@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Workspace Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Expiration Window</label>
                  <div className="flex items-center gap-1.5 p-2 bg-[#040406] border border-[#18181f] rounded-lg text-zinc-400 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>7 Days (Cryptographic)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/20 text-sky-300 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  Secure Multi-tenant Flow
                </div>
                <p className="text-zinc-400 text-[10.5px]">
                  Generates an unforgeable one-time token bound exclusively to this workspace ID.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingInvite ? 'Issuing Invite...' : 'Issue Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
