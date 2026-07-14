/**
 * Document Controller — PDF upload, knowledge base management
 */

import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import Document from '../models/Document.js';
import { processDocument, reembedDocuments, getKnowledgeBaseStats } from '../services/documentService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const safeName = `${uuidv4()}.${ext}`;
    cb(null, safeName);
  }
});

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, TXT, MD, CSV`));
  }
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

/**
 * POST /api/documents/upload — Upload a document to the knowledge base
 */
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, category, tags } = req.body;

    // Duplicate check: same original filename AND same file size
    const duplicate = await Document.findOne({
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      isActive: true
    }).lean();

    if (duplicate) {
      // Remove the uploaded file since we're rejecting it
      await unlink(req.file.path).catch(() => {});
      return res.status(409).json({
        success: false,
        message: `Duplicate document: "${duplicate.title}" (${req.file.originalname}, ${(req.file.size / 1024).toFixed(1)} KB) already exists in the knowledge base.`
      });
    }

    const doc = await Document.create({
      title: title || req.file.originalname,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      category: category || 'other',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      uploadedBy: req.user.id
    });

    // Process in background
    processDocument(doc._id).catch(err => {
      console.error(`Document processing failed for ${doc._id}:`, err.message);
    });

    res.status(201).json({
      success: true,
      document: {
        _id: doc._id,
        title: doc.title,
        status: doc.status,
        originalFilename: doc.originalFilename,
        fileSize: doc.fileSize,
        category: doc.category
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents — List all documents
 */
export async function listDocuments(req, res, next) {
  try {
    const { category, status, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [docs, total] = await Promise.all([
      Document.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-chunks -rawText')
        .populate('uploadedBy', 'name email')
        .lean(),
      Document.countDocuments(filter)
    ]);

    res.json({ success: true, documents: docs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents/:id — Get document details
 */
export async function getDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id)
      .select('-chunks.embedding')
      .populate('uploadedBy', 'name email')
      .lean();

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/documents/:id — Soft delete a document
 */
export async function deleteDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    doc.isActive = false;
    await doc.save();

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/documents/:id/reprocess — Re-process and re-embed a document
 */
export async function reprocessDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Reset and reprocess
    doc.status = 'uploaded';
    doc.chunks = [];
    doc.processingError = undefined;
    await doc.save();

    processDocument(doc._id).catch(err => {
      console.error(`Document reprocessing failed for ${doc._id}:`, err.message);
    });

    res.json({ success: true, message: 'Document queued for reprocessing' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents/stats — Knowledge base statistics
 */
export async function getStats(req, res, next) {
  try {
    const stats = await getKnowledgeBaseStats();
    res.json({ success: true, ...stats });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/documents/reembed — Re-embed all unembedded documents
 */
export async function reembedAll(req, res, next) {
  try {
    const results = await reembedDocuments();
    res.json({ success: true, ...results });
  } catch (error) {
    next(error);
  }
}
