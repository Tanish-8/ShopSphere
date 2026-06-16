import { createContext, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";

const GUEST_CART_KEY = "shopsphere_cart_guest";

function getCartStorageKey(userId) {
  return userId ? `shopsphere_cart_${userId}` : GUEST_CART_KEY;
}

function getStoredCart(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.productId);
  } catch {
    return [];
  }
}

function persistCart(storageKey, items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export const CartContext = createContext(null);

function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || null;
  const storageKey = useMemo(() => getCartStorageKey(userId), [userId]);
  const [cartItems, setCartItems] = useState(() => getStoredCart(storageKey));

  useEffect(() => {
    setCartItems(getStoredCart(storageKey));
  }, [storageKey]);

  const addItem = (item, quantity = 1) => {
    if (!item?.productId) return;
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.productId === item.productId);

      let updatedItems;
      if (existing) {
        updatedItems = prev.map((cartItem) =>
          cartItem.productId === item.productId
            ? {
                ...cartItem,
                quantity: Math.min(
                  cartItem.quantity + safeQuantity,
                  Number(item.countInStock ?? cartItem.countInStock ?? Infinity)
                )
              }
            : cartItem
        );
      } else {
        updatedItems = [
          ...prev,
          {
            ...item,
            quantity: Math.min(safeQuantity, Number(item.countInStock ?? Infinity))
          }
        ];
      }

      persistCart(storageKey, updatedItems);
      return updatedItems;
    });
  };

  const removeItem = (productId) => {
    setCartItems((prev) => {
      const updatedItems = prev.filter((item) => item.productId !== productId);
      persistCart(storageKey, updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = (productId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems((prev) => {
      const updatedItems = prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.min(safeQuantity, Number(item.countInStock ?? Infinity))
            }
          : item
      );
      persistCart(storageKey, updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    persistCart(storageKey, []);
  };

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cartItems]
  );

  const totalItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalPrice,
      totalItemCount
    }),
    [cartItems, totalPrice, totalItemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
