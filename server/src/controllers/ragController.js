/**
 * RAG Controller — Enhanced AI Q&A with vector search
 */

import { ragSearch, buildRAGContext } from '../services/vectorStoreService.js';

const OLLAMA_BASE_URL = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || 'llama3.2';

const RAG_SYSTEM = `You are the Project Knowledge Assistant — an AI powered by RAG (Retrieval-Augmented Generation).

You have access to:
1. Internal wiki pages
2. Uploaded documents (PDFs, text files) from the knowledge base
3. Web search results and RSS feed data

Rules:
- Ground your answers in the provided context from all sources
- Clearly distinguish between internal knowledge and external sources
- If the context doesn't cover the question, say so and suggest what to search for
- Be concise and use bullet points or short paragraphs
- When referencing a source, mention its title and type (wiki/document/web)
- Flag any critical updates, dependency issues, or security concerns you notice
- Never fabricate information not in the provided context`;

async function callLLM(systemPrompt, userPrompt, model) {
  // Use Ollama only — no cloud API keys needed
  const resp = await fetch(`${OLLAMA_BASE_URL()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || OLLAMA_MODEL(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt.slice(0, 5000) }
      ],
      stream: false,
      options: {
        temperature: 0.4,
        num_predict: 600
      }
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
