import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMap, FiPlus, FiCheck, FiX, FiChevronRight, FiTerminal,
  FiUsers, FiMonitor, FiAlertTriangle, FiLoader, FiCopy, FiCheckCircle
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';

const PLATFORMS = [
  { value: 'windows', label: 'Windows', icon: '🪟' },
  { value: 'mac', label: 'macOS', icon: '🍎' },
  { value: 'linux', label: 'Linux', icon: '🐧' }
];

const ROLES = ['developer', 'tester', 'ba', 'devops'];

const CATEGORIES = ['setup', 'build', 'deploy', 'test', 'debug', 'migrate', 'onboard', 'other'];

export default function SherpaPage() {
  const [trails, setTrails] = useState([]);
  const [activeTrail, setActiveTrail] = useState(null);
  const [stepStats, setStepStats] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [platform, setPlatform] = useState('windows');
  const [role, setRole] = useState('developer');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [failedAt, setFailedAt] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  // Create form state
  const [newTrail, setNewTrail] = useState({
    title: '', description: '', category: 'setup',
    targetRoles: ['developer'], platforms: ['windows', 'mac', 'linux'],
    prerequisites: '', tags: '', steps: [{ order: 1, title: '', description: '', commands: { windows: '', mac: '', linux: '' }, checkQuestion: '', onFailHint: '', cornerCases: [] }]
  });

  useEffect(() => {
    fetchTrails();
  }, []);

  const fetchTrails = async () => {
    try {
      const { data } = await api.get('/sherpa/trails');
      setTrails(data.trails || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const openTrail = async (slug) => {
    try {
      const { data } = await api.get(`/sherpa/trails/${slug}`);
      setActiveTrail(data.trail);
      setStepStats(data.stepStats || []);
      setCurrentStep(0);
      setCompletedSteps([]);
      setFailedAt(null);

      const { data: rec } = await api.get(`/sherpa/trails/${slug}/recommend`, { params: { platform, role } });
      setRecommendation(rec);
    } catch { /* ignore */ }
  };

  const markStepDone = (stepOrder) => {
    setCompletedSteps(prev => [...prev, stepOrder]);
    if (currentStep < (activeTrail?.steps?.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const markStepFailed = (stepOrder) => {
    setFailedAt(stepOrder);
  };

  const submitRecord = async (success) => {
    if (!activeTrail) return;
    try {
      await api.post(`/sherpa/trails/${activeTrail.slug}/record`, {
        role, platform, completedSteps, failedAt, success,
        notes: success ? 'Completed all steps' : `Failed at step ${failedAt}`
      });
      await openTrail(activeTrail.slug);
    } catch { /* ignore */ }
  };

  const handleCreateTrail = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sherpa/trails', {
        ...newTrail,
        prerequisites: newTrail.prerequisites.split(',').map(p => p.trim()).filter(Boolean),
        tags: newTrail.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setShowCreateForm(false);
      setNewTrail({ title: '', description: '', category: 'setup', targetRoles: ['developer'], platforms: ['windows', 'mac', 'linux'], prerequisites: '', tags: '', steps: [{ order: 1, title: '', description: '', commands: { windows: '', mac: '', linux: '' }, checkQuestion: '', onFailHint: '', cornerCases: [] }] });
      await fetchTrails();
    } catch { /* ignore */ }
  };

  const addStep = () => {
    setNewTrail(t => ({
      ...t,
      steps: [...t.steps, { order: t.steps.length + 1, title: '', description: '', commands: { windows: '', mac: '', linux: '' }, checkQuestion: '', onFailHint: '', cornerCases: [] }]
    }));
  };

  const updateStep = (index, field, value) => {
    setNewTrail(t => {
      const steps = [...t.steps];
      if (field.startsWith('commands.')) {
        const plat = field.split('.')[1];
        steps[index] = { ...steps[index], commands: { ...steps[index].commands, [plat]: value } };
      } else {
        steps[index] = { ...steps[index], [field]: value };
      }
      return { ...t, steps };
    });
  };

  const copyCommand = (cmd, id) => {
    navigator.clipboard.writeText(cmd);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── TRAIL WALKTHROUGH VIEW ─────────────────────────────────
  if (activeTrail) {
    const step = activeTrail.steps[currentStep];
    const stats = stepStats.find(s => s.order === step?.order);
    const command = step?.commands?.[platform] || step?.commands?.windows || '';

    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => setActiveTrail(null)} className="text-sm text-slate-500 hover:text-slate-700">
              ← Back to trails
            </button>
            <div className="flex items-center gap-2">
              {PLATFORMS.map(p => (
                <button key={p.value} onClick={() => setPlatform(p.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${platform === p.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900">{activeTrail.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{activeTrail.description}</p>

            {recommendation && (
              <div className={`mt-4 rounded-xl p-4 text-sm ${recommendation.verifiedPaths > 0 ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
                <div className="flex items-center gap-2 font-medium">
                  {recommendation.verifiedPaths > 0 ? <FiCheckCircle className="h-4 w-4" /> : <FiAlertTriangle className="h-4 w-4" />}
                  {recommendation.recommendation}
                </div>
                {recommendation.riskySteps?.length > 0 && (
                  <p className="mt-2 text-xs">⚠️ Watch out at step{recommendation.riskySteps.length > 1 ? 's' : ''}: {recommendation.riskySteps.map(r => r.step).join(', ')}</p>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mb-6 flex items-center gap-1">
            {activeTrail.steps.map((s, i) => (
              <div key={i} onClick={() => { setCurrentStep(i); setFailedAt(null); }}
                className={`h-2 flex-1 cursor-pointer rounded-full transition ${
                  completedSteps.includes(s.order) ? 'bg-green-500'
                  : failedAt === s.order ? 'bg-red-500'
                  : i === currentStep ? 'bg-violet-500'
                  : 'bg-slate-200'
                }`} />
            ))}
          </div>

          {/* Current Step */}
          {step && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Step {step.order} of {activeTrail.steps.length}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h2>
                </div>
                {stats && stats.failCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                    <FiAlertTriangle className="h-3 w-3" /> {stats.failRate}% fail here
                  </span>
                )}
              </div>

              {step.description && (
                <p className="mt-3 text-sm text-slate-600">{step.description}</p>
              )}

              {/* Command */}
              {command && (
                <div className="mt-4">
                  <div className="flex items-center justify-between rounded-t-lg bg-slate-800 px-4 py-2">
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                      <FiTerminal className="h-3 w-3" /> {platform}
                    </span>
                    <button onClick={() => copyCommand(command, `${step.order}-${platform}`)}
                      className="text-xs text-slate-400 hover:text-white">
                      {copied === `${step.order}-${platform}` ? <FiCheck className="h-3.5 w-3.5 text-green-400" /> : <FiCopy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-b-lg bg-slate-900 px-4 py-3 text-sm text-green-300">
                    {command}
                  </pre>
                </div>
              )}

              {/* Corner cases */}
              {step.cornerCases?.length > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">⚠️ Known corner cases:</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-amber-600">
                    {step.cornerCases.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Check question */}
              {step.checkQuestion && !completedSteps.includes(step.order) && failedAt !== step.order && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm font-medium text-slate-700">{step.checkQuestion}</p>
                  <div className="mt-3 flex gap-3">
                    <button onClick={() => markStepDone(step.order)}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                      <FiCheck className="h-4 w-4" /> Yes, it worked
                    </button>
                    <button onClick={() => markStepFailed(step.order)}
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                      <FiX className="h-4 w-4" /> No, failed
                    </button>
                  </div>
                </div>
              )}

              {/* Failed hint */}
              {failedAt === step.order && step.onFailHint && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-medium">💡 Try this:</p>
                  <p className="mt-1">{step.onFailHint}</p>
                </div>
              )}

              {/* Completed badge */}
              {completedSteps.includes(step.order) && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-600">
                  <FiCheckCircle className="h-4 w-4" /> Step verified
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30">
                  ← Previous
                </button>
                {currentStep === activeTrail.steps.length - 1 && completedSteps.length > 0 ? (
                  <button onClick={() => submitRecord(completedSteps.length === activeTrail.steps.length)}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
                    Finish & Record Path
                  </button>
                ) : (
                  <button onClick={() => setCurrentStep(Math.min(activeTrail.steps.length - 1, currentStep + 1))}
                    disabled={currentStep === activeTrail.steps.length - 1}
                    className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30">
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── TRAILS LIST VIEW ───────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
              <FiMap className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Sherpa</h1>
              <p className="text-sm text-slate-500">Guided trails with verified paths — follow what actually worked</p>
            </div>
          </div>
          <button onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
            <FiPlus className="h-4 w-4" /> New Trail
          </button>
        </div>

        {/* Role & Platform selector */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FiUsers className="h-4 w-4 text-slate-400" />
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm capitalize">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <FiMonitor className="h-4 w-4 text-slate-400" />
            {PLATFORMS.map(p => (
              <button key={p.value} onClick={() => setPlatform(p.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${platform === p.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateTrail} className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Create Trail</h2>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <input type="text" placeholder="Trail title" value={newTrail.title}
                onChange={(e) => setNewTrail(t => ({ ...t, title: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" required />
              <select value={newTrail.category} onChange={(e) => setNewTrail(t => ({ ...t, category: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea placeholder="Description" value={newTrail.description}
              onChange={(e) => setNewTrail(t => ({ ...t, description: e.target.value }))}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" rows={2} />
            <input type="text" placeholder="Prerequisites (comma-separated)" value={newTrail.prerequisites}
              onChange={(e) => setNewTrail(t => ({ ...t, prerequisites: e.target.value }))}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none" />

            {/* Steps */}
            <h3 className="mb-3 text-xs font-semibold text-slate-700">Steps</h3>
            {newTrail.steps.map((step, i) => (
              <div key={i} className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-medium text-slate-500">Step {i + 1}</p>
                <input type="text" placeholder="Step title" value={step.title}
                  onChange={(e) => updateStep(i, 'title', e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
                <textarea placeholder="Description" value={step.description}
                  onChange={(e) => updateStep(i, 'description', e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={1} />
                <div className="mb-2 grid grid-cols-3 gap-2">
                  <input type="text" placeholder="🪟 Windows command" value={step.commands.windows}
                    onChange={(e) => updateStep(i, 'commands.windows', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono" />
                  <input type="text" placeholder="🍎 macOS command" value={step.commands.mac}
                    onChange={(e) => updateStep(i, 'commands.mac', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono" />
                  <input type="text" placeholder="🐧 Linux command" value={step.commands.linux}
                    onChange={(e) => updateStep(i, 'commands.linux', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono" />
                </div>
                <input type="text" placeholder="Verification question (e.g., Did the server start?)" value={step.checkQuestion}
                  onChange={(e) => updateStep(i, 'checkQuestion', e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="text" placeholder="If failed, try this..." value={step.onFailHint}
                  onChange={(e) => updateStep(i, 'onFailHint', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            ))}
            <button type="button" onClick={addStep}
              className="mb-4 text-sm text-teal-600 hover:text-teal-700">+ Add step</button>

            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700">
                Create Trail
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Trails List */}
        {loading ? (
          <div className="flex justify-center py-12"><FiLoader className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : trails.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
            <FiMap className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No trails yet. Create one to guide your team.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trails.map(trail => (
              <div key={trail._id} onClick={() => openTrail(trail.slug)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 transition hover:border-teal-200 hover:shadow-sm">
                <div>
                  <p className="text-sm font-medium text-slate-900">{trail.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="capitalize">{trail.category}</span>
                    <span>•</span>
                    <span>{trail.steps?.length || 0} steps</span>
                    <span>•</span>
                    <span>{trail.records?.length || 0} attempts</span>
                    {trail.successRate > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">{trail.successRate}% success</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {trail.verifiedPlatforms?.map(p => (
                    <span key={p} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600">
                      {PLATFORMS.find(pl => pl.value === p)?.icon} ✓
                    </span>
                  ))}
                  <FiChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
