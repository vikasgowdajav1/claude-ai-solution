import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../utils/api';
import {
  FiArrowLeft,
  FiBookOpen,
  FiEdit3,
  FiInfo,
  FiLayers,
  FiPlus,
  FiSave,
  FiTag,
} from 'react-icons/fi';

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

const getAutoTitleFromContent = (htmlContent) => {
  const plainText = String(htmlContent || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    return '';
  }

  return plainText.split(' ').slice(0, 8).join(' ');
};

export default function WikiEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'application',
    tags: '',
    description: ''
  });

  useEffect(() => {
    if (id) {
      const fetchPage = async () => {
        try {
          const response = await api.get(`/wiki/${id}`);
          setFormData({
            title: response.data.page.title,
            content: response.data.page.content,
            category: response.data.page.category,
            tags: response.data.page.tags.join(', '),
            description: ''
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load page');
        } finally {
          setLoading(false);
        }
      };

      fetchPage();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'title') {
      setIsTitleManuallyEdited(true);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (value) => {
    setFormData((prev) => {
      const shouldAutoGenerateTitle = !id && !isTitleManuallyEdited;
      const autoTitle = shouldAutoGenerateTitle ? getAutoTitleFromContent(value) : prev.title;

      return {
      ...prev,
      content: value,
      title: shouldAutoGenerateTitle ? autoTitle : prev.title
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const generatedTitle = formData.title.trim() || getAutoTitleFromContent(formData.content);

    if (!generatedTitle.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: generatedTitle,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        changeDescription: formData.description
      };

      if (id) {
        // Update existing page
        const response = await api.put(`/wiki/${id}`, payload);
        navigate(`/page/${response.data.page.slug}`);
      } else {
        // Create new page
        const response = await api.post('/wiki', payload);
        navigate(`/page/${response.data.page.slug}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-500 shadow-sm shadow-slate-200/60">
          Loading page...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 px-6 py-8 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_30%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              {id ? <FiEdit3 className="h-3.5 w-3.5" /> : <FiPlus className="h-3.5 w-3.5" />}
              <span>Knowledge contribution</span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              {id ? 'Edit page' : 'Create new page'}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Capture architecture notes, operational runbooks, troubleshooting guidance, and
              project decisions in a format the whole team can search and reuse.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 lg:min-w-[320px] lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Entry mode
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {id ? 'Update existing context' : 'Create fresh knowledge'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Best practice
              </p>
              <p className="mt-2 text-lg font-semibold text-white">Write for the next teammate</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <FiBookOpen className="h-5 w-5" />
                </span>
                <div>
                  <label htmlFor="title" className="block text-lg font-semibold text-slate-900">
                    Page Title
                  </label>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep it specific. If you leave it blank, the editor will draft a title from the
                    first line of content until you rename it.
                  </p>
                </div>
              </div>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Auto-generated from content (you can edit)"
                className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <FiEdit3 className="h-5 w-5" />
                </span>
                <div>
                  <label className="block text-lg font-semibold text-slate-900">
                    Content
                  </label>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Write the context another engineer would need to answer questions without a
                    handoff call.
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
                <ReactQuill
                  value={formData.content}
                  onChange={handleContentChange}
                  theme="snow"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      ['blockquote', 'code-block'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                  placeholder="Write your content here..."
                  style={{ height: '400px', marginBottom: '40px' }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <FiLayers className="h-5 w-5" />
                </span>
                <div>
                  <label htmlFor="category" className="block text-lg font-semibold text-slate-900">
                    Category
                  </label>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Choose the domain teammates will search when they need this answer.
                  </p>
                </div>
              </div>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                  <FiTag className="h-5 w-5" />
                </span>
                <div>
                  <label htmlFor="tags" className="block text-lg font-semibold text-slate-900">
                    Tags
                  </label>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Add concise keywords so related searches can find this page faster.
                  </p>
                </div>
              </div>

              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., docker, kubernetes, devops"
                className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            {id && (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                    <FiInfo className="h-5 w-5" />
                  </span>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-lg font-semibold text-slate-900"
                    >
                      Change Description
                    </label>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Summarize what changed so later reviewers understand the update quickly.
                    </p>
                  </div>
                </div>

                <input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What changed? (optional)"
                  className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <FiInfo className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Editor tips</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Focus on clarity, searchable phrasing, and enough context for someone new to the project.
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                {[
                  'Use headings to separate setup, decisions, and troubleshooting steps.',
                  'Add links and code blocks when a future reader needs exact commands.',
                  'Use tags for technologies, services, or incident names people will search for.',
                  'If you are editing, explain what changed and why in the update note.',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Page'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
