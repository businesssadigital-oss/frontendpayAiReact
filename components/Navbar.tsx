
import React from 'react';
import { ShoppingCart, Menu, LayoutDashboard, Home, Package, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { ViewState, User } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  cartCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  setView, 
  cartCount, 
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'shop', label: 'المتجر', icon: Package },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="hidden md:block font-bold text-xl text-gray-900 tracking-tight">
                متاجر <span className="text-indigo-600">ديجيتال</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.id 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('cart')}
              className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            
            {currentUser ? (
              <div className="relative">
                <div 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hidden md:flex items-center gap-2 border-r border-gray-300 pr-4 mr-2 cursor-pointer hover:opacity-80 select-none"
                >
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{currentUser.role === 'admin' ? 'مدير النظام' : 'عضو'}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                    <UserIcon size={18} />
                  </div>
                </div>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in-up">
                     {currentUser.role === 'admin' && (
                       <button
                         onClick={() => { setView('dashboard'); setIsUserMenuOpen(false); }}
                         className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                       >
                         <LayoutDashboard size={16} />
                         لوحة التحكم
                       </button>
                     )}
                     <button
                       onClick={() => { setView('orders'); setIsUserMenuOpen(false); }}
                       className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                     >
                       <Package size={16} />
                       طلباتي
                     </button>
                     <div className="border-t border-gray-100 my-1"></div>
                     <button
                       onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                       className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                     >
                       <LogOut size={16} />
                       تسجيل خروج
                     </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-gray-200"
              >
                <LogIn size={16} />
                دخول
              </button>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="px-4 pt-4 pb-2 border-b border-gray-100 mb-2">
            {currentUser ? (
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserIcon size={20} />
                 </div>
                 <div>
                    <p className="font-bold text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                 </div>
               </div>
            ) : (
              <button 
                onClick={() => { onOpenAuth(); setIsMenuOpen(false); }}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold mb-2"
              >
                تسجيل الدخول / إنشاء حساب
              </button>
            )}
          </div>

          <div className="px-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewState);
                  setIsMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                  currentView === item.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
            
            {currentUser && (
              <>
                 <button
                    onClick={() => {
                      setView('orders');
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Package size={20} />
                  طلباتي
                </button>
                {currentUser.role === 'admin' && (
                  <button
                      onClick={() => {
                        setView('dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 bg-gray-50"
                  >
                    <LayoutDashboard size={20} />
                    لوحة التحكم
                  </button>
                )}
                <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={20} />
                  تسجيل خروج
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
