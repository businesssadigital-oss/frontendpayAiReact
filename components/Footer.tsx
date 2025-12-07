
import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Mail, Phone, MapPin, Twitter, ShieldCheck } from 'lucide-react';
import { ViewState, Settings } from '../types';
import { db } from '../services/db';

interface FooterProps {
  setView: (view: ViewState) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let mounted = true;
    db.getSettings().then(s => { if (mounted) setSettings(s); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const addr = settings?.contactAddress || 'الرياض، المملكة العربية السعودية\nحي الصحافة، طريق الملك فهد';
  const phone = settings?.contactPhone || '+966 55 123 4567';
  const email = settings?.contactEmail || 'support@matajir.com';

  return (
    <footer className="bg-[#111827] text-gray-300 pt-16 pb-8 border-t border-gray-800 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
                <span className="text-white font-black text-xl">M</span>
              </div>
              <span className="font-black text-2xl text-white tracking-tight">
                متاجر <span className="text-indigo-500">ديجيتال</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              منصتك الأولى لشراء البطاقات الرقمية، واشتراكات الألعاب، والخدمات الترفيهية. نضمن لك تجربة شراء آمنة، وتسليم فوري للأكواد على مدار الساعة.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all duration-300">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all duration-300">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              روابط سريعة
            </h3>
            <ul className="space-y-4 text-sm">
              <li>
                <button onClick={() => setView('home')} className="hover:text-indigo-400 hover:translate-x-[-4px] transition-all flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => setView('shop')} className="hover:text-indigo-400 hover:translate-x-[-4px] transition-all flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                  المتجر
                </button>
              </li>
              <li>
                <button onClick={() => setView('orders')} className="hover:text-indigo-400 hover:translate-x-[-4px] transition-all flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                   تتبع الطلب
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 hover:translate-x-[-4px] transition-all flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
                  من نحن
                </a>
              </li>
            </ul>
          </div>

          {/* User Area */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">حسابي</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <button onClick={() => setView('cart')} className="hover:text-indigo-400 transition-colors">سلة المشتريات</button>
              </li>
              <li>
                <button onClick={() => setView('orders')} className="hover:text-indigo-400 transition-colors">قائمة الطلبات</button>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">سياسة الخصوصية</a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">شروط الاستخدام</a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400 transition-colors">الأسئلة الشائعة FAQ</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">تواصل معنا</h3>
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-indigo-500">
                  <MapPin size={18} />
                </div>
                <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: (addr || '').replace(/\n/g, '<br/>') }} />
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-indigo-500">
                  <Phone size={18} />
                </div>
                <span dir="ltr" className="font-mono">{phone}</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-indigo-500">
                  <Mail size={18} />
                </div>
                <span>{email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
          <p>© 2025 متاجر ديجيتال. جميع الحقوق محفوظة.</p>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2" title="نضمن لك عملية دفع آمنة 100%">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-xs">دفع آمن</span>
             </div>
             <div className="h-4 w-px bg-gray-700"></div>
             <div className="flex gap-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                {/* Simple SVG Placeholders for Payment Methods */}
                <div className="h-6 w-10 bg-white rounded flex items-center justify-center">
                   <span className="font-black text-[8px] text-blue-900 tracking-tighter">VISA</span>
                </div>
                <div className="h-6 w-10 bg-white rounded flex items-center justify-center">
                   <div className="flex -space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500 opacity-80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80"></div>
                   </div>
                </div>
                <div className="h-6 w-10 bg-white rounded flex items-center justify-center">
                    <span className="font-bold text-[8px] italic text-[#003087]">PayPal</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
