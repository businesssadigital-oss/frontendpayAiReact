import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProductGrid } from './components/ProductGrid';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { ChatWidget } from './components/ChatWidget';
import { ToastContainer } from './components/Toast';
import { ProductModal } from './components/ProductModal';
import { Footer } from './components/Footer';
import { PayPalPayment } from './components/PayPalPayment';
import { db, formatDateArabic } from './services/db';
import { Product, User, CartItem, ViewState, Order, Notification, Category, PaymentMethod, Review } from './types';
import { Trash2, Plus, Minus, CreditCard, ArrowRight, ShoppingBag, ArrowLeft, Search, Filter, Truck, X, Loader2, Gamepad2, Tv, Music, Smartphone, Gift, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  // Application State
  const [view, setView] = useState<ViewState>('home');
  const [isLoading, setIsLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Inventory state (cached for dashboard)
    const [inventory, setInventory] = useState<Record<string, any[]>>({});

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(200);

  // Tracking State
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');

  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');

  // Featured Brands Data
  const featuredBrands = [
    { id: 'itunes', name: 'iTunes', color: 'bg-gradient-to-br from-pink-500 to-violet-600', icon: Music },
    { id: 'psn', name: 'PlayStation', color: 'bg-[#00439c]', icon: Gamepad2 },
    { id: 'xbox', name: 'Xbox', color: 'bg-[#107c10]', icon: Gamepad2 },
    { id: 'steam', name: 'Steam', color: 'bg-[#171a21]', icon: Gamepad2 },
    { id: 'netflix', name: 'Netflix', color: 'bg-[#e50914]', icon: Tv },
    { id: 'spotify', name: 'Spotify', color: 'bg-[#1db954]', icon: Music },
    { id: 'pubg', name: 'PUBG', color: 'bg-[#f2a900]', icon: Smartphone },
    { id: 'amazon', name: 'Amazon', color: 'bg-[#ff9900]', icon: ShoppingBag },
  ];

  // --- Initialization ---

  useEffect(() => {
    const initApp = async () => {
        try {
            await db.init();
            
            // Session Persistence: Restore User
            const storedUser = localStorage.getItem('matajir_session_user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    setCurrentUser(user);
                    
                    // Session Persistence: Restore User-Specific Cart
                    const savedCart = localStorage.getItem(`matajir_cart_${user.id}`);
                    if (savedCart) {
                        try {
                            setCart(JSON.parse(savedCart));
                        } catch (e) {
                            localStorage.removeItem(`matajir_cart_${user.id}`);
                        }
                    }
                } catch (e) {
                    localStorage.removeItem('matajir_session_user');
                }
            } else {
                // No user logged in - try to load guest cart
                const guestCart = localStorage.getItem('matajir_cart_guest');
                if (guestCart) {
                    try {
                        setCart(JSON.parse(guestCart));
                    } catch (e) {
                        localStorage.removeItem('matajir_cart_guest');
                    }
                }
            }

            await refreshData();
            
            // Check for payment callback from Chargily
            const urlParams = new URLSearchParams(window.location.search);
            const status = urlParams.get('payment_status');
            
            if (status) {
                // Clear URL params
                window.history.replaceState({}, document.title, window.location.pathname);
                
                if (status === 'success') {
                    await handlePaymentReturn(true);
                } else if (status === 'failed') {
                    await handlePaymentReturn(false);
                }
            }
            
        } catch (error) {
            console.error("Failed to initialize app", error);
            addNotification('error', 'فشل في تحميل البيانات');
        } finally {
            setIsLoading(false);
        }
    };
    initApp();
  }, []);

  // Update Cart Storage whenever it changes (per-user storage)
  useEffect(() => {
      if (currentUser) {
          // Save cart for logged-in user
          localStorage.setItem(`matajir_cart_${currentUser.id}`, JSON.stringify(cart));
      } else if (cart.length > 0) {
          // Save guest cart temporarily (will be cleared on logout)
          localStorage.setItem('matajir_cart_guest', JSON.stringify(cart));
      }
  }, [cart, currentUser?.id]);

  const refreshData = async () => {
      const [p, c, u, o, inv, pm, r] = await Promise.all([
          db.getProducts(),
          db.getCategories(),
          db.getUsers(),
          db.getOrders(),
          db.getInventory(),
          db.getPaymentMethods(),
          db.getReviews()
      ]);
      setProducts(p);
      setCategories(c);
      setUsers(u);
      setOrders(o);
      setInventory(inv);
      setPaymentMethods(pm);
      setReviews(r);

      // Set initial payment method if not set
      if (!selectedPaymentMethodId) {
          const active = pm.find(m => m.isActive);
          if (active) setSelectedPaymentMethodId(active.id);
      }
  };

  const handlePaymentReturn = async (success: boolean) => {
      if (!success) {
          addNotification('error', 'تم إلغاء عملية الدفع');
          setView('cart');
          return;
      }
      
      const storedCart = localStorage.getItem('pending_cart');
      const storedUserId = localStorage.getItem('pending_user_id');
      
      if (storedCart && storedUserId) {
          const cartItems: CartItem[] = JSON.parse(storedCart);
          const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          setIsProcessingPayment(true);
          try {
              // Ensure we have current user context if page reloaded
              if (!currentUser && users.length > 0) {
                 const user = users.find(u => u.id === storedUserId);
                 if (user) setCurrentUser(user);
              }

              const newOrder = await db.createOrder(storedUserId, cartItems, total, 'Chargily Pay');
              setOrders(prev => [...prev, newOrder]);
              setCart([]);
              // Clear user-specific cart
              localStorage.removeItem(`matajir_cart_${storedUserId}`);
              localStorage.removeItem('matajir_cart_guest');
              localStorage.removeItem('pending_cart');
              localStorage.removeItem('pending_user_id');
              
              // Sync data
              const [updatedProducts] = await Promise.all([db.getProducts()]);
              setProducts(updatedProducts);
              
              setView('orders');
              addNotification('success', 'تم الدفع بنجاح عبر Chargily Pay!');
          } catch (error: any) {
              addNotification('error', 'حدث خطأ أثناء إتمام الطلب');
          } finally {
              setIsProcessingPayment(false);
          }
      }
  };

  // --- Helpers ---

  const addNotification = (type: 'success' | 'info' | 'error', message: string) => {
    const id = Date.now().toString() + Math.random();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleBrandClick = (brandName: string) => {
      setSearchQuery(brandName);
      setSelectedCategory('all');
      setView('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Auth Handlers ---

  const handleLogin = async (email: string, pass: string) => {
     try {
         const user = await db.loginUser(email, pass);
         setCurrentUser(user);
         localStorage.setItem('matajir_session_user', JSON.stringify(user)); // Save session
         
         // Load user-specific cart
         const savedCart = localStorage.getItem(`matajir_cart_${user.id}`);
         if (savedCart) {
             try {
                 setCart(JSON.parse(savedCart));
             } catch (e) {
                 localStorage.removeItem(`matajir_cart_${user.id}`);
                 setCart([]);
             }
         } else {
             setCart([]);
         }
         
         setIsAuthOpen(false);
         addNotification('success', `مرحباً بك ${user.name}`);
         if (user.role === 'admin') setView('dashboard');
     } catch (error: any) {
         addNotification('error', error.message || 'خطأ في تسجيل الدخول');
     }
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
      try {
          const newUser: User = {
              id: `u${Date.now()}`,
              name,
              email,
              password: pass,
              role: 'user',
              balance: 0
          };
          await db.createUser(newUser);
          setUsers(prev => [...prev, newUser]);
          setCurrentUser(newUser);
          localStorage.setItem('matajir_session_user', JSON.stringify(newUser)); // Save session
          setIsAuthOpen(false);
          addNotification('success', 'تم إنشاء الحساب بنجاح');
      } catch (error: any) {
          addNotification('error', error.message || 'خطأ في إنشاء الحساب');
      }
  };

  const handleLogout = () => {
    // Clear user-specific cart from localStorage
    if (currentUser) {
      localStorage.removeItem(`matajir_cart_${currentUser.id}`);
    }
    localStorage.removeItem('matajir_cart_guest'); // Clear guest cart too
    setCurrentUser(null);
    localStorage.removeItem('matajir_session_user'); // Clear session
    setCart([]); // Clear cart state
    setView('home');
    addNotification('info', 'تم تسجيل الخروج بنجاح');
  };

  // --- Cart Handlers ---

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
        addNotification('error', 'المنتج غير متوفر حالياً');
        return;
    }
    
    // Clear any pending Chargily cart when modifying current cart
    localStorage.removeItem('pending_cart');
    
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) {
                addNotification('error', 'لا تتوفر كمية إضافية');
                return prev;
            }
            addNotification('success', 'تم تحديث الكمية في السلة');
            return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        addNotification('success', 'تمت الإضافة للسلة');
        return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
      setCart(prev => prev.map(item => {
          if (item.id === productId) {
              const newQty = item.quantity + delta;
              const product = products.find(p => p.id === productId);
              if (newQty < 1) return item;
              if (product && newQty > product.stock) {
                  addNotification('error', 'الكمية المطلوبة غير متوفرة');
                  return item;
              }
              return { ...item, quantity: newQty };
          }
          return item;
      }));
  };

  const removeFromCart = (productId: string) => {
      setCart(prev => prev.filter(item => item.id !== productId));
      addNotification('info', 'تم حذف المنتج من السلة');
  };

  const handleClearCart = () => {
      if (cart.length === 0) return;
      if (window.confirm('هل أنت متأكد من حذف جميع المنتجات من السلة؟')) {
          setCart([]);
          addNotification('info', 'تم إفراغ السلة بنجاح');
      }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- Checkout Handler ---

  const handleCheckout = async () => {
      if (!currentUser) {
          setIsAuthOpen(true);
          addNotification('info', 'يرجى تسجيل الدخول لإتمام الطلب');
          return;
      }

      setIsProcessingPayment(true);

      try {
          if (selectedPaymentMethodId === 'pm_chargily') {
              // Chargily Payment Flow
              // 1. Save state (separate from session cart)
              localStorage.setItem('pending_cart', JSON.stringify(cart));
              localStorage.setItem('pending_user_id', currentUser.id);
              
              // 2. Create Session
              addNotification('info', 'جاري التوجيه إلى صفحة الدفع...');
              const checkoutUrl = await db.createChargilySession(cartTotal);
              
              // 3. Redirect
              window.location.href = checkoutUrl;
              return; // Execution stops here as we redirect
          }

          if (selectedPaymentMethodId === 'pm_paypal') {
             // Handled by component, but if button clicked manually (unlikely if hidden)
             return;
          }

          // Standard/Wallet Payment Flow
          const newOrder = await db.createOrder(currentUser.id, cart, cartTotal, 'Wallet/Card');
          
          setOrders(prev => [...prev, newOrder]);
          setCart([]);
          // Clear user-specific cart
          localStorage.removeItem(`matajir_cart_${currentUser.id}`);
          localStorage.removeItem('matajir_cart_guest');
          
          // Refresh products and inventory to reflect stock changes
          const [updatedProducts, updatedInventory] = await Promise.all([
              db.getProducts(),
              db.getInventory()
          ]);
          setProducts(updatedProducts);
          setInventory(updatedInventory);

          setView('orders');
          addNotification('success', 'تم الدفع بنجاح! تم استلام الأكواد.');

      } catch (error: any) {
          console.error(error);
          addNotification('error', error.message || 'حدث خطأ أثناء معالجة الطلب');
      } finally {
          setIsProcessingPayment(false);
      }
  };

  const handlePayPalSuccess = async (details: any) => {
     if(!currentUser) return;
     try {
         const newOrder = await db.createOrder(currentUser.id, cart, cartTotal, 'PayPal');
         setOrders(prev => [...prev, newOrder]);
         setCart([]);
         // Clear user-specific cart
         localStorage.removeItem(`matajir_cart_${currentUser.id}`);
         localStorage.removeItem('matajir_cart_guest');

         const [updatedProducts, updatedInventory] = await Promise.all([
            db.getProducts(),
            db.getInventory()
         ]);
         setProducts(updatedProducts);
         setInventory(updatedInventory);
         
         setView('orders');
         addNotification('success', `تم الدفع بنجاح عبر PayPal! (ID: ${details.id})`);
     } catch (error) {
         addNotification('error', 'تم الدفع ولكن فشل إنشاء الطلب. تواصل معنا.');
     }
  };

  // --- Reviews Handler ---
  const handleAddReview = async (rating: number, comment: string) => {
      if (!currentUser || !selectedProduct) return;
      
      const review: Review = {
          id: `rev-${Date.now()}`,
          productId: selectedProduct.id,
          userId: currentUser.id,
          userName: currentUser.name,
          rating,
          comment,
          date: new Date().toISOString()
      };

      try {
          await db.addReview(review);
          setReviews(prev => [...prev, review]);
          
          // Update local product list to reflect new rating immediately
          const [updatedProducts] = await Promise.all([db.getProducts()]);
          setProducts(updatedProducts);
          if (selectedProduct) {
              // Update selected product view as well
              const updated = updatedProducts.find(p => p.id === selectedProduct.id);
              if (updated) setSelectedProduct(updated);
          }

          addNotification('success', 'تم إضافة تقييمك بنجاح');
      } catch (error) {
          addNotification('error', 'فشل إضافة التقييم');
      }
  };

  // --- Dashboard Handlers ---

  const handleAddProduct = async (product: Product) => {
      try {
          await db.addProduct(product);
          setProducts(prev => [...prev, product]);
          setInventory(prev => ({ ...prev, [product.id]: [] })); 
          addNotification('success', 'تم إضافة المنتج بنجاح');
      } catch (error) {
          addNotification('error', 'فشل إضافة المنتج');
      }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
      try {
          await db.updateProduct(updatedProduct);
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          addNotification('success', 'تم تحديث المنتج');
      } catch (error) {
          addNotification('error', 'فشل تحديث المنتج');
      }
  };

  const handleDeleteProduct = async (id: string) => {
      if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
      try {
          await db.deleteProduct(id);
          setProducts(prev => prev.filter(p => p.id !== id));
          addNotification('info', 'تم حذف المنتج');
      } catch (error) {
          addNotification('error', 'فشل حذف المنتج');
      }
  };

  const handleAddCodes = async (productId: string, codes: string[]) => {
      try {
          await db.addCodes(productId, codes);
          const [updatedProducts, updatedInventory] = await Promise.all([
             db.getProducts(),
             db.getInventory()
          ]);
          setProducts(updatedProducts);
          setInventory(updatedInventory);
          addNotification('success', `تم إضافة ${codes.length} كود`);
      } catch (error) {
          addNotification('error', 'فشل إضافة الأكواد');
      }
  };

  const handleAddCategory = async (category: Category) => {
    if (categories.find(c => c.id === category.id)) {
        addNotification('error', 'هذا التصنيف موجود مسبقاً');
        return;
    }
    try {
        await db.addCategory(category);
        setCategories(prev => [...prev, category]);
        addNotification('success', 'تم إضافة التصنيف');
    } catch (error) {
        addNotification('error', 'فشل إضافة التصنيف');
    }
  };

  const handleDeleteCategory = async (id: string) => {
      if (products.some(p => p.category === id)) {
          addNotification('error', 'لا يمكن حذف تصنيف يحتوي على منتجات');
          return;
      }
      try {
          await db.deleteCategory(id);
          setCategories(prev => prev.filter(c => c.id !== id));
          addNotification('info', 'تم حذف التصنيف');
      } catch (error) {
          addNotification('error', 'فشل حذف التصنيف');
      }
  };

  const handleUpdatePaymentMethod = async (method: PaymentMethod) => {
      try {
          await db.updatePaymentMethod(method);
          setPaymentMethods(prev => prev.map(p => p.id === method.id ? method : p));
          addNotification('success', 'تم تحديث طريقة الدفع');
      } catch (error) {
          addNotification('error', 'فشل تحديث طريقة الدفع');
      }
  };

  // --- Filtering Logic ---
  
  const filteredProducts = products.filter(product => {
     const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
     const matchesPrice = product.price <= maxPrice;
     
     return matchesSearch && matchesCategory && matchesPrice;
  });

  // Check if current user has purchased the selected product
  const hasPurchasedSelected = currentUser && selectedProduct 
    ? orders.some(o => o.userId === currentUser.id && o.items.some(i => i.id === selectedProduct.id))
    : false;

  // --- Loading Screen ---
  if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center" dir="rtl">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900">جاري تحميل المنصة...</h2>
              <p className="text-gray-500 text-sm mt-2">يرجى الانتظار قليلاً</p>
          </div>
      );
  }

  // --- Render Views ---

  const renderShop = () => (
     <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up" dir="rtl">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-gray-900">المتجر</h2>
            <p className="text-gray-500">{filteredProducts.length} منتج متوفر</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                {/* Search */}
                <div className="md:col-span-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">بحث</label>
                    <div className="relative">
                        <input 
                          type="text" 
                          placeholder="ابحث عن اسم اللعبة أو البطاقة..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                           <Search size={18} />
                        </div>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="md:col-span-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">التصنيف</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button 
                           onClick={() => setSelectedCategory('all')}
                           className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                           الكل
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="md:col-span-4">
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-sm font-bold text-gray-700">السعر الأقصى</label>
                       <span className="text-indigo-600 font-bold">${maxPrice}</span>
                    </div>
                    <input 
                       type="range" 
                       min="0" 
                       max="200" 
                       value={maxPrice} 
                       onChange={(e) => setMaxPrice(Number(e.target.value))}
                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
            </div>
        </div>

        <ProductGrid 
            products={filteredProducts} 
            categories={categories}
            addToCart={addToCart} 
            onViewProduct={(p) => setSelectedProduct(p)}
        />
     </div>
  );

  const renderCheckout = () => {
      const activePaymentMethods = paymentMethods.filter(pm => pm.isActive);
      
      return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up" dir="rtl">
          <button 
             onClick={() => setView('cart')}
             className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 font-bold"
          >
              <ArrowRight size={20} /> العودة للسلة
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Section */}
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                     <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                         <CreditCard className="text-indigo-600" />
                         بيانات الدفع
                     </h2>

                     {/* Payment Method Selector */}
                     <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                         {activePaymentMethods.length === 0 ? (
                             <div className="text-red-500 p-4 bg-red-50 rounded-xl w-full text-center font-bold">
                                 عذراً، لا توجد طرق دفع متاحة حالياً.
                             </div>
                         ) : (
                             activePaymentMethods.map(method => (
                                 <button
                                     key={method.id}
                                     onClick={() => setSelectedPaymentMethodId(method.id)}
                                     className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all ${
                                         selectedPaymentMethodId === method.id 
                                         ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                         : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                     }`}
                                 >
                                     {method.name}
                                 </button>
                             ))
                         )}
                     </div>

                     {/* Dynamic Form based on selection */}
                     {activePaymentMethods.find(m => m.id === selectedPaymentMethodId)?.type === 'card' && selectedPaymentMethodId !== 'pm_chargily' && (
                         <div className="space-y-4 animate-fade-in">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">اسم حامل البطاقة</label>
                                 <input type="text" placeholder="الاسم كما يظهر على البطاقة" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500" />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">رقم البطاقة</label>
                                 <div className="relative">
                                     <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:border-indigo-500 font-mono" />
                                     <CreditCard className="absolute left-3 top-3 text-gray-400" size={20} />
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الانتهاء</label>
                                     <input type="text" placeholder="MM/YY" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 text-center" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-gray-700 mb-2">CVC</label>
                                     <input type="text" placeholder="123" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-indigo-500 text-center" />
                                 </div>
                             </div>
                         </div>
                     )}

                     {selectedPaymentMethodId === 'pm_chargily' && (
                         <div className="bg-[#f0f9ff] border border-blue-100 p-6 rounded-xl flex flex-col items-center justify-center text-center animate-fade-in">
                             <h3 className="text-xl font-bold text-blue-900 mb-2">الدفع عبر Chargily Pay</h3>
                             <p className="text-blue-700 text-sm mb-4">سيتم تحويلك إلى صفحة دفع آمنة لإتمام العملية باستخدام البطاقة الذهبية أو CIB.</p>
                             <div className="flex gap-2 text-blue-500">
                                 <CreditCard size={32} />
                                 <ExternalLink size={24} />
                             </div>
                         </div>
                     )}

                     {activePaymentMethods.find(m => m.id === selectedPaymentMethodId)?.type === 'paypal' && (
                         <div className="p-4 rounded-xl flex flex-col items-center justify-center text-center animate-fade-in">
                             <h3 className="text-lg font-bold text-gray-900 mb-4">الدفع الآمن عبر PayPal</h3>
                             <PayPalPayment 
                                amount={cartTotal}
                                onSuccess={handlePayPalSuccess}
                                onError={(msg) => addNotification('error', msg)}
                             />
                         </div>
                     )}

                     {activePaymentMethods.find(m => m.id === selectedPaymentMethodId)?.type === 'wallet' && (
                         <div className="bg-purple-600 text-white p-6 rounded-xl flex flex-col items-center justify-center text-center animate-fade-in">
                             <h3 className="text-xl font-bold mb-2">المحفظة الرقمية</h3>
                             <p className="text-purple-100 text-sm">رصيدك الحالي: ${currentUser?.balance || 0}</p>
                             {(currentUser?.balance || 0) < cartTotal && (
                                 <p className="text-red-200 text-xs mt-2 font-bold bg-red-500/20 px-2 py-1 rounded">الرصيد غير كافٍ</p>
                             )}
                         </div>
                     )}

                     <p className="text-xs text-gray-400 mt-6 flex items-center gap-1 justify-center">
                         <Truck size={12} /> العملية مؤمنة ومشفرة بالكامل 128-bit SSL
                     </p>
                 </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl h-fit">
                 <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>
                 <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                     {cart.map(item => (
                         <div key={item.id} className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 bg-gray-100 rounded-lg relative overflow-hidden">
                                     <img src={item.image} alt="" className="w-full h-full object-cover" />
                                     <span className="absolute bottom-0 right-0 bg-gray-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-tl-lg font-bold">
                                         {item.quantity}
                                     </span>
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-gray-900 text-sm line-clamp-1 w-32">{item.name}</h4>
                                     <p className="text-gray-500 text-xs">${item.price}</p>
                                 </div>
                             </div>
                             <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                         </div>
                     ))}
                 </div>
                 
                 <div className="border-t border-gray-100 pt-4 space-y-2">
                     <div className="flex justify-between text-gray-600">
                         <span>المجموع</span>
                         <span>${cartTotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-gray-600">
                         <span>الضريبة (0%)</span>
                         <span>$0.00</span>
                     </div>
                     <div className="flex justify-between text-xl font-black text-gray-900 pt-2">
                         <span>الإجمالي</span>
                         <div className="flex flex-col items-end">
                            <span className="text-indigo-600">${cartTotal.toFixed(2)}</span>
                            {selectedPaymentMethodId === 'pm_chargily' && (
                                <span className="text-xs text-gray-400 font-normal">
                                    ≈ {(cartTotal * 200).toLocaleString()} DZD
                                </span>
                            )}
                         </div>
                     </div>
                 </div>

                 {/* Hide default button for PayPal as it has its own buttons */}
                 {selectedPaymentMethodId !== 'pm_paypal' && (
                    <button 
                        onClick={handleCheckout}
                        disabled={isProcessingPayment || cart.length === 0 || activePaymentMethods.length === 0}
                        className="w-full mt-6 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessingPayment ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                جاري المعالجة...
                            </>
                        ) : (
                            <>
                                تأكيد ودفع ${cartTotal.toFixed(2)}
                            </>
                        )}
                    </button>
                 )}
              </div>
          </div>
      </div>
  )};

  const renderCart = () => (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up" dir="rtl">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="text-indigo-600" />
                  سلة المشتريات
              </h2>
              {cart.length > 0 && (
                  <button 
                      onClick={handleClearCart}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
                  >
                      <Trash2 size={18} />
                      إفراغ السلة
                  </button>
              )}
          </div>
          {cart.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                  <p className="text-gray-500 mb-4">سلتك فارغة حالياً</p>
                  <button onClick={() => setView('shop')} className="text-indigo-600 font-bold hover:underline">تصفح المنتجات</button>
              </div>
          ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                      {cart.map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100">
                              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
                              <div className="flex-1">
                                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                                  <p className="text-indigo-600 font-bold">${item.price}</p>
                              </div>
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                  <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md shadow-sm transition"><Minus size={16} /></button>
                                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md shadow-sm transition"><Plus size={16} /></button>
                              </div>
                              <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={20} /></button>
                          </div>
                      ))}
                  </div>
                  <div className="bg-white p-6 rounded-3xl h-fit border border-gray-100 shadow-lg">
                      <h3 className="font-bold text-lg mb-4">ملخص الطلب</h3>
                      <div className="space-y-2 mb-6 text-sm">
                          <div className="flex justify-between text-gray-600">
                              <span>المجموع الفرعي</span>
                              <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                              <span>الضريبة</span>
                              <span>$0.00</span>
                          </div>
                          <div className="border-t border-gray-100 my-2 pt-2 flex justify-between font-bold text-lg text-gray-900">
                              <span>الإجمالي</span>
                              <span>${cartTotal.toFixed(2)}</span>
                          </div>
                      </div>
                      <button 
                          onClick={() => setView('checkout')}
                          className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                      >
                          <CreditCard size={20} />
                          متابعة للدفع
                      </button>
                  </div>
              </div>
          )}
      </div>
  );

  const renderOrdersList = () => {
    const userOrders = currentUser ? orders.filter(o => o.userId === currentUser.id) : [];
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up" dir="rtl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="text-indigo-600" />
                طلباتي
            </h2>
            {!currentUser ? (
                <div className="text-center py-12">
                   <p className="text-gray-500 mb-4">يرجى تسجيل الدخول لعرض طلباتك</p>
                   <button onClick={() => setIsAuthOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">تسجيل الدخول</button>
                </div>
            ) : userOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                   <p className="text-gray-500">ليس لديك طلبات سابقة</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {userOrders.slice().reverse().map(order => (
                        <div key={order.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="bg-gray-50 p-4 flex justify-between items-center text-sm">
                                <div>
                                    <span className="text-gray-500 ml-2">رقم الطلب:</span>
                                    <span className="font-mono font-bold text-gray-900">{order.id}</span>
                                </div>
                                <div className="text-gray-500">{formatDateArabic(order.date)}</div>
                            </div>
                            <div className="p-4">
                                {order.items.map(item => (
                                    <div key={item.id} className="mb-4 last:mb-0 border-b last:border-0 border-gray-50 pb-4 last:pb-0">
                                        <div className="flex items-center gap-4 mb-3">
                                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                                            <div>
                                                <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                <p className="text-indigo-600 text-sm font-bold">${item.price} x {item.quantity}</p>
                                            </div>
                                        </div>
                                        {/* Digital Codes Delivery */}
                                        <div className="bg-slate-900 rounded-xl p-4 mt-2">
                                            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                                                <CreditCard size={12} /> الأكواد الرقمية ({item.quantity}):
                                            </p>
                                            <div className="space-y-2">
                                                {order.deliveryCodes[item.id]?.map((code, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10">
                                                        <code className="font-mono text-emerald-400 text-sm tracking-wide">{code}</code>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(code);
                                                                addNotification('success', 'تم نسخ الكود');
                                                            }}
                                                            className="text-xs text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            نسخ
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-2 text-right">
                                             <button 
                                               onClick={() => setSelectedProduct(products.find(p => p.id === item.id) || null)}
                                               className="text-xs text-indigo-600 font-bold hover:underline"
                                             >
                                                تقييم المنتج
                                             </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-gray-900 ml-4">الإجمالي: <span className="text-indigo-600">${order.total}</span></span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="text-xs text-gray-500">طريقة الدفع: {order.paymentMethod || 'Wallet'}</span>
                                    <button 
                                      onClick={() => { setTrackingOrderId(order.id); setIsTrackModalOpen(true); }}
                                      className="mr-4 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold hover:bg-indigo-200 transition"
                                    >
                                      تتبع الطلب
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-right font-sans flex flex-col" dir="rtl">
      <Navbar 
        currentView={view} 
        setView={setView} 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />
      
      <main className="pt-6 pb-24 flex-grow">
        {view === 'dashboard' && currentUser?.role === 'admin' ? (
          <Dashboard 
            products={products}
            orders={orders}
            users={users}
            categories={categories}
            paymentMethods={paymentMethods}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCodes={handleAddCodes}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdatePaymentMethod={handleUpdatePaymentMethod}
            codeInventoryCounts={Object.fromEntries(
                Object.entries(inventory).map(([k, v]) => [k, (v as string[]).length])
            )}
          />
        ) : view === 'cart' ? (
            renderCart()
        ) : view === 'checkout' ? (
            renderCheckout()
        ) : view === 'orders' ? (
            renderOrdersList()
        ) : view === 'shop' ? (
            renderShop()
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
            {view === 'home' && (
              <>
               <div className="mb-12 relative rounded-3xl overflow-hidden shadow-2xl h-[400px] group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-indigo-900/80 z-10"></div>
                  <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80" alt="Hero" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                      <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                          عالمك الرقمي<br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">بين يديك</span>
                      </h1>
                      <p className="text-lg text-gray-200 mb-8 max-w-2xl">
                          أفضل متجر لشراء بطاقات الألعاب، الاشتراكات، والخدمات الرقمية. تسليم فوري وآمن 100%.
                      </p>
                      <button onClick={() => setView('shop')} className="bg-white text-indigo-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-indigo-900/50 flex items-center gap-2">
                          تصفح المنتجات <ArrowLeft size={20} />
                      </button>
                  </div>
               </div>

               {/* Featured Brands */}
               <div className="mb-12">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Gift className="text-indigo-600" />
                      الفئات
                  </h3>
                  <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:justify-center">
                      {featuredBrands.map((brand) => (
                          <button
                              key={brand.id}
                              onClick={() => handleBrandClick(brand.name)}
                              className="group flex flex-col items-center min-w-[80px] gap-3"
                          >
                              <div className={`w-20 h-20 rounded-full shadow-lg flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl ${brand.color}`}>
                                  <brand.icon size={32} />
                              </div>
                              <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                                  {brand.name}
                              </span>
                          </button>
                      ))}
                  </div>
               </div>
              </>
            )}
            
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                    {view === 'home' ? 'أحدث المنتجات' : 'جميع المنتجات'}
                </h2>
                {view === 'home' && (
                    <button onClick={() => setView('shop')} className="text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
                        عرض الكل
                    </button>
                )}
            </div>

            <ProductGrid 
              products={view === 'home' ? products.slice(0, 4) : products} 
              categories={categories}
              addToCart={addToCart}
              onViewProduct={(p) => setSelectedProduct(p)}
            />
          </div>
        )}
      </main>

      {view !== 'dashboard' && <Footer setView={setView} />}

      <ChatWidget />
      <ToastContainer notifications={notifications} removeNotification={removeNotification} />
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <ProductModal
        product={selectedProduct}
        categories={categories}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onSwitchProduct={(p) => setSelectedProduct(p)}
        reviews={reviews.filter(r => r.productId === selectedProduct?.id)}
        onAddReview={handleAddReview}
        currentUser={currentUser}
        hasPurchased={hasPurchasedSelected}
        allProducts={products}
      />

      {/* Track Order Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsTrackModalOpen(false)}></div>
          <div className="bg-white rounded-3xl p-8 relative z-10 w-full max-w-md animate-fade-in-up text-center">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <Truck size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">تتبع الطلب #{trackingOrderId.slice(-4)}</h3>
             <p className="text-gray-500 mb-6">الطلب مكتمل وتم تسليم الأكواد رقمياً.</p>
             <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>تم الدفع</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>تمت المعالجة</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>تم التسليم</span>
                </div>
             </div>
             <button onClick={() => setIsTrackModalOpen(false)} className="bg-indigo-600 text-white w-full py-3 rounded-xl font-bold">حسناً</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
