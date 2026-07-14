import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, error, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: ''
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password, formData.department);
      navigate('/');
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/80 shadow-[0_28px_100px_rgba(15,23,42,0.32)] backdrop-blur lg:grid-cols-[1.02fr_0.98fr]">
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
              <FiUsers className="h-3.5 w-3.5" />
              <span>Workspace access</span>
            </div>

            <h1 className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              Give every contributor the same project context.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
              Create an account to search knowledge, document decisions, and keep handoffs from
              depending on tribal memory.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                'Search project answers instead of chasing people in chat.',
                'Capture architecture, release notes, and troubleshooting in one place.',
                'Onboard faster with the same context your delivery team already uses.',
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-3xl border border-slate-800 bg-slate-950/55 px-5 py-4 text-sm leading-6 text-slate-300"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[28px] border border-slate-800 bg-slate-950/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Team setup
            </p>
            <p className="mt-3 text-xl font-semibold text-white">Start with a shared source of truth.</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              New teammates should be able to find the answer before they need a meeting.
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
                Create your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Join the workspace to contribute pages, share fixes, and keep delivery knowledge discoverable.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {(localError || error) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {localError || error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    required
                  />
                </div>
              </div>

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
                <label htmlFor="department" className="mb-2 block text-sm font-medium text-slate-700">
                  Department (Optional)
                </label>
                <div className="relative">
                  <FiUsers className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="DevOps / Backend / Frontend"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
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
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiShield className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
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
                <span>{loading ? 'Registering...' : 'Create workspace access'}</span>
                <FiArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-sky-700 transition hover:text-sky-800">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
