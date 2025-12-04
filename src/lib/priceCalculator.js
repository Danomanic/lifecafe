/**
 * Calculate the price of an item based on its base price and selected options
 * @param {Object} item - The menu item object
 * @param {Object} selectedOptions - The selected options for the item
 * @returns {number|null} - The calculated price or null if no price found
 */
export function calculateItemPrice(item, selectedOptions) {
  // If item has a base price and no options, use base price
  if (item.price && !item.options) {
    return item.price;
  }

  // If item has options, sum up all option prices
  if (item.options) {
    let totalPrice = 0;
    let hasAnyPrice = false;

    for (const optionKey in item.options) {
      const options = item.options[optionKey];
      if (Array.isArray(options) && typeof options[0] === 'object') {
        const selected = options.find(opt => opt.value === selectedOptions[optionKey]);
        if (selected && selected.price) {
          totalPrice += selected.price;
          hasAnyPrice = true;
        }
      }
    }

    // If we found any prices in options, return the total
    if (hasAnyPrice) {
      return totalPrice;
    }

    // Otherwise, if item has base price, use that
    if (item.price) {
      return item.price;
    }
  }

  return null;
}
