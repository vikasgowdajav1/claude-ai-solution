import { Router } from 'express';
import { getDatabaseStatus } from '../config/db.js';
import { Task } from '../models/task.model.js';

const router = Router();

function assertDatabaseReady() {
  const database = getDatabaseStatus();

  if (!database.connected) {
    const error = new Error('MongoDB is not connected yet. Start MongoDB and retry.');
    error.statusCode = 503;
    throw error;
  }
}

router.get('/', async (_request, response, next) => {
  try {
    assertDatabaseReady();

    const items = await Task.find().sort({ createdAt: -1 }).limit(20).lean();
    response.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    assertDatabaseReady();

    const title = request.body.title?.trim();

    if (!title) {
      const error = new Error('Task title is required.');
      error.statusCode = 400;
      throw error;
    }

    const task = await Task.create({ title });
    response.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

export default router;
