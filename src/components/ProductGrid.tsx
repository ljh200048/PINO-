import React, { useState } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { Search, SlidersHorizontal, Grid3X3, PackageOpen } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
}

export default function ProductGrid({ 
  products, 
  onSelectProduct, 
  onAddToCart,
  wishlist,
  onToggleWishlist
}: ProductGridProps) {
  const [selectedCat, setSelectedCat] = useState<'all' | 'felt-doll' | 'keyring' | 'mini-doll' | 'seasonal'>('all');
  const [sortOption, setSortOption] = useState<'popular' | 'low-price' | 'high-price' | 'new'>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories translation
  const categories = [
    { id: 'all', label: '전체상품' },
    { id: 'felt-doll', label: '펠트인형 🧸' },
    { id: 'keyring', label: '키링 🔑' },
    { id: 'mini-doll', label: '미니소품 🐥' },
    { id: 'seasonal', label: '시즌한정 🎄' },
  ];

  // Filtering
  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCat === 'all' || prod.category === selectedCat;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'low-price':
        return a.price - b.price;
      case 'high-price':
        return b.price - a.price;
      case 'new':
        return b.createdAt - a.createdAt;
      case 'popular':
      default:
        return b.salesCount - a.salesCount;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="shop-catalog">
      
      {/* Category Horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none justify-start md:justify-center mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id as any)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCat === cat.id
                ? 'bg-[#4A3E3D] border-[#4A3E3D] text-white shadow-md'
                : 'bg-white border-[#E8D5C4]/80 text-[#4A3E3D] hover:bg-[#E8D5C4]/15'
            }`}
            id={`filter-cat-${cat.id}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#FFF8F1] border border-[#E8D5C4] rounded-3xl p-4 mb-8">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="찾으시는 인형이 있으신가요? 🐾"
            className="w-full text-xs py-2.5 pl-10 pr-4 bg-white border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
            id="product-catalog-search"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <span className="text-xs font-bold text-[#4A3E3D]">정렬순:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="text-xs bg-white border border-[#E8D5C4] p-2.5 rounded-2xl text-[#4A3E3D] font-semibold focus:outline-none focus:ring-1 focus:ring-[#C79A4A] cursor-pointer"
            id="product-catalog-sort"
          >
            <option value="popular">인기 높은순 🔥</option>
            <option value="new">신규 등록순 🌱</option>
            <option value="low-price">가격 낮은순 💸</option>
            <option value="high-price">가격 높은순 💎</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-24 bg-[#FFF8F1]/50 border border-dashed border-[#E8D5C4] rounded-3xl text-gray-400 flex flex-col items-center gap-3">
          <PackageOpen size={48} className="text-[#E8D5C4]" />
          <p className="text-sm font-semibold">아쉽게도 해당 조건의 상품이 존재하지 않습니다.</p>
          <button 
            onClick={() => { setSelectedCat('all'); setSearchQuery(''); }}
            className="text-xs bg-[#4A3E3D] hover:bg-[#C79A4A] text-white px-4 py-2 rounded-xl transition-all font-bold cursor-pointer"
          >
            전체 상품 보러가기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}

    </div>
  );
}
