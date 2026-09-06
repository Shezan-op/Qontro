'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderGit2, 
  CheckSquare, 
  Sparkles, 
  BrainCircuit, 
  CreditCard, 
  Users, 
  Settings, 
  ChevronDown,
  Building2,
  Activity,
  Layers
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { currentWorkspace, aiRecommendations } = useAppStore();
  const pendingRecs = aiRecommendations.filter((r) => r.status === 'pending').length;

  const navigation = [
    { name: 'Command Cockpit', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Task Execution', href: '/tasks', icon: CheckSquare },
    { 
      name: 'AI Operations', 
      href: '/ai-ops', 
      icon: Sparkles, 
      badge: pendingRecs > 0 ? `${pendingRecs}` : undefined,
    },
    { name: 'Company Memory', href: '/memory', icon: BrainCircuit },
    { name: 'Money Flow', href: '/finance', icon: CreditCard },
    { name: 'Team & Skills', href: '/team', icon: Users },
  ];

  return (
    <aside className={cn("w-60 border-r border-[#18181f] bg-[#040406] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans select-none z-20", className)}>
      <div>
        {/* Brand & Workspace Identity */}
        <div className="p-3.5 border-b border-[#18181f] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#ffffff] text-black flex items-center justify-center font-bold text-xs shadow-sm">
                Q
              </div>
              <div>
                <div className="font-bold text-xs tracking-tight text-white flex items-center gap-1.5 font-mono">
                  QONTRO
                  <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">v1.0</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">Founder Operating System</div>
              </div>
            </div>
          </div>

          {/* Tenant Switcher Pill */}
          <div className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0e] border border-[#1f1f26] flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors group">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                {currentWorkspace.name}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0 group-hover:text-zinc-300 transition-colors" />
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="p-2 space-y-0.5">
          <div className="px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Control Center
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all group",
                  isActive 
                    ? "bg-[#141419] text-white font-semibold border border-[#22222a]" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-[#0c0c10]"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-3.5 h-3.5 transition-colors", isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 text-zinc-200 border border-white/10">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Telemetry & System Config */}
      <div className="p-3 pb-6 border-t border-[#18181f] space-y-1.5">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#08080b] text-[10px] text-zinc-400 border border-[#18181f]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-300 font-mono font-medium">System Online</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400">14ms</span>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#0e0e12] transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-zinc-400" />
          <span>System Settings</span>
        </Link>
      </div>
    </aside>
  );
}

