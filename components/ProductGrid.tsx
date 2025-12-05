
import React from 'react';
import { Product, Category } from '../types';
import { ShoppingCart, Star, Eye, Ban } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  addToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, categories, addToCart, onViewProduct }) => {
  
  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || id;
  };

  if (products.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
           <Ban size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
        <p className="text-gray-500">جرب البحث بكلمات مختلفة أو تغيير التصنيف</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const isOutOfStock = product.stock <= 0;

        return (
          <div key={product.id} className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col relative ${isOutOfStock ? 'opacity-90' : ''}`}>
            
            {/* Image Area (portrait cards - match example image aspect) */}
            <div className="relative aspect-[3/3] overflow-hidden bg-gray-100 cursor-pointer" onClick={() => onViewProduct(product)}>
              <img 
                src={product.image} 
                alt={product.name} 
                className={`w-full h-full object-cover transform ${isOutOfStock ? 'grayscale filter' : 'group-hover:scale-110'} transition-transform duration-500`}
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm z-10">
                {getCategoryName(product.category)}
              </div>
              
              {/* Out of Stock Overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                  <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg transform -rotate-6 border-2 border-white/50 backdrop-blur-sm">
                    نفذت الكمية
                  </span>
                </div>
              )}
              
              {/* Quick View Overlay */}
              {!isOutOfStock && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button className="bg-white/90 text-gray-900 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Eye size={18} />
                    نظرة سريعة
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 
                  className="font-bold text-gray-900 line-clamp-1 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => onViewProduct(product)}
                >
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-50 px-1.5 py-0.5 rounded">
                  <Star size={10} fill="currentColor" />
                  {product.rating}
                </div>
              </div>
              
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                {product.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">السعر</span>
                  <span className={`text-lg font-bold ${isOutOfStock ? 'text-gray-400 line-through' : 'text-indigo-600'}`}>
                    ${product.price}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isOutOfStock) addToCart(product);
                  }}
                  disabled={isOutOfStock}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    isOutOfStock 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-900 hover:bg-indigo-600 text-white shadow-lg shadow-gray-200 hover:shadow-indigo-200 hover:-translate-y-0.5'
                  }`}
                  aria-label={isOutOfStock ? "غير متوفر" : "إضافة للسلة"}
                  title={isOutOfStock ? "المنتج غير متوفر حالياً" : "إضافة للسلة"}
                >
                  {isOutOfStock ? <Ban size={20} /> : <ShoppingCart size={20} />}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
