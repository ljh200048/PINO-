import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { Product, UserProfile, Order, CustomOrder, Review, FAQ, Notice, EventLog, Class, ClassBooking, ClassReview } from '../types';

// Load values directly from the config
const firebaseConfig = {
  projectId: "attch-4ba55",
  appId: "1:837445542595:web:0ce0475c74316987887876",
  apiKey: "AIzaSyCtq5Fxadmp-gAMN0fUYHZm1kJFsTUYwz4",
  authDomain: "attch-4ba55.firebaseapp.com",
  storageBucket: "attch-4ba55.firebasestorage.app",
  messagingSenderId: "837445542595"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use custom Firestore Database ID from our configuration file
const firestoreDbId = "ai-studio-pino-54d7811d-9389-49cf-a785-d6cd0a288db6";
const db = getFirestore(app, firestoreDbId);
const storage = getStorage(app);

export { app, auth, db, storage };

export const ADMIN_EMAIL = 'lch200048@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mock Seed Data
const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: "🧸 베이지 펠트 아기곰 인형",
    category: "felt-doll",
    price: 28000,
    description: "따스하고 포근한 천연 양모로 제작한 시그니처 아기곰 인형입니다. 가슴의 미니 레드 하트가 매력적이며, 한 땀 한 땀 정성을 담은 바느질선이 수공예 특유의 아날로그 감성을 전달합니다.",
    images: [
      "https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80"
    ],
    stock: 12,
    salesCount: 145,
    rating: 4.9,
    reviewsCount: 3,
    isBest: true,
    isNew: false,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    name: "🐰 복슬복슬 토끼 펠트 키링",
    category: "keyring",
    price: 15000,
    description: "가방, 차 키, 에어팟 등에 가볍게 걸 수 있는 파스텔 핑크 토끼 키링입니다. 볼에 얹어진 핑크빛 볼터치가 사랑스러우며 메탈링 체인으로 완성도 높게 제작되었습니다.",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80"
    ],
    stock: 25,
    salesCount: 88,
    rating: 4.8,
    reviewsCount: 2,
    isBest: true,
    isNew: false,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  },
  {
    name: "🐥 분홍 볼따구 아기오리 피규어",
    category: "mini-doll",
    price: 18000,
    description: "동글동글한 얼굴형과 주황색 미니 부리가 눈길을 사로잡는 오리 미니인형입니다. 아기자기한 서재 책상이나 현관 선반 등 작은 포인트를 주기에 훌륭합니다.",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80"
    ],
    stock: 8,
    salesCount: 42,
    rating: 4.7,
    reviewsCount: 1,
    isNew: true,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000
  },
  {
    name: "🐢 메론빵 등껍질 아기 거북이",
    category: "felt-doll",
    price: 22000,
    description: "바삭바삭 달콤한 메론빵을 닮은 등껍질을 매고 있는 거북이 인형입니다. 파스텔 톤의 세이지그린 몸통과 노란 메론빵 무늬가 빈티지하면서도 따스한 조화를 이룹니다.",
    images: [
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80"
    ],
    stock: 5,
    salesCount: 61,
    rating: 5.0,
    reviewsCount: 1,
    isBest: false,
    isNew: false,
    createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000
  },
  {
    name: "🦕 파스텔 브라키오 공룡 인형",
    category: "felt-doll",
    price: 24000,
    description: "아이들에게도 많은 사랑을 받는 귀여운 초식 공룡 브라키오 펠트 인형입니다. 도톰하고 튼튼하게 자립하는 발과 길쭉한 목선이 독특한 입체 디자인으로 완성되었습니다.",
    images: [
      "https://images.unsplash.com/photo-1515488042361-404e9250afef?w=600&auto=format&fit=crop&q=80"
    ],
    stock: 15,
    salesCount: 120,
    rating: 4.9,
    reviewsCount: 2,
    isBest: true,
    isNew: false,
    createdAt: Date.now() - 50 * 24 * 60 * 60 * 1000
  },
  {
    name: "🎅🏽 크리스마스 미니 진저쿠키맨",
    category: "seasonal",
    price: 16000,
    description: "[시즌 한정] 겨울의 설렘을 가득 품은 크리스마스 전용 진저브레드 쿠키 인형입니다. 빨간색 미니 리본과 스티치 장식이 섬세하게 새겨져 있어 크리스마스 트리 오너먼트로 제격입니다.",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80"
    ],
    stock: 18,
    salesCount: 210,
    rating: 4.9,
    reviewsCount: 1,
    isBest: false,
    isNew: false,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000
  }
];

