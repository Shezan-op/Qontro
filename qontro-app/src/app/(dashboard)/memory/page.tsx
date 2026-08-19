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
  FileText
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Document, DocumentType } from '@/types';
import { cn } from '@/lib/utils';

export default function CompanyMemoryPage() {
  const { documents, addDocument, deleteDocument } = useAppStore();
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

    addDocument({
      workspace_id: 'ws_prod_01',
      title,
      category,
      type,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      content: content || `<h2>${title}</h2><p>Document body...</p>`,
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
      title: `${doc.title} (Copy)`,
      category: doc.category,
      type: doc.type,
      tags: [...doc.tags, 'Draft'],
      content: doc.content,
      created_by_name: 'Founder',
      is_restricted: doc.is_restricted,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-blue-400" />
            Company Memory & Knowledge Base
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Standard operating procedures (SOPs), contract templates, proposals, and institutional knowledge.
          </p>
        </div>

        <button
          onClick={() => setShowNewDocModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:opacity-90 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Document
        </button>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Document Browser */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#444444]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {['all', 'sop', 'contract', 'template', 'guide'].map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                className={cn(
                  "px-2.5 py-1 rounded-md uppercase text-[10px] font-bold transition-colors",
                  typeFilter === tab
                    ? "bg-[#2a2a2a] text-white"
                    : "bg-[#161616] text-gray-400 hover:text-white border border-[#2a2a2a]"
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
                    "p-3 rounded-xl border transition-all cursor-pointer space-y-1.5",
                    isSelected
                      ? "bg-[#222222] border-[#383838] shadow-sm"
                      : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#383838]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[9px] uppercase font-bold px-1.5 py-0.2 rounded",
                      doc.type === 'sop' ? "bg-purple-500/10 text-purple-400" :
                      doc.type === 'contract' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                    )}>
                      {doc.type}
                    </span>
                    <div className="flex items-center gap-1">
                      {doc.is_restricted && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                      <span className="text-[10px] text-gray-400">{doc.category}</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-white line-clamp-1">{doc.title}</h3>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                    <span>{doc.created_by_name}</span>
                    <span>{new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              );
            })}

            {filteredDocs.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-8 border border-dashed border-[#2a2a2a] rounded-xl">
                No documents found.
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Document Reader / Preview */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDoc ? (
            <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 space-y-5 shadow-sm">
              <div className="border-b border-[#262626] pb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {selectedDoc.type}
                    </span>
                    <span className="text-xs text-gray-400">• {selectedDoc.category}</span>
                    {selectedDoc.is_restricted && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-semibold">
                        Management Only
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedDoc.title}</h2>
                  <div className="text-[11px] text-gray-400 flex items-center gap-3">
                    <span>Author: <strong className="text-gray-200">{selectedDoc.created_by_name}</strong></span>
                    <span>Updated: {new Date(selectedDoc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicateTemplate(selectedDoc)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] text-xs text-gray-200 flex items-center gap-1 transition-colors"
                    title="Duplicate to editable copy"
                  >
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>
                  <button
                    onClick={() => deleteDocument(selectedDoc.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rich HTML Content Body */}
              <div 
                className="prose prose-invert max-w-none text-xs md:text-sm text-gray-300 leading-relaxed space-y-3 font-body"
                dangerouslySetInnerHTML={{ __html: selectedDoc.content }}
              />

              {/* Tags footer */}
              <div className="pt-4 border-t border-[#262626] flex items-center gap-2">
                <Tag className="w-3 h-3 text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {selectedDoc.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-[#141414] border border-[#262626] text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-12 text-center text-xs text-gray-500">
              Select or create a document to read.
            </div>
          )}
        </div>

      </div>

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-semibold text-white">Create Company Document / SOP</h3>
              <button onClick={() => setShowNewDocModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Client Retainer SLA Protocol"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Document Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DocumentType)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  >
                    <option value="sop">SOP (Standard Operating Procedure)</option>
                    <option value="contract">Legal Contract Template</option>
                    <option value="template">Sales / Pitch Blueprint</option>
                    <option value="guide">Guide & Checklist</option>
                    <option value="meeting_notes">Meeting Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restricted"
                  checked={isRestricted}
                  onChange={(e) => setIsRestricted(e.target.checked)}
                  className="rounded bg-[#141414] border-[#2a2a2a]"
                />
                <label htmlFor="restricted" className="text-gray-300">Restrict access (Management Only)</label>
              </div>

              <div>
                <label className="block text-gray-400 font-medium mb-1">Content (HTML / Markdown supported)</label>
                <textarea
                  rows={6}
                  placeholder="<h2>Section 1: Objective</h2><p>Write your SOP protocol or contract terms here...</p>"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#444444]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowNewDocModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:opacity-90"
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
