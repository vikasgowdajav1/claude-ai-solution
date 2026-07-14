import { Router } from 'express';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  reprocessDocument,
  getStats,
  reembedAll,
  upload
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, getStats);
router.get('/', authenticate, listDocuments);
router.get('/:id', authenticate, getDocument);
router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.post('/reembed', authenticate, reembedAll);
router.post('/:id/reprocess', authenticate, reprocessDocument);
router.delete('/:id', authenticate, deleteDocument);

export default router;
