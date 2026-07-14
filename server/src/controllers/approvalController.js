/**
 * Approval Controller — Human-in-the-loop approval workflow
 */

import ApprovalRequest from '../models/ApprovalRequest.js';
import ResearchTask from '../models/ResearchTask.js';

/**
 * GET /api/approvals — List approval requests
 */
export async function listApprovals(req, res, next) {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [approvals, total] = await Promise.all([
      ApprovalRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('submittedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .lean(),
      ApprovalRequest.countDocuments(filter)
    ]);

    const pendingCount = await ApprovalRequest.countDocuments({ status: 'pending' });

    res.json({ success: true, approvals, total, pendingCount });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/approvals/:id — Get approval details
 */
export async function getApproval(req, res, next) {
  try {
    const approval = await ApprovalRequest.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });

    res.json({ success: true, approval });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/approvals/:id/review — Approve or reject
 */
export async function reviewApproval(req, res, next) {
  try {
    const { action, note } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approved" or "rejected"' });
    }

    const approval = await ApprovalRequest.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'Approval not found' });

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Already ${approval.status}` });
    }

    approval.status = action;
    approval.reviewedBy = req.user.id;
    approval.reviewNote = note || '';
    approval.reviewedAt = new Date();
    await approval.save();

    // If this was a research task approval, update the task status
    if (approval.type === 'research' && approval.payload?.taskId) {
      const task = await ResearchTask.findById(approval.payload.taskId);
      if (task) {
        task.status = action === 'approved' ? 'completed' : 'failed';
        await task.save();
      }
    }

    res.json({ success: true, approval });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/approvals/pending/count — Quick count of pending approvals
 */
export async function getPendingCount(req, res, next) {
  try {
    const count = await ApprovalRequest.countDocuments({ status: 'pending' });
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
}
