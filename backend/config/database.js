import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MongoDB connection configuration
 */
class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      // MongoDB connection options optimized for Atlas
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 10000, // Increased timeout for cloud connection
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
      };

      // Get MongoDB URI from environment or use default
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance-job-board';
      
      console.log('🔌 Attempting MongoDB connection...');
      
      // Check if using Atlas (cloud)
      const isAtlas = MONGODB_URI.includes('mongodb+srv://');
      if (isAtlas) {
        console.log('🌐 Connecting to MongoDB Atlas (Cloud)...');
      } else {
        console.log('💻 Connecting to Local MongoDB...');
      }
      
      // Connect to MongoDB
      this.connection = await mongoose.connect(MONGODB_URI, options);
      this.isConnected = true;
      
      console.log('✅ MongoDB connected successfully!');
      console.log(`📊 Database: ${this.connection.connection.db.databaseName}`);
      console.log(`🎯 Host: ${this.connection.connection.host}`);
      if (!isAtlas) {
        console.log(`🔗 Port: ${this.connection.connection.port}`);
      }
      
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      this.isConnected = false;
      
      // Exit process with failure if connection fails
      process.exit(1);
    }
  }

  /**
   * Setup MongoDB connection event handlers
   */
  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      console.log('🎉 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Close the Mongoose connection when the application is terminated
    process.on('SIGINT', this.gracefulExit.bind(this));
    process.on('SIGTERM', this.gracefulExit.bind(this));
  }

  /**
   * Gracefully close the database connection
   */
  async gracefulExit() {
    try {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      process.exit(1);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.db?.databaseName,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  }

  /**
   * Check if database is connected
   */
  isDBConnected() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Ping database to check connectivity
   */
  async ping() {
    try {
      if (this.isDBConnected()) {
        await mongoose.connection.db.admin().ping();
        return { success: true, message: 'Database ping successful' };
      } else {
        return { success: false, message: 'Database not connected' };
      }
    } catch (error) {
      return { success: false, message: `Database ping failed: ${error.message}` };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      if (!this.isDBConnected()) {
        throw new Error('Database not connected');
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        db: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        fileSize: stats.fileSize
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const database = new Database();

export default database;