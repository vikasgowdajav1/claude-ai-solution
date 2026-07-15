/**
 * RAG Controller — Enhanced AI Q&A with vector search
 */

import { ragSearch, buildRAGContext } from '../services/vectorStoreService.js';

const OLLAMA_BASE_URL = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || 'llama3.2';
const GROQ_API_KEY = () => process.env.GROQ_API_KEY || '';
const GROQ_MODEL = () => process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const RAG_SYSTEM = `You are Cortex — an AI assistant powered by RAG (Retrieval-Augmented Generation).

You have access to:
1. Internal wiki pages
2. Uploaded documents (PDFs, text files) from the knowledge base
3. Sherpa trails — verified step-by-step paths that real team members have completed successfully
4. Web search results and RSS feed data

Rules:
- Ground your answers in the provided context from all sources
- When trail data is available, provide ACTUAL COMMANDS the user can run
- Mention success rates and platform-specific notes from trail records
- If someone failed at a step, warn about that specific issue
- Clearly distinguish between internal knowledge, trails, and external sources
- If the context doesn't cover the question, say so and suggest what to search for
- Be concise and use bullet points
- Flag any critical updates, dependency issues, or corner cases
- Never fabricate information not in the provided context`;

const EMBEDDING_MODELS = ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large', 'snowflake-arctic-embed'];

async function callOllama(systemPrompt, userPrompt, model) {
  const chatModel = (model && !EMBEDDING_MODELS.some(e => model.startsWith(e)))
    ? model : OLLAMA_MODEL();

  const resp = await fetch(`${OLLAMA_BASE_URL()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt.slice(0, 5000) }
      ],
      stream: false,
      options: { temperature: 0.4, num_predict: 600 }
    }),
    signal: AbortSignal.timeout(90000)
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Ollama error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  return { answer: data.message?.content || '', provider: 'ollama' };
}

async function callGroq(systemPrompt, userPrompt) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY()}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt.slice(0, 5000) }
      ],
      temperature: 0.4,
      max_tokens: 600
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Groq error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  return { answer: data.choices?.[0]?.message?.content || '', provider: 'groq' };
}

async function callLLM(systemPrompt, userPrompt, model) {
  // Try Ollama first (local, free)
  try {
    const ollamaCheck = await fetch(`${OLLAMA_BASE_URL()}/api/tags`, {
      signal: AbortSignal.timeout(2000)
    });
    if (ollamaCheck.ok) {
      return await callOllama(systemPrompt, userPrompt, model);
    }
  } catch { /* Ollama not available */ }

  // Fallback to Groq (cloud, fast)
  if (GROQ_API_KEY()) {
    return await callGroq(systemPrompt, userPrompt);
  }

  throw new Error('No AI provider available. Start Ollama locally or set GROQ_API_KEY.');
}

/**
 * POST /api/rag/ask — RAG-powered question answering
 */
export async function ragAsk(req, res, next) {
  try {
    const { question, model, category } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Search knowledge base + wiki
    const results = await ragSearch(question, { topK: 8, category });
    const context = buildRAGContext(results);

    const userPrompt = `## Retrieved Context\n${context}\n\n## User Question\n${question}`;

    const { answer, provider } = await callLLM(RAG_SYSTEM, userPrompt, model);

    const sources = results.map(r => ({
      title: r.title,
      category: r.category,
      source: r.source,
      score: r.score,
      tags: r.tags || []
    }));

    res.json({ success: true, answer, sources, provider, resultCount: results.length });
  } catch (error) {
    console.error('RAG ask error:', error);
    next(error);
  }
}

/**
 * POST /api/rag/search — Search the vector store without LLM
 */
export async function ragSearchEndpoint(req, res, next) {
  try {
    const { query, topK = 10, category } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const results = await ragSearch(query, { topK, category });
    res.json({ success: true, results });
  } catch (error) {
    console.error('RAG search error:', error);
    next(error);
  }
}
