import { Router } from 'express';
import { listApprovals, getApproval, reviewApproval, getPendingCount } from '../controllers/approvalController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/pending/count', authenticate, getPendingCount);
router.get('/', authenticate, listApprovals);
router.get('/:id', authenticate, getApproval);
router.patch('/:id/review', authenticate, reviewApproval);

export default router;
