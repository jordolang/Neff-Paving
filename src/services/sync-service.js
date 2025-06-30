/**
 * Data Synchronization Service
 * Maintains consistency across Calendly, contracts, payments, and job schedules
 */

import { CalendlySync } from './sync/calendly-sync.js';
import { ContractSync } from './sync/contract-sync.js';
import { PaymentSync } from './sync/payment-sync.js';
import { JobScheduleSync } from './sync/job-schedule-sync.js';

export class SyncService {
  constructor() {
    this.systems = {
      calendly: new CalendlySync(),
      contracts: new ContractSync(),
      payments: new PaymentSync(),
      jobSchedules: new JobScheduleSync()
    };
    
    this.isRunning = false;
    this.lastSync = null;
    this.syncErrors = [];
  }

  /**
   * Synchronize all systems
   * @returns {Promise<Object>} Sync results summary
   */
  async syncAll() {
    if (this.isRunning) {
      throw new Error('Sync already in progress');
    }

    this.isRunning = true;
    this.syncErrors = [];
    const startTime = Date.now();

    try {
      console.log('Starting full system synchronization...');
      
      const results = await Promise.allSettled([
        this.systems.calendly.sync(),
        this.systems.contracts.sync(),
        this.systems.payments.sync(),
        this.systems.jobSchedules.sync()
      ]);

      // Process results and collect errors
      const summary = {
        calendly: this._processResult(results[0], 'calendly'),
        contracts: this._processResult(results[1], 'contracts'),
        payments: this._processResult(results[2], 'payments'),
        jobSchedules: this._processResult(results[3], 'jobSchedules'),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      this.lastSync = summary;
      console.log('Full synchronization completed:', summary);
      
      return summary;
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncErrors.push(error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Synchronize a specific job across all systems
   * @param {string} jobId - The job ID to synchronize
   * @returns {Promise<Object>} Sync results for the job
   */
  async syncJob(jobId) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    console.log(`Synchronizing job ${jobId}...`);
    const startTime = Date.now();

    try {
      // Get job details first
      const job = await this.systems.jobSchedules.get(jobId);
      
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Sync related systems in parallel
      const results = await Promise.allSettled([
        job.calendlyEventUri ? this.systems.calendly.syncEvent(job.calendlyEventUri) : Promise.resolve({ status: 'skipped', reason: 'No Calendly event' }),
        job.contractId ? this.systems.contracts.syncContract(job.contractId) : Promise.resolve({ status: 'skipped', reason: 'No contract' }),
        job.paymentId ? this.systems.payments.syncPayment(job.paymentId) : Promise.resolve({ status: 'skipped', reason: 'No payment' })
      ]);

      const summary = {
        jobId,
        calendly: this._processResult(results[0], 'calendly'),
        contracts: this._processResult(results[1], 'contracts'),
        payments: this._processResult(results[2], 'payments'),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      console.log(`Job ${jobId} synchronization completed:`, summary);
      return summary;
    } catch (error) {
      console.error(`Job ${jobId} sync failed:`, error);
      throw error;
    }
  }

  /**
   * Get synchronization status
   * @returns {Object} Current sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      errors: this.syncErrors,
      systemsStatus: {
        calendly: this.systems.calendly.getStatus(),
        contracts: this.systems.contracts.getStatus(),
        payments: this.systems.payments.getStatus(),
        jobSchedules: this.systems.jobSchedules.getStatus()
      }
    };
  }

  /**
   * Trigger incremental sync for specific system
   * @param {string} systemName - Name of the system to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncSystem(systemName) {
    if (!this.systems[systemName]) {
      throw new Error(`Unknown system: ${systemName}`);
    }

    console.log(`Synchronizing ${systemName}...`);
    const startTime = Date.now();

    try {
      const result = await this.systems[systemName].sync();
      
      const summary = {
        system: systemName,
        result,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      console.log(`${systemName} synchronization completed:`, summary);
      return summary;
    } catch (error) {
      console.error(`${systemName} sync failed:`, error);
      throw error;
    }
  }

  /**
   * Schedule automatic synchronization
   * @param {number} intervalMs - Sync interval in milliseconds
   * @returns {Object} Scheduler control object
   */
  scheduleSync(intervalMs = 300000) { // Default 5 minutes
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }

    console.log(`Scheduling automatic sync every ${intervalMs}ms`);
    
    this.scheduler = setInterval(async () => {
      try {
        await this.syncAll();
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, intervalMs);

    return {
      stop: () => {
        if (this.scheduler) {
          clearInterval(this.scheduler);
          this.scheduler = null;
          console.log('Automatic sync stopped');
        }
      },
      isActive: () => !!this.scheduler
    };
  }

  /**
   * Process sync result from Promise.allSettled
   * @private
   */
  _processResult(result, systemName) {
    if (result.status === 'fulfilled') {
      return {
        status: 'success',
        data: result.value
      };
    } else {
      console.error(`${systemName} sync failed:`, result.reason);
      this.syncErrors.push({
        system: systemName,
        error: result.reason,
        timestamp: new Date().toISOString()
      });
      
      return {
        status: 'error',
        error: result.reason.message || result.reason
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
    
    // Cleanup individual sync services
    Object.values(this.systems).forEach(system => {
      if (system.destroy) {
        system.destroy();
      }
    });
  }
}

export default SyncService;
