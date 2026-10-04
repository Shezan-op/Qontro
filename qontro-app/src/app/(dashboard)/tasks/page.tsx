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
  X,
  MessageSquare,
  Send,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/lib/sanitize';

const STATUS_COLUMNS: { id: TaskStatus; label: string; countColor: string }[] = [
  { id: 'backlog', label: 'Backlog', countColor: 'text-zinc-500' },
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
    addTaskComment,
    currentWorkspace 
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [assignedTo, setAssignedTo] = useState(members[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (projectFilter !== 'all' && task.project_id !== projectFilter) return false;
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const selectedTaskAudit = selectedTask
    ? taskHistories.filter((h) => h.task_id === selectedTask.id)
    : [];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const project = projects.find((p) => p.id === projectId);

    try {
      setErrorMessage(null);
      await addTask({
        workspace_id: currentWorkspace.id,
        project_id: projectId || (projects[0]?.id || 'prj_1'),
        project_name: project?.name || 'General Operations',
        title: sanitizeText(title),
        description: sanitizeText(description),
        assigned_to: assignedTo || undefined,
        priority,
        status: taskStatus,
        required_skills: ['Operations'],
        estimated_hours: Number(estimatedHours),
        deadline: dueDate,
      });

      setTitle('');
      setDescription('');
      setShowNewTaskModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save task to database';
      setErrorMessage(msg);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    try {
      setErrorMessage(null);
      await updateTaskStatus(taskId, targetStatus);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to persist task status update';
      setErrorMessage(msg);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim()) return;

    try {
      setCommentSubmitting(true);
      await addTaskComment(selectedTask.id, sanitizeText(newCommentText.trim()), 'Founder / Admin');
      setNewCommentText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post comment';
      setErrorMessage(msg);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const getMemberName = (memberId?: string) => {
    if (!memberId) return 'Unassigned';
    const m = members.find((mem) => mem.id === memberId);
    return m ? m.name : 'Teammate';
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#18181f]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            Execution Tasks
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Production Kanban workflow across all 6 core lifecycle states with live Supabase persistence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#0a0a0e] border border-[#1f1f26] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
                viewMode === 'board' ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
                viewMode === 'list' ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-semibold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Error banner if database mutation failed */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0e] border border-[#1f1f26] rounded-lg pl-9 pr-3 py-1.5 text-zinc-200 placeholder:text-zinc-500 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#0a0a0e] border border-[#1f1f26] rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-[#0a0a0e] border border-[#1f1f26] rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x scrollbar-thin">
          {STATUS_COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            const isTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={cn(
                  "flex-1 min-w-[280px] max-w-[340px] rounded-xl border p-3 flex flex-col space-y-3 transition-colors bg-[#08080a]",
                  isTarget ? "border-sky-500/60 bg-sky-950/10" : "border-[#1a1a22]"
                )}
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
                    onClick={() => {
                      setTaskStatus(col.id);
                      setShowNewTaskModal(true);
                    }}
                    className="text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                    title={`Add task to ${col.label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task card items */}
                <div className="space-y-2.5 min-h-[200px]">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        "p-3 rounded-lg border border-[#1c1c24] bg-[#0c0c10] hover:border-zinc-600 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group select-none shadow-xs",
                        draggingTaskId === task.id ? "opacity-40 border-dashed border-sky-400" : ""
                      )}
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

                      {task.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#14141c] text-[10px] text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <User className="w-3 h-3 text-zinc-500" />
                          <span className="truncate max-w-[80px]">{getMemberName(task.assigned_to)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.comments && task.comments.length > 0 && (
                            <div className="flex items-center gap-1 text-zinc-500">
                              <MessageSquare className="w-3 h-3" />
                              <span>{task.comments.length}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>{task.estimated_hours}h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="py-10 text-center text-[11px] text-zinc-600 border border-dashed border-[#181822] rounded-lg">
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
                        <option value="backlog">Backlog</option>
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
                        className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
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

      {/* Task Details, Comments & Audit Drawer Modal */}
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

              <button onClick={() => setSelectedTaskId(null)} className="text-zinc-400 hover:text-white p-1 cursor-pointer">
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
                  <option value="backlog">Backlog</option>
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

            {/* Task Comments Section (Rule 19) */}
            <div className="space-y-3 pt-3 border-t border-[#18181f]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>TASK COMMENTS ({selectedTask.comments?.length || 0})</span>
              </div>

              {/* Comment list */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(selectedTask.comments ?? []).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-[#050507] border border-[#18181f] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span className="font-semibold text-zinc-300">{c.author_name}</span>
                      <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-zinc-200 text-[11px]">{c.content}</p>
                  </div>
                ))}
                {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                  <div className="text-xs text-zinc-500 py-2.5 text-center border border-dashed border-[#18181f] rounded-lg">
                    No comments yet. Start the thread below.
                  </div>
                )}
              </div>

              {/* Post comment form */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-[#050507] border border-[#18181f] rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !newCommentText.trim()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Audit Trail & History */}
            <div className="space-y-3 pt-3 border-t border-[#18181f]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
                <History className="w-3.5 h-3.5 text-sky-400" />
                <span>OPERATIONAL AUDIT TRAIL</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
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
              <button onClick={() => setShowNewTaskModal(false)} className="text-zinc-400 hover:text-white p-0.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Safe Concurrency Invoice Generator"
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

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block text-zinc-300 font-medium">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="doing">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Estimate (Hours)</label>
                  <input
                    type="number"
                    required
                    min={1}
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
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
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
