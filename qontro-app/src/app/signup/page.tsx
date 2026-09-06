'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            workspace_name: workspaceName.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        router.push('/');
        router.refresh();
      } else if (data.user) {
        setSuccessNotice(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 font-sans text-white">
      <div className="w-full max-w-sm p-6 sm:p-8 bg-[#08080a] border border-[#1f1f26] rounded-2xl shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-extrabold text-sm flex items-center justify-center mx-auto shadow-sm">
            Q
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight font-mono">CREATE WORKSPACE</h1>
          <p className="text-xs text-zinc-400">Launch your founder command center in seconds</p>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-lg text-xs text-rose-300 text-center font-mono">
            {error}
          </div>
        )}

        {successNotice ? (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Account Created</h3>
            <p className="text-xs text-zinc-400">
              Please check <span className="text-emerald-300 font-mono">{email}</span> to confirm your email, then proceed to sign in.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 px-4 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3 text-xs" suppressHydrationWarning>
            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium font-mono text-[10.5px] uppercase">Company / Agency Name</label>
              <input
                type="text"
                required
                placeholder="Apex Dynamics"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium font-mono text-[10.5px] uppercase">Founder Full Name</label>
              <input
                type="text"
                required
                placeholder="Shezan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium font-mono text-[10.5px] uppercase">Work Email</label>
              <input
                type="email"
                required
                placeholder="founder@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-300 font-medium font-mono text-[10.5px] uppercase">Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-2 text-xs"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Launch Workspace
            </button>
          </form>
        )}

        <div className="text-center text-[11px] text-zinc-400">
          Already have a workspace?{' '}
          <Link href="/login" className="text-white hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
