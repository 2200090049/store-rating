const { Sequelize } = require('sequelize');
const config = require('../config/postgres');

// Import all models
const User = require('./User');
const Store = require('./Store');
const Rating = require('./Rating');

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: config.logging,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

// Initialize models
const models = {
  User: User(sequelize, Sequelize.DataTypes),
  Store: Store(sequelize, Sequelize.DataTypes),
  Rating: Rating(sequelize, Sequelize.DataTypes)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Define specific associations
// User has many Stores (as owner)
models.User.hasMany(models.Store, {
  foreignKey: 'owner_id',
  as: 'ownedStores'
});

// Store belongs to User (owner)
models.Store.belongsTo(models.User, {
  foreignKey: 'owner_id',
  as: 'owner'
});

// User has many Ratings
models.User.hasMany(models.Rating, {
  foreignKey: 'user_id',
  as: 'ratings'
});

// Store has many Ratings
models.Store.hasMany(models.Rating, {
  foreignKey: 'store_id',
  as: 'ratings'
});

// Rating belongs to User
models.Rating.belongsTo(models.User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Rating belongs to Store
models.Rating.belongsTo(models.Store, {
  foreignKey: 'store_id',
  as: 'store'
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the PostgreSQL database:', error);
  }
};

// Sync database (create tables)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
  }
};

models.sequelize = sequelize;
models.Sequelize = Sequelize;
models.testConnection = testConnection;
models.syncDatabase = syncDatabase;

module.exports = models;
