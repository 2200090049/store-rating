const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ no longer needs these options as they're defaults
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`🌱 MongoDB Connected: ${conn.connection.host}`);
    console.log(`💾 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('🔥 MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('💾 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('🔥 Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('💾 MongoDB connection closed');
  } catch (error) {
    console.error('🔥 Error disconnecting from MongoDB:', error.message);
  }
};

/**
 * Get database connection status
 * @returns {string} Connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Clear all collections in the database (useful for testing)
 * @returns {Promise<void>}
 */
const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearDatabase can only be used in test environment');
  }
  
  try {
    const collections = await mongoose.connection.db.collections();
    
    for (let collection of collections) {
      await collection.deleteMany({});
    }
    
    console.log('🧹 Database cleared successfully');
  } catch (error) {
    console.error('🔥 Error clearing database:', error.message);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  clearDatabase
};
