import React, { useState, useEffect } from 'react';
import { Product, Review, UserProfile } from '../types';
import { 
  fetchProductReviews, 
  addReview, 
  db 
} from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Star, 
  ShoppingCart, 
  Truck, 
  Undo, 
  ShieldCheck, 
  Gift, 
  Heart, 
  ChevronLeft, 
  Plus, 
  Minus, 
  MessageSquare, 
  ThumbsUp,
  Camera,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailProps {
  productId: string;
  products: Product[];
  onBack: () => void;
  onAddToCart: (productId: string, quantity: number, options: { packing: boolean; memo: string }) => void;
  user: any;
  userProfile: UserProfile | null;
  onLoginRequest: () => void;
  wishlist: string[];
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
}

export default function ProductDetail({
  productId,
  products,
  onBack,
  onAddToCart,
  user,
  userProfile,
  onLoginRequest,
  wishlist,
  onToggleWishlist
}: ProductDetailProps) {
  const product = products.find(p => p.id === productId);
  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">존재하지 않는 상품입니다.</p>
        <button onClick={onBack} className="text-[#C79A4A] underline mt-2 font-bold cursor-pointer">뒤로 가기</button>
      </div>
    );
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [cardMessage, setCardMessage] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'info' | 'shipping' | 'reviews' | 'qa'>('info');

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Leave Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Local state for product stats during live updates
  const [liveRating, setLiveRating] = useState(product.rating);
  const [liveReviewsCount, setLiveReviewsCount] = useState(product.reviewsCount);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoadingReviews(true);
        const fetched = await fetchProductReviews(product.id);
        setReviews(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, [product.id]);

  const handleQtyIncrease = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleQtyDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCartClick = () => {
    onAddToCart(product.id, quantity, {
      packing: isGiftWrap,
      memo: cardMessage
    });
    // Visual alerts or simple confirmation
    alert('장바구니에 상품을 담았습니다! 🧺');
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!user) {
      onLoginRequest();
      return;
    }

    if (!reviewContent.trim() || reviewContent.length < 5) {
      setReviewError('후기 내용은 최소 5자 이상 적어주셔야 합니다.');
      return;
    }

    try {
      const reviewData: Omit<Review, 'id' | 'createdAt'> = {
        productId: product.id,
        productName: product.name,
        userId: user.uid,
        userName: userProfile?.displayName || '회원',
        rating: reviewRating,
        content: reviewContent,
        imageUrl: reviewImage.trim() || undefined
      };

      const newId = await addReview(reviewData);
      
      const newReview: Review = {
        id: newId,
        ...reviewData,
        createdAt: Date.now()
      };

      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);

      // Recalculate average rating
      const sum = updatedReviews.reduce((acc, cur) => acc + cur.rating, 0);
      const avg = parseFloat((sum / updatedReviews.length).toFixed(1));

      setLiveRating(avg);
      setLiveReviewsCount(updatedReviews.length);

      // Update Firestore Product node
      try {
        const prodRef = doc(db, 'products', product.id);
        await updateDoc(prodRef, {
          rating: avg,
          reviewsCount: updatedReviews.length
        });
      } catch (err) {
        console.error('Error updating product rating stats:', err);
      }

      setReviewContent('');
      setReviewImage('');
      setReviewSuccess('정성스러운 사진 후기가 등록되었습니다! 적립포인트 500P가 자동 적립됩니다. 🧸');

      // Award points for leaving a review!
      if (userProfile) {
        const upPoints = userProfile.points + 500;
        await updateDoc(doc(db, 'users', user.uid), { points: upPoints });
      }

    } catch (err: any) {
      console.error(err);
      setReviewError('리뷰 저장 도중 오류가 발생했습니다.');
    }
  };

  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12" id="product-detail-view">
      
      {/* Back button */}
      <button 
        onClick={onBack} 
        className="mb-6 flex items-center gap-1 text-sm font-semibold text-[#4A3E3D] hover:text-[#C79A4A] transition-colors cursor-pointer"
        id="btn-back-to-list"
      >
        <ChevronLeft size={16} />
        <span>쇼핑 목록으로 가기</span>
      </button>

      {/* Main product configuration card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-[#FFF8F1] border border-[#E8D5C4] rounded-3xl p-5 md:p-8 mb-12 shadow-sm">
        
        {/* Left: Images list & display (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main frame */}
          <div className="aspect-square bg-white rounded-3xl overflow-hidden relative border border-[#E8D5C4]/60">
            <img 
              src={product.images[activeImageIndex] || "https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=600&auto=format&fit=crop&q=80"} 
              alt={product.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            
            {/* Tag Overlay */}
            {product.isBest && (
              <span className="absolute top-4 left-4 bg-[#C79A4A] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow-xs">
                BEST 🧸
              </span>
            )}
          </div>

          {/* Thumbnails list */}
          {product.images.length > 1 && (
            <div className="flex gap-2.5">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-[#C79A4A]' : 'border-transparent hover:border-[#E8D5C4]'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Config specs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Category text */}
            <span className="text-xs font-bold text-[#C79A4A] uppercase tracking-wide">
              {product.category === 'felt-doll' ? '펠트인형' : product.category === 'keyring' ? '키링' : product.category === 'mini-doll' ? '미니소품' : '시즌한정'}
            </span>

            {/* Title & Wishlist */}
            <div className="flex justify-between items-start gap-3">
              <h1 className="text-xl md:text-2xl font-extrabold text-[#4A3E3D] leading-tight">
                {product.name}
              </h1>
              <button
                onClick={(e) => onToggleWishlist(product.id, e)}
                className="p-2.5 rounded-2xl border border-[#E8D5C4] hover:border-red-400 bg-white text-[#4A3E3D] hover:text-red-500 transition-all shadow-xs shrink-0 cursor-pointer"
                aria-label="위시리스트"
              >
                <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} className={isWishlisted ? 'text-red-500 scale-110' : ''} />
              </button>
            </div>

            {/* Ratings and reviews stats */}
            <div className="flex items-center gap-4 text-xs font-medium pb-2 border-b border-[#E8D5C4]/40">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="font-bold text-[#4A3E3D]">{liveRating}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-[#4A3E3D]/70">{liveReviewsCount}개의 감성 리뷰</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-bold bg-[#E8D5C4]/30 px-2 py-0.5 rounded text-[10px]">
                {product.stock > 0 ? `재고 ${product.stock}개 남음` : '품절'}
              </span>
            </div>

            {/* Price */}
            <div className="bg-[#E8D5C4]/15 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">판매금액</span>
              <span className="text-xl md:text-2xl font-black text-[#4A3E3D]">
                {product.price.toLocaleString()}원
              </span>
            </div>

            {/* Delivery description badge */}
            <div className="space-y-2 py-2 text-xs text-[#4A3E3D]/80">
              <div className="flex items-center gap-2.5">
                <Truck size={14} className="text-[#C79A4A]" />
                <span>기본 배송: <b>3,000원</b> (5만원 이상 구매 시 무료배송)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Undo size={14} className="text-[#C79A4A]" />
                <span>순수 천연양모 100% 수공예 수작업 제작</span>
              </div>
            </div>

            {/* Config options */}
            <div className="space-y-3 pt-3 border-t border-[#E8D5C4]/40">
              {/* Option: gift packaging */}
              <div className="p-3 bg-white border border-[#E8D5C4] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift size={15} className="text-rose-400" />
                  <span className="text-xs font-bold text-[#4A3E3D]">감성 선물 포장 패키지 추가 (+3,000원)</span>
                </div>
                <input
                  type="checkbox"
                  checked={isGiftWrap}
                  onChange={(e) => setIsGiftWrap(e.target.checked)}
                  className="w-4 h-4 text-[#C79A4A] border-gray-300 rounded focus:ring-[#C79A4A] cursor-pointer"
                />
              </div>

              {/* Message card */}
              {isGiftWrap && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1.5"
                >
                  <label className="block text-[10px] font-bold text-gray-500">선물 포장 리본 카드 메시지 작성</label>
                  <input
                    type="text"
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="리본 택에 각인될 짧은 메시지(15자 이내)"
                    maxLength={15}
                    className="w-full text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                  />
                </motion.div>
              )}
            </div>

            {/* Qty selector */}
            <div className="flex justify-between items-center bg-[#E8D5C4]/10 p-3 rounded-2xl">
              <span className="text-xs font-bold text-[#4A3E3D]">주문 수량</span>
              <div className="flex items-center border border-[#E8D5C4] rounded-xl bg-white overflow-hidden">
                <button
                  onClick={handleQtyDecrease}
                  className="p-2 hover:bg-neutral-50 text-gray-500 transition-colors cursor-pointer"
                >
                  <Minus size={12} />
                </button>
                <span className="px-4 text-xs font-bold text-[#4A3E3D]">{quantity}</span>
                <button
                  onClick={handleQtyIncrease}
                  className="p-2 hover:bg-neutral-50 text-gray-500 transition-colors cursor-pointer"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

          </div>

          {/* Action Buy Buttons */}
          <div className="mt-6 pt-5 border-t border-[#E8D5C4]/30 flex gap-3">
            <button
              onClick={handleAddToCartClick}
              disabled={product.stock === 0}
              className="flex-1 py-4 bg-[#E8D5C4] hover:bg-[#C79A4A] text-[#4A3E3D] hover:text-white font-bold rounded-2xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              id="btn-add-to-cart-detail"
            >
              <ShoppingCart size={16} />
              <span>장바구니에 소중히 담기</span>
            </button>
          </div>

        </div>

      </div>

      {/* Tabs list (Info, Shipping, Reviews, Q&A) */}
      <div className="border-b border-[#E8D5C4] mb-8 flex gap-4 md:gap-8 overflow-x-auto scrollbar-none text-sm font-semibold text-gray-500">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 border-b-2 cursor-pointer transition-all ${
            activeTab === 'info' ? 'border-[#C79A4A] text-[#C79A4A] font-extrabold' : 'border-transparent hover:text-[#4A3E3D]'
          }`}
        >
          상세설명
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`pb-3 border-b-2 cursor-pointer transition-all ${
            activeTab === 'shipping' ? 'border-[#C79A4A] text-[#C79A4A] font-extrabold' : 'border-transparent hover:text-[#4A3E3D]'
          }`}
        >
          배송 / 교환 정보
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 border-b-2 cursor-pointer transition-all ${
            activeTab === 'reviews' ? 'border-[#C79A4A] text-[#C79A4A] font-extrabold' : 'border-transparent hover:text-[#4A3E3D]'
          }`}
        >
          포토후기 ({reviews.length})
        </button>
      </div>

      {/* Tab content area */}
      <div className="bg-[#FFF8F1] border border-[#E8D5C4]/60 rounded-3xl p-6 md:p-8 min-h-[250px]">
        
        {activeTab === 'info' && (
          <div className="space-y-6 text-sm text-[#4A3E3D] leading-relaxed">
            <h3 className="text-base font-bold text-[#C79A4A]">손수 빚어 만든 정성의 온도</h3>
            <p>{product.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E8D5C4]/40">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 block uppercase">제작 소재 정보</span>
                <p className="text-xs font-semibold text-[#4A3E3D]">100% 뉴질랜드산 최고급 메리노 양모 펠트</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 block uppercase">보관 시 주의사항</span>
                <p className="text-xs font-semibold text-[#4A3E3D]">습기를 피해 주시고 가벼운 오염은 미온수 손세탁 권장</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-4 text-xs md:text-sm text-[#4A3E3D]/80 leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-bold text-[#C79A4A]">🚚 배송 안내</h4>
              <p>• PINO공방은 대한통운 안심 특송을 통해 안전하게 출고됩니다.</p>
              <p>• 기본 배송비는 3,000원이며, 5만원 이상 결제 시 배송비가 자동 면제됩니다.</p>
              <p>• 발송 완료 후 1-2영업일 이내 수령 가능하며, 마이페이지에서 상세 추적이 가능합니다.</p>
            </div>
            <div className="space-y-2 border-t border-[#E8D5C4]/40 pt-4">
              <h4 className="font-bold text-[#C79A4A]">📦 교환 / 반품 정보</h4>
              <p>• 일반 완제품 상품의 교환/반품은 제품 포장이 훼손되지 않은 미개봉 상태에 한해 수령 후 7일 이내 가능합니다.</p>
              <p>• 왕복 배송비(6,000원)는 고객 부담이며 불량 제품에 한해서는 무료 처리됩니다.</p>
              <p>• 1:1 맞춤 주문제작(Custom) 인형의 경우 공방 작가의 수작업이 본격 개시된 이후에는 취소 및 교환/반품이 절대 불가능합니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8" id="product-reviews-tab">
            
            {/* Reviews header & total rating block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white border border-[#E8D5C4]/60 p-5 rounded-2xl">
              <div className="text-center md:border-r border-[#E8D5C4]/60 pb-4 md:pb-0">
                <span className="text-xs font-semibold text-gray-400 block uppercase">소중한 고객 평균 평점</span>
                <span className="text-3xl font-black text-[#4A3E3D] mt-1 block">{liveRating} / 5.0</span>
                <div className="flex justify-center text-amber-400 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(liveRating) ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>

              <div className="col-span-2 text-xs text-gray-500 leading-relaxed px-0 md:px-4">
                🐾 PINO공방 제품을 구매해 주신 분들의 리얼 손바느질 후기입니다. 소중한 포토 후기를 남겨주시면 감사의 보답으로 다음 쇼핑몰에서 바로 활용하실 수 있는 <b>500P 포인트</b>를 즉시 적립해 드립니다!
              </div>
            </div>

            {/* List Reviews */}
            <div className="space-y-4">
              {loadingReviews ? (
                <p className="text-center text-gray-400 text-xs">후기를 로딩하고 있습니다...</p>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10 bg-white border border-dashed border-[#E8D5C4] rounded-2xl text-gray-400 text-xs font-semibold">
                  아직 작성된 제품 후기가 없습니다. 첫 번째 영광의 후기 주인공이 되어보세요! 🧸
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white border border-[#E8D5C4]/50 p-4.5 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#4A3E3D]">{rev.userName}</span>
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={11} fill={i < rev.rating ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs text-[#4A3E3D] leading-relaxed font-sans">{rev.content}</p>

                      {rev.imageUrl && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E8D5C4]">
                          <img src={rev.imageUrl} alt="Review attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write review Form */}
            <div className="border-t border-[#E8D5C4] pt-6">
              <h4 className="text-sm font-bold text-[#4A3E3D] flex items-center gap-1.5 mb-4">
                <Camera size={16} className="text-[#C79A4A]" />
                <span>정성 후기 작성하고 500P 적립 받기</span>
              </h4>

              {user ? (
                <form onSubmit={handleSubmitReview} className="space-y-4 bg-white border border-[#E8D5C4]/60 p-4 rounded-2xl">
                  {/* Rating Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4A3E3D]">별점 선택:</span>
                    <div className="flex text-amber-400 gap-1 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setReviewRating(starVal)}
                          className="hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star size={18} fill={starVal <= reviewRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">소중한 후기 내용</label>
                    <textarea
                      required
                      rows={3}
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="제품의 원단, 마감, 인형의 촉감 등 느낀 점을 자유롭게 기록해 주세요!"
                      className="w-full text-xs p-3 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                  </div>

                  {/* Optional Review Image */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">리뷰 포토 URL (선택)</label>
                    <input
                      type="url"
                      value={reviewImage}
                      onChange={(e) => setReviewImage(e.target.value)}
                      placeholder="https://example.com/my-felt-bear.jpg (사진 주소를 넣어주세요)"
                      className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                  </div>

                  {/* Alerts */}
                  {reviewError && (
                    <p className="text-red-500 text-xs flex items-center gap-1.5 font-bold">
                      <AlertCircle size={14} />
                      <span>{reviewError}</span>
                    </p>
                  )}
                  {reviewSuccess && (
                    <p className="text-emerald-700 text-xs flex items-center gap-1.5 font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <Star size={14} className="text-[#C79A4A]" />
                      <span>{reviewSuccess}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                    id="submit-product-review-btn"
                  >
                    후기 등록 완료하기 ✏️
                  </button>
                </form>
              ) : (
                <div className="p-5 bg-white border border-[#E8D5C4]/60 rounded-2xl text-center">
                  <p className="text-xs text-gray-500 mb-2">후기를 작성하고 적립 보상을 받으려면 로그인이 필요합니다.</p>
                  <button
                    onClick={onLoginRequest}
                    className="text-xs bg-[#4A3E3D] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#C79A4A] transition-all cursor-pointer"
                  >
                    로그인 창 띄우기
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
