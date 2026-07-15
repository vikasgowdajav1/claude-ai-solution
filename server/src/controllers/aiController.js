import WikiPage from '../models/WikiPage.js';

const OLLAMA_BASE_URL = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || 'llama3.2';
const GROQ_API_KEY = () => process.env.GROQ_API_KEY || '';
const GROQ_MODEL = () => process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const SYSTEM_INSTRUCTION = `You are Cortex — an AI assistant that helps team members find answers from their internal wiki.

Rules:
- Ground your answers in the wiki context provided below.
- If the context doesn't cover the question, say so honestly and suggest what to search for.
- Be concise and use bullet points or short paragraphs.
- When referencing a wiki page, mention its title so the user can look it up.
- Never fabricate information that is not in the provided context.`;

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function getWikiContext(question) {
  const results = await WikiPage.find(
    { $text: { $search: question }, isPublished: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .select('title category content tags')
    .lean();

  if (results.length === 0) {
    const recent = await WikiPage.find({ isPublished: true })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('title category content tags')
      .lean();
    return recent;
  }

  return results;
}

function buildContextBlock(pages) {
  if (!pages.length) return 'No wiki pages found.';

  return pages
    .map((p, i) => {
      const body = stripHtml(p.content).slice(0, 1500);
      return `--- Wiki Page ${i + 1}: "${p.title}" [${p.category}] ---\n${body}`;
    })
    .join('\n\n');
}

// --- Provider: Ollama (local) ---

async function isOllamaReachable() {
  try {
    const resp = await fetch(`${OLLAMA_BASE_URL()}/api/tags`, {
      signal: AbortSignal.timeout(2000)
    });
    return resp.ok;
  } catch {
    return false;
  }
}

const EMBEDDING_ONLY = ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large', 'snowflake-arctic-embed'];

async function askOllama(systemPrompt, userPrompt, model) {
  const chatModel = (model && !EMBEDDING_ONLY.some(e => model.startsWith(e)))
    ? model : OLLAMA_MODEL();

  const resp = await fetch(`${OLLAMA_BASE_URL()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false
    })
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Ollama error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  return data.message?.content || 'No response generated.';
}

// --- Provider: Groq (cloud fallback) ---

async function askGroq(systemPrompt, userPrompt) {
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
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

// --- Route handlers ---

export async function askAI(req, res, next) {
  try {
    const { question, model } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const pages = await getWikiContext(question);
    const contextBlock = buildContextBlock(pages);
    const userPrompt = `## Wiki Context\n${contextBlock}\n\n## User Question\n${question}`;

    let answer;
    let provider;

    const ollamaUp = await isOllamaReachable();

    if (ollamaUp) {
      answer = await askOllama(SYSTEM_INSTRUCTION, userPrompt, model);
      provider = 'ollama';
    } else if (GROQ_API_KEY()) {
      answer = await askGroq(SYSTEM_INSTRUCTION, userPrompt);
      provider = 'groq';
    } else {
      return res.status(503).json({
        success: false,
        message: 'No AI provider available. Start Ollama locally or set GROQ_API_KEY.'
      });
    }

    const sources = pages.map((p) => ({
      title: p.title,
      category: p.category,
      tags: p.tags || []
    }));

    res.json({ success: true, answer, sources, provider });
  } catch (error) {
    console.error('AI ask error:', error);
    next(error);
  }
}

export async function listModels(req, res) {
  const result = { ollama: null, groq: null };

  try {
    const resp = await fetch(`${OLLAMA_BASE_URL()}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });

    if (resp.ok) {
      const data = await resp.json();
      const EMBEDDING_MODELS = ['nomic-embed-text', 'all-minilm', 'mxbai-embed-large', 'snowflake-arctic-embed'];
      result.ollama = {
        available: true,
        models: (data.models || [])
          .filter((m) => !EMBEDDING_MODELS.some(e => m.name.startsWith(e)))
          .map((m) => ({
            name: m.name,
            size: m.size,
            modified: m.modified_at
          }))
      };
    }
  } catch {
    result.ollama = { available: false, models: [] };
  }

  result.groq = {
    available: !!GROQ_API_KEY(),
    models: GROQ_API_KEY() ? [{ name: GROQ_MODEL() }] : []
  };

  res.json({ success: true, ...result });
}
