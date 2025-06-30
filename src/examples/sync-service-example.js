/**
 * SyncService Usage Example
 * Demonstrates how to use the data synchronization system
 */

import SyncService from '../services/sync-service.js';

// Initialize the sync service
const syncService = new SyncService();

async function demonstrateSyncService() {
  try {
    console.log('=== SyncService Demo ===\n');

    // 1. Check initial status
    console.log('1. Initial Status:');
    console.log(syncService.getStatus());
    console.log('\n');

    // 2. Perform full synchronization
    console.log('2. Performing full synchronization...');
    const fullSyncResult = await syncService.syncAll();
    console.log('Full sync completed:', fullSyncResult);
    console.log('\n');

    // 3. Sync individual systems
    console.log('3. Syncing individual systems...');
    
    const calendlySync = await syncService.syncSystem('calendly');
    console.log('Calendly sync:', calendlySync);
    
    const contractSync = await syncService.syncSystem('contracts');
    console.log('Contract sync:', contractSync);
    
    const paymentSync = await syncService.syncSystem('payments');
    console.log('Payment sync:', paymentSync);
    
    const jobSync = await syncService.syncSystem('jobSchedules');
    console.log('Job schedules sync:', jobSync);
    console.log('\n');

    // 4. Sync a specific job (mock data)
    console.log('4. Syncing specific job...');
    
    // First create a mock job
    const mockJob = await syncService.systems.jobSchedules.createJob({
      clientName: 'John Doe',
      jobType: 'Driveway Paving',
      scheduledDate: '2024-02-15',
      timeSlot: { start: '09:00', end: '12:00' },
      contractId: 'contract_123',
      paymentId: 'payment_456',
      calendlyEventUri: 'calendly://event/789'
    });
    
    console.log('Created mock job:', mockJob);
    
    // Now sync this specific job
    const jobSyncResult = await syncService.syncJob(mockJob.id);
    console.log('Job sync result:', jobSyncResult);
    console.log('\n');

    // 5. Check final status
    console.log('5. Final Status:');
    console.log(syncService.getStatus());
    console.log('\n');

    // 6. Schedule automatic synchronization
    console.log('6. Scheduling automatic sync...');
    const scheduler = syncService.scheduleSync(60000); // Every minute for demo
    console.log('Automatic sync scheduled');
    
    // Stop after 5 seconds for demo
    setTimeout(() => {
      scheduler.stop();
      console.log('Automatic sync stopped');
    }, 5000);

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Example of handling sync errors
async function handleSyncErrors() {
  try {
    console.log('\n=== Error Handling Demo ===\n');
    
    // This will likely fail since we don't have real services configured
    await syncService.syncAll();
    
  } catch (error) {
    console.log('Caught sync error (expected):', error.message);
    
    // Check error details in status
    const status = syncService.getStatus();
    console.log('Sync errors:', status.errors);
  }
}

// Example of individual service usage
async function demonstrateIndividualServices() {
  console.log('\n=== Individual Services Demo ===\n');
  
  // Job scheduling service
  console.log('Job Scheduling Service:');
  const jobService = syncService.systems.jobSchedules;
  
  try {
    // Get available time slots
    const availableSlots = await jobService.getAvailableTimeSlots('2024-02-15', 2);
    console.log('Available time slots:', availableSlots);
    
    // Create a job
    const newJob = await jobService.createJob({
      clientName: 'Jane Smith',
      jobType: 'Parking Lot Repair',
      scheduledDate: '2024-02-16',
      timeSlot: { start: '14:00', end: '16:00' }
    });
    console.log('Created job:', newJob);
    
    // Update job status
    const updatedJob = await jobService.updateJob(newJob.id, {
      status: 'in_progress',
      notes: 'Work started on schedule'
    });
    console.log('Updated job:', updatedJob);
    
  } catch (error) {
    console.log('Job service error:', error.message);
  }
  
  console.log('\n');
  
  // Contract service
  console.log('Contract Service:');
  const contractService = syncService.systems.contracts;
  
  try {
    const newContract = await contractService.createContract({
      clientName: 'Mike Johnson',
      amount: 5000,
      terms: 'Standard driveway paving contract',
      jobId: 'job_123'
    });
    console.log('Created contract:', newContract);
    
    // Sign the contract
    const signedContract = await contractService.signContract(newContract.id, {
      signedBy: 'Mike Johnson',
      signedAt: new Date().toISOString(),
      signatureMethod: 'digital'
    });
    console.log('Signed contract:', signedContract);
    
  } catch (error) {
    console.log('Contract service error:', error.message);
  }
  
  console.log('\n');
  
  // Payment service
  console.log('Payment Service:');
  const paymentService = syncService.systems.payments;
  
  try {
    const newPayment = await paymentService.processPayment({
      amount: 5000,
      currency: 'USD',
      paymentMethod: 'credit_card',
      clientId: 'client_123',
      jobId: 'job_123'
    });
    console.log('Processed payment:', newPayment);
    
    // Check payment history
    const history = paymentService.getPaymentHistory(newPayment.id);
    console.log('Payment history:', history);
    
  } catch (error) {
    console.log('Payment service error:', error.message);
  }
}

// Run the demonstrations
async function runDemo() {
  await demonstrateSyncService();
  await handleSyncErrors();
  await demonstrateIndividualServices();
  
  // Clean up
  syncService.destroy();
  console.log('\nDemo completed and resources cleaned up.');
}

// Export for use in other modules or run directly
export { syncService, demonstrateSyncService, handleSyncErrors, demonstrateIndividualServices };

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}
