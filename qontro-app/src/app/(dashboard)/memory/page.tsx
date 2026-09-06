'use client';

import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Plus, 
  Search, 
  Tag, 
  Copy, 
  Trash2, 
  Lock, 
  X,
  FileText,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Document, DocumentType } from '@/types';
import { cn } from '@/lib/utils';
import { sanitizeHtml, sanitizeText } from '@/lib/sanitize';

export default function CompanyMemoryPage() {
  const { documents, addDocument, deleteDocument, currentWorkspace } = useAppStore();
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  // New Doc state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Operations');
  const [type, setType] = useState<DocumentType>('sop');
  const [tags, setTags] = useState('SOP, Standard');
  const [content, setContent] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) && !doc.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || filteredDocs[0];

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const safeTitle = sanitizeText(title);
    const safeCategory = sanitizeText(category);
    const safeContent = content
      ? sanitizeHtml(content)
      : `<h2>${sanitizeText(title)}</h2><p>Document body...</p>`;

    addDocument({
      workspace_id: currentWorkspace.id,
      title: safeTitle,
      category: safeCategory,
      type,
      tags: tags.split(',').map((t) => sanitizeText(t.trim())).filter(Boolean),
      content: safeContent,
      created_by_name: 'Founder / Admin',
      is_restricted: isRestricted,
    });

    setTitle('');
    setContent('');
    setShowNewDocModal(false);
  };

  const handleDuplicateTemplate = (doc: Document) => {
    addDocument({
      workspace_id: doc.workspace_id,
      title: `${sanitizeText(doc.title)} (Copy)`,
      category: sanitizeText(doc.category),
      type: doc.type,
      tags: [...doc.tags.map(t => sanitizeText(t)), 'Draft'],
      content: sanitizeHtml(doc.content),
      created_by_name: 'Founder',
      is_restricted: doc.is_restricted,
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="w-5 h-5 text-zinc-100" />
            Company Memory & Knowledge Base
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Standard operating procedures (SOPs), contract templates, proposals, and organizational knowledge.
          </p>
        </div>

        <button
          onClick={() => setShowNewDocModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Document
        </button>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Document Browser */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter memory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#08080a] border border-[#1f1f26] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {['all', 'sop', 'contract', 'template', 'guide'].map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                className={cn(
                  "px-2.5 py-1 rounded-md uppercase text-[9.5px] font-bold font-mono tracking-wider transition-all cursor-pointer",
                  typeFilter === tab
                    ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121216]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDoc?.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer space-y-1.5",
                    isSelected
                      ? "bg-[#101015] border-zinc-600 shadow-sm"
                      : "bg-[#08080a] border-[#1f1f26] hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {doc.type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {doc.is_restricted && <Lock className="w-3 h-3 text-amber-400" />}
                      <span className="text-[10px] text-zinc-500 font-mono">{doc.category}</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1">{doc.title}</h3>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 font-mono">
                    <span>{doc.created_by_name}</span>
                    <span>{new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            })}

            {filteredDocs.length === 0 && (
              <div className="text-xs text-zinc-500 text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                No documents found.
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Document Reader / Preview */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDoc ? (
            <div className="rounded-xl border border-[#1f1f26] bg-[#08080a] p-6 space-y-4 shadow-sm">
              <div className="border-b border-[#18181f] pb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded font-mono bg-zinc-800 text-zinc-300">
                      {selectedDoc.type}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">• {selectedDoc.category}</span>
                    {selectedDoc.is_restricted && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 font-mono">
                        Management Only
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{selectedDoc.title}</h2>
                  <div className="text-[10.5px] text-zinc-500 flex items-center gap-3 font-mono">
                    <span>Author: <strong className="text-zinc-300">{selectedDoc.created_by_name}</strong></span>
                    <span>Updated: {new Date(selectedDoc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicateTemplate(selectedDoc)}
                    className="px-2.5 py-1 rounded-md bg-[#121216] hover:bg-zinc-800 text-xs text-zinc-200 border border-[#22222a] flex items-center gap-1 transition-all cursor-pointer"
                    title="Duplicate to editable copy"
                  >
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>
                  <button
                    onClick={() => deleteDocument(selectedDoc.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rich HTML Content Body */}
              <div 
                className="prose prose-invert max-w-none text-xs text-zinc-300 leading-relaxed space-y-3 font-sans bg-[#040406] p-4 rounded-lg border border-[#18181f]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedDoc.content) }}
              />

              {/* Tags footer */}
              <div className="pt-3 border-t border-[#18181f] flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-[#0d0d12] border border-[#1f1f26] text-zinc-400 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-[#08080a] p-12 text-center text-xs text-zinc-500">
              Select or create a document to read.
            </div>
          )}
        </div>

      </div>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0e] border border-[#1f1f26] rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-[#18181f] pb-3">
              <h3 className="text-sm font-bold text-white">Create Company SOP / Template</h3>
              <button onClick={() => setShowNewDocModal(false)} className="text-zinc-400 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Client Onboarding SOP 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DocumentType)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="sop">SOP</option>
                    <option value="contract">Contract</option>
                    <option value="template">Template</option>
                    <option value="guide">Guide</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Operations / Legal"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">HTML / Markdown Content</label>
                <textarea
                  rows={5}
                  placeholder="<h2>Process Overview</h2><p>Step-by-step procedures and rules...</p>"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="SOP, Client, Legal"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restricted"
                  checked={isRestricted}
                  onChange={(e) => setIsRestricted(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-sky-500"
                />
                <label htmlFor="restricted" className="text-zinc-300 text-xs cursor-pointer">
                  Restrict access to Management only
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#18181f]">
                <button
                  type="button"
                  onClick={() => setShowNewDocModal(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 shadow-sm transition-all"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
