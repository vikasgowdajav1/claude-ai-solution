import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../utils/api';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

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
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading page...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {id ? '✏️ Edit Page' : '➕ Create New Page'}
        </h1>
        <div className="w-20" /> {/* Spacer for alignment */}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-lg shadow p-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Page Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Auto-generated from content (you can edit)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., docker, kubernetes, devops"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Change Description (for updates) */}
        {id && (
          <div className="bg-white rounded-lg shadow p-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Change Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleChange}
              placeholder="What changed? (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Content Editor */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content (Markdown)
          </label>
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

        {/* Action Buttons */}
        <div className="flex space-x-4 justify-end">
          <Link
            to="/"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Page'}</span>
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">💡 Editor Tips</h3>
        <ul className="text-blue-800 text-sm space-y-2">
          <li>✓ Use the toolbar buttons to format text</li>
          <li>✓ Add links and images easily</li>
          <li>✓ Use code blocks for technical content</li>
          <li>✓ Tags help others find your page</li>
          <li>✓ Change descriptions track what you updated</li>
        </ul>
      </div>
    </div>
  );
}
