import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  auth, 
  getOrCreateUserProfile, 
  seedInitialDatabase, 
  fetchProducts, 
  addEventLog,
  fetchStoreSettings
} from './lib/firebase';
import { Product, CartItem, UserProfile } from './types';
import { safeStorage } from './lib/safeStorage';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import CustomOrderForm from './components/CustomOrderForm';
import NoticeFAQ from './components/NoticeFAQ';
import Cart from './components/Cart';
import MyPage from './components/MyPage';
import AdminPanel from './components/AdminPanel';
import ClassBookingComponent from './components/ClassBooking';
import ClassGalleryComponent from './components/ClassGallery';

// Icons
import { 
  Sparkles, 
  Scissors, 
  Gift, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Heart,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Auth & Profile
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeImage, setHomeImage] = useState<string>("https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600&auto=format&fit=crop&q=80");

  // Cart & Wishlist local/user storage sync
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Giveaway state
  const [isJoinedGiveaway, setIsJoinedGiveaway] = useState(false);
  const [giveawayLoading, setGiveawayLoading] = useState(false);

  // Load Initial Catalog & Seed
  useEffect(() => {
    async function initializeCatalog() {
      try {
        setLoading(true);
        // Ensure some initial beautiful products, notices, & FAQs are seeded in Firestore
        await seedInitialDatabase();
        const pList = await fetchProducts();
        setProducts(pList);
        
        // Fetch custom home settings dynamically
        const storeSettings = await fetchStoreSettings();
        if (storeSettings && storeSettings.homeImage) {
          setHomeImage(storeSettings.homeImage);
        }
      } catch (err) {
        console.error('Error during catalog initialization:', err);
      } finally {
        setLoading(false);
      }
    }
    initializeCatalog();
  }, [currentTab]); // Reload products list occasionally on tab changes to fetch updates

  // Auth synchronization
  useEffect(() => {
    const syncLocalUser = () => {
      const localUserJson = safeStorage.getItem('pino_fallback_user');
      if (localUserJson) {
        try {
          const parsed = JSON.parse(localUserJson);
          setUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.displayName, emailVerified: true });
          setUserProfile(parsed);
        } catch (e) {
          console.error('Error loading fallback user:', e);
        }
      } else {
        if (!auth.currentUser) {
          setUser(null);
          setUserProfile(null);
        }
      }
    };

    // Run initially
    syncLocalUser();

    // Listen to local auth changes
    window.addEventListener('local_auth_changed', syncLocalUser);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await getOrCreateUserProfile(firebaseUser);
          setUserProfile(profile);
          // Sync wishlist from local state or load
          safeStorage.removeItem('pino_fallback_user');
        } catch (err) {
          console.error('Error getting user profile:', err);
        }
      } else {
        if (!safeStorage.getItem('pino_fallback_user')) {
          setUser(null);
          setUserProfile(null);
        }
      }
    });

    // Load Cart and Wishlist from safeStorage
    const savedCart = safeStorage.getItem('pino_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    const savedWish = safeStorage.getItem('pino_wishlist');
    if (savedWish) setWishlist(JSON.parse(savedWish));

    return () => {
      unsubscribe();
      window.removeEventListener('local_auth_changed', syncLocalUser);
    };
  }, []);

  // Save Cart to safeStorage whenever modified
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    safeStorage.setItem('pino_cart', JSON.stringify(newCart));
  };

  // Cart Handlers
  const handleAddToCart = (productId: string, quantity = 1, options?: { packing: boolean; memo: string }) => {
    const existingIndex = cart.findIndex(it => it.productId === productId);
    const newCart = [...cart];

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += quantity;
      if (options) {
        newCart[existingIndex].selectedOptions = options;
      }
    } else {
      newCart.push({
        productId,
        quantity,
        selectedOptions: options
      });
    }

    saveCart(newCart);
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    const newCart = cart.map(it => it.productId === productId ? { ...it, quantity } : it);
    saveCart(newCart);
  };

  const handleRemoveCartItem = (productId: string) => {
    const newCart = cart.filter(it => it.productId !== productId);
    saveCart(newCart);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  // Wishlist Handlers
  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newWish = [...wishlist];
    if (wishlist.includes(productId)) {
      newWish = newWish.filter(id => id !== productId);
    } else {
      newWish.push(productId);
    }
    setWishlist(newWish);
    safeStorage.setItem('pino_wishlist', JSON.stringify(newWish));
  };

  // Free Giveaway Event Entry
  const handleJoinGiveaway = async () => {
    if (!user) {
      // Trigger login modal
      alert('무료 나눔 이벤트 참가는 로그인이 필요합니다. 우측 상단의 [로그인 / 가입]을 먼저 진행해 주세요! 🧸');
      return;
    }

    setGiveawayLoading(true);
    try {
      await addEventLog({
        userId: user.uid,
        userEmail: user.email || 'guest@pino.com',
        eventType: 'giveaway',
        reward: '무료 나눔 참여권 획득 (아기곰 인형 패키지)'
      });

      setIsJoinedGiveaway(true);
      alert('🎉 무료 나눔 이벤트 참가가 정상 등록되었습니다! 당첨 발표일에 알림이 발송됩니다.');
    } catch (err) {
      console.error(err);
    } finally {
      setGiveawayLoading(false);
    }
  };

  const handleNavigateToDetail = (pId: string) => {
    setSelectedProductId(pId);
    setCurrentTab('detail');
  };

  return (
    <div className="min-h-screen bg-[#FFF8F1] flex flex-col justify-between overflow-x-hidden">
      
      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedProductId(null);
        }}
        cartCount={cart.reduce((acc, c) => acc + c.quantity, 0)}
        user={user}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />

      {/* Main Content Router Container */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          
          {/* TAB: Home */}
          {currentTab === 'home' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
              id="home-tab-view"
            >
              {/* Cozy Hero slider section */}
              <section className="relative h-[480px] md:h-[550px] bg-[#E8D5C4]/35 flex items-center justify-center px-4 overflow-hidden border-b border-[#E8D5C4]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#BFD8C0]/25 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F6D6D6]/35 rounded-full blur-3xl -ml-16 -mb-16" />

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center z-10">
                  <div className="space-y-5 text-center md:text-left">
                    <span className="text-[#C79A4A] text-xs font-extrabold uppercase tracking-widest bg-[#FFF8F1] px-3.5 py-1.5 rounded-full border border-[#E8D5C4] inline-block shadow-xs">
                      Handmade Felt Craft Studio
                    </span>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-[#4A3E3D] font-display leading-tight tracking-tight">
                      손수 한 땀 바느질로 빚는<br />
                      <span className="text-[#C79A4A]">세상 하나뿐인 온기</span>
                    </h1>
                    <p className="text-xs md:text-sm text-[#4A3E3D]/85 leading-relaxed max-w-md">
                      PINO공방은 대량 생산되는 플라스틱 완구 대신 천연 메리노 양모 펠트만을 수공예 바느질하여, 마음 한편이 편안해지는 감성 친구들을 전달합니다.
                    </p>
                    <div className="flex gap-3.5 justify-center md:justify-start">
                      <button
                        onClick={() => setCurrentTab('shop')}
                        className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>온라인숍 둘러보기</span>
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentTab('custom-order')}
                        className="bg-[#FFF8F1] border border-[#E8D5C4] text-[#4A3E3D] hover:bg-[#E8D5C4]/20 text-xs font-bold px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
                      >
                        주문제작 상담하기
                      </button>
                    </div>
                  </div>

                  {/* Visual hero item */}
                  <div className="hidden md:block relative aspect-square max-w-[340px] mx-auto">
                    <div className="absolute inset-4 bg-[#C79A4A]/10 rounded-[40px] rotate-3 -z-10" />
                    <div className="absolute inset-4 bg-[#BFD8C0]/20 rounded-[40px] -rotate-3 -z-10" />
                    <img
                      src={homeImage}
                      alt="Handmade baby bear felt doll"
                      className="w-full h-full object-cover rounded-[36px] shadow-lg border border-[#E8D5C4]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </section>

              {/* FREE CLASS EVENT HERO RIBBON (Directly under Main Banner) */}
              <section className="max-w-7xl mx-auto px-4">
                <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xs">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#BFD8C0]/30 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F6D6D6]/40 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-4 flex-1 z-10">
                    <span className="text-[#4A3E3D] text-[11px] font-black uppercase tracking-wider bg-[#BFD8C0] px-3.5 py-1.5 rounded-full inline-block">
                      🎁 비회원 신청 가능 · 참가비 0원
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-[#4A3E3D] font-sans leading-tight">
                      따뜻한 PINO 공방 무료 펠트인형 클래스 🌸
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 max-w-2xl leading-relaxed font-medium">
                      회원가입 번거로움 없이 이름과 휴대폰 번호만으로 간편 신청! 공방 마스터가 한 땀 한 땀 기초부터 알려드리는 포근한 펠트인형 만들기 힐링 일일 클래스에 여러분을 초대합니다.
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400 font-bold">
                      <span>✓ 소요시간: 1시간</span>
                      <span>✓ 준비물: 공방 전액 지원 (무료)</span>
                      <span>✓ 대상: 초보자 환영 (비회원 가능)</span>
                    </div>
                  </div>

                  <div className="shrink-0 z-10 w-full md:w-auto">
                    <button
                      onClick={() => setCurrentTab('class-booking')}
                      className="w-full md:w-auto py-4 px-8 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-extrabold text-sm rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                      id="home-class-booking-btn"
                    >
                      <span>무료 클래스 신청하기</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>

              {/* Recommended Best-Sellers Grid */}
              <section className="max-w-7xl mx-auto px-4 space-y-6">
                <div className="text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-3 border-b border-[#E8D5C4]/40 pb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-[#4A3E3D] flex items-center justify-center md:justify-start gap-1.5 font-sans">
                      <span>공방지기 대표 시그니처 🧸</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">한 땀 가득 사랑받는 스테디셀러</p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('shop')}
                    className="text-xs font-bold text-[#C79A4A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>스토어 전체보기</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {loading ? (
                  <p className="text-center py-10 text-gray-400 text-xs font-semibold">소품 진열대를 닦아오고 있습니다...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.slice(0, 4).map((product) => (
                      <motion.div
                        key={product.id}
                        whileHover={{ y: -5 }}
                        onClick={() => handleNavigateToDetail(product.id)}
                        className="bg-white border border-[#E8D5C4]/60 rounded-3xl overflow-hidden p-3.5 shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#FFF8F1] mb-3">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          {product.isBest && (
                            <span className="absolute top-2.5 left-2.5 bg-[#C79A4A] text-white text-[8px] font-black px-2 py-0.5 rounded-full">BEST</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs md:text-sm font-bold text-[#4A3E3D] truncate">{product.name}</h4>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-[#C79A4A]">{product.price.toLocaleString()}원</span>
                            <span className="text-[10px] text-gray-400">후기 {product.reviewsCount}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {/* Free Felt Doll Giveaway Banner Event */}
              <section className="max-w-5xl mx-auto px-4">
                <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
                  {/* Deco stamp */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#F6D6D6]/40 rounded-full blur-xl pointer-events-none" />

                  <div className="space-y-3 flex-1 min-w-0 text-center md:text-left">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 px-3 py-1 rounded-full inline-block">
                      FREE GIFT EVENT
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-[#4A3E3D]">
                      🎁 신규 리뉴얼 오픈 기념, 무료 나눔 나들이!
                    </h3>
                    <p className="text-xs text-[#4A3E3D]/80 leading-relaxed max-w-md">
                      지금 아래 참가 신청을 완료해주시면, 추첨을 통해 3분께 <b>[베이지 펠트 아기곰 인형 스페셜 패키지]</b>를 자택으로 무료 배송해 드립니다!
                    </p>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={handleJoinGiveaway}
                      disabled={isJoinedGiveaway || giveawayLoading}
                      className={`py-3.5 px-6 rounded-2xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                        isJoinedGiveaway 
                          ? 'bg-emerald-600 shadow-none scale-95' 
                          : 'bg-[#4A3E3D] hover:bg-[#C79A4A] active:scale-95'
                      }`}
                    >
                      {isJoinedGiveaway ? '✓ 나눔 참가 등록 완료!' : '지금 바로 나눔 참가하기 🐾'}
                    </button>
                  </div>
                </div>
              </section>

              {/* 1:1 Bespoke Teaser section */}
              <section className="max-w-5xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#E8D5C4]/20 border border-[#E8D5C4] p-6 md:p-10 rounded-[32px] shadow-2xs">
                  <div className="space-y-4">
                    <span className="text-[#C79A4A] text-[10px] font-extrabold uppercase tracking-wider bg-white border border-[#E8D5C4] px-3 py-1 rounded-full inline-block">Bespoke Ordering</span>
                    <h3 className="text-xl md:text-2xl font-black text-[#4A3E3D] font-sans">
                      반려동물 사진을 보내주시면<br />
                      양모 인형으로 고스란히 재현합니다
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      말랑말랑한 눈빛, 한쪽으로 쳐진 귀여운 귀, 얼룩덜룩 매력 가득한 꼬리 무늬까지. 1:1 비스포크 견적을 통해 오직 나만을 위한 입체 인형/키링을 빚어 보세요.
                    </p>
                    <button
                      onClick={() => setCurrentTab('custom-order')}
                      className="py-3 px-6 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                    >
                      1:1 커스텀 의뢰하러 가기 💌
                    </button>
                  </div>

                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#E8D5C4]/50 shadow-sm bg-white">
                    <img
                      src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80"
                      alt="Puppy reference preview for felt"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </section>

              {/* Reviews curation carousel slider */}
              <section className="bg-[#FFF8F1] border-t border-[#E8D5C4] py-14">
                <div className="max-w-5xl mx-auto px-4 space-y-8">
                  <div className="text-center">
                    <span className="text-[#C79A4A] text-xs font-bold uppercase tracking-wider">REAL REVIEWS</span>
                    <h3 className="text-2xl font-bold text-[#4A3E3D] mt-1">PINO공방 감동의 목소리</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#E8D5C4]/60 p-5 rounded-2xl space-y-3 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#4A3E3D]">소소한 캠퍼 🏕️</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-sans">
                        &ldquo;베이지 펠트 곰돌이 인형을 주문했는데 정말 따뜻한 분위기를 연출해줍니다. 박스에 솜이랑 리본 포장된 부분부터 손편지까지 장인의 손길이란게 고스란히 전해져 너무 만족합니다!&rdquo;
                      </p>
                    </div>

                    <div className="bg-white border border-[#E8D5C4]/60 p-5 rounded-2xl space-y-3 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#4A3E3D]">시바견 구름엄마 🐶</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-sans">
                        &ldquo;우리집 시바견 사진을 보내드렸는데 볼살을 빵빵하게 표현해주셔서 볼 때마다 웃음이 나와요 ㅎㅎ 주문제작이라 오래 걸릴 줄 알았는데 한 땀 한 땀 마감이 너무 정교해서 대만족입니다!&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {/* TAB: Online Shop */}
          {currentTab === 'shop' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="shop-tab-view"
            >
              <ProductGrid
                products={products}
                onSelectProduct={handleNavigateToDetail}
                onAddToCart={(pId, e) => {
                  e.stopPropagation();
                  handleAddToCart(pId, 1);
                  alert('장바구니에 귀여운 소품을 신속하게 담았습니다! 🧺');
                }}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
              />
            </motion.div>
          )}

          {/* TAB: Product Detail */}
          {currentTab === 'detail' && selectedProductId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="detail-tab-view"
            >
              <ProductDetail
                productId={selectedProductId}
                products={products}
                onBack={() => setCurrentTab('shop')}
                onAddToCart={(pId, qty, opts) => handleAddToCart(pId, qty, opts)}
                user={user}
                userProfile={userProfile}
                onLoginRequest={() => {
                  // Simply dispatch quick trigger
                  const loginBtn = document.getElementById('header-login-btn');
                  if (loginBtn) loginBtn.click();
                }}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
              />
            </motion.div>
          )}

          {/* TAB: Custom Order Form */}
          {currentTab === 'custom-order' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="custom-order-tab-view"
            >
              <CustomOrderForm
                user={user}
                userProfile={userProfile}
                onLoginRequest={() => {
                  const loginBtn = document.getElementById('header-login-btn');
                  if (loginBtn) loginBtn.click();
                }}
                setCurrentTab={setCurrentTab}
              />
            </motion.div>
          )}

          {/* TAB: Class Booking */}
          {currentTab === 'class-booking' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="class-booking-tab-view"
            >
              <ClassBookingComponent
                user={user}
                userProfile={userProfile}
                onLoginRequest={() => {
                  const loginBtn = document.getElementById('header-login-btn');
                  if (loginBtn) loginBtn.click();
                }}
                setCurrentTab={setCurrentTab}
              />
            </motion.div>
          )}

          {/* TAB: Class Gallery */}
          {currentTab === 'class-gallery' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="class-gallery-tab-view"
            >
              <ClassGalleryComponent
                user={user}
                userProfile={userProfile}
                onLoginRequest={() => {
                  const loginBtn = document.getElementById('header-login-btn');
                  if (loginBtn) loginBtn.click();
                }}
              />
            </motion.div>
          )}

          {/* TAB: Notices & FAQs */}
          {currentTab === 'notice-faq' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="notices-faq-tab-view"
            >
              <NoticeFAQ />
            </motion.div>
          )}

          {/* TAB: Cart */}
          {currentTab === 'cart' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="cart-tab-view"
            >
              <Cart
                cartItems={cart}
                products={products}
                user={user}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                onUpdateCartQty={handleUpdateCartQty}
                onRemoveCartItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onLoginRequest={() => {
                  const loginBtn = document.getElementById('header-login-btn');
                  if (loginBtn) loginBtn.click();
                }}
                setCurrentTab={setCurrentTab}
              />
            </motion.div>
          )}

          {/* TAB: MyPage */}
          {currentTab === 'mypage' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="mypage-tab-view"
            >
              <MyPage
                user={user}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                onLoginRequest={() => {
                  const loginBtn = document.getElementById('header-login-btn');
                  if (loginBtn) loginBtn.click();
                }}
                setCurrentTab={setCurrentTab}
              />
            </motion.div>
          )}

          {/* TAB: Admin Console */}
          {currentTab === 'admin' && userProfile?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="admin-tab-view"
            >
              <AdminPanel />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
