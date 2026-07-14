/**
 * Document Service — PDF processing, knowledge base management
 */

import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import Document from '../models/Document.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { processDocumentText, isEmbeddingModelReady } from './embeddingService.js';

/**
 * Extract text from a PDF file buffer.
 */
export async function extractPdfText(filePath) {
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);
  return {
    text: data.text || '',
    numPages: data.numpages || 0,
    info: data.info || {}
  };
}

/**
 * Process and embed a document that was uploaded.
 * Updates the document status and stores chunks with embeddings.
 */
export async function processDocument(documentId) {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error('Document not found');

  try {
    doc.status = 'processing';
    await doc.save();

    // Extract text based on file type
    let rawText = '';

    if (doc.mimeType === 'application/pdf') {
      const pdfData = await extractPdfText(doc.filePath);
      rawText = pdfData.text;
    } else if (doc.mimeType.startsWith('text/')) {
      rawText = await readFile(doc.filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file type: ${doc.mimeType}`);
    }

    if (!rawText.trim()) {
      throw new Error('No text content extracted from document');
    }

    doc.rawText = rawText;

    // Check if embedding model is available
    const modelReady = await isEmbeddingModelReady();

    if (modelReady) {
      // Chunk and embed
      const chunks = await processDocumentText(rawText);
      doc.chunks = chunks;
      doc.embeddingDimension = chunks[0]?.embedding?.length || 768;
      doc.status = 'embedded';
    } else {
      // Store raw text only, mark as uploaded (can embed later)
      doc.status = 'uploaded';
      doc.processingError = 'Embedding model not available. Text extracted but not embedded.';
    }

    await doc.save();
    return doc;
  } catch (error) {
    doc.status = 'failed';
    doc.processingError = error.message;
    await doc.save();
    throw error;
  }
}

/**
 * Re-embed all documents that are in 'uploaded' status (text extracted but not embedded).
 */
export async function reembedDocuments() {
  const docs = await Document.find({ status: 'uploaded', rawText: { $ne: '' } });
  const results = { success: 0, failed: 0 };

  for (const doc of docs) {
    try {
      const chunks = await processDocumentText(doc.rawText);
      doc.chunks = chunks;
      doc.embeddingDimension = chunks[0]?.embedding?.length || 768;
      doc.status = 'embedded';
      doc.processingError = undefined;
      await doc.save();
      results.success++;
    } catch (err) {
      doc.processingError = err.message;
      await doc.save();
      results.failed++;
    }
  }

  return results;
}

/**
 * Get knowledge base statistics.
 */
export async function getKnowledgeBaseStats() {
  const [total, embedded, processing, failed] = await Promise.all([
    Document.countDocuments({ isActive: true }),
    Document.countDocuments({ status: 'embedded', isActive: true }),
    Document.countDocuments({ status: 'processing', isActive: true }),
    Document.countDocuments({ status: 'failed', isActive: true })
  ]);

  const totalChunks = await Document.aggregate([
    { $match: { status: 'embedded', isActive: true } },
    { $project: { chunkCount: { $size: '$chunks' } } },
    { $group: { _id: null, total: { $sum: '$chunkCount' } } }
  ]);

  const categories = await Document.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return {
    documents: { total, embedded, processing, failed },
    totalChunks: totalChunks[0]?.total || 0,
    categories
  };
}
