const Store = require('../models/Store');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public
const getAllStores = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.category) {
      filter.category = { $regex: req.query.category, $options: 'i' };
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === 'true';
    }

    const stores = await Store.find(filter)
      .populate('owner', 'name email')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Store.countDocuments(filter);

    res.json({
      success: true,
      data: stores,
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

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Public
const getStore = asyncHandler(async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('owner', 'name email avatar');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Create new store
// @route   POST /api/stores
// @access  Private (Store owners and admins)
const createStore = asyncHandler(async (req, res) => {
  try {
    // Check if user is store_owner or admin
    if (req.user.role !== 'store_owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Store owner or admin role required.'
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

    const {
      name,
      description,
      category,
      address,
      location,
      phone,
      email,
      website,
      hours,
      images
    } = req.body;

    // Check if store with same name already exists for this owner
    const existingStore = await Store.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      owner: req.user._id
    });

    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'You already have a store with this name'
      });
    }

    const store = await Store.create({
      name,
      description,
      category,
      address,
      location,
      phone,
      email,
      website,
      hours,
      images,
      owner: req.user._id
    });

    const populatedStore = await Store.findById(store._id)
      .populate('owner', 'name email');

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: populatedStore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private (Store owner or admin)
const updateStore = asyncHandler(async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user is the store owner or admin
    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own stores.'
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

    const {
      name,
      description,
      category,
      address,
      location,
      phone,
      email,
      website,
      hours,
      images,
      isVerified
    } = req.body;

    // Update fields
    store.name = name || store.name;
    store.description = description || store.description;
    store.category = category || store.category;
    store.address = address || store.address;
    store.location = location || store.location;
    store.phone = phone || store.phone;
    store.email = email || store.email;
    store.website = website || store.website;
    store.hours = hours || store.hours;
    store.images = images || store.images;
    
    // Only admins can update verification status
    if (req.user.role === 'admin' && isVerified !== undefined) {
      store.isVerified = isVerified;
    }

    const updatedStore = await store.save();
    const populatedStore = await Store.findById(updatedStore._id)
      .populate('owner', 'name email');

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: populatedStore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private (Store owner or admin)
const deleteStore = asyncHandler(async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user is the store owner or admin
    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own stores.'
      });
    }

    await store.deleteOne();

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get stores by owner
// @route   GET /api/stores/owner/:ownerId
// @access  Public
const getStoresByOwner = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const stores = await Store.find({ owner: req.params.ownerId })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Store.countDocuments({ owner: req.params.ownerId });

    res.json({
      success: true,
      data: stores,
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

// @desc    Get my stores
// @route   GET /api/stores/my-stores
// @access  Private (Store owner)
const getMyStores = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'store_owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Store owner role required.'
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const stores = await Store.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Store.countDocuments({ owner: req.user._id });

    res.json({
      success: true,
      data: stores,
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

// @desc    Get stores by category
// @route   GET /api/stores/category/:category
// @access  Public
const getStoresByCategory = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const stores = await Store.find({
      category: { $regex: req.params.category, $options: 'i' }
    })
      .populate('owner', 'name email')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Store.countDocuments({
      category: { $regex: req.params.category, $options: 'i' }
    });

    res.json({
      success: true,
      data: stores,
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

module.exports = {
  getAllStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  getStoresByOwner,
  getMyStores,
  getStoresByCategory
};
