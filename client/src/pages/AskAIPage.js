import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiCpu, FiUser, FiBookOpen, FiTag, FiLoader, FiServer, FiCloud, FiDatabase, FiFile, FiGlobe, FiZap } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';

const SUGGESTED_QUESTIONS = [
  'What is the deployment flow?',
  'How does authentication work?',
  'What are the key infrastructure components?',
  'Check for critical dependency updates',
  'What security practices are in place?'
];

function toSlug(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AskAIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState({ ollama: null, gemini: null });
  const [selectedModel, setSelectedModel] = useState('');
  const [useRAG, setUseRAG] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/ai/models').then(({ data }) => {
      setModels({ ollama: data.ollama, gemini: data.gemini });
      if (data.ollama?.available && data.ollama.models.length > 0) {
        setSelectedModel(data.ollama.models[0].name);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (question) => {
    const trimmed = (question || input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const endpoint = useRAG ? '/rag/ask' : '/ai/ask';
      const { data } = await api.post(endpoint, { question: trimmed, model: selectedModel });
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.answer,
          sources: data.sources || [],
          provider: data.provider,
          resultCount: data.resultCount
        }
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'ai', text: msg, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <FiCpu className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Ask AI</h1>
              <p className="text-sm text-slate-500">
                RAG-powered answers from your project knowledge base
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseRAG(!useRAG)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                useRAG
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title={useRAG ? 'RAG mode: searches documents + wiki with embeddings' : 'Basic mode: wiki text search only'}
            >
              <FiZap className="h-3 w-3" />
              {useRAG ? 'RAG On' : 'RAG Off'}
            </button>
            {models.ollama?.available && models.ollama.models.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-violet-400 focus:outline-none"
              >
                {models.ollama.models.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {models.ollama?.available
                ? <><FiServer className="h-3 w-3 text-green-500" /> Ollama</>
                : models.gemini?.available
                ? <><FiCloud className="h-3 w-3 text-blue-500" /> Gemini</>
                : <><FiCpu className="h-3 w-3 text-slate-400" /> No provider</>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-xl pt-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <FiCpu className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">
              What do you want to know?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              I'll search your wiki and answer based on your team's documented knowledge.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'ai' && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <FiCpu className="h-4 w-4" />
                </span>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : msg.error
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-slate-200 bg-white text-slate-800'
                }`}
              >
                {msg.role === 'ai' ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-code:text-violet-700">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}

                {msg.sources?.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
                      <FiBookOpen className="h-3 w-3" /> Sources ({msg.sources.length})
                      {msg.resultCount && (
                        <span className="ml-1 text-[10px] text-slate-400">
                          from {msg.resultCount} results
                        </span>
                      )}
                      {msg.provider && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                          {msg.provider === 'ollama' ? <FiServer className="h-2.5 w-2.5" /> : <FiCloud className="h-2.5 w-2.5" />}
                          {msg.provider}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, j) => (
                        <Link
                          key={j}
                          to={s.source === 'wiki' ? `/page/${toSlug(s.title)}` : '#'}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-violet-100 hover:text-violet-700"
                        >
                          {s.source === 'document' ? <FiFile className="h-3 w-3" /> : <FiTag className="h-3 w-3" />}
                          {s.title}
                          {s.score && <span className="text-[10px] text-slate-400">({(s.score * 100).toFixed(0)}%)</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                  <FiUser className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <FiCpu className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <FiLoader className="h-4 w-4 animate-spin" />
                Searching wiki and thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your project…"
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            <FiSend className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
