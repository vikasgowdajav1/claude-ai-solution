import { Router } from 'express';
import {
  createTrail,
  listTrails,
  getTrail,
  updateTrail,
  recordAttempt,
  getRecommendation
} from '../controllers/sherpaController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/trails', authenticate, listTrails);
router.post('/trails', authenticate, createTrail);
router.get('/trails/:slug', authenticate, getTrail);
router.put('/trails/:slug', authenticate, updateTrail);
router.post('/trails/:slug/record', authenticate, recordAttempt);
router.get('/trails/:slug/recommend', authenticate, getRecommendation);

export default router;
