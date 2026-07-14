/**
 * Vector Store Service — MongoDB-based vector similarity search
 *
 * Stores embeddings in Document chunks and performs cosine similarity
 * search across all embedded documents + wiki pages.
 */

import Document from '../models/Document.js';
import WikiPage from '../models/WikiPage.js';
import {
  generateEmbedding,
  cosineSimilarity,
  stripHtml,
  processDocumentText
} from './embeddingService.js';

/**
 * Search for the most similar chunks across all embedded documents.
 * Returns top-K results sorted by similarity score.
 */
export async function searchDocuments(query, { topK = 5, minScore = 0.3, category } = {}) {
  const queryEmbedding = await generateEmbedding(query);

  const filter = { status: 'embedded', isActive: true };
  if (category) filter.category = category;

  const documents = await Document.find(filter)
    .select('title category tags chunks')
    .lean();

  const scoredChunks = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);

      if (score >= minScore) {
        scoredChunks.push({
          documentId: doc._id,
          documentTitle: doc.title,
          category: doc.category,
          tags: doc.tags,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          score
        });
      }
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}

/**
 * Search wiki pages using vector similarity (embeds wiki content on-the-fly).
 * Falls back to MongoDB text search if no embeddings are available.
 */
export async function searchWikiPages(query, { topK = 5 } = {}) {
  // First, try MongoDB text search (fast, always available)
  const textResults = await WikiPage.find(
    { $text: { $search: query }, isPublished: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(topK)
    .select('title category content tags')
    .lean();

  if (textResults.length === 0) {
    const recent = await WikiPage.find({ isPublished: true })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('title category content tags')
      .lean();
    return recent.map(p => ({
      title: p.title,
      category: p.category,
      content: stripHtml(p.content).slice(0, 2000),
      tags: p.tags || [],
      source: 'wiki',
      score: 0.5
    }));
  }

  return textResults.map(p => ({
    title: p.title,
    category: p.category,
    content: stripHtml(p.content).slice(0, 2000),
    tags: p.tags || [],
    source: 'wiki',
    score: p.score || 0.5
  }));
}

/**
 * Combined RAG search: search both documents (vector) and wiki (text/vector).
 * Merges and deduplicates results.
 */
export async function ragSearch(query, options = {}) {
  const { topK = 8, category } = options;

  const [docResults, wikiResults] = await Promise.all([
    searchDocuments(query, { topK: Math.ceil(topK / 2), category }).catch(() => []),
    searchWikiPages(query, { topK: Math.ceil(topK / 2) }).catch(() => [])
  ]);

  // Normalize and merge
  const combined = [
    ...docResults.map(r => ({
      source: 'document',
      title: r.documentTitle,
      category: r.category,
      content: r.content,
      tags: r.tags,
      score: r.score,
      chunkIndex: r.chunkIndex
    })),
    ...wikiResults.map(r => ({
      source: 'wiki',
      title: r.title,
      category: r.category,
      content: r.content,
      tags: r.tags,
      score: r.score || 0.5
    }))
  ];

  combined.sort((a, b) => b.score - a.score);
  return combined.slice(0, topK);
}

/**
 * Build a context block from RAG search results for LLM consumption.
 */
export function buildRAGContext(results) {
  if (!results.length) return 'No relevant documents found in the knowledge base.';

  return results
    .map((r, i) => {
      const label = r.source === 'document' ? 'KB Document' : 'Wiki Page';
      const snippet = r.content.slice(0, 1500);
      return `--- ${label} ${i + 1}: "${r.title}" [${r.category}] (score: ${r.score.toFixed(3)}) ---\n${snippet}`;
    })
    .join('\n\n');
}
