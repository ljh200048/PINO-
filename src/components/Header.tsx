import React, { useState } from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Menu, 
  X, 
  LogOut, 
  Sparkles, 
  AlertCircle,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, getOrCreateUserProfile, ADMIN_EMAIL } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  cartCount: number;
  user: any;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  cartCount, 
  user, 
  userProfile,
  setUserProfile
}: HeaderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLocalFallback = (emailVal: string, nameVal?: string, roleVal: 'user' | 'admin' = 'user') => {
    const mockUid = 'local_' + emailVal.replace(/[^a-zA-Z0-9]/g, '_');
    const mockProfile: UserProfile = {
      uid: mockUid,
      email: emailVal,
      displayName: nameVal || emailVal.split('@')[0] || '공방가족',
      points: 2000,
      coupons: [
        {
          id: 'welcome-10',
          name: '🎉 신규 오픈 웰컴 10% 할인 쿠폰',
          discount: 10,
          type: 'percent',
          minOrderValue: 10000,
          used: false,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
        },
        {
          id: 'bday-coupon',
          name: '🎂 PINO 생일 축하 5,000원 쿠폰',
          discount: 5000,
          type: 'amount',
          minOrderValue: 30000,
          used: false,
          expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000
        }
      ],
      attendanceHistory: [],
      attendanceStreak: 0,
      birthday: '07-04',
      role: roleVal,
      createdAt: Date.now()
    };
    
    localStorage.setItem('pino_fallback_user', JSON.stringify(mockProfile));
    window.dispatchEvent(new Event('local_auth_changed'));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    const cleanPassword = password;

    try {
      const isAdminCreds = (cleanEmail === ADMIN_EMAIL && cleanPassword === 'lch04141!!');
      if (authMode === 'login') {
        try {
          const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          const profile = await getOrCreateUserProfile(credential.user);
          setUserProfile(profile);
          setSuccessMsg('로그인에 성공했습니다! 환영합니다.');
        } catch (authErr: any) {
          console.warn('Firebase Auth failed, trying local fallback:', authErr);
          if (isAdminCreds) {
            handleLocalFallback(cleanEmail, '🧸 공방지기(관리자)', 'admin');
            setSuccessMsg('로그인에 성공했습니다! (관리자 데모 세션)');
          } else {
            if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
              throw authErr; // For user password/email mismatch, let normal error flow handle it
            }
            // Otherwise, like operation-not-allowed or network error, let them in using demo fallback!
            handleLocalFallback(cleanEmail, cleanEmail.split('@')[0], (cleanEmail === ADMIN_EMAIL || cleanEmail.startsWith('admin')) ? 'admin' : 'user');
            setSuccessMsg('로그인에 성공했습니다! (데모 세션)');
          }
        }
        
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setEmail('');
          setPassword('');
        }, 1200);
      } else {
        if (!displayName.trim()) {
          setError('닉네임을 입력해주세요.');
          return;
        }
        try {
          const credential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          const profile = await getOrCreateUserProfile(credential.user, displayName);
          setUserProfile(profile);
          setSuccessMsg('회원가입이 완료되었습니다! 2,000P와 웰컴쿠폰이 지급되었습니다.');
        } catch (authErr: any) {
          console.warn('Firebase register failed, trying local fallback:', authErr);
          if (isAdminCreds) {
            handleLocalFallback(cleanEmail, displayName || '🧸 공방지기(관리자)', 'admin');
            setSuccessMsg('회원가입이 완료되었습니다! (관리자 데모 세션)');
          } else {
            if (authErr.code === 'auth/email-already-in-use' || authErr.code === 'auth/weak-password') {
              throw authErr;
            }
            handleLocalFallback(cleanEmail, displayName, (cleanEmail === ADMIN_EMAIL || cleanEmail.startsWith('admin')) ? 'admin' : 'user');
            setSuccessMsg('회원가입이 완료되었습니다! 2,000P와 웰컴쿠폰이 지급되었습니다. (데모 세션)');
          }
        }
        
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setEmail('');
          setPassword('');
          setDisplayName('');
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 등록된 이메일 주소입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(err.message || '인증 오류가 발생했습니다.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(auth, provider);
      const profile = await getOrCreateUserProfile(credential.user);
      setUserProfile(profile);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      console.warn('Google Auth failed, entering with Google Demo User');
      handleLocalFallback('google-demo@pino.com', '구글 솜인형', 'user');
      setSuccessMsg('구글 로그인에 성공했습니다! (데모 세션)');
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 1000);
    }
  };

  // Safe Demo Login helper for sandboxed previews
  const handleQuickDemoLogin = async (role: 'user' | 'admin') => {
    setError('');
    setSuccessMsg('');
    try {
      // Simulate/Trigger demo account in Firebase
      const demoEmail = role === 'admin' ? ADMIN_EMAIL : 'demo-user@pino.com';
      const demoPass = role === 'admin' ? 'lch04141!!' : 'pino1234!';
      
      try {
        let credential;
        try {
          // Try creating the user first to register it if it doesn't exist yet
          credential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          const profile = await getOrCreateUserProfile(credential.user, role === 'admin' ? '🧸 공방지기(관리자)' : '🐇 솜인형(체험)');
          setUserProfile(profile);
        } catch (err: any) {
          // If the email already exists, sign in directly!
          if (err.code === 'auth/email-already-in-use') {
            credential = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
            const profile = await getOrCreateUserProfile(credential.user);
            setUserProfile(profile);
          } else {
            throw err;
          }
        }
        setSuccessMsg(`${role === 'admin' ? '공방지기 관리자' : '체험용 회원'} 계정으로 로그인했습니다!`);
      } catch (authErr: any) {
        console.warn('Firebase demo login failed, using local fallback:', authErr);
        handleLocalFallback(
          demoEmail,
          role === 'admin' ? '🧸 공방지기(관리자)' : '🐇 솜인형(체험)',
          role
        );
        setSuccessMsg(`${role === 'admin' ? '공방지기 관리자' : '체험용 회원'} 계정으로 로그인했습니다! (데모 세션)`);
      }
      
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setError('퀵 데모 로그인 진행 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('SignOut error:', e);
    }
    localStorage.removeItem('pino_fallback_user');
    window.dispatchEvent(new Event('local_auth_changed'));
    setUserProfile(null);
    setCurrentTab('home');
    setIsUserMenuOpen(false);
  };

  const navItems = [
    { id: 'shop', label: '온라인숍' },
    { id: 'custom-order', label: '1:1 주문제작' },
    { id: 'class-booking', label: '무료 클래스' },
    { id: 'class-gallery', label: '후기' },
    { id: 'notice-faq', label: '소식 & FAQ' },
  ];

  return (
    <>
      {/* Promotion bar */}
      <div className="bg-[#E8D5C4] text-[#4A3E3D] text-xs py-2 px-4 text-center font-medium tracking-wide flex justify-center items-center gap-1.5 shadow-sm">
        <Sparkles size={13} className="text-[#C79A4A] animate-pulse" />
        <span>가입 즉시 <b>2,000 포인트</b> + <b>10% 웰컴 쿠폰</b> 즉시 지급! 🧸</span>
      </div>

      <header className="sticky top-0 z-40 bg-[#FFF8F1]/95 backdrop-blur-md border-b border-[#E8D5C4] px-4 py-3.5 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => { setCurrentTab('home'); setIsMenuOpen(false); }} 
            className="flex items-center gap-2 cursor-pointer group"
            id="header-logo"
          >
            <span className="text-2xl font-bold tracking-wider text-[#4A3E3D] font-sans flex items-center gap-1">
              <span className="text-[#C79A4A]">P</span>
              <span>I</span>
              <span className="text-[#BFD8C0]">N</span>
              <span>O</span>
              <span className="text-sm font-normal text-[#C79A4A] px-1 bg-[#E8D5C4]/40 rounded ml-1">공방</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-[#4A3E3D] font-medium">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`text-sm hover:text-[#C79A4A] transition-all relative py-1 cursor-pointer ${
                  currentTab === item.id ? 'text-[#C79A4A] font-bold' : ''
                }`}
                id={`nav-${item.id}`}
              >
                {item.label}
                {currentTab === item.id && (
                  <motion.div 
                    layoutId="activeUnderline" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C79A4A] rounded-full" 
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            
            {/* Cart Icon */}
            <button 
              onClick={() => setCurrentTab('cart')} 
              className="relative p-2 text-[#4A3E3D] hover:text-[#C79A4A] transition-colors rounded-full hover:bg-[#E8D5C4]/20 cursor-pointer"
              aria-label="장바구니"
              id="header-cart-btn"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F6D6D6] border border-[#E8D5C4] text-[#4A3E3D] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Profile Area */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1.5 px-3 rounded-full bg-[#E8D5C4]/30 hover:bg-[#E8D5C4]/50 transition-colors text-sm text-[#4A3E3D] font-medium cursor-pointer"
                  id="user-menu-trigger"
                >
                  <div className="w-6 h-6 rounded-full bg-[#BFD8C0] flex items-center justify-center text-xs font-bold text-[#4A3E3D]">
                    {userProfile?.displayName?.slice(0, 1) || '🧸'}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">{userProfile?.displayName || '회원'}</span>
                  <ChevronDown size={14} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-52 bg-[#FFF8F1] border border-[#E8D5C4] rounded-2xl shadow-xl py-2 z-50 text-sm overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-[#E8D5C4]/60 bg-[#E8D5C4]/10">
                        <p className="font-semibold text-[#4A3E3D] truncate">{userProfile?.displayName}</p>
                        <p className="text-xs text-[#4A3E3D]/70 truncate">{userProfile?.email}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#C79A4A] font-semibold">
                          <Sparkles size={11} />
                          <span>포인트: {userProfile?.points?.toLocaleString()}P</span>
                        </div>
                      </div>

                      {userProfile?.role === 'admin' && (
                        <button
                          onClick={() => { setCurrentTab('admin'); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-[#E8D5C4]/20 text-[#C79A4A] font-semibold flex items-center gap-2 cursor-pointer"
                          id="btn-admin-panel"
                        >
                          <ShieldCheck size={16} />
                          <span>공방 운영자 패널</span>
                        </button>
                      )}

                      <button
                        onClick={() => { setCurrentTab('mypage'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-[#E8D5C4]/20 text-[#4A3E3D] flex items-center gap-2 cursor-pointer"
                        id="btn-mypage"
                      >
                        <UserIcon size={16} />
                        <span>마이페이지</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-[#F6D6D6]/40 text-[#4A3E3D] flex items-center gap-2 border-t border-[#E8D5C4]/40 cursor-pointer"
                        id="btn-logout"
                      >
                        <LogOut size={16} className="text-red-400" />
                        <span className="text-red-500">로그아웃</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                id="header-login-btn"
              >
                <UserIcon size={14} />
                <span>로그인 / 가입</span>
              </button>
            )}

            {/* Mobile Menu Icon */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 text-[#4A3E3D] hover:text-[#C79A4A] transition-colors rounded-lg cursor-pointer"
              aria-label="메뉴 토글"
              id="mobile-menu-toggle"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden mt-3 pt-3 border-t border-[#E8D5C4]/60 flex flex-col gap-2.5 pb-2"
            >
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentTab(item.id); setIsMenuOpen(false); }}
                  className={`text-left text-sm py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    currentTab === item.id 
                      ? 'bg-[#E8D5C4]/40 text-[#C79A4A] font-bold' 
                      : 'text-[#4A3E3D] hover:bg-[#E8D5C4]/15'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cozy Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="fixed inset-0 bg-[#4A3E3D]/50 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden z-10"
              id="auth-modal"
            >
              {/* Corner deco */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8D5C4]/20 rounded-full blur-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#BFD8C0]/20 rounded-full blur-xl pointer-events-none" />

              {/* Close btn */}
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-[#4A3E3D]/60 hover:text-[#4A3E3D] hover:bg-[#E8D5C4]/20 rounded-full transition-colors cursor-pointer"
                id="close-auth-modal-btn"
              >
                <X size={18} />
              </button>

              {/* Header Title */}
              <div className="text-center mb-6">
                <span className="text-2xl font-bold text-[#4A3E3D] tracking-wide">
                  🧸 PINO공방 가입 & 로그인
                </span>
                <p className="text-xs text-[#4A3E3D]/70 mt-1">
                  따스한 펠트 감성 가득한 공방에 오신 것을 환영해요!
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E8D5C4] mb-5">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 pb-2.5 text-sm font-semibold text-center cursor-pointer ${
                    authMode === 'login' ? 'border-b-2 border-[#C79A4A] text-[#C79A4A]' : 'text-[#4A3E3D]/60'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 pb-2.5 text-sm font-semibold text-center cursor-pointer ${
                    authMode === 'register' ? 'border-b-2 border-[#C79A4A] text-[#C79A4A]' : 'text-[#4A3E3D]/60'
                  }`}
                >
                  회원가입
                </button>
              </div>

              {/* Alert / Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <Sparkles size={15} className="shrink-0 mt-0.5 text-amber-500 animate-spin" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#4A3E3D] mb-1.5">닉네임</label>
                    <input
                      type="text"
                      required
                      placeholder="공방에서 사용할 친근한 닉네임"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-sm p-3 bg-[#FFF8F1] border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C79A4A] text-[#4A3E3D]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E3D] mb-1.5">이메일 주소</label>
                  <input
                    type="email"
                    required
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm p-3 bg-[#FFF8F1] border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C79A4A] text-[#4A3E3D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E3D] mb-1.5">비밀번호</label>
                  <input
                    type="password"
                    required
                    placeholder="6자 이상 입력해 주세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm p-3 bg-[#FFF8F1] border border-[#E8D5C4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C79A4A] text-[#4A3E3D]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-bold rounded-2xl text-sm transition-all shadow-md cursor-pointer"
                  id="auth-submit-btn"
                >
                  {authMode === 'login' ? '로그인하기' : '웰컴 혜택 받고 가입하기'}
                </button>
              </form>

              {/* Social / Google Login */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 border border-[#E8D5C4] bg-white hover:bg-neutral-50 rounded-2xl text-xs font-semibold text-[#4A3E3D] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.4 3.65 1.53 7.55l3.8 2.95c.9-2.7 3.4-4.46 6.67-4.46z"/>
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.5z"/>
                    <path fill="#FBBC05" d="M5.33 14.5l-3.8 2.95C3.4 21.35 7.35 24 12 24c3.24 0 5.97-1.08 7.96-2.92l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.27 0-5.77-1.76-6.67-4.46z"/>
                    <path fill="#34A853" d="M12 4.18c2.72 0 4.88 1.86 5.8 4.46l3.8-2.95C19.73 1.93 16.14 0 12 0 8.09 0 4.79 1.93 2.92 4.93l3.8 2.95c.9-2.7 3.28-3.7 5.28-3.7z"/>
                  </svg>
                  <span>구글 계정으로 로그인</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
