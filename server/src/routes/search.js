import express from 'express';
import WikiPage from '../models/WikiPage.js';

const router = express.Router();

// Full-text search
router.get('/', async (req, res, next) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let query = WikiPage.find(
      { $text: { $search: q }, isPublished: true },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    if (type === 'title') {
      query = WikiPage.find(
        { title: { $regex: q, $options: 'i' }, isPublished: true }
      );
    } else if (type === 'tags') {
      query = WikiPage.find(
        { tags: { $regex: q, $options: 'i' }, isPublished: true }
      );
    }

    const results = await query
      .select('title slug category tags content updatedAt viewCount')
      .populate('author', 'name')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      query: q,
      results: results || [],
      total: results.length
    });
  } catch (error) {
    next(error);
  }
});

// Get recent pages
router.get('/recent/pages', async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const pages = await WikiPage.find({ isPublished: true })
      .select('title slug category updatedAt')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      pages
    });
  } catch (error) {
    next(error);
  }
});

// Get pages by category
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const pages = await WikiPage.find({ category, isPublished: true })
      .select('title slug category tags content updatedAt viewCount')
      .populate('author', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WikiPage.countDocuments({ category, isPublished: true });

    res.status(200).json({
      success: true,
      pages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
