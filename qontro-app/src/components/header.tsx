'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Sparkles, ShieldCheck, FolderGit2, CheckSquare, BrainCircuit, CreditCard, X, Command } from 'lucide-react';
import { useAppStore } from '@/store';

export function Header() {
  const { members, projects, tasks, documents, invoices } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const founder = members.find((m) => m.role === 'owner') || members[0];

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items across all pillars
  const matchingProjects = searchQuery.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const matchingTasks = searchQuery.trim()
    ? tasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const matchingDocs = searchQuery.trim()
    ? documents.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const matchingInvoices = searchQuery.trim()
    ? invoices.filter((i) => i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || i.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const totalResults = matchingProjects.length + matchingTasks.length + matchingDocs.length + matchingInvoices.length;

  return (
    <header className="h-13 border-b border-[#18181f] bg-[#000000]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Global Command Bar */}
      <div className="relative w-80" ref={searchRef}>
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cockpit, tasks, SOPs... (⌘K)"
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            className="w-full bg-[#08080a] border border-[#1f1f26] rounded-lg pl-8 pr-10 py-1.5 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">
            ⌘K
          </div>
        </div>

        {/* Global Search Results Dropdown Modal */}
        {isOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-11 left-0 w-96 max-h-[28rem] overflow-y-auto bg-[#0a0a0d] border border-[#1f1f26] rounded-xl shadow-2xl p-3.5 space-y-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 text-zinc-400 text-[11px]">
              <span className="font-semibold text-zinc-300 font-mono">RESULTS ({totalResults})</span>
              <button onClick={() => setIsOpen(false)} className="hover:text-white p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {totalResults === 0 ? (
              <div className="py-6 text-center text-zinc-400 text-[11px]">
                No matching projects, tasks, documents, or invoices.
              </div>
            ) : (
              <div className="space-y-2.5 divide-y divide-zinc-800/60">
                {/* Projects */}
                {matchingProjects.length > 0 && (
                  <div className="space-y-1 pt-1.5 first:pt-0">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                      <FolderGit2 className="w-3 h-3" /> Projects
                    </div>
                    {matchingProjects.map((p) => (
                      <Link
                        key={p.id}
                        href="/projects"
                        onClick={() => setIsOpen(false)}
                        className="block p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-200 hover:text-white transition-colors"
                      >
                        <div className="font-semibold text-xs">{p.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{p.client_name} · {p.health_score}% health</div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {matchingTasks.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 font-mono">
                      <CheckSquare className="w-3 h-3" /> Execution Tasks
                    </div>
                    {matchingTasks.map((t) => (
                      <Link
                        key={t.id}
                        href="/tasks"
                        onClick={() => setIsOpen(false)}
                        className="block p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-200 hover:text-white transition-colors"
                      >
                        <div className="font-semibold text-xs">{t.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{t.project_name} · {t.status}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Documents */}
                {matchingDocs.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
                      <BrainCircuit className="w-3 h-3" /> Company Memory
                    </div>
                    {matchingDocs.map((d) => (
                      <Link
                        key={d.id}
                        href="/memory"
                        onClick={() => setIsOpen(false)}
                        className="block p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-200 hover:text-white transition-colors"
                      >
                        <div className="font-semibold text-xs">{d.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{d.category} · {d.type}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Invoices */}
                {matchingInvoices.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
                      <CreditCard className="w-3 h-3" /> Money Flow
                    </div>
                    {matchingInvoices.map((i) => (
                      <Link
                        key={i.id}
                        href="/finance"
                        onClick={() => setIsOpen(false)}
                        className="block p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-200 hover:text-white transition-colors"
                      >
                        <div className="font-semibold text-xs">{i.invoice_number} ({i.client_name})</div>
                        <div className="text-[10px] text-zinc-400 font-mono">${i.amount} · {i.status}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Founder Status & Actions */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#08080a] border border-[#1f1f26] text-xs text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span className="font-mono text-[11px] text-zinc-300">AI Engine Ready</span>
        </div>

        <div className="h-3.5 w-[1px] bg-zinc-800"></div>

        {/* Founder Avatar & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-white font-mono">
            {founder?.name.charAt(0)}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-white flex items-center gap-1">
              {founder?.name}
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-[9.5px] text-zinc-400 font-mono">{founder?.designation}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

