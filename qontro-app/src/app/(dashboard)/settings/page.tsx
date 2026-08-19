'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Database, 
  RefreshCw,
  Sparkles,
  Download,
  Trash2,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { 
  INITIAL_WORKSPACE, 
  INITIAL_MEMBERS, 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_SKILLS, 
  INITIAL_INVOICES, 
  INITIAL_DOCUMENTS, 
  INITIAL_AI_RECOMMENDATIONS 
} from '@/lib/mock-data';

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

  const handleLoadDemoCompany = () => {
    setResetting(true);
    useAppStore.setState({
      currentWorkspace: INITIAL_WORKSPACE,
      members: INITIAL_MEMBERS,
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      skills: INITIAL_SKILLS,
      invoices: INITIAL_INVOICES,
      documents: INITIAL_DOCUMENTS,
      aiRecommendations: INITIAL_AI_RECOMMENDATIONS,
    });
    setTimeout(() => {
      setResetting(false);
      alert('Sample agency data (Hyperion Labs) populated successfully!');
    }, 300);
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
    <div className="space-y-8 max-w-4xl font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage multi-tenant workspaces, team permissions, data exports, and cloud parameters.
        </p>
      </div>

      <div className="space-y-6">
        {/* Workspace Switcher & Multi-Tenant Management */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-white">Workspaces Directory ({workspaces.length})</h2>
            </div>
            <button
              onClick={() => setShowNewWorkspaceModal(true)}
              className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:opacity-90 flex items-center gap-1"
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
                  "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                  ws.id === currentWorkspace.id
                    ? "bg-[#222222] border-[#444444] shadow-sm"
                    : "bg-[#161616] border-[#2a2a2a] hover:border-[#383838]"
                )}
              >
                <div>
                  <div className="font-bold text-white text-xs">{ws.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">Slug: {ws.slug} • {ws.currency}</div>
                </div>
                {ws.id === currentWorkspace.id && (
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Company Profile Details */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#262626]">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Current Company Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Organization Name</label>
              <input
                type="text"
                defaultValue={currentWorkspace.name}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Tenant Key (Immutable)</label>
              <input
                type="text"
                disabled
                defaultValue={currentWorkspace.slug}
                className="w-full bg-[#141414]/60 border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Base Currency</label>
              <input
                type="text"
                defaultValue={currentWorkspace.currency}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">System Timezone</label>
              <input
                type="text"
                defaultValue="UTC+05:30 (IST)"
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Team Members Management */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Workspace Members ({members.length})</h2>
            </div>

            <button
              onClick={() => setShowAddMember(true)}
              className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Invite Member
            </button>
          </div>

          {showAddMember && (
            <form onSubmit={handleCreateMember} className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] space-y-3 text-xs">
              <div className="font-bold text-white">Invite New Team Member</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
                <input
                  type="email"
                  required
                  placeholder="Corporate Email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Designation (e.g. Lead Frontend Dev)"
                  value={newMemberDesignation}
                  onChange={(e) => setNewMemberDesignation(e.target.value)}
                  className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
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
                  className="px-3 py-1.5 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-black rounded-lg font-semibold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#262626]">
            {members.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {member.name}
                    {member.role === 'owner' && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-[11px]">{member.email} • {member.designation}</div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-gray-300 font-semibold">{member.workload_percentage}% Load</span>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => deleteMember(member.id)}
                      className="text-gray-500 hover:text-red-400"
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
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#262626]">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Data Management & Sandbox Controls</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportWorkspace}
              className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border border-[#333333] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Full Workspace JSON
            </button>

            <button
              onClick={handleClearAllData}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Workspace (Clean Blank Slate)
            </button>

            <button
              onClick={handleLoadDemoCompany}
              disabled={resetting}
              className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border border-[#333333] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", resetting && "animate-spin")} />
              Load Sample Agency Sandbox
            </button>
          </div>
        </div>
      </div>

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-semibold text-white">Create New Workspace</h3>
              <button onClick={() => setShowNewWorkspaceModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dynamics Studio"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Currency</label>
                <select
                  value={newWsCurrency}
                  onChange={(e) => setNewWsCurrency(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWorkspaceModal(false)}
                  className="px-3 py-1.5 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-black font-semibold rounded-lg"
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
