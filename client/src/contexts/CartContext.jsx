import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useToast } from "./ToastContext";

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
  const toast = useToast();
  const userId = user?._id || null;
  const storageKey = useMemo(() => getCartStorageKey(userId), [userId]);
  const [cartItems, setCartItems] = useState(() => getStoredCart(storageKey));

  useEffect(() => {
    setCartItems(getStoredCart(storageKey));
  }, [storageKey]);

  const addItem = useCallback((item, quantity = 1) => {
    if (!item?.productId) return;
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.productId === item.productId);

      let updatedItems;
      let isNew = true;
      if (existing) {
        isNew = false;
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

      // Subtotal calculation for toast
      const subtotal = updatedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

      if (isNew) {
        toast.success("Added to Cart", (
          <div className="space-y-1">
            <p className="font-extrabold text-gray-900 leading-tight">{item.name}</p>
            <p className="text-[10px] text-gray-500 font-bold">Quantity: {safeQuantity} &bull; Subtotal updated</p>
            <div className="flex gap-2.5 pt-1 text-[10px] font-black text-indigo-650">
              <a href="/cart" className="hover:underline">View Cart</a>
              <span className="text-gray-300">|</span>
              <a href="/products" className="hover:underline">Continue Shopping</a>
            </div>
          </div>
        ));
      } else {
        toast.success("Quantity Updated", (
          <div className="space-y-1">
            <p className="font-extrabold text-gray-900 leading-tight">{item.name}</p>
            <p className="text-[10px] text-gray-500 font-bold">Cart quantity increased to {existing.quantity + safeQuantity}</p>
            <div className="flex gap-2.5 pt-1 text-[10px] font-black text-indigo-650">
              <a href="/cart" className="hover:underline">View Cart</a>
              <span className="text-gray-300">|</span>
              <a href="/products" className="hover:underline">Continue Shopping</a>
            </div>
          </div>
        ));
      }

      return updatedItems;
    });
  }, [storageKey, toast]);

  const removeItem = useCallback((productId) => {
    setCartItems((prev) => {
      const removedItem = prev.find((item) => item.productId === productId);
      const updatedItems = prev.filter((item) => item.productId !== productId);
      persistCart(storageKey, updatedItems);
      
      if (removedItem) {
        toast.info("Removed from Cart", (
          <p className="font-bold text-gray-900 line-clamp-1">{removedItem.name}</p>
        ));
      }

      return updatedItems;
    });
  }, [storageKey, toast]);

  const updateQuantity = useCallback((productId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems((prev) => {
      const itemToUpdate = prev.find((item) => item.productId === productId);
      const updatedItems = prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.min(safeQuantity, Number(item.countInStock ?? Infinity))
            }
          : item
      );
      persistCart(storageKey, updatedItems);

      if (itemToUpdate) {
        toast.info("Cart Updated", (
          <p className="text-[10px] font-bold text-gray-500">Updated quantity of {itemToUpdate.name} to {safeQuantity}.</p>
        ));
      }

      return updatedItems;
    });
  }, [storageKey, toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    persistCart(storageKey, []);
    localStorage.removeItem("shopsphere_applied_coupon");
    toast.info("Cart Cleared", "All items have been removed from your shopping cart.");
  }, [storageKey, toast]);

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
    [cartItems, addItem, removeItem, updateQuantity, clearCart, totalPrice, totalItemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
