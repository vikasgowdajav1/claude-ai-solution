import { Router } from 'express';
import { ragAsk, ragSearchEndpoint } from '../controllers/ragController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/ask', authenticate, ragAsk);
router.post('/search', authenticate, ragSearchEndpoint);

export default router;