const SEED_FAQS: Omit<FAQ, 'id'>[] = [
  {
    question: "펠트 인형 세탁은 가능한가요?",
    answer: "PINO공방의 인형은 100% 천연 양모 펠트로 바느질 마감되어 물에 푹 담가 세탁하는 것은 지양해 주세요. 오염된 부위만 미온수와 순한 중성 세제를 살짝 묻힌 수건으로 톡톡 두드려 닦아낸 후 그늘진 곳에서 건조해 주시면 아름다운 형태를 더 오래 유지하실 수 있습니다.",
    category: "care"
  },
  {
    question: "주문제작(Custom) 인형의 제작 기간이 얼마나 되나요?",
    answer: "주문제작의 경우 시안 상의 후 본격 제작에 돌입합니다. 핸드메이드 특성상 1:1 디테일 맞춤 작업이 필요하여, 결제 후 발송까지 주말 제외 5~10일 가량 소요됩니다. 여유를 두고 주문해 주시면 세상에 단 하나뿐인 명작을 만나보실 수 있습니다.",
    category: "custom"
  },
  {
    question: "선물 포장 패키지 옵션을 제공하나요?",
    answer: "물론입니다! 전 상품 주문 시 '선물 포장(메시지 카드 포함)'을 옵션으로 추가하실 수 있습니다. 크림 베이지 상자에 손수 접은 크래프트 충전재와 핀 장식, 그리고 감성을 담은 미니 드라이플라워가 장식되어 선물하시는 분의 마음에 걸맞게 소중히 전달됩니다.",
    category: "order"
  },
  {
    question: "단순 변심으로 인한 반품이나 환불이 가능한가요?",
    answer: "일반 완성품 상품의 경우 상품 수령 후 7일 이내에 포장이 훼손되지 않은 상태에서 왕복 배송비를 부담해 주시면 가능합니다. 다만, 고객님의 도안이나 반려동물 사진을 바탕으로 제작된 1:1 주문제작(Custom) 제품의 경우 제작 시작 이후 변경 및 취소가 불가능한 점 양해 부탁드립니다.",
    category: "shipping"
  }
];

const SEED_NOTICES: Omit<Notice, 'id'>[] = [
  {
    title: "🧸 PINO공방 정식 온라인 스토어 리뉴얼 오픈 이벤트!",
    content: "안녕하세요, PINO공방입니다! 더 따스하고 품격 있는 소통을 위해 마침내 통합 온라인 스토어를 정식 론칭했습니다. 신규 가입 즉시 자동으로 10% 웰컴 쿠폰이 지급되며, 출석체크 스탬프와 룰렛을 통한 매일의 소소한 혜택도 즐겨보세요. 늘 깊은 사랑 감사드립니다.",
    category: "event",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    views: 124
  },
  {
    title: "📢 반려동물 맞춤형 1:1 입체 액자 & 소형 인형 슬롯 오픈",
    content: "여러분의 소중한 반려동물(강아지, 고양이, 햄스터 등) 사진을 보내주시면 가장 특징을 살린 감성 충만 펠트 인형으로 완성해 드립니다. 주문제작 탭에서 사진 3장(정면, 측면, 전신)과 함께 원하는 시안 특징을 남겨 주시면 공방 지기가 정성을 다해 견적을 전해드립니다.",
    category: "notice",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    views: 95
  },
  {
    title: "🚚 우체국 택배 파업 우려에 따른 선제적 우송 안내",
    content: "최근 배송망 지연 우려에 대비하여, 당 공방은 전량 대한통운 프리미엄 안심 배송으로 변경하여 출고하고 있습니다. 도서산간 지역을 포함하여 평소와 다름없이 발송 후 1-2일 내로 안전 배송받으실 수 있습니다. 송장 번호는 마이페이지 주문 조회에서 실시간 추적하실 수 있습니다.",
    category: "shipping",
    createdAt: Date.now() - 12 * 60 * 60 * 1000,
    views: 45
  }
];

