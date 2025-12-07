import { Product, User, Category, PaymentMethod } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'games', name: 'ألعاب' },
  { id: 'cards', name: 'بطاقات' },
  { id: 'subscriptions', name: 'اشتراكات' }
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { 
    id: 'pm_card', 
    name: 'بطاقة ائتمان', 
    type: 'card', 
    isActive: true, 
    description: 'دفع آمن عبر Visa أو Mastercard' 
  },
  { 
    id: 'pm_chargily', 
    name: 'Chargily Pay', 
    type: 'card', // Treated as card/external redirect
    isActive: true, 
    description: 'دفع محلي آمن عبر البطاقة الذهبية و CIB' 
  },
  { 
    id: 'pm_paypal', 
    name: 'PayPal', 
    type: 'paypal', 
    isActive: true, 
    description: 'الدفع السريع عبر حساب باي بال' 
  },
  { 
    id: 'pm_wallet', 
    name: 'محفظة المنصة', 
    type: 'wallet', 
    isActive: false, 
    description: 'استخدم رصيدك الحالي في الموقع' 
  }
];

export const MOCK_USERS: User[] = [
  // Admin demo user removed
  {
    id: 'u2',
    name: 'أحمد محمد',
    email: 'user@matajir.com',
    password: '123',
    role: 'user',
    balance: 50
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'iTunes Card $100',
    description: 'بطاقة شحن رصيد لمتجر آبل الأمريكي. تسليم فوري للكود.',
    price: 100,
    category: 'cards',
    image: 'https://picsum.photos/seed/itunes/400/400',
    rating: 4.8,
    stock: 50,
  },
  {
    id: 'p2',
    name: 'PUBG UC - 660',
    description: 'كود شحن فوري للعبة ببجي موبايل. الكود يعمل على جميع الحسابات العالمية.',
    price: 9.99,
    category: 'games',
    image: 'https://picsum.photos/seed/pubg/400/400',
    rating: 4.9,
    stock: 1000,
  },
  {
    id: 'p3',
    name: 'Netflix Premium 1 Month',
    description: 'اشتراك بريميوم 4K لمدة شهر كامل. حساب خاص.',
    price: 15,
    category: 'subscriptions',
    image: 'https://picsum.photos/seed/netflix/400/400',
    rating: 4.5,
    stock: 20,
  },
  {
    id: 'p4',
    name: 'PlayStation $50 Card',
    description: 'ستور أمريكي. شحن فوري للمحفظة لشراء الألعاب والإضافات.',
    price: 50,
    category: 'cards',
    image: 'https://picsum.photos/seed/psn/400/400',
    rating: 4.7,
    stock: 15,
  },
  {
    id: 'p5',
    name: 'FIFA 24 Points - 2800',
    description: 'نقاط فيفا ألتميت تيم. كود رقمي لبناء فريقك المفضل.',
    price: 24.99,
    category: 'games',
    image: 'https://picsum.photos/seed/fifa/400/400',
    rating: 4.2,
    stock: 44,
  },
  {
    id: 'p6',
    name: 'Spotify Premium 3 Months',
    description: 'اشتراك فردي لمدة 3 أشهر بدون إعلانات وجودة عالية.',
    price: 29.99,
    category: 'subscriptions',
    image: 'https://picsum.photos/seed/spotify/400/400',
    rating: 4.6,
    stock: 99,
  },
];

// Helper to generate a fake code pattern
export const generateFakeCode = (type: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const length = 16;
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const DEFAULT_SETTINGS = {
  siteName: 'ماتاجر - Matajir',
  siteDescription: 'منصة عربية لبيع البطاقات الرقمية والاشتراكات',
  logoUrl: '',
  footerText: 'جميع الحقوق محفوظة © ماتاجر',
  socialLinks: {
    facebook: '',
    twitter: '',
    instagram: '',
    telegram: '',
    youtube: ''
  }
  ,
  contactAddress: 'الرياض، المملكة العربية السعودية\nحي الصحافة، طريق الملك فهد',
  contactPhone: '+966 55 123 4567',
  contactEmail: 'support@matajir.com'
};
