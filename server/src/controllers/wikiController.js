import WikiPage from '../models/WikiPage.js';
import User from '../models/User.js';

export const createPage = async (req, res, next) => {
  try {
    const { title, content, category, tags, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Check if page already exists
    const existingPage = await WikiPage.findOne({ title });
    if (existingPage) {
      return res.status(409).json({
        success: false,
        message: 'Wiki page with this title already exists'
      });
    }

    const newPage = new WikiPage({
      title,
      content,
      category: category || 'other',
      tags: tags || [],
      author: req.user.id,
      lastEditedBy: req.user.id,
      isPinned: isPinned || false
    });

    await newPage.save();
    await newPage.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Wiki page created successfully',
      page: newPage
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPages = async (req, res, next) => {
  try {
    const { category, search, sort = '-updatedAt', page = 1, limit = 10 } = req.query;

    let query = WikiPage.find({ isPublished: true });

    // Filter by category
    if (category) {
      query = query.where('category').equals(category);
    }

    // Search
    if (search) {
      query = query.find(
        { $text: { $search: search } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });
    }

    // Count total
    const total = await WikiPage.countDocuments(query.getFilter());

    // Pagination
    const skip = (page - 1) * limit;
    const pages = await query
      .populate('author', 'name email')
      .populate('lastEditedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

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
};

export const getPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const page = await WikiPage.findOne({ slug })
      .populate('author', 'name email')
      .populate('lastEditedBy', 'name email')
      .populate('comments.author', 'name email');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Wiki page not found'
      });
    }

    // Increment view count
    await page.incrementViewCount();

    res.status(200).json({
      success: true,
      page
    });
  } catch (error) {
    next(error);
  }
};

export const getPageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const page = await WikiPage.findById(id)
      .populate('author', 'name email')
      .populate('lastEditedBy', 'name email')
      .populate('comments.author', 'name email');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Wiki page not found'
      });
    }

    res.status(200).json({
      success: true,
      page
    });
  } catch (error) {
    next(error);
  }
};

export const updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, isPinned, changeDescription } = req.body;

    const page = await WikiPage.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Wiki page not found'
      });
    }

    // Check authorization (author or admin)
    if (page.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this page'
      });
    }

    // Add version history
    page.addVersion(req.user.id, changeDescription || 'Updated');

    // Update fields
    if (title) page.title = title;
    if (content) page.content = content;
    if (category) page.category = category;
    if (tags) page.tags = tags;
    if (isPinned !== undefined) page.isPinned = isPinned;

    page.lastEditedBy = req.user.id;
    await page.save();
    await page.populate('author', 'name email');
    await page.populate('lastEditedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Wiki page updated successfully',
      page
    });
  } catch (error) {
    next(error);
  }
};

export const deletePage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const page = await WikiPage.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Wiki page not found'
      });
    }

    // Check authorization
    if (page.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this page'
      });
    }

    await WikiPage.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Wiki page deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getPageVersions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const page = await WikiPage.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Wiki page not found'
      });
    }

    res.status(200).json({
      success: true,
      versions: page.versions,
      currentVersion: page.version
    });
  } catch (error) {
    next(error);
  }
};

export const restoreVersion = async (req, res, next) => {
  try {
    const { id, versionNumber } = req.params;

    const page = await WikiPage.findById(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Wiki page not found'
      });
    }

    // Find the version
    const version = page.versions.find(v => v.versionNumber === parseInt(versionNumber));

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Add current version to history
    page.addVersion(req.user.id, `Restored to version ${versionNumber}`);

    // Restore content
    page.content = version.content;
    page.lastEditedBy = req.user.id;
    await page.save();

    res.status(200).json({
      success: true,
      message: 'Version restored successfully',
      page
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const page = await WikiPage.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            author: req.user.id,
            text,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('comments.author', 'name email');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Wiki page not found'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      page
    });
  } catch (error) {
    next(error);
  }
};