// Seeding DB Helper
export async function seedInitialDatabase() {
  try {
    // 1. Seed Products
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      if (productsSnap.empty) {
        console.log('Seeding products to Firestore...');
        for (const prod of SEED_PRODUCTS) {
          await addDoc(collection(db, 'products'), prod);
        }
      } else {
        // De-duplicate existing products with duplicate names
        const seenNames = new Set<string>();
        const productsToDelete: string[] = [];
        productsSnap.forEach((docSnap) => {
          const data = docSnap.data() as Product;
          if (seenNames.has(data.name)) {
            productsToDelete.push(docSnap.id);
          } else {
            seenNames.add(data.name);
          }
        });
        if (productsToDelete.length > 0) {
          console.log(`Deleting ${productsToDelete.length} duplicate products...`);
          for (const docId of productsToDelete) {
            await deleteDoc(doc(db, 'products', docId));
          }
        }
      }
    } catch (err) {
      console.warn('Error seeding products:', err);
    }

    // 2. Seed FAQs
    try {
      const faqsSnap = await getDocs(collection(db, 'faqs'));
      if (faqsSnap.empty) {
        console.log('Seeding FAQs to Firestore...');
        for (const faq of SEED_FAQS) {
          await addDoc(collection(db, 'faqs'), faq);
        }
      } else {
        // De-duplicate existing FAQs with duplicate questions
        const seenQuestions = new Set<string>();
        const faqsToDelete: string[] = [];
        faqsSnap.forEach((docSnap) => {
          const data = docSnap.data() as FAQ;
          if (seenQuestions.has(data.question)) {
            faqsToDelete.push(docSnap.id);
          } else {
            seenQuestions.add(data.question);
          }
        });
        if (faqsToDelete.length > 0) {
          console.log(`Deleting ${faqsToDelete.length} duplicate FAQs...`);
          for (const docId of faqsToDelete) {
            await deleteDoc(doc(db, 'faqs', docId));
          }
        }
      }
    } catch (err) {
      console.warn('Error seeding FAQs:', err);
    }

    // 3. Seed Notices
    try {
      const noticesSnap = await getDocs(collection(db, 'notices'));
      if (noticesSnap.empty) {
        console.log('Seeding Notices to Firestore...');
        for (const notice of SEED_NOTICES) {
          await addDoc(collection(db, 'notices'), notice);
        }
      } else {
        // De-duplicate existing Notices with duplicate titles
        const seenTitles = new Set<string>();
        const noticesToDelete: string[] = [];
        noticesSnap.forEach((docSnap) => {
          const data = docSnap.data() as Notice;
          if (seenTitles.has(data.title)) {
            noticesToDelete.push(docSnap.id);
          } else {
            seenTitles.add(data.title);
          }
        });
        if (noticesToDelete.length > 0) {
          console.log(`Deleting ${noticesToDelete.length} duplicate Notices...`);
          for (const docId of noticesToDelete) {
            await deleteDoc(doc(db, 'notices', docId));
          }
        }
      }
    } catch (err) {
      console.warn('Error seeding Notices:', err);
    }

    // 4. Seed initial reviews for product 1
    try {
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      if (reviewsSnap.empty) {
        const prods = await getDocs(collection(db, 'products'));
        let bearId = 'p1';
        prods.forEach(docSnap => {
          if (docSnap.data().name.includes('아기곰')) {
            bearId = docSnap.id;
          }
        });

        const initialReviews: Omit<Review, 'id'>[] = [
          {
            productId: bearId,
            productName: "🧸 베이지 펠트 아기곰 인형",
            userId: "demo-user-id",
            userName: "펠트사랑",
            rating: 5,
            content: "정말 너무너무 보들보들하고 튼튼해요! 공방 주인장님의 따스한 바느질 땀새가 고스란히 보여서 감동입니다. 선물 포장도 너무 이쁘게 와서 뜯기 아까웠어요 ㅠㅠ 번창하세요!",
            imageUrl: "https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=400&auto=format&fit=crop&q=80",
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            isBest: true
          },
          {
            productId: bearId,
            productName: "🧸 베이지 펠트 아기곰 인형",
            userId: "demo-user-id-2",
            userName: "감성캠퍼",
            rating: 5,
            content: "캠핑 감성 선반 위에 올려놨는데 조명이랑 너무 잘 어울립니다. 세상 하나뿐인 따스함이란 말이 딱 맞네요.",
            createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
            isBest: false
          }
        ];

        for (const rev of initialReviews) {
          await addDoc(collection(db, 'reviews'), rev);
        }
      }
    } catch (err) {
      console.warn('Error seeding reviews:', err);
    }

    // 5. Seed Classes
    try {
      const classesSnap = await getDocs(collection(db, 'classes'));
      if (classesSnap.empty) {
        console.log('Seeding Classes to Firestore...');
        const SEED_CLASSES = [
          {
            title: "🎨 [무료] 한 땀 한 땀 포근한 펠트인형 만들기",
            description: "포근하고 귀여운 양모 펠트를 사용하여 직접 동글동글 사랑스러운 펠트 인형을 손수 만들어보는 무료 클래스입니다. 초보자도 쉽게 따라 하실 수 있는 기초 바느질부터 꼼꼼히 가르쳐 드립니다.",
            image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80",
            dates: ["2026-07-08", "2026-07-15", "2026-07-22", "2026-07-29"],
            times: ["10:00", "13:00", "15:30"],
            maxParticipants: 12,
            createdAt: Date.now()
          },
          {
            title: "🧸 [무료] 말랑콩떡 양모 아기 펠트인형 만들기",
            description: "몽글몽글한 천연 펠트 양모를 만지며 나만의 작은 아기곰 인형을 한 땀 한 땀 빚어보는 무료 입문 클래스입니다. 초보자도 쉽게 2시간 내외로 나만의 동반자 인형을 완성해볼 수 있어요.",
            image: "https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=600&auto=format&fit=crop&q=80",
            dates: ["2026-07-05", "2026-07-12", "2026-07-19", "2026-07-26"],
            times: ["11:00", "14:00", "16:00"],
            maxParticipants: 10,
            createdAt: Date.now() - 12 * 60 * 60 * 1000
          },
          {
            title: "🐰 [무료] 동글토끼 펠트 키링 제작 클래스",
            description: "내 손으로 바느질해 만드는 귀여운 복슬복슬 토끼 키링 제작 클래스입니다. 실과 바늘을 잡아본 적 없어도, 세이지그린 숲 속 아늑한 분위기의 공방에서 누구나 정교한 가방 고리를 만들어 갑니다.",
            image: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80",
            dates: ["2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27"],
            times: ["13:00", "15:00"],
            maxParticipants: 8,
            createdAt: Date.now() - 24 * 60 * 60 * 1000
          }
        ];
        for (const cl of SEED_CLASSES) {
          await addDoc(collection(db, 'classes'), cl);
        }
      }
    } catch (err) {
      console.warn('Error seeding classes:', err);
    }

    // 6. Seed Class Reviews
    try {
      const classReviewsSnap = await getDocs(collection(db, 'class_reviews'));
      if (classReviewsSnap.empty) {
        console.log('Seeding Class Reviews to Firestore...');
        const classesDocs = await getDocs(collection(db, 'classes'));
        if (!classesDocs.empty) {
          let bearClassId = 'c1';
          let bearClassName = '🧸 [무료] 말랑콩떡 양모 아기 펠트인형 만들기';
          let keyringClassId = 'c2';
          let keyringClassName = '🐰 [무료] 동글토끼 펠트 키링 제작 클래스';

          classesDocs.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.title.includes('아기 펠트인형')) {
              bearClassId = docSnap.id;
              bearClassName = d.title;
            } else if (d.title.includes('키링')) {
              keyringClassId = docSnap.id;
              keyringClassName = d.title;
            }
          });

          const SEED_CLASS_REVIEWS = [
            {
              classId: bearClassId,
              className: bearClassName,
              userId: "demo-user-id",
              userName: "토끼맘",
              rating: 5,
              content: "아이랑 같이 와서 들었는데 선생님이 정말 하나하나 한 땀 한 땀 친절하게 알려주셔서 귀여운 곰인형 완성했어요! 너무 즐거운 힐링 시간이었습니다.",
              imageUrl: "https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=600&auto=format&fit=crop&q=80",
              createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
            },
            {
              classId: keyringClassId,
              className: keyringClassName,
              userId: "demo-user-id-2",
              userName: "바느질요정",
              rating: 5,
              content: "똥손이라 걱정했는데 공방 분위기도 너무 따뜻하고 포근하고, 친절하게 도와주셔서 세상 앙증맞은 토끼 키링 생겼어요! 다른 클래스도 열리면 꼭 또 오고 싶어요.",
              imageUrl: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80",
              createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000
            }
          ];

          for (const cr of SEED_CLASS_REVIEWS) {
            await addDoc(collection(db, 'class_reviews'), cr);
          }
        }
      }
    } catch (err) {
      console.warn('Error seeding class reviews:', err);
    }

    console.log('Database seeding process completed.');
  } catch (error) {
    console.error('Error seeding database: ', error);
  }
}

