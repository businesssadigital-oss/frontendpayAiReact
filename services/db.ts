import { Product, User, Order, Category, PaymentMethod, CartItem, Review } from '../types';
import { MOCK_PRODUCTS, MOCK_USERS, DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, generateFakeCode, DEFAULT_SETTINGS } from '../constants';

// --- Arabic Date Formatter ---
export const formatDateArabic = (dateString: string): string => {
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  const date = new Date(dateString);
  const day = date.getDate();
  const month = arabicMonths[date.getMonth()];
  const year = date.getFullYear();
  const dayName = arabicDays[date.getDay()];
  
  return `${dayName} ${day} ${month} ${year}`;
};

// Prefer environment-controlled backend URL (supports local dev and prod).
const RAW_API = (import.meta.env.VITE_API_URL as string) || 'https://backendpay-1.onrender.com';
// Default API_URL (will be overridden if a local backend is detected)
let API_URL = RAW_API.replace(/\/$/, '').replace(/\/api$/, '') + '/api';

const STORAGE_KEYS = {
  PRODUCTS: 'matajir_products',
  USERS: 'matajir_users',
  ORDERS: 'matajir_orders',
  CATEGORIES: 'matajir_categories',
  PAYMENT_METHODS: 'matajir_payments',
  REVIEWS: 'matajir_reviews',
  INVENTORY: 'matajir_inventory'
  ,SETTINGS: 'matajir_settings'
};

let useBackend = false;

