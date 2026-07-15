import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div className="inline-flex items-center gap-2 font-medium text-slate-700">
              <FiBookOpen className="h-4 w-4 text-sky-700" />
              <span>Cortex</span>
            </div>
            <p className="text-slate-500">
              Built for searchable onboarding, delivery context, and reusable team knowledge.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