// User Profile management
export async function getOrCreateUserProfile(user: User, customDisplayName?: string): Promise<UserProfile> {
  try {
    const profileRef = doc(db, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const data = profileSnap.data() as UserProfile;
      // If the logging-in user's email is the designated admin email and they don't have the admin role, promote them.
      if (user.email === ADMIN_EMAIL && data.role !== 'admin') {
        const updatedData = { ...data, role: 'admin' as const };
        await updateDoc(profileRef, { role: 'admin' });
        return updatedData;
      }
      return data;
    }

    // Create new user profile with 10% coupon & sign-up bonus points (2,000 P)
    const isFirstAdmin = user.email === ADMIN_EMAIL || user.email?.startsWith('admin');
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || 'guest@pino.com',
      displayName: customDisplayName || user.displayName || user.email?.split('@')[0] || '아기펠트',
      points: 2000, // 2000P Sign up bonus
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
      birthday: '07-04', // Default to today
      role: isFirstAdmin ? 'admin' : 'user',
      createdAt: Date.now()
    };

    await setDoc(profileRef, newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    throw error;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const profileRef = doc(db, 'users', uid);
    await updateDoc(profileRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// Get all products
export async function fetchProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
    return [];
  }
}

// Update product
export async function addProduct(product: Omit<Product, 'id' | 'salesCount' | 'rating' | 'reviewsCount' | 'createdAt'>): Promise<string> {
  try {
    const newDoc = await addDoc(collection(db, 'products'), {
      ...product,
      salesCount: 0,
      rating: 5.0,
      reviewsCount: 0,
      createdAt: Date.now()
    });
    return newDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
    throw error;
  }
}

export async function updateProductDetails(id: string, data: Partial<Product>) {
  try {
    await updateDoc(doc(db, 'products', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
  }
}

export async function removeProduct(id: string) {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Product;
      if (data.images && data.images.length > 0) {
        for (const imageUrl of data.images) {
          if (imageUrl && (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.startsWith('gs://'))) {
            try {
              const storageRef = ref(storage, imageUrl);
              await deleteObject(storageRef);
              console.log('Successfully deleted product image from Firebase Storage:', imageUrl);
            } catch (storageErr) {
              console.warn('Could not delete image from Firebase Storage:', storageErr);
            }
          }
        }
      }
    }
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    throw error;
  }
}

// Standard Orders
export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const orderRef = collection(db, 'orders');
  const docRef = await addDoc(orderRef, {
    ...orderData,
    createdAt: Date.now()
  });
  return docRef.id;
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  try {
    const snap = await getDocs(q);
    const orders: Order[] = [];
    snap.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    return orders;
  } catch (err) {
    // Fallback if no index exists
    const snap = await getDocs(collection(db, 'orders'));
    const orders: Order[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as Order;
      if (data.userId === userId) {
        orders.push({ id: doc.id, ...data });
      }
    });
    return orders.sort((a,b) => b.createdAt - a.createdAt);
  }
}

