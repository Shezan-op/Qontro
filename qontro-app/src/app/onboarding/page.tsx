'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store';

export default function OnboardingPage() {
  const router = useRouter();
  const { createWorkspace } = useAppStore();
  const [workspaceName, setWorkspaceName] = useState('Apex Dynamics');
  const [currency, setCurrency] = useState('USD');
  const [industry, setIndustry] = useState('B2B Tech & Agency');
  const [loading, setLoading] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createWorkspace(workspaceName.trim() || 'My Workspace', currency);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('[Onboarding] Error creating workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f11] text-[#f3f4f6] flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full p-8 bg-[#18181b] rounded-2xl border border-[#27272a] shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center font-bold text-lg text-white mx-auto shadow-lg shadow-blue-500/20">
            Q
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Setup Your Workspace</h1>
          <p className="text-xs text-gray-400">
            Configure your founder command center in seconds
          </p>
        </div>

        <form onSubmit={handleCreateWorkspace} className="space-y-4 text-xs" suppressHydrationWarning>
          <div className="space-y-1.5">
            <label className="block text-gray-300 font-medium">Company / Agency Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Apex Dynamics"
                suppressHydrationWarning
                className="w-full bg-[#121214] border border-[#2a2a2e] rounded-lg px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Building2 className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-gray-300 font-medium">Base Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#121214] border border-[#2a2a2e] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-300 font-medium">Industry Focus</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#121214] border border-[#2a2a2e] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="B2B Tech & Agency">B2B Tech & Agency</option>
                <option value="SaaS & AI">SaaS & AI</option>
                <option value="Creative Studio">Creative Studio</option>
                <option value="Consulting">Consulting</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 space-y-1.5">
            <div className="text-[11px] font-semibold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Pre-configured Founder Cockpit
            </div>
            <div className="text-[10px] text-gray-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>AI Operations Manager & Skill Matcher enabled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Projects, task boards & money flow telemetry connected</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Launching Workspace...' : 'Save & Launch Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
