import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiChevronDown, FiLogOut, FiPlus, FiSearch, FiShield, FiUser } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 text-slate-50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3 lg:gap-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sm font-semibold tracking-[0.24em] text-sky-300 ring-1 ring-inset ring-sky-400/30">
              KA
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white sm:text-base">
                Project Knowledge Assistant
              </span>
              <span className="block truncate text-xs uppercase tracking-[0.22em] text-slate-400">
                Version1 Hackathon MVP
              </span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 lg:block">
            <div className="group relative">
              <input
                type="text"
                placeholder="Ask about architecture, requirements, APIs, or decisions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 pl-11 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              />
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-sky-300" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Ask
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              to="/search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-slate-600 hover:text-white lg:hidden"
              aria-label="Open search"
            >
              <FiSearch className="h-4 w-4" />
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200 xl:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              <span>Knowledge search ready</span>
            </div>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="hidden items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:text-white md:inline-flex"
                  >
                    <FiShield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                {(user.role === 'admin' || user.role === 'editor') && (
                  <Link
                    to="/editor"
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    <FiPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Knowledge</span>
                  </Link>
                )}

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 transition hover:border-slate-600 hover:text-white"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-200">
                      <FiUser className="h-4 w-4" />
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-32 truncate text-sm font-medium">{user.name}</span>
                      <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                        {user.role}
                      </span>
                    </span>
                    <FiChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-3xl border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-slate-950/60">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{user.email}</p>
                        <p className="mt-3 inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                          {user.role}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="mt-3 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-slate-900"
                      >
                        <FiLogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-2xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  Join workspace
                </Link>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-4 lg:hidden">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Ask about flows, APIs, or project context"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 pl-11 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Ask
            </button>
          </div>
        </form>
      </div>
    </nav>
  );
}
