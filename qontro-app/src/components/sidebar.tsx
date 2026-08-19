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
  Bell,
  Activity
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
      badgeColor: 'bg-white/10 text-white border border-white/15'
    },
    { name: 'Company Memory', href: '/memory', icon: BrainCircuit },
    { name: 'Money Flow', href: '/finance', icon: CreditCard },
    { name: 'Team & Skills', href: '/team', icon: Users },
  ];

  return (
    <aside className={cn("w-60 border-r border-[#222222] bg-[#141414] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans", className)}>
      <div>
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-[#222222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#222222] border border-[#333333] flex items-center justify-center font-bold text-xs text-white">
                Q
              </div>
              <div>
                <div className="font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
                  Qontro
                  <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-gray-300 font-mono">v1.0</span>
                </div>
                <div className="text-[10px] text-gray-400">Founder OS</div>
              </div>
            </div>
          </div>

          {/* Workspace Switcher Pill */}
          <div className="mt-3.5 p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-between cursor-pointer hover:border-[#3f3f46] transition-colors">
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-[11px] font-medium text-gray-200 truncate">{currentWorkspace.name}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2.5 space-y-0.5">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Workspaces
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group",
                  isActive 
                    ? "bg-[#222222] text-white border border-[#333333] shadow-sm font-semibold" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300")} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-mono", item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-[#222222] space-y-1.5">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] text-[11px] text-gray-400 border border-[#262626]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] text-gray-300 font-medium">Supabase Cloud</span>
          </div>
          <Activity className="w-3 h-3 text-gray-400" />
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
