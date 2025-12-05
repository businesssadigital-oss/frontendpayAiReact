
import React, { useState, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Trash2, 
  Database,
  Save,
  FileText,
  X,
  Edit,
  Upload,
  Image as ImageIcon,
  Shield,
  User as UserIcon,
  List,
  CreditCard,
  ToggleRight,
  ToggleLeft,
  Server,
  Wifi,
  WifiOff,
  Terminal
} from 'lucide-react';
import { Product, Order, User, Category, PaymentMethod } from '../types';
import { db } from '../services/db';

interface DashboardProps {
  products: Product[];
  orders: Order[];
  users: User[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCodes: (productId: string, codes: string[]) => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdatePaymentMethod: (method: PaymentMethod) => void;
  codeInventoryCounts: Record<string, number>;
}

type Tab = 'overview' | 'products' | 'orders' | 'inventory' | 'users' | 'categories' | 'payments';

export const Dashboard: React.FC<DashboardProps> = ({ 
  products, 
  orders, 
  users,
  categories,
  paymentMethods,
  onAddProduct, 
  onUpdateProduct,
  onDeleteProduct,
  onAddCodes,
  onAddCategory,
  onDeleteCategory,
  onUpdatePaymentMethod,
  codeInventoryCounts
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isConnected = db.isConnected();

  // Stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;

  // Product Form State
  const [productForm, setProductForm] = useState<Partial<Product>>({
    category: categories[0]?.id || 'games',
    rating: 5,
    stock: 0
  });

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');

  // Payment Method Edit State
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);

  // Inventory Management State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [rawCodes, setRawCodes] = useState<string>('');
  const [codesModalOpen, setCodesModalOpen] = useState(false);
  const [codesModalProduct, setCodesModalProduct] = useState<Product | null>(null);
  const [codesModalSold, setCodesModalSold] = useState<string[]>([]);
  const [codesModalUnsold, setCodesModalUnsold] = useState<string[]>([]);
  const [codeStats, setCodeStats] = useState<Record<string, { available: number; sold: number; total: number }>>({});

  const openAddModal = () => {
    setProductForm({ category: categories[0]?.id || 'games', rating: 5, stock: 0 });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setProductForm({ ...product });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && productForm.id) {
        // Update existing
        const updatedProduct: Product = {
            ...productForm as Product,
            price: Number(productForm.price),
            stock: Number(productForm.stock)
        };
        onUpdateProduct(updatedProduct);
    } else {
        // Create new
        if (productForm.name && productForm.price) {
            const product: Product = {
                id: `p${Date.now()}`,
                name: productForm.name,
                description: productForm.description || 'وصف افتراضي للمنتج',
                price: Number(productForm.price),
                category: productForm.category as string,
                image: productForm.image || `https://picsum.photos/seed/${Date.now()}/400/400`,
                rating: 5,
                stock: Number(productForm.stock) || 0,
            };
            onAddProduct(product);
        }
    }
    setIsModalOpen(false);
  };

