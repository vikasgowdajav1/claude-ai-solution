import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FiUploadCloud, FiFile, FiTrash2, FiRefreshCw, FiDatabase,
  FiCheckCircle, FiAlertCircle, FiLoader, FiTag, FiSearch
} from 'react-icons/fi';
import api from '../utils/api';

const CATEGORIES = [
  'infrastructure', 'deployment', 'security', 'database',
  'monitoring', 'troubleshooting', 'application', 'runbook',
  'architecture', 'api-docs', 'onboarding', 'other'
];

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'other', tags: '' });
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = {};
      if (filter.category) params.category = filter.category;
      if (filter.status) params.status = filter.status;
      const { data } = await api.get('/documents', { params });
      setDocuments(data.documents || []);
    } catch { /* ignore */ }
  }, [filter]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/documents/stats');
      setStats(data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchDocuments]);

  // Auto-poll while any document is processing/uploaded (not yet embedded)
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'uploaded');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
      fetchStats();
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', uploadForm.title || file.name);
        formData.append('category', uploadForm.category);
        formData.append('tags', uploadForm.tags);

        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setUploadForm({ title: '', category: 'other', tags: '' });
      await Promise.all([fetchDocuments(), fetchStats()]);
      showToast(`${acceptedFiles.length} file(s) uploaded — processing & embedding in progress…`, 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }, [uploadForm, fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv']
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      await Promise.all([fetchDocuments(), fetchStats()]);
    } catch { /* ignore */ }
  };

  const handleReprocess = async (id) => {
    try {
      await api.post(`/documents/${id}/reprocess`);
      await fetchDocuments();
    } catch { /* ignore */ }
  };

  const handleReembedAll = async () => {
    try {
      await api.post('/documents/reembed');
      await Promise.all([fetchDocuments(), fetchStats()]);
    } catch { /* ignore */ }
  };

  const statusBadge = (status) => {
    const map = {
      uploaded: { icon: FiLoader, color: 'text-blue-600 bg-blue-50 border border-blue-200', label: 'Queued\u2026' },
      processing: { icon: FiLoader, color: 'text-amber-600 bg-amber-50 border border-amber-200', label: 'Embedding\u2026' },
      embedded: { icon: FiCheckCircle, color: 'text-green-600 bg-green-50 border border-green-200', label: 'Embedded' },
      failed: { icon: FiAlertCircle, color: 'text-red-600 bg-red-50 border border-red-200', label: 'Failed' }
    };
    const s = map[status] || map.uploaded;
    const Icon = s.icon;
    const isActive = status === 'processing' || status === 'uploaded';
    return (
      <div className="flex flex-col items-end gap-1">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.color}`}>
          <Icon className={`h-3 w-3 ${isActive ? 'animate-spin' : ''}`} />
          {s.label}
        </span>
        {isActive && (
          <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full animate-pulse rounded-full bg-gradient-to-r from-violet-400 to-violet-600"
              style={{ width: status === 'processing' ? '60%' : '20%', transition: 'width 0.5s' }} />
          </div>
        )}
      </div>
    );
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <FiDatabase className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Knowledge Base</h1>
              <p className="text-sm text-slate-500">Upload documents, build embeddings, power RAG search</p>
            </div>
          </div>
          <button
            onClick={handleReembedAll}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Re-embed All
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-8 grid grid-cols-4 gap-4">
            {[
              { label: 'Total Documents', value: stats.documents.total, color: 'text-slate-900' },
              { label: 'Embedded', value: stats.documents.embedded, color: 'text-green-600' },
              { label: 'Total Chunks', value: stats.totalChunks, color: 'text-violet-600' },
              { label: 'Failed', value: stats.documents.failed, color: 'text-red-600' }
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Upload Document</h2>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Document title (optional)"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(f => ({ ...f, title: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
            <select
              value={uploadForm.category}
              onChange={(e) => setUploadForm(f => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm(f => ({ ...f, tags: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
          </div>

          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
              isDragActive
                ? 'border-violet-400 bg-violet-50'
                : 'border-slate-300 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <FiLoader className="mb-3 h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm text-slate-600">Uploading and processing…</p>
              </>
            ) : (
              <>
                <FiUploadCloud className="mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  {isDragActive ? 'Drop files here…' : 'Drag & drop PDF, TXT, MD, or CSV files'}
                </p>
                <p className="mt-1 text-xs text-slate-500">Max 20MB per file</p>
              </>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-4 flex items-center gap-3">
          <select
            value={filter.category}
            onChange={(e) => setFilter(f => ({ ...f, category: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>
            <option value="embedded">Embedded</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
            <FiDatabase className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No documents yet. Upload your first PDF to build the knowledge base.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FiFile className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span>{doc.originalFilename}</span>
                      <span>•</span>
                      <span>{formatSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span className="capitalize">{doc.category}</span>
                      {doc.tags?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FiTag className="h-3 w-3" />
                            {doc.tags.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {statusBadge(doc.status)}
                  {(doc.status === 'failed' || doc.status === 'uploaded') && (
                    <button
                      onClick={() => handleReprocess(doc._id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      title="Reprocess"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg ${
            toast.type === 'error'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-violet-200 bg-violet-50 text-violet-700'
          }`}>
            {toast.type === 'error'
              ? <FiAlertCircle className="h-4 w-4 shrink-0" />
              : <FiLoader className="h-4 w-4 shrink-0 animate-spin" />
            }
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-sm opacity-60 hover:opacity-100">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
