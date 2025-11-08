import database from '../config/database.js';

/**
 * Utility functions for database status and health checks
 */
export class DBStatus {
  /**
   * Check if database is ready for operations
   */
  static async isReady() {
    return database.isDBConnected();
  }

  /**
   * Get detailed database connection info
   */
  static getInfo() {
    return database.getStatus();
  }

  /**
   * Health check for load balancers and monitoring
   */
  static async healthCheck() {
    const status = database.getStatus();
    const ping = await database.ping();
    
    return {
      status: ping.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: status.isConnected,
        readyState: this.getReadyStateText(status.readyState),
        ping: ping.success
      }
    };
  }

  /**
   * Convert readyState to human-readable text
   */
  static getReadyStateText(readyState) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[readyState] || 'unknown';
  }

  /**
   * Wait for database connection (useful for tests)
   */
  static async waitForConnection(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.isReady()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Database connection timeout after ${timeout}ms`);
  }
}

export default DBStatus;