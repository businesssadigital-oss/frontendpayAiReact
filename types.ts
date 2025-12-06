export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // Changed from union type to string for dynamic categories
  image: string;
  rating: number;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string; // Link order to user
  date: string;
  items: CartItem[];
  total: number;
  status: 'completed'; // Automatic delivery assumes completed immediately for digital
  deliveryCodes: Record<string, string[]>; // Map productId to list of codes
  paymentMethod?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For mock auth only
  role: 'admin' | 'user';
  balance: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'paypal' | 'wallet';
  isActive: boolean;
  description: string;
}

export type ViewState = 'home' | 'shop' | 'cart' | 'orders' | 'checkout' | 'dashboard';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

// Platform settings shape (site-wide editable values)
export interface Settings {
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  footerText?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    telegram?: string;
    youtube?: string;
  };
}
