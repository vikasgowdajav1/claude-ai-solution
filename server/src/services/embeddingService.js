/**
 * Embedding Service — Text chunking + Ollama embedding generation
 *
 * Uses Ollama's /api/embed endpoint with nomic-embed-text (or configurable model).
 * Chunks text into overlapping segments for meaningful vector representations.
 */

const OLLAMA_BASE_URL = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = () => process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const CHUNK_SIZE = 500;      // ~500 tokens per chunk
const CHUNK_OVERLAP = 50;    // overlap between chunks

/**
 * Split text into overlapping chunks of roughly CHUNK_SIZE words.
 */
export function chunkText(text, { chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP } = {}) {
  if (!text || typeof text !== 'string') return [];

  // Clean up the text
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) return [];

  // Split by sentences first for more natural boundaries
  const sentences = cleaned.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [cleaned];

  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/);
    const sentenceWordCount = sentenceWords.length;

    if (currentWordCount + sentenceWordCount > chunkSize && currentChunk.length > 0) {
      // Save the current chunk
      chunks.push(currentChunk.join(' ').trim());

      // Keep overlap words from the end
      const overlapText = currentChunk.join(' ').split(/\s+/);
      const overlapWords = overlapText.slice(-overlap);
      currentChunk = [overlapWords.join(' ')];
      currentWordCount = overlapWords.length;
    }

    currentChunk.push(sentence.trim());
    currentWordCount += sentenceWordCount;
  }

  if (currentChunk.length > 0) {
    const finalText = currentChunk.join(' ').trim();
    if (finalText) chunks.push(finalText);
  }

  return chunks;
}

/**
 * Generate an embedding vector for a single text using Ollama.
 */
export async function generateEmbedding(text, model) {
  const embeddingModel = model || EMBEDDING_MODEL();

  const resp = await fetch(`${OLLAMA_BASE_URL()}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: embeddingModel,
      input: text
    })
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Ollama embedding error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();

  // Ollama /api/embed returns { embeddings: [[...]] }
  if (data.embeddings && data.embeddings.length > 0) {
    return data.embeddings[0];
  }

  throw new Error('No embedding returned from Ollama');
}

/**
 * Generate embeddings for multiple texts in batch.
 */
export async function generateEmbeddings(texts, model) {
  const embeddingModel = model || EMBEDDING_MODEL();

  // Ollama /api/embed supports batch input
  const resp = await fetch(`${OLLAMA_BASE_URL()}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: embeddingModel,
      input: texts
    })
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Ollama batch embedding error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  return data.embeddings || [];
}

/**
 * Process a document: chunk the text and generate embeddings for each chunk.
 * Returns an array of { content, chunkIndex, embedding, tokenCount }.
 */
export async function processDocumentText(rawText, options = {}) {
  const { chunkSize, overlap, model, pageNumber } = options;

  const textChunks = chunkText(rawText, { chunkSize, overlap });

  if (textChunks.length === 0) {
    return [];
  }

  // Generate embeddings in batch
  const embeddings = await generateEmbeddings(textChunks, model);

  return textChunks.map((content, i) => ({
    content,
    chunkIndex: i,
    pageNumber: pageNumber || null,
    tokenCount: content.split(/\s+/).length,
    embedding: embeddings[i] || []
  }));
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Strip HTML tags from content.
 */
export function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Check if the embedding model is available in Ollama.
 */
export async function isEmbeddingModelReady() {
  try {
    const resp = await fetch(`${OLLAMA_BASE_URL()}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    if (!resp.ok) return false;

    const data = await resp.json();
    const models = (data.models || []).map(m => m.name.split(':')[0]);
    return models.includes(EMBEDDING_MODEL().split(':')[0]);
  } catch {
    return false;
  }
}
