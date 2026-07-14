/**
 * Agent Controller — Research pipeline & task management
 */

import ResearchTask from '../models/ResearchTask.js';
import { createAndRunResearch, runAgentPipeline } from '../services/agentService.js';
import { searchExternal } from '../services/searchService.js';

/**
 * POST /api/agents/research — Start a research pipeline
 */
export async function startResearch(req, res, next) {
  try {
    const { query, searchWeb, searchRss, searchKnowledgeBase, requireApproval } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ success: false, message: 'Research query is required' });
    }

    const task = await createAndRunResearch(query, req.user.id, {
      searchWeb,
      searchRss,
      searchKnowledgeBase,
      requireApproval
    });

    res.status(201).json({
      success: true,
      task: {
        _id: task._id,
        query: task.query,
        status: task.status,
        settings: task.settings,
        createdAt: task.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/agents/tasks — List research tasks
 */
export async function listTasks(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    // Only show own tasks unless admin
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user.id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      ResearchTask.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      ResearchTask.countDocuments(filter)
    ]);

    res.json({ success: true, tasks, total });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/agents/tasks/:id — Get task details with pipeline status
 */
export async function getTask(req, res, next) {
  try {
    const task = await ResearchTask.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('pipeline.publisher.approvalId')
      .lean();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/agents/tasks/:id/retry — Retry a failed task from the beginning
 */
export async function retryTask(req, res, next) {
  try {
    const task = await ResearchTask.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (!['failed'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot retry — task is "${task.status}". Only failed tasks can be retried.`
      });
    }

    // Reset pipeline
    task.status = 'queued';
    task.pipeline.researcher = { status: 'pending' };
    task.pipeline.analyst = { status: 'pending', analysis: '' };
    task.pipeline.publisher = { status: 'pending', output: '' };
    await task.save();

    // Run in background
    runAgentPipeline(task._id).catch(err => {
      console.error(`Retry pipeline failed for task ${task._id}:`, err.message);
    });

    res.json({ success: true, message: 'Task queued for retry', task: { _id: task._id, status: task.status } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/agents/search/external — Quick web + RSS search (no pipeline)
 */
export async function quickExternalSearch(req, res, next) {
  try {
    const { query, searchWeb = true, searchRss = true } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const results = await searchExternal(query, { searchWeb, searchRss });
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
}
