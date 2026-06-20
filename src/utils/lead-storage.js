/**
 * Lead Storage Utility
 * Handles persistence of lead data for nurture campaigns
 */

const STORAGE_KEYS = {
    NURTURE_LEADS: 'nurture_leads',
    LEAD_HISTORY: 'nurture_lead_history'
};

/**
 * Store lead data
 * @param {Object} leadData - Lead information
 * @param {string} leadData.lead_id - Unique lead identifier
 * @param {string} leadData.email - Lead email address
 * @param {string} leadData.phone - Lead phone number
 * @param {boolean} leadData.consent_email - Email consent flag
 * @param {boolean} leadData.consent_sms - SMS consent flag
 * @param {string} leadData.estimate_created_at - ISO timestamp
 * @param {number} leadData.estimate_amount - Estimate amount in cents
 * @param {string} leadData.status - Lead status (new, contacted, converted, unsubscribed)
 */
export function storeLead(leadData) {
    try {
        if (!leadData.lead_id || !leadData.email) {
            throw new Error('Lead must have lead_id and email');
        }

        const leads = getAllLeads();

        const enrichedLead = {
            ...leadData,
            last_contact: leadData.last_contact || null,
            created_at: leadData.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Update or insert lead
        const existingIndex = leads.findIndex(l => l.lead_id === leadData.lead_id);
        if (existingIndex >= 0) {
            leads[existingIndex] = enrichedLead;
        } else {
            leads.push(enrichedLead);
        }

        localStorage.setItem(STORAGE_KEYS.NURTURE_LEADS, JSON.stringify(leads));

        // Add to history
        addToHistory('lead_stored', leadData.lead_id);
    } catch (error) {
        console.error('Failed to store lead:', error);
    }
}

/**
 * Retrieve a specific lead by ID
 * @param {string} leadId - Lead identifier
 * @returns {Object|null} Lead data or null if not found
 */
export function getLead(leadId) {
    try {
        const leads = getAllLeads();
        return leads.find(l => l.lead_id === leadId) || null;
    } catch (error) {
        console.error('Failed to retrieve lead:', error);
        return null;
    }
}

/**
 * Get all stored leads
 * @returns {Array} Array of lead objects
 */
export function getAllLeads() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.NURTURE_LEADS);
        if (!stored) {
            return [];
        }

        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to retrieve all leads:', error);
        return [];
    }
}

/**
 * Update lead status
 * @param {string} leadId - Lead identifier
 * @param {string} status - New status (new, contacted, converted, unsubscribed)
 */
export function updateLeadStatus(leadId, status) {
    try {
        const lead = getLead(leadId);
        if (!lead) {
            throw new Error(`Lead not found: ${leadId}`);
        }

        lead.status = status;
        lead.updated_at = new Date().toISOString();

        if (['contacted', 'converted'].includes(status)) {
            lead.last_contact = new Date().toISOString();
        }

        storeLead(lead);
        addToHistory('status_updated', leadId, { status });
    } catch (error) {
        console.error('Failed to update lead status:', error);
    }
}

/**
 * Update lead consent preferences
 * @param {string} leadId - Lead identifier
 * @param {Object} consent - Consent preferences
 * @param {boolean} consent.email - Email consent
 * @param {boolean} consent.sms - SMS consent
 */
export function updateLeadConsent(leadId, consent) {
    try {
        const lead = getLead(leadId);
        if (!lead) {
            throw new Error(`Lead not found: ${leadId}`);
        }

        if (typeof consent.email !== 'undefined') {
            lead.consent_email = consent.email;
        }
        if (typeof consent.sms !== 'undefined') {
            lead.consent_sms = consent.sms;
        }

        lead.updated_at = new Date().toISOString();
        storeLead(lead);
        addToHistory('consent_updated', leadId, consent);
    } catch (error) {
        console.error('Failed to update lead consent:', error);
    }
}

/**
 * Get leads by status
 * @param {string} status - Lead status to filter by
 * @returns {Array} Array of leads matching the status
 */
export function getLeadsByStatus(status) {
    try {
        const leads = getAllLeads();
        return leads.filter(l => l.status === status);
    } catch (error) {
        console.error('Failed to get leads by status:', error);
        return [];
    }
}

/**
 * Get leads that need nurturing (status='new' and older than threshold)
 * @param {number} hoursThreshold - Hours since creation to consider abandoned
 * @returns {Array} Array of leads needing nurture
 */
