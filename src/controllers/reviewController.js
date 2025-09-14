const Review = require('../models/Review');
const Store = require('../models/Store');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Get reviews for a store
// @route   GET /api/stores/:storeId/reviews
// @access  Public
const getStoreReviews = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Check if store exists
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const reviews = await Review.find({ store: req.params.storeId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Review.countDocuments({ store: req.params.storeId });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Add review to store
// @route   POST /api/stores/:storeId/reviews
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if store exists
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user already reviewed this store
    const existingReview = await Review.findOne({
      user: req.user._id,
      store: req.params.storeId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this store'
      });
    }

    const { rating, title, comment, images } = req.body;

    const review = await Review.create({
      user: req.user._id,
      store: req.params.storeId,
      rating,
      title,
      comment,
      images
    });

    // Update store's average rating and total reviews
    await updateStoreRating(req.params.storeId);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
const getReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('store', 'name category');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Review owner only)
const updateReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the review owner
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own reviews.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { rating, title, comment, images } = req.body;

    // Update fields
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    const updatedReview = await review.save();

    // Update store's average rating if rating changed
    await updateStoreRating(review.store);

    const populatedReview = await Review.findById(updatedReview._id)
      .populate('user', 'name avatar')
      .populate('store', 'name category');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Review owner or admin)
const deleteReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the review owner or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own reviews.'
      });
    }

    const storeId = review.store;
    await review.deleteOne();

    // Update store's average rating after deletion
    await updateStoreRating(storeId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Add store owner reply to review
// @route   POST /api/reviews/:id/reply
// @access  Private (Store owner or admin)
const addReply = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('store');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is the store owner or admin
    if (review.store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only store owners can reply to reviews.'
      });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    review.reply = {
      text,
      date: new Date()
    };

    const updatedReview = await review.save();
    const populatedReview = await Review.findById(updatedReview._id)
      .populate('user', 'name avatar')
      .populate('store', 'name category');

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Vote review as helpful
// @route   POST /api/reviews/:id/vote
// @access  Private
const voteReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Users can't vote on their own reviews
    if (review.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own review'
      });
    }

    // Simple implementation - increment helpful votes
    // In a real app, you'd track who voted to prevent multiple votes
    review.helpfulVotes += 1;
    await review.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      helpfulVotes: review.helpfulVotes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
const reportReview = asyncHandler(async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    // In a real implementation, you'd create a separate Report model
    // For now, we'll just log the report
    console.log(`Review ${req.params.id} reported by user ${req.user._id} for: ${reason}`);

    res.json({
      success: true,
      message: 'Review reported successfully. We will review it shortly.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Helper function to update store rating
const updateStoreRating = async (storeId) => {
  try {
    const reviews = await Review.find({ store: storeId });
    
    if (reviews.length === 0) {
      await Store.findByIdAndUpdate(storeId, {
        averageRating: 0,
        totalReviews: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Store.findByIdAndUpdate(storeId, {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error updating store rating:', error);
  }
};

module.exports = {
  getStoreReviews,
  addReview,
  getReview,
  updateReview,
  deleteReview,
  addReply,
  voteReview,
  reportReview
};
