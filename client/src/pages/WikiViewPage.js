import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { FiArrowLeft, FiEdit2, FiTrash2, FiClock, FiUser, FiEye } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { looksLikeHtml, sanitizeRichText } from '../utils/content';

export default function WikiViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/wiki/page/${slug}`);
        setPage(response.data.page);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/wiki/${page._id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete page');
    }
  };

  const canEdit = user && (user._id === page?.author?._id || user.role === 'admin' || user.role === 'editor');
  const canDelete = user && (user._id === page?.author?._id || user.role === 'admin');
  const contentIsHtml = looksLikeHtml(page?.content || '');
  const renderedHtml = useMemo(
    () => (contentIsHtml ? sanitizeRichText(page?.content || '') : ''),
    [contentIsHtml, page?.content]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading page...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-red-800 font-bold mb-2">Error</h2>
        <p className="text-red-700 mb-4">{error || 'Page not found'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 font-medium">
          <FiArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <Link
            to="/"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <FiUser className="w-4 h-4" />
              <span>By {page.author?.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiClock className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiEye className="w-4 h-4" />
              <span>{page.viewCount || 0} views</span>
            </div>
            <span className="bg-gray-200 px-3 py-1 rounded capitalize">
              {page.category}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {canEdit && (
            <Link
              to={`/editor/${page._id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FiEdit2 className="w-4 h-4" />
              <span>Edit</span>
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {page.tags && page.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {page.tags.map((tag) => (
            <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="prose prose-sm max-w-none">
          {contentIsHtml ? (
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          ) : (
            <ReactMarkdown>{page.content}</ReactMarkdown>
          )}
        </div>
      </div>

      {/* Version History */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-between px-6 py-4 border-b border-gray-200 text-left font-bold text-gray-900 hover:bg-gray-50"
        >
          <span className="inline-flex items-center gap-2">
            <FiEdit2 className="h-4 w-4" />
            <span>Version History</span>
          </span>
          <span className="text-sm font-medium text-gray-500">{page.versions?.length || 0}</span>
        </button>

        {showHistory && page.versions && page.versions.length > 0 && (
          <div className="divide-y divide-gray-200">
            {page.versions
              .slice()
              .reverse()
              .map((version, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      Version {page.versions.length - index}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(version.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    By {version.editor?.name}
                  </p>
                  {version.description && (
                    <p className="text-sm text-gray-500">
                      {version.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {page.comments && page.comments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Comments</h2>
          <div className="space-y-4">
            {page.comments.map((comment, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{comment.author?.name}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-gray-700">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
