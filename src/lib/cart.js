// Cart management utilities for localStorage

const CART_KEY = 'lifecafe_cart';

/**
 * Get the current cart from localStorage
 * @returns {Object} Cart object with tableNumber and items array
 */
export function getCart() {
  if (typeof window === 'undefined') return { tableNumber: null, items: [] };

  try {
    const cartData = localStorage.getItem(CART_KEY);
    if (!cartData) {
      return { tableNumber: null, items: [] };
    }
    return JSON.parse(cartData);
  } catch (error) {
    console.error('Error reading cart:', error);
    return { tableNumber: null, items: [] };
  }
}

/**
 * Save cart to localStorage
 * @param {Object} cart - Cart object to save
 */
export function saveCart(cart) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

/**
 * Add an item to the cart
 * @param {Object} item - Item to add
 * @param {string} tableNumber - Table number
 */
export function addToCart(item, tableNumber) {
  const cart = getCart();

  // Update table number if provided
  if (tableNumber) {
    cart.tableNumber = tableNumber;
  }

  // Add unique ID to item
  const cartItem = {
    ...item,
    cartId: Date.now() + Math.random(), // Unique ID for cart item
  };

  cart.items.push(cartItem);
  saveCart(cart);

  return cart;
}

/**
 * Remove an item from the cart by cartId
 * @param {string} cartId - Unique cart item ID
 */
export function removeFromCart(cartId) {
  const cart = getCart();
  cart.items = cart.items.filter(item => item.cartId !== cartId);
  saveCart(cart);
  return cart;
}

/**
 * Update an item quantity in the cart
 * @param {string} cartId - Unique cart item ID
 * @param {number} quantity - New quantity
 */
export function updateCartItemQuantity(cartId, quantity) {
  const cart = getCart();
  const item = cart.items.find(item => item.cartId === cartId);

  if (item) {
    item.quantity = Math.max(1, quantity); // Minimum quantity of 1
  }

  saveCart(cart);
  return cart;
}

/**
 * Clear all items from the cart
 */
export function clearCart() {
  const cart = { tableNumber: null, items: [] };
  saveCart(cart);
  return cart;
}

/**
 * Get cart item count
 * @returns {number} Total number of items in cart
 */
export function getCartItemCount() {
  const cart = getCart();
  return cart.items.length;
}

/**
 * Get cart total price
 * @returns {number} Total price of all items in cart
 */
export function getCartTotal() {
  const cart = getCart();
  return cart.items.reduce((total, item) => {
    return total + (item.price || 0) * (item.quantity || 1);
  }, 0);
}

/**
 * Update the table number for the current cart
 * @param {string} tableNumber - New table number
 */
export function updateCartTableNumber(tableNumber) {
  const cart = getCart();
  cart.tableNumber = tableNumber;
  saveCart(cart);
  return cart;
}
