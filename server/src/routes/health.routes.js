import { Router } from 'express';
import { getDatabaseStatus } from '../config/db.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/', (_request, response) => {
  response.json({
    status: 'ok',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
  });
});

export default router;
