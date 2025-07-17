/**
 * Encryption Toggle Service
 * Provides a way to check if encryption is globally enabled
 */

const { supabase } = require('../config/database');
let encryptionEnabled = true; // Default to enabled
let lastCheckTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Check if encryption is globally enabled
 * @returns {Promise<boolean>} Whether encryption is enabled
 */
async function isEncryptionEnabled() {
  const now = Date.now();
  
  // Use cached value if available and not expired
  if (now - lastCheckTime < CACHE_TTL) {
    return encryptionEnabled;
  }
  
  try {
    // Get encryption status from database
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'encryption_enabled')
      .single();
    
    if (error) {
      console.error('Error fetching encryption status:', error);
      return true; // Default to enabled on error
    }
    
    // Default to enabled if setting doesn't exist
    encryptionEnabled = !data ? true : data.value === 'true';
    lastCheckTime = now;
    
    return encryptionEnabled;
  } catch (error) {
    console.error('Error checking encryption status:', error);
    // Default to enabled if there's an error
    return true;
  }
}

/**
 * Reset the cache to force a fresh check
 */
function resetCache() {
  lastCheckTime = 0;
}

module.exports = {
  isEncryptionEnabled,
  resetCache
};