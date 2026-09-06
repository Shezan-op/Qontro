'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ENABLE_MOCK_PROFILE, MOCK_CREDENTIALS } from '@/lib/mock-profile';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleFillDemoCredentials = () => {
    setEmail(MOCK_CREDENTIALS.email);
    setPassword('Password123!');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(authError.message);
        }
        return;
      }

      const redirectTo = searchParams.get('redirectTo') || '/';
      const safePath = redirectTo.startsWith('/') ? redirectTo : '/';
      router.push(safePath);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.toLowerCase().includes('failed to fetch')) {
        setError('Database unreachable. Please check connection and retry.');
      } else {
        setError('Connection error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 font-sans text-white">
      <div className="w-full max-w-sm p-6 sm:p-8 bg-[#08080a] border border-[#1f1f26] rounded-2xl shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-extrabold text-sm flex items-center justify-center mx-auto shadow-sm">
            Q
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight font-mono">QONTRO</h1>
          <p className="text-xs text-zinc-400">Founder Operations & Multi-Tenant OS</p>
        </div>

        {/* Demo Credentials Quick Fill */}
        {ENABLE_MOCK_PROFILE && (
          <div className="p-3 bg-[#0d0d11] border border-[#1c1c24] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 fill-white text-white" />
                {MOCK_CREDENTIALS.company} Credentials
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">
                Quick-Fill
              </span>
            </div>
            <div className="text-[10.5px] text-zinc-400 font-mono">
              {MOCK_CREDENTIALS.email}
            </div>
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="w-full py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono"
            >
              <span>Auto-Fill Credentials</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-lg text-xs text-rose-300 text-center font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3 text-xs" suppressHydrationWarning>
          <div className="space-y-1">
            <label className="block text-zinc-300 font-medium font-mono text-[10.5px] uppercase">Work Email</label>
            <input
              type="email"
              required
              placeholder="founder@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              suppressHydrationWarning
              className="w-full bg-[#040406] border border-[#18181f] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-zinc-300 font-medium font-mono text-[10.5px] uppercase">Password</label>
              <a href="#" className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono">Forgot?</a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suppressHydrationWarning
                className="w-full bg-[#040406] border border-[#18181f] rounded-lg pl-3 pr-8 py-1.5 text-white focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                suppressHydrationWarning
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-1 text-xs"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#18181f]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#08080a] px-2 text-zinc-500 font-mono font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          suppressHydrationWarning
          className="w-full py-1.5 bg-[#040406] border border-[#18181f] text-zinc-200 text-xs font-medium rounded-lg hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
            <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
            <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
            <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
          </svg>
          Google SSO
        </button>

        <div className="text-center text-[11px] text-zinc-400">
          New organization?{' '}
          <Link href="/signup" className="text-white hover:underline font-semibold">
            Create Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
