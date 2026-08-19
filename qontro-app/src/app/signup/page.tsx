'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            workspace_name: workspaceName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Error creating organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#121212] px-4 font-sans text-[#f5f5f5]">
      <div className="w-full max-w-sm p-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#333333] flex items-center justify-center font-bold text-base text-white mx-auto">
            Q
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Qontro Workspace</h1>
          <p className="text-xs text-gray-400">Launch your founder command center in seconds</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="block text-gray-300 font-medium">Company / Agency Name</label>
            <input
              type="text"
              required
              placeholder="Apex Dynamics"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-gray-300 font-medium">Founder Full Name</label>
            <input
              type="text"
              required
              placeholder="Shezan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-gray-300 font-medium">Work Email</label>
            <input
              type="email"
              required
              placeholder="founder@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444] transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-gray-300 font-medium">Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#444444] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#f5f5f5] text-[#121212] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Launch Workspace
          </button>
        </form>

        <div className="text-center text-[11px] text-gray-400">
          Already have a workspace?{' '}
          <Link href="/login" className="text-white hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
