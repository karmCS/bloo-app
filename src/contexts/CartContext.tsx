import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Meal, getOrCreateCartSessionId } from '../lib/supabase';

interface CartItemWithMeal {
  id: string;
  meal: Meal;
  quantity: number;
}

interface CartContextType {
  items: CartItemWithMeal[];
  totalItems: number;
  totalPrice: number;
  addToCart: (meal: Meal) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionId = getOrCreateCartSessionId();

  const fetchCartItems = async () => {
    try {
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId);

      if (cartError) throw cartError;

      if (!cartItems || cartItems.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const mealIds = cartItems.map((item) => item.meal_id);
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .in('id', mealIds);

      if (mealsError) throw mealsError;

      const itemsWithMeals = cartItems.map((cartItem) => ({
        id: cartItem.id,
        meal: meals?.find((m) => m.id === cartItem.meal_id)!,
        quantity: cartItem.quantity,
      })).filter((item) => item.meal);

      setItems(itemsWithMeals);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const addToCart = async (meal: Meal) => {
    try {
      const existingItem = items.find((item) => item.meal.id === meal.id);

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + 1);
      } else {
        const { data, error } = await supabase
          .from('cart_items')
          .insert([
            {
              session_id: sessionId,
              meal_id: meal.id,
              quantity: 1,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setItems([...items, { id: data.id, meal, quantity: 1 }]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.meal.price ?? 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
