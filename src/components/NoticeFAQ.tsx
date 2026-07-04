import React, { useState, useEffect } from 'react';
import { 
  fetchNotices, 
  fetchFAQs, 
  db 
} from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Notice, FAQ } from '../types';
import { 
  ChevronDown, 
  Megaphone, 
  HelpCircle, 
  Search, 
  Clock, 
  Eye, 
  Gift, 
  Truck, 
  Sparkles, 
  Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NoticeFAQ() {
  const [activeTab, setActiveTab] = useState<'notices' | 'faqs'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoticeCat, setSelectedNoticeCat] = useState<'all' | 'notice' | 'event' | 'shipping' | 'restock'>('all');
  const [selectedFaqCat, setSelectedFaqCat] = useState<'all' | 'order' | 'custom' | 'shipping' | 'care'>('all');

  // Expanded States
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [fetchedNotices, fetchedFaqs] = await Promise.all([
          fetchNotices(),
          fetchFAQs()
        ]);
        setNotices(fetchedNotices);
        setFaqs(fetchedFaqs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNoticeClick = async (noticeId: string, currentViews: number) => {
    if (expandedNoticeId === noticeId) {
      setExpandedNoticeId(null);
    } else {
      setExpandedNoticeId(noticeId);
      // Increment views locally
      setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, views: n.views + 1 } : n));
      // Increment views in Firestore
      try {
        const ref = doc(db, 'notices', noticeId);
        await updateDoc(ref, { views: currentViews + 1 });
      } catch (err) {
        console.error('Error updating notice views:', err);
      }
    }
  };

  // Helper formatting
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getNoticeCatLabel = (cat: Notice['category']) => {
    switch(cat) {
      case 'notice': return { text: '공지', color: 'bg-[#4A3E3D]/10 text-[#4A3E3D]' };
      case 'event': return { text: '이벤트', color: 'bg-[#F6D6D6] text-[#4A3E3D] font-bold' };
      case 'shipping': return { text: '배송', color: 'bg-amber-100 text-amber-800' };
      case 'restock': return { text: '재입고', color: 'bg-emerald-100 text-emerald-800' };
    }
  };

  const getFaqCatLabel = (cat: FAQ['category']) => {
    switch(cat) {
      case 'order': return '일반주문';
      case 'custom': return '주문제작';
      case 'shipping': return '배송/교환';
      case 'care': return '관리/보관';
    }
  };

  // Filter lists
  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedNoticeCat === 'all' || n.category === selectedNoticeCat;
    return matchesSearch && matchesCat;
  });

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedFaqCat === 'all' || f.category === selectedFaqCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12" id="notices-faq-section">
      
      {/* Visual Header */}
      <div className="text-center mb-10">
        <span className="text-[#C79A4A] text-sm uppercase font-bold tracking-wider block mb-1">PINO 소식통</span>
        <h2 className="text-3xl font-bold text-[#4A3E3D] font-sans">소식 및 FAQ</h2>
        <p className="text-sm text-[#4A3E3D]/70 mt-2 max-w-md mx-auto">
          PINO공방의 따끈따끈한 새 소식과 자주 물어보시는 고민들을 모아놓았습니다.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#E8D5C4]/30 rounded-2xl mb-8">
        <button
          onClick={() => { setActiveTab('notices'); setSearchQuery(''); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'notices' 
              ? 'bg-[#FFF8F1] text-[#4A3E3D] shadow-md' 
              : 'text-[#4A3E3D]/60 hover:text-[#4A3E3D]'
          }`}
          id="tab-notices"
        >
          <Megaphone size={16} />
          <span>공지사항 & 소식 ({notices.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('faqs'); setSearchQuery(''); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'faqs' 
              ? 'bg-[#FFF8F1] text-[#4A3E3D] shadow-md' 
              : 'text-[#4A3E3D]/60 hover:text-[#4A3E3D]'
          }`}
          id="tab-faqs"
        >
          <HelpCircle size={16} />
          <span>자주 묻는 질문 ({faqs.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A3E3D]/40" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'notices' ? "공지 제목이나 내용 검색..." : "세탁, 주문제작, 배송 등 키워드 검색..."}
          className="w-full text-sm py-3.5 pl-12 pr-4 bg-[#FFF8F1] border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C79A4A] text-[#4A3E3D]"
          id="notice-faq-search"
        />
      </div>

      {/* Notices View */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          {/* Categories Filters */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(['all', 'notice', 'event', 'shipping', 'restock'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedNoticeCat(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                  selectedNoticeCat === cat 
                    ? 'bg-[#4A3E3D] border-[#4A3E3D] text-white' 
                    : 'bg-[#FFF8F1] border-[#E8D5C4] text-[#4A3E3D]/80 hover:bg-[#E8D5C4]/15'
                }`}
              >
                {cat === 'all' ? '전체보기' : cat === 'notice' ? '공지사항' : cat === 'event' ? '이벤트' : cat === 'shipping' ? '배송안내' : '재입고'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#4A3E3D]/50">로딩 중입니다...</div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-16 bg-[#FFF8F1]/40 border border-dashed border-[#E8D5C4] rounded-3xl text-[#4A3E3D]/60 text-sm">
              검색 조건에 맞는 공지사항이 없습니다. 🧸
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredNotices.map((notice) => {
                const label = getNoticeCatLabel(notice.category);
                const isOpen = expandedNoticeId === notice.id;

                return (
                  <div 
                    key={notice.id}
                    className="border border-[#E8D5C4] bg-[#FFF8F1] rounded-2xl overflow-hidden transition-all hover:shadow-md"
                  >
                    <button
                      onClick={() => handleNoticeClick(notice.id, notice.views)}
                      className="w-full text-left p-4 md:p-5 flex items-start gap-3.5 cursor-pointer"
                    >
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${label.color} shrink-0 mt-0.5`}>
                        {label.text}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#4A3E3D] text-sm md:text-base leading-snug hover:text-[#C79A4A] transition-colors">
                          {notice.title}
                        </h4>
                        <div className="flex items-center gap-3.5 text-[11px] text-[#4A3E3D]/50 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(notice.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={11} />
                            조회수 {notice.views}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-[#4A3E3D]/50 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[#E8D5C4]/60 bg-[#E8D5C4]/10 p-5 md:p-6 text-sm text-[#4A3E3D] leading-relaxed whitespace-pre-wrap font-sans"
                        >
                          {notice.content}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FAQs View */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          {/* Categories Filters */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(['all', 'order', 'custom', 'shipping', 'care'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFaqCat(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                  selectedFaqCat === cat 
                    ? 'bg-[#C79A4A] border-[#C79A4A] text-white' 
                    : 'bg-[#FFF8F1] border-[#E8D5C4] text-[#4A3E3D]/80 hover:bg-[#E8D5C4]/15'
                }`}
              >
                {cat === 'all' ? '전체보기' : getFaqCatLabel(cat)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#4A3E3D]/50">로딩 중입니다...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-16 bg-[#FFF8F1]/40 border border-dashed border-[#E8D5C4] rounded-3xl text-[#4A3E3D]/60 text-sm">
              검색 조건에 맞는 질문이 없습니다. 🧸
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaqId === faq.id;

                return (
                  <div 
                    key={faq.id}
                    className="border border-[#E8D5C4] bg-[#FFF8F1] rounded-2xl overflow-hidden transition-all hover:shadow-sm"
                  >
                    <button
                      onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                      className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#E8D5C4]/40 flex items-center justify-center text-xs font-bold text-[#C79A4A]">Q</span>
                        <span className="text-xs font-semibold text-[#4A3E3D]/60 bg-[#E8D5C4]/10 px-2 py-0.5 rounded-md">
                          {getFaqCatLabel(faq.category)}
                        </span>
                        <h4 className="font-bold text-[#4A3E3D] text-sm md:text-base leading-snug">
                          {faq.question}
                        </h4>
                      </div>
                      <ChevronDown size={18} className={`text-[#4A3E3D]/50 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[#E8D5C4]/60 bg-[#BFD8C0]/10 p-5 text-sm text-[#4A3E3D] leading-relaxed flex items-start gap-3"
                        >
                          <span className="w-6 h-6 rounded-lg bg-[#BFD8C0]/40 flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0">A</span>
                          <p className="flex-1 whitespace-pre-wrap">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