export async function fetchAllOrders(): Promise<Order[]> {
  const snap = await getDocs(collection(db, 'orders'));
  const orders: Order[] = [];
  snap.forEach((doc) => {
    orders.push({ id: doc.id, ...doc.data() } as Order);
  });
  return orders.sort((a,b) => b.createdAt - a.createdAt);
}

export async function updateOrderStatus(orderId: string, status: Order['status'], trackingNumber?: string) {
  const ref = doc(db, 'orders', orderId);
  const updates: Partial<Order> = { status };
  if (trackingNumber !== undefined) {
    updates.trackingNumber = trackingNumber;
  }
  await updateDoc(ref, updates);
}

// Custom Orders
export async function createCustomOrder(customData: Omit<CustomOrder, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const ref = await addDoc(collection(db, 'custom_orders'), {
    ...customData,
    status: 'pending_estimate',
    createdAt: Date.now()
  });
  return ref.id;
}

export async function fetchUserCustomOrders(userId: string): Promise<CustomOrder[]> {
  const snap = await getDocs(collection(db, 'custom_orders'));
  const customs: CustomOrder[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as CustomOrder;
    if (data.userId === userId) {
      customs.push({ id: doc.id, ...data });
    }
  });
  return customs.sort((a,b) => b.createdAt - a.createdAt);
}

