'use client';

import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Search, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Trash2, 
  X,
  ChevronRight,
  User
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Project, ProjectStatus } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProjectsPage() {
  const { projects, tasks, members, addProject, deleteProject, currentWorkspace } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(25000);
  const [deadline, setDeadline] = useState('2026-08-30');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [leadMemberId, setLeadMemberId] = useState(members[0]?.id || '');

  const filteredProjects = projects.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.client_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      workspace_id: currentWorkspace.id,
      name,
      client_name: clientName,
      description,
      status,
      budget: Number(budget),
      deadline,
      lead_member_id: leadMemberId,
    });

    setName('');
    setClientName('');
    setDescription('');
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-zinc-100" />
            Projects & Initiatives
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Client milestones, delivery health scores, assigned engineering tasks, and budget allocations.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Project
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs pb-1">
          {['all', 'active', 'warning', 'critical', 'planning', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={cn(
                "px-2.5 py-1 rounded-md uppercase text-[9.5px] font-bold font-mono tracking-wider transition-all cursor-pointer",
                filterStatus === tab
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121216]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#08080a] border border-[#1f1f26] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const projectTasks = tasks.filter((t) => t.project_id === project.id);
          const completedTasks = projectTasks.filter((t) => t.status === 'completed');
          const progressPercent = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;
          const lead = members.find((m) => m.id === project.lead_member_id);

          return (
            <div
              key={project.id}
              className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-4 space-y-4 hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {project.client_name}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">{project.name}</h3>
                  </div>

                  <span className={cn(
                    "text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono shrink-0",
                    project.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    project.status === 'warning' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    project.status === 'critical' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  )}>
                    {project.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#18181f]">
                {/* Health & Task Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>PROGRESS ({progressPercent}%)</span>
                    <span className={cn(
                      "font-bold",
                      project.health_score >= 80 ? "text-emerald-400" :
                      project.health_score >= 50 ? "text-amber-400" : "text-rose-400"
                    )}>
                      {project.health_score}% HEALTH
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#040406] rounded-full overflow-hidden">
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

                {/* Metadata & Actions */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <span className="font-bold text-zinc-200">{formatCurrency(project.budget)}</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <Link
                    href={`/tasks?project=${project.id}`}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                  >
                    <span>{projectTasks.length} Tasks</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>

                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-xl space-y-2">
            <div>No matching initiatives found.</div>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs"
            >
              Launch Project
            </button>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white">Create New Initiative</h3>
              <button onClick={() => setShowNewModal(false)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Telemetry Pipeline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Client / Stakeholder</label>
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
                <label className="block text-zinc-300 font-medium">Scope Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of objectives and milestones..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Budget ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="warning">Warning (Requires Focus)</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
                >
                  Launch Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
