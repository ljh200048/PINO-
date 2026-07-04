import React, { useState } from 'react';
import { 
  createCustomOrder 
} from '../lib/firebase';
import { CustomOrder, UserProfile } from '../types';
import { 
  Sparkles, 
  Camera, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle, 
  Scissors, 
  Gift, 
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomOrderFormProps {
  user: any;
  userProfile: UserProfile | null;
  onLoginRequest: () => void;
  setCurrentTab: (tab: string) => void;
}

const PHOTO_PRESETS = [
  { 
    name: '🐶 귀여운 시바견 봉구', 
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    memo: '시바견 볼살 통통함을 그대로 살려주시고, 목에 작은 파란색 손수건(반다나) 스티치도 부탁드립니다!'
  },
  { 
    name: '🐱 새침한 고양이 나비', 
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    memo: '러시안 블루 고양이의 연회색 빛 양모로 귀 끝 대칭이 정성스레 맞물리도록 키링으로 만들어 주세요.'
  },
  { 
    name: '🐹 앙증맞은 골든 햄스터', 
    url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80',
    memo: '해바라기씨를 입안 가득 넣은 것처럼 통통하고 귀여운 볼주머니를 입체 인형 형태로 부탁드려요.'
  }
];

export default function CustomOrderForm({ 
  user, 
  userProfile, 
  onLoginRequest, 
  setCurrentTab 
}: CustomOrderFormProps) {
  
  const [style, setStyle] = useState('전신 봉제 인형 🧸');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [color, setColor] = useState('크림 베이지');
  const [memo, setMemo] = useState('');
  const [isGiftWrap, setIsGiftWrap] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [customImage, setCustomImage] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectPreset = (preset: typeof PHOTO_PRESETS[0]) => {
    setImageUrl(preset.url);
    setMemo(preset.memo);
    setCustomImage('');
  };

  const handleCustomImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customImage.trim()) {
      setImageUrl(customImage);
      setCustomImage('');
    }
  };

  const handleSubmitCustomOrder = async () => {
    if (!user) {
      onLoginRequest();
      return;
    }

    if (!imageUrl.trim()) {
      setErrorMsg('반려동물이나 캐릭터 도안의 사진을 선택하거나 등록해 주세요.');
      return;
    }

    if (!memo.trim()) {
      setErrorMsg('원하는 제작 사항 메모를 상세하게 적어 주시면 견적이 더 정확해집니다.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const orderData: Omit<CustomOrder, 'id' | 'createdAt' | 'status'> = {
        userId: user.uid,
        userEmail: user.email || 'guest@pino.com',
        userName: userProfile?.displayName || '회원',
        imageUrl,
        style,
        size,
        color,
        memo,
        isGiftWrap
      };

      await createCustomOrder(orderData);
      setIsSubmitted(true);

    } catch (err: any) {
      console.error(err);
      setErrorMsg('주문제작 신청 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setImageUrl('');
    setStyle('전신 봉제 인형 🧸');
    setSize('medium');
    setColor('크림 베이지');
    setMemo('');
    setIsGiftWrap(false);
    setIsSubmitted(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12" id="custom-order-section">
      
      {/* Top Banner Header */}
      <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 md:p-10 mb-10 text-center relative overflow-hidden shadow-sm">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#BFD8C0]/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#F6D6D6]/30 rounded-full blur-2xl" />
        
        <span className="text-[#C79A4A] text-xs font-bold uppercase tracking-wider bg-white px-3.5 py-1.5 rounded-full border border-[#E8D5C4] inline-block mb-3.5">
          1:1 HANDMADE CUSTOM
        </span>
        <h2 className="text-3xl font-extrabold text-[#4A3E3D] font-sans">
          사진 속 소중한 순간을 펠트로 간직하세요
        </h2>
        <p className="text-sm text-[#4A3E3D]/70 mt-2 max-w-xl mx-auto leading-relaxed">
          사랑하는 나의 반려동물, 직접 스케치한 소중한 캐릭터 시안 등을 보내주시면,<br />
          PINO공방지기가 한 땀 한 땀 따스한 감성의 최고급 양모 인형으로 제작해 드립니다.
        </p>

        {/* Process Steps */}
        <div className="grid grid-cols-4 gap-2.5 max-w-2xl mx-auto mt-8 pt-6 border-t border-[#E8D5C4]/50 text-center text-[11px] md:text-xs text-[#4A3E3D]/70 font-semibold">
          <div className="space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#E8D5C4]/50 flex items-center justify-center mx-auto text-[#4A3E3D] font-bold">1</span>
            <p>신청서 작성 & 사진 업로드</p>
          </div>
          <div className="space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#E8D5C4]/50 flex items-center justify-center mx-auto text-[#4A3E3D] font-bold">2</span>
            <p>공방 작가 견적서 발행</p>
          </div>
          <div className="space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#E8D5C4]/50 flex items-center justify-center mx-auto text-[#4A3E3D] font-bold">3</span>
            <p>견적 수락 및 결제</p>
          </div>
          <div className="space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#BFD8C0] flex items-center justify-center mx-auto text-emerald-800 font-bold">4</span>
            <p>장인 수제 제작 & 배송</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#BFD8C0]/25 border border-[#BFD8C0] rounded-3xl p-8 text-center max-w-lg mx-auto"
            id="custom-order-success"
          >
            <CheckCircle className="text-[#C79A4A] mx-auto mb-4 animate-bounce" size={48} />
            <h3 className="text-xl font-bold text-[#4A3E3D]">주문제작 견적 신청 완료!</h3>
            <p className="text-xs text-[#4A3E3D]/80 mt-3 leading-relaxed">
              성공적으로 신청서가 접수되었습니다. 공방지기가 영업일 기준 24시간 내에 도안을 검토한 후 마이페이지로 견적 금액 및 안내 사항을 전해 드릴 예정입니다.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setCurrentTab('mypage')}
                className="py-3 px-6 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold rounded-2xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="btn-goto-mypage-from-custom"
              >
                <span>신청 내역 보러 가기</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={handleResetForm}
                className="py-3 px-6 bg-white border border-[#E8D5C4] hover:bg-neutral-50 text-[#4A3E3D] text-xs font-bold rounded-2xl shadow transition-all cursor-pointer"
              >
                새로운 제작 신청하기
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
            
            {/* Left: Photos selection / Preset upload (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Photo Upload preset */}
              <div className="bg-[#FFF8F1] border border-[#E8D5C4] rounded-3xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-[#4A3E3D] flex items-center gap-1.5 mb-4 border-b border-[#E8D5C4]/50 pb-2.5">
                  <Camera size={16} className="text-[#C79A4A]" />
                  <span>제작할 사진 업로드 & 프리셋</span>
                </h3>

                {/* Instant Presets */}
                <span className="text-[10px] text-gray-500 font-bold block mb-2 uppercase">빠른 테스트 샘플 사진 선택</span>
                <div className="space-y-2 mb-4">
                  {PHOTO_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full p-2.5 bg-white border rounded-2xl flex items-center gap-3 hover:bg-[#E8D5C4]/10 transition-colors text-left cursor-pointer ${
                        imageUrl === preset.url ? 'border-2 border-[#C79A4A] bg-[#FFF8F1]' : 'border-[#E8D5C4]/60'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-10 h-10 object-cover rounded-lg shadow-xs" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#4A3E3D] truncate">{preset.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{preset.memo}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom URL Input */}
                <div className="border-t border-[#E8D5C4]/40 pt-4">
                  <span className="text-[10px] text-gray-500 font-bold block mb-2 uppercase">나의 이미지 URL 직접 등록</span>
                  <form onSubmit={handleCustomImageSubmit} className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="https://image-link-address.com/photo.jpg"
                      value={customImage}
                      onChange={(e) => setCustomImage(e.target.value)}
                      className="flex-1 text-xs p-2.5 bg-white border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                    <button
                      type="submit"
                      className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      등록
                    </button>
                  </form>
                </div>
              </div>

              {/* Selected Image Preview */}
              {imageUrl && (
                <div className="bg-[#FFF8F1] border border-[#E8D5C4] rounded-3xl p-4 shadow-xs text-center">
                  <span className="text-[10px] text-gray-400 font-bold block mb-2 uppercase">시안 이미지 프리뷰</span>
                  <div className="aspect-square w-full relative rounded-2xl overflow-hidden border-2 border-dashed border-[#E8D5C4]">
                    <img 
                      src={imageUrl} 
                      alt="Custom preset preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-xs transition-colors cursor-pointer"
                    >
                      제거
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Config fields (7 cols) */}
            <div className="lg:col-span-7 bg-[#FFF8F1] border border-[#E8D5C4] rounded-3xl p-6 md:p-8 space-y-5 shadow-xs">
              
              <h3 className="text-base font-bold text-[#4A3E3D] flex items-center gap-1.5 border-b border-[#E8D5C4]/50 pb-3">
                <Scissors size={18} className="text-[#C79A4A]" />
                <span>주문제작 세부 사양 설정</span>
              </h3>

              {/* Style options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3E3D]">1. 제작 스타일 선택</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {['미니어처 키링 🔑', '전신 봉제 인형 🧸', '입체 목제 액자형 🖼️'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStyle(opt)}
                      className={`p-3 text-xs font-bold rounded-2xl border transition-all text-center cursor-pointer ${
                        style === opt 
                          ? 'bg-[#E8D5C4]/60 border-[#C79A4A] text-[#4A3E3D] ring-2 ring-[#C79A4A]/20' 
                          : 'bg-white border-[#E8D5C4] text-[#4A3E3D]/80 hover:bg-neutral-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3E3D]">2. 사이즈 결정</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['small', 'medium', 'large'] as const).map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSize(sz)}
                      className={`p-3 text-xs font-bold rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        size === sz 
                          ? 'bg-[#E8D5C4]/60 border-[#C79A4A] text-[#4A3E3D] ring-2 ring-[#C79A4A]/20' 
                          : 'bg-white border-[#E8D5C4] text-[#4A3E3D]/80 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="uppercase">{sz === 'small' ? 'S' : sz === 'medium' ? 'M' : 'L'}</span>
                      <span className="text-[10px] text-gray-500 font-normal">
                        {sz === 'small' ? '약 5cm 이내' : sz === 'medium' ? '약 12cm 내외' : '약 25cm 내외'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color details */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3E3D]">3. 주조색 톤 설정</label>
                <div className="flex flex-wrap gap-2">
                  {['크림 화이트', '따스한 베이지', '세이지 그린', '파스텔 핑크', '연한 오트밀', '상큼 오렌지'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`p-2 px-4 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                        color === c 
                          ? 'bg-[#4A3E3D] border-[#4A3E3D] text-white' 
                          : 'bg-white border-[#E8D5C4] text-[#4A3E3D]/80 hover:bg-neutral-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description memo */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3E3D] flex items-center justify-between">
                  <span>4. 상세 제작 메모 작성</span>
                  <span className="text-[10px] text-gray-400 font-normal">자세히 쓸수록 완성도 UP!</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="반려동물의 털 무늬 방향, 귀 모양, 리본 스티치 유무 등 디테일하게 제작하고 싶으신 특징을 자유롭게 적어 주세요."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full text-xs p-3.5 bg-white border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C79A4A] text-[#4A3E3D]"
                />
              </div>

              {/* Giftwrap options */}
              <div className="p-3.5 bg-white border border-[#E8D5C4] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-[#F6D6D6]/40 rounded-xl text-[#4A3E3D]">
                    <Gift size={16} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#4A3E3D] block">감성 포장 기프트 박스 패키지</span>
                    <span className="text-[10px] text-gray-400 block">크래프트 박스 + 파스텔 리본 끈 + 손편지 카드 (+3,000원)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isGiftWrap}
                  onChange={(e) => setIsGiftWrap(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#C79A4A] focus:ring-[#C79A4A] cursor-pointer"
                />
              </div>

              {/* Actions & error msg */}
              <div className="pt-4 border-t border-[#E8D5C4]/50">
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <HelpCircle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmitCustomOrder}
                  disabled={loading}
                  className="w-full py-4 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-submit-custom-order"
                >
                  <Sparkles size={16} className="animate-pulse text-[#C79A4A]" />
                  <span>{loading ? '견적 신청 등록 중...' : '1:1 양모펠트 견적 신청서 제출하기 💌'}</span>
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  ※ 견적 승인 및 입금 완료 확인 후 바느질 제작이 개시되며, 제작 중간 과정은 마이페이지 타임라인에서 확인하실 수 있습니다.
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
