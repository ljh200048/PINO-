import React from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
}

export default function ProductCard({ 
  product, 
  onSelect, 
  onAddToCart,
  isWishlisted,
  onToggleWishlist
}: ProductCardProps) {
  
  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => onSelect(product.id)}
      className="bg-[#FFF8F1] border border-[#E8D5C4]/70 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer"
      id={`product-card-${product.id}`}
    >
      
      {/* Visual Image container */}
      <div className="relative aspect-square overflow-hidden bg-white shrink-0">
        
        {/* Category Badge on Top Left */}
        {product.isBest && (
          <span className="absolute top-3 left-3 z-10 bg-[#C79A4A] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
            BEST 🧸
          </span>
        )}
        {!product.isBest && product.isNew && (
          <span className="absolute top-3 left-3 z-10 bg-[#BFD8C0] text-[#4A3E3D] text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
            NEW 🌱
          </span>
        )}

        {/* Favorite Icon */}
        <button
          onClick={(e) => onToggleWishlist(product.id, e)}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/70 backdrop-blur-xs text-[#4A3E3D] hover:text-red-500 hover:bg-white transition-all shadow-xs cursor-pointer"
          aria-label="찜하기"
        >
          <Heart size={15} fill={isWishlisted ? '#EF4444' : 'none'} className={isWishlisted ? 'text-red-500 scale-110' : ''} />
        </button>

        {/* Product image */}
        <img 
          src={product.images[0] || "https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600&auto=format&fit=crop&q=80"} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Quick visual overlay */}
        <div className="absolute inset-0 bg-[#4A3E3D]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="bg-white/90 backdrop-blur-xs p-2.5 rounded-full text-[#4A3E3D] shadow-sm hover:scale-110 transition-transform">
            <Eye size={16} />
          </span>
        </div>
      </div>

      {/* Info details */}
      <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  size={12} 
                  fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} 
                  className={i < Math.floor(product.rating) ? 'text-amber-400' : 'text-gray-200'} 
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 font-bold">({product.reviewsCount})</span>
          </div>

          {/* Title */}
          <h4 className="text-sm md:text-base font-bold text-[#4A3E3D] leading-snug group-hover:text-[#C79A4A] transition-colors line-clamp-1">
            {product.name}
          </h4>

          {/* Short description teaser */}
          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-normal font-medium">
            {product.description}
          </p>
        </div>

        {/* Pricing bar */}
        <div className="mt-4 pt-3 border-t border-[#E8D5C4]/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 block font-bold leading-none">판매금액</span>
            <span className="text-sm md:text-base font-extrabold text-[#4A3E3D]">
              {product.price.toLocaleString()}원
            </span>
          </div>

          <button
            onClick={(e) => onAddToCart(product.id, e)}
            className="p-2.5 rounded-2xl bg-[#E8D5C4]/50 hover:bg-[#C79A4A] text-[#4A3E3D] hover:text-white transition-all shadow-xs cursor-pointer active:scale-95"
            title="장바구니 담기"
            id={`btn-quick-cart-${product.id}`}
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>

    </motion.div>
  );
}
