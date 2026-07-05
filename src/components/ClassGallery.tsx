import React, { useState, useEffect } from 'react';
import { fetchClasses, fetchClassReviews, addClassReview } from '../lib/firebase';
import { Class, ClassReview } from '../types';
import { Star, MessageSquare, Plus, Heart, Camera, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClassGalleryProps {
  user: any;
  userProfile: any;
  onLoginRequest: () => void;
}

// Preset gallery preview images of handmade felt crafts that users can choose from
const PRESET_GALLERY_IMAGES = [
  { name: "🧸 포근 아기곰", url: "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80" },
  { name: "🐰 동글토끼 키링", url: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80" },
  { name: "🐿️ 귀염둥이 다람쥐", url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80" },
  { name: "🐤 포동 병아리", url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80" }
];

export default function ClassGalleryComponent({ user, userProfile, onLoginRequest }: ClassGalleryProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [reviews, setReviews] = useState<ClassReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // New review form state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState(PRESET_GALLERY_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const fetchedClasses = await fetchClasses();
        setClasses(fetchedClasses);
        const fetchedReviews = await fetchClassReviews();
        setReviews(fetchedReviews);

        if (fetchedClasses.length > 0) {
          setSelectedClassId(fetchedClasses[0].id);
        }
      } catch (err) {
        console.error('Error loading gallery data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('후기 작성은 회원만 가능합니다. 로그인해주세요.');
      onLoginRequest();
      return;
    }

    if (!selectedClassId) {
      alert('참여하신 클래스를 선택해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('후기 내용을 입력해주세요.');
      return;
    }

    const targetClass = classes.find(c => c.id === selectedClassId);
    if (!targetClass) return;

    try {
      setLoading(true);
      const newReview = {
        classId: selectedClassId,
        className: targetClass.title,
        userId: user.uid,
        userName: userProfile?.displayName || '아기펠트',
        rating,
        content,
        imageUrl: useCustomUrl ? (customImageUrl.trim() || undefined) : selectedPresetImage
      };

      await addClassReview(newReview);
      
      // Reset form
      setContent('');
      setRating(5);
      setShowReviewForm(false);
      
      // Reload reviews
      const updatedReviews = await fetchClassReviews();
      setReviews(updatedReviews);
      alert('소중한 수강 후기가 성공적으로 등록되었습니다! 🌸');
    } catch (err) {
      console.error(err);
      alert('후기 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Average Star Rating Calculation
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : '5.0';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
      
      {/* Header Banner Section */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <span className="text-[#C79A4A] text-xs font-black tracking-widest bg-[#E8D5C4]/30 px-3.5 py-1.5 rounded-full inline-block">
          CLASS GALLERY & REVIEWS
        </span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-[#4A3E3D] tracking-tight">
          🎨 클래스 갤러리
        </h2>
        <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
          PINO공방 무료 클래스 수강생분들의 한 땀 한 땀 정성을 담은 따스한 작품들과 리얼 수강 후기를 만나보세요.
        </p>
      </div>

      {/* Stats Summary Dashboard */}
      <div className="bg-white border border-[#E8D5C4]/60 rounded-3xl p-6 md:p-8 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[#E8D5C4]/40">
        <div className="flex flex-col justify-center space-y-1.5 py-4 md:py-0">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">전체 후기</p>
          <div className="flex items-center justify-center gap-1.5">
            <MessageSquare size={18} className="text-[#C79A4A]" />
            <span className="text-2xl md:text-3xl font-black text-[#4A3E3D]">{reviews.length}건</span>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-1.5 py-4 md:py-0">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">평균 만족도</p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.round(Number(averageRating)) ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="text-2xl md:text-3xl font-black text-[#4A3E3D]">{averageRating}</span>
          </div>
        </div>

        <div className="flex items-center justify-center py-4 md:py-0">
          {user ? (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-6 py-3.5 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={14} />
              <span>수강 후기 작성하기</span>
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">수강 후기는 회원 전용 기능입니다.</p>
              <button
                onClick={onLoginRequest}
                className="text-xs font-bold text-[#C79A4A] hover:underline cursor-pointer"
              >
                로그인하고 후기 작성하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Writing Form Expandable */}
      <AnimatePresence>
        {showReviewForm && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-[#FFF8F1]/40 border border-[#E8D5C4] rounded-[28px] shadow-xs"
          >
            <form onSubmit={handleReviewSubmit} className="p-6 md:p-8 space-y-5">
              <h3 className="text-sm font-bold text-[#4A3E3D] flex items-center gap-1.5">
                <Camera size={15} className="text-[#C79A4A]" />
                <span>나의 소중한 작품 수강 후기</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Side fields */}
                <div className="space-y-4">
                  {/* Class Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4A3E3D] block">참여한 무료 클래스 *</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3.5 py-3 bg-white border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Star Rating Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4A3E3D] block">별점 및 만족도 *</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            rating >= star ? 'text-amber-400' : 'text-gray-300'
                          }`}
                        >
                          <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content review text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4A3E3D] block">후기 내용 *</label>
                    <textarea
                      required
                      placeholder="공방 분위기나 지기님의 지도, 그리고 완성된 내 작품에 대한 소감을 자유롭게 공유해주세요."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      className="w-full px-3.5 py-3 bg-white border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A] resize-none"
                    />
                  </div>
                </div>

                {/* Right Side Image selector */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#4A3E3D]">작품 사진 첨부 *</label>
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setUseCustomUrl(false)}
                        className={`px-2 py-1 rounded font-bold cursor-pointer ${!useCustomUrl ? 'bg-[#4A3E3D] text-white' : 'bg-gray-200 text-gray-500'}`}
                      >
                        귀여운 예시 사진
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseCustomUrl(true)}
                        className={`px-2 py-1 rounded font-bold cursor-pointer ${useCustomUrl ? 'bg-[#4A3E3D] text-white' : 'bg-gray-200 text-gray-500'}`}
                      >
                        직접 이미지 주소 입력
                      </button>
                    </div>
                  </div>

                  {!useCustomUrl ? (
                    <div className="space-y-3">
                      <p className="text-[10px] text-gray-400">공방지기가 마련한 귀여운 인형 작품 사진 중 선택하여 후기를 더욱 빛내주세요!</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_GALLERY_IMAGES.map((img) => (
                          <div
                            key={img.url}
                            onClick={() => setSelectedPresetImage(img.url)}
                            className={`relative rounded-xl overflow-hidden aspect-video border cursor-pointer transition-all group ${
                              selectedPresetImage === img.url 
                                ? 'border-[#C79A4A] ring-2 ring-[#C79A4A]/20 shadow-xs' 
                                : 'border-[#E8D5C4]/60 hover:border-[#C79A4A]/40'
                            }`}
                          >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-white font-bold">{img.name}</span>
                            </div>
                            {selectedPresetImage === img.url && (
                              <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white p-0.5 rounded-full">
                                <Check size={10} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400">직접 촬영한 사진의 이미지 URL 주소가 있다면 붙여넣어 주세요.</p>
                      <input
                        type="text"
                        placeholder="https://example.com/my-doll-review.jpg"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="w-full px-3.5 py-3 bg-white border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                      />
                      <div className="border border-[#E8D5C4]/60 rounded-xl overflow-hidden aspect-video bg-white flex items-center justify-center">
                        {customImageUrl.trim() ? (
                          <img 
                            src={customImageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400">이미지 링크를 올리면 이곳에 미리보기가 뜹니다.</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>후기 등록 완료 🧸</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews Polaroid Bento Grid List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-xs font-semibold">
          갤러리의 감성 액자들을 조율하는 중입니다...
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#4A3E3D] border-b border-[#E8D5C4] pb-2 flex items-center gap-1.5">
            <Heart size={14} className="text-rose-400 fill-rose-400" />
            <span>수강생들의 작품 컬렉션 ({reviews.length}개의 후기)</span>
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#E8D5C4]/60 rounded-[32px] space-y-2 bg-[#FFF8F1]/10 max-w-lg mx-auto">
              <span className="text-2xl">🧸</span>
              <p className="text-xs text-gray-500 font-bold">아직 등록된 작품 후기가 없습니다.</p>
              <p className="text-[10px] text-gray-400">처음으로 예쁜 무료 클래스 후기를 남기는 감성의 주인공이 되어주세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((rev, index) => (
                <motion.div
                  key={rev.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-[#E8D5C4]/60 p-4 rounded-3xl shadow-2xs hover:shadow-sm transition-all group relative hover:-translate-y-1"
                >
                  {/* Image Block */}
                  {rev.imageUrl && (
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#FFF8F1] mb-3.5 relative">
                      <img src={rev.imageUrl} alt={rev.className} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                      <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-[90%]">
                        {rev.className}
                      </div>
                    </div>
                  )}

                  {/* Star Rating & Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {rev.userName} 님
                      </span>
                    </div>

                    {/* Review text */}
                    <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-4 min-h-[4.5rem]">
                      {rev.content}
                    </p>

                    {/* Class metadata */}
                    <div className="pt-2 border-t border-[#E8D5C4]/40 flex justify-between items-center text-[10px] text-gray-400">
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      <span className="text-[#C79A4A] font-bold">수강 완료 🐾</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
