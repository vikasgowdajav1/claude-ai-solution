import express from 'express';
import {
  createPage,
  getAllPages,
  getPageBySlug,
  getPageById,
  updatePage,
  deletePage,
  getPageVersions,
  restoreVersion,
  addComment
} from '../controllers/wikiController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllPages);
router.get('/page/:slug', getPageBySlug);
router.get('/:id', getPageById);

// Protected routes
router.post('/', authenticate, authorize(['editor', 'admin']), createPage);
router.put('/:id', authenticate, updatePage);
router.delete('/:id', authenticate, deletePage);

// Version history routes
router.get('/:id/versions', authenticate, getPageVersions);
router.post('/:id/restore/:versionNumber', authenticate, authorize(['admin']), restoreVersion);

// Comment routes
router.post('/:id/comments', authenticate, addComment);

export default router;
