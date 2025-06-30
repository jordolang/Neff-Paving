/**
 * Job Schedule Synchronization Service
 * Manages synchronization of job scheduling data and coordination
 */

export class JobScheduleSync {
  constructor() {
    this.lastSync = null;
    this.syncedJobs = new Map();
    this.jobChangeLog = [];
    this.schedulingConflicts = [];
  }

  /**
   * Perform full synchronization of all job schedules
   * @returns {Promise<Object>} Sync results
   */
  async sync() {
    console.log('Starting Job Schedule synchronization...');
    const startTime = Date.now();

    try {
      // Get all jobs from the database
      const jobs = await this._getAllJobs();
      
      const syncResults = {
        jobsProcessed: 0,
        jobsUpdated: 0,
        jobsCreated: 0,
        conflictsResolved: 0,
        errors: []
      };

      for (const job of jobs) {
        try {
          await this._processJob(job);
          syncResults.jobsProcessed++;
          
          // Check for scheduling conflicts
          const conflicts = await this._checkSchedulingConflicts(job);
          if (conflicts.length > 0) {
            await this._resolveConflicts(job, conflicts);
            syncResults.conflictsResolved += conflicts.length;
          }
          
          if (this.syncedJobs.has(job.id)) {
            syncResults.jobsUpdated++;
          } else {
            syncResults.jobsCreated++;
          }
          
          this.syncedJobs.set(job.id, job);
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          syncResults.errors.push({
            jobId: job.id,
            error: error.message
          });
        }
      }

      // Update job dependencies and sequences
      await this._updateJobDependencies();

      this.lastSync = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        results: syncResults
      };

      console.log('Job Schedule synchronization completed:', syncResults);
      return syncResults;
    } catch (error) {
      console.error('Job Schedule sync failed:', error);
      throw error;
    }
  }

  /**
   * Get a specific job by ID
   * @param {string} jobId - Job ID to retrieve
   * @returns {Promise<Object>} Job data
   */
  async get(jobId) {
    console.log(`Getting job: ${jobId}`);

    try {
      const job = await this._getJob(jobId);
      
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      return job;
    } catch (error) {
      console.error(`Failed to get job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new job schedule
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Created job
   */
  async createJob(jobData) {
    console.log('Creating job:', jobData);

    try {
      // Validate job data
      this._validateJobData(jobData);

      const job = {
        id: this._generateJobId(),
        ...jobData,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      // Check for conflicts before creating
      const conflicts = await this._checkSchedulingConflicts(job);
      if (conflicts.length > 0) {
        throw new Error(`Scheduling conflicts detected: ${conflicts.map(c => c.reason).join(', ')}`);
      }

      // Save to database
      await this._saveJob(job);
      this.syncedJobs.set(job.id, job);

      // Log the creation
      this._logJobChange(job.id, 'created', jobData);

      return job;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  }

  /**
   * Update an existing job schedule
   * @param {string} jobId - Job ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated job
   */
  async updateJob(jobId, updates) {
    console.log(`Updating job ${jobId}:`, updates);

    try {
      const job = await this._getJob(jobId);
      
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Create updated job
      const updatedJob = {
        ...job,
        ...updates,
        updatedAt: new Date().toISOString(),
        version: job.version + 1
      };

      // Validate the updates
      this._validateJobData(updatedJob);

      // Check for conflicts if schedule changed
      if (updates.scheduledDate || updates.timeSlot) {
        const conflicts = await this._checkSchedulingConflicts(updatedJob);
        if (conflicts.length > 0) {
          throw new Error(`Scheduling conflicts detected: ${conflicts.map(c => c.reason).join(', ')}`);
        }
      }

      // Save to database
      await this._saveJob(updatedJob);
      this.syncedJobs.set(jobId, updatedJob);

      // Log the update
      this._logJobChange(jobId, 'updated', updates);

      return updatedJob;
    } catch (error) {
      console.error(`Failed to update job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Canceled job
   */
  async cancelJob(jobId, reason) {
    console.log(`Canceling job ${jobId}:`, reason);

    try {
      const job = await this._getJob(jobId);
      
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const canceledJob = {
        ...job,
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
        version: job.version + 1
      };

      await this._saveJob(canceledJob);
      this.syncedJobs.set(jobId, canceledJob);

      // Log the cancellation
      this._logJobChange(jobId, 'canceled', { reason });

      return canceledJob;
    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Complete a job
   * @param {string} jobId - Job ID
   * @param {Object} completionData - Completion details
   * @returns {Promise<Object>} Completed job
   */
  async completeJob(jobId, completionData = {}) {
    console.log(`Completing job ${jobId}:`, completionData);

    try {
      const job = await this._getJob(jobId);
      
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      if (job.status !== 'in_progress') {
        throw new Error('Can only complete jobs that are in progress');
      }

      const completedJob = {
        ...job,
        status: 'completed',
        completedAt: new Date().toISOString(),
        completionData,
        updatedAt: new Date().toISOString(),
        version: job.version + 1
      };

      await this._saveJob(completedJob);
      this.syncedJobs.set(jobId, completedJob);

      // Log the completion
      this._logJobChange(jobId, 'completed', completionData);

      return completedJob;
    } catch (error) {
      console.error(`Failed to complete job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Reschedule a job
   * @param {string} jobId - Job ID
   * @param {Object} newSchedule - New schedule details
   * @returns {Promise<Object>} Rescheduled job
   */
  async rescheduleJob(jobId, newSchedule) {
    console.log(`Rescheduling job ${jobId}:`, newSchedule);

    try {
      const job = await this._getJob(jobId);
      
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Create temporary job with new schedule to check conflicts
      const tempJob = {
        ...job,
        ...newSchedule,
        updatedAt: new Date().toISOString(),
        version: job.version + 1
      };

      // Check for conflicts
      const conflicts = await this._checkSchedulingConflicts(tempJob);
      if (conflicts.length > 0) {
        throw new Error(`Scheduling conflicts detected: ${conflicts.map(c => c.reason).join(', ')}`);
      }

      const rescheduledJob = {
        ...tempJob,
        rescheduledFrom: {
          scheduledDate: job.scheduledDate,
          timeSlot: job.timeSlot,
          rescheduledAt: new Date().toISOString()
        }
      };

      await this._saveJob(rescheduledJob);
      this.syncedJobs.set(jobId, rescheduledJob);

      // Log the reschedule
      this._logJobChange(jobId, 'rescheduled', newSchedule);

      return rescheduledJob;
    } catch (error) {
      console.error(`Failed to reschedule job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get available time slots for a date
   * @param {string} date - Date to check (YYYY-MM-DD)
   * @param {number} duration - Required duration in hours
   * @returns {Promise<Array>} Available time slots
   */
  async getAvailableTimeSlots(date, duration = 1) {
    console.log(`Getting available time slots for ${date}`);

    try {
      const jobsOnDate = await this._getJobsByDate(date);
      const workingHours = this._getWorkingHours();
      const availableSlots = [];

      // Generate all possible time slots
      for (let hour = workingHours.start; hour < workingHours.end - duration + 1; hour++) {
        const timeSlot = {
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${(hour + duration).toString().padStart(2, '0')}:00`,
          duration: duration
        };

        // Check if slot conflicts with existing jobs
        const hasConflict = jobsOnDate.some(job => 
          this._timeSlotOverlaps(timeSlot, job.timeSlot)
        );

        if (!hasConflict) {
          availableSlots.push(timeSlot);
        }
      }

      return availableSlots;
    } catch (error) {
      console.error(`Failed to get available time slots for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Get job change history
   * @param {string} jobId - Job ID
   * @returns {Array} Change history
   */
  getJobHistory(jobId) {
    return this.jobChangeLog.filter(log => log.jobId === jobId);
  }

  /**
   * Get synchronization status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      lastSync: this.lastSync,
      jobsTracked: this.syncedJobs.size,
      changesLogged: this.jobChangeLog.length,
      activeConflicts: this.schedulingConflicts.length,
      recentChanges: this.jobChangeLog.slice(-10)
    };
  }

  /**
   * Get all jobs from database
   * @private
   */
  async _getAllJobs() {
    console.log('Fetching all jobs from database...');
    
    // Placeholder - replace with actual database query
    return Array.from(this.syncedJobs.values());
  }

  /**
   * Get specific job from database
   * @private
   */
  async _getJob(jobId) {
    console.log(`Fetching job ${jobId} from database...`);
    
    // Placeholder - replace with actual database query
    return this.syncedJobs.get(jobId) || null;
  }

  /**
   * Get jobs by date
   * @private
   */
  async _getJobsByDate(date) {
    console.log(`Fetching jobs for date ${date}...`);
    
    // Placeholder - replace with actual database query
    return Array.from(this.syncedJobs.values()).filter(job => 
      job.scheduledDate === date && job.status !== 'canceled'
    );
  }

  /**
   * Save job to database
   * @private
   */
  async _saveJob(job) {
    console.log(`Saving job ${job.id} to database...`);
    
    // Placeholder - replace with actual database save
    this.syncedJobs.set(job.id, job);
    return job;
  }

  /**
   * Process individual job
   * @private
   */
  async _processJob(job) {
    console.log(`Processing job: ${job.id} - ${job.status}`);
    
    // Check if job is overdue
    if (job.scheduledDate && new Date(job.scheduledDate) < new Date()) {
      if (job.status === 'scheduled') {
        // Mark as overdue if not started
        await this.updateJob(job.id, { status: 'overdue' });
      }
    }

    // Auto-start jobs that are due
    if (job.autoStart && job.scheduledDate === new Date().toISOString().split('T')[0]) {
      const now = new Date();
      const [startHour, startMinute] = job.timeSlot.start.split(':').map(Number);
      const jobStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
      
      if (now >= jobStart && job.status === 'scheduled') {
        await this.updateJob(job.id, { status: 'in_progress', startedAt: new Date().toISOString() });
      }
    }

    return {
      processed: true,
      jobId: job.id,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check for scheduling conflicts
   * @private
   */
  async _checkSchedulingConflicts(job) {
    if (!job.scheduledDate || !job.timeSlot) {
      return [];
    }

    const conflicts = [];
    const jobsOnDate = await this._getJobsByDate(job.scheduledDate);

    for (const existingJob of jobsOnDate) {
      if (existingJob.id === job.id) continue; // Skip self

      // Check time slot overlap
      if (this._timeSlotOverlaps(job.timeSlot, existingJob.timeSlot)) {
        conflicts.push({
          type: 'time_overlap',
          conflictingJobId: existingJob.id,
          reason: `Time slot overlaps with job ${existingJob.id}`
        });
      }

      // Check resource conflicts (crew, equipment)
      if (job.crewId && existingJob.crewId === job.crewId) {
        conflicts.push({
          type: 'crew_conflict',
          conflictingJobId: existingJob.id,
          reason: `Crew ${job.crewId} already assigned to job ${existingJob.id}`
        });
      }

      if (job.equipmentIds && existingJob.equipmentIds) {
        const sharedEquipment = job.equipmentIds.filter(id => 
          existingJob.equipmentIds.includes(id)
        );
        
        if (sharedEquipment.length > 0) {
          conflicts.push({
            type: 'equipment_conflict',
            conflictingJobId: existingJob.id,
            reason: `Equipment ${sharedEquipment.join(', ')} already assigned to job ${existingJob.id}`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve scheduling conflicts
   * @private
   */
  async _resolveConflicts(job, conflicts) {
    console.log(`Resolving ${conflicts.length} conflicts for job ${job.id}`);

    for (const conflict of conflicts) {
      this.schedulingConflicts.push({
        jobId: job.id,
        conflictingJobId: conflict.conflictingJobId,
        type: conflict.type,
        reason: conflict.reason,
        detectedAt: new Date().toISOString(),
        resolved: false
      });
    }

    // In a real implementation, you might:
    // 1. Automatically reschedule to next available slot
    // 2. Send notifications to stakeholders
    // 3. Suggest alternative solutions
    // 4. Put job in "conflict" status for manual resolution
  }

  /**
   * Update job dependencies
   * @private
   */
  async _updateJobDependencies() {
    console.log('Updating job dependencies...');

    // This would handle job sequences and dependencies
    // For example, ensuring prerequisite jobs are completed
    // before dependent jobs can start
  }

  /**
   * Check if two time slots overlap
   * @private
   */
  _timeSlotOverlaps(slot1, slot2) {
    if (!slot1 || !slot2) return false;

    const start1 = this._timeToMinutes(slot1.start);
    const end1 = this._timeToMinutes(slot1.end);
    const start2 = this._timeToMinutes(slot2.start);
    const end2 = this._timeToMinutes(slot2.end);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Convert time string to minutes
   * @private
   */
  _timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get working hours configuration
   * @private
   */
  _getWorkingHours() {
    // This could be configurable per business
    return {
      start: 7, // 7 AM
      end: 17   // 5 PM
    };
  }

  /**
   * Validate job data
   * @private
   */
  _validateJobData(jobData) {
    const required = ['clientName', 'jobType', 'scheduledDate'];
    const missing = required.filter(field => !jobData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate date format
    if (jobData.scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(jobData.scheduledDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate time slot format
    if (jobData.timeSlot) {
      if (!jobData.timeSlot.start || !jobData.timeSlot.end) {
        throw new Error('Time slot must have start and end times');
      }
    }
  }

  /**
   * Generate unique job ID
   * @private
   */
  _generateJobId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `job_${timestamp}_${random}`;
  }

  /**
   * Log job changes
   * @private
   */
  _logJobChange(jobId, action, data) {
    this.jobChangeLog.push({
      jobId,
      action,
      data,
      timestamp: new Date().toISOString()
    });

    // Keep only the last 1000 changes
    if (this.jobChangeLog.length > 1000) {
      this.jobChangeLog = this.jobChangeLog.slice(-1000);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.syncedJobs.clear();
    this.jobChangeLog = [];
    this.schedulingConflicts = [];
  }
}

export default JobScheduleSync;