// Helper for API calls
const api = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    // Ensure endpoint starts with a single '/'
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${ep}`;

    // Merge headers and include Authorization if token exists
    const headers: Record<string, string> = {};
    // If caller provided headers, copy them
    if (options.headers) {
      try {
        const h = options.headers as any;
        if (h instanceof Headers) {
          h.forEach((v: string, k: string) => { headers[k] = v; });
        } else {
          Object.assign(headers, h);
        }
      } catch (e) {
        // ignore
      }
    }

    // If body is FormData, do not set Content-Type (browser will set multipart boundary)
    const bodyIsForm = options.body instanceof FormData;
    if (!bodyIsForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    const token = localStorage.getItem('matajir_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      ...options,
      headers,
    } as RequestInit);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    if (useBackend && endpoint !== '/health') {
      console.error(`API Call Failed [${endpoint}]:`, error.message || String(error));
    }
    throw error;
  }
};

// --- LocalStorage Helpers (Fallback) ---
const getLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch (error) {
    console.error(`LocalStorage Error [${key}]:`, error);
    return defaultVal;
  }
};

const setLocal = (key: string, val: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (error) {
    console.error(`LocalStorage Write Error [${key}]:`, error);
  }
};

export const db = {
  // --- Initialization ---
  init: async () => {
    // Reset state to ensure we don't get stuck in backend mode if re-initialized
    useBackend = false; 

    // Try to detect a local backend first (useful during development).
    const candidates = [ 'https://backendpay-1.onrender.com', RAW_API.replace(/\/$/, '') ];
    for (const cand of candidates) {
      try {
        const healthUrl = `${cand.replace(/\/$/, '')}/api/health`;
        const resp = await fetch(healthUrl, { method: 'GET' });
        if (resp.ok) {
          API_URL = cand.replace(/\/$/, '').replace(/\/api$/, '') + '/api';
          useBackend = true;
          console.log(`✅ Connected to Backend API at ${API_URL}`);
          break;
        }
      } catch (err) {
        // ignore and try next
      }
    }

    if (!useBackend) {
      console.log('ℹ️ Backend unavailable. Running in Offline Mode (LocalStorage).');
      useBackend = false;
      
      // Seed LocalStorage if empty
      if (!getLocal(STORAGE_KEYS.PRODUCTS, null)) setLocal(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
      if (!getLocal(STORAGE_KEYS.USERS, null)) setLocal(STORAGE_KEYS.USERS, MOCK_USERS);
      if (!getLocal(STORAGE_KEYS.CATEGORIES, null)) setLocal(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      if (!getLocal(STORAGE_KEYS.PAYMENT_METHODS, null)) setLocal(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
  if (!getLocal(STORAGE_KEYS.SETTINGS, null)) setLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
  },

  // Check connection status
  isConnected: () => useBackend,

  // --- Products ---
  getProducts: async (): Promise<Product[]> => {
    if (useBackend) return api<Product[]>('/products');
    return getLocal(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
  },

  addProduct: async (product: Product): Promise<void> => {
    if (useBackend) return api('/products', { method: 'POST', body: JSON.stringify(product) });
    
    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    setLocal(STORAGE_KEYS.PRODUCTS, [...products, product]);
  },

  updateProduct: async (product: Product): Promise<void> => {
    if (useBackend) return api(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });

    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    setLocal(STORAGE_KEYS.PRODUCTS, products.map(p => p.id === product.id ? product : p));
  },

  deleteProduct: async (id: string): Promise<void> => {
    if (useBackend) return api(`/products/${id}`, { method: 'DELETE' });

    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    setLocal(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));
  },

  // --- Users ---
  getUsers: async (): Promise<User[]> => {
    if (useBackend) {
      // Only call backend users endpoint when a token is present (admin-only resource).
      const token = localStorage.getItem('matajir_token');
      if (!token) {
        // Fallback to local storage data to avoid 401 responses when no token exists
        return getLocal(STORAGE_KEYS.USERS, MOCK_USERS);
      }
      return api<User[]>('/users');
    }
    return getLocal(STORAGE_KEYS.USERS, MOCK_USERS);
  },

  createUser: async (user: User): Promise<User> => {
    if (useBackend) {
      const res: any = await api('/auth/register', { method: 'POST', body: JSON.stringify(user) });
      // backend returns { user, token }
      if (res && res.token) localStorage.setItem('matajir_token', res.token);
      return res.user || res;
    }

    const users = getLocal<User[]>(STORAGE_KEYS.USERS, []);
    if (users.find(u => u.email === user.email)) throw new Error('البريد الإلكتروني مسجل مسبقاً');
    
    setLocal(STORAGE_KEYS.USERS, [...users, user]);
    return user;
  },

  loginUser: async (email: string, pass: string): Promise<User> => {
    if (useBackend) {
      const res: any = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
      if (res && res.token) localStorage.setItem('matajir_token', res.token);
      return res.user || res;
    }

    const users = getLocal<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) throw new Error('بيانات الدخول غير صحيحة');
    return user;
  },

  // --- Orders ---
  getOrders: async (): Promise<Order[]> => {
    if (useBackend) return api<Order[]>('/orders');
    return getLocal(STORAGE_KEYS.ORDERS, []);
  },

  createOrder: async (userId: string, items: CartItem[], total: number, paymentMethod: string = 'unknown'): Promise<Order> => {
    if (useBackend) return api<Order>('/orders', { method: 'POST', body: JSON.stringify({ userId, items, total, paymentMethod }) });

    // Fallback Logic
    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const orders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    const deliveryCodes: Record<string, string[]> = {};
    const inventory = getLocal<Record<string, string[]>>(STORAGE_KEYS.INVENTORY, {});

    // Verify Stock & Deduct
    const updatedProducts = products.map(p => {
      const item = items.find(i => i.id === p.id);
      if (item) {
        if (p.stock < item.quantity) throw new Error(`الكمية غير متوفرة للمنتج: ${p.name}`);
        
        // Generate or fetch codes --- mark sold codes in inventory (do not lose history)
        const codes: string[] = [];
        const productCodes: any[] = inventory[p.id] || [];

        for (let i = 0; i < item.quantity; i++) {
          // Find next available code (plain string or object with non-sold status)
          const idx = productCodes.findIndex(c => (typeof c === 'string') || (c && c.status && c.status !== 'sold'));
          if (idx !== -1) {
            const entry = productCodes[idx];
            const codeVal = typeof entry === 'string' ? entry : entry.code;
            // Mark as sold in inventory (normalize to object)
            productCodes[idx] = { code: codeVal, status: 'sold' };
            codes.push(codeVal);
          } else {
            // No available codes in inventory - generate fallback code and record it as sold
            const gen = generateFakeCode(p.category);
            codes.push(gen);
            productCodes.push({ code: gen, status: 'sold' });
          }
        }

        // Save updated inventory (we keep sold entries, so history exists)
        inventory[p.id] = productCodes;
        deliveryCodes[p.id] = codes;

        // Update product: recompute availableCodes and stock from inventory
        const pAny = p as any;
        const availableCodesArr = (inventory[p.id] || []).filter((c: any) => typeof c === 'string' || (c && c.status && c.status !== 'sold')).map((c: any) => typeof c === 'string' ? c : c.code);
        return {
          ...p,
          stock: availableCodesArr.length,
          availableCodes: availableCodesArr
        };
      }
      return p;
    });

    setLocal(STORAGE_KEYS.PRODUCTS, updatedProducts);
    setLocal(STORAGE_KEYS.INVENTORY, inventory);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      userId,
      date: new Date().toISOString(),
      items,
      total,
      status: 'completed',
      deliveryCodes,
      paymentMethod
    };

    setLocal(STORAGE_KEYS.ORDERS, [...orders, newOrder]);
    return newOrder;
  },

  // --- Categories ---
  getCategories: async (): Promise<Category[]> => {
    if (useBackend) return api<Category[]>('/categories');
    return getLocal(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  },

  addCategory: async (category: Category): Promise<void> => {
    if (useBackend) return api('/categories', { method: 'POST', body: JSON.stringify(category) });
    const cats = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    setLocal(STORAGE_KEYS.CATEGORIES, [...cats, category]);
  },

  deleteCategory: async (id: string): Promise<void> => {
    if (useBackend) return api(`/categories/${id}`, { method: 'DELETE' });
    const cats = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    setLocal(STORAGE_KEYS.CATEGORIES, cats.filter(c => c.id !== id));
  },

  // --- Payment Methods ---
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    if (useBackend) return api<PaymentMethod[]>('/payment-methods');
    return getLocal(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
  },

  updatePaymentMethod: async (method: PaymentMethod): Promise<void> => {
    if (useBackend) return api(`/payment-methods/${method.id}`, { method: 'PUT', body: JSON.stringify(method) });
    const methods = getLocal<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);
    setLocal(STORAGE_KEYS.PAYMENT_METHODS, methods.map(m => m.id === method.id ? method : m));
  },

  // --- Inventory ---
  getInventory: async (): Promise<Record<string, any[]>> => {
    if (useBackend) {
       // Backend aggregates this from products
       const products = await api<any[]>('/products');
       const inv: Record<string, string[]> = {};
       products.forEach(p => inv[p.id] = p.availableCodes || []);
       return inv;
    }
    return getLocal(STORAGE_KEYS.INVENTORY, {});
  },

  addCodes: async (productId: string, codes: string[]): Promise<any> => {
    // Use central /codes endpoint to insert Code documents; backend will also update Product.stock/availableCodes
    if (useBackend) {
      return api('/codes', { method: 'POST', body: JSON.stringify({ productId, codes }) });
    }

    // Update Local Inventory
    const inventory = getLocal<Record<string, string[]>>(STORAGE_KEYS.INVENTORY, {});
    const currentCodes = inventory[productId] || [];
    inventory[productId] = [...currentCodes, ...codes];
    setLocal(STORAGE_KEYS.INVENTORY, inventory);

    // Update Product Stock Count
    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, stock: p.stock + codes.length, availableCodes: [...(p as any).availableCodes || [], ...codes] } : p
    );
    setLocal(STORAGE_KEYS.PRODUCTS, updatedProducts);
    return { count: codes.length };
  },

  // Fetch raw Code documents for a product
  getCodes: async (productId: string) => {
    if (useBackend) return api<any[]>(`/codes?productId=${productId}`);
    const inv = getLocal<Record<string, any[]>>(STORAGE_KEYS.INVENTORY, {});
    const raw = inv[productId] || [];
    // Normalize stored shapes: plain string => available, object => { code, status }
    const list = raw.map((c: any) => {
      if (typeof c === 'string') return { code: c, status: 'available' };
      return { code: c.code, status: c.status || 'available' };
    });
    return list;
  },

  getCodeStats: async (productId: string) => {
    if (useBackend) return api<any>(`/codes/stats/${productId}`);

    const inv = getLocal<Record<string, any[]>>(STORAGE_KEYS.INVENTORY, {});
    const raw = inv[productId] || [];

    // Available codes in inventory (treat plain strings as available)
    const available = raw.reduce((acc, cur) => {
      if (typeof cur === 'string') return acc + 1;
      return acc + ((cur && cur.status && cur.status !== 'sold') ? 1 : 0);
    }, 0);

    // Count sold codes from orders (covers generated codes not present in inventory)
    const orders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    let sold = 0;
    for (const order of orders) {
      if (order.deliveryCodes && order.deliveryCodes[productId]) {
        sold += (order.deliveryCodes[productId] || []).length;
      }
    }

    const total = available + sold;
    return { productId, available, sold, total };
  },

  // --- Reviews ---
  getReviews: async (): Promise<Review[]> => {
    if (useBackend) return api<Review[]>('/reviews');
    return getLocal(STORAGE_KEYS.REVIEWS, []);
  },

  addReview: async (review: Review): Promise<void> => {
    if (useBackend) return api('/reviews', { method: 'POST', body: JSON.stringify(review) });

    const reviews = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, []);
    const newReviews = [...reviews, review];
    setLocal(STORAGE_KEYS.REVIEWS, newReviews);

    // Calculate Rating
    const productReviews = newReviews.filter(r => r.productId === review.productId);
    const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    setLocal(STORAGE_KEYS.PRODUCTS, products.map(p => 
      p.id === review.productId ? { ...p, rating: Number(avg.toFixed(1)) } : p
    ));
  },

  // --- Settings ---
  getSettings: async () => {
    if (useBackend) {
      try {
        const remote = await api('/settings');
        // Keep local cache in sync
        setLocal(STORAGE_KEYS.SETTINGS, remote);
        return remote;
      } catch (err) {
        console.warn('Failed to fetch settings from backend, falling back to local');
      }
    }
    return getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS as any);
  },

  updateSettings: async (settings: any) => {
    if (useBackend) {
      try {
        const saved = await api('/settings', { method: 'PUT', body: JSON.stringify(settings) });
        // Persist the authoritative copy locally as cache/fallback
        setLocal(STORAGE_KEYS.SETTINGS, saved);
        return saved;
      } catch (err) {
        console.warn('Failed to update settings on backend, saving locally', (err as any).message || String(err));
      }
    }
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  },

  // Upload logo image (File or data URL). If a File is provided and backend connected, send multipart/form-data.
  uploadLogo: async (fileOrDataUrl: File | string): Promise<string> => {
    if (!useBackend) {
      // Offline: if File, return dataUrl for preview; if string, return it
      if (typeof fileOrDataUrl === 'string') return fileOrDataUrl;
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(fileOrDataUrl as File);
      });
    }

    // Online / backend connected
    if (fileOrDataUrl instanceof File) {
      const form = new FormData();
      form.append('file', fileOrDataUrl);
      const token = localStorage.getItem('matajir_token');
      const res = await fetch(`${API_URL}/upload/logo`, {
        method: 'POST',
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Upload failed ${res.status}`);
      }
      const json = await res.json();
      return json.url || '';
    }

    // Received dataUrl string - send as JSON (backwards compatible)
    try {
      const result: any = await api('/upload/logo', { method: 'POST', body: JSON.stringify({ dataUrl: String(fileOrDataUrl) }) });
      return result.url || String(fileOrDataUrl);
    } catch (err) {
      console.warn('Logo upload failed, returning provided dataUrl', (err as any).message || String(err));
      return String(fileOrDataUrl);
    }
  },

  // --- Chargily Pay ---
  createChargilySession: async (amount: number): Promise<string> => {
      const currentUrl = window.location.origin;

      // If backend is connected, use it (Real Flow)
      if (useBackend) {
          const res = await api<{checkout_url: string}>('/chargily/checkout', { 
              method: 'POST',
              body: JSON.stringify({
                  amount,
                  success_url: `${currentUrl}/?payment_status=success`,
                  failure_url: `${currentUrl}/?payment_status=failed`
              })
          });
          return res.checkout_url;
      }
      
      // If backend is disconnected, simulate the flow (Demo Mode)
      // This allows the UI to be tested without running the server
      console.warn('⚠️ Offline Mode: Simulating Chargily Pay redirect');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `${currentUrl}/?payment_status=success`;
  },

  // --- PayPal ---
  createPayPalOrder: async (amount: number): Promise<{ id: string }> => {
     if (useBackend) return api('/paypal/create-order', { method: 'POST', body: JSON.stringify({ amount }) });
     throw new Error('Backend required for PayPal');
  },

  capturePayPalOrder: async (orderID: string): Promise<any> => {
     if (useBackend) return api('/paypal/capture-order', { method: 'POST', body: JSON.stringify({ orderID }) });
     throw new Error('Backend required for PayPal');
  },

  updateOrderPayPalId: async (orderId: string, paypalOrderId: string): Promise<void> => {
     if (useBackend) return api(`/orders/${orderId}/paypal/${paypalOrderId}`, { method: 'PUT' });
     // ⚠️ Offline mode: just log for now
     console.log(`Offline Mode: Order ${orderId} linked to PayPal ${paypalOrderId}`);
  }
};
