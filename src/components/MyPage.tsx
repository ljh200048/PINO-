import React, { useState, useEffect } from 'react';
import { 
  fetchUserOrders, 
  fetchUserCustomOrders, 
  updateOrderStatus, 
  updateCustomOrderStatus, 
  db 
} from '../lib/firebase';
import { Order, CustomOrder, UserProfile } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Sparkles, 
  ShoppingBag, 
  Scissors, 
  CheckCircle, 
  Truck, 
  CreditCard, 
  User as UserIcon, 
  Clock, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MyPageProps {
  user: any;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onLoginRequest: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function MyPage({ 
  user, 
  userProfile, 
  setUserProfile,
  onLoginRequest,
  setCurrentTab
}: MyPageProps) {
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom order payment modal
  const [payingCustomId, setPayingCustomId] = useState<string | null>(null);
  const [payingCustomPrice, setPayingCustomPrice] = useState<number>(0);
  const [customDepositor, setCustomDepositor] = useState('');
  const [customPaymentSuccess, setCustomPaymentSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      onLoginRequest();
      return;
    }

    async function loadUserData() {
      try {
        setLoading(true);
        const [userOrd, userCust] = await Promise.all([
          fetchUserOrders(user.uid),
          fetchUserCustomOrders(user.uid)
        ]);
        setOrders(userOrd);
        setCustomOrders(userCust);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user]);

  // Standard Order status update (e.g. Purchase Confirmation)
  const handleConfirmDelivery = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'delivered');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' as const } : o));
      alert('구매가 무사히 확정되었습니다! 따뜻한 포토 후기를 남기시면 추가 포인트가 지급됩니다. 🧸');
    } catch (err: any) {
      console.error(err);
      alert('상태 업데이트 중 에러가 발생했습니다.');
    }
  };

  // Custom Order Pay Submit
  const handlePayCustomEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomId) return;
    if (!customDepositor.trim()) {
      alert('입금자명을 적어주세요.');
      return;
    }

    try {
      await updateCustomOrderStatus(payingCustomId, {
        status: 'paid',
        adminMemo: `입금 완료 확인됨 (입금자명: ${customDepositor})`
      });

      setCustomOrders(prev => prev.map(c => c.id === payingCustomId ? { 
        ...c, 
        status: 'paid' as const, 
        adminMemo: `입금 완료 확인됨 (입금자명: ${customDepositor})` 
      } : c));

      // Award points or welcome bonuses if needed, or simply log success
      setCustomPaymentSuccess('🎉 주문제작 입금이 완료되었습니다! 공방 작가진이 바느질 수공예 일정을 개시합니다.');
      setTimeout(() => {
        setPayingCustomId(null);
        setCustomDepositor('');
        setCustomPaymentSuccess('');
      }, 1800);

    } catch (err: any) {
      console.error(err);
      alert('주문제작 결제 처리 중 에러가 발생했습니다.');
    }
  };

  const getOrderStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return { text: '입금 대기', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'preparing': return { text: '준비 중', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'making': return { text: '수제 제작 중 🧵', color: 'text-rose-600 bg-rose-50 border-rose-200 font-bold' };
      case 'shipping': return { text: '배송 중 🚚', color: 'text-[#C79A4A] bg-[#FFF8F1] border-[#C79A4A] font-bold' };
      case 'delivered': return { text: '배송완료 (구매확정)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' };
      case 'cancelled': return { text: '취소됨', color: 'text-gray-500 bg-gray-50 border-gray-200' };
    }
  };

  const getCustomStatusLabel = (status: CustomOrder['status']) => {
    switch (status) {
      case 'pending_estimate': return { text: '도안 검토 및 견적 대기 🔎', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'estimated': return { text: '견적 완료 (입금대기)', color: 'text-blue-600 bg-blue-50 border-blue-200 font-bold' };
      case 'paid': return { text: '입금 확인 (제작 대기)', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'preparing': return { text: '원단 가공 및 도안 배치', color: 'text-teal-600 bg-teal-50 border-teal-200' };
      case 'making': return { text: '바느질 수작업 중 🧵', color: 'text-rose-600 bg-rose-50 border-rose-200 font-bold' };
      case 'completed': return { text: '인형 조형 마감 완료 ✨', color: 'text-[#C79A4A] bg-[#FFF8F1] border-[#C79A4A] font-bold' };
      case 'shipping': return { text: '대한통운 발송 완료 🚚', color: 'text-cyan-600 bg-cyan-50 border-cyan-200 font-bold' };
      case 'delivered': return { text: '수령 완료 🧸', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' };
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4 space-y-4">
        <AlertCircle className="mx-auto text-gray-400" size={40} />
        <h2 className="text-xl font-bold text-[#4A3E3D]">마이페이지 열람 불가</h2>
        <p className="text-xs text-gray-500">
          개인 주문 정보 및 포인트 조회를 원하시면 먼저 안전하게 로그인을 완료해 주세요.
        </p>
        <button
          onClick={onLoginRequest}
          className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  const unusedCouponsCount = userProfile?.coupons?.filter(c => !c.used).length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-10" id="mypage-dashboard">
      
      {/* 1. Core Profile metrics banner */}
      <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Deco */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8D5C4]/20 rounded-full blur-2xl" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#BFD8C0] border border-[#E8D5C4] rounded-full flex items-center justify-center text-xl font-extrabold text-[#4A3E3D]">
            {userProfile?.displayName?.slice(0, 1) || '🧸'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#4A3E3D]">{userProfile?.displayName || '솜인형'} 님</span>
              <span className="text-[10px] bg-[#4A3E3D] text-white px-2 py-0.5 rounded font-semibold uppercase">웰컴 등급</span>
            </div>
            <span className="text-xs text-gray-500 block mt-0.5">{userProfile?.email}</span>
          </div>
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-2 md:flex md:items-center gap-4 divide-y-0 md:divide-x divide-[#E8D5C4]">
          <div className="px-0 md:px-6 py-2 md:py-0 text-center md:text-left">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">보유 포인트</span>
            <span className="text-lg font-black text-[#C79A4A] flex items-center justify-center md:justify-start gap-1">
              <Sparkles size={14} className="text-amber-500" />
              {userProfile?.points?.toLocaleString()}P
            </span>
          </div>
          
          <div className="px-0 md:px-6 py-2 md:py-0 text-center md:text-left">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">사용 가능 쿠폰</span>
            <span className="text-lg font-black text-[#4A3E3D] block">
              {unusedCouponsCount}장
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Custom Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: General shopping mall orders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-base font-extrabold text-[#4A3E3D] pb-2 border-b border-[#E8D5C4] flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#C79A4A]" />
            <span>일반 제품 주문 배송 내역 ({orders.length}건)</span>
          </h3>

          {loading ? (
            <p className="text-xs text-gray-400 text-center py-10">내역을 읽어오고 있습니다...</p>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-[#FFF8F1]/50 border border-dashed border-[#E8D5C4] rounded-2xl text-gray-400 text-xs">
              구매하신 상품 내역이 존재하지 않습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const badge = getOrderStatusLabel(order.status);
                
                return (
                  <div key={order.id} className="bg-white border border-[#E8D5C4]/60 rounded-3xl p-5 space-y-4 shadow-2xs">
                    {/* Header */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] border font-bold ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Products details */}
                    <div className="space-y-2 pb-2.5 border-b border-[#E8D5C4]/30">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex gap-3 items-center">
                          <img src={it.image} alt={it.name} className="w-10 h-10 object-cover rounded-lg border border-[#E8D5C4]/30 shrink-0" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#4A3E3D] truncate">{it.name}</p>
                            <p className="text-[10px] text-gray-400">{it.price.toLocaleString()}원 · {it.quantity}개</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cost math info */}
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-400">최종 입금 금액</span>
                      <span className="text-[#4A3E3D] font-bold text-sm">{order.paidAmount.toLocaleString()}원</span>
                    </div>

                    {/* Courier and delivery confirmations */}
                    {order.status === 'shipping' && (
                      <div className="bg-[#FFF8F1] border border-[#E8D5C4] p-3 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-gray-500 font-semibold">
                            <Truck size={14} className="text-[#C79A4A]" />
                            <span>배송 정보: <b>우체국택배</b></span>
                          </span>
                          <span className="font-mono font-bold text-[#4A3E3D]">{order.trackingNumber || '송장 준비 중'}</span>
                        </div>
                        <button
                          onClick={() => handleConfirmDelivery(order.id)}
                          className="w-full py-2 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                        >
                          주문 배송 완료 확인 (구매확정) 🐾
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Custom bespoke orders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-base font-extrabold text-[#4A3E3D] pb-2 border-b border-[#E8D5C4] flex items-center gap-2">
            <Scissors size={18} className="text-[#C79A4A]" />
            <span>나의 1:1 주문제작 의뢰 ({customOrders.length}건)</span>
          </h3>

          {loading ? (
            <p className="text-xs text-gray-400 text-center py-10">내역을 읽어오고 있습니다...</p>
          ) : customOrders.length === 0 ? (
            <div className="p-12 text-center bg-[#FFF8F1]/50 border border-dashed border-[#E8D5C4] rounded-2xl text-gray-400 text-xs">
              의뢰하신 1:1 주문제작 건이 없습니다.
            </div>
          ) : (
            <div className="space-y-5">
              {customOrders.map((cust) => {
                const label = getCustomStatusLabel(cust.status);
                
                return (
                  <div key={cust.id} className="bg-white border border-[#E8D5C4]/60 rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">{new Date(cust.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] border font-bold ${label.color}`}>
                        {label.text}
                      </span>
                    </div>

                    {/* Spec teaser */}
                    <div className="flex gap-3 items-center">
                      <img src={cust.imageUrl} alt="Draft drawing" className="w-14 h-14 object-cover rounded-xl border border-[#E8D5C4]/40 shrink-0" referrerPolicy="no-referrer" />
                      <div className="min-w-0 text-xs">
                        <p className="font-bold text-[#4A3E3D] truncate">{cust.style}</p>
                        <p className="text-gray-500 mt-0.5">사이즈: {cust.size === 'small' ? '소형(S)' : cust.size === 'medium' ? '중형(M)' : '대형(L)'} / 색상: {cust.color}</p>
                        <p className="text-gray-400 truncate mt-0.5">요청: &ldquo;{cust.memo}&rdquo;</p>
                      </div>
                    </div>

                    {/* Admin Memo */}
                    {cust.adminMemo && (
                      <div className="bg-[#FFF8F1] border border-[#E8D5C4]/50 p-3 rounded-xl text-xs text-[#4A3E3D]/80 leading-relaxed whitespace-pre-wrap">
                        💬 <b>공방 알림톡</b>:<br />
                        {cust.adminMemo}
                      </div>
                    )}

                    {/* ACTIONS FOR ESTIMATED INVOICE */}
                    {cust.status === 'estimated' && cust.estimatePrice && (
                      <div className="pt-3 border-t border-[#E8D5C4]/30 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-bold">확정 책정 견적가</span>
                          <span className="text-sm font-black text-[#C79A4A]">{cust.estimatePrice.toLocaleString()}원</span>
                        </div>
                        <button
                          onClick={() => { setPayingCustomId(cust.id); setPayingCustomPrice(cust.estimatePrice || 0); }}
                          className="w-full py-2.5 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
                          id={`btn-pay-custom-${cust.id}`}
                        >
                          견적 수락 및 무통장 입금 완료하기 💳
                        </button>
                      </div>
                    )}

                    {/* Custom progress visual TIMELINE for active crafts */}
                    {['paid', 'preparing', 'making', 'completed', 'shipping', 'delivered'].includes(cust.status) && (
                      <div className="pt-3 border-t border-[#E8D5C4]/30">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase mb-2">실시간 바느질 제작 타임라인</span>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 relative pl-2">
                          <div className={`flex flex-col items-center flex-1 ${['paid', 'preparing'].includes(cust.status) ? 'text-[#C79A4A] font-extrabold' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-full bg-current mb-1" />
                            <span>시안배치</span>
                          </div>
                          <div className={`flex flex-col items-center flex-1 ${cust.status === 'making' ? 'text-rose-500 font-extrabold' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-full bg-current mb-1" />
                            <span>바느질제작</span>
                          </div>
                          <div className={`flex flex-col items-center flex-1 ${cust.status === 'completed' ? 'text-[#C79A4A] font-extrabold' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-full bg-current mb-1" />
                            <span>패키징완료</span>
                          </div>
                          <div className={`flex flex-col items-center flex-1 ${['shipping', 'delivered'].includes(cust.status) ? 'text-emerald-700 font-extrabold' : ''}`}>
                            <span className="w-2.5 h-2.5 rounded-full bg-current mb-1" />
                            <span>특송배송</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Pay Custom Estimate Modal */}
      <AnimatePresence>
        {payingCustomId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPayingCustomId(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 shadow-2xl z-10"
            >
              <h4 className="text-base font-extrabold text-[#4A3E3D] mb-4 text-center">주문제작 입금 확인 접수</h4>
              
              <div className="bg-white border border-[#E8D5C4] p-3.5 rounded-2xl text-xs space-y-1.5 text-gray-600 font-medium mb-4">
                <p>🏦 <b>입금 은행</b>: 국민은행 0000-000-000000 (주)PINO공방</p>
                <p>💰 <b>입금 금액</b>: <span className="text-[#C79A4A] font-bold text-sm">{payingCustomPrice.toLocaleString()}원</span></p>
              </div>

              {customPaymentSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-bold">
                  {customPaymentSuccess}
                </div>
              ) : (
                <form onSubmit={handlePayCustomEstimate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">실제 입금주 성명</label>
                    <input
                      type="text"
                      required
                      value={customDepositor}
                      onChange={(e) => setCustomDepositor(e.target.value)}
                      placeholder="입금 확인을 할 이름을 입력하세요"
                      className="w-full text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D] font-bold"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayingCustomId(null)}
                      className="flex-1 py-2.5 bg-white border border-[#E8D5C4] text-[#4A3E3D] rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                    >
                      입금 신청 완료
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
