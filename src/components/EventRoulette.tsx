import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, 
  CheckCircle, 
  Calendar, 
  UserPlus, 
  Sparkles, 
  AlertCircle, 
  Share2, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { 
  db, 
  updateUserProfile, 
  addEventLog, 
  getOrCreateUserProfile 
} from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface EventRouletteProps {
  user: any;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onLoginRequest: () => void;
}

const ROULETTE_SECTORS = [
  { label: '500P', color: '#FFF8F1', textColor: '#4A3E3D', reward: 'point_500' },
  { label: '5% 할인', color: '#E8D5C4', textColor: '#4A3E3D', reward: 'coupon_5' },
  { label: '3000P', color: '#BFD8C0', textColor: '#4A3E3D', reward: 'point_3000' },
  { label: '무료배송', color: '#FFF8F1', textColor: '#4A3E3D', reward: 'coupon_ship' },
  { label: '1000P', color: '#F6D6D6', textColor: '#4A3E3D', reward: 'point_1000' },
  { label: '꽝', color: '#E8D5C4', textColor: '#4A3E3D', reward: 'none' }
];

export default function EventRoulette({ 
  user, 
  userProfile, 
  setUserProfile,
  onLoginRequest
}: EventRouletteProps) {
  // Roulette
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [rouletteMsg, setRouletteMsg] = useState('');

  // Attendance
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  // Birthday
  const [bdayInput, setBdayInput] = useState('');
  const [bdayMsg, setBdayMsg] = useState('');

  // Referral Code
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMsg, setReferralMsg] = useState('');

  // Local Time date string helper
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleSpinWheel = async () => {
    if (!user) {
      onLoginRequest();
      return;
    }
    if (isSpinning) return;

    // Check if spun today in local state (prevent abuse)
    const lastSpun = localStorage.getItem(`pino_roulette_${user.uid}`);
    const today = getTodayString();
    if (lastSpun === today && userProfile?.role !== 'admin') {
      setRouletteMsg('❌ 룰렛은 하루에 한 번만 돌릴 수 있습니다. 내일 다시 도전해 주세요!');
      return;
    }

    setIsSpinning(true);
    setRouletteResult(null);
    setRouletteMsg('');

    // Generate random sector
    const sectorCount = ROULETTE_SECTORS.length;
    const randomIndex = Math.floor(Math.random() * sectorCount);
    const degreePerSector = 360 / sectorCount;
    
    // Spin at least 5 complete circles (1800 deg) + angle for the randomized sector
    // We target the top indicator (which is at 90 deg or 270 deg depending on design)
    // To point correctly, target midpoint of sector.
    const sectorAngle = (randomIndex * degreePerSector) + (degreePerSector / 2);
    const targetDegree = 3600 + (360 - sectorAngle); // point to top index
    
    setRotation(targetDegree);

    setTimeout(async () => {
      setIsSpinning(false);
      const selected = ROULETTE_SECTORS[randomIndex];
      setRouletteResult(selected.label);
      localStorage.setItem(`pino_roulette_${user.uid}`, today);

      // Process rewards in Firebase
      try {
        if (!userProfile) return;

        let updatedPoints = userProfile.points;
        let updatedCoupons = [...userProfile.coupons];
        let feedback = '';

        if (selected.reward.startsWith('point_')) {
          const amt = parseInt(selected.reward.split('_')[1]);
          updatedPoints += amt;
          feedback = `🎉 축하합니다! 공방 룰렛으로 ${amt} 포인트가 지급되었습니다!`;
        } else if (selected.reward === 'coupon_5') {
          const newCoupon = {
            id: `roulette-5-${Date.now()}`,
            name: '🎲 룰렛 이벤트 5% 추가 할인 쿠폰',
            discount: 5,
            type: 'percent' as const,
            minOrderValue: 10000,
            used: false,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
          };
          updatedCoupons.push(newCoupon);
          feedback = '🎉 축하합니다! 5% 추가 할인이 가능한 이벤트 할인 쿠폰이 지급되었습니다!';
        } else if (selected.reward === 'coupon_ship') {
          const newCoupon = {
            id: `roulette-ship-${Date.now()}`,
            name: '🚚 룰렛 이벤트 무료배송 쿠폰',
            discount: 3000,
            type: 'amount' as const,
            minOrderValue: 5000,
            used: false,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
          };
          updatedCoupons.push(newCoupon);
          feedback = '🎉 축하합니다! 룰렛 1등 무료배송 쿠폰이 발급되었습니다!';
        } else {
          feedback = '🧸 아쉽지만 다음 기회에! 내일 또 돌리실 수 있으니 걱정 마세요!';
        }

        // Write to DB
        await updateUserProfile(user.uid, {
          points: updatedPoints,
          coupons: updatedCoupons
        });

        await addEventLog({
          userId: user.uid,
          userEmail: user.email || 'guest@pino.com',
          eventType: 'roulette',
          reward: selected.label
        });

        // Sync local userProfile state
        setUserProfile(prev => prev ? {
          ...prev,
          points: updatedPoints,
          coupons: updatedCoupons
        } : null);

        setRouletteMsg(feedback);

      } catch (err: any) {
        console.error(err);
        setRouletteMsg('보상 지급 중 오류가 발생했습니다: ' + err.message);
      }
    }, 4200);
  };

  // Reset roulette wheel rotation
  const resetWheelAngle = () => {
    setRotation(0);
    setRouletteResult(null);
    setRouletteMsg('');
  };

  // Stamp Attendance Check
  const handleAttendanceCheck = async () => {
    if (!user || !userProfile) {
      onLoginRequest();
      return;
    }

    const today = getTodayString();
    if (userProfile.attendanceHistory.includes(today)) {
      setAttendanceSuccess(false);
      setAttendanceMsg('이미 오늘 출석체크 스탬프를 찍었습니다! 내일 다시 방문해 주세요. 🧸');
      return;
    }

    try {
      const updatedHistory = [...userProfile.attendanceHistory, today];
      let streak = userProfile.attendanceStreak + 1;
      let rewardPoints = 100; // base check-in points
      let updatedCoupons = [...userProfile.coupons];
      let bonusMsg = '';

      // Check milestones
      if (streak === 7) {
        // Issue 7-day coupon (10%)
        const coupon7 = {
          id: `streak-7-${Date.now()}`,
          name: '🌱 7일 출석 완주 10% 추가 할인 쿠폰',
          discount: 10,
          type: 'percent' as const,
          minOrderValue: 15000,
          used: false,
          expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
        };
        updatedCoupons.push(coupon7);
        bonusMsg = ' + 🎁 7일 연속 출석 기념 10% 쿠폰 자동 증정!';
      } else if (streak === 30) {
        // Issue 30-day coupon (Free Shipping)
        const coupon30 = {
          id: `streak-30-${Date.now()}`,
          name: '✨ 30일 만점 출석 왕 무료배송 쿠폰',
          discount: 3000,
          type: 'amount' as const,
          minOrderValue: 5000,
          used: false,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
        };
        updatedCoupons.push(coupon30);
        bonusMsg = ' + 🏆 30일 퍼펙트 연속 출석 왕 무료배송 쿠폰 증정!';
      }

      const totalPoints = userProfile.points + rewardPoints;

      await updateUserProfile(user.uid, {
        attendanceHistory: updatedHistory,
        attendanceStreak: streak,
        points: totalPoints,
        coupons: updatedCoupons
      });

      await addEventLog({
        userId: user.uid,
        userEmail: user.email,
        eventType: 'attendance',
        reward: `출석체크 (+100P${bonusMsg ? ', 쿠폰' : ''})`
      });

      setUserProfile(prev => prev ? {
        ...prev,
        attendanceHistory: updatedHistory,
        attendanceStreak: streak,
        points: totalPoints,
        coupons: updatedCoupons
      } : null);

      setAttendanceSuccess(true);
      setAttendanceMsg(`출석 스탬프 완료! +100P 적립되었습니다! 현재 ${streak}일 연속 출석 중${bonusMsg}`);

    } catch (err: any) {
      console.error(err);
      setAttendanceSuccess(false);
      setAttendanceMsg('출석체크 처리 중 오류가 발생했습니다.');
    }
  };

  // Apply referral code
  const handleRedeemReferral = async () => {
    if (!user || !userProfile) {
      onLoginRequest();
      return;
    }

    if (!referralCodeInput.trim()) {
      setReferralMsg('❌ 추천인 코드를 입력해 주세요.');
      return;
    }

    if (referralCodeInput === user.uid) {
      setReferralMsg('❌ 자신의 추천인 코드는 입력할 수 없습니다.');
      return;
    }

    if (userProfile.invitedBy) {
      setReferralMsg('❌ 이미 추천인을 등록하여 보상을 수령하셨습니다.');
      return;
    }

    try {
      // Find the referring user in Firestore
      const referrerRef = doc(db, 'users', referralCodeInput);
      const referrerSnap = await getDoc(referrerRef);

      if (!referrerSnap.exists()) {
        setReferralMsg('❌ 유효하지 않은 회원 추천인 코드입니다. 확인 후 다시 입력해 주세요.');
        return;
      }

      const referrerData = referrerSnap.data() as UserProfile;

      // 1. Reward the current user with 2000P
      const userNewPoints = userProfile.points + 2000;
      await updateUserProfile(user.uid, {
        points: userNewPoints,
        invitedBy: referralCodeInput
      });

      // 2. Reward the referrer with 2000P
      const referrerNewPoints = referrerData.points + 2000;
      await updateUserProfile(referralCodeInput, {
        points: referrerNewPoints
      });

      // Log both
      await addEventLog({
        userId: user.uid,
        userEmail: user.email,
        eventType: 'attendance',
        reward: `친구초대 보상수령 (+2,000P)`
      });

      setUserProfile(prev => prev ? {
        ...prev,
        points: userNewPoints,
        invitedBy: referralCodeInput
      } : null);

      setReferralMsg(`🎉 성공! [${referrerData.displayName}]님의 초대로 두 분 모두에게 즉시 2,000P 가 적립되었습니다.`);
      setReferralCodeInput('');

    } catch (err: any) {
      console.error(err);
      setReferralMsg('초대 코드 처리 중 에러가 발생했습니다.');
    }
  };

  // Apply Birthday Check
  const handleRegisterBirthday = async () => {
    if (!user || !userProfile) {
      onLoginRequest();
      return;
    }

    if (!/^\d{2}-\d{2}$/.test(bdayInput)) {
      setBdayMsg('❌ 올바른 형식 (MM-DD) 으로 입력해 주세요. 예: 07-04');
      return;
    }

    try {
      // Issue birthday reward points (5,000P)
      const bdayPoints = userProfile.points + 5000;

      await updateUserProfile(user.uid, {
        birthday: bdayInput,
        points: bdayPoints
      });

      setUserProfile(prev => prev ? {
        ...prev,
        birthday: bdayInput,
        points: bdayPoints
      } : null);

      setBdayMsg(`🎂 축하합니다! 생일이 [${bdayInput}]로 등록되었으며, 생일 축하 특별 5,000P 포인트가 즉시 지급되었습니다!`);
    } catch (err: any) {
      console.error(err);
      setBdayMsg('생일 등록 도중 오류가 발생했습니다.');
    }
  };

  // Generate SVG segments
  const renderWheelSvg = () => {
    const sectorCount = ROULETTE_SECTORS.length;
    const angle = 360 / sectorCount;
    const radius = 130;
    const cx = 150;
    const cy = 150;

    return ROULETTE_SECTORS.map((sector, i) => {
      const startAngle = i * angle - 90; // start pointing upward
      const endAngle = (i + 1) * angle - 90;
      
      const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = cx + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = cy + radius * Math.sin((endAngle * Math.PI) / 180);

      // Large arc flag
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Sector Path
      const pathData = `
        M ${cx} ${cy}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;

      // Text rotation & coordinates
      const textAngle = startAngle + angle / 2;
      const textRadius = radius * 0.65;
      const tx = cx + textRadius * Math.cos((textAngle * Math.PI) / 180);
      const ty = cy + textRadius * Math.sin((textAngle * Math.PI) / 180);

      return (
        <g key={i}>
          {/* Pie sector */}
          <path 
            d={pathData} 
            fill={sector.color} 
            stroke="#E8D5C4" 
            strokeWidth="2" 
          />
          {/* Label */}
          <text
            x={tx}
            y={ty}
            transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={sector.textColor}
            className="text-[11px] font-bold tracking-tight font-sans"
          >
            {sector.label}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-12" id="events-dashboard">
      
      {/* Title */}
      <div className="text-center">
        <span className="text-[#C79A4A] text-sm uppercase font-extrabold tracking-wider bg-[#E8D5C4]/30 px-3 py-1 rounded-full inline-block mb-2">🎁 DAILY EVENT</span>
        <h2 className="text-3xl font-extrabold text-[#4A3E3D]">소소한 온기, 매일의 선물</h2>
        <p className="text-sm text-[#4A3E3D]/70 mt-2 max-w-lg mx-auto">
          스탬프를 찍고 룰렛을 돌리며 PINO공방의 따뜻한 혜택을 수확해보세요!
        </p>
      </div>

      {/* Main Grid: Roulette & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* Roulette Card */}
        <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 md:p-8 flex flex-col justify-between items-center shadow-md relative overflow-hidden">
          {/* Cute deco */}
          <div className="absolute top-3 left-3 flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BFD8C0]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F6D6D6]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8D5C4]" />
          </div>

          <div className="text-center mb-5 w-full">
            <h3 className="text-lg font-bold text-[#4A3E3D] flex items-center justify-center gap-1.5">
              <Sparkles className="text-[#C79A4A] animate-bounce" size={18} />
              <span>하루 1회 감성 룰렛</span>
            </h3>
            <p className="text-xs text-[#4A3E3D]/65 mt-1">포인트부터 무료배송까지 100% 당첨 찬스!</p>
          </div>

          {/* Wheel Frame */}
          <div className="relative w-76 h-76 flex items-center justify-center mb-6">
            
            {/* Top pointing arrow */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
              <div className="w-6 h-6 bg-[#C79A4A] clip-arrow shadow-md rounded" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
            </div>

            {/* Rotating Wheel body */}
            <div 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.3, 1)' : 'none'
              }}
              className="w-72 h-72 rounded-full border-4 border-[#C79A4A] shadow-xl overflow-hidden bg-white relative flex items-center justify-center"
            >
              <svg viewBox="0 0 300 300" className="w-full h-full select-none">
                {renderWheelSvg()}
                {/* Center peg */}
                <circle cx="150" cy="150" r="16" fill="#C79A4A" stroke="#FFF8F1" strokeWidth="3" />
                <circle cx="150" cy="150" r="5" fill="#FFF8F1" />
              </svg>
            </div>
          </div>

          {/* Spin controls */}
          <div className="w-full space-y-4">
            <div className="flex gap-2 justify-center w-full">
              <button
                onClick={handleSpinWheel}
                disabled={isSpinning}
                className={`py-3 px-8 text-sm font-bold text-white rounded-2xl flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                  isSpinning 
                    ? 'bg-gray-400 cursor-not-allowed scale-95' 
                    : 'bg-[#4A3E3D] hover:bg-[#C79A4A] active:scale-95'
                }`}
                id="btn-spin-roulette"
              >
                {isSpinning ? '두근두근...' : '지금 돌리기 ✨'}
              </button>

              {rotation > 0 && !isSpinning && (
                <button
                  onClick={resetWheelAngle}
                  className="p-3 bg-[#E8D5C4]/30 hover:bg-[#E8D5C4]/60 text-[#4A3E3D] rounded-2xl transition-all cursor-pointer"
                  title="초기화"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>

            {/* Result Alerts */}
            <AnimatePresence mode="wait">
              {rouletteMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3.5 rounded-2xl text-xs font-semibold text-center leading-relaxed ${
                    rouletteResult === '꽝' 
                      ? 'bg-neutral-100 border border-neutral-300 text-neutral-600' 
                      : 'bg-[#BFD8C0]/35 border border-[#BFD8C0]/80 text-[#4A3E3D]'
                  }`}
                >
                  {rouletteMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Attendance Stamp Card */}
        <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-md">
          
          <div>
            <div className="flex justify-between items-center mb-5 border-b border-[#E8D5C4]/50 pb-3">
              <h3 className="text-lg font-bold text-[#4A3E3D] flex items-center gap-1.5">
                <Calendar className="text-[#C79A4A]" size={18} />
                <span>매일 출석체크 스탬프</span>
              </h3>
              <span className="text-[11px] font-bold text-[#C79A4A] bg-[#E8D5C4]/40 px-2.5 py-1 rounded-full">
                누적 {userProfile?.attendanceHistory?.length || 0}일 참여
              </span>
            </div>

            {/* Mini Calendar Stamp simulation */}
            <div className="grid grid-cols-7 gap-2.5 my-4">
              {Array.from({ length: 14 }).map((_, idx) => {
                const totalChecks = userProfile?.attendanceHistory?.length || 0;
                const isStamped = idx < totalChecks;
                const isNext = idx === totalChecks;

                return (
                  <div 
                    key={idx}
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative transition-all ${
                      isStamped 
                        ? 'bg-[#BFD8C0]/40 border-[#BFD8C0] text-emerald-800 font-bold scale-95 shadow-inner' 
                        : isNext && user
                          ? 'bg-[#F6D6D6]/40 border-[#F6D6D6] text-[#4A3E3D] animate-pulse border-2' 
                          : 'bg-white border-[#E8D5C4]/60 text-gray-300'
                    }`}
                  >
                    {isStamped ? (
                      <CheckCircle size={18} className="text-[#C79A4A]" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                    {idx === 6 && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-[8px] text-white px-1 rounded font-extrabold shadow-sm">10%</span>
                    )}
                    {idx === 13 && (
                      <span className="absolute -top-1 -right-1 bg-[#4A3E3D] text-[8px] text-white px-1 rounded font-extrabold shadow-sm">배송비</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Target info info */}
            <div className="bg-[#E8D5C4]/15 p-3 rounded-2xl text-[11px] text-[#4A3E3D]/80 leading-relaxed mb-4">
              ⭐ <b>스탬프 혜택</b>: 매일 출석 시 <b>100P 적립</b>! 누적 7일 출석 시 <b>10% 추가 쿠폰</b>, 누적 30일 달성 시 <b>무료 배송 혜택</b> 자동 수여! (현재 연속 {userProfile?.attendanceStreak || 0}일)
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAttendanceCheck}
              className="w-full py-3.5 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-bold rounded-2xl text-sm transition-all shadow-md cursor-pointer"
              id="btn-attendance-check"
            >
              오늘 출석 스탬프 찍기 🐾
            </button>

            {attendanceMsg && (
              <div className={`p-3 rounded-2xl text-xs font-medium text-center ${
                attendanceSuccess 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}>
                {attendanceMsg}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Auxiliary Grid: Birthday & Friend Invitation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Birthday Coupon Checker */}
        <div className="bg-[#FFF8F1] border border-[#E8D5C4]/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#4A3E3D] flex items-center gap-1.5 mb-3">
            <Gift className="text-[#C79A4A]" size={16} />
            <span>생일 축하 자동 쿠폰 + 5,000P</span>
          </h3>
          <p className="text-xs text-[#4A3E3D]/70 mb-4 leading-relaxed">
            나의 생일을 등록해 주시면 매년 PINO공방에서 사용할 수 있는 5,000원 쿠폰과 즉시 사용 가능한 <b>5,000 포인트</b>를 드려요!
          </p>

          {userProfile?.birthday ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-[#4A3E3D] text-xs font-semibold rounded-2xl flex items-center justify-between">
              <span>🎉 이미 생일이 <b>{userProfile.birthday}</b>로 등록 완료되었습니다!</span>
              <span className="text-[10px] text-amber-700 bg-white border border-amber-300 px-2 py-0.5 rounded-full shadow-xs">기념포인트 수령 완료</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="월-일 형식 (예: 07-04)"
                value={bdayInput}
                onChange={(e) => setBdayInput(e.target.value)}
                maxLength={5}
                className="flex-1 text-xs p-3 bg-white border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C79A4A] text-[#4A3E3D]"
              />
              <button
                onClick={handleRegisterBirthday}
                className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                등록하기
              </button>
            </div>
          )}

          {bdayMsg && (
            <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 text-[#4A3E3D] text-xs rounded-xl">
              {bdayMsg}
            </div>
          )}
        </div>

        {/* Friend Referral Invitation */}
        <div className="bg-[#FFF8F1] border border-[#E8D5C4]/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#4A3E3D] flex items-center gap-1.5 mb-3">
            <UserPlus className="text-[#C79A4A]" size={16} />
            <span>친구초대 무제한 2,000P 적립</span>
          </h3>
          <p className="text-xs text-[#4A3E3D]/70 mb-4 leading-relaxed">
            내 추천인 코드를 친구가 가입 후 등록하면, <b>둘 다 즉시 2,000 포인트</b>가 무제한 지급됩니다!
          </p>

          <div className="space-y-3">
            {/* Display my code */}
            {user ? (
              <div className="p-3 bg-[#E8D5C4]/20 border border-[#E8D5C4] rounded-2xl flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-[#4A3E3D]/50 block">나의 초대 추천 코드</span>
                  <span className="font-mono text-xs font-bold text-[#4A3E3D] truncate block">{user.uid}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.uid);
                    alert('추천인 코드가 클립보드에 복사되었습니다! 친구에게 보내 보세요. 🧸');
                  }}
                  className="flex items-center gap-1 bg-white border border-[#E8D5C4] p-1.5 px-2.5 rounded-xl hover:bg-[#E8D5C4]/10 text-[11px] font-bold text-[#4A3E3D] transition-colors cursor-pointer"
                >
                  <Share2 size={12} />
                  <span>복사</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginRequest} 
                className="w-full text-center text-xs py-2 bg-[#E8D5C4]/30 hover:bg-[#E8D5C4]/50 rounded-xl text-[#4A3E3D] font-semibold cursor-pointer"
              >
                로그인 후 초대 코드 확인하기
              </button>
            )}

            {/* Input referrer code */}
            <div className="border-t border-[#E8D5C4]/40 pt-3">
              <span className="text-xs font-bold text-[#4A3E3D] block mb-2">나를 초대한 친구 코드 등록</span>
              {userProfile?.invitedBy ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium rounded-2xl">
                  ✓ 이미 친구 추천 코드를 등록하셨습니다 (2,000P 지급됨)
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="친구의 초대 코드를 입력하세요"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    className="flex-1 text-xs p-3 bg-white border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C79A4A] text-[#4A3E3D]"
                  />
                  <button
                    onClick={handleRedeemReferral}
                    className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    등록
                  </button>
                </div>
              )}
            </div>
          </div>

          {referralMsg && (
            <div className="mt-3 p-3 bg-[#BFD8C0]/20 border border-[#BFD8C0]/80 text-[#4A3E3D] text-xs rounded-xl leading-relaxed">
              {referralMsg}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
