import React, { useState } from 'react';
import { CartItem, Product, UserProfile, Order } from '../types';
import { createOrder, updateUserProfile } from '../lib/firebase';
import { 
  Trash2, 
  ShoppingBag, 
  Gift, 
  FileText, 
  DollarSign, 
  AlertCircle,
  Truck,
  CheckCircle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  cartItems: CartItem[];
  products: Product[];
  user: any;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onUpdateCartQty: (productId: string, quantity: number) => void;
  onRemoveCartItem: (productId: string) => void;
  onClearCart: () => void;
  onLoginRequest: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function Cart({
  cartItems,
  products,
  user,
  userProfile,
  setUserProfile,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onLoginRequest,
  setCurrentTab
}: CartProps) {

  // Order fields
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [usePoints, setUsePoints] = useState<number>(0);
  const [depositorName, setDepositorName] = useState('');
  const [selectedBank, setSelectedBank] = useState('농협은행 (352-1396-4182-13 예금주: 장정현)');
  
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddr, setReceiverAddr] = useState('');
  const [receiverAddrDetail, setReceiverAddrDetail] = useState('');

  // Submit status
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Calculate cart items with full product details
  const enrichedItems = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product !== undefined) as {
    productId: string;
    quantity: number;
    selectedOptions?: { packing?: boolean; memo?: string };
    product: Product;
  }[];

  if (enrichedItems.length === 0 && !orderSuccessId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4" id="cart-empty-view">
        <div className="w-16 h-16 bg-[#E8D5C4]/40 rounded-full flex items-center justify-center mx-auto text-[#C79A4A]">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-xl font-bold text-[#4A3E3D]">장바구니가 텅 비어 있습니다.</h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
          한 땀 한 땀 정성이 깃든 따스한 수제 펠트 인형들을 구경하러 여행을 떠나 보실까요?
        </p>
        <button
          onClick={() => setCurrentTab('shop')}
          className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold px-6 py-3 rounded-2xl shadow transition-all cursor-pointer"
        >
          온라인숍 구경하러 가기 🛍️
        </button>
      </div>
    );
  }

  // Math
  const itemsSubtotal = enrichedItems.reduce((acc, item) => {
    let price = item.product.price * item.quantity;
    if (item.selectedOptions?.packing) {
      price += 3000 * item.quantity; // wrap packaging addon
    }
    return acc + price;
  }, 0);

  // Delivery Fee calculation
  const deliveryFee = itemsSubtotal >= 50000 ? 0 : 3000;

  // Coupon Discount
  let couponDiscount = 0;
  const activeCoupon = userProfile?.coupons.find(c => c.id === selectedCouponId && !c.used);
  if (activeCoupon) {
    if (activeCoupon.type === 'percent') {
      couponDiscount = Math.floor(itemsSubtotal * (activeCoupon.discount / 100));
    } else {
      couponDiscount = activeCoupon.discount;
    }
  }

  // Points Discount limits
  const maxAvailablePointsToUse = Math.min(
    userProfile?.points || 0, 
    itemsSubtotal - couponDiscount
  );

  const finalTotal = Math.max(0, itemsSubtotal + deliveryFee - couponDiscount - usePoints);
  
  // Earn points (1% of paidAmount)
  const pointsEarned = Math.floor(finalTotal * 0.01);

  const handleApplyPoints = (val: string) => {
    const num = parseInt(val) || 0;
    if (num < 0) {
      setUsePoints(0);
    } else if (num > maxAvailablePointsToUse) {
      setUsePoints(maxAvailablePointsToUse);
    } else {
      setUsePoints(num);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!user) {
      onLoginRequest();
      return;
    }

    if (!depositorName.trim()) {
      setCheckoutError('무통장 입금 확인을 위해 입금자명을 반드시 적어 주세요.');
      return;
    }

    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddr.trim()) {
      setCheckoutError('배송지 정보를 정확하게 누락 없이 입력해 주세요.');
      return;
    }

    try {
      setIsOrdering(true);

      const newOrder: Omit<Order, 'id' | 'createdAt'> = {
        userId: user.uid,
        userEmail: user.email || 'guest@pino.com',
        userName: userProfile?.displayName || '회원',
        items: enrichedItems.map(it => ({
          productId: it.productId,
          name: it.product.name + (it.selectedOptions?.packing ? ' (선물포장 포함)' : ''),
          price: it.product.price + (it.selectedOptions?.packing ? 3000 : 0),
          quantity: it.quantity,
          image: it.product.images[0]
        })),
        totalPrice: itemsSubtotal + deliveryFee,
        discountAmount: couponDiscount + usePoints,
        paidAmount: finalTotal,
        pointsUsed: usePoints,
        pointsEarned,
        paymentMethod: 'bank_transfer',
        paymentInfo: {
          depositor: depositorName,
          bank: selectedBank
        },
        status: 'pending',
        shippingAddress: {
          name: receiverName,
          phone: receiverPhone,
          address: receiverAddr,
          detailAddress: receiverAddrDetail
        }
      };

      const orderId = await createOrder(newOrder);

      // Deduct points/coupons from profile
      if (userProfile) {
        const nextPoints = userProfile.points - usePoints + pointsEarned;
        const nextCoupons = userProfile.coupons.map(c => {
          if (c.id === selectedCouponId) {
            return { ...c, used: true };
          }
          return c;
        });

        await updateUserProfile(user.uid, {
          points: nextPoints,
          coupons: nextCoupons
        });

        // Sync local header/profile state
        setUserProfile(prev => prev ? {
          ...prev,
          points: nextPoints,
          coupons: nextCoupons
        } : null);
      }

      onClearCart();
      setOrderSuccessId(orderId);

    } catch (err: any) {
      console.error(err);
      setCheckoutError('주문 처리 도중 예상외의 오류가 발생했습니다.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12" id="cart-main-container">
      
      <AnimatePresence mode="wait">
        {orderSuccessId ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto bg-[#BFD8C0]/25 border border-[#BFD8C0] p-8 rounded-3xl text-center space-y-5"
            id="checkout-success-view"
          >
            <CheckCircle className="text-[#C79A4A] mx-auto animate-bounce" size={48} />
            <h2 className="text-xl font-bold text-[#4A3E3D]">주문이 무사히 완료되었습니다! 🎉</h2>
            <div className="bg-white border border-[#E8D5C4] rounded-2xl p-4 text-xs text-left text-[#4A3E3D] space-y-2 leading-relaxed font-semibold">
              <p>📍 <b>주문 번호</b>: {orderSuccessId}</p>
              <p>💰 <b>입금 금액</b>: <span className="text-[#C79A4A] text-sm font-bold">{finalTotal.toLocaleString()}원</span></p>
              <p>🏦 <b>입금 은행</b>: {selectedBank}</p>
              <p>👤 <b>입금자명</b>: {depositorName} 님</p>
              <p>🎁 <b>적립 예정 포인트</b>: +{pointsEarned.toLocaleString()}P</p>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              ※ 선택하신 계좌로 입금해 주시면 입금 내역 확인 후 수작업 바느질 포장이 정성스레 개시됩니다. 입금/배송 조회는 마이페이지에서 확인하실 수 있습니다.
            </p>
            <div className="pt-4 flex gap-3 justify-center">
              <button
                onClick={() => setCurrentTab('mypage')}
                className="py-3 px-6 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                id="btn-goto-mypage"
              >
                나의 주문 목록 보러가기
              </button>
              <button
                onClick={() => { setOrderSuccessId(null); setDepositorName(''); setCurrentTab('home'); }}
                className="py-3 px-6 bg-white border border-[#E8D5C4] text-[#4A3E3D] hover:bg-neutral-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                메인 홈으로 가기
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left List of items (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-lg font-black text-[#4A3E3D] pb-2 border-b border-[#E8D5C4] flex items-center gap-1.5">
                <ShoppingBag size={18} className="text-[#C79A4A]" />
                <span>선택한 소중한 펠트소품 ({enrichedItems.length}개)</span>
              </h2>

              <div className="space-y-3">
                {enrichedItems.map((item) => (
                  <div 
                    key={item.productId}
                    className="bg-[#FFF8F1] border border-[#E8D5C4]/60 p-4 rounded-3xl flex gap-4 items-center justify-between"
                  >
                    {/* Img and text */}
                    <div className="flex gap-3 items-center min-w-0">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name} 
                        className="w-14 h-14 object-cover rounded-xl border border-[#E8D5C4]/50 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs md:text-sm font-bold text-[#4A3E3D] truncate">{item.product.name}</h4>
                        <p className="text-[11px] text-gray-500 font-semibold">{item.product.price.toLocaleString()}원</p>
                        
                        {item.selectedOptions?.packing && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-rose-500 font-extrabold bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 inline-flex">
                            <Gift size={9} />
                            <span>선물포장 패키지 추가 (+3,000원)</span>
                          </div>
                        )}
                        {item.selectedOptions?.memo && (
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate pl-1 border-l-2 border-[#E8D5C4]">
                            메시지: &ldquo;{item.selectedOptions.memo}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls and delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-[#E8D5C4] rounded-lg bg-white overflow-hidden text-xs">
                        <button
                          onClick={() => onUpdateCartQty(item.productId, Math.max(1, item.quantity - 1))}
                          className="p-1 px-2 hover:bg-neutral-50 text-gray-400 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-[#4A3E3D]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateCartQty(item.productId, Math.min(item.product.stock, item.quantity + 1))}
                          className="p-1 px-2 hover:bg-neutral-50 text-gray-400 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveCartItem(item.productId)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Free delivery indicator bar */}
              <div className="p-4 bg-[#BFD8C0]/15 border border-[#BFD8C0]/40 rounded-3xl text-xs text-[#4A3E3D] flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Truck size={14} className="text-[#C79A4A]" />
                  {itemsSubtotal >= 50000 
                    ? '🎉 5만원 이상 무료배송 혜택이 적용되었습니다!' 
                    : `💸 ${(50000 - itemsSubtotal).toLocaleString()}원 더 담으시면 배송비 무료!`}
                </span>
                <span className="font-bold text-[#C79A4A]">5만원 무료배송</span>
              </div>

              {/* Shipping Address Forms */}
              <div className="bg-[#FFF8F1] border border-[#E8D5C4] rounded-3xl p-5 md:p-6 space-y-4 shadow-2xs">
                <h3 className="text-xs font-black text-[#4A3E3D] uppercase tracking-wider flex items-center gap-1 border-b border-[#E8D5C4]/40 pb-2">
                  <FileText size={15} className="text-[#C79A4A]" />
                  <span>배송지 정보 입력</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">수령인 성함</label>
                    <input
                      type="text"
                      required
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">수령인 연락처</label>
                    <input
                      type="tel"
                      required
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">배송 주소</label>
                    <input
                      type="text"
                      required
                      value={receiverAddr}
                      onChange={(e) => setReceiverAddr(e.target.value)}
                      placeholder="제주특별자치도 서귀포시 감귤읍 감귤동산로 123"
                      className="w-full text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">상세 주소 (동/호수)</label>
                    <input
                      type="text"
                      value={receiverAddrDetail}
                      onChange={(e) => setReceiverAddrDetail(e.target.value)}
                      placeholder="101동 1204호"
                      className="w-full text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Invoice Receipt Math summary (5 cols) */}
            <div className="lg:col-span-5 bg-[#FFF8F1] border border-[#E8D5C4] rounded-3xl p-5 md:p-6 space-y-5 shadow-md">
              <h3 className="text-xs font-black text-[#4A3E3D] uppercase tracking-wider flex items-center gap-1 border-b border-[#E8D5C4]/40 pb-2">
                <DollarSign size={15} className="text-[#C79A4A]" />
                <span>최종 결제 계산서</span>
              </h3>

              {/* Price details line-items */}
              <div className="space-y-2.5 text-xs text-[#4A3E3D]/80">
                <div className="flex justify-between">
                  <span>선택 상품 합계 금액</span>
                  <span className="font-bold">{itemsSubtotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span>배송비</span>
                  <span>{deliveryFee === 0 ? '무료' : `+${deliveryFee.toLocaleString()}원`}</span>
                </div>

                {/* Coupons Discount Selection */}
                {user ? (
                  <div className="pt-2 border-t border-[#E8D5C4]/30 space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500">할인 쿠폰 적용</label>
                    <select
                      value={selectedCouponId}
                      onChange={(e) => setSelectedCouponId(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E8D5C4] p-2 rounded-xl text-[#4A3E3D] focus:outline-none focus:ring-1 focus:ring-[#C79A4A] cursor-pointer"
                    >
                      <option value="">보유 쿠폰을 선택하세요 (사용 안 함)</option>
                      {userProfile?.coupons?.filter(c => !c.used).map(coupon => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.name} ({coupon.discount.toLocaleString()}{coupon.type === 'percent' ? '%' : '원'} 할인)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400 bg-white p-2 rounded-xl border border-dashed border-[#E8D5C4] text-center">
                    로그인하시면 가입 웰컴 쿠폰 10%를 쓰실 수 있습니다.
                  </div>
                )}

                {/* Points Selection */}
                {user && (userProfile?.points || 0) > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#E8D5C4]/30">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                      <span>보유 포인트 사용</span>
                      <span>사용 가능: {userProfile?.points.toLocaleString()}P</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={usePoints || ''}
                        onChange={(e) => handleApplyPoints(e.target.value)}
                        placeholder="0"
                        className="flex-1 text-xs p-2 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                      <button
                        type="button"
                        onClick={() => setUsePoints(maxAvailablePointsToUse)}
                        className="text-[10px] bg-[#E8D5C4]/50 hover:bg-[#E8D5C4] text-[#4A3E3D] font-bold px-3 rounded-xl transition-all cursor-pointer"
                      >
                        최대전부
                      </button>
                    </div>
                  </div>
                )}

                {/* Discount display */}
                {(couponDiscount > 0 || usePoints > 0) && (
                  <div className="pt-2 border-t border-[#E8D5C4]/30 space-y-1 text-[#4A3E3D]/65 text-[11px] font-bold bg-[#BFD8C0]/15 p-2.5 rounded-xl">
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-[#C79A4A]">
                        <span>쿠폰 추가 할인</span>
                        <span>-{couponDiscount.toLocaleString()}원</span>
                      </div>
                    )}
                    {usePoints > 0 && (
                      <div className="flex justify-between text-[#C79A4A]">
                        <span>포인트 사용 공제</span>
                        <span>-{usePoints.toLocaleString()}원</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-3 border-t-2 border-[#E8D5C4] text-[#4A3E3D] font-black">
                  <span className="text-sm">최종 결제 금액</span>
                  <span className="text-lg text-[#C79A4A] font-extrabold">{finalTotal.toLocaleString()}원</span>
                </div>
                
                {/* Earn points notice */}
                {user && (
                  <div className="text-[10px] text-[#BFD8C0] font-extrabold text-right">
                    ✓ 구매 완료 시 {pointsEarned.toLocaleString()}P 적립 예정 (1% 캐시백)
                  </div>
                )}
              </div>

              {/* Wire Transfer bank select & depositor */}
              <div className="bg-white border border-[#E8D5C4]/60 p-4 rounded-2xl space-y-3.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase block leading-none">무통장 결제 상세 정보</span>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">입금하실 공방 계좌</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full text-[11px] bg-[#FFF8F1] border border-[#E8D5C4] p-2 rounded-xl text-[#4A3E3D] font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="농협은행 (352-1396-4182-13 예금주: 장정현)">농협은행 352-1396-4182-13 (예금주: 장정현)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">실제 입금자 성함</label>
                  <input
                    type="text"
                    required
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    placeholder="입금증 성명 (예: 홍길동)"
                    className="w-full text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D] font-bold"
                  />
                  <span className="text-[9px] text-gray-400 block mt-0.5 leading-none">※ 입금자명과 금액 불일치 시 확인이 늦어집니다.</span>
                </div>
              </div>

              {/* Errors & Buttons */}
              <div>
                {checkoutError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {user ? (
                  <button
                    onClick={handleCheckoutSubmit}
                    disabled={isOrdering}
                    className="w-full py-4 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-bold rounded-2xl text-xs md:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    id="btn-place-order"
                  >
                    <span>{isOrdering ? '공방 기기에 기록 중...' : `무통장 입금으로 주문하기 🧸`}</span>
                  </button>
                ) : (
                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={onLoginRequest}
                      className="w-full py-3.5 bg-neutral-400 hover:bg-neutral-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
                    >
                      로그인 후 주문 가능합니다 🔒
                    </button>
                    <span className="text-[10px] text-gray-400 block">계정이 없으신가요? 1초 퀵 데모 로그인을 사용해보세요!</span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
