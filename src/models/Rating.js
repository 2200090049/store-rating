const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Rating = sequelize.define('Rating', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    store_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Rating must be between 1 and 5'
        },
        max: {
          args: [5],
          msg: 'Rating must be between 1 and 5'
        },
        isInt: {
          msg: 'Rating must be an integer'
        }
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: {
          args: [0, 200],
          msg: 'Title cannot exceed 200 characters'
        }
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'Comment cannot exceed 2000 characters'
        }
      }
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidImages(value) {
          if (value && value.length > 5) {
            throw new Error('Maximum 5 images allowed per review');
          }
          if (value) {
            for (const image of value) {
              if (!image.startsWith('http')) {
                throw new Error('All images must be valid URLs');
              }
            }
          }
        }
      }
    },
    helpful_votes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Helpful votes cannot be negative'
        }
      }
    },
    reply: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidReply(value) {
          if (value) {
            if (!value.text || typeof value.text !== 'string') {
              throw new Error('Reply must have a text field');
            }
            if (value.text.length > 1000) {
              throw new Error('Reply text cannot exceed 1000 characters');
            }
            if (!value.date) {
              throw new Error('Reply must have a date field');
            }
          }
        }
      }
    },
    is_verified_purchase: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_flagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    flag_reason: {
      type: DataTypes.ENUM(
        'spam',
        'inappropriate',
        'fake',
        'offensive',
        'other'
      ),
      allowNull: true,
      validate: {
        isValidFlagReason(value) {
          if (this.is_flagged && !value) {
            throw new Error('Flag reason is required when review is flagged');
          }
        }
      }
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ratings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['store_id']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['is_approved']
      },
      {
        fields: ['is_flagged']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['user_id', 'store_id'],
        name: 'unique_user_store_rating'
      }
    ],
    hooks: {
      afterCreate: async (rating) => {
        // Update store rating statistics
        const store = await rating.getStore();
        if (store) {
          await store.updateRatingStats();
        }
      },
      afterUpdate: async (rating) => {
        // Update store rating statistics if rating changed
        if (rating.changed('rating') || rating.changed('is_approved')) {
          const store = await rating.getStore();
          if (store) {
            await store.updateRatingStats();
          }
        }
      },
      afterDestroy: async (rating) => {
        // Update store rating statistics
        const store = await rating.getStore();
        if (store) {
          await store.updateRatingStats();
        }
      }
    }
  });

  // Instance methods
  Rating.prototype.addHelpfulVote = async function() {
    this.helpful_votes += 1;
    await this.save();
    return this.helpful_votes;
  };

  Rating.prototype.removeHelpfulVote = async function() {
    if (this.helpful_votes > 0) {
      this.helpful_votes -= 1;
      await this.save();
    }
    return this.helpful_votes;
  };

  Rating.prototype.addReply = async function(replyText, authorId) {
    this.reply = {
      text: replyText,
      date: new Date(),
      author_id: authorId
    };
    await this.save();
    return this.reply;
  };

  Rating.prototype.removeReply = async function() {
    this.reply = null;
    await this.save();
    return true;
  };

  Rating.prototype.flag = async function(reason) {
    this.is_flagged = true;
    this.flag_reason = reason;
    this.is_approved = false;
    await this.save();
    return true;
  };

  Rating.prototype.unflag = async function() {
    this.is_flagged = false;
    this.flag_reason = null;
    this.is_approved = true;
    await this.save();
    return true;
  };

  Rating.prototype.approve = async function() {
    this.is_approved = true;
    await this.save();
    return true;
  };

  Rating.prototype.reject = async function() {
    this.is_approved = false;
    await this.save();
    return true;
  };

  // Class methods
  Rating.findByStore = async function(storeId, options = {}) {
    return await this.findAll({
      where: {
        store_id: storeId,
        is_approved: true,
        ...options.where
      },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: this.sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      ...options
    });
  };

  Rating.findByUser = async function(userId, options = {}) {
    return await this.findAll({
      where: {
        user_id: userId,
        ...options.where
      },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: this.sequelize.models.Store,
          as: 'store',
          attributes: ['id', 'name', 'slug']
        }
      ],
      ...options
    });
  };

  Rating.findByRating = async function(rating, options = {}) {
    return await this.findAll({
      where: {
        rating: rating,
        is_approved: true,
        ...options.where
      },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Rating.findFlagged = async function(options = {}) {
    return await this.findAll({
      where: {
        is_flagged: true,
        ...options.where
      },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: this.sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: this.sequelize.models.Store,
          as: 'store',
          attributes: ['id', 'name', 'slug']
        }
      ],
      ...options
    });
  };

  Rating.findPending = async function(options = {}) {
    return await this.findAll({
      where: {
        is_approved: false,
        is_flagged: false,
        ...options.where
      },
      order: [['created_at', 'ASC']],
      include: [
        {
          model: this.sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: this.sequelize.models.Store,
          as: 'store',
          attributes: ['id', 'name', 'slug']
        }
      ],
      ...options
    });
  };

  Rating.getAverageRating = async function(storeId) {
    const result = await this.findAll({
      where: {
        store_id: storeId,
        is_approved: true
      },
      attributes: [
        [this.sequelize.fn('AVG', this.sequelize.col('rating')), 'average'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'total']
      ],
      raw: true
    });
    
    return {
      average: parseFloat(result[0].average) || 0,
      total: parseInt(result[0].total) || 0
    };
  };

  Rating.getRatingDistribution = async function(storeId) {
    const result = await this.findAll({
      where: {
        store_id: storeId,
        is_approved: true
      },
      attributes: [
        'rating',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'DESC']],
      raw: true
    });
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    result.forEach(item => {
      distribution[item.rating] = parseInt(item.count);
    });
    
    return distribution;
  };

  // Association method (will be called in index.js)
  Rating.associate = function(models) {
    // Rating belongs to User
    Rating.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Rating belongs to Store
    Rating.belongsTo(models.Store, {
      foreignKey: 'store_id',
      as: 'store'
    });
  };

  return Rating;
};
