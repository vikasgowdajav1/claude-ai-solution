import { useEffect, useState } from 'react';
import { createTask, fetchHealth, fetchTasks } from './api';

const initialHealth = {
  status: 'checking',
  database: {
    connected: false,
    state: 'unknown',
  },
};

export default function App() {
  const [health, setHealth] = useState(initialHealth);
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const [healthResponse, taskResponse] = await Promise.all([
        fetchHealth(),
        fetchTasks().catch((taskError) => ({ items: [], message: taskError.message })),
      ]);

      setHealth(healthResponse);
      setTasks(taskResponse.items || []);

      if (taskResponse.message) {
        setError(taskResponse.message);
      }
    } catch (requestError) {
      setError(requestError.message);
      setHealth(initialHealth);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!taskTitle.trim()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const createdTask = await createTask(taskTitle.trim());
      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setTaskTitle('');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const healthLabel = health.status === 'ok' ? 'API ready' : 'Waiting on API';
  const databaseLabel = health.database.connected ? 'MongoDB connected' : 'MongoDB offline';

  return (
    <main className="shell">
      <section className="hero-panel">
        <p className="eyebrow">MERN boilerplate</p>
        <h1>Launch a full-stack app without rebuilding the foundation.</h1>
        <p className="lead">
          React on the front, Express on the edge, MongoDB behind the API, and
          just enough structure to start shipping features.
        </p>

        <div className="status-row">
          <article className="status-card">
            <span>{healthLabel}</span>
            <strong>{loading ? 'Refreshing...' : health.status}</strong>
          </article>

          <article className="status-card">
            <span>{databaseLabel}</span>
            <strong>{health.database.state}</strong>
          </article>
        </div>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Backend sample</p>
              <h2>Task API</h2>
            </div>

            <button className="ghost-button" type="button" onClick={loadDashboard}>
              Refresh
            </button>
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <label htmlFor="task-title">Create a task</label>
            <div className="task-input-row">
              <input
                id="task-title"
                name="task-title"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Wire auth flow"
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Add'}
              </button>
            </div>
          </form>

          {error ? <p className="banner error">{error}</p> : null}

          <ul className="task-list">
            {tasks.length ? (
              tasks.map((task) => (
                <li key={task._id}>
                  <span>{task.title}</span>
                  <small>{task.completed ? 'Completed' : 'Open'}</small>
                </li>
              ))
            ) : (
              <li className="empty-state">
                <span>No seeded tasks yet.</span>
                <small>Post your first document through the sample API.</small>
              </li>
            )}
          </ul>
        </article>

        <article className="panel panel-accent">
          <p className="eyebrow">Included structure</p>
          <h2>What this scaffold gives you</h2>

          <div className="feature-stack">
            <div>
              <strong>Client workspace</strong>
              <p>Vite, React, environment-based API configuration, and a proxy for local dev.</p>
            </div>

            <div>
              <strong>Server workspace</strong>
              <p>Express routing, centralized config, a Mongo model, and graceful startup when the DB is absent.</p>
            </div>

            <div>
              <strong>Root orchestration</strong>
              <p>One install, one dev command, and shared workspace scripts through npm workspaces.</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
