import { Router } from 'express';
import { startResearch, listTasks, getTask, retryTask, quickExternalSearch } from '../controllers/agentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/research', authenticate, startResearch);
router.get('/tasks', authenticate, listTasks);
router.get('/tasks/:id', authenticate, getTask);
router.post('/tasks/:id/retry', authenticate, retryTask);
router.post('/search/external', authenticate, quickExternalSearch);

export default router;