  const handleBatchUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !rawCodes.trim()) return;

    const codesList = rawCodes.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (codesList.length > 0) {
      const api = (import.meta.env.VITE_API_URL as string) || 'https://backendpay-1.onrender.com/';
      
      // Send codes to API
      fetch(`${api}/api/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, codes: codesList })
      })
        .then(res => res.json())
        .then(data => {
          alert(`تم إضافة ${data.count || codesList.length} كود بنجاح`);
          setRawCodes('');
          setSelectedProductId('');
          // Refresh stats
          loadCodeStats();
        })
        .catch(err => {
          console.error('Failed to add codes:', err);
          alert('فشل في إضافة الأكواد');
        });
    }
  };

  const loadCodeStats = async () => {
      const api = (import.meta.env.VITE_API_URL as string) || 'https://backendpay-1.onrender.com/';
    const stats: Record<string, any> = {};

    // Initialize all products with default stats
    for (const product of products) {
      stats[product.id] = { productId: product.id, available: 0, sold: 0, total: 0 };
    }

    // Load stats for each product from API
    for (const product of products) {
      try {
        const res = await fetch(`${(import.meta.env.VITE_API_URL as string) || 'https://backendpay-1.onrender.com/'}/api/codes/stats/${product.id}`);
        if (!res.ok) {
          console.warn(`API returned ${res.status} for ${product.id}`);
          continue;
        }
        const data = await res.json();
        stats[product.id] = data;
        console.log(`✅ Loaded stats for ${product.name}:`, data);
      } catch (err) {
        console.error(`❌ Failed to load stats for ${product.id}:`, err);
        // Keep default stats for this product
      }
    }

    console.log('📊 All product stats loaded:', stats);
    setCodeStats(stats);
  };

  // Load code stats on mount and when products change
  React.useEffect(() => {
    loadCodeStats();
  }, [products]);

  const openCodesModal = (product: Product) => {
    // Fetch codes from API (real-time from database)
    const api = (import.meta.env.VITE_API_URL as string) || 'https://backendpay-1.onrender.com/';
    
    // Fetch all codes for this product
    fetch(`${api}/api/codes?productId=${product.id}`)
      .then(res => res.json())
      .then(codes => {
        const sold = codes.filter((c: any) => c.status === 'sold').map((c: any) => c.code);
        const unsold = codes.filter((c: any) => c.status === 'available').map((c: any) => c.code);
        setCodesModalProduct(product);
        setCodesModalSold(sold);
        setCodesModalUnsold(unsold);
        setCodesModalOpen(true);
      })
      .catch(err => {
        console.error('Failed to fetch codes:', err);
        setCodesModalOpen(true);
      });
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryId && newCategoryName) {
      onAddCategory({ id: newCategoryId, name: newCategoryName });
      setNewCategoryId('');
      setNewCategoryName('');
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingPayment) {
          onUpdatePaymentMethod(editingPayment);
          setEditingPayment(null);
      }
  };

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-white min-h-screen hidden md:flex flex-col p-4 fixed right-0 top-16 bottom-0 z-40">
      <div className="space-y-1 mt-4">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
          { id: 'products', label: 'المنتجات', icon: Package },
          { id: 'categories', label: 'التصنيفات', icon: List },
          { id: 'inventory', label: 'مخزون الأكواد', icon: Database },
          { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
          { id: 'users', label: 'العملاء', icon: Users },
          { id: 'payments', label: 'طرق الدفع', icon: CreditCard },
          { id: 'code', label: 'محرر الأكواد', icon: FileText },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto bg-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
            <Server size={12} /> حالة النظام
        </h4>
        
        {isConnected ? (
             <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 p-2 rounded-lg border border-green-400/20">
                <Wifi size={14} />
                <div className="flex flex-col">
                    <span className="font-bold">متصل بالخادم</span>
                    <span className="text-[10px] opacity-80">MongoDB Active</span>
                </div>
             </div>
        ) : (
             <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                    <WifiOff size={14} />
                    <div className="flex flex-col">
                        <span className="font-bold">وضع المحاكاة</span>
                        <span className="text-[10px] opacity-80">Backend Offline</span>
                    </div>
                 </div>
                 <div className="text-[10px] text-slate-500 flex items-center gap-1">
                     <Terminal size={10} />
                     <span>لتشغيل الخادم: <code>node server.js</code></span>
                 </div>
             </div>
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">إجمالي المبيعات</p>
            <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">عدد الطلبات</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalOrders}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">العملاء</p>
            <h3 className="text-2xl font-bold text-gray-900">{users.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
            <List size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500">التصنيفات</p>
            <h3 className="text-2xl font-bold text-gray-900">{categories.length}</h3>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" />
          النشاط الأخير
        </h3>
        <div className="space-y-4">
          {orders.slice().reverse().slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                  {order.id.slice(-2)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">طلب جديد #{order.id}</p>
                  <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
              <span className="font-bold text-emerald-600">+${order.total}</span>
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-400 text-center py-4">لا توجد نشاطات حديثة</p>}
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
      <div className="space-y-6 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-900">إدارة طرق الدفع</h2>
        <div className="grid grid-cols-1 gap-4">
            {paymentMethods.map(method => (
                <div key={method.id} className={`bg-white p-6 rounded-2xl border transition-all ${method.isActive ? 'border-indigo-100 shadow-md' : 'border-gray-100 opacity-70'}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                 <CreditCard size={24} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-900 text-lg">{method.name}</h3>
                                 <p className="text-gray-500 text-sm">{method.description}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setEditingPayment(method)}
                                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg font-bold text-sm"
                            >
                                <Edit size={18} />
                            </button>
                            <button 
                                onClick={() => onUpdatePaymentMethod({ ...method, isActive: !method.isActive })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
                                    method.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {method.isActive ? (
                                    <><ToggleRight size={20} /> مفعل</>
                                ) : (
                                    <><ToggleLeft size={20} /> معطل</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
  );

  const renderCategories = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900">إدارة التصنيفات</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Category Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
             <Plus className="text-indigo-600" size={20} />
             إضافة تصنيف جديد
           </h3>
           <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم التصنيف (عربي)</label>
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="مثال: برامج حاسوب"
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">معرف التصنيف (إنجليزي)</label>
                <input 
                  type="text" 
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="مثال: software"
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors outline-none font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">يجب أن يكون فريداً وبالأحرف الإنجليزية.</p>
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                إضافة
              </button>
           </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-500">اسم التصنيف</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-500">المعرف (ID)</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-500">المنتجات المرتبطة</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => {
                   const productCount = products.filter(p => p.category === cat.id).length;
                   return (
                    <tr key={cat.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-500">{cat.id}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                           {productCount} منتج
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <button 
                            onClick={() => onDeleteCategory(cat.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                            title="حذف"
                        >
                            <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة مخزون الأكواد</h2>
        <button 
          onClick={loadCodeStats}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition text-sm"
          title="تحديث إحصائيات الأكواد"
        >
          <Database size={16} />
          تحديث الإحصائيات
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bulk Upload Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="text-indigo-600" />
            تحميل أكواد (Batch Upload)
          </h3>
          <form onSubmit={handleBatchUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اختر المنتج</label>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors focus:bg-white outline-none"
                required
              >
                <option value="">-- اختر منتج لإضافة الأكواد --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (المتوفر: {p.stock})</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                قائمة الأكواد (كل كود في سطر جديد)
              </label>
              <textarea 
                value={rawCodes}
                onChange={(e) => setRawCodes(e.target.value)}
                placeholder="XJ92-2931-LKW2&#10;MP10-5521-0021&#10;..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 h-48 font-mono transition-colors focus:bg-white outline-none"
                required
              />
              <p className="text-xs text-gray-400 mt-2">سيتم إضافة هذه الأكواد إلى المخزون تلقائياً.</p>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
            >
              <Save size={18} />
              حفظ الأكواد
            </button>
          </form>
        </div>

        {/* Current Inventory Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Database className="text-emerald-600" />
            حالة المخزون الحالي
          </h3>
          <div className="overflow-hidden">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {products.map(product => {
                // Get code stats from API
                const stats = codeStats[product.id] || { available: 0, sold: 0, total: 0 };
                const statusColor = stats.available > 10 ? 'bg-green-100 text-green-700' : stats.available > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

                return (
                  <div key={product.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt="" className="w-10 h-10 rounded-lg bg-gray-200 object-cover" />
                        <div>
                          <p className="font-bold text-sm text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">سعر البيع: ${product.price}</p>
                        </div>
                      </div>

                      <div className="text-left flex-shrink-0">
                        <div className="mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {stats.available} كود متاح
                          </span>
                        </div>

                        <div className="text-xs text-gray-500">مباعة: <span className="font-bold text-gray-700">{stats.sold}</span></div>
                        <div className="text-xs text-gray-500">المجموع: <span className="font-bold text-gray-700">{stats.total}</span></div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => openCodesModal(product)} className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md">عرض الكل</button>
                      <span className="text-xs text-gray-400">(لمزيد من التفاصيل)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h2>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          إضافة منتج
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">المنتج</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">التصنيف</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">السعر</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">المخزون (الأكواد)</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                      {categories.find(c => c.id === product.category)?.name || product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">${product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${product.stock > 0 ? 'text-gray-900' : 'text-red-500'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => openEditModal(product)}
                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-lg transition"
                            title="تعديل"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={() => onDeleteProduct(product.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                            title="حذف"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900">إدارة العملاء</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">الاسم</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">الصلاحية</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">الرصيد</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">المعرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <UserIcon size={16} />
                      </div>
                      <span className="font-bold text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        <Shield size={12} /> مدير
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold w-fit">
                        عميل
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">${user.balance}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{user.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900">سجل الطلبات</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">رقم الطلب</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">العميل</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">التاريخ</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">الإجمالي</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice().reverse().map(order => {
                const customer = users.find(u => u.id === order.userId);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-sm">{order.id}</td>
                    <td className="px-6 py-4">
                      {customer ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{customer.name}</span>
                        </div>
                      ) : 'غير معروف'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.date).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">${order.total}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        مكتمل
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {renderSidebar()}
      
      {/* Mobile Sidebar Toggle would go here */}
      
      <div className="flex-1 md:mr-64 p-8">
  {activeTab === 'overview' && renderOverview()}
  {activeTab === 'products' && renderProducts()}
  {activeTab === 'categories' && renderCategories()}
  {activeTab === 'inventory' && renderInventory()}
  {activeTab === 'orders' && renderOrders()}
  {activeTab === 'users' && renderUsers()}
  {activeTab === 'payments' && renderPayments()}
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative z-10 animate-fade-in-up border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-bold text-gray-900">
                   {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* Image Upload */}
              <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors">
                          {productForm.image ? (
                              <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                              <div className="flex flex-col items-center text-gray-400">
                                  <ImageIcon size={32} />
                                  <span className="text-xs mt-2">اختر صورة</span>
                              </div>
                          )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={24} />
                      </div>
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                      />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المنتج</label>
                <input 
                  required
                  type="text" 
                  value={productForm.name || ''}
                  onChange={e => setProductForm({...productForm, name: e.target.value})}
                  placeholder="مثال: بطاقة آيتونز 10$"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors focus:bg-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">السعر ($)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <DollarSign size={16} />
                      </div>
                      <input 
                        required
                        type="number" 
                        value={productForm.price || ''}
                        onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                        placeholder="0.00"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-8 pl-3 py-3 transition-colors focus:bg-white outline-none"
                      />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">التصنيف</label>
                    <select 
                      value={productForm.category}
                      onChange={e => setProductForm({...productForm, category: e.target.value as any})}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors focus:bg-white outline-none"
                    >
                      {categories.map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
                <textarea 
                  value={productForm.description || ''}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                  placeholder="اكتب وصفاً جذاباً للمنتج..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 h-28 transition-colors focus:bg-white outline-none resize-none"
                />
              </div>
               
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  {isEditing ? 'تحديث المنتج' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Method Modal */}
      {editingPayment && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingPayment(null)}></div>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-fade-in-up border border-gray-100">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">تعديل: {editingPayment.name}</h3>
                      <button onClick={() => setEditingPayment(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
                   </div>
                   <form onSubmit={handlePaymentSubmit} className="space-y-4">
                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">اسم الطريقة</label>
                           <input 
                              type="text" 
                              value={editingPayment.name}
                              onChange={(e) => setEditingPayment({...editingPayment, name: e.target.value})}
                              required
                              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 outline-none focus:border-indigo-500"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">الوصف الظاهر للعميل</label>
                           <textarea 
                              value={editingPayment.description}
                              onChange={(e) => setEditingPayment({...editingPayment, description: e.target.value})}
                              required
                              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3 h-24 outline-none focus:border-indigo-500 resize-none"
                           />
                       </div>
                       <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 mt-2">
                           حفظ التغييرات
                       </button>
                   </form>
              </div>
          </div>
      )}

      {/* Codes Modal (show full sold/unsold lists) */}
      {codesModalOpen && codesModalProduct && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCodesModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-6 relative z-10 animate-fade-in-up border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">أكواد المنتج: {codesModalProduct.name}</h3>
              <button onClick={() => setCodesModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">الأكواد غير المباعة ({codesModalUnsold.length})</h4>
                {codesModalUnsold.length === 0 ? (
                  <div className="text-xs text-gray-400">لا توجد أكواد متاحة</div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {codesModalUnsold.map((c, i) => (
                      <div key={i} className="font-mono text-sm px-2 py-1 bg-white border rounded">{c}</div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">الأكواد المباعة ({codesModalSold.length})</h4>
                {codesModalSold.length === 0 ? (
                  <div className="text-xs text-gray-400">لم يتم بيع أي أكواد بعد</div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto p-2 bg-red-50 rounded-lg">
                    {codesModalSold.map((c, i) => (
                      <div key={i} className="font-mono text-sm px-2 py-1 bg-white border rounded">{c}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => {
                // download combined as text file
                const content = `Non-sold:\n${codesModalUnsold.join('\n')}\n\nSold:\n${codesModalSold.join('\n')}`;
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${codesModalProduct.id || 'codes'}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">تنزيل الكل</button>
              <button onClick={() => navigator.clipboard.writeText(`Non-sold:\n${codesModalUnsold.join('\n')}\n\nSold:\n${codesModalSold.join('\n')}`)} className="px-4 py-2 bg-gray-100 rounded-lg">نسخ إلى الحافظة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
