import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { DashboardBootstrap } from '@/components/dashboard-bootstrap';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Bootstrap fires once on layout mount, hydrating store cache */}
      <DashboardBootstrap />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
