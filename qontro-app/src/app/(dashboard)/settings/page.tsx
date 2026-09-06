'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  RefreshCw,
  Sparkles, 
  Download, 
  Trash2, 
  Plus, 
  LogOut, 
  X, 
  Sliders, 
  ShieldCheck 
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { 
  LEADLINKED_WORKSPACE,
  LEADLINKED_MEMBERS,
  LEADLINKED_PROJECTS,
  LEADLINKED_TASKS,
  LEADLINKED_SKILLS,
  LEADLINKED_INVOICES,
  LEADLINKED_EXPENSES,
  LEADLINKED_DOCUMENTS,
  LEADLINKED_AI_RECOMMENDATIONS,
  LEADLINKED_CLIENTS,
  LEADLINKED_ACTIVITY_LOGS,
  LEADLINKED_TASK_HISTORIES,
} from '@/lib/mock-profile';

export default function SettingsPage() {
  const { 
    currentWorkspace, 
    workspaces, 
    members, 
    createWorkspace, 
    setWorkspace, 
    addMember, 
    deleteMember, 
    clearWorkspaceData 
  } = useAppStore();

  const [resetting, setResetting] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);

  // New Workspace form
  const [newWsName, setNewWsName] = useState('');
  const [newWsCurrency, setNewWsCurrency] = useState('USD');

  // New Member form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');
  const [newMemberDesignation, setNewMemberDesignation] = useState('Senior Engineer');

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspace(newWsName.trim(), newWsCurrency);
    setNewWsName('');
    setShowNewWorkspaceModal(false);
  };

  const handleLoadLeadLinked = () => {
    setResetting(true);
    useAppStore.setState({
      currentWorkspace: LEADLINKED_WORKSPACE,
      workspaces: [LEADLINKED_WORKSPACE],
      members: LEADLINKED_MEMBERS,
      projects: LEADLINKED_PROJECTS,
      tasks: LEADLINKED_TASKS,
      skills: LEADLINKED_SKILLS,
      invoices: LEADLINKED_INVOICES,
      expenses: LEADLINKED_EXPENSES,
      documents: LEADLINKED_DOCUMENTS,
      aiRecommendations: LEADLINKED_AI_RECOMMENDATIONS,
      clients: LEADLINKED_CLIENTS,
      activityLogs: LEADLINKED_ACTIVITY_LOGS,
      taskHistories: LEADLINKED_TASK_HISTORIES,
    });
    setTimeout(() => {
      setResetting(false);
    }, 300);
  };

  const handleSignOut = async () => {
    document.cookie = 'qontro-mock-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    window.location.href = '/login';
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all projects, tasks, invoices, and documents for a clean slate?')) {
      clearWorkspaceData();
    }
  };

  const handleExportWorkspace = () => {
    const data = useAppStore.getState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qontro-workspace-${currentWorkspace.slug}.json`;
    a.click();
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    addMember({
      workspace_id: currentWorkspace.id,
      user_id: `usr_${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      designation: newMemberDesignation,
      workload_percentage: 0,
      status: 'active',
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setShowAddMember(false);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-zinc-100" />
          Workspace Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage multi-tenant workspaces, team permissions, data exports, and configuration.
        </p>
      </div>

      <div className="space-y-5">
        {/* Workspace Switcher & Multi-Tenant Management */}
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#18181f]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-300" />
              <h2 className="text-xs font-bold text-white uppercase font-mono">Workspaces Directory ({workspaces.length})</h2>
            </div>
            <button
              onClick={() => setShowNewWorkspaceModal(true)}
              className="px-3 py-1 bg-white text-black font-semibold text-xs rounded-md hover:bg-zinc-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Workspace
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => setWorkspace(ws)}
                className={cn(
                  "p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between",
                  ws.id === currentWorkspace.id
                    ? "bg-[#101015] border-zinc-600 shadow-sm"
                    : "bg-[#040406] border-[#18181f] hover:border-zinc-700"
                )}
              >
                <div>
                  <div className="font-bold text-white text-xs">{ws.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Slug: {ws.slug} • {ws.currency}</div>
                </div>
                {ws.id === currentWorkspace.id && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Company Profile Details */}
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#18181f]">
            <Building2 className="w-4 h-4 text-zinc-300" />
            <h2 className="text-xs font-bold text-white uppercase font-mono">Organization Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-zinc-400 font-medium font-mono text-[10.5px] uppercase">Organization Name</label>
              <input
                type="text"
                defaultValue={currentWorkspace.name}
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-400 font-medium font-mono text-[10.5px] uppercase">Tenant Key (Immutable)</label>
              <input
                type="text"
                disabled
                defaultValue={currentWorkspace.slug}
                className="w-full bg-[#040406]/60 border border-[#18181f] rounded-lg px-3 py-1.5 text-zinc-500 cursor-not-allowed font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-400 font-medium font-mono text-[10.5px] uppercase">Base Currency</label>
              <input
                type="text"
                defaultValue={currentWorkspace.currency}
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-400 font-medium font-mono text-[10.5px] uppercase">System Timezone</label>
              <input
                type="text"
                defaultValue="UTC+05:30 (IST)"
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Team Members Management */}
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#18181f]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-300" />
              <h2 className="text-xs font-bold text-white uppercase font-mono">Workspace Members ({members.length})</h2>
            </div>

            <button
              onClick={() => setShowAddMember(true)}
              className="px-3 py-1 rounded-md bg-white text-black text-xs font-semibold hover:bg-zinc-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Invite Member
            </button>
          </div>

          {showAddMember && (
            <form onSubmit={handleCreateMember} className="p-4 rounded-lg bg-[#040406] border border-[#18181f] space-y-3 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px]">Invite New Team Member</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="bg-[#08080a] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                />
                <input
                  type="email"
                  required
                  placeholder="Corporate Email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="bg-[#08080a] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Designation (e.g. Lead Frontend Dev)"
                  value={newMemberDesignation}
                  onChange={(e) => setNewMemberDesignation(e.target.value)}
                  className="bg-[#08080a] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="bg-[#08080a] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 font-mono"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-3 py-1 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-white text-black rounded-md font-semibold hover:bg-zinc-200"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#14141c]">
            {members.map((member) => (
              <div key={member.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {member.name}
                    {member.role === 'owner' && (
                      <span className="text-[8.5px] uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono font-bold">
                        Founder
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-500 text-[10.5px] font-mono mt-0.5">{member.email} • {member.designation}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-300 font-semibold">{member.workload_percentage}% Load</span>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => deleteMember(member.id)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management & Danger Zone */}
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#18181f]">
            <Sparkles className="w-4 h-4 text-zinc-300" />
            <h2 className="text-xs font-bold text-white uppercase font-mono">Data Sandbox Controls</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleLoadLeadLinked}
              disabled={resetting}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-mono"
            >
              <RefreshCw className={cn("w-3 h-3", resetting && "animate-spin")} />
              Reload LeadLinked Profile
            </button>

            <button
              onClick={handleExportWorkspace}
              className="px-3 py-1.5 rounded-lg bg-[#0d0d12] hover:bg-zinc-800 text-zinc-200 border border-[#1f1f26] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <Download className="w-3 h-3" />
              Export JSON
            </button>

            <button
              onClick={handleClearAllData}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <Trash2 className="w-3 h-3" />
              Clear Workspace
            </button>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white">Create New Workspace</h3>
              <button onClick={() => setShowNewWorkspaceModal(false)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dynamics Studio"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Currency</label>
                <select
                  value={newWsCurrency}
                  onChange={(e) => setNewWsCurrency(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowNewWorkspaceModal(false)}
                  className="px-3 py-1 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-white text-black font-semibold rounded-md hover:bg-zinc-200"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
