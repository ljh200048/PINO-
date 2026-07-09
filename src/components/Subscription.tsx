import React, { useState, useEffect } from 'react';
import { 
  fetchUserSubscriptions, 
  addSubscription, 
  updateSubscriptionStatus 
} from '../lib/firebase';
import { Subscription, UserProfile } from '../types';
import { 
  Sparkles, 
  CheckCircle, 
  Package, 
  ArrowRight, 
  CreditCard, 
  Award, 
  Calendar, 
  RefreshCw, 
  Pause, 
  Play, 
  XCircle, 
  MapPin, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubscriptionProps {
  user: any;
  userProfile: UserProfile | null;
  onLoginRequest: () => void;
  setCurrentTab: (tab: string) => void;
}

const SUBSCRIPTION_PACKAGES = [
  {
    id: 'experience',
    title: '신상품 무료 체험단 🌸',
    description: 'PINO공방의 미공개 신상 솜인형과 DIY 키트 신작 샘플을 매월 평생 무상으로 가장 먼저 경험해 볼 기회!',
    price: 0,
    features: [
      '매월 새롭게 제작되는 따끈따끈한 신상품 샘플 1종 무상 제공 🎁',
      '공방 정식 런칭 전 신작 우선 구매 예약 혜택 부여 🎟️',
      '수령 후 카카오톡 피드백 설문 또는 한 줄 포토 피드백 작성 (필수) 📝',
      '체험 비용 및 발송 배송비 평생 100% 무료 지원 🚚'
    ],
    bgClass: 'bg-indigo-50/40 border-indigo-100',
    tagColor: 'bg-indigo-100 text-indigo-800',
    buttonColor: 'bg-[#4A3E3D] hover:bg-indigo-800'
  },
  {
    id: 'sprout',
    title: '새싹 패키지 🌱',
    description: '공방 감성을 가볍게 채워줄 귀여운 미니 펠트 인형과 굿즈 정기 배달',
    price: 19900,
    features: [
      '매월 새로운 솜인형 미니 피규어 1종 🐥',
      '공방 일러스트 캐릭터 리무버블 스티커 2장 🎨',
      '가입 축하 웰컴 편지 (첫 달 제공) 💌',
      '일반 우편/소형 안심택배 무료 배송 🚚'
    ],
    bgClass: 'bg-emerald-50/40 border-emerald-100',
    tagColor: 'bg-emerald-100 text-emerald-800',
    buttonColor: 'bg-[#4A3E3D] hover:bg-emerald-800'
  },
  {
    id: 'petal',
    title: '꽃잎 패키지 🌸',
    description: '공방 베스트셀러 키링 및 중형 펠트 인형이 매칭되는 프리미엄 셀렉션',
    price: 29900,
    features: [
      '매월 리미티드 동물 펠트 키링 or 중형 펠트 인형 1종 🧸',
      '공방 전용 보관용 파우치 1종 👜',
      '따뜻한 캐릭터 스토리 엽서 1장 📝',
      '무료 안심 우체국 택배 배송 🚚',
      '공방 온라인숍 상시 5% 포인트 추가 적립 ✨'
    ],
    bgClass: 'bg-amber-50/40 border-amber-100 relative',
    tagColor: 'bg-amber-100 text-amber-800',
    buttonColor: 'bg-[#4A3E3D] hover:bg-[#C79A4A]',
    isPopular: true
  },
  {
    id: 'master',
    title: '피노 마스터 패키지 👑',
    description: '고급 수공예 액티비티 DIY 패키지 또는 대형 작가 기획 봉제 인형',
    price: 45000,
    features: [
      '매월 프리미티드 대형 조형 양모 인형 or 최고급 DIY 패키지 🧵',
      '펠트 크래프트 맞춤 니들 세트 + 최고급 메리노 양모 원사 패키지 🧶',
      '비공개 고화질 바느질 온라인 동영상 가이드 제공 📺',
      'PINO공방 한정판 미니 이젤 및 포토 프레임 🖼️',
      '무료 특송 배송 & 공방 온라인숍 상시 10% 쿠폰 발급 🎟️'
    ],
    bgClass: 'bg-rose-50/40 border-rose-100',
    tagColor: 'bg-rose-100 text-rose-800',
    buttonColor: 'bg-[#4A3E3D] hover:bg-rose-800'
  }
];

export default function SubscriptionComponent({ 
  user, 
  userProfile, 
  onLoginRequest, 
  setCurrentTab 
}: SubscriptionProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Subscription flow states
  const [selectedPkg, setSelectedPkg] = useState<typeof SUBSCRIPTION_PACKAGES[0] | null>(null);
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingDetail, setShippingDetail] = useState('');
  const [depositor, setDepositor] = useState('');
  
  const [isSubscribedSuccess, setIsSubscribedSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load subscriptions
  const loadSubscriptions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userSubs = await fetchUserSubscriptions(user.uid);
      setSubscriptions(userSubs);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubscriptions();
      // Autofill fields based on profile
      setShippingName(userProfile?.displayName || '');
    }
  }, [user, userProfile]);

  const handleStartSubscribe = (pkg: typeof SUBSCRIPTION_PACKAGES[0]) => {
    setSelectedPkg(pkg);
    setDepositor(pkg.price === 0 ? '무료체험단' : (userProfile?.displayName || ''));
    setFormError('');
  };

  const handleConfirmSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;
    
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingDetail.trim()) {
      setFormError('배송지 주소 정보를 모두 기입해 주세요.');
      return;
    }

    if (selectedPkg.price > 0 && !depositor.trim()) {
      setFormError('무통장 입금자명을 입력해 주세요.');
      return;
    }

    try {
      setActionLoading(true);
      setFormError('');

      // Calculate next delivery date (e.g. 10th of next month)
      const now = new Date();
      let nextMonth = now.getMonth() + 1;
      let nextYear = now.getFullYear();
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      const nextDateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-10`;

      const subData: Omit<Subscription, 'id' | 'createdAt' | 'status'> = {
        userId: user ? user.uid : 'guest_' + Date.now(),
        userEmail: user?.email || 'guest@pino.com',
        userName: userProfile?.displayName || '비회원',
        packageName: selectedPkg.id as any,
        packageLabel: selectedPkg.title,
        price: selectedPkg.price,
        deliveryCycle: 'monthly',
        shippingAddress: {
          name: shippingName,
          phone: shippingPhone,
          address: shippingAddress,
          detailAddress: shippingDetail
        },
        paymentMethod: selectedPkg.price === 0 ? 'none' : 'bank_transfer',
        depositor: selectedPkg.price === 0 ? '무료체험단' : depositor,
        nextDeliveryDate: nextDateStr
      };

      await addSubscription(subData);
      
      // Send email notification to user
      try {
        await fetch('/api/send-subscription-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: user?.email || 'guest@pino.com',
            userName: userProfile?.displayName || '비회원',
            packageLabel: selectedPkg.title,
            price: selectedPkg.price,
            nextDeliveryDate: nextDateStr,
            shippingAddress: subData.shippingAddress,
            packageName: selectedPkg.id,
            depositor: depositor,
          }),
        });
      } catch (emailErr) {
        console.error('Failed to dispatch subscription confirmation email:', emailErr);
      }

      setIsSubscribedSuccess(true);
      
      // Reload lists
      await loadSubscriptions();

      setTimeout(() => {
        setSelectedPkg(null);
        setIsSubscribedSuccess(false);
        // Clear address fields if desired
      }, 3000);

    } catch (err: any) {
      // 1. Log detailed error to console for developers
      console.error("=== [DEBUG] SUBSCRIPTION CREATION FAILED ===");
      console.error("Error Object:", err);
      if (err instanceof Error) {
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
      } else {
        console.error("Error Raw:", String(err));
      }
      
      // 2. Format a user-friendly error message based on the type of error
      let friendlyMessage = '구독 생성 중 예상치 못한 에러가 발생했습니다. 다시 시도해 주세요.';
      
      try {
        if (err?.message && err.message.startsWith('{') && err.message.endsWith('}')) {
          const parsedError = JSON.parse(err.message);
          console.error("Parsed Firestore Error Details:", parsedError);
          
          if (parsedError.error) {
            if (parsedError.error.includes("Missing or insufficient permissions")) {
              friendlyMessage = `구독 신청 오류: 데이터베이스 권한이 올바르지 않습니다. (Firestore Security Rules 또는 로그인 만료 상태 확인이 필요합니다.)`;
            } else {
              friendlyMessage = `구독 신청 실패: ${parsedError.error}`;
            }
          }
        } else if (err?.message) {
          friendlyMessage = `구독 신청 실패: ${err.message}`;
        }
      } catch (parseErr) {
        console.error("Error parsing stringified Firestore error:", parseErr);
      }

      setFormError(friendlyMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (subId: string, currentStatus: Subscription['status'], newStatus: Subscription['status']) => {
    const actionLabel = newStatus === 'paused' ? '일시 정지' : newStatus === 'active' ? '다시 시작' : '해지';
    if (!window.confirm(`정말 이 정기구독을 ${actionLabel}하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      await updateSubscriptionStatus(subId, newStatus);
      setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s));
      alert(`정기구독을 성공적으로 ${actionLabel} 처리했습니다. 🧸`);
    } catch (err) {
      console.error(err);
      alert('상태 수정 도중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4 space-y-5" id="sub-restricted-view">
        <div className="w-16 h-16 bg-[#E8D5C4]/20 rounded-full flex items-center justify-center mx-auto text-[#C79A4A]">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-[#4A3E3D] font-sans">구독 서비스 비회원 이용 제한</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          PINO공방의 포근하고 프라이빗한 매월 펠트 소품 정기 배송 서비스는 회원전용 시스템입니다. 로그인 혹은 가입 즉시 정기구독 신청 자격이 부여됩니다!
        </p>
        <button
          onClick={onLoginRequest}
          className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold px-6 py-3 rounded-2xl cursor-pointer shadow-md transition-all active:scale-95"
          id="btn-login-to-sub"
        >
          로그인하고 구독 혜택 보기 🧸
        </button>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'paused');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-12" id="subscription-management-section">
      
      {/* Hero Header */}
      <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 md:p-10 text-center relative overflow-hidden shadow-sm">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#BFD8C0]/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#F6D6D6]/30 rounded-full blur-2xl" />
        
        <span className="text-[#C79A4A] text-xs font-bold uppercase tracking-wider bg-white px-3.5 py-1.5 rounded-full border border-[#E8D5C4] inline-block mb-3.5 shadow-2xs">
          PINO PREMIUM SUBSCRIPTION
        </span>
        <h2 className="text-3xl font-extrabold text-[#4A3E3D] font-sans">
          포근함을 매달 문 앞으로 배달받으세요 📦
        </h2>
        <p className="text-sm text-[#4A3E3D]/70 mt-2 max-w-xl mx-auto leading-relaxed">
          매번 품절 대란을 겪는 한정판 인형, 최상급 천연 양모 재료로 가득 채운 테마별 패키지를 합리적인 정기 구독으로 편리하게 즐길 수 있습니다.
        </p>
      </div>

      {/* SECTION 1: Active Subscription status block */}
      {activeSubscriptions.length > 0 && (
        <section className="bg-white border border-[#E8D5C4]/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
          <h3 className="text-base font-extrabold text-[#4A3E3D] flex items-center gap-2 pb-2 border-b border-[#E8D5C4]">
            <RefreshCw size={18} className="text-[#C79A4A] animate-spin-slow" />
            <span>나의 실시간 정기구독 리스트 ({activeSubscriptions.length}개)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSubscriptions.map((sub) => (
              <div key={sub.id} className="border border-[#E8D5C4]/70 rounded-2xl p-5 bg-[#FFF8F1]/10 flex flex-col justify-between gap-4 shadow-3xs relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-[#4A3E3D] text-white px-2 py-0.5 rounded font-bold uppercase mr-1.5">
                        매월 정기 배송
                      </span>
                      <h4 className="font-extrabold text-base text-[#4A3E3D] mt-1 leading-tight">{sub.packageLabel}</h4>
                    </div>
                    
                    {/* Status indicator */}
                    <div>
                      {sub.status === 'active' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          구독 중
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          일시 정지됨
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#E8D5C4]/30 pt-3 text-xs text-gray-600 space-y-1.5">
                    <p>💰 <b>월 정기 구독료:</b> {sub.price === 0 ? '0원 (무료 체험단)' : `${sub.price.toLocaleString()}원`}</p>
                    <p>📅 <b>다음 정기 발송일자:</b> {sub.nextDeliveryDate} 예정</p>
                    <p className="flex items-start gap-1">
                      <MapPin size={13} className="text-[#C79A4A] shrink-0 mt-0.5" />
                      <span>
                        <b>수령인:</b> {sub.shippingAddress.name} ({sub.shippingAddress.phone}) <br />
                        <span className="text-gray-400 font-medium">{sub.shippingAddress.address} {sub.shippingAddress.detailAddress}</span>
                      </span>
                    </p>
                    {sub.price === 0 ? (
                      <div className="bg-indigo-50 border border-indigo-100/50 p-2.5 rounded-lg text-[11px] text-[#4A3E3D]/80">
                        ℹ️ <b>구독 혜택</b>: 신상품 무료 체험단 (체험비 및 배송비 0원 평생 전액 면제, 매달 10일 출고)
                      </div>
                    ) : (
                      <div className="bg-white border border-[#E8D5C4]/30 p-2.5 rounded-lg text-[11px] text-[#4A3E3D]/80">
                        ℹ️ <b>결제 방식</b>: 무통장 정기 입금 (매월 1일 전까지 농협 352-1396-4182-13 입금 완료 시 10일 발송)
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscription Action Toggles */}
                <div className="pt-3 border-t border-[#E8D5C4]/30 flex justify-end gap-3 text-xs font-bold">
                  {sub.status === 'active' ? (
                    <button
                      onClick={() => handleChangeStatus(sub.id, 'active', 'paused')}
                      className="text-amber-600 hover:bg-amber-50 px-3 py-1.5 border border-amber-200 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Pause size={12} />
                      <span>이번달 쉬어가기 (일시정지)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChangeStatus(sub.id, 'paused', 'active')}
                      className="text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Play size={12} />
                      <span>구독 재개하기</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleChangeStatus(sub.id, sub.status, 'cancelled')}
                    className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 border border-rose-200 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <XCircle size={12} />
                    <span>구독 해지</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: Browse Packages Catalog */}
      <section className="space-y-6">
        <div className="text-center">
          <span className="text-xs font-black text-[#C79A4A] uppercase tracking-wider">CHOOSE YOUR VALUE</span>
          <h3 className="text-2xl font-bold text-[#4A3E3D] mt-1 font-sans">따스한 PINO 정기구독 패키지 라인업</h3>
          <p className="text-xs text-gray-400 mt-1">용도와 감성에 맞는 최적의 플랜을 골라보세요.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              className={`border-2 rounded-[32px] p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all ${pkg.bgClass} ${
                pkg.isPopular ? 'border-[#C79A4A] ring-2 ring-[#C79A4A]/20' : 'border-[#E8D5C4]/60'
              }`}
            >
              <div>
                {/* Popular Badge */}
                {pkg.isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C79A4A] text-white text-[10px] font-black tracking-wider px-3 py-1 rounded-full shadow-sm z-10">
                    🔥 공방 추천 스테디셀러
                  </span>
                )}

                <div className="space-y-2 mb-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase inline-block ${pkg.tagColor}`}>
                    {pkg.id === 'experience' ? '무상 체험' : pkg.id === 'sprout' ? '가벼운 힐링' : pkg.id === 'petal' ? '감성 가득' : '프리미엄 레벨'}
                  </span>
                  <h4 className="text-lg font-black text-[#4A3E3D]">{pkg.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">{pkg.description}</p>
                </div>

                {/* Price math */}
                <div className="pb-4 border-b border-[#E8D5C4]/40 mb-4">
                  <span className="text-2xl font-black text-[#4A3E3D]">{pkg.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-bold ml-1">{pkg.price === 0 ? '원 (완전 무료)' : '원 / 매달 정기결제'}</span>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-2.5 text-xs text-gray-600 font-medium mb-6">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[#C79A4A] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribe button */}
              <button
                onClick={() => handleStartSubscribe(pkg)}
                className={`w-full py-3.5 text-xs font-bold text-white rounded-2xl transition-all shadow-sm ${pkg.buttonColor} active:scale-98 cursor-pointer flex items-center justify-center gap-1.5`}
              >
                <span>{pkg.title.split(' ')[0]} 패키지 정기구독하기</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: FAQ Guide block */}
      <section className="bg-white border border-[#E8D5C4]/60 rounded-3xl p-6 md:p-8 space-y-4 shadow-3xs max-w-3xl mx-auto">
        <h4 className="text-sm font-bold text-[#4A3E3D] flex items-center gap-1.5">
          <Award size={16} className="text-[#C79A4A]" />
          <span>정기구독 신청 전 확인 사항</span>
        </h4>
        <div className="space-y-2 text-xs leading-relaxed text-gray-500 font-medium">
          <p>• <b>무통장 결제 주기:</b> 본 구독 서비스는 매월 1일 수공예 준비 자재 발주를 진행합니다. 따라서 매월 1일 정오까지 당월 요금이 입금되어야 10일 정상 출고가 가능합니다.</p>
          <p>• <b>일시정지 및 해지:</b> 언제든지 자유롭게 이 페이지에서 구독 상태 변경을 진행하실 수 있습니다. 당월 1일 결제 완료건이 있는 도중 해지 시, 해당 월 발송 완료 후 구독이 해지됩니다.</p>
          <p>• <b>하자 교환:</b> 모든 인형은 작가진들의 순수 수공예품으로 마감 디테일이 미세하게 다를 수 있으며, 명백한 바느질 실 풀림 등 결함 발견 시 무료 리워크/재발송 처리가 적용됩니다.</p>
        </div>
      </section>

      {/* MODAL: Subscribe Application Steps */}
      <AnimatePresence>
        {selectedPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPkg(null)}
              className="fixed inset-0 bg-[#4A3E3D]/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-[32px] p-6 md:p-8 shadow-2xl z-10 overflow-hidden"
            >
              {/* Top decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8D5C4]/30 rounded-full blur-xl pointer-events-none" />

              <h4 className="text-xl font-extrabold text-[#4A3E3D] mb-2 flex items-center gap-2">
                <Sparkles className="text-amber-500 animate-pulse" size={20} />
                <span>정기구독 신청서 작성</span>
              </h4>
              <p className="text-xs text-gray-500 mb-6">선택하신 플랜에 맞춰 정기 배달을 수령할 소중한 배송 정보를 채워주세요.</p>

              {isSubscribedSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={36} />
                  </div>
                  <h5 className="text-lg font-black text-[#4A3E3D]">🎉 정기구독 신청 접수 완료!</h5>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                    {selectedPkg.price === 0 ? (
                      `따뜻한 ${selectedPkg.title} 신청이 완료되었습니다! 10일 첫 발송 스케줄에 맞춰 신상품 미니 샘플을 정성껏 보내드리겠습니다. 🧸`
                    ) : (
                      `따뜻한 ${selectedPkg.title} 구독 신청이 들어왔습니다! 기입하신 무통장 계좌로 첫 달 구독료 (${selectedPkg.price.toLocaleString()}원) 입금이 확인되면 첫 배송 스케줄링을 신속하게 안내해 드립니다.`
                    )}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConfirmSubscribe} className="space-y-4 text-xs font-semibold">
                  
                  {/* Package info summary */}
                  <div className="bg-white border border-[#E8D5C4] p-4 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">선택한 플랜</span>
                      <span className="font-extrabold text-[#4A3E3D] text-sm">{selectedPkg.title}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">매월 구독료</span>
                      <span className="font-black text-[#C79A4A] text-base">{selectedPkg.price.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* Form Error */}
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Input details */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-500 mb-1">수령인 성명</label>
                      <input
                        type="text"
                        required
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        placeholder="이름을 입력하세요"
                        className="w-full text-xs p-3 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1">수령인 휴대폰 번호</label>
                      <input
                        type="tel"
                        required
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full text-xs p-3 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="block text-gray-500 mb-1">배송 주소</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="시/군/구 도로명 주소 전체 입력"
                          className="w-full text-xs p-3 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D] mb-1.5"
                        />
                        <input
                          type="text"
                          required
                          value={shippingDetail}
                          onChange={(e) => setShippingDetail(e.target.value)}
                          placeholder="상세 호수 또는 동/층 등 상세 주소"
                          className="w-full text-xs p-3 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                        />
                      </div>
                    </div>

                    {/* Bank Transfer Instructions or Free Info */}
                    {selectedPkg.price > 0 ? (
                      <div className="bg-[#FFF8F1] border border-[#E8D5C4] p-3.5 rounded-2xl space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-black">정기 무통장 입금 안내</p>
                        <p className="text-[#4A3E3D] font-extrabold text-xs">🏦 농협은행: 352-1396-4182-13 (예금주: 장정현)</p>
                        <div className="mt-2">
                          <label className="block text-[10px] text-gray-400 mb-1">실제 입금주 성함</label>
                          <input
                            type="text"
                            required
                            value={depositor}
                            onChange={(e) => setDepositor(e.target.value)}
                            placeholder="입금 확인용 이름"
                            className="w-full text-xs p-2 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl space-y-1">
                        <p className="text-[10px] text-indigo-400 uppercase font-black">체험단 지원 혜택</p>
                        <p className="text-[#4A3E3D] font-extrabold text-xs">✨ 체험비 및 배송비 평생 전액 면제 (0원)</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          * 신상품 무료체험단은 매월 10일 발송되며 수령 후 14일 이내 간단한 피드백 작성이 요청됩니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setSelectedPkg(null)}
                      className="flex-1 py-3 bg-white border border-[#E8D5C4] text-[#4A3E3D] rounded-xl font-bold cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white rounded-xl font-bold cursor-pointer transition-all shadow"
                    >
                      {actionLoading ? '구독 신청 처리 중...' : selectedPkg.price === 0 ? '체험단 신청서 제출하기 ✨' : '구독 바느질 신청하기 ✨'}
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
