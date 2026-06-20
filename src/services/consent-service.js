export class ConsentService {
  constructor() {
    this.storageKey = 'consent_records';
    this.consentTypes = ['email', 'sms'];
  }

  /**
   * Grant consent for a specific lead and communication type
   * @param {string} leadId - The lead identifier
   * @param {string} type - Type of consent ('email' or 'sms')
   * @returns {Object} The updated consent record
   */
  grantConsent(leadId, type) {
    if (!leadId) {
      throw new Error('Lead ID is required to grant consent');
    }

    if (!this.consentTypes.includes(type)) {
      throw new Error(`Invalid consent type: ${type}. Must be 'email' or 'sms'`);
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    try {
      const records = this.getConsentRecords();
      const existingIndex = records.findIndex(r => r.leadId === leadId);

      if (existingIndex >= 0) {
        // Update existing record
        const record = records[existingIndex];
        record[`consent_${type}`] = true;
        record[`${type}_granted_at`] = new Date().toISOString();
        record.updated_at = new Date().toISOString();

        // Remove revoked timestamp if exists
        if (record[`${type}_revoked_at`]) {
          delete record[`${type}_revoked_at`];
        }

        records[existingIndex] = record;
      } else {
        // Create new consent record
        const record = {
          leadId: leadId,
          consent_email: type === 'email',
          consent_sms: type === 'sms',
          email_granted_at: type === 'email' ? new Date().toISOString() : null,
          sms_granted_at: type === 'sms' ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        records.push(record);
      }

      // Save to localStorage
      window.localStorage.setItem(this.storageKey, JSON.stringify(records));

      return records.find(r => r.leadId === leadId);
    } catch (error) {
      throw new Error(`Failed to grant consent: ${error.message}`);
    }
  }

  /**
   * Revoke consent for a specific lead and communication type
   * @param {string} leadId - The lead identifier
   * @param {string} type - Type of consent ('email' or 'sms')
   * @returns {Object} The updated consent record
   */
  revokeConsent(leadId, type) {
    if (!leadId) {
      throw new Error('Lead ID is required to revoke consent');
    }

    if (!this.consentTypes.includes(type)) {
      throw new Error(`Invalid consent type: ${type}. Must be 'email' or 'sms'`);
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    try {
      const records = this.getConsentRecords();
      const existingIndex = records.findIndex(r => r.leadId === leadId);

      if (existingIndex >= 0) {
        const record = records[existingIndex];
        record[`consent_${type}`] = false;
        record[`${type}_revoked_at`] = new Date().toISOString();
        record.updated_at = new Date().toISOString();
        records[existingIndex] = record;

        // Save to localStorage
        window.localStorage.setItem(this.storageKey, JSON.stringify(records));

        return record;
      } else {
        // Create a record with revoked consent
        const record = {
          leadId: leadId,
          consent_email: type === 'email' ? false : null,
          consent_sms: type === 'sms' ? false : null,
          email_revoked_at: type === 'email' ? new Date().toISOString() : null,
          sms_revoked_at: type === 'sms' ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        records.push(record);

        // Save to localStorage
        window.localStorage.setItem(this.storageKey, JSON.stringify(records));

        return record;
      }
    } catch (error) {
      throw new Error(`Failed to revoke consent: ${error.message}`);
    }
  }

  /**
   * Check if a lead has given consent for a specific communication type
   * @param {string} leadId - The lead identifier
   * @param {string} type - Type of consent ('email' or 'sms')
   * @returns {boolean} True if consent exists and is active
   */
  hasConsent(leadId, type) {
    if (!leadId) {
      return false;
    }

    if (!this.consentTypes.includes(type)) {
      return false;
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      const records = this.getConsentRecords();
      const record = records.find(r => r.leadId === leadId);

      if (!record) {
        return false;
      }

      return record[`consent_${type}`] === true;
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Failed to check consent:', error);
      }
      return false;
    }
  }

  /**
   * Record an unsubscribe event (alias for revokeConsent with additional tracking)
   * @param {string} leadId - The lead identifier
   * @param {string} type - Type of consent ('email' or 'sms')
   * @param {Object} options - Additional options (reason, source, etc.)
   * @returns {Object} The updated consent record
   */
  recordUnsubscribe(leadId, type, options = {}) {
    if (!leadId) {
      throw new Error('Lead ID is required to record unsubscribe');
    }

    if (!this.consentTypes.includes(type)) {
      throw new Error(`Invalid consent type: ${type}. Must be 'email' or 'sms'`);
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    try {
      // First revoke consent
      const record = this.revokeConsent(leadId, type);

      // Add unsubscribe-specific metadata
      const records = this.getConsentRecords();
      const existingIndex = records.findIndex(r => r.leadId === leadId);

      if (existingIndex >= 0) {
        records[existingIndex].unsubscribe_reason = options.reason || 'user_request';
        records[existingIndex].unsubscribe_source = options.source || 'unknown';
        records[existingIndex].unsubscribed_at = new Date().toISOString();
        records[existingIndex].updated_at = new Date().toISOString();

        // Save to localStorage
        window.localStorage.setItem(this.storageKey, JSON.stringify(records));

        return records[existingIndex];
      }

      return record;
    } catch (error) {
      throw new Error(`Failed to record unsubscribe: ${error.message}`);
    }
  }

  /**
   * Retrieve all consent records from localStorage
   * @returns {Array} Array of consent records
   */
  getConsentRecords() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const data = window.localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Failed to retrieve consent records:', error);
      }
      return [];
    }
  }

  /**
   * Get consent record for a specific lead
   * @param {string} leadId - The lead identifier
   * @returns {Object|null} The consent record or null if not found
   */
  getConsentRecord(leadId) {
    if (!leadId) {
      return null;
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const records = this.getConsentRecords();
      return records.find(r => r.leadId === leadId) || null;
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Failed to get consent record:', error);
      }
      return null;
    }
  }

  /**
   * Get all leads with active consent for a specific type
   * @param {string} type - Type of consent ('email' or 'sms')
   * @returns {Array} Array of lead IDs with active consent
   */
  getLeadsWithConsent(type) {
    if (!this.consentTypes.includes(type)) {
      return [];
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const records = this.getConsentRecords();
      return records
        .filter(r => r[`consent_${type}`] === true)
        .map(r => r.leadId);
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Failed to get leads with consent:', error);
      }
      return [];
    }
  }

  /**
   * Clear all consent records (for testing/development)
   * @returns {boolean} True if successful
   */
  clearAllConsents() {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    try {
      window.localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      throw new Error(`Failed to clear consents: ${error.message}`);
    }
  }

  /**
   * Get consent statistics
   * @returns {Object} Statistics about consent records
   */
  getConsentStats() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        total: 0,
        email_consented: 0,
        sms_consented: 0,
        unsubscribed: 0
      };
    }

    try {
      const records = this.getConsentRecords();
      return {
        total: records.length,
        email_consented: records.filter(r => r.consent_email === true).length,
        sms_consented: records.filter(r => r.consent_sms === true).length,
        unsubscribed: records.filter(r => r.unsubscribed_at).length
      };
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Failed to get consent stats:', error);
      }
      return {
        total: 0,
        email_consented: 0,
        sms_consented: 0,
        unsubscribed: 0
      };
    }
  }
}
