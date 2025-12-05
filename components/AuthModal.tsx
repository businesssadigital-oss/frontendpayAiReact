import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, LogIn, ArrowRight, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => void;
  onRegister: (name: string, email: string, pass: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginView) {
      onLogin(formData.email, formData.password);
    } else {
      onRegister(formData.name, formData.email, formData.password);
    }
  };

  const handleDemoAdmin = () => {
    onLogin('admin@matajir.com', '123');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLoginView ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLoginView 
                ? 'أهلاً بك مجدداً! قم بالدخول لمتابعة طلباتك' 
                : 'انضم إلينا واحصل على أفضل العروض الرقمية'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    required={!isLoginView}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="مثال: أحمد محمد"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-10 pl-3 py-3 transition-colors focus:bg-white outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-10 pl-3 py-3 transition-colors focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-10 pl-3 py-3 transition-colors focus:bg-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-6 flex items-center justify-center gap-2"
            >
              {isLoginView ? <LogIn size={20} /> : <ArrowRight size={20} />}
              {isLoginView ? 'دخول' : 'تسجيل حساب'}
            </button>

            {isLoginView && (
              <button
                type="button"
                onClick={handleDemoAdmin}
                className="w-full bg-purple-50 text-purple-700 border border-purple-100 py-3.5 rounded-xl font-bold hover:bg-purple-100 transition-colors mt-3 flex items-center justify-center gap-2"
              >
                <Shield size={20} />
                دخول كمدير (تجريبي)
              </button>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors"
            >
              {isLoginView 
                ? 'ليس لديك حساب؟ سجل الآن' 
                : 'لديك حساب بالفعل؟ سجل دخولك'}
            </button>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100">
           محمية بواسطة سياسة الخصوصية الآمنة
        </div>
      </div>
    </div>
  );
};
