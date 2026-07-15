import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiLayers,
  FiMessageSquare,
  FiPlus,
  FiTag,
  FiTrendingUp,
} from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { getContentPreview } from '../utils/content';

const DOMAIN_STYLES = [
  {
    name: 'Infrastructure',
    value: 'infrastructure',
    description: 'Core environments, hosting decisions, networking, and dependencies.',
    className: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  {
    name: 'Deployment',
    value: 'deployment',
    description: 'Release runbooks, rollback steps, release checklists, and approvals.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    name: 'Security',
    value: 'security',
    description: 'Authentication, authorization, compliance notes, and risk controls.',
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  {
    name: 'Database',
    value: 'database',
    description: 'Schemas, backup plans, migrations, and recovery procedures.',
    className: 'border-violet-200 bg-violet-50 text-violet-900',
  },
  {
    name: 'Monitoring',
    value: 'monitoring',
    description: 'Dashboards, alerts, SLO context, and operational visibility.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  {
    name: 'Troubleshooting',
    value: 'troubleshooting',
    description: 'Known issues, fixes, incident history, and support playbooks.',
    className: 'border-slate-300 bg-slate-100 text-slate-900',
  },
];

const STARTER_QUESTIONS = [
  'What is the deployment runbook?',
  'Where is authentication implemented?',
  'What are the key architecture decisions?',
  'Which pages explain database backup and restore?',
];

export default function HomePage() {
  const { user } = useAuthStore();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/wiki?limit=10&sort=-updatedAt');
        setPages(response.data.pages || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load knowledge entries');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const knowledgeStats = useMemo(() => {
    const categoryCount = new Set(pages.map((page) => page.category).filter(Boolean)).size;
    const pinnedCount = pages.filter((page) => page.isPinned).length;
    const recentlyUpdatedCount = pages.filter((page) => {
      if (!page.updatedAt) {
        return false;
      }

      return Date.now() - new Date(page.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 7;
    }).length;

    return {
      total: pages.length,
      categoryCount,
      pinnedCount,
      recentlyUpdatedCount,
    };
  }, [pages]);

  const domainCards = useMemo(
    () =>
      DOMAIN_STYLES.map((domain) => ({
        ...domain,
        count: pages.filter((page) => page.category === domain.value).length,
      })),
    [pages]
  );

  const canContribute = user && (user.role === 'editor' || user.role === 'admin');

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 px-6 py-8 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10 lg:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:gap-10">
          <div>
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              AI-powered knowledge onboarding
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Turn scattered project context into answers the team can use.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Centralize requirements, architecture notes, release decisions, and operational
              context so new team members can contribute faster without depending on tribal
              knowledge.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/search?q=What are the main architecture decisions?"
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                <FiMessageSquare className="h-4 w-4" />
                <span>Ask the assistant</span>
              </Link>

              {canContribute ? (
                <Link
                  to="/editor"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add knowledge</span>
                </Link>
              ) : (
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  <FiArrowRight className="h-4 w-4" />
                  <span>Explore knowledge</span>
                </Link>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white">Reusable across projects</p>
                <p className="mt-1 text-slate-400">
                  Keep the experience generic so teams can plug in their own sources.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Demo-ready workflow</p>
                <p className="mt-1 text-slate-400">
                  Ask, trace, and review project knowledge in under three minutes.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Knowledge base
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{knowledgeStats.total}</p>
              <p className="mt-2 text-sm text-slate-400">
                Indexed entries currently available for search and review.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Search mode
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Natural language</p>
                <p className="mt-2 text-sm text-slate-400">
                  Ask about flows, APIs, requirements, and decisions.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Source roadmap
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Generic connectors</p>
                <p className="mt-2 text-sm text-slate-400">
                  Designed for Jira, Confluence, docs, and future repo sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Knowledge entries</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{knowledgeStats.total}</p>
            </div>
            <span className="rounded-2xl bg-sky-50 p-3 text-sky-600">
              <FiBookOpen className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Searchable pages available to onboard teammates and answer recurring questions.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active domains</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {knowledgeStats.categoryCount}
              </p>
            </div>
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <FiLayers className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Coverage across architecture, security, deployment, troubleshooting, and more.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Recently updated</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {knowledgeStats.recentlyUpdatedCount}
              </p>
            </div>
            <span className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <FiTrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Entries touched in the last seven days, useful for keeping onboarding context current.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pinned priorities</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{knowledgeStats.pinnedCount}</p>
            </div>
            <span className="rounded-2xl bg-violet-50 p-3 text-violet-600">
              <FiTag className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            High-signal documents the team should review first before digging into deeper details.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent knowledge entries</h2>
              <p className="mt-1 text-sm text-slate-500">
                High-signal project context the team can read, search, and reuse.
              </p>
            </div>

            <Link
              to="/search"
              className="hidden items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
            >
              <span>Open search</span>
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              Loading recent knowledge entries...
            </div>
          ) : error ? (
            <div className="px-6 py-10">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {error}. Start the backend and MongoDB to load live project knowledge.
              </div>
            </div>
          ) : pages.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-base font-medium text-slate-800">No knowledge entries yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Add architecture notes, runbooks, or decision records to make onboarding easier.
              </p>
              {canContribute ? (
                <Link
                  to="/editor"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Create first entry</span>
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pages.map((page) => (
                <Link
                  key={page._id}
                  to={`/page/${page.slug}`}
                  className="block px-6 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {page.category}
                        </span>
                        {page.isPinned ? (
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                            Priority
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-slate-900">{page.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {getContentPreview(page.content, 180)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <FiClock className="h-3.5 w-3.5" />
                          <span>
                            {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiTag className="h-3.5 w-3.5" />
                          <span>{page.viewCount || 0} views</span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm text-slate-500 lg:pl-6 lg:text-right">
                      <p className="font-medium text-slate-700">
                        {page.author?.name || 'Unknown author'}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        Last contributor
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900">Starter questions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use these prompts to demonstrate fast onboarding and contextual answers.
            </p>

            <div className="mt-5 space-y-3">
              {STARTER_QUESTIONS.map((question) => (
                <Link
                  key={question}
                  to={`/search?q=${encodeURIComponent(question)}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  <span>{question}</span>
                  <FiArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-xl font-semibold text-slate-900">Source readiness</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Signal what the platform currently supports and what connects next.
            </p>

            <div className="mt-5 space-y-3">
              {[
                {
                  name: 'Markdown and internal pages',
                  state: 'Live now',
                  tone: 'bg-emerald-50 text-emerald-700',
                },
                {
                  name: 'Conversational search UX',
                  state: 'Ready for demo',
                  tone: 'bg-sky-50 text-sky-700',
                },
                {
                  name: 'Jira connector',
                  state: 'Mock next',
                  tone: 'bg-amber-50 text-amber-700',
                },
                {
                  name: 'Confluence connector',
                  state: 'Mock next',
                  tone: 'bg-violet-50 text-violet-700',
                },
              ].map((source) => (
                <div
                  key={source.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{source.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Knowledge source
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${source.tone}`}
                  >
                    {source.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Knowledge domains</h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse the content structure teammates rely on during onboarding and delivery.
            </p>
          </div>

          <Link to="/search" className="text-sm font-medium text-sky-700 transition hover:text-sky-800">
            Browse all knowledge →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {domainCards.map((domain) => (
            <Link
              key={domain.value}
              to={`/search?category=${domain.value}`}
              className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${domain.className}`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">
                {domain.name}
              </p>
              <p className="mt-4 text-3xl font-semibold">{domain.count}</p>
              <p className="mt-3 text-sm leading-6 opacity-80">{domain.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
