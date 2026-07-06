import React, { useState, useEffect } from 'react';
import { 
  fetchClasses, 
  addClassBooking, 
  fetchClassBookings, 
  fetchNonMemberClassBookings,
  updateClassBookingStatus
} from '../lib/firebase';
import { Class, ClassBooking } from '../types';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Users, 
  Sparkles, 
  Heart, 
  CheckCircle, 
  Search, 
  AlertCircle, 
  FileText,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClassBookingProps {
  user: any;
  userProfile: any;
  onLoginRequest: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function ClassBookingComponent({ 
  user, 
  userProfile, 
  onLoginRequest,
  setCurrentTab
}: ClassBookingProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [allBookings, setAllBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states: 'book' | 'lookup'
  const [activeSubTab, setActiveSubTab] = useState<'book' | 'lookup'>('book');

  // Booking Form states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [participantsCount, setParticipantsCount] = useState<number>(1);
  const [itemToMake, setItemToMake] = useState<string>('아기곰 인형');
  const [customItemText, setCustomItemText] = useState<string>('');
  const [request, setRequest] = useState<string>('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Lookup states
  const [lookupName, setLookupName] = useState<string>('');
  const [lookupPhone, setLookupPhone] = useState<string>('');
  const [lookupResults, setLookupResults] = useState<ClassBooking[]>([]);
  const [searchedLookup, setSearchedLookup] = useState<boolean>(false);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const fetchedClasses = await fetchClasses();
        setClasses(fetchedClasses);
        const fetchedBookings = await fetchClassBookings();
        setAllBookings(fetchedBookings);

        if (fetchedClasses.length > 0) {
          setSelectedClassId(fetchedClasses[0].id);
          if (fetchedClasses[0].dates.length > 0) {
            setSelectedDate(fetchedClasses[0].dates[0]);
          }
          if (fetchedClasses[0].times.length > 0) {
            setSelectedTime(fetchedClasses[0].times[0]);
          }
        }
      } catch (err) {
        console.error('Error loading class data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bookingSuccess]);

  // Sync date/time selection when class changes
  useEffect(() => {
    if (selectedClassId) {
      const selected = classes.find(c => c.id === selectedClassId);
      if (selected) {
        if (selected.dates.length > 0) {
          setSelectedDate(selected.dates[0]);
        } else {
          setSelectedDate('');
        }
        if (selected.times.length > 0) {
          setSelectedTime(selected.times[0]);
        } else {
          setSelectedTime('');
        }
      }
    }
  }, [selectedClassId, classes]);

  // Autofill name & phone if member is logged in
  useEffect(() => {
    if (userProfile) {
      setUserName(userProfile.displayName || '');
      setEmail(userProfile.email || '');
    }
  }, [userProfile]);

  const activeClass = classes.find(c => c.id === selectedClassId);

  // Real-time seats and status calculation
  const getSeatsInfo = (classId: string, date: string, time: string) => {
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) return { max: 10, current: 0, left: 10, status: '예약가능' };

    const matchingBookings = allBookings.filter(b => 
      b.classId === classId && 
      b.date === date && 
      b.time === time && 
      b.status !== 'cancelled'
    );

    const currentBooked = matchingBookings.reduce((sum, b) => sum + b.participantsCount, 0);
    const max = targetClass.maxParticipants;
    const left = Math.max(0, max - currentBooked);

    let status = '예약가능';
    if (left <= 0) {
      status = '모집마감';
    } else if (left <= 2) {
      status = '마감임박';
    }

    return { max, current: currentBooked, left, status };
  };

  const currentSeats = selectedClassId && selectedDate && selectedTime 
    ? getSeatsInfo(selectedClassId, selectedDate, selectedTime)
    : null;

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId || !selectedDate || !selectedTime) {
      alert('클래스, 날짜, 시간을 모두 선택해주세요.');
      return;
    }

    if (itemToMake === 'custom' && !customItemText.trim()) {
      alert('직접 만들고 싶으신 작품명을 입력해주세요.');
      return;
    }

    if (!userName.trim() || !phone.trim()) {
      alert('이름과 휴대폰 번호는 필수 입력 항목입니다.');
      return;
    }

    if (participantsCount <= 0) {
      alert('참가 인원은 최소 1명 이상이어야 합니다.');
      return;
    }

    if (!agreedToPrivacy) {
      alert('개인정보 수집 및 동의에 체크해주세요.');
      return;
    }

    if (currentSeats && currentSeats.left < participantsCount) {
      alert(`죄송합니다. 현재 선택하신 시간대의 남은 자리는 ${currentSeats.left}명입니다. 인원을 조정해주시거나 다른 시간대를 선택해주세요.`);
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        classId: selectedClassId,
        className: activeClass?.title || '무료 클래스',
        userId: user ? user.uid : null,
        userName,
        phone,
        email,
        date: selectedDate,
        time: selectedTime,
        participantsCount,
        itemToMake: itemToMake === 'custom' ? `✨ 자유 제작: ${customItemText.trim()}` : itemToMake,
        request,
        agreedToPrivacy
      };

      await addClassBooking(bookingData);

      // Send a secure notification via our server-side API (using the stealth alias to prevent adblockers in Incognito mode)
      try {
        const targetUrl = `${window.location.origin}/api/dispatch-booking-alert`;
        await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit',
          body: JSON.stringify(bookingData)
        });
      } catch (tgErr) {
        console.error('Telegram notification fetch failed:', tgErr);
      }

      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
      alert('신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupName.trim() || !lookupPhone.trim()) {
      alert('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }

    setLookupLoading(true);
    try {
      const results = await fetchNonMemberClassBookings(lookupName, lookupPhone);
      setLookupResults(results);
      setSearchedLookup(true);
    } catch (err) {
      console.error(err);
      alert('예약 내역을 조회하는 도중 오류가 발생했습니다.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('정말로 이 클래스 신청을 취소하시겠습니까?')) return;

    try {
      await updateClassBookingStatus(bookingId, 'cancelled');
      alert('신청이 취소되었습니다.');
      // Refresh lookup results
      if (activeSubTab === 'lookup') {
        const results = await fetchNonMemberClassBookings(lookupName, lookupPhone);
        setLookupResults(results);
      }
      // Refresh global bookings state
      const fetchedBookings = await fetchClassBookings();
      setAllBookings(fetchedBookings);
    } catch (err) {
      console.error(err);
      alert('취소 처리 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">✓ 예약확정</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">✗ 신청취소</span>;
      default:
        return <span className="bg-[#E8D5C4] text-[#4A3E3D] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">⌛ 승인대기</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '예약가능': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case '마감임박': return 'text-amber-600 bg-amber-50 border-amber-200';
      case '모집마감': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-[#BFD8C0] text-[#4A3E3D] rounded-full flex items-center justify-center mx-auto shadow-md"
        >
          <CheckCircle size={40} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#4A3E3D]">신청이 완료되었습니다.</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            담당자가 확인 후 입력해주신 휴대폰 번호로 신속하게 안내 연락드리겠습니다. 🧸
          </p>
        </div>
        <div className="bg-white border border-[#E8D5C4]/60 p-5 rounded-2xl text-left text-xs text-[#4A3E3D]/80 space-y-2.5 max-w-sm mx-auto shadow-2xs">
          <p><b>신청인:</b> {userName}</p>
          <p><b>클래스:</b> {activeClass?.title}</p>
          <p><b>일정:</b> {selectedDate} / {selectedTime}</p>
          <p><b>인원:</b> {participantsCount}명</p>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <button 
            onClick={() => {
              setBookingSuccess(false);
              setParticipantsCount(1);
              setItemToMake('아기곰 인형');
              setCustomItemText('');
              setRequest('');
              setAgreedToPrivacy(false);
            }}
            className="px-6 py-3 bg-[#E8D5C4]/50 hover:bg-[#E8D5C4] text-[#4A3E3D] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            추가 신청하기
          </button>
          <button 
            onClick={() => setCurrentTab('home')}
            className="px-6 py-3 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>홈으로 이동</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">
      
      {/* Title Header */}
      <div className="text-center space-y-2.5">
        <span className="text-[#C79A4A] text-xs font-black tracking-widest bg-[#E8D5C4]/30 px-3.5 py-1.5 rounded-full inline-block">
          PINO WORKSHOP EVENT
        </span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-[#4A3E3D] tracking-tight">
          🎁 무료 클래스 신청하기
        </h2>
        <p className="text-xs md:text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
          한 땀 한 땀 나만의 정성이 깃든 펠트 인형을 무료로 완성해보세요. 비회원분들도 간편하게 30초면 신청이 완료됩니다!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#E8D5C4]/30 p-1.5 rounded-2xl max-w-md mx-auto border border-[#E8D5C4]/60">
        <button
          onClick={() => setActiveSubTab('book')}
          className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'book' 
              ? 'bg-white text-[#4A3E3D] shadow-xs font-black' 
              : 'text-gray-500 hover:text-[#4A3E3D]'
          }`}
        >
          클래스 예약 신청 🧸
        </button>
        <button
          onClick={() => setActiveSubTab('lookup')}
          className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'lookup' 
              ? 'bg-white text-[#4A3E3D] shadow-xs font-black' 
              : 'text-gray-500 hover:text-[#4A3E3D]'
          }`}
        >
          비회원 신청 조회 🔍
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400 text-xs font-semibold">
          공방 강의실 문을 활짝 여는 중입니다...
        </div>
      )}

      {!loading && activeSubTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Class Selection Curation (Left side) */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-sm font-bold text-[#4A3E3D] border-b border-[#E8D5C4] pb-2">신청 가능한 클래스</h3>
            
            <div className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all bg-white relative overflow-hidden group ${
                    selectedClassId === cls.id 
                      ? 'border-[#C79A4A] ring-2 ring-[#C79A4A]/20 shadow-md' 
                      : 'border-[#E8D5C4]/60 hover:border-[#C79A4A]/50 hover:shadow-xs'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#FFF8F1]">
                      <img src={cls.image} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-xs md:text-sm font-bold text-[#4A3E3D] truncate">{cls.title}</h4>
                      <p className="text-[11px] text-gray-400 line-clamp-2">{cls.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {activeClass && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FFF8F1] border border-[#E8D5C4]/60 p-5 rounded-2xl space-y-3.5 shadow-2xs"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-white">
                  <img src={activeClass.image} alt={activeClass.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-[#4A3E3D]">{activeClass.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{activeClass.description}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Booking Form (Right side) */}
          <div className="lg:col-span-7 bg-white border border-[#E8D5C4]/60 p-6 md:p-8 rounded-[32px] shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-[#4A3E3D] border-b border-[#E8D5C4]/40 pb-3 flex items-center gap-1.5">
              <Heart size={16} className="text-rose-400" />
              <span>신청 정보 입력</span>
            </h3>

            <form onSubmit={handleBookSubmit} className="space-y-5">
              
              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                  <Calendar size={13} className="text-[#C79A4A]" />
                  <span>희망 날짜 선택</span>
                </label>
                {activeClass && activeClass.dates.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {activeClass.dates.map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`px-4 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                          selectedDate === d
                            ? 'bg-[#4A3E3D] text-white border-[#4A3E3D]'
                            : 'bg-white text-gray-600 border-[#E8D5C4]/60 hover:bg-[#E8D5C4]/20'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">추후에 알려드립니다</p>
                )}
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                  <Clock size={13} className="text-[#C79A4A]" />
                  <span>희망 시간 선택</span>
                </label>
                {activeClass && activeClass.times.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {activeClass.times.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`px-4 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                          selectedTime === t
                            ? 'bg-[#4A3E3D] text-white border-[#4A3E3D]'
                            : 'bg-white text-gray-600 border-[#E8D5C4]/60 hover:bg-[#E8D5C4]/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">추후에 알려드립니다</p>
                )}
              </div>

              {/* Real-time Status Indicator Box */}
              {currentSeats && (
                <div className={`p-4 border rounded-2xl flex items-center justify-between text-xs font-bold ${getStatusColor(currentSeats.status)}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📢</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-normal">실시간 예약 현황</p>
                      <p className="text-[#4A3E3D]">{currentSeats.current} / {currentSeats.max}명 신청 완료</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-white border border-[#E8D5C4]/40 text-[10px] uppercase tracking-wide mr-2 text-gray-500">
                      남은자리 {currentSeats.left}명
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] bg-[#4A3E3D]/10 text-[#4A3E3D]">
                      {currentSeats.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Applicant Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                    <User size={13} className="text-[#C79A4A]" />
                    <span>신청자 성함 *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF8F1]/40 border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                    <Phone size={13} className="text-[#C79A4A]" />
                    <span>휴대폰 번호 *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF8F1]/40 border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                  <Mail size={13} className="text-[#C79A4A]" />
                  <span>이메일 주소 (선택)</span>
                </label>
                <input
                  type="email"
                  placeholder="pino@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FFF8F1]/40 border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                />
              </div>

              {/* Participants Count & Item selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                    <Users size={13} className="text-[#C79A4A]" />
                    <span>참가 인원 *</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={participantsCount}
                    onChange={(e) => setParticipantsCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#FFF8F1]/40 border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                    <Sparkles size={13} className="text-[#C79A4A]" />
                    <span>만들고 싶은 작품</span>
                  </label>
                  <select
                    value={itemToMake}
                    onChange={(e) => setItemToMake(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FFF8F1]/40 border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                  >
                    <option value="아기곰 인형">🧸 아기곰 인형</option>
                    <option value="펠트인형 만들기">🎨 펠트인형 만들기</option>
                    <option value="동글토끼 키링">🐰 동글토끼 키링</option>
                    <option value="파스텔 다람쥐">🐿️ 파스텔 다람쥐</option>
                    <option value="미니 솜쿠션">🌸 미니 솜쿠션</option>
                    <option value="custom">✨ 직접 입력 (내가 원하는 작품 자유 제작)</option>
                  </select>

                  <AnimatePresence>
                    {itemToMake === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="overflow-hidden pt-1"
                      >
                        <label className="text-[10px] font-bold text-[#C79A4A] block mb-1">
                          원하는 작품 이름 / 설명 입력 *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="예: 보라색 귀여운 아기 고양이 인형, 꽃무늬 파우치 등"
                          value={customItemText}
                          onChange={(e) => setCustomItemText(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#FFF8F1]/60 border border-[#C79A4A] rounded-xl text-xs text-[#4A3E3D] placeholder-[#4A3E3D]/40 focus:outline-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Requests */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4A3E3D] flex items-center gap-1">
                  <FileText size={13} className="text-[#C79A4A]" />
                  <span>공방 지기에게 요청사항 (선택)</span>
                </label>
                <textarea
                  placeholder="클래스 관련 추가 문의사항이나 미리 조율할 내용이 있다면 작성해 주세요."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#FFF8F1]/40 border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A] resize-none"
                />
              </div>

              {/* Privacy agreement */}
              <div className="bg-[#FFF8F1]/40 border border-[#E8D5C4]/60 p-4 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-[#C79A4A] focus:ring-[#C79A4A] cursor-pointer"
                />
                <label htmlFor="privacy-consent" className="text-[11px] text-gray-500 leading-relaxed cursor-pointer select-none">
                  <b>개인정보 수집 및 동의 (필수)</b><br />
                  PINO공방 무료 클래스 서비스 신청 조율 및 원활한 상담 연락을 위해 이름, 휴대폰 번호, 이메일 등의 정보를 수집하는 것에 동의합니다.
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-4 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs md:text-sm font-bold rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>무료 클래스 신청하기 🧸</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NON-MEMBER LOOKUP TAB */}
      {!loading && activeSubTab === 'lookup' && (
        <div className="max-w-2xl mx-auto bg-white border border-[#E8D5C4]/60 p-6 md:p-8 rounded-[32px] shadow-sm space-y-8">
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-[#4A3E3D] flex items-center gap-1.5 pb-2 border-b border-[#E8D5C4]/40">
              <Search size={16} className="text-[#C79A4A]" />
              <span>비회원 예약 내역 조회</span>
            </h3>
            <p className="text-xs text-gray-400">신청할 때 입력하셨던 성함과 휴대폰 번호를 입력하시면 실시간 진행상황을 보실 수 있습니다.</p>
          </div>

          <form onSubmit={handleLookupSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-[#FFF8F1]/50 p-4 rounded-2xl border border-[#E8D5C4]/30">
            <div className="sm:col-span-5 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 block">이름</label>
              <input
                type="text"
                required
                placeholder="홍길동"
                value={lookupName}
                onChange={(e) => setLookupName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E8D5C4] rounded-lg text-xs focus:outline-none focus:border-[#C79A4A]"
              />
            </div>
            <div className="sm:col-span-5 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 block">휴대폰 번호</label>
              <input
                type="tel"
                required
                placeholder="010-1234-5678"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E8D5C4] rounded-lg text-xs focus:outline-none focus:border-[#C79A4A]"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                조회하기
              </button>
            </div>
          </form>

          {lookupLoading && (
            <p className="text-center py-10 text-xs text-gray-400 font-semibold">신청 목록을 검색하는 중입니다...</p>
          )}

          {!lookupLoading && searchedLookup && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h4 className="text-xs font-bold text-[#4A3E3D]">검색 결과: {lookupResults.length}건</h4>

              {lookupResults.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#E8D5C4]/60 rounded-2xl space-y-2 bg-[#FFF8F1]/10">
                  <AlertCircle className="text-gray-400 mx-auto" size={24} />
                  <p className="text-xs text-gray-400">조회된 클래스 신청 내역이 없습니다.</p>
                  <p className="text-[10px] text-gray-300">이름과 휴대폰 번호 오탈자가 없는지 다시 확인해주세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lookupResults.map((bk) => (
                    <div 
                      key={bk.id}
                      className="border border-[#E8D5C4]/60 p-5 rounded-2xl bg-[#FFF8F1]/15 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center relative overflow-hidden"
                    >
                      {/* Left Side */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-[#E8D5C4]/40 text-[#4A3E3D] px-2 py-0.5 rounded">
                            {bk.itemToMake}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            신청일: {new Date(bk.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-sm text-[#4A3E3D] leading-tight">
                          {bk.className}
                        </h5>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <p>📅 <b>예약일자:</b> {bk.date}</p>
                          <p>⏰ <b>시간:</b> {bk.time}</p>
                          <p>👥 <b>인원:</b> {bk.participantsCount}명</p>
                        </div>
                        {bk.memo && (
                          <div className="bg-[#E8D5C4]/20 p-2.5 rounded-lg border-l-2 border-[#C79A4A] text-[11px] text-[#4A3E3D]/80">
                            💬 <b>공방 지기 답변:</b> {bk.memo}
                          </div>
                        )}
                      </div>

                      {/* Right Side Status & Cancel Action */}
                      <div className="flex flex-col items-end gap-3 shrink-0 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E8D5C4]/30">
                        {getStatusBadge(bk.status)}
                        
                        {bk.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(bk.id)}
                            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            신청 취소하기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

    </div>
  );
}
