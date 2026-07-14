import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiLayers,
  FiLock,
  FiMail,
  FiSearch,
  FiShield,
} from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/80 shadow-[0_28px_100px_rgba(15,23,42,0.32)] backdrop-blur lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-slate-800 px-8 py-10 lg:flex lg:flex-col lg:justify-between xl:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_30%)]" />

          <div className="relative">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              <FiBookOpen className="h-3.5 w-3.5" />
              <span>Project Knowledge Assistant</span>
            </div>

            <h1 className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              Access the project context your team depends on.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
              Review architecture decisions, release steps, troubleshooting notes, and product
              context from one workspace designed for fast onboarding.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                {
                  icon: FiSearch,
                  title: 'Ask better questions',
                  body: 'Search flows, APIs, and operational decisions with natural language.',
                },
                {
                  icon: FiLayers,
                  title: 'Keep domains organized',
                  body: 'Group knowledge by infrastructure, deployment, security, and more.',
                },
                {
                  icon: FiShield,
                  title: 'Share trusted answers',
                  body: 'Give new contributors the same canonical context the core team uses.',
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="rounded-2xl bg-slate-800 p-3 text-sky-300">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Demo-ready workflow
            </p>
            <p className="mt-3 text-xl font-semibold text-white">Log in and start asking.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The assistant is tuned for onboarding, architecture walkthroughs, and delivery
              handoff questions.
            </p>
          </div>
        </section>

        <section className="bg-white px-6 py-8 text-slate-900 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800 lg:hidden"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>

            <div className="mt-5 lg:mt-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10">
                <FiBookOpen className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to search project knowledge, contribute updates, and keep the team aligned.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {(localError || error) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {localError || error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Logging in...' : 'Log in to workspace'}</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-white p-2.5 text-slate-700 shadow-sm shadow-slate-200/70">
                  <FiShield className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Demo credentials</p>
                  <p className="mt-2 text-sm text-slate-600">Email: demo@example.com</p>
                  <p className="mt-1 text-sm text-slate-600">Password: password123</p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              Need an account?{' '}
              <Link to="/register" className="font-semibold text-sky-700 transition hover:text-sky-800">
                Join the workspace
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
