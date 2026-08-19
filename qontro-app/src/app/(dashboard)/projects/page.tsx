'use client';

import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Clock, 
  DollarSign,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Project, ProjectStatus } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function ProjectsPage() {
  const { projects, members, addProject, deleteProject } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(25000);
  const [deadline, setDeadline] = useState('2026-09-01');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [leadMemberId, setLeadMemberId] = useState(members[0]?.id || '');

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      workspace_id: 'ws_prod_01',
      name,
      client_name: clientName,
      description,
      budget: Number(budget),
      deadline,
      status,
      lead_member_id: leadMemberId,
    });

    setName('');
    setClientName('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-emerald-400" />
            Company Projects
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Track operational health scores, milestones, client contracts, and resource allocations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:opacity-90 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-2 text-xs">
        {['all', 'active', 'warning', 'critical', 'planning', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg capitalize font-medium transition-colors",
              statusFilter === tab
                ? "bg-[#2a2a2a] text-white font-semibold"
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const leadMember = members.find((m) => m.id === project.lead_member_id);
          return (
            <div
              key={project.id}
              className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 space-y-4 shadow-sm hover:border-[#383838] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                      project.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      project.status === 'warning' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      project.status === 'critical' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {project.status}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{project.name}</h3>
                    <div className="text-xs text-gray-400 font-medium">{project.client_name}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{project.health_score}%</div>
                    <div className="text-[10px] text-gray-400">Health</div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                  {project.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Task Completion</span>
                    <span className="font-semibold text-gray-200">
                      {project.completed_tasks} / {project.total_tasks} ({project.health_score}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden">
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
              </div>

              {/* Bottom Meta & Delete */}
              <div className="pt-4 border-t border-[#262626] space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formatCurrency(project.budget)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Lead: <strong className="text-gray-200">{leadMember ? leadMember.name : 'Founder'}</strong></span>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-gray-500 hover:text-red-400"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-[#2a2a2a] p-12 text-center text-xs text-gray-500">
            No projects in this category. Click &quot;Create Project&quot; to begin.
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-semibold text-white">Create New Project</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Robotics Portal v2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Corp"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Contract Budget (USD)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Description & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Overview of objectives and deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Assigned Lead</label>
                  <select
                    value={leadMemberId}
                    onChange={(e) => setLeadMemberId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:opacity-90"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