export async function fetchAllCustomOrders(): Promise<CustomOrder[]> {
  const snap = await getDocs(collection(db, 'custom_orders'));
  const customs: CustomOrder[] = [];
  snap.forEach((doc) => {
    customs.push({ id: doc.id, ...doc.data() } as CustomOrder);
  });
  return customs.sort((a,b) => b.createdAt - a.createdAt);
}

export async function updateCustomOrderStatus(customId: string, updates: Partial<CustomOrder>) {
  await updateDoc(doc(db, 'custom_orders', customId), updates);
}

// Reviews
export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const snap = await getDocs(collection(db, 'reviews'));
  const reviews: Review[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as Review;
    if (data.productId === productId) {
      reviews.push({ id: doc.id, ...data });
    }
  });
  return reviews.sort((a,b) => b.createdAt - a.createdAt);
}

export async function fetchAllReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, 'reviews'));
  const reviews: Review[] = [];
  snap.forEach((doc) => {
    reviews.push({ id: doc.id, ...doc.data() } as Review);
  });
  return reviews.sort((a,b) => b.createdAt - a.createdAt);
}

export async function addReview(reviewData: Omit<Review, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'reviews'), {
    ...reviewData,
    createdAt: Date.now()
  });
  return ref.id;
}

// Announcements & notices
export async function fetchNotices(): Promise<Notice[]> {
  const snap = await getDocs(collection(db, 'notices'));
  const notices: Notice[] = [];
  snap.forEach((doc) => {
    notices.push({ id: doc.id, ...doc.data() } as Notice);
  });
  return notices.sort((a,b) => b.createdAt - a.createdAt);
}

export async function addNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'views'>) {
  await addDoc(collection(db, 'notices'), {
    ...notice,
    createdAt: Date.now(),
    views: 0
  });
}

// FAQs
export async function fetchFAQs(): Promise<FAQ[]> {
  const snap = await getDocs(collection(db, 'faqs'));
  const faqs: FAQ[] = [];
  snap.forEach((doc) => {
    faqs.push({ id: doc.id, ...doc.data() } as FAQ);
  });
  return faqs;
}

// Event Logs (giveaways, roulette, check-ins)
export async function addEventLog(log: Omit<EventLog, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'event_logs'), {
    ...log,
    createdAt: Date.now()
  });
}

export async function fetchEventLogs(): Promise<EventLog[]> {
  const snap = await getDocs(collection(db, 'event_logs'));
  const logs: EventLog[] = [];
  snap.forEach((doc) => {
    logs.push({ id: doc.id, ...doc.data() } as EventLog);
  });
  return logs.sort((a,b) => b.createdAt - a.createdAt);
}

// --- Classes & Booking Helpers ---

