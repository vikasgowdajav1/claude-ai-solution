import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Update user (admin or self)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, department, role } = req.body;

    // Check authorization
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this user'
      });
    }

    const updates = { name, department };
    
    // Only admin can change role
    if (role && req.user.role === 'admin') {
      updates.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate user (admin only)
router.post('/:id/deactivate', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

export default router;
