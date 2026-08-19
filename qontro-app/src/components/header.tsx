'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Command, ShieldCheck, FolderGit2, CheckSquare, BrainCircuit, CreditCard, X } from 'lucide-react';
import { useAppStore } from '@/store';

export function Header() {
  const { currentWorkspace, members, projects, tasks, documents, invoices } = useAppStore();
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
    <header className="h-14 border-b border-[#222222] bg-[#141414]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Global Command Bar */}
      <div className="relative w-80" ref={searchRef}>
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Qontro (Ctrl+K)..."
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#444444] transition-colors"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] text-gray-400 bg-white/5 px-1 py-0.5 rounded border border-white/5 font-mono">
            ⌘K
          </div>
        </div>

        {/* Global Search Results Dropdown Modal */}
        {isOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-11 left-0 w-96 max-h-96 overflow-y-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl p-3 space-y-3 z-50 text-xs">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2 text-gray-400 text-[11px]">
              <span>Results ({totalResults})</span>
              <button onClick={() => setIsOpen(false)} className="hover:text-white">✕</button>
            </div>

            {totalResults === 0 ? (
              <div className="py-6 text-center text-gray-400 text-[11px]">
                No matching projects, tasks, SOPs, or invoices found.
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-[#262626]">
                {/* Projects */}
                {matchingProjects.length > 0 && (
                  <div className="space-y-1.5 pt-1.5 first:pt-0">
                    <div className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" /> Projects
                    </div>
                    {matchingProjects.map((p) => (
                      <Link
                        key={p.id}
                        href="/projects"
                        onClick={() => setIsOpen(false)}
                        className="block p-1.5 rounded hover:bg-[#222222] text-gray-200 hover:text-white"
                      >
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{p.client_name} • {p.health_score}% health</div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {matchingTasks.length > 0 && (
                  <div className="space-y-1.5 pt-1.5">
                    <div className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" /> Tasks
                    </div>
                    {matchingTasks.map((t) => (
                      <Link
                        key={t.id}
                        href="/tasks"
                        onClick={() => setIsOpen(false)}
                        className="block p-1.5 rounded hover:bg-[#222222] text-gray-200 hover:text-white"
                      >
                        <div className="font-semibold">{t.title}</div>
                        <div className="text-[10px] text-gray-400">{t.project_name} • {t.status.toUpperCase()}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Documents */}
                {matchingDocs.length > 0 && (
                  <div className="space-y-1.5 pt-1.5">
                    <div className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> Company Memory
                    </div>
                    {matchingDocs.map((d) => (
                      <Link
                        key={d.id}
                        href="/memory"
                        onClick={() => setIsOpen(false)}
                        className="block p-1.5 rounded hover:bg-[#222222] text-gray-200 hover:text-white"
                      >
                        <div className="font-semibold">{d.title}</div>
                        <div className="text-[10px] text-gray-400">{d.category} • {d.type.toUpperCase()}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Invoices */}
                {matchingInvoices.length > 0 && (
                  <div className="space-y-1.5 pt-1.5">
                    <div className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Invoices
                    </div>
                    {matchingInvoices.map((i) => (
                      <Link
                        key={i.id}
                        href="/finance"
                        onClick={() => setIsOpen(false)}
                        className="block p-1.5 rounded hover:bg-[#222222] text-gray-200 hover:text-white"
                      >
                        <div className="font-semibold">{i.invoice_number} ({i.client_name})</div>
                        <div className="text-[10px] text-gray-400">${i.amount} • {i.status.toUpperCase()}</div>
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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e1e1e] border border-[#2a2a2a] text-[11px] text-gray-300">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>DeepSeek Cloud Active</span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#2a2a2a]"></div>

        {/* Founder Avatar & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#262626] border border-[#383838] flex items-center justify-center text-xs font-semibold text-white">
            {founder?.name.charAt(0)}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-medium text-gray-200 flex items-center gap-1">
              {founder?.name}
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-[10px] text-gray-400">{founder?.designation}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
