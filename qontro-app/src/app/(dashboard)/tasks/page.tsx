'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Clock, 
  MessageSquare,
  Calendar, 
  History,
  Trash2,
  Send
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-blue-500/40 text-blue-400' },
  { id: 'doing', label: 'In Progress', color: 'border-amber-500/40 text-amber-400' },
  { id: 'review', label: 'In Review', color: 'border-purple-500/40 text-purple-400' },
  { id: 'blocked', label: 'Blocked / Risk', color: 'border-red-500/40 text-red-400' },
  { id: 'completed', label: 'Completed', color: 'border-emerald-500/40 text-emerald-400' },
];

export default function TasksPage() {
  const { 
    tasks, 
    members, 
    projects, 
    taskHistories,
    updateTaskStatus, 
    addTask, 
    assignTask, 
    deleteTask,
    addTaskComment 
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [assignedTo, setAssignedTo] = useState(members[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [deadline, setDeadline] = useState('2026-08-25');
  const [requiredSkills, setRequiredSkills] = useState('Figma, React');

  const filteredTasks = tasks.filter((t) => {
    if (filterProject !== 'all' && t.project_id !== filterProject) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const targetProject = projects.find((p) => p.id === projectId);
    addTask({
      workspace_id: 'ws_prod_01',
      project_id: projectId || 'prj_general',
      project_name: targetProject?.name || 'General Project',
      title,
      description,
      assigned_to: assignedTo,
      priority,
      status: 'todo',
      required_skills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      estimated_hours: 8,
      deadline,
    });
    setTitle('');
    setDescription('');
    setShowNewTaskModal(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTaskForDetails) return;
    addTaskComment(selectedTaskForDetails.id, commentInput.trim());
    setCommentInput('');
    // refresh selected task reference
    const updated = useAppStore.getState().tasks.find((t) => t.id === selectedTaskForDetails.id);
    if (updated) setSelectedTaskForDetails(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTaskStatus(taskId, targetStatus);
    }
  };

  const taskHistoryList = selectedTaskForDetails
    ? taskHistories.filter((th) => th.task_id === selectedTaskForDetails.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-400" />
            Execution Board
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Drag-and-drop Kanban, live comments, audit trails, and multi-lane execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                viewMode === 'kanban' ? "bg-[#2a2a2a] text-white font-semibold" : "text-gray-400 hover:text-gray-200"
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                viewMode === 'list' ? "bg-[#2a2a2a] text-white font-semibold" : "text-gray-400 hover:text-gray-200"
              )}
            >
              List View
            </button>
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by:</span>
          </div>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-[#444444]"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-[#444444]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-gray-400 text-[11px]">
          Showing <span className="font-semibold text-gray-200">{filteredTasks.length}</span> tasks
        </div>
      </div>

      {/* Kanban View with Drag and Drop */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div 
                key={col.id} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-3 space-y-3 min-h-[480px] transition-colors hover:border-[#383838]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {columnTasks.map((task) => {
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTaskForDetails(task)}
                        className="p-3.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444444] transition-all space-y-2.5 group shadow-sm cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                            task.priority === 'urgent' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            task.priority === 'high' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          )}>
                            {task.priority}
                          </span>

                          <div className="text-[10px] text-gray-400 font-medium">
                            {task.project_name?.split(' ')[0]}
                          </div>
                        </div>

                        <h4 className="text-xs font-semibold text-gray-100 leading-snug">{task.title}</h4>
                        {task.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{task.description}</p>
                        )}

                        <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-[11px]">
                          <select
                            value={task.assigned_to || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => assignTask(task.id, e.target.value)}
                            className="bg-transparent text-gray-300 text-[11px] max-w-[110px] truncate focus:outline-none cursor-pointer hover:text-white"
                          >
                            <option value="" className="bg-[#1a1a1a]">Unassigned</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id} className="bg-[#1a1a1a]">{m.name.split(' ')[0]}</option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1.5 text-gray-400">
                            {task.comments && task.comments.length > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px]">
                                <MessageSquare className="w-3 h-3" /> {task.comments.length}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id);
                              }}
                              className="text-gray-500 hover:text-red-400"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-10 text-[11px] text-gray-400 border border-dashed border-[#2a2a2a] rounded-xl">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161616] border-b border-[#2a2a2a] text-gray-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-gray-300">
                {filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    onClick={() => setSelectedTaskForDetails(task)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium text-gray-100 max-w-xs">{task.title}</td>
                    <td className="py-3 px-4 text-gray-400">{task.project_name}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.assigned_to || ''}
                        onChange={(e) => assignTask(task.id, e.target.value)}
                        className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
                      >
                        <option value="" className="bg-[#1a1a1a]">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#1a1a1a]">{m.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "text-[10px] font-semibold uppercase px-2 py-0.5 rounded",
                        task.priority === 'urgent' ? "bg-red-500/10 text-red-400" :
                        task.priority === 'high' ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{task.deadline}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="bg-[#141414] text-xs text-gray-200 px-2 py-1 rounded border border-[#2a2a2a] focus:outline-none"
                      >
                        <option value="todo">To Do</option>
                        <option value="doing">Doing</option>
                        <option value="review">Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Done</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-500 hover:text-red-400"
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

      {/* Task Details & Audit History Drawer Modal */}
      {selectedTaskForDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">{selectedTaskForDetails.project_name}</span>
                <h3 className="text-base font-bold text-white">{selectedTaskForDetails.title}</h3>
              </div>
              <button onClick={() => setSelectedTaskForDetails(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-[#141414] p-3 rounded-lg border border-[#262626]">
              {selectedTaskForDetails.description || "No description provided."}
            </p>

            {/* Audit History Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-400" /> Audit Trail & History ({taskHistoryList.length})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto bg-[#141414] p-2.5 rounded-lg border border-[#262626] divide-y divide-[#222222]">
                {taskHistoryList.map((th) => (
                  <div key={th.id} className="pt-1.5 first:pt-0 text-[11px] flex items-center justify-between text-gray-400">
                    <div>
                      <span className="text-gray-200 font-medium">{th.actor_name}</span>: {th.action} {th.new_value ? `→ ${th.new_value}` : ''}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(th.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {taskHistoryList.length === 0 && (
                  <div className="text-[10px] text-gray-500 py-1 text-center">No history entries logged yet.</div>
                )}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Comments & Discussions ({selectedTaskForDetails.comments?.length || 0})
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
                {selectedTaskForDetails.comments?.map((c) => (
                  <div key={c.id} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="font-semibold text-gray-200">{c.author_name}</span>
                      <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-gray-300 text-[11px]">{c.content}</p>
                  </div>
                ))}
                {(!selectedTaskForDetails.comments || selectedTaskForDetails.comments.length === 0) && (
                  <div className="text-[10px] text-gray-500 py-1 text-center">No comments yet. Post the first update.</div>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a progress update or remark..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 bg-[#141414] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#444444]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:opacity-90 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-semibold text-white">Create New Task</h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Audit PostgreSQL queries and optimize indexes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Description & Context</label>
                <textarea
                  rows={3}
                  placeholder="Key deliverables, requirements, references..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  >
                    <option value="">General Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Assignee</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.workload_percentage}% load)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Required Skills (Comma-separated for AI matching)</label>
                <input
                  type="text"
                  placeholder="e.g., PostgreSQL, Copywriting, Figma"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:opacity-90"
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
