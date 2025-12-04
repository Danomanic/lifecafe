import { MENU_SKIP_FIELDS } from './constants';

/**
 * Recursively searches through menu data to find an item by slug
 * @param {Object} menuData - The complete menu data object
 * @param {string} slug - The slug to search for
 * @returns {Object|null} - The found item or null
 */
export function findItemBySlug(menuData, slug) {
  const searchObject = (obj) => {
    // If this object has an items array, search it
    if (obj && Array.isArray(obj.items)) {
      const found = obj.items.find(item => item.slug === slug);
      if (found) return found;
    }

    // If this is an object, recursively search its properties
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        // Skip non-category fields
        if (MENU_SKIP_FIELDS.includes(key)) {
          continue;
        }

        const found = searchObject(obj[key]);
        if (found) return found;
      }
    }

    return null;
  };

  // Search through all sections in menuData
  for (const sectionKey of Object.keys(menuData)) {
    const found = searchObject(menuData[sectionKey]);
    if (found) return found;
  }

  return null;
}

/**
 * Get default option values for an item
 * @param {Object} item - The menu item
 * @returns {Object} - Object containing default option values
 */
export function getDefaultOptions(item) {
  if (!item || !item.options) return {};

  const defaults = {};

  Object.keys(item.options).forEach((optionKey) => {
    const options = item.options[optionKey];
    if (Array.isArray(options) && options.length > 0) {
      // Check if this option has a default in collapsibleOptions
      if (item.collapsibleOptions && item.collapsibleOptions[optionKey]) {
        defaults[optionKey] = item.collapsibleOptions[optionKey];
      } else {
        // Otherwise use first option as default
        defaults[optionKey] = typeof options[0] === 'object' ? options[0].value : options[0];
      }
    }
  });

  return defaults;
}
