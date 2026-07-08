export interface Product {
  id: string;
  name: string;
  category: 'felt-doll' | 'keyring' | 'mini-doll' | 'seasonal' | 'custom';
  price: number;
  description: string;
  images: string[];
  stock: number;
  salesCount: number;
  rating: number;
  reviewsCount: number;
  isBest?: boolean;
  isNew?: boolean;
  createdAt: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions?: {
    packing?: boolean;
    memo?: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  totalPrice: number;
  discountAmount: number;
  paidAmount: number;
  pointsUsed: number;
  pointsEarned: number;
  paymentMethod: 'bank_transfer';
  paymentInfo: {
    depositor: string;
    bank: string;
  };
  status: 'pending' | 'preparing' | 'making' | 'shipping' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    detailAddress: string;
  };
  trackingNumber?: string;
  createdAt: number;
}

export interface CustomOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  imageUrl: string;
  style: string;
  size: 'small' | 'medium' | 'large';
  color: string;
  memo: string;
  isGiftWrap: boolean;
  status: 'pending_estimate' | 'estimated' | 'paid' | 'preparing' | 'making' | 'completed' | 'shipping' | 'delivered';
  estimatePrice?: number;
  adminMemo?: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  points: number;
  coupons: {
    id: string;
    name: string;
    discount: number; // 10 = 10% or absolute value
    type: 'percent' | 'amount';
    minOrderValue: number;
    used: boolean;
    expiresAt: number;
  }[];
  attendanceHistory: string[]; // dates like 'YYYY-MM-DD'
  attendanceStreak: number;
  birthday?: string; // 'MM-DD'
  invitedBy?: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  imageUrl?: string;
  createdAt: number;
  isBest?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'notice' | 'event' | 'shipping' | 'restock';
  createdAt: number;
  views: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'order' | 'custom' | 'shipping' | 'care';
}

export interface CouponTemplate {
  id: string;
  name: string;
  discount: number;
  type: 'percent' | 'amount';
  minOrderValue: number;
}

export interface EventLog {
  id: string;
  userId: string;
  userEmail: string;
  eventType: 'roulette' | 'giveaway' | 'attendance';
  reward: string;
  createdAt: number;
}

export interface Class {
  id: string;
  title: string;
  description: string;
  image: string;
  dates: string[];
  times: string[];
  maxParticipants: number;
  createdAt: number;
}

export interface ClassBooking {
  id: string;
  classId: string;
  className: string;
  userId: string | null;
  userName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  participantsCount: number;
  itemToMake: string;
  request: string;
  agreedToPrivacy: boolean;
  status: 'pending' | 'approved' | 'cancelled';
  attended: boolean;
  memo: string;
  createdAt: number;
}

export interface ClassReview {
  id: string;
  classId: string;
  className: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  imageUrl?: string;
  createdAt: number;
}

export interface StoreSettings {
  homeImage: string;
  customPromoImage: string;
}

export interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageName: 'sprout' | 'petal' | 'master' | 'experience';
  packageLabel: string;
  price: number;
  status: 'active' | 'paused' | 'cancelled';
  deliveryCycle: 'monthly';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    detailAddress: string;
  };
  paymentMethod: 'bank_transfer' | 'none';
  createdAt: number;
  nextDeliveryDate: string;
}

