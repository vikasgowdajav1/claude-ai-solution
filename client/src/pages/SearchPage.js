import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { FiFilter, FiClock, FiUser } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

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
  const [filters, setFilters] = useState({
    category: category,
  });

  useEffect(() => {
    const search = async () => {
      if (!query && !filters.category) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const params = {};
        if (query) params.q = query;
        if (filters.category) params.category = filters.category;

        const endpoint = filters.category && !query
          ? `/search/category/${filters.category}`
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
  }, [query, filters.category]);

  const handleCategoryChange = (e) => {
    setFilters({ category: e.target.value });
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Search Wiki</h1>
        
        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.search.value;
            if (input.trim()) {
              setSearchParams({ q: input });
            }
          }}
          className="mb-4"
        >
          <input
            name="search"
            type="text"
            defaultValue={query}
            placeholder="Search for wiki pages..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiFilter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Category:</span>
          </div>
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {loading ? 'Searching...' : `Results ${results.length > 0 ? `(${results.length})` : ''}`}
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Searching for pages...
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-red-600">
            {error}
          </div>
        ) : results.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              {query || filters.category
                ? 'No pages found. Try a different search or category.'
                : 'Enter a search term or select a category to begin.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {results.map((result) => (
              <Link
                key={result._id}
                to={`/page/${result.slug}`}
                className="px-6 py-4 hover:bg-gray-50 transition block"
              >
                <h3 className="font-semibold text-blue-600 hover:text-blue-800 mb-1">
                  {result.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {String(result.content || '').substring(0, 150) || 'No content available'}...
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                    {result.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <FiUser className="w-3 h-3" />
                    <span>{result.author?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiClock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}</span>
                  </div>
                  <span>{result.viewCount || 0} views</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
