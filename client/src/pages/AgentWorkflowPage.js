import React, { useState, useEffect } from 'react';
import {
  FiSearch, FiPlay, FiCheckCircle, FiClock, FiAlertTriangle,
  FiGlobe, FiRss, FiDatabase, FiCpu, FiLoader, FiChevronDown, FiChevronUp, FiRefreshCw
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';

const STATUS_MAP = {
  queued: { icon: FiClock, color: 'text-slate-500 bg-slate-50', label: 'Queued' },
  researching: { icon: FiSearch, color: 'text-blue-600 bg-blue-50', label: 'Researching' },
  analyzing: { icon: FiCpu, color: 'text-violet-600 bg-violet-50', label: 'Analyzing' },
  publishing: { icon: FiPlay, color: 'text-amber-600 bg-amber-50', label: 'Publishing' },
  completed: { icon: FiCheckCircle, color: 'text-green-600 bg-green-50', label: 'Completed' },
  failed: { icon: FiAlertTriangle, color: 'text-red-600 bg-red-50', label: 'Failed' },
  'awaiting-approval': { icon: FiClock, color: 'text-orange-600 bg-orange-50', label: 'Awaiting Approval' }
};

export default function AgentWorkflowPage() {
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState({
    searchWeb: true,
    searchRss: true,
    searchKnowledgeBase: true,
    requireApproval: true
  });
  const [tasks, setTasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [taskDetail, setTaskDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/agents/tasks');
      setTasks(data.tasks || []);

      // Always refresh expanded task detail for live pipeline status
      if (expandedTask) {
        const { data: detail } = await api.get(`/agents/tasks/${expandedTask}`);
        setTaskDetail(detail.task);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchTasks();
    // Poll faster (3s) while any task is in-progress
    const hasActive = tasks.some(t => !['completed', 'failed', 'awaiting-approval'].includes(t.status));
    const interval = setInterval(fetchTasks, hasActive ? 3000 : 10000);
    return () => clearInterval(interval);
  }, [tasks.length, expandedTask]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.post('/agents/research', { query, ...settings });
      setQuery('');
      await fetchTasks();
    } catch (err) {
      console.error('Research error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const loadTaskDetail = async (taskId) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
      setTaskDetail(null);
      return;
    }

    setExpandedTask(taskId);
    try {
      const { data } = await api.get(`/agents/tasks/${taskId}`);
      setTaskDetail(data.task);
    } catch { /* ignore */ }
  };

  const statusBadge = (status) => {
    const s = STATUS_MAP[status] || STATUS_MAP.queued;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>
        <Icon className={`h-3 w-3 ${['researching', 'analyzing', 'publishing'].includes(status) ? 'animate-spin' : ''}`} />
        {s.label}
      </span>
    );
  };

  const handleRetry = async (taskId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/agents/tasks/${taskId}/retry`);
      await fetchTasks();
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  const pipelineStep = (label, stepData, icon) => {
    const Icon = icon;
    const statusColors = {
      pending: 'border-slate-200 bg-slate-50 text-slate-400',
      running: 'border-blue-200 bg-blue-50 text-blue-600',
      done: 'border-green-200 bg-green-50 text-green-600',
      failed: 'border-red-200 bg-red-50 text-red-600'
    };

    return (
      <div className={`rounded-lg border p-3 ${statusColors[stepData?.status] || statusColors.pending}`}>
        <div className="flex items-center gap-2 text-xs font-medium">
          <Icon className={`h-3.5 w-3.5 ${stepData?.status === 'running' ? 'animate-spin' : ''}`} />
          {label}
          <span className="ml-auto capitalize">{stepData?.status || 'pending'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <FiCpu className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">AI Agent Workflow</h1>
            <p className="text-sm text-slate-500">
              Researcher → Analyst → Publisher pipeline with DuckDuckGo, RSS & KB search
            </p>
          </div>
        </div>

        {/* Research Form */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to research? e.g. 'Check for critical Node.js security updates'"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-4">
              {[
                { key: 'searchWeb', icon: FiGlobe, label: 'Web Search (DuckDuckGo)' },
                { key: 'searchRss', icon: FiRss, label: 'RSS Feeds' },
                { key: 'searchKnowledgeBase', icon: FiDatabase, label: 'Knowledge Base' },
                { key: 'requireApproval', icon: FiCheckCircle, label: 'Require Approval' }
              ].map(({ key, icon: Icon, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => setSettings(s => ({ ...s, [key]: e.target.checked }))}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-400"
                  />
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  {label}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={!query.trim() || submitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
            >
              {submitting ? (
                <><FiLoader className="h-4 w-4 animate-spin" /> Starting…</>
              ) : (
                <><FiPlay className="h-4 w-4" /> Start Research Pipeline</>
              )}
            </button>
          </form>
        </div>

        {/* Pipeline Explanation */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { icon: FiSearch, title: 'Researcher', desc: 'Gathers data from KB, web, and RSS feeds', color: 'bg-blue-50 text-blue-600' },
            { icon: FiCpu, title: 'Analyst', desc: 'Identifies risks, dependencies, critical updates', color: 'bg-violet-50 text-violet-600' },
            { icon: FiPlay, title: 'Publisher', desc: 'Creates polished report for review', color: 'bg-amber-50 text-amber-600' }
          ].map((step, i) => (
            <div key={step.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${step.color}`}>
                <step.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">{i + 1}. {step.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks List */}
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Research Tasks</h2>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
            <FiSearch className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No research tasks yet. Start one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task._id} className="rounded-xl border border-slate-200 bg-white">
                <div
                  onClick={() => loadTaskDetail(task._id)}
                  className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{task.query}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>{new Date(task.createdAt).toLocaleString()}</span>
                      {task.pipeline && !['completed', 'failed', 'awaiting-approval'].includes(task.status) && (
                        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5">
                          <span className={task.pipeline.researcher?.status === 'done' ? 'text-green-500' : task.pipeline.researcher?.status === 'running' ? 'text-blue-500' : 'text-slate-400'}>R</span>
                          <span className="text-slate-300">→</span>
                          <span className={task.pipeline.analyst?.status === 'done' ? 'text-green-500' : task.pipeline.analyst?.status === 'running' ? 'text-blue-500' : 'text-slate-400'}>A</span>
                          <span className="text-slate-300">→</span>
                          <span className={task.pipeline.publisher?.status === 'done' ? 'text-green-500' : task.pipeline.publisher?.status === 'running' ? 'text-blue-500' : 'text-slate-400'}>P</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(task.status)}
                    {task.status === 'failed' && (
                      <button
                        onClick={(e) => handleRetry(task._id, e)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                        title="Retry this task"
                      >
                        <FiRefreshCw className="h-3 w-3" /> Retry
                      </button>
                    )}
                    {expandedTask === task._id ? (
                      <FiChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <FiChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedTask === task._id && taskDetail && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {/* Pipeline Status */}
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {pipelineStep('Researcher', taskDetail.pipeline?.researcher, FiSearch)}
                      {pipelineStep('Analyst', taskDetail.pipeline?.analyst, FiCpu)}
                      {pipelineStep('Publisher', taskDetail.pipeline?.publisher, FiPlay)}
                    </div>

                    {/* Research Results */}
                    {taskDetail.pipeline?.researcher?.results?.brief && (
                      <div className="mb-4">
                        <h3 className="mb-2 text-xs font-semibold text-slate-700">Research Brief</h3>
                        <div className="prose prose-sm max-w-none rounded-lg bg-slate-50 p-4 text-slate-700">
                          <ReactMarkdown>{taskDetail.pipeline.researcher.results.brief}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Analysis */}
                    {taskDetail.pipeline?.analyst?.analysis && (
                      <div className="mb-4">
                        <h3 className="mb-2 text-xs font-semibold text-slate-700">Analysis</h3>
                        <div className="prose prose-sm max-w-none rounded-lg bg-violet-50 p-4 text-slate-700">
                          <ReactMarkdown>{taskDetail.pipeline.analyst.analysis}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Published Report */}
                    {taskDetail.pipeline?.publisher?.output && (
                      <div className="mb-4">
                        <h3 className="mb-2 text-xs font-semibold text-slate-700">Published Report</h3>
                        <div className="prose prose-sm max-w-none rounded-lg bg-amber-50 p-4 text-slate-700">
                          <ReactMarkdown>{taskDetail.pipeline.publisher.output}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Sources */}
                    {taskDetail.pipeline?.researcher?.results?.externalSources?.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-slate-700">Sources</h3>
                        <div className="flex flex-wrap gap-2">
                          {taskDetail.pipeline.researcher.results.externalSources.map((s, i) => (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-violet-100 hover:text-violet-700"
                            >
                              {s.source === 'rss' ? <FiRss className="h-3 w-3" /> : <FiGlobe className="h-3 w-3" />}
                              {s.title?.slice(0, 50)}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
