import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import {
  FiArrowRight,
  FiClock,
  FiFilter,
  FiLayers,
  FiSearch,
  FiTag,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { getContentPreview } from '../utils/content';

const CATEGORIES = [
  'infrastructure',
  'deployment',
  'security',
  'database',
  'monitoring',
  'troubleshooting',
  'application',
  'other'
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const search = async () => {
      if (!query && !category) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const params = {};
        if (query) params.q = query;
        if (category) params.category = category;

        const endpoint = category && !query
          ? `/search/category/${category}`
          : '/search';

        const response = await api.get(endpoint, { params });
        setResults(response.data.results || response.data.pages || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [query, category]);

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value;
    const nextParams = new URLSearchParams(searchParams);

    if (nextCategory) {
      nextParams.set('category', nextCategory);
    } else {
      nextParams.delete('category');
    }

    setSearchParams(nextParams);
  };

  const activeFilters = useMemo(() => {
    return [
      query ? `Query: ${query}` : null,
      category ? `Category: ${category}` : null,
    ].filter(Boolean);
  }, [query, category]);

  const resultSummary = useMemo(() => {
    if (loading) {
      return 'Searching knowledge base...';
    }

    if (results.length === 0) {
      return query || category
        ? 'No matching entries yet. Try broadening the search or changing the domain.'
        : 'Enter a search term or select a category to begin.';
    }

    return `${results.length} knowledge ${results.length === 1 ? 'entry' : 'entries'} matched your current search.`;
  }, [loading, results.length, query, category]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 px-6 py-8 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_30%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              <FiSearch className="h-3.5 w-3.5" />
              <span>Knowledge search</span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Search project context by question, system, or domain.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Find release notes, architecture decisions, operational guidance, and answers that
              the team can trace back to maintained project knowledge.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const nextParams = new URLSearchParams(searchParams);
                const trimmedInput = searchInput.trim();

                if (trimmedInput) {
                  nextParams.set('q', trimmedInput);
                } else {
                  nextParams.delete('q');
                }

                setSearchParams(nextParams);
              }}
              className="mt-8"
            >
              <div className="flex flex-col gap-3 rounded-[28px] border border-slate-800 bg-slate-900/80 p-3 shadow-inner shadow-slate-950/20 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="search"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Ask about deployments, APIs, authentication, or incidents"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  <span>Search now</span>
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-slate-800 bg-slate-900/80 p-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Current scope
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All categories'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Search status
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {loading ? 'Searching live' : `${results.length} result${results.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <FiFilter className="h-4 w-4" />
                <span>Filter by category</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Narrow results to the domain where your team would expect the answer to live.
              </p>
            </div>

            <select
              value={category}
              onChange={handleCategoryChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 lg:max-w-xs"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {activeFilters.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                >
                  {filter}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <FiTrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Search guidance</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Ask the page the way a teammate would ask in chat, then narrow by domain if needed.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            {[
              'Start broad with a question, then refine by category if results are noisy.',
              'Search by systems, incidents, features, or release processes rather than exact file names.',
              'Use category filters alone when you want a domain overview before asking a detailed question.',
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Results</h2>
              <p className="mt-1 text-sm text-slate-500">{resultSummary}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              <FiLayers className="h-3.5 w-3.5" />
              <span>{loading ? 'Searching' : `${results.length} matches`}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">
            Searching for matching knowledge entries...
          </div>
        ) : error ? (
          <div className="px-6 py-10">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {error}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-base font-medium text-slate-800">
              {query || category ? 'No pages matched this search.' : 'No search started yet.'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {query || category
                ? 'Try a broader query, remove one filter, or explore a different category.'
                : 'Enter a search term or select a category to begin.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((result) => (
              <Link
                key={result._id}
                to={`/page/${result.slug}`}
                className="block px-6 py-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        {result.category}
                      </span>
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                        Knowledge result
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-slate-900 transition group-hover:text-slate-950">
                      {result.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {getContentPreview(result.content, 180)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <FiUser className="h-3.5 w-3.5" />
                        <span>{result.author?.name || 'Unknown author'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiClock className="h-3.5 w-3.5" />
                        <span>{formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiTag className="h-3.5 w-3.5" />
                        <span>{result.viewCount || 0} views</span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-sm font-medium text-sky-700 lg:pl-6">
                    Open page →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
