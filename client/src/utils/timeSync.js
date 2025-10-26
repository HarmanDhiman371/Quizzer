import { calculateTimeOffset, getServerTime } from './firestore';

class TimeSynchronizer {
  constructor() {
    this.offset = 0;
    this.lastSync = 0;
    this.syncInterval = 30000; // Sync every 30 seconds
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🕒 Initializing time synchronization...');
      this.offset = await calculateTimeOffset();
      this.lastSync = Date.now();
      this.isInitialized = true;
      
      console.log('✅ Time synchronization initialized. Offset:', this.offset, 'ms');
      
      // Start periodic synchronization
      this.startPeriodicSync();
      
      return this.offset;
    } catch (error) {
      console.error('❌ Time synchronization failed:', error);
      this.offset = 0;
      return 0;
    }
  }

  startPeriodicSync() {
    setInterval(async () => {
      try {
        const newOffset = await calculateTimeOffset();
        // Smooth offset adjustment to avoid jumps
        this.offset = Math.round((this.offset * 0.7) + (newOffset * 0.3));
        this.lastSync = Date.now();
        
        console.log('🔄 Time sync updated. New offset:', this.offset, 'ms');
      } catch (error) {
        console.error('Periodic time sync failed:', error);
      }
    }, this.syncInterval);
  }

  getSynchronizedTime() {
    if (!this.isInitialized) {
      console.warn('⚠️ Time synchronizer not initialized. Using client time.');
      return Date.now();
    }
    return Date.now() + this.offset;
  }

  getTimeOffset() {
    return this.offset;
  }

  isTimeSynced() {
    return this.isInitialized && Math.abs(this.offset) < 5000; // Consider synced if within 5 seconds
  }

  async forceSync() {
    console.log('🔄 Forcing time synchronization...');
    this.offset = await calculateTimeOffset();
    this.lastSync = Date.now();
    return this.offset;
  }
}

// Create singleton instance
export const timeSynchronizer = new TimeSynchronizer();

// Convenience functions
export const getSyncTime = () => timeSynchronizer.getSynchronizedTime();
export const getTimeOffset = () => timeSynchronizer.getTimeOffset();
export const initializeTimeSync = () => timeSynchronizer.initialize();
export const isTimeSynced = () => timeSynchronizer.isTimeSynced();