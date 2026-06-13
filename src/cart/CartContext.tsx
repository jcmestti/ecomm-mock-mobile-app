import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Product } from '../data/products';

export type CartItem = { product: Product; quantity: number };

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    addItem: (product) => setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      return existing
        ? current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { product, quantity: 1 }];
    }),
    removeItem: (productId) => setItems((current) => current.filter((item) => item.product.id !== productId)),
    setQuantity: (productId, quantity) => setItems((current) => quantity <= 0
      ? current.filter((item) => item.product.id !== productId)
      : current.map((item) => item.product.id === productId ? { ...item, quantity } : item)),
    clearCart: () => setItems([]),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
