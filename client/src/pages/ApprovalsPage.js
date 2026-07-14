import React, { useState, useEffect } from 'react';
import {
  FiCheck, FiX, FiClock, FiAlertTriangle, FiChevronDown,
  FiChevronUp, FiUser, FiShield, FiLoader
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';

const PRIORITY_MAP = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: '🔴' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🟠' },
  medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🟡' },
  low: { color: 'bg-green-100 text-green-700 border-green-200', icon: '🟢' }
};

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200'
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/approvals', { params });
      setApprovals(data.approvals || []);
      setPendingCount(data.pendingCount || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleReview = async (id, action) => {
    setReviewing(id);
    try {
      await api.patch(`/approvals/${id}/review`, { action, note: reviewNote });
      setReviewNote('');
      setExpandedId(null);
      await fetchApprovals();
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <FiShield className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Approval Queue</h1>
              <p className="text-sm text-slate-500">Human-in-the-loop review for AI agent outputs</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
              <FiClock className="h-4 w-4" />
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Approvals List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : approvals.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
            <FiShield className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No approval requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => {
              const priority = PRIORITY_MAP[approval.priority] || PRIORITY_MAP.medium;
              const isExpanded = expandedId === approval._id;

              return (
                <div key={approval._id} className="rounded-xl border border-slate-200 bg-white">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : approval._id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{priority.icon}</span>
                        <p className="text-sm font-medium text-slate-900">{approval.title}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span className="capitalize">{approval.type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FiUser className="h-3 w-3" />
                          {approval.submittedBy?.name || 'System'}
                        </span>
                        <span>•</span>
                        <span>{new Date(approval.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[approval.status]}`}>
                        {approval.status}
                      </span>
                      {isExpanded ? <FiChevronUp className="h-4 w-4 text-slate-400" /> : <FiChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 py-4">
                      {approval.description && (
                        <p className="mb-3 text-sm text-slate-600">{approval.description}</p>
                      )}

                      {/* Agent Output */}
                      {approval.agentOutput && (
                        <div className="mb-4">
                          <h3 className="mb-2 text-xs font-semibold text-slate-700">Agent Output</h3>
                          <div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-4 text-slate-700"
                            style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <ReactMarkdown>{approval.agentOutput}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {approval.sources?.length > 0 && (
                        <div className="mb-4">
                          <h3 className="mb-2 text-xs font-semibold text-slate-700">Sources ({approval.sources.length})</h3>
                          <div className="flex flex-wrap gap-2">
                            {approval.sources.map((s, i) => (
                              <span key={i} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                [{s.type}] {s.title?.slice(0, 40)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review actions (only for pending) */}
                      {approval.status === 'pending' && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Add a review note (optional)..."
                            rows={2}
                            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleReview(approval._id, 'approved')}
                              disabled={reviewing === approval._id}
                              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                            >
                              <FiCheck className="h-4 w-4" /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(approval._id, 'rejected')}
                              disabled={reviewing === approval._id}
                              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                              <FiX className="h-4 w-4" /> Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Review info for already-reviewed */}
                      {approval.status !== 'pending' && approval.reviewedBy && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                          <p>
                            <span className="font-medium">Reviewed by:</span> {approval.reviewedBy?.name || 'Unknown'}
                            {approval.reviewedAt && ` on ${new Date(approval.reviewedAt).toLocaleString()}`}
                          </p>
                          {approval.reviewNote && <p className="mt-1"><span className="font-medium">Note:</span> {approval.reviewNote}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
