// src/services/alert-service.js
export class AlertService {
  constructor() {
    this.channels = {
      email: new EmailNotifier(),
      sms: new SMSNotifier(),
      dashboard: new DashboardNotifier()
    };
  }

  async sendJobScheduledAlert(jobData) {
    const alert = this.formatJobAlert(jobData);
    await Promise.all([
      this.channels.email.send(alert),
      this.channels.sms.send(alert),
      this.channels.dashboard.send(alert)
    ]);
  }

  formatJobAlert(jobData) {
    return {
      title: `New Job Scheduled: ${jobData.projectType}`,
      startDate: jobData.startDate,
      duration: jobData.duration,
      customer: jobData.customer,
      contract: jobData.contractId,
      payment: jobData.paymentId,
      specialNotes: jobData.notes
    };
  }
}
