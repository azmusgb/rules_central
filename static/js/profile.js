'use strict';
/* =============================================================
 * Quantum Hierarchy Viewer – Enhanced Profile Module  •  v2.1
 * -------------------------------------------------------------
 * Author: William Rahe & AI Assistant  •  July 2025
 * 
 * Key Improvements:
 *  - Better code organization and structure
 *  - Enhanced documentation and comments
 *  - Consistent coding style
 *  - Improved error handling
 *  - Maintained all existing functionality
 * 
 * Responsibilities:
 *  • Persist user preferences (theme, history, favorites, layout, etc.)
 *  • Abstract localStorage access behind a stable API
 *  • Emit a single CustomEvent so other modules can react to updates
 *  • Provide helper utilities (effectiveTheme, addSearchQuery, ...)
 * ===========================================================*/

// ===================================================================
// SECTION 1: CONSTANTS AND DEFAULTS
// ===================================================================

/**
 * Key used for storing profile data in localStorage
 * @constant {string}
 */
const STORAGE_KEY = "qc_profile_v1";

/**
 * Maximum number of search history entries to retain
 * @constant {number}
 */
const MAX_HISTORY_ENTRIES = 50;

/**
 * Event name emitted when profile updates occur
 * @constant {string}
 */
export const PROFILE_UPDATED_EVENT = "qc:profile:updated";

/**
 * Default profile structure with initial values
 * @constant {Object}
 */
const DEFAULT_PROFILE = Object.freeze({
  /* UI Preferences */
  theme: "system",            // "light" | "dark" | "system"
  sidebarCollapsed: false,
  shortcutsEnabled: true,

  /* User Data */
  searchHistory: [],          // Array<string>
  favourites: [],             // Array<nodeId>
  lastVisitedNodeId: null,    // string|null

  /* Behavior Settings */
  toastDuration: 2500,        // milliseconds
  experimentalFeatures: false,

  /* Metadata */
  created: new Date().toISOString(),
  updated: new Date().toISOString()
});

// ===================================================================
// SECTION 2: UTILITY FUNCTIONS
// ===================================================================

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
const getCurrentTimestamp = () => new Date().toISOString();

/**
 * Safely parse JSON with error handling
 * @param {string} json - JSON string to parse
 * @returns {Object|null} Parsed object or null on error
 */
const safelyParseJSON = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn("[Profile] Corrupt JSON data - resetting to defaults.", error);
    return null;
  }
};

/**
 * Dispatch profile update event
 * @param {Object} profile - Current profile data
 */
const dispatchProfileUpdate = (profile) => {
  window.dispatchEvent(new CustomEvent(
    PROFILE_UPDATED_EVENT, 
    { detail: profile }
  ));
};

/**
 * Write profile data to localStorage
 * @param {Object} data - Profile data to store
 */
const writeToStorage = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// ===================================================================
// SECTION 3: CORE PROFILE MANAGEMENT
// ===================================================================

/**
 * Load profile data from localStorage
 * @returns {Object} Current profile data
 */
export function loadProfile() {
  const storedData = safelyParseJSON(localStorage.getItem(STORAGE_KEY));
  
  if (!storedData) {
    writeToStorage(DEFAULT_PROFILE);
    return { ...DEFAULT_PROFILE };
  }
  
  return { ...DEFAULT_PROFILE, ...storedData };
}

/**
 * Save complete profile data
 * @param {Object} profileData - Profile data to save
 * @returns {Object|null} Saved profile or null on error
 */
export function saveProfile(profileData) {
  const completeProfile = { 
    ...DEFAULT_PROFILE, 
    ...profileData, 
    updated: getCurrentTimestamp() 
  };

  try {
    writeToStorage(completeProfile);
    dispatchProfileUpdate(completeProfile);
    return completeProfile;
  } catch (error) {
    console.error("[Profile] Failed to save profile", error);
    return null;
  }
}

/**
 * Update profile with partial data
 * @param {Object} partialUpdate - Partial profile data to merge
 * @returns {Object} Updated profile
 */
export function updateProfile(partialUpdate) {
  return saveProfile({ ...loadProfile(), ...partialUpdate });
}

/**
 * Reset profile to default values (preserves creation timestamp)
 * @returns {Object} Reset profile data
 */
export function resetProfile() {
  const currentProfile = loadProfile();
  const resetProfile = {
    ...DEFAULT_PROFILE,
    created: currentProfile.created, // Preserve original creation date
    updated: getCurrentTimestamp()
  };

  writeToStorage(resetProfile);
  dispatchProfileUpdate(resetProfile);
  return resetProfile;
}

// ===================================================================
// SECTION 4: THEME MANAGEMENT
// ===================================================================

/**
 * Get the effective theme considering system preferences
 * @returns {string} Current effective theme ("light" or "dark")
 */
export function getEffectiveTheme() {
  const { theme } = loadProfile();
  
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches 
      ? "light" 
      : "dark";
  }
  
  return theme;
}

/**
 * Cycle through available themes (light → dark → system → light)
 * @returns {Object} Updated profile
 */
export function toggleTheme() {
  const currentTheme = loadProfile().theme;
  let nextTheme;
  
  switch (currentTheme) {
    case "light":
      nextTheme = "dark";
      break;
    case "dark":
      nextTheme = "system";
      break;
    default:
      nextTheme = "light";
  }
  
  return updateProfile({ theme: nextTheme });
}

// ===================================================================
// SECTION 5: SEARCH HISTORY MANAGEMENT
// ===================================================================

/**
 * Add a new search query to history (deduplicates and limits length)
 * @param {string} query - Search query to add
 * @returns {Object} Updated profile
 */
export function addSearchQuery(query) {
  const { searchHistory } = loadProfile();
  
  // Deduplicate and limit history length
  const updatedHistory = [
    query,
    ...searchHistory.filter(existingQuery => existingQuery !== query)
  ].slice(0, MAX_HISTORY_ENTRIES);
  
  return updateProfile({ searchHistory: updatedHistory });
}

// ===================================================================
// SECTION 6: FAVORITES MANAGEMENT
// ===================================================================

/**
 * Add a node to favorites if not already present
 * @param {string} nodeId - ID of node to favorite
 * @returns {Object} Updated profile
 */
export function addFavourite(nodeId) {
  const { favourites } = loadProfile();
  
  if (favourites.includes(nodeId)) {
    return loadProfile(); // No change needed
  }
  
  return updateProfile({ 
    favourites: [...favourites, nodeId] 
  });
}

/**
 * Remove a node from favorites
 * @param {string} nodeId - ID of node to remove
 * @returns {Object} Updated profile
 */
export function removeFavourite(nodeId) {
  const { favourites } = loadProfile();
  
  return updateProfile({
    favourites: favourites.filter(id => id !== nodeId)
  });
}

// ===================================================================
// SECTION 7: EVENT LISTENERS
// ===================================================================

/**
 * Handle storage events from other tabs
 */
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    const updatedProfile = safelyParseJSON(event.newValue) || { ...DEFAULT_PROFILE };
    dispatchProfileUpdate(updatedProfile);
  }
});

/**
 * Watch for system theme changes when in "system" mode
 */
const systemThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
systemThemeMediaQuery.addEventListener("change", () => {
  if (loadProfile().theme === "system") {
    dispatchProfileUpdate(loadProfile());
  }
});

// ===================================================================
// SECTION 8: INITIALIZATION
// ===================================================================

// Dispatch initial profile load event
dispatchProfileUpdate(loadProfile());