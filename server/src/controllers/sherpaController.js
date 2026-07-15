/**
 * Sherpa Controller — Guided trail management & path verification
 */

import Trail from '../models/Trail.js';

function toSlug(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * POST /api/sherpa/trails — Create a new trail
 */
export async function createTrail(req, res, next) {
  try {
    const { title, description, category, targetRoles, platforms, steps, prerequisites, tags } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Trail title is required' });
    }

    const trail = await Trail.create({
      title,
      slug: toSlug(title),
      description,
      category: category || 'setup',
      targetRoles: targetRoles || ['developer'],
      platforms: platforms || ['windows', 'mac', 'linux'],
      steps: steps || [],
      prerequisites: prerequisites || [],
      tags: tags || [],
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, trail });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sherpa/trails — List all trails
 */
export async function listTrails(req, res, next) {
  try {
    const { category, role, platform } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (role) filter.targetRoles = role;
    if (platform) filter.platforms = platform;

    const trails = await Trail.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean({ virtuals: true });

    res.json({ success: true, trails });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sherpa/trails/:slug — Get trail details with steps
 */
export async function getTrail(req, res, next) {
  try {
    const trail = await Trail.findOne({ slug: req.params.slug })
      .populate('createdBy', 'name email')
      .populate('records.user', 'name email');

    if (!trail) return res.status(404).json({ success: false, message: 'Trail not found' });

    // Compute path stats per step
    const stepStats = trail.steps.map(step => {
      const attempts = trail.records.filter(r => r.completedSteps.includes(step.order));
      const failures = trail.records.filter(r => r.failedAt === step.order);
      return {
        order: step.order,
        successCount: attempts.length,
        failCount: failures.length,
        failRate: trail.records.length > 0
          ? Math.round((failures.length / trail.records.length) * 100)
          : 0
      };
    });

    res.json({ success: true, trail: trail.toJSON(), stepStats });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/sherpa/trails/:slug — Update a trail
 */
export async function updateTrail(req, res, next) {
  try {
    const trail = await Trail.findOne({ slug: req.params.slug });
    if (!trail) return res.status(404).json({ success: false, message: 'Trail not found' });

    const { title, description, category, targetRoles, platforms, steps, prerequisites, tags } = req.body;

    if (title) { trail.title = title; trail.slug = toSlug(title); }
    if (description !== undefined) trail.description = description;
    if (category) trail.category = category;
    if (targetRoles) trail.targetRoles = targetRoles;
    if (platforms) trail.platforms = platforms;
    if (steps) trail.steps = steps;
    if (prerequisites) trail.prerequisites = prerequisites;
    if (tags) trail.tags = tags;

    await trail.save();
    res.json({ success: true, trail });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/sherpa/trails/:slug/record — Record a trail attempt (success/failure)
 */
export async function recordAttempt(req, res, next) {
  try {
    const trail = await Trail.findOne({ slug: req.params.slug });
    if (!trail) return res.status(404).json({ success: false, message: 'Trail not found' });

    const { role, platform, completedSteps, failedAt, failReason, success, duration, notes } = req.body;

    trail.records.push({
      user: req.user.id,
      role: role || 'developer',
      platform: platform || 'windows',
      completedSteps: completedSteps || [],
      failedAt: failedAt || null,
      failReason: failReason || '',
      success: success || false,
      duration: duration || null,
      notes: notes || ''
    });

    await trail.save();
    res.json({ success: true, message: success ? 'Path verified!' : 'Attempt recorded' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sherpa/trails/:slug/recommend — AI-powered recommendation for next step
 */
export async function getRecommendation(req, res, next) {
  try {
    const trail = await Trail.findOne({ slug: req.params.slug });
    if (!trail) return res.status(404).json({ success: false, message: 'Trail not found' });

    const { platform, role, currentStep } = req.query;

    // Find the most successful path for this platform+role combo
    const relevantRecords = trail.records.filter(r =>
      r.success &&
      r.platform === (platform || 'windows') &&
      (role ? r.role === role : true)
    );

    const commonFailures = trail.records
      .filter(r => !r.success && r.platform === (platform || 'windows'))
      .map(r => ({ step: r.failedAt, reason: r.failReason }))
      .filter(r => r.step);

    // Find which step fails most
    const stepFailCounts = {};
    commonFailures.forEach(f => {
      stepFailCounts[f.step] = (stepFailCounts[f.step] || 0) + 1;
    });

    const riskySteps = Object.entries(stepFailCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([step, count]) => ({
        step: parseInt(step),
        failCount: count,
        commonReasons: commonFailures.filter(f => f.step === parseInt(step)).map(f => f.reason).filter(Boolean)
      }));

    res.json({
      success: true,
      verifiedPaths: relevantRecords.length,
      totalAttempts: trail.records.length,
      riskySteps,
      recommendation: relevantRecords.length > 0
        ? `${relevantRecords.length} people successfully completed this trail on ${platform}. Follow the verified path.`
        : `No verified paths for ${platform} yet. You'll be the first — report any issues.`
    });
  } catch (error) {
    next(error);
  }
}
