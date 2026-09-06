'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Clock, 
  User, 
  History, 
  Trash2, 
  Kanban, 
  List, 
  X 
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/lib/sanitize';

const STATUS_COLUMNS: { id: TaskStatus; label: string; countColor: string }[] = [
  { id: 'todo', label: 'To Do', countColor: 'text-zinc-400' },
  { id: 'doing', label: 'In Progress', countColor: 'text-sky-400' },
  { id: 'review', label: 'In Review', countColor: 'text-indigo-400' },
  { id: 'blocked', label: 'Blocked / Risk', countColor: 'text-rose-400' },
  { id: 'completed', label: 'Completed', countColor: 'text-emerald-400' },
];

export default function TasksPage() {
  const { 
    tasks, 
    projects, 
    members, 
    taskHistories, 
    addTask, 
    updateTaskStatus, 
    deleteTask, 
    currentWorkspace 
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [assignedTo, setAssignedTo] = useState(members[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [dueDate, setDueDate] = useState('2026-08-30');

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (projectFilter !== 'all' && task.project_id !== projectFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const selectedTaskAudit = selectedTask ? taskHistories.filter((h) => h.task_id === selectedTask.id) : [];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const project = projects.find((p) => p.id === projectId);

    addTask({
      workspace_id: currentWorkspace.id,
      project_id: projectId || (projects[0]?.id || 'prj_1'),
      project_name: project?.name || 'General Operations',
      title: sanitizeText(title),
      description: sanitizeText(description),
      assigned_to: assignedTo || undefined,
      priority,
      status: 'todo',
      required_skills: ['Engineering'],
      estimated_hours: Number(estimatedHours),
      deadline: dueDate,
    });

    setTitle('');
    setDescription('');
    setShowNewTaskModal(false);
  };

  const getMemberName = (memberId?: string) => {
    if (!memberId) return 'Unassigned';
    const m = members.find((mem) => mem.id === memberId);
    return m ? m.name : 'Teammate';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-zinc-100" />
            Task Execution Board
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Execution workflows, sub-deliverables, capacity-aware assignments, and audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#08080a] border border-[#1f1f26] text-xs">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "p-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === 'board' ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="text-[11px]">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === 'list' ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px]">List</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Task
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#08080a] border border-[#1f1f26] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-mono"
          >
            <option value="all">ALL PRIORITIES</option>
            <option value="urgent">URGENT</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>

          {/* Project filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-[#08080a] border border-[#1f1f26] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-mono"
          >
            <option value="all">ALL INITIATIVES</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#08080a] border border-[#1f1f26] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start">
          {STATUS_COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div 
                key={col.id}
                className="rounded-xl border border-[#1a1a22] bg-[#060608] p-3 space-y-3 min-h-[500px]"
              >
                {/* Column header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#14141c]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider font-mono">
                      {col.label}
                    </span>
                    <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0f0f14] border border-[#1a1a22]", col.countColor)}>
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNewTaskModal(true)}
                    className="text-zinc-500 hover:text-white p-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task card items */}
                <div className="space-y-2.5">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-3 rounded-lg border border-[#1c1c24] bg-[#0c0c10] hover:border-zinc-700 transition-all cursor-pointer space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 truncate max-w-[120px]">
                          {task.project_name}
                        </span>
                        <span className={cn(
                          "text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded font-mono shrink-0",
                          task.priority === 'urgent' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          task.priority === 'high' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-zinc-800 text-zinc-400"
                        )}>
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors leading-snug">
                        {task.title}
                      </h4>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#14141c] text-[10px] text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <User className="w-3 h-3 text-zinc-500" />
                          <span className="truncate max-w-[80px]">{getMemberName(task.assigned_to)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="py-10 text-center text-[11px] text-zinc-600 border border-dashed border-[#181822] rounded-lg">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0c10] border-b border-[#18181f] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-4">Task Name</th>
                  <th className="py-2.5 px-4">Initiative</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Assignee</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Estimate</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14141c] text-zinc-300">
                {filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    onClick={() => setSelectedTaskId(task.id)}
                    className="hover:bg-zinc-900/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4 font-semibold text-white">{task.title}</td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px]">{task.project_name}</td>
                    <td className="py-2.5 px-4">
                      <span className={cn(
                        "text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono",
                        task.priority === 'urgent' ? "bg-rose-500/10 text-rose-400" :
                        task.priority === 'high' ? "bg-amber-500/10 text-amber-400" : "text-zinc-400"
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300 font-mono text-[11px]">{getMemberName(task.assigned_to)}</td>
                    <td className="py-2.5 px-4">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="bg-[#0d0d12] border border-[#22222a] rounded px-2 py-0.5 text-[10px] font-mono text-zinc-200 focus:outline-none"
                      >
                        <option value="todo">To Do</option>
                        <option value="doing">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 font-mono text-[11px]">{task.estimated_hours}h</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Details & Audit Drawer Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#18181f] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {selectedTask.project_name}
                  </span>
                  <span className={cn(
                    "text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono",
                    selectedTask.priority === 'urgent' ? "bg-rose-500/10 text-rose-400" :
                    selectedTask.priority === 'high' ? "bg-amber-500/10 text-amber-400" : "text-zinc-400"
                  )}>
                    {selectedTask.priority}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{selectedTask.title}</h3>
              </div>

              <button onClick={() => setSelectedTaskId(null)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[10.5px] font-mono text-zinc-400 uppercase font-semibold">Description & Objective</div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-[#050507] p-3 rounded-lg border border-[#18181f]">
                {selectedTask.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Status & Assignment controls */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-400 font-mono text-[10.5px] uppercase">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value as TaskStatus)}
                  className="w-full bg-[#050507] border border-[#18181f] rounded-lg px-3 py-1.5 text-white font-mono"
                >
                  <option value="todo">To Do</option>
                  <option value="doing">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="blocked">Blocked / Risk</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-400 font-mono text-[10.5px] uppercase">Assignee</label>
                <div className="p-2 rounded-lg bg-[#050507] border border-[#18181f] text-zinc-200 font-mono text-xs">
                  {getMemberName(selectedTask.assigned_to)}
                </div>
              </div>
            </div>

            {/* Audit Trail & History */}
            <div className="space-y-3 pt-3 border-t border-[#18181f]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
                <History className="w-3.5 h-3.5 text-sky-400" />
                <span>OPERATIONAL AUDIT TRAIL</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedTaskAudit.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-[#050507] border border-[#18181f] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>{log.actor_name} ({log.action})</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-zinc-300 text-[11px]">{log.previous_value ? `Changed from "${log.previous_value}" to "${log.new_value}"` : 'Updated task state'}</div>
                  </div>
                ))}
                {selectedTaskAudit.length === 0 && (
                  <div className="text-xs text-zinc-500 py-3 text-center border border-dashed border-[#18181f] rounded-lg">
                    Task created. No status transitions recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#18181f]">
              <button
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTaskId(null);
                }}
                className="text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Task
              </button>

              <button
                onClick={() => setSelectedTaskId(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white">Create Execution Task</h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement WebSocket Reconnection Strategy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task requirements and completion criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Initiative</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {projects.length === 0 && <option value="">General</option>}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Assign Teammate</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.designation})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Estimate (Hours)</label>
                  <input
                    type="number"
                    required
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
