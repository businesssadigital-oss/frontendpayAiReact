
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { X, ShoppingCart, Star, ShieldCheck, Clock, ArrowLeft, Check, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Product, Category, Review, User, Order } from '../types';
import { MOCK_PRODUCTS } from '../constants';

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onSwitchProduct: (product: Product) => void;
  reviews: Review[];
  onAddReview: (rating: number, comment: string) => Promise<void>;
  currentUser: User | null;
  hasPurchased: boolean;
  allProducts?: Product[];
}

export const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  categories, 
  isOpen, 
  onClose, 
  onAddToCart, 
  onSwitchProduct,
  reviews,
  onAddReview,
  currentUser,
  hasPurchased,
  allProducts = []
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isAdded, setIsAdded] = useState(false);
  
  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Scroll to top when product changes
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
    setNewComment('');
    setNewRating(5);
  }, [product]);

  // Reset added state when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setIsAdded(false);
    }
  }, [isOpen, product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    // استخدام قائمة المنتجات المحدثة أو MOCK_PRODUCTS كبديل
    const productsList = allProducts.length > 0 ? allProducts : MOCK_PRODUCTS;
    return productsList
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  }, [product, allProducts]);
  
  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || id;
  };

  const handleAddToCart = () => {
    if (!product || isAdded) return;
    
    setIsAdded(true);
    onAddToCart(product);
    
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);
    await onAddReview(newRating, newComment);
    setIsSubmittingReview(false);
    setNewComment('');
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full text-gray-800 transition-colors md:text-white"
        >
          <X size={24} />
        </button>

        {/* Image Section (portrait display to match example) */}
        <div className="w-full md:w-1/2 bg-gray-100 relative aspect-[3/3] h-64 md:h-auto shrink-0">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6 md:hidden">
            <h2 className="text-white text-2xl font-bold">{product.name}</h2>
          </div>
        </div>

        {/* Details Section */}
        <div 
          ref={panelRef}
          className="w-full md:w-1/2 p-8 flex flex-col bg-white overflow-y-auto"
        >
          <div className="mb-6 hidden md:block">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                {getCategoryName(product.category)}
              </span>
              <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                <Star size={14} fill="currentColor" />
                {product.rating}
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{product.name}</h2>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6 text-lg">
            {product.description}
            <br className="mb-2" />
            هذا المنتج رقمي بالكامل. سيتم إرسال الكود فوراً إلى صفحة طلباتك بعد إتمام عملية الدفع.
          </p>
          
          {/* Reviews Section */}
          <div className="mb-8 border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               <MessageSquare size={18} className="text-indigo-600" />
               التقييمات والمراجعات ({reviews.length})
            </h3>

            {/* Reviews List */}
            <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-2">
               {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm">لا توجد مراجعات بعد. كن أول من يقيم هذا المنتج!</p>
               ) : (
                  reviews.map(review => (
                     <div key={review.id} className="bg-gray-50 p-3 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-sm text-gray-900">{review.userName}</span>
                           <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div className="flex text-yellow-400 mb-1">
                           {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" className={i < review.rating ? "" : "text-gray-300"} />
                           ))}
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                     </div>
                  ))
               )}
            </div>

            {/* Add Review Form */}
            {currentUser ? (
               hasPurchased ? (
                  <form onSubmit={handleSubmitReview} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-bold text-indigo-900">أضف تقييمك</span>
                         <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                               <button 
                                 key={star}
                                 type="button" 
                                 onClick={() => setNewRating(star)}
                                 className={`${star <= newRating ? 'text-yellow-500' : 'text-gray-300'} hover:scale-110 transition`}
                               >
                                  <Star size={16} fill={star <= newRating ? "currentColor" : "none"} />
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <input 
                           type="text" 
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           placeholder="اكتب تعليقك هنا..."
                           className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                           required
                         />
                         <button 
                           type="submit" 
                           disabled={isSubmittingReview}
                           className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition"
                         >
                            <Send size={18} />
                         </button>
                      </div>
                  </form>
               ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                     <AlertCircle size={16} />
                     يجب شراء المنتج لتتمكن من إضافة تقييم.
                  </div>
               )
            ) : (
               <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl text-center">
                  يرجى تسجيل الدخول لإضافة تقييم.
               </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                منتجات قد تعجبك
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                {relatedProducts.map(related => (
                  <div 
                    key={related.id} 
                    onClick={() => onSwitchProduct(related)}
                    className="min-w-[140px] w-[140px] cursor-pointer group bg-gray-50 rounded-xl p-2 border border-gray-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="aspect-[3/3] rounded-lg overflow-hidden mb-2 relative">
                      <img 
                        src={related.image} 
                        alt={related.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">{related.name}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-indigo-600 font-bold">${related.price}</span>
                      <div className="p-1 bg-white rounded-full text-gray-400 group-hover:text-indigo-600 shadow-sm">
                         <ArrowLeft size={10} className="rtl:rotate-180" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8 mt-auto">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <ShieldCheck className="text-green-600" />
              <div className="text-sm">
                <p className="font-bold text-gray-900">ضمان رسمي</p>
                <p className="text-gray-500">كود أصلي 100%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Clock className="text-blue-600" />
              <div className="text-sm">
                <p className="font-bold text-gray-900">تسليم فوري</p>
                <p className="text-gray-500">خلال ثوانٍ</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4 bg-white sticky bottom-0">
            <div className="flex flex-col">
              <span className="text-sm text-gray-400">السعر الإجمالي</span>
              <span className="text-3xl font-bold text-indigo-600">${product.price}</span>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`flex-1 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                isAdded 
                  ? 'bg-emerald-500 text-white scale-105 shadow-emerald-200' 
                  : 'bg-gray-900 hover:bg-indigo-600 text-white hover:shadow-indigo-200'
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={20} className="animate-bounce" />
                  تمت الإضافة!
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  إضافة للسلة
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
