const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Store = sequelize.define('Store', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Store name cannot be empty'
        },
        len: {
          args: [2, 200],
          msg: 'Store name must be between 2 and 200 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'Description cannot exceed 2000 characters'
        }
      }
    },
    category: {
      type: DataTypes.ENUM(
        'restaurant',
        'retail',
        'grocery',
        'electronics',
        'clothing',
        'health',
        'beauty',
        'automotive',
        'home_garden',
        'sports',
        'entertainment',
        'services',
        'other'
      ),
      allowNull: false,
      validate: {
        isIn: {
          args: [[
            'restaurant',
            'retail',
            'grocery',
            'electronics',
            'clothing',
            'health',
            'beauty',
            'automotive',
            'home_garden',
            'sports',
            'entertainment',
            'services',
            'other'
          ]],
          msg: 'Invalid store category'
        }
      }
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidAddress(value) {
          if (!value || !value.street || !value.city || !value.country) {
            throw new Error('Address must include street, city, and country');
          }
        }
      }
    },
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true,
      validate: {
        isValidCoordinates(value) {
          if (value && value.coordinates) {
            const [lng, lat] = value.coordinates;
            if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
              throw new Error('Invalid coordinates');
            }
          }
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[\+]?[1-9][\d]{0,15}$/,
          msg: 'Phone number must be valid'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        }
      },
      set(value) {
        if (value) {
          this.setDataValue('email', value.toLowerCase().trim());
        }
      }
    },
    website: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Website must be a valid URL'
        }
      }
    },
    hours: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true }
      },
      validate: {
        isValidHours(value) {
          if (value) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            for (const day of days) {
              if (value[day] && !value[day].closed) {
                if (!value[day].open || !value[day].close) {
                  throw new Error(`Invalid hours for ${day}`);
                }
              }
            }
          }
        }
      }
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidImages(value) {
          if (value && value.length > 10) {
            throw new Error('Maximum 10 images allowed');
          }
        }
      }
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Rating cannot be negative'
        },
        max: {
          args: [5],
          msg: 'Rating cannot exceed 5'
        }
      }
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Total reviews cannot be negative'
        }
      }
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    verification_documents: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: /^[a-z0-9-]+$/,
          msg: 'Slug can only contain lowercase letters, numbers, and hyphens'
        }
      }
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
    tableName: 'stores',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['owner_id']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['average_rating']
      },
      {
        fields: ['location'],
        using: 'gist'
      },
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: async (store) => {
        if (!store.slug) {
          store.slug = await Store.generateSlug(store.name);
        }
      },
      beforeUpdate: async (store) => {
        if (store.changed('name') && !store.changed('slug')) {
          store.slug = await Store.generateSlug(store.name);
        }
      }
    }
  });

  // Instance methods
  Store.prototype.updateRatingStats = async function() {
    const ratings = await this.getRatings();
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
      this.average_rating = (sum / ratings.length).toFixed(2);
      this.total_reviews = ratings.length;
    } else {
      this.average_rating = 0.00;
      this.total_reviews = 0;
    }
    await this.save();
  };

  Store.prototype.isOpen = function(day = null, time = null) {
    if (!this.hours) return false;
    
    const now = new Date();
    const currentDay = day || now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = time || now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const dayHours = this.hours[currentDay];
    if (!dayHours || dayHours.closed) return false;
    
    return currentTime >= dayHours.open && currentTime <= dayHours.close;
  };

  Store.prototype.getDistanceFrom = function(lat, lng) {
    if (!this.location || !this.location.coordinates) return null;
    
    const [storeLng, storeLat] = this.location.coordinates;
    const R = 6371; // Earth's radius in kilometers
    
    const dLat = (lat - storeLat) * Math.PI / 180;
    const dLng = (lng - storeLng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(storeLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  };

  // Class methods
  Store.generateSlug = async function(name) {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  };

  Store.findByCategory = async function(category, options = {}) {
    return await this.findAll({
      where: {
        category,
        is_active: true,
        ...options.where
      },
      ...options
    });
  };

  Store.findNearby = async function(lat, lng, radius = 10, options = {}) {
    const { Op } = require('sequelize');
    
    return await this.findAll({
      where: {
        location: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn(
                'ST_DWithin',
                sequelize.col('location'),
                sequelize.fn('ST_GeomFromText', `POINT(${lng} ${lat})`, 4326),
                radius * 1000 // Convert km to meters
              ),
              true
            )
          ]
        },
        is_active: true,
        ...options.where
      },
      order: [
        sequelize.literal(`ST_Distance(location, ST_GeomFromText('POINT(${lng} ${lat})', 4326)) ASC`)
      ],
      ...options
    });
  };

  Store.findVerified = async function(options = {}) {
    return await this.findAll({
      where: {
        is_verified: true,
        is_active: true,
        ...options.where
      },
      ...options
    });
  };

  // Association method (will be called in index.js)
  Store.associate = function(models) {
    // Store belongs to User (owner)
    Store.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner'
    });

    // Store has many Ratings
    Store.hasMany(models.Rating, {
      foreignKey: 'store_id',
      as: 'ratings'
    });
  };

  return Store;
};