export function getLeadsNeedingNurture(hoursThreshold = 24) {
    try {
        const leads = getAllLeads();
        const thresholdTime = Date.now() - (hoursThreshold * 60 * 60 * 1000);

        return leads.filter(lead => {
            if (lead.status !== 'new') return false;
            if (!lead.consent_email) return false;

            const createdAt = new Date(lead.estimate_created_at || lead.created_at).getTime();
            return createdAt < thresholdTime;
        });
    } catch (error) {
        console.error('Failed to get leads needing nurture:', error);
        return [];
    }
}

/**
 * Check if a lead has email consent
 * @param {string} leadId - Lead identifier
 * @returns {boolean} True if lead has email consent
 */
export function hasEmailConsent(leadId) {
    const lead = getLead(leadId);
    return lead ? !!lead.consent_email : false;
}

/**
 * Check if a lead has SMS consent
 * @param {string} leadId - Lead identifier
 * @returns {boolean} True if lead has SMS consent
 */
export function hasSMSConsent(leadId) {
    const lead = getLead(leadId);
    return lead ? !!lead.consent_sms : false;
}

/**
 * Delete a lead
 * @param {string} leadId - Lead identifier
 */
export function deleteLead(leadId) {
    try {
        const leads = getAllLeads();
        const filteredLeads = leads.filter(l => l.lead_id !== leadId);

        localStorage.setItem(STORAGE_KEYS.NURTURE_LEADS, JSON.stringify(filteredLeads));
        addToHistory('lead_deleted', leadId);
    } catch (error) {
        console.error('Failed to delete lead:', error);
    }
}

/**
 * Clear all lead data
 */
export function clearAllLeads() {
    try {
        localStorage.removeItem(STORAGE_KEYS.NURTURE_LEADS);
        localStorage.removeItem(STORAGE_KEYS.LEAD_HISTORY);
    } catch (error) {
        console.error('Failed to clear all leads:', error);
    }
}

/**
 * Get lead statistics
 * @returns {Object} Lead statistics
 */
export function getLeadStats() {
    try {
        const leads = getAllLeads();

        return {
            total: leads.length,
            new: leads.filter(l => l.status === 'new').length,
            contacted: leads.filter(l => l.status === 'contacted').length,
            converted: leads.filter(l => l.status === 'converted').length,
            unsubscribed: leads.filter(l => l.status === 'unsubscribed').length,
            withEmailConsent: leads.filter(l => l.consent_email).length,
            withSMSConsent: leads.filter(l => l.consent_sms).length
        };
    } catch (error) {
        console.error('Failed to get lead stats:', error);
        return {
            total: 0,
            new: 0,
            contacted: 0,
            converted: 0,
            unsubscribed: 0,
            withEmailConsent: 0,
            withSMSConsent: 0
        };
    }
}

/**
 * Get lead history
 * @param {string} leadId - Optional lead ID to filter history
 * @returns {Array} History entries
 */
export function getLeadHistory(leadId = null) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.LEAD_HISTORY);
        if (!stored) {
            return [];
        }

        const history = JSON.parse(stored);

        if (leadId) {
            return history.filter(h => h.lead_id === leadId);
        }

        return history;
    } catch (error) {
        console.error('Failed to get lead history:', error);
        return [];
    }
}

/**
 * Add entry to lead history
 * @param {string} action - Action type
 * @param {string} leadId - Lead identifier
 * @param {Object} metadata - Additional metadata
 */
function addToHistory(action, leadId, metadata = {}) {
    try {
        const history = getLeadHistory();

        history.push({
            action,
            lead_id: leadId,
            timestamp: new Date().toISOString(),
            metadata
        });

        // Keep only last 1000 entries
        const trimmedHistory = history.slice(-1000);

        localStorage.setItem(STORAGE_KEYS.LEAD_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
        console.error('Failed to add to history:', error);
    }
}

/**
 * Export lead data for backup or migration
 * @returns {Object} All lead data
 */
export function exportLeadData() {
    return {
        leads: getAllLeads(),
        history: getLeadHistory(),
        stats: getLeadStats(),
        exported_at: new Date().toISOString()
    };
}

/**
 * Import lead data from backup
 * @param {Object} data - Data to import
 */
export function importLeadData(data) {
    try {
        if (data.leads && Array.isArray(data.leads)) {
            localStorage.setItem(STORAGE_KEYS.NURTURE_LEADS, JSON.stringify(data.leads));
        }

        if (data.history && Array.isArray(data.history)) {
            localStorage.setItem(STORAGE_KEYS.LEAD_HISTORY, JSON.stringify(data.history));
        }
    } catch (error) {
        console.error('Failed to import lead data:', error);
    }
}