export async function fetchClasses(): Promise<Class[]> {
  try {
    const snap = await getDocs(collection(db, 'classes'));
    const classes: Class[] = [];
    snap.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() } as Class);
    });

    // Ensure the "펠트인형 만들기" class exists dynamically
    const hasFeltDollClass = classes.some(c => c.title.includes('펠트인형 만들기'));
    if (!hasFeltDollClass) {
      console.log('Felt doll making class is missing from Firestore. Auto-seeding...');
      const newClassData = {
        title: "🎨 [무료] 한 땀 한 땀 포근한 펠트인형 만들기",
        description: "포근하고 귀여운 양모 펠트를 사용하여 직접 동글동글 사랑스러운 펠트 인형을 손수 만들어보는 무료 클래스입니다. 초보자도 쉽게 따라 하실 수 있는 기초 바느질부터 꼼꼼히 가르쳐 드립니다.",
        image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80",
        dates: ["2026-07-08", "2026-07-15", "2026-07-22", "2026-07-29"],
        times: ["10:00", "13:00", "15:30"],
        maxParticipants: 12,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'classes'), newClassData);
      classes.push({ id: docRef.id, ...newClassData } as Class);
    }

    return classes.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'classes');
    return [];
  }
}

export async function addClass(classData: Omit<Class, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'classes'), {
      ...classData,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'classes');
    throw error;
  }
}

export async function updateClass(id: string, updates: Partial<Class>) {
  try {
    await updateDoc(doc(db, 'classes', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `classes/${id}`);
    throw error;
  }
}

export async function removeClass(id: string) {
  try {
    await deleteDoc(doc(db, 'classes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `classes/${id}`);
    throw error;
  }
}

export async function fetchClassBookings(): Promise<ClassBooking[]> {
  try {
    const snap = await getDocs(collection(db, 'class_bookings'));
    const bookings: ClassBooking[] = [];
    snap.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as ClassBooking);
    });
    return bookings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'class_bookings');
    return [];
  }
}

export async function fetchUserClassBookings(userId: string): Promise<ClassBooking[]> {
  try {
    const snap = await getDocs(collection(db, 'class_bookings'));
    const bookings: ClassBooking[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as ClassBooking;
      if (data.userId === userId) {
        bookings.push({ id: doc.id, ...data });
      }
    });
    return bookings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'class_bookings');
    return [];
  }
}

export async function fetchNonMemberClassBookings(name: string, phone: string): Promise<ClassBooking[]> {
  try {
    const snap = await getDocs(collection(db, 'class_bookings'));
    const bookings: ClassBooking[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as ClassBooking;
      if (data.userName === name && data.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')) {
        bookings.push({ id: doc.id, ...data });
      }
    });
    return bookings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'class_bookings');
    return [];
  }
}

export async function addClassBooking(booking: Omit<ClassBooking, 'id' | 'createdAt' | 'status' | 'attended' | 'memo'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'class_bookings'), {
      ...booking,
      status: 'pending',
      attended: false,
      memo: '',
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'class_bookings');
    throw error;
  }
}

export async function updateClassBookingStatus(id: string, status: ClassBooking['status']) {
  try {
    await updateDoc(doc(db, 'class_bookings', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `class_bookings/${id}`);
    throw error;
  }
}

export async function updateClassBookingAttendance(id: string, attended: boolean) {
  try {
    await updateDoc(doc(db, 'class_bookings', id), { attended });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `class_bookings/${id}`);
    throw error;
  }
}

export async function updateClassBookingMemo(id: string, memo: string) {
  try {
    await updateDoc(doc(db, 'class_bookings', id), { memo });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `class_bookings/${id}`);
    throw error;
  }
}

export async function fetchClassReviews(): Promise<ClassReview[]> {
  try {
    const snap = await getDocs(collection(db, 'class_reviews'));
    const reviews: ClassReview[] = [];
    snap.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() } as ClassReview);
    });
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'class_reviews');
    return [];
  }
}

export async function addClassReview(review: Omit<ClassReview, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'class_reviews'), {
      ...review,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'class_reviews');
    throw error;
  }
}

export async function updateClassReview(id: string, updates: Partial<ClassReview>) {
  try {
    await updateDoc(doc(db, 'class_reviews', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `class_reviews/${id}`);
    throw error;
  }
}

export async function removeClassReview(id: string) {
  try {
    await deleteDoc(doc(db, 'class_reviews', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `class_reviews/${id}`);
    throw error;
  }
}

