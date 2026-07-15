import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBookOpen, FiChevronLeft, FiChevronRight, FiCpu, FiEdit3, FiHome, FiSearch, FiShield, FiDatabase, FiGitBranch, FiCheckCircle } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = [
  { name: 'Infrastructure', value: 'infrastructure' },
  { name: 'Deployment', value: 'deployment' },
  { name: 'Security', value: 'security' },
  { name: 'Database', value: 'database' },
  { name: 'Monitoring', value: 'monitoring' },
  { name: 'Troubleshooting', value: 'troubleshooting' },
  { name: 'Application', value: 'application' }
];

const SUGGESTED_ASKS = [
  'What is the deployment flow?',
  'Where is authentication implemented?',
  'Which documents explain the architecture?'
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const { user } = useAuthStore();

  const primaryLinks = [
    {
      label: 'Overview',
      to: '/',
      icon: FiHome,
      isActive: location.pathname === '/'
    },
    {
      label: 'Ask & Search',
      to: '/search',
      icon: FiSearch,
      isActive: location.pathname.startsWith('/search')
    },
    {
      label: 'Ask AI',
      to: '/ask',
      icon: FiCpu,
      isActive: location.pathname.startsWith('/ask')
    },
    {
      label: 'Add Knowledge',
      to: '/editor',
      icon: FiEdit3,
      isActive: location.pathname.startsWith('/editor'),
      visible: user && (user.role === 'editor' || user.role === 'admin')
    },
    {
      label: 'Knowledge Base',
      to: '/knowledge-base',
      icon: FiDatabase,
      isActive: location.pathname.startsWith('/knowledge-base'),
      visible: user && (user.role === 'editor' || user.role === 'admin')
    },
    {
      label: 'AI Agents',
      to: '/agents',
      icon: FiGitBranch,
      isActive: location.pathname.startsWith('/agents')
    },
    {
      label: 'Approvals',
      to: '/approvals',
      icon: FiCheckCircle,
      isActive: location.pathname.startsWith('/approvals'),
      visible: user && (user.role === 'editor' || user.role === 'admin')
    },
    {
      label: 'Admin Console',
      to: '/admin',
      icon: FiShield,
      isActive: location.pathname.startsWith('/admin'),
      visible: user?.role === 'admin'
    }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-24 z-30 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 shadow-lg shadow-slate-950/40 transition hover:border-slate-700 hover:text-white"
        aria-label="Open sidebar"
      >
        <FiChevronRight className="h-5 w-5" />
      </button>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
          Cortex
        </p>
        <h2 className="mt-3 text-lg font-semibold text-white">Project context at team speed.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Search flows, architecture, release notes, and decisions from a single workspace.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="space-y-8">
          <div>
            <h3 className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Workspace
            </h3>
            <div className="mt-3 space-y-2">
              {primaryLinks
                .filter((link) => link.visible !== false)
                .map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                        link.isActive
                          ? 'bg-slate-900 text-white ring-1 ring-inset ring-slate-700'
                          : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        link.isActive ? 'bg-sky-400/15 text-sky-300' : 'bg-slate-900 text-slate-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>

          <div>
            <h3 className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Knowledge Domains
            </h3>
            <div className="mt-3 space-y-2">
              {CATEGORIES.map((category) => (
                <Link
                  key={category.value}
                  to={`/search?category=${category.value}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-3 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-slate-400">
                      <FiBookOpen className="h-4 w-4" />
                    </span>
                    <span>{category.name}</span>
                  </span>
                  <FiChevronRight className="h-4 w-4 text-slate-600" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Suggested Asks
            </h3>
            <div className="mt-3 space-y-2">
              {SUGGESTED_ASKS.map((question) => (
                <Link
                  key={question}
                  to={`/search?q=${encodeURIComponent(question)}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm leading-6 text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
                >
                  {question}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="border-t border-slate-800 px-4 py-4">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
        >
          <FiChevronLeft className="h-4 w-4" />
          <span>Hide sidebar</span>
        </button>
      </div>
    </aside>
  );
}
