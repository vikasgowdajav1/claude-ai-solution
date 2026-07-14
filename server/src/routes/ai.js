import { Router } from 'express';
import { askAI, listModels } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/ask', authenticate, askAI);
router.get('/models', authenticate, listModels);

export default router;
