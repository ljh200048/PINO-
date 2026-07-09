import React, { useState, useEffect } from 'react';
import { 
  fetchProducts, 
  fetchAllOrders, 
  fetchAllCustomOrders, 
  updateOrderStatus, 
  updateCustomOrderStatus, 
  addProduct, 
  removeProduct,
  updateProductDetails,
  addNotice,
  fetchEventLogs,
  fetchClasses,
  addClass,
  removeClass,
  updateClass,
  fetchClassBookings,
  updateClassBookingStatus,
  updateClassBookingAttendance,
  updateClassBookingMemo,
  fetchClassReviews,
  updateClassReview,
  removeClassReview,
  fetchStoreSettings,
  updateStoreSettings,
  fetchAllSubscriptions,
  updateSubscriptionStatus,
  db 
} from '../lib/firebase';
import { Product, Order, CustomOrder, Notice, EventLog, Class, ClassBooking, ClassReview, StoreSettings, Subscription } from '../types';
import { doc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Settings, 
  ChevronRight, 
  CheckCircle, 
  TrendingUp, 
  Clipboard, 
  Package, 
  AlertCircle, 
  RefreshCw,
  Megaphone,
  Activity,
  Image,
  Link,
  Upload,
  Edit,
  Star,
  Gift,
  Trophy,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'events' | 'giveaway'>('all');
  const [drawWinners, setDrawWinners] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'products' | 'orders' | 'custom' | 'notices' | 'logs' | 'classes' | 'bookings' | 'reviews' | 'settings' | 'subscriptions'>('stats');

  // Class & Booking lists
  const [classes, setClasses] = useState<Class[]>([]);
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([]);
  const [classReviews, setClassReviews] = useState<ClassReview[]>([]);

  // Class Review edit states
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewContent, setEditReviewContent] = useState('');
  const [editReviewSuccess, setEditReviewSuccess] = useState('');
  const [editReviewError, setEditReviewError] = useState('');

  // Class register states
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassImage, setNewClassImage] = useState('https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600');
  const [newClassDates, setNewClassDates] = useState('2026-07-05, 2026-07-12, 2026-07-19');
  const [newClassTimes, setNewClassTimes] = useState('11:00, 14:00, 16:00');
  const [newClassMaxParticipants, setNewClassMaxParticipants] = useState(10);
  const [classSuccess, setClassSuccess] = useState('');

  // Booking memo edit state
  const [editingMemoBookingId, setEditingMemoBookingId] = useState<string | null>(null);
  const [tempBookingMemoText, setTempBookingMemoText] = useState('');

  // Product register state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState<Product['category']>('felt-doll');
  const [newProdPrice, setNewProdPrice] = useState(20000);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600');
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdSuccess, setNewProdSuccess] = useState('');

  // Product edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCat, setEditProdCat] = useState<Product['category']>('felt-doll');
  const [editProdPrice, setEditProdPrice] = useState(20000);
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdImg, setEditProdImg] = useState('');
  const [editProdStock, setEditProdStock] = useState(15);
  const [editProdSuccess, setEditProdSuccess] = useState('');
  const [editProdError, setEditProdError] = useState('');
  const [editProdImgMode, setEditProdImgMode] = useState<'preset' | 'url' | 'upload'>('url');

  // Class edit states
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassTitle, setEditClassTitle] = useState('');
  const [editClassDescription, setEditClassDescription] = useState('');
  const [editClassImage, setEditClassImage] = useState('');
  const [editClassDates, setEditClassDates] = useState('');
  const [editClassTimes, setEditClassTimes] = useState('');
  const [editClassMaxParticipants, setEditClassMaxParticipants] = useState(10);
  const [editClassSuccess, setEditClassSuccess] = useState('');
  const [editClassError, setEditClassError] = useState('');
  const [editClassImgMode, setEditClassImgMode] = useState<'preset' | 'url' | 'upload'>('url');

  // Image modes and file upload handlers
  const [prodImgMode, setProdImgMode] = useState<'preset' | 'url' | 'upload'>('preset');
  const [classImgMode, setClassImgMode] = useState<'preset' | 'url' | 'upload'>('preset');

  const compressAndSetImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          callback(compressed);
        } else {
          callback(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
      return;
    }

    compressAndSetImage(file, (compressedBase64) => {
      setNewProdImg(compressedBase64);
    });
  };

  const handleEditProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
      return;
    }

    compressAndSetImage(file, (compressedBase64) => {
      setEditProdImg(compressedBase64);
    });
  };

  const handleClassImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
      return;
    }

    compressAndSetImage(file, (compressedBase64) => {
      setNewClassImage(compressedBase64);
    });
  };

  const handleEditClassImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
      return;
    }

    compressAndSetImage(file, (compressedBase64) => {
      setEditClassImage(compressedBase64);
    });
  };

  // Notice state
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCat, setNewNoticeCat] = useState<Notice['category']>('notice');
  const [noticeSuccess, setNoticeSuccess] = useState('');

  // Custom order pricing state
  const [editCustomId, setEditCustomId] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<number>(35000);
  const [customAdminMemo, setCustomAdminMemo] = useState('');

  // Tracking numbers
  const [tempTrackingNum, setTempTrackingNum] = useState<{ [orderId: string]: string }>({});

  // Store Settings state
  const [adminHomeImage, setAdminHomeImage] = useState('https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600');
  const [adminCustomPromoImage, setAdminCustomPromoImage] = useState('https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsImgMode, setSettingsImgMode] = useState<'preset' | 'url' | 'upload'>('url');
  const [settingsPromoImgMode, setSettingsPromoImgMode] = useState<'preset' | 'url' | 'upload'>('url');

  const reloadAllData = async () => {
    try {
      setLoading(true);
      const [p, o, c, l, cls, bks, crs, settings, subs] = await Promise.all([
        fetchProducts(),
        fetchAllOrders(),
        fetchAllCustomOrders(),
        fetchEventLogs(),
        fetchClasses(),
        fetchClassBookings(),
        fetchClassReviews(),
        fetchStoreSettings(),
        fetchAllSubscriptions()
      ]);
      setProducts(p);
      setOrders(o);
      setCustomOrders(c);
      setEventLogs(l);
      setClasses(cls);
      setClassBookings(bks);
      setClassReviews(crs);
      setSubscriptions(subs);
      if (settings) {
        if (settings.homeImage) {
          setAdminHomeImage(settings.homeImage);
        }
        if (settings.customPromoImage) {
          setAdminCustomPromoImage(settings.customPromoImage);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChangeSubStatus = async (subId: string, newStatus: Subscription['status']) => {
    const statusLabel = newStatus === 'active' ? '활성화' : newStatus === 'paused' ? '일시 정지' : '해지';
    if (!window.confirm(`정말 이 구독 상태를 [${statusLabel}]로 변경하시겠습니까?`)) {
      return;
    }
    try {
      setLoading(true);
      await updateSubscriptionStatus(subId, newStatus);
      setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s));
      alert(`구독 상태가 성공적으로 [${statusLabel}] 상태로 변경되었습니다. 🧸`);
    } catch (err) {
      console.error(err);
      alert('구독 상태를 수정하는 과정에서 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleHomeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
      return;
    }

    compressAndSetImage(file, (compressedBase64) => {
      setAdminHomeImage(compressedBase64);
    });
  };

  const handleCustomPromoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.');
      return;
    }

    compressAndSetImage(file, (compressedBase64) => {
      setAdminCustomPromoImage(compressedBase64);
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    setSettingsError('');
    setSettingsLoading(true);

    if (!adminHomeImage.trim()) {
      setSettingsError('홈 화면 이미지 URL을 입력하거나 이미지를 업로드해주세요!');
      setSettingsLoading(false);
      return;
    }

    if (!adminCustomPromoImage.trim()) {
      setSettingsError('반려동물 1:1 의뢰 배너 이미지 URL을 입력하거나 이미지를 업로드해주세요!');
      setSettingsLoading(false);
      return;
    }

    try {
      await updateStoreSettings({ 
        homeImage: adminHomeImage.trim(),
        customPromoImage: adminCustomPromoImage.trim()
      });
      setSettingsSuccess('🎉 설정이 성공적으로 저장되었습니다!');
      alert('공방 설정이 성공적으로 저장되었습니다.');
      reloadAllData();
    } catch (err: any) {
      console.error(err);
      setSettingsError('설정 저장 실패: ' + (err.message || err));
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    reloadAllData();
  }, []);

  // Add Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewProdSuccess('');

    if (!newProdName.trim() || !newProdImg.trim() || !newProdDesc.trim()) {
      alert('모든 필드를 채워주세요!');
      return;
    }

    try {
      const prodImgUrl = newProdImg.trim();
      const pId = await addProduct({
        name: newProdName,
        category: newProdCat,
        price: Number(newProdPrice),
        description: newProdDesc,
        images: [prodImgUrl],
        stock: Number(newProdStock),
        isBest: false,
        isNew: true
      });

      setNewProdName('');
      setNewProdImg('https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600');
      setNewProdDesc('');
      setNewProdStock(15);
      setNewProdPrice(20000);

      setNewProdSuccess('🎉 신규 펠트 소품이 데이터베이스에 등록되었습니다!');
      reloadAllData();

    } catch (err: any) {
      console.error(err);
      alert('상품 등록 실패');
    }
  };

  // Add Notice
  const handleAddNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeSuccess('');

    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      alert('제목과 내용을 적어주세요.');
      return;
    }

    try {
      await addNotice({
        title: newNoticeTitle,
        content: newNoticeContent,
        category: newNoticeCat
      });

      setNewNoticeTitle('');
      setNewNoticeContent('');
      setNoticeSuccess('🎉 새로운 소식이 공지사항에 업로드되었습니다!');
      reloadAllData();
    } catch (err: any) {
      console.error(err);
      alert('공지 등록 실패');
    }
  };

  // Class & Booking admin handlers
  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassSuccess('');

    if (!newClassTitle.trim() || !newClassDescription.trim()) {
      alert('클래스명과 설명을 적어주세요.');
      return;
    }

    try {
      const datesArray = newClassDates.split(',').map(d => d.trim()).filter(Boolean);
      const timesArray = newClassTimes.split(',').map(t => t.trim()).filter(Boolean);

      await addClass({
        title: newClassTitle,
        description: newClassDescription,
        image: newClassImage,
        dates: datesArray,
        times: timesArray,
        maxParticipants: Number(newClassMaxParticipants)
      });

      setNewClassTitle('');
      setNewClassDescription('');
      setClassSuccess('🎉 새로운 무료 클래스가 등록되었습니다!');
      reloadAllData();
    } catch (err) {
      console.error(err);
      alert('클래스 등록 실패');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('정말 이 클래스를 데이터베이스에서 삭제하시겠습니까?')) return;
    try {
      await removeClass(classId);
      reloadAllData();
      alert('클래스가 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('클래스 삭제 중 오류 발생');
    }
  };

  // Start Edit Class
  const handleStartEditClass = (classObj: Class) => {
    setEditingClassId(classObj.id);
    setEditClassTitle(classObj.title);
    setEditClassDescription(classObj.description);
    setEditClassImage(classObj.image);
    setEditClassDates(classObj.dates.join(', '));
    setEditClassTimes(classObj.times.join(', '));
    setEditClassMaxParticipants(classObj.maxParticipants);
    setEditClassSuccess('');
    setEditClassError('');
    setEditClassImgMode('url');
  };

  // Submit Class Edit
  const handleEditClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditClassSuccess('');
    setEditClassError('');

    if (!editingClassId) return;

    if (!editClassTitle.trim() || !editClassDescription.trim() || !editClassImage.trim()) {
      setEditClassError('모든 필드를 채워주세요!');
      return;
    }

    try {
      const datesArray = editClassDates.split(',').map(d => d.trim()).filter(Boolean);
      const timesArray = editClassTimes.split(',').map(t => t.trim()).filter(Boolean);

      await updateClass(editingClassId, {
        title: editClassTitle,
        description: editClassDescription,
        image: editClassImage,
        dates: datesArray,
        times: timesArray,
        maxParticipants: Number(editClassMaxParticipants)
      });

      setEditClassSuccess('🎉 클래스 정보가 성공적으로 수정되었습니다!');
      reloadAllData();
      alert('클래스 정보가 수정되었습니다.');
      setEditingClassId(null);
    } catch (err: any) {
      console.error(err);
      setEditClassError('클래스 수정 실패: ' + (err.message || err));
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, nextStatus: 'approved' | 'pending' | 'cancelled') => {
    try {
      await updateClassBookingStatus(bookingId, nextStatus);
      reloadAllData();
      alert(`예약 상태가 [${nextStatus === 'approved' ? '승인완료' : nextStatus === 'pending' ? '승인대기' : '취소됨'}]로 업데이트되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('예약 상태 변경 오류');
    }
  };

  const handleToggleBookingAttendance = async (bookingId: string, currentAttendance: boolean) => {
    try {
      await updateClassBookingAttendance(bookingId, !currentAttendance);
      reloadAllData();
    } catch (err) {
      console.error(err);
      alert('출석 상태 변경 오류');
    }
  };

  const handleSaveBookingMemo = async (bookingId: string) => {
    try {
      await updateClassBookingMemo(bookingId, tempBookingMemoText);
      setEditingMemoBookingId(null);
      reloadAllData();
      alert('관리자 메모가 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('메모 저장 중 오류 발생');
    }
  };

  // Class Review Edit Handlers
  const handleStartEditReview = (review: ClassReview) => {
    setEditingReviewId(review.id);
    setEditReviewRating(review.rating);
    setEditReviewContent(review.content);
    setEditReviewSuccess('');
    setEditReviewError('');
  };

  const handleEditReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditReviewSuccess('');
    setEditReviewError('');

    if (!editingReviewId) return;

    if (!editReviewContent.trim()) {
      setEditReviewError('후기 내용을 입력해주세요!');
      return;
    }

    try {
      await updateClassReview(editingReviewId, {
        rating: Number(editReviewRating),
        content: editReviewContent
      });

      setEditReviewSuccess('🎉 수강 후기가 성공적으로 수정되었습니다!');
      reloadAllData();
      alert('수강 후기가 수정되었습니다.');
      setEditingReviewId(null);
    } catch (err: any) {
      console.error(err);
      setEditReviewError('수강 후기 수정 실패: ' + (err.message || err));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('정말 이 수강 후기를 삭제하시겠습니까?')) return;
    try {
      await removeClassReview(reviewId);
      reloadAllData();
      alert('수강 후기가 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('수강 후기 삭제 중 오류 발생');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (pId: string) => {
    if (!window.confirm('정말 이 상품을 데이터베이스에서 영구 삭제하시겠습니까?')) return;
    try {
      await removeProduct(pId);
      await reloadAllData();
      alert('선택한 소품이 성공적으로 삭제되었습니다.');
    } catch (err: any) {
      console.error(err);
      alert('소품 삭제 중 오류가 발생했습니다: ' + (err.message || err));
    }
  };

  // Start Edit Product
  const handleStartEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditProdName(prod.name);
    setEditProdCat(prod.category);
    setEditProdPrice(prod.price);
    setEditProdDesc(prod.description);
    setEditProdImg(prod.images[0] || '');
    setEditProdStock(prod.stock);
    setEditProdSuccess('');
    setEditProdError('');
    setEditProdImgMode('url');
  };

  // Submit Product Edit
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProdSuccess('');
    setEditProdError('');

    if (!editingProductId) return;

    if (!editProdName.trim() || !editProdImg.trim() || !editProdDesc.trim()) {
      setEditProdError('모든 필드를 채워주세요!');
      return;
    }

    try {
      const prodImgUrl = editProdImg.trim();
      await updateProductDetails(editingProductId, {
        name: editProdName,
        category: editProdCat,
        price: Number(editProdPrice),
        description: editProdDesc,
        images: [prodImgUrl],
        stock: Number(editProdStock)
      });

      setEditProdSuccess('🎉 상품 정보가 성공적으로 수정되었습니다!');
      reloadAllData();
      alert('상품 정보가 수정되었습니다.');
      setEditingProductId(null);
    } catch (err: any) {
      console.error(err);
      setEditProdError('상품 수정 실패: ' + (err.message || err));
    }
  };

  // Update Standard Order Status
  const handleUpdateStandardOrder = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const track = tempTrackingNum[orderId] || '';
      await updateOrderStatus(orderId, nextStatus, track || undefined);
      setTempTrackingNum(prev => ({ ...prev, [orderId]: '' }));
      reloadAllData();
      alert(`주문 번호의 상태가 [${nextStatus}]로 변경되었습니다.`);
    } catch (err: any) {
      console.error(err);
      alert('주문 상태 변경 중 오류 발생');
    }
  };

  // Set Custom Order Estimate Price
  const handleSaveCustomEstimate = async (customId: string) => {
    if (!customPrice || customPrice <= 0) {
      alert('가격을 입력하세요.');
      return;
    }

    try {
      await updateCustomOrderStatus(customId, {
        status: 'estimated',
        estimatePrice: Number(customPrice),
        adminMemo: customAdminMemo.trim() || '도안 확인 결과 정상 주문제작이 가능합니다. 확정된 견적금액을 결제해주시면 바로 손바느질 제작이 들어갑니다!'
      });

      setEditCustomId(null);
      setCustomAdminMemo('');
      reloadAllData();
      alert('견적서 발행 완료!');
    } catch (err: any) {
      console.error(err);
      alert('견적 처리 오류');
    }
  };

  // Update Custom Order status for fabrication workflow
  const handleUpdateCustomOrderFab = async (customId: string, nextStatus: CustomOrder['status']) => {
    try {
      await updateCustomOrderStatus(customId, { status: nextStatus });
      reloadAllData();
      alert(`주문제작 상태가 [${nextStatus}]로 업데이트되었습니다.`);
    } catch (err: any) {
      console.error(err);
      alert('상태 업데이트 오류');
    }
  };

  // Math Sales Calculations
  const totalSalesRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
    .reduce((acc, cur) => acc + cur.paidAmount, 0);

  const pendingStandardOrders = orders.filter(o => o.status === 'pending').length;
  const pendingCustomOrders = customOrders.filter(c => c.status === 'pending_estimate').length;

  // Class Booking stats
  const todayStr = new Date().toLocaleDateString();
  const todayApplicantsCount = classBookings.filter(b => {
    if (!b.createdAt) return false;
    const d = new Date(b.createdAt);
    return d.toLocaleDateString() === todayStr;
  }).reduce((sum, b) => sum + (b.participantsCount || 1), 0);

  const curMonth = new Date().getMonth();
  const curYear = new Date().getFullYear();
  const thisMonthApplicantsCount = classBookings.filter(b => {
    if (!b.createdAt) return false;
    const d = new Date(b.createdAt);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  }).reduce((sum, b) => sum + (b.participantsCount || 1), 0);

  const completedClassesCount = classes.length;

  const totalAttendeeCount = classBookings
    .filter(b => b.status === 'approved' && b.attended)
    .reduce((sum, b) => sum + (b.participantsCount || 1), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8" id="admin-panel-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8D5C4]/60 pb-5">
        <div>
          <span className="text-red-500 text-xs font-bold uppercase tracking-wider bg-red-50 border border-red-100 px-3 py-1 rounded-full inline-block mb-1.5">
            🔐 WORKSHOP ADMIN CONTROL
          </span>
          <h2 className="text-2xl font-black text-[#4A3E3D] font-sans">PINO공방지기 마스터 콘솔</h2>
        </div>

        <button 
          onClick={reloadAllData}
          className="flex items-center gap-1.5 p-2 px-4 text-xs font-semibold bg-[#E8D5C4]/30 hover:bg-[#E8D5C4]/60 text-[#4A3E3D] rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>실시간 갱신</span>
        </button>
      </div>

      {/* Stats Quick Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFF8F1] border border-[#E8D5C4]/80 p-5 rounded-3xl">
          <span className="text-[10px] font-bold text-gray-400 block uppercase">실시간 매출 수입</span>
          <span className="text-lg md:text-xl font-black text-[#C79A4A] mt-1 block">{totalSalesRevenue.toLocaleString()}원</span>
          <span className="text-[9px] text-gray-400">입금완료+배송완료 기준 합산</span>
        </div>
        <div className="bg-[#FFF8F1] border border-[#E8D5C4]/80 p-5 rounded-3xl">
          <span className="text-[10px] font-bold text-gray-400 block uppercase">입금 대기건 (표준)</span>
          <span className="text-lg md:text-xl font-black text-[#4A3E3D] mt-1 block">{pendingStandardOrders}건</span>
          <span className="text-[9px] text-amber-600 font-medium">신속한 확인 요망</span>
        </div>
        <div className="bg-[#FFF8F1] border border-[#E8D5C4]/80 p-5 rounded-3xl">
          <span className="text-[10px] font-bold text-gray-400 block uppercase">견적 대기건 (커스텀)</span>
          <span className="text-lg md:text-xl font-black text-rose-500 mt-1 block">{pendingCustomOrders}건</span>
          <span className="text-[9px] text-red-500 font-bold">1:1 도안 승인대기</span>
        </div>
        <div className="bg-[#FFF8F1] border border-[#E8D5C4]/80 p-5 rounded-3xl">
          <span className="text-[10px] font-bold text-gray-400 block uppercase">스토어 총 등록 인형</span>
          <span className="text-lg md:text-xl font-black text-emerald-800 mt-1 block">{products.length}종</span>
          <span className="text-[9px] text-gray-400">재고 마감 관리 기준</span>
        </div>
      </div>

      {/* Nav Sub-Tabs */}
      <div className="flex overflow-x-auto pb-2 scrollbar-none gap-2 text-xs font-bold border-b border-[#E8D5C4]">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'stats' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
        >
          경영 현황
        </button>
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'products' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
          id="admin-tab-products"
        >
          소품 등록 관리 ({products.length})
        </button>
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'orders' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
          id="admin-tab-orders"
        >
          표준 주문 출고 ({orders.length})
        </button>
        <button
          onClick={() => setActiveSubTab('custom')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'custom' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
          id="admin-tab-customs"
        >
          커스텀 견적제작 ({customOrders.length})
        </button>
        <button
          onClick={() => setActiveSubTab('notices')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'notices' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
        >
          공지/소식 등록
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'logs' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
        >
          이벤트 & 무료나눔 로그
        </button>
        <button
          onClick={() => setActiveSubTab('subscriptions')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'subscriptions' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
          id="admin-tab-subscriptions"
        >
          정기구독 회원 관리 ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'classes' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
        >
          무료 클래스 개설 ({classes.length})
        </button>
        <button
          onClick={() => setActiveSubTab('bookings')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'bookings' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
        >
          클래스 예약자 관리 ({classBookings.length})
        </button>
        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'reviews' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
          id="admin-tab-reviews"
        >
          클래스 후기 관리 ({classReviews.length})
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-2.5 px-4 cursor-pointer border-b-2 transition-all ${
            activeSubTab === 'settings' ? 'border-[#C79A4A] text-[#C79A4A]' : 'border-transparent text-gray-500 hover:text-[#4A3E3D]'
          }`}
          id="admin-tab-settings"
        >
          공방 홈 화면 관리
        </button>
      </div>

      {/* Sub-Tab Contents */}
      <div className="bg-[#FFF8F1] border-2 border-[#E8D5C4] rounded-3xl p-6 min-h-[350px]">
        
        {loading ? (
          <p className="text-center py-20 text-gray-400 text-xs">콘솔 데이터를 수집하는 중...</p>
        ) : (
          <>
            {/* Stats Dashboard */}
            {activeSubTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-sm font-extrabold text-[#4A3E3D] uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={16} className="text-[#C79A4A]" />
                  <span>공방 운영 및 매출 추이</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue list card */}
                  <div className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl">
                    <span className="text-xs font-bold text-[#4A3E3D] block mb-3">최근 실시간 주문 결제 완료 건</span>
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((o, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-[#E8D5C4]/15">
                          <div>
                            <p className="font-bold text-[#4A3E3D]">{o.userName} ({o.userEmail})</p>
                            <p className="text-gray-400 text-[10px]">{o.items.map(it => it.name).join(', ')}</p>
                          </div>
                          <span className="font-extrabold text-[#C79A4A]">{o.paidAmount.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational warnings */}
                  <div className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl space-y-4">
                    <span className="text-xs font-bold text-[#4A3E3D] block">운영자 주의 알림</span>
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs space-y-1.5">
                      <p className="font-bold">✓ 미승인 커스텀 도안 검토 ({pendingCustomOrders}건)</p>
                      <p className="text-[10px] text-red-700">고객이 업로드한 시바견, 러시안 블루 등 1:1 preset 도안을 검토하여 정당한 제작 난이도에 알맞은 custom estimate 단가를 발행해 주세요.</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 text-[#4A3E3D] rounded-xl text-xs space-y-1.5">
                      <p className="font-bold">✓ 무통장 결제 대기 확인 ({pendingStandardOrders}건)</p>
                      <p className="text-[10px] text-gray-500">지정 계좌 입금이 무사히 대조 완료되었는지 은행 대조 검토 후 배송 상태를 [준비중] 또는 [제작중]으로 가동하십시오.</p>
                    </div>
                  </div>
                </div>

                {/* Class booking statistics row */}
                <div className="mt-6 pt-6 border-t border-[#E8D5C4]/40">
                  <h4 className="text-xs font-bold text-[#4A3E3D] block mb-3">🎁 무료 클래스 신청 현황 통계</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#E8D5C4]/30 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 block font-bold">오늘 신청자 수</span>
                      <span className="text-base font-black text-[#C79A4A] mt-1 block">{todayApplicantsCount}명</span>
                    </div>
                    <div className="bg-white border border-[#E8D5C4]/30 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 block font-bold">이번 달 신청자 수</span>
                      <span className="text-base font-black text-[#4A3E3D] mt-1 block">{thisMonthApplicantsCount}명</span>
                    </div>
                    <div className="bg-white border border-[#E8D5C4]/30 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 block font-bold">진행 중인 클래스 종수</span>
                      <span className="text-base font-black text-indigo-700 mt-1 block">{completedClassesCount}개</span>
                    </div>
                    <div className="bg-white border border-[#E8D5C4]/30 p-4 rounded-xl">
                      <span className="text-[10px] text-gray-400 block font-bold">누적 참여 수료생 수</span>
                      <span className="text-base font-black text-emerald-700 mt-1 block">{totalAttendeeCount}명</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Register */}
            {activeSubTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Add or Edit product form (5 cols) */}
                {editingProductId ? (
                  <form onSubmit={handleEditProductSubmit} className="lg:col-span-5 bg-white border border-[#E8D5C4] rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-indigo-700 uppercase border-b border-[#E8D5C4]/40 pb-2 flex items-center gap-1.5">
                      <Edit size={14} />
                      <span>소품 정보 수정</span>
                    </h4>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">소품명</label>
                      <input
                        type="text"
                        required
                        placeholder="🧸 소품명 입력"
                        value={editProdName}
                        onChange={(e) => setEditProdName(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[#4A3E3D]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">카테고리</label>
                        <select
                          value={editProdCat}
                          onChange={(e) => setEditProdCat(e.target.value as any)}
                          className="w-full text-xs bg-white border border-[#E8D5C4] p-2.5 rounded-xl text-[#4A3E3D] focus:outline-none"
                        >
                          <option value="felt-doll">펠트인형</option>
                          <option value="keyring">키링</option>
                          <option value="mini-doll">미니소품</option>
                          <option value="seasonal">시즌한정</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">판매가격 (원)</label>
                        <input
                          type="number"
                          required
                          value={editProdPrice}
                          onChange={(e) => setEditProdPrice(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">재고량 (개)</label>
                        <input
                          type="number"
                          required
                          value={editProdStock}
                          onChange={(e) => setEditProdStock(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">소품 대표 이미지</label>
                      <div className="bg-indigo-50/10 border border-[#E8D5C4]/60 rounded-xl p-3 space-y-3">
                        {/* Tab Buttons */}
                        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg text-[10px]">
                          <button
                            type="button"
                            onClick={() => { setEditProdImgMode('preset'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              editProdImgMode === 'preset' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Image size={11} />
                            <span>예시 사진 선택</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditProdImgMode('url'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              editProdImgMode === 'url' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Link size={11} />
                            <span>직접 주소 입력</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditProdImgMode('upload'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              editProdImgMode === 'upload' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Upload size={11} />
                            <span>파일 업로드</span>
                          </button>
                        </div>

                        {/* Content based on selected tab */}
                        {editProdImgMode === 'preset' && (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { name: '아기곰 브라운', url: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600' },
                              { name: '토끼 핑크', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' },
                              { name: '오리 피규어', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600' }
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => setEditProdImg(preset.url)}
                                className={`relative rounded-lg overflow-hidden aspect-video border cursor-pointer transition-all ${
                                  editProdImg === preset.url ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-gray-200'
                                }`}
                              >
                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[9px] text-white font-bold text-center py-0.5 truncate">
                                  {preset.name}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {editProdImgMode === 'url' && (
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-... 또는 이미지 주소 붙여넣기"
                            value={editProdImg}
                            onChange={(e) => setEditProdImg(e.target.value)}
                            className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:border-indigo-500 text-[#4A3E3D] bg-white placeholder-[#4A3E3D]/30"
                          />
                        )}

                        {editProdImgMode === 'upload' && (
                          <div className="space-y-2">
                            <label className="border border-dashed border-[#E8D5C4] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/80 transition-colors">
                              <Upload size={18} className="text-indigo-600" />
                              <span className="text-[10px] font-bold text-[#4A3E3D]">이미지 파일 선택</span>
                              <span className="text-[9px] text-gray-400">(JPG, PNG, WEBP 등 / 최대 10MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditProductImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}

                        {/* Image Preview */}
                        {editProdImg && (
                          <div className="relative rounded-xl overflow-hidden aspect-video border border-[#E8D5C4]/80 bg-gray-50 flex items-center justify-center max-h-36">
                            <img src={editProdImg} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                              실시간 미리보기
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditProdImg('')}
                              className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">소품 상세 설명</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="상세 설명 입력"
                        value={editProdDesc}
                        onChange={(e) => setEditProdDesc(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                      />
                    </div>

                    {editProdSuccess && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded font-semibold text-center">
                        {editProdSuccess}
                      </div>
                    )}

                    {editProdError && (
                      <div className="p-2 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded font-semibold text-center">
                        {editProdError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProductId(null)}
                        className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        수정 취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        수정 완료
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAddProductSubmit} className="lg:col-span-5 bg-white border border-[#E8D5C4] rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-[#4A3E3D] uppercase border-b border-[#E8D5C4]/40 pb-2 flex items-center gap-1.5">
                      <Plus size={14} />
                      <span>신규 펠트 소품 추가</span>
                    </h4>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">소품명</label>
                      <input
                        type="text"
                        required
                        placeholder="🧸 파스텔 미니 부엉이 인형"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">카테고리</label>
                        <select
                          value={newProdCat}
                          onChange={(e) => setNewProdCat(e.target.value as any)}
                          className="w-full text-xs bg-white border border-[#E8D5C4] p-2.5 rounded-xl text-[#4A3E3D] focus:outline-none"
                        >
                          <option value="felt-doll">펠트인형</option>
                          <option value="keyring">키링</option>
                          <option value="mini-doll">미니소품</option>
                          <option value="seasonal">시즌한정</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">판매가격 (원)</label>
                        <input
                          type="number"
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">초기 재고량 (개)</label>
                        <input
                          type="number"
                          required
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">소품 대표 이미지</label>
                      <div className="bg-[#FFF8F1]/40 border border-[#E8D5C4]/60 rounded-xl p-3 space-y-3">
                        {/* Tab Buttons */}
                        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg text-[10px]">
                          <button
                            type="button"
                            onClick={() => { setProdImgMode('preset'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              prodImgMode === 'preset' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Image size={11} />
                            <span>예시 사진 선택</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setProdImgMode('url'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              prodImgMode === 'url' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Link size={11} />
                            <span>직접 주소 입력</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setProdImgMode('upload'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              prodImgMode === 'upload' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Upload size={11} />
                            <span>파일 업로드</span>
                          </button>
                        </div>

                        {/* Content based on selected tab */}
                        {prodImgMode === 'preset' && (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { name: '아기곰 브라운', url: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600' },
                              { name: '토끼 핑크', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' },
                              { name: '오리 피규어', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600' }
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => setNewProdImg(preset.url)}
                                className={`relative rounded-lg overflow-hidden aspect-video border cursor-pointer transition-all ${
                                  newProdImg === preset.url ? 'border-[#C79A4A] ring-2 ring-[#C79A4A]/20' : 'border-gray-200'
                                }`}
                              >
                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[9px] text-white font-bold text-center py-0.5 truncate">
                                  {preset.name}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {prodImgMode === 'url' && (
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-... 또는 이미지 주소 붙여넣기"
                            value={newProdImg}
                            onChange={(e) => setNewProdImg(e.target.value)}
                            className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:border-[#C79A4A] text-[#4A3E3D] bg-white placeholder-[#4A3E3D]/30"
                          />
                        )}

                        {prodImgMode === 'upload' && (
                          <div className="space-y-2">
                            <label className="border border-dashed border-[#E8D5C4] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/80 transition-colors">
                              <Upload size={18} className="text-[#C79A4A]" />
                              <span className="text-[10px] font-bold text-[#4A3E3D]">이미지 파일 선택</span>
                              <span className="text-[9px] text-gray-400">(JPG, PNG, WEBP 등 / 최대 10MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProductImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}

                        {/* Image Preview */}
                        {newProdImg && (
                          <div className="relative rounded-xl overflow-hidden aspect-video border border-[#E8D5C4]/80 bg-gray-50 flex items-center justify-center max-h-36">
                            <img src={newProdImg} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                              실시간 미리보기
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewProdImg('')}
                              className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">소품 상세 설명</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="천연 오가닉 울 원단을 손으로 직접 한 땀 한 땀 마감하여 부드럽고 친근합니다..."
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                      />
                    </div>

                    {newProdSuccess && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded font-semibold text-center">
                        {newProdSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#4A3E3D] text-white font-bold text-xs rounded-xl hover:bg-[#C79A4A] transition-colors cursor-pointer"
                    >
                      소품 신규 등록
                    </button>
                  </form>
                )}

                {/* Products list table (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-[#E8D5C4] rounded-2xl p-5 overflow-x-auto">
                  <h4 className="text-xs font-black text-[#4A3E3D] uppercase border-b border-[#E8D5C4]/40 pb-2 flex items-center gap-1.5 mb-4">
                    <Package size={14} />
                    <span>현재 등록 소품 ({products.length})</span>
                  </h4>

                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E8D5C4]/50 text-gray-400 font-bold">
                        <th className="py-2">이미지</th>
                        <th className="py-2">소품명</th>
                        <th className="py-2">카테고리</th>
                        <th className="py-2">금액</th>
                        <th className="py-2">재고</th>
                        <th className="py-2 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-neutral-50">
                          <td className="py-2">
                            <img src={prod.images[0]} alt={prod.name} className="w-8 h-8 object-cover rounded border border-gray-100" referrerPolicy="no-referrer" />
                          </td>
                          <td className="py-2 font-bold text-[#4A3E3D] max-w-[120px] truncate">{prod.name}</td>
                          <td className="py-2 text-gray-500 uppercase">{prod.category}</td>
                          <td className="py-2 font-semibold">{prod.price.toLocaleString()}원</td>
                          <td className="py-2 font-mono">{prod.stock}개</td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEditProduct(prod)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  editingProductId === prod.id 
                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80'
                                }`}
                                title="수정하기"
                              >
                                <Edit size={11} />
                                <span>수정하기</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="제거"
                              >
                                <Trash2 size={11} />
                                <span>제거</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Standard Orders control */}
            {activeSubTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-[#4A3E3D] pb-1 border-b border-[#E8D5C4]/30">표준 구매 주문 출고 관리</h3>
                
                {orders.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-10">접수된 표준 결제 건이 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div key={ord.id} className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 text-xs">
                        {/* Order info */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <p className="font-extrabold text-[#4A3E3D]">👤 주문자: {ord.userName} ({ord.userEmail})</p>
                          <p className="text-[11px] text-gray-500">배송지: {ord.shippingAddress.address} {ord.shippingAddress.detailAddress} ({ord.shippingAddress.phone})</p>
                          <p className="text-[11px] text-gray-400 font-bold">합계: {ord.paidAmount.toLocaleString()}원 · {ord.paymentInfo?.depositor}입금대기 (은행: {ord.paymentInfo?.bank?.slice(0,4)})</p>
                          <div className="border-l-4 border-[#C79A4A] pl-2 text-[10px] text-[#4A3E3D]/80 font-bold space-y-0.5 mt-2">
                            {ord.items.map((it, idx) => (
                              <p key={idx}>• {it.name} x {it.quantity}개 ({it.price.toLocaleString()}원)</p>
                            ))}
                          </div>
                        </div>

                        {/* Status controllers */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 bg-neutral-50 p-3 rounded-xl border border-gray-100">
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">현재상태: {ord.status}</span>
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => handleUpdateStandardOrder(ord.id, 'preparing')}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded font-bold cursor-pointer"
                              >
                                결제승인(준비중)
                              </button>
                              <button
                                onClick={() => handleUpdateStandardOrder(ord.id, 'making')}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded font-bold cursor-pointer"
                              >
                                제작개시
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-gray-400 block uppercase">배송 송장 번호 입력</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="대한통운 58402.."
                                value={tempTrackingNum[ord.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTempTrackingNum(prev => ({ ...prev, [ord.id]: val }));
                                }}
                                className="p-1.5 bg-white border border-gray-300 rounded text-[11px] w-28 focus:outline-none focus:ring-1 focus:ring-[#C79A4A]"
                              />
                              <button
                                onClick={() => handleUpdateStandardOrder(ord.id, 'shipping')}
                                className="p-1.5 bg-[#4A3E3D] hover:bg-[#C79A4A] text-white rounded font-bold cursor-pointer"
                              >
                                송장발송
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom order estimates control */}
            {activeSubTab === 'custom' && (
              <div className="space-y-5">
                <h3 className="text-sm font-extrabold text-[#4A3E3D] pb-1 border-b border-[#E8D5C4]/30">1:1 맞춤형 주문제작 심사 견적 발행</h3>
                
                {customOrders.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-10">접수된 1:1 커스텀 신청건이 없습니다.</p>
                ) : (
                  <div className="space-y-5">
                    {customOrders.map((cust) => (
                      <div key={cust.id} className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl space-y-4 text-xs">
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex gap-4 items-center min-w-0">
                            <img src={cust.imageUrl} alt="Draft drawing" className="w-14 h-14 object-cover rounded-xl border border-[#E8D5C4]/30 shrink-0" referrerPolicy="no-referrer" />
                            <div className="min-w-0 text-xs leading-relaxed">
                              <p className="font-extrabold text-[#4A3E3D]">의뢰고객: {cust.userName} ({cust.userEmail})</p>
                              <p className="font-bold text-[#C79A4A]">{cust.style}</p>
                              <p className="text-gray-500 font-medium">크기: {cust.size} / 주조색: {cust.color} / 포장: {cust.isGiftWrap ? '포장박스추가' : '기본봉투'}</p>
                              <p className="text-gray-400 pl-2.5 border-l-2 border-gray-200 truncate italic mt-1">&ldquo;{cust.memo}&rdquo;</p>
                            </div>
                          </div>

                          {/* Current badge */}
                          <span className="self-start md:self-center px-2.5 py-1 bg-[#FFF8F1] border border-[#E8D5C4] text-[#C79A4A] font-bold rounded-full">
                            상태: {cust.status}
                          </span>
                        </div>

                        {/* ESTIMATE FORM FOR PENDING CUSTOMS */}
                        {cust.status === 'pending_estimate' && (
                          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                              <ShieldAlert size={14} />
                              <span>미발행 견적 수작업 심사 </span>
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">책정 견적가 (원)</label>
                                <input
                                  type="number"
                                  value={editCustomId === cust.id ? customPrice : 35000}
                                  onChange={(e) => {
                                    setEditCustomId(cust.id);
                                    setCustomPrice(Number(e.target.value));
                                  }}
                                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-[#4A3E3D] font-bold"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 block mb-1">고객 알림 메시지 (memo)</label>
                                <input
                                  type="text"
                                  placeholder="도안 확인결과 제작난이도 양호하며 S사이즈 솜인형 완성도 높게 제작해 드릴 예정입니다..."
                                  value={editCustomId === cust.id ? customAdminMemo : ''}
                                  onChange={(e) => {
                                    setEditCustomId(cust.id);
                                    setCustomAdminMemo(e.target.value);
                                  }}
                                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-[#4A3E3D]"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveCustomEstimate(cust.id)}
                              className="py-2 px-5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer"
                            >
                              견적서 및 입금 안내장 발행 완료
                            </button>
                          </div>
                        )}

                        {/* FLOW Fabrications controls for paid/making customs */}
                        {['paid', 'preparing', 'making', 'completed'].includes(cust.status) && (
                          <div className="p-3 bg-neutral-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">바느질 일정 가동:</span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => handleUpdateCustomOrderFab(cust.id, 'preparing')}
                                className="p-1 bg-white border hover:bg-neutral-50 rounded font-bold px-2 text-[10px]"
                              >
                                가공개시
                              </button>
                              <button
                                onClick={() => handleUpdateCustomOrderFab(cust.id, 'making')}
                                className="p-1 bg-white border hover:bg-neutral-50 rounded font-bold px-2 text-[10px] text-rose-500"
                              >
                                바느질 중🧵
                              </button>
                              <button
                                onClick={() => handleUpdateCustomOrderFab(cust.id, 'completed')}
                                className="p-1 bg-white border hover:bg-neutral-50 rounded font-bold px-2 text-[10px] text-amber-600"
                              >
                                인형완료✨
                              </button>
                              <button
                                onClick={() => handleUpdateCustomOrderFab(cust.id, 'shipping')}
                                className="p-1 bg-white border hover:bg-neutral-50 rounded font-bold px-2 text-[10px] text-emerald-800"
                              >
                                배송발송🚚
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notices Register */}
            {activeSubTab === 'notices' && (
              <form onSubmit={handleAddNoticeSubmit} className="max-w-xl mx-auto bg-white border border-[#E8D5C4] rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-[#4A3E3D] uppercase border-b border-[#E8D5C4]/40 pb-2 flex items-center gap-1.5">
                  <Megaphone size={14} className="text-[#C79A4A]" />
                  <span>새로운 공지 / 소식 작성</span>
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">소식 제목</label>
                  <input
                    type="text"
                    required
                    placeholder="🧸 [안내] 설 연휴 배송 및 공방 정기 휴무일 안내"
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">소식 분류</label>
                    <select
                      value={newNoticeCat}
                      onChange={(e) => setNewNoticeCat(e.target.value as any)}
                      className="w-full text-xs bg-white border border-[#E8D5C4] p-2.5 rounded-xl text-[#4A3E3D]"
                    >
                      <option value="notice">공지사항</option>
                      <option value="event">감성이벤트</option>
                      <option value="shipping">배송/특송</option>
                      <option value="restock">재입고소식</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">본문 내용</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="안녕하세요, PINO공방입니다..."
                    value={newNoticeContent}
                    onChange={(e) => setNewNoticeContent(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                  />
                </div>

                {noticeSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded font-semibold text-center">
                    {noticeSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#4A3E3D] text-white font-bold text-xs rounded-xl hover:bg-[#C79A4A] transition-colors cursor-pointer"
                >
                  공지사항 발행
                </button>
              </form>
            )}

            {/* Event Log audit trails */}
            {activeSubTab === 'logs' && (() => {
              const giveawayLogs = eventLogs.filter(log => log.eventType === 'giveaway');
              const otherEventLogs = eventLogs.filter(log => log.eventType !== 'giveaway');
              
              const filteredLogs = logFilter === 'all' 
                ? eventLogs 
                : logFilter === 'giveaway' 
                ? giveawayLogs 
                : otherEventLogs;

              const handleDrawGiveawayWinners = () => {
                if (giveawayLogs.length === 0) {
                  alert('무료 나눔 신청자가 존재하지 않아 추첨할 수 없습니다.');
                  return;
                }
                const uniqueEmails = Array.from(new Set(giveawayLogs.map(l => l.userEmail)));
                const shuffled = [...uniqueEmails].sort(() => 0.5 - Math.random());
                const winners = shuffled.slice(0, 3);
                setDrawWinners(winners);
              };

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-[#E8D5C4]/30 gap-3">
                    <h3 className="text-sm font-extrabold text-[#4A3E3D] flex items-center gap-1.5">
                      <Activity size={16} className="text-[#C79A4A]" />
                      <span>이벤트 참여 & 무료나눔 신청 관리자 콘솔</span>
                    </h3>
                    
                    {/* Log Filter Buttons */}
                    <div className="flex bg-white border border-[#E8D5C4] p-1 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setLogFilter('all')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          logFilter === 'all' ? 'bg-[#4A3E3D] text-white' : 'text-gray-400 hover:text-[#4A3E3D]'
                        }`}
                      >
                        전체 로그 ({eventLogs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogFilter('events')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          logFilter === 'events' ? 'bg-[#4A3E3D] text-white' : 'text-gray-400 hover:text-[#4A3E3D]'
                        }`}
                      >
                        출석/룰렛 ({otherEventLogs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogFilter('giveaway')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          logFilter === 'giveaway' ? 'bg-[#4A3E3D] text-white' : 'text-gray-400 hover:text-[#4A3E3D]'
                        }`}
                      >
                        무료나눔 신청 ({giveawayLogs.length})
                      </button>
                    </div>
                  </div>

                  {/* Giveaway-Specific Admin Tools Section */}
                  {logFilter === 'giveaway' && (
                    <div className="bg-[#FFF8F1]/40 border border-[#E8D5C4]/70 p-5 rounded-2xl space-y-4 shadow-3xs animate-fadeIn">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-[#4A3E3D] flex items-center gap-1">
                            <Gift size={14} className="text-[#C79A4A]" />
                            <span>🎁 [베이지 펠트 아기곰 인형 스페셜 패키지] 나눔 이벤트 신청자</span>
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            리뉴얼 오픈 기념으로 공방 방문 수령 당첨자 추첨 및 응모자 명단을 실시간으로 관리하는 영역입니다.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleDrawGiveawayWinners}
                          className="bg-[#4A3E3D] hover:bg-[#C79A4A] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95 self-stretch md:self-auto justify-center"
                        >
                          <Trophy size={14} />
                          <span>럭키 드로우! 당첨자 3명 뽑기 🧸</span>
                        </button>
                      </div>

                      {drawWinners.length > 0 && (
                        <div className="bg-white border-2 border-dashed border-[#C79A4A]/80 p-5 rounded-2xl space-y-3 text-center shadow-2xs relative">
                          <button
                            type="button"
                            onClick={() => setDrawWinners([])}
                            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 cursor-pointer"
                            title="결과 지우기"
                          >
                            ×
                          </button>
                          <div className="flex items-center justify-center gap-1.5">
                            <Sparkles size={16} className="text-[#C79A4A] animate-spin" />
                            <h5 className="font-extrabold text-xs text-[#4A3E3D]">🧸 축하합니다! 당첨자 목록</h5>
                            <Sparkles size={16} className="text-[#C79A4A] animate-spin" />
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center pt-1">
                            {drawWinners.map((winner, idx) => (
                              <div key={idx} className="bg-[#FFF8F1] border border-[#E8D5C4] text-[#4A3E3D] text-xs font-mono font-bold px-4 py-2 rounded-xl shadow-3xs flex items-center gap-1.5">
                                <span className="text-[#C79A4A]">👑 {idx + 1}등:</span>
                                <span>{winner}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold">참가 신청 회원 리스트에서 실시간으로 중복없이 엄선된 당첨자 3인입니다.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {filteredLogs.length === 0 ? (
                    <p className="text-xs text-center text-gray-400 py-10">
                      {logFilter === 'giveaway' 
                        ? '무료 나눔 이벤트 참가 신청자가 아직 없습니다.' 
                        : '해당하는 이벤트 참여 이력이 없습니다.'}
                    </p>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                      {filteredLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-white border border-[#E8D5C4]/40 rounded-xl flex justify-between items-center text-xs shadow-3xs hover:border-[#C79A4A]/30 transition-all">
                          <div>
                            <span className="text-gray-400 text-[10px] block">{new Date(log.createdAt).toLocaleString()}</span>
                            <span className="font-bold text-[#4A3E3D]">{log.userEmail}</span>
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.eventType === 'giveaway'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-[#E8D5C4]/30 text-[#4A3E3D]'
                            }`}>
                              {log.eventType === 'roulette' 
                                ? '룰렛' 
                                : log.eventType === 'attendance' 
                                ? '출석' 
                                : log.eventType === 'giveaway' 
                                ? '🎁 무료나눔신청' 
                                : '가입'}
                            </span>
                          </div>
                          <span className="font-extrabold text-[#C79A4A]">{log.reward}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Subscriptions Subtab */}
            {activeSubTab === 'subscriptions' && (() => {
              const filteredSubs = subscriptions.filter(sub => {
                const matchesStatus = subStatusFilter === 'all' || sub.status === subStatusFilter;
                const searchLower = subSearchQuery.toLowerCase();
                const matchesSearch = !subSearchQuery || 
                  sub.userEmail.toLowerCase().includes(searchLower) ||
                  sub.userName.toLowerCase().includes(searchLower) ||
                  sub.packageName.toLowerCase().includes(searchLower) ||
                  sub.packageLabel.toLowerCase().includes(searchLower) ||
                  (sub.shippingAddress?.name && sub.shippingAddress.name.toLowerCase().includes(searchLower)) ||
                  (sub.shippingAddress?.address && sub.shippingAddress.address.toLowerCase().includes(searchLower));
                return matchesStatus && matchesSearch;
              });

              const activeCount = subscriptions.filter(s => s.status === 'active').length;
              const pausedCount = subscriptions.filter(s => s.status === 'paused').length;
              const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length;

              return (
                <div className="space-y-6" id="admin-subtab-subscriptions">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-[#E8D5C4]/30 gap-3">
                    <h3 className="text-sm font-extrabold text-[#4A3E3D] flex items-center gap-1.5">
                      <Gift size={16} className="text-[#C79A4A]" />
                      <span>PINO공방 정기구독 신청 회원 관리</span>
                    </h3>
                    <p className="text-xs text-gray-400">구독 신청 회원의 주소지, 연락처 및 상태를 조회하고 제어합니다.</p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#E8D5C4] p-4 rounded-2xl flex flex-col justify-between shadow-3xs">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">전체 신청 건수</span>
                      <span className="text-xl font-black text-[#4A3E3D] mt-1">{subscriptions.length}건</span>
                    </div>
                    <div className="bg-[#FFF8F1] border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between shadow-3xs">
                      <span className="text-[10px] font-bold text-emerald-600 block uppercase">구독 유지/활성</span>
                      <span className="text-xl font-black text-emerald-700 mt-1">{activeCount}건</span>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex flex-col justify-between shadow-3xs">
                      <span className="text-[10px] font-bold text-amber-600 block uppercase">구독 일시 정지</span>
                      <span className="text-xl font-black text-amber-700 mt-1">{pausedCount}건</span>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex flex-col justify-between shadow-3xs">
                      <span className="text-[10px] font-bold text-rose-400 block uppercase">구독 해지 완료</span>
                      <span className="text-xl font-black text-rose-600 mt-1">{cancelledCount}건</span>
                    </div>
                  </div>

                  {/* Filters & Search Control */}
                  <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-4 border border-[#E8D5C4]/50 rounded-2xl">
                    <div className="flex bg-gray-50 border border-[#E8D5C4]/60 p-1 rounded-xl text-[11px] font-bold w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setSubStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex-1 md:flex-none text-center ${
                          subStatusFilter === 'all' ? 'bg-[#4A3E3D] text-white shadow-3xs' : 'text-gray-400 hover:text-[#4A3E3D]'
                        }`}
                      >
                        전체 ({subscriptions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex-1 md:flex-none text-center ${
                          subStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-3xs' : 'text-gray-400 hover:text-[#4A3E3D]'
                        }`}
                      >
                        활성 ({activeCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubStatusFilter('paused')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex-1 md:flex-none text-center ${
                          subStatusFilter === 'paused' ? 'bg-amber-500 text-white shadow-3xs' : 'text-gray-400 hover:text-[#4A3E3D]'
                        }`}
                      >
                        일시정지 ({pausedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubStatusFilter('cancelled')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex-1 md:flex-none text-center ${
                          subStatusFilter === 'cancelled' ? 'bg-rose-500 text-white shadow-3xs' : 'text-gray-400 hover:text-[#4A3E3D]'
                        }`}
                      >
                        해지 ({cancelledCount})
                      </button>
                    </div>

                    <div className="relative w-full md:max-w-xs">
                      <input
                        type="text"
                        placeholder="이메일, 이름, 패키지, 주소 검색..."
                        value={subSearchQuery}
                        onChange={(e) => setSubSearchQuery(e.target.value)}
                        className="w-full text-xs border border-[#E8D5C4] focus:outline-none focus:ring-1 focus:ring-[#C79A4A] pl-3 pr-8 py-2 rounded-xl text-[#4A3E3D] bg-white font-medium"
                      />
                      {subSearchQuery && (
                        <button
                          onClick={() => setSubSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List of Subscriptions */}
                  {filteredSubs.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-[#E8D5C4]/30 rounded-2xl">
                      <Gift size={28} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-bold">일치하는 정기구독 신청 정보가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredSubs.map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-white border border-[#E8D5C4]/60 rounded-2xl p-5 space-y-4 hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-gray-400 block">신청일: {new Date(sub.createdAt).toLocaleString()}</span>
                                <span className="text-xs font-black text-[#4A3E3D] block mt-0.5">{sub.userName} ({sub.userEmail})</span>
                              </div>
                              <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border ${
                                sub.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : sub.status === 'paused'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {sub.status === 'active' ? '구독 활성' : sub.status === 'paused' ? '일시 정지' : '해지 완료'}
                              </span>
                            </div>

                            <div className="bg-[#FFF8F1]/40 border border-[#E8D5C4]/30 p-3 rounded-xl space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">구독 상품</span>
                                <span className="font-extrabold text-[#4A3E3D]">{sub.packageLabel} ({sub.packageName})</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">월 납부 요금</span>
                                <span className="font-extrabold text-[#C79A4A]">{sub.price === 0 ? "0원 (무료 체험)" : sub.price.toLocaleString() + '원'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">입금자 지명</span>
                                <span className="font-bold text-[#4A3E3D]">{sub.depositor || '없음(체험단)'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">첫 발송 예정일</span>
                                <span className="font-bold text-indigo-600">{sub.nextDeliveryDate}</span>
                              </div>
                            </div>

                            <div className="bg-gray-50/50 border border-gray-100 p-3 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-gray-400 block border-b border-gray-100 pb-1 mb-1">🚚 배송 및 연락망</span>
                              <div className="grid grid-cols-3 gap-1 text-[11px]">
                                <span className="text-gray-400">수령인</span>
                                <span className="col-span-2 font-bold text-gray-700">{sub.shippingAddress?.name || sub.userName}</span>
                                <span className="text-gray-400">연락처</span>
                                <span className="col-span-2 font-bold text-gray-700">{sub.shippingAddress?.phone || '없음'}</span>
                                <span className="text-gray-400">배송 주소</span>
                                <span className="col-span-2 text-gray-600 font-medium">
                                  {sub.shippingAddress?.address ? `${sub.shippingAddress.address} ${sub.shippingAddress.detailAddress || ''}` : '정보 없음'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                            {sub.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleAdminChangeSubStatus(sub.id, 'active')}
                                className="flex-1 text-[11px] font-black py-1.5 rounded-xl cursor-pointer bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all text-center"
                              >
                                활성화 전환
                              </button>
                            )}
                            {sub.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleAdminChangeSubStatus(sub.id, 'paused')}
                                className="flex-1 text-[11px] font-black py-1.5 rounded-xl cursor-pointer bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white transition-all text-center"
                              >
                                일시 정지
                              </button>
                            )}
                            {sub.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleAdminChangeSubStatus(sub.id, 'cancelled')}
                                className="flex-1 text-[11px] font-black py-1.5 rounded-xl cursor-pointer bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all text-center"
                              >
                                구독 해지
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Class Registration Subtab */}
            {activeSubTab === 'classes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="admin-subtab-classes">
                {/* Left: Add or Edit Class form (5 cols) */}
                {editingClassId ? (
                  <form onSubmit={handleEditClassSubmit} className="lg:col-span-5 bg-white border border-[#E8D5C4] rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-indigo-700 uppercase border-b border-[#E8D5C4]/40 pb-2 flex items-center gap-1.5">
                      <Edit size={14} />
                      <span>클래스 정보 수정</span>
                    </h4>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">클래스 주제명</label>
                      <input
                        type="text"
                        required
                        placeholder="🧸 클래스 주제명 입력"
                        value={editClassTitle}
                        onChange={(e) => setEditClassTitle(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[#4A3E3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">클래스 상세 설명</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="상세 설명 입력"
                        value={editClassDescription}
                        onChange={(e) => setEditClassDescription(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[#4A3E3D]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">최대 정원 (명)</label>
                        <input
                          type="number"
                          required
                          value={editClassMaxParticipants}
                          onChange={(e) => setEditClassMaxParticipants(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">클래스 대표 이미지</label>
                      <div className="bg-indigo-50/10 border border-[#E8D5C4]/60 rounded-xl p-3 space-y-3">
                        {/* Tab Buttons */}
                        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg text-[10px]">
                          <button
                            type="button"
                            onClick={() => { setEditClassImgMode('preset'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              editClassImgMode === 'preset' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Image size={11} />
                            <span>예시 사진 선택</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditClassImgMode('url'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              editClassImgMode === 'url' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Link size={11} />
                            <span>직접 주소 입력</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditClassImgMode('upload'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              editClassImgMode === 'upload' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Upload size={11} />
                            <span>파일 업로드</span>
                          </button>
                        </div>

                        {/* Content based on selected tab */}
                        {editClassImgMode === 'preset' && (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { name: '아기곰 브라운', url: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600' },
                              { name: '토끼 핑크', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' },
                              { name: '오리 피규어', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600' }
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => setEditClassImage(preset.url)}
                                className={`relative rounded-lg overflow-hidden aspect-video border cursor-pointer transition-all ${
                                  editClassImage === preset.url ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-gray-200'
                                }`}
                              >
                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[9px] text-white font-bold text-center py-0.5 truncate">
                                  {preset.name}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {editClassImgMode === 'url' && (
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-... 또는 이미지 주소 붙여넣기"
                            value={editClassImage}
                            onChange={(e) => setEditClassImage(e.target.value)}
                            className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:border-indigo-500 text-[#4A3E3D] bg-white placeholder-[#4A3E3D]/30"
                          />
                        )}

                        {editClassImgMode === 'upload' && (
                          <div className="space-y-2">
                            <label className="border border-dashed border-[#E8D5C4] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/80 transition-colors">
                              <Upload size={18} className="text-indigo-600" />
                              <span className="text-[10px] font-bold text-[#4A3E3D]">이미지 파일 선택</span>
                              <span className="text-[9px] text-gray-400">(JPG, PNG, WEBP 등 / 최대 10MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditClassImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}

                        {/* Image Preview */}
                        {editClassImage && (
                          <div className="relative rounded-xl overflow-hidden aspect-video border border-[#E8D5C4]/80 bg-gray-50 flex items-center justify-center max-h-36">
                            <img src={editClassImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                              실시간 미리보기
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditClassImage('')}
                              className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">제공 희망 날짜 (쉼표 구분)</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 2026-07-05, 2026-07-12, 2026-07-19"
                        value={editClassDates}
                        onChange={(e) => setEditClassDates(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[#4A3E3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">제공 희망 시간 (쉼표 구분)</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 11:00, 14:00, 16:00"
                        value={editClassTimes}
                        onChange={(e) => setEditClassTimes(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[#4A3E3D]"
                      />
                    </div>

                    {editClassSuccess && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded font-semibold text-center">
                        {editClassSuccess}
                      </div>
                    )}

                    {editClassError && (
                      <div className="p-2 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded font-semibold text-center">
                        {editClassError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingClassId(null)}
                        className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
                      >
                        수정 취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        수정 완료
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAddClassSubmit} className="lg:col-span-5 bg-white border border-[#E8D5C4] rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-[#4A3E3D] uppercase border-b border-[#E8D5C4]/40 pb-2 flex items-center gap-1.5">
                      <Plus size={14} />
                      <span>신규 무료 클래스 등록</span>
                    </h4>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">클래스 주제명</label>
                      <input
                        type="text"
                        required
                        placeholder="🧸 꼬마 토끼 펠트 키링 무료 클래스"
                        value={newClassTitle}
                        onChange={(e) => setNewClassTitle(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">클래스 상세 설명</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="초보자도 1시간 만에 손쉽게 귀여운 꼬마 토끼 키링을 완성해보실 수 있는 감성 공방 체험전입니다."
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">최대 정원 (명)</label>
                        <input
                          type="number"
                          required
                          value={newClassMaxParticipants}
                          onChange={(e) => setNewClassMaxParticipants(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none text-[#4A3E3D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">클래스 대표 이미지</label>
                      <div className="bg-[#FFF8F1]/40 border border-[#E8D5C4]/60 rounded-xl p-3 space-y-3">
                        {/* Tab Buttons */}
                        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg text-[10px]">
                          <button
                            type="button"
                            onClick={() => { setClassImgMode('preset'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              classImgMode === 'preset' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Image size={11} />
                            <span>예시 사진 선택</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setClassImgMode('url'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              classImgMode === 'url' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Link size={11} />
                            <span>직접 주소 입력</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setClassImgMode('upload'); }}
                            className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              classImgMode === 'upload' ? 'bg-[#4A3E3D] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <Upload size={11} />
                            <span>파일 업로드</span>
                          </button>
                        </div>

                        {/* Content based on selected tab */}
                        {classImgMode === 'preset' && (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { name: '아기곰 브라운', url: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600' },
                              { name: '토끼 핑크', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' },
                              { name: '오리 피규어', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600' }
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => setNewClassImage(preset.url)}
                                className={`relative rounded-lg overflow-hidden aspect-video border cursor-pointer transition-all ${
                                  newClassImage === preset.url ? 'border-[#C79A4A] ring-2 ring-[#C79A4A]/20' : 'border-gray-200'
                                }`}
                              >
                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[9px] text-white font-bold text-center py-0.5 truncate">
                                  {preset.name}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {classImgMode === 'url' && (
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-... 또는 이미지 주소 붙여넣기"
                            value={newClassImage}
                            onChange={(e) => setNewClassImage(e.target.value)}
                            className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:border-[#C79A4A] text-[#4A3E3D] bg-white placeholder-[#4A3E3D]/30"
                          />
                        )}

                        {classImgMode === 'upload' && (
                          <div className="space-y-2">
                            <label className="border border-dashed border-[#E8D5C4] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/80 transition-colors">
                              <Upload size={18} className="text-[#C79A4A]" />
                              <span className="text-[10px] font-bold text-[#4A3E3D]">이미지 파일 선택</span>
                              <span className="text-[9px] text-gray-400">(JPG, PNG, WEBP 등 / 최대 10MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleClassImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}

                        {/* Image Preview */}
                        {newClassImage && (
                          <div className="relative rounded-xl overflow-hidden aspect-video border border-[#E8D5C4]/80 bg-gray-50 flex items-center justify-center max-h-36">
                            <img src={newClassImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                              실시간 미리보기
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewClassImage('')}
                              className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">제공 희망 날짜 (쉼표 구분)</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 2026-07-05, 2026-07-12, 2026-07-19"
                        value={newClassDates}
                        onChange={(e) => setNewClassDates(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">제공 희망 시간 (쉼표 구분)</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 11:00, 14:00, 16:00"
                        value={newClassTimes}
                        onChange={(e) => setNewClassTimes(e.target.value)}
                        className="w-full text-xs p-2.5 border border-[#E8D5C4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C79A4A] text-[#4A3E3D]"
                      />
                    </div>

                    {classSuccess && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded font-semibold text-center">
                        {classSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#4A3E3D] text-white font-bold text-xs rounded-xl hover:bg-[#C79A4A] transition-colors cursor-pointer"
                    >
                      무료 클래스 개설 완료 🌸
                    </button>
                  </form>
                )}

                {/* Right: Classes list (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs font-black text-[#4A3E3D] uppercase pb-2 border-b border-[#E8D5C4]/30">
                    현재 개설된 무료 공방 클래스 목록 ({classes.length}건)
                  </h4>

                  {classes.length === 0 ? (
                    <p className="text-xs text-center text-gray-400 py-12">개설된 클래스가 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {classes.map((cls) => (
                        <div key={cls.id} className="bg-white border border-[#E8D5C4]/50 p-4 rounded-2xl flex gap-4 items-center justify-between text-xs">
                          <div className="flex gap-3 items-center min-w-0">
                            <img src={cls.image} alt={cls.title} className="w-12 h-12 object-cover rounded-xl border border-[#E8D5C4]/20 shrink-0" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <h5 className="font-bold text-[#4A3E3D] truncate">{cls.title}</h5>
                              <p className="text-gray-400 text-[10px] truncate mt-0.5">{cls.description}</p>
                              <p className="text-[#C79A4A] text-[10px] font-bold mt-1">
                                날짜: {cls.dates.join(', ')} | 시간: {cls.times.join(', ')} | 정원: {cls.maxParticipants}명
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEditClass(cls)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                editingClassId === cls.id 
                                  ? 'bg-indigo-600 text-white shadow-xs' 
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80'
                              }`}
                              title="수정하기"
                            >
                              <Edit size={11} />
                              <span>수정하기</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id)}
                              className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="제거"
                            >
                              <Trash2 size={11} />
                              <span>제거</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Management Subtab */}
            {activeSubTab === 'bookings' && (
              <div className="space-y-5" id="admin-subtab-bookings">
                <h3 className="text-sm font-extrabold text-[#4A3E3D] pb-1 border-b border-[#E8D5C4]/30">무료 클래스 신청 및 예약자 통제 패널</h3>

                {classBookings.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-12">클래스 예약 신청 내역이 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {classBookings.map((b) => {
                      const isEditingMemo = editingMemoBookingId === b.id;

                      return (
                        <div key={b.id} className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl space-y-4 text-xs">
                          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-[#E8D5C4] text-[#4A3E3D] px-2 py-0.5 rounded font-black uppercase">
                                  {b.itemToMake}
                                </span>
                                <h4 className="font-extrabold text-sm text-[#4A3E3D]">{b.className}</h4>
                              </div>

                              <div className="text-[11px] text-gray-500 space-y-1">
                                <p>👤 <b>신청자:</b> {b.userName} | 📞 <b>연락처:</b> {b.phone} | 📧 <b>이메일:</b> {b.email || '없음'}</p>
                                <p>📅 <b>예약일시:</b> <span className="text-[#C79A4A] font-bold">{b.date} · {b.time}</span> (정원제한 대비 참가 {b.participantsCount}명)</p>
                                {b.request && (
                                  <p className="bg-[#FFF8F1] border border-[#E8D5C4]/40 p-2 rounded-lg italic text-[#4A3E3D]/80">
                                    💬 <b>요청사항:</b> &ldquo;{b.request}&rdquo;
                                  </p>
                                )}
                                {b.memo && (
                                  <p className="bg-amber-50/50 border border-amber-200/60 p-2 rounded-lg text-amber-900 font-medium">
                                    📝 <b>내부 메모:</b> {b.memo}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Controls and badge */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex gap-1">
                                {b.status === 'approved' && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">✓ 승인 완료</span>
                                )}
                                {b.status === 'pending' && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">⌛ 승인 대기</span>
                                )}
                                {b.status === 'cancelled' && (
                                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">✗ 신청 취소</span>
                                )}

                                {b.attended ? (
                                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">● 출석 완료</span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">● 결석 (미참여)</span>
                                )}
                              </div>

                              {/* State Modifiers */}
                              <div className="flex gap-1.5 flex-wrap justify-end">
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'approved')}
                                  className="px-2 py-1 bg-white border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 rounded font-bold text-[10px] cursor-pointer"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'pending')}
                                  className="px-2 py-1 bg-white border border-gray-200 hover:bg-amber-50 hover:text-amber-700 text-gray-600 rounded font-bold text-[10px] cursor-pointer"
                                >
                                  대기
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  className="px-2 py-1 bg-white border border-gray-200 hover:bg-rose-50 hover:text-rose-700 text-gray-600 rounded font-bold text-[10px] cursor-pointer"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleToggleBookingAttendance(b.id, b.attended || false)}
                                  className="px-2 py-1 bg-white border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded font-bold text-[10px] cursor-pointer"
                                >
                                  {b.attended ? '결석 처리' : '출석 체크'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMemoBookingId(b.id);
                                    setTempBookingMemoText(b.memo || '');
                                  }}
                                  className="px-2 py-1 bg-[#4A3E3D] text-white rounded font-bold text-[10px] cursor-pointer"
                                >
                                  메모
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Inline Memo Edit Form */}
                          {isEditingMemo && (
                            <div className="bg-[#FFF8F1] border border-[#E8D5C4] p-3 rounded-xl space-y-2 mt-2">
                              <span className="font-bold text-[10px] text-[#4A3E3D] block">관리자 비공개 메모 수정</span>
                              <input
                                type="text"
                                value={tempBookingMemoText}
                                onChange={(e) => setTempBookingMemoText(e.target.value)}
                                placeholder="예: 알레르기 있음, 노쇼 이력 있음, 승인 확인 완료 등"
                                className="w-full p-2.5 bg-white border border-[#E8D5C4] rounded-lg text-xs"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingMemoBookingId(null)}
                                  className="px-2.5 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 cursor-pointer"
                                  type="button"
                                >
                                  닫기
                                </button>
                                <button
                                  onClick={() => handleSaveBookingMemo(b.id)}
                                  className="px-2.5 py-1 bg-[#4A3E3D] text-white rounded text-[10px] font-bold cursor-pointer"
                                  type="button"
                                >
                                  메모 저장
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Class Reviews Management Subtab */}
            {activeSubTab === 'reviews' && (
              <div className="space-y-5" id="admin-subtab-reviews">
                <h3 className="text-sm font-extrabold text-[#4A3E3D] pb-1 border-b border-[#E8D5C4]/30">클래스 수강 후기 제어 및 수정 패널</h3>

                {editReviewSuccess && (
                  <p className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">{editReviewSuccess}</p>
                )}
                {editReviewError && (
                  <p className="p-3.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">{editReviewError}</p>
                )}

                {classReviews.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-12">등록된 수강 후기가 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classReviews.map((rev) => {
                      const isEditing = editingReviewId === rev.id;

                      return (
                        <div key={rev.id} className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl space-y-4 text-xs flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* Image and Class Metadata */}
                            <div className="flex gap-3 items-start">
                              {rev.imageUrl && (
                                <img
                                  src={rev.imageUrl}
                                  alt="Review item"
                                  className="w-12 h-12 object-cover rounded-xl border border-[#E8D5C4]/30 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="min-w-0">
                                <span className="text-[9px] bg-[#E8D5C4]/30 text-[#C79A4A] border border-[#E8D5C4]/40 px-2 py-0.5 rounded font-bold uppercase block w-fit mb-1">
                                  {rev.className}
                                </span>
                                <p className="font-extrabold text-[#4A3E3D] text-[11px]">작성자: {rev.userName} 님</p>
                                <p className="text-gray-400 text-[10px]">{new Date(rev.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>

                            {/* Editing Form or Regular Content */}
                            {isEditing ? (
                              <form onSubmit={handleEditReviewSubmit} className="space-y-3 pt-2 border-t border-[#E8D5C4]/20">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">만족도 별점</label>
                                  <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        type="button"
                                        key={star}
                                        onClick={() => setEditReviewRating(star)}
                                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                                          editReviewRating >= star ? 'text-amber-400' : 'text-gray-300'
                                        }`}
                                      >
                                        <Star size={16} fill={editReviewRating >= star ? "currentColor" : "none"} />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-gray-400 block mb-1">후기 내용</label>
                                  <textarea
                                    value={editReviewContent}
                                    onChange={(e) => setEditReviewContent(e.target.value)}
                                    rows={3}
                                    className="w-full p-2.5 bg-white border border-[#E8D5C4] rounded-xl text-xs text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A] resize-none"
                                    required
                                  />
                                </div>

                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingReviewId(null)}
                                    className="px-2.5 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600 cursor-pointer"
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1 bg-[#4A3E3D] text-white rounded text-[10px] font-bold cursor-pointer hover:bg-[#C79A4A]"
                                  >
                                    저장 완료
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={11} fill={i < rev.rating ? "currentColor" : "none"} />
                                  ))}
                                </div>
                                <p className="text-gray-600 leading-relaxed font-medium bg-[#FFF8F1]/40 p-2.5 rounded-xl border border-[#E8D5C4]/20">
                                  {rev.content}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Non-editing action buttons */}
                          {!isEditing && (
                            <div className="pt-2 border-t border-[#E8D5C4]/30 flex justify-end gap-1.5 mt-2">
                              <button
                                onClick={() => handleStartEditReview(rev)}
                                className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Edit size={11} />
                                <span>수정하기</span>
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={11} />
                                <span>삭제하기</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeSubTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-[#4A3E3D] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Settings size={16} className="text-[#C79A4A]" />
                    <span>공방 이미지 및 대문 관리</span>
                  </h3>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    공방의 대문 메인 히어로 이미지와 반려동물 1:1 맞춤 제작 홍보 배너의 이미지를 직접 변경할 수 있습니다.
                    추천 프리셋을 선택하거나 웹 URL 입력, 또는 직접 이미지 파일을 컴퓨터에서 업로드할 수 있습니다.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {settingsSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                      {settingsSuccess}
                    </div>
                  )}
                  {settingsError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                      {settingsError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SECTION 1: MAIN HERO IMAGE */}
                    <div className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl space-y-4 shadow-xs">
                      <div>
                        <span className="text-xs font-extrabold text-[#C79A4A] block mb-1">SECTION 1</span>
                        <h4 className="text-sm font-bold text-[#4A3E3D]">메인 홈 대문 이미지 설정</h4>
                        <p className="text-[10px] text-gray-400">메인 최상단에 뜨는 감성적인 대표 히어로 이미지입니다.</p>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1.5">이미지 입력 방식</label>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-[#E8D5C4]/20">
                          {(['preset', 'url', 'upload'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setSettingsImgMode(mode)}
                              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                settingsImgMode === mode
                                  ? 'bg-[#4A3E3D] text-white shadow-xs'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {mode === 'preset' ? '추천 프리셋' : mode === 'url' ? 'URL 입력' : '파일 업로드'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Presets */}
                      {settingsImgMode === 'preset' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              {
                                url: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=600',
                                name: '고양이 인형과 포근함'
                              },
                              {
                                url: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600',
                                name: '오밀조밀 테디베어'
                              },
                              {
                                url: 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=600',
                                name: '핸드메이드 감성 뜨개'
                              },
                              {
                                url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
                                name: '오가닉 아기 토끼'
                              }
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => setAdminHomeImage(preset.url)}
                                className={`p-1.5 border rounded-xl text-left transition-all hover:bg-[#FFF8F1]/40 cursor-pointer ${
                                  adminHomeImage.startsWith(preset.url)
                                    ? 'border-[#C79A4A] bg-[#FFF8F1]'
                                    : 'border-gray-200'
                                }`}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.name}
                                  className="w-full h-14 object-cover rounded-lg mb-1"
                                />
                                <span className="text-[8px] font-bold text-gray-600 block truncate">{preset.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* URL input */}
                      {settingsImgMode === 'url' && (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={adminHomeImage}
                            onChange={(e) => setAdminHomeImage(e.target.value)}
                            placeholder="https://images.unsplash.com/... 주소 입력"
                            className="w-full p-2 bg-gray-50 border border-[#E8D5C4] rounded-xl text-[11px] text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                          />
                        </div>
                      )}

                      {/* Local Upload */}
                      {settingsImgMode === 'upload' && (
                        <div className="space-y-1.5">
                          <div className="border-2 border-dashed border-[#E8D5C4] rounded-2xl p-3 text-center hover:bg-gray-50/50 transition-all cursor-pointer relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHomeImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="space-y-0.5">
                              <Upload className="mx-auto text-[#C79A4A]" size={16} />
                              <p className="text-[9px] font-bold text-gray-500">클릭하여 이미지 업로드</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 block">실시간 미리보기</span>
                        <div className="border border-[#E8D5C4] rounded-xl overflow-hidden aspect-video relative bg-gray-100 flex items-center justify-center">
                          {adminHomeImage ? (
                            <img
                              src={adminHomeImage}
                              alt="홈 대문 미리보기"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">이미지 없음</span>
                          )}
                          <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-2 text-white">
                            <span className="text-[8px] font-bold tracking-wider text-[#E8D5C4]">PINO HANDMADE</span>
                            <span className="text-[10px] font-bold truncate">한 땀, 한 땀 온기를 가득 담은 손바느질</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: CUSTOM PROMO BANNER */}
                    <div className="bg-white border border-[#E8D5C4]/50 p-5 rounded-2xl space-y-4 shadow-xs">
                      <div>
                        <span className="text-xs font-extrabold text-[#C79A4A] block mb-1">SECTION 2</span>
                        <h4 className="text-sm font-bold text-[#4A3E3D]">반려동물 1:1 의뢰 배너 이미지 설정</h4>
                        <p className="text-[10px] text-gray-400">홈 중간 부분의 맞춤 양모 펠트 주문 제작 의뢰를 홍보하는 이미지입니다.</p>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1.5">이미지 입력 방식</label>
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-[#E8D5C4]/20">
                          {(['preset', 'url', 'upload'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setSettingsPromoImgMode(mode)}
                              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                settingsPromoImgMode === mode
                                  ? 'bg-[#4A3E3D] text-white shadow-xs'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {mode === 'preset' ? '추천 프리셋' : mode === 'url' ? 'URL 입력' : '파일 업로드'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Presets */}
                      {settingsPromoImgMode === 'preset' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              {
                                url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600',
                                name: '노란 옷 프렌치 불독 (기본)'
                              },
                              {
                                url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
                                name: '안경 쓴 사랑스러운 냐옹이'
                              },
                              {
                                url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600',
                                name: '포근하게 잠든 웰시코기'
                              },
                              {
                                url: 'https://images.unsplash.com/photo-1591561954555-607968c989ab?w=600',
                                name: '양모 펠트 동물들'
                              }
                            ].map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => setAdminCustomPromoImage(preset.url)}
                                className={`p-1.5 border rounded-xl text-left transition-all hover:bg-[#FFF8F1]/40 cursor-pointer ${
                                  adminCustomPromoImage.startsWith(preset.url)
                                    ? 'border-[#C79A4A] bg-[#FFF8F1]'
                                    : 'border-gray-200'
                                }`}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.name}
                                  className="w-full h-14 object-cover rounded-lg mb-1"
                                />
                                <span className="text-[8px] font-bold text-gray-600 block truncate">{preset.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* URL input */}
                      {settingsPromoImgMode === 'url' && (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={adminCustomPromoImage}
                            onChange={(e) => setAdminCustomPromoImage(e.target.value)}
                            placeholder="https://images.unsplash.com/... 주소 입력"
                            className="w-full p-2 bg-gray-50 border border-[#E8D5C4] rounded-xl text-[11px] text-[#4A3E3D] focus:outline-none focus:border-[#C79A4A]"
                          />
                        </div>
                      )}

                      {/* Local Upload */}
                      {settingsPromoImgMode === 'upload' && (
                        <div className="space-y-1.5">
                          <div className="border-2 border-dashed border-[#E8D5C4] rounded-2xl p-3 text-center hover:bg-gray-50/50 transition-all cursor-pointer relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCustomPromoImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="space-y-0.5">
                              <Upload className="mx-auto text-[#C79A4A]" size={16} />
                              <p className="text-[9px] font-bold text-gray-500">클릭하여 이미지 업로드</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 block">실시간 미리보기</span>
                        <div className="border border-[#E8D5C4] rounded-xl overflow-hidden aspect-video relative bg-gray-100 flex items-center justify-center">
                          {adminCustomPromoImage ? (
                            <img
                              src={adminCustomPromoImage}
                              alt="배너 미리보기"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400">이미지 없음</span>
                          )}
                          <div className="absolute inset-0 bg-black/10 flex flex-col justify-end p-2 text-white">
                            <span className="text-[10px] font-extrabold truncate">양모 인형으로 고스란히 재현합니다</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="py-3 px-8 bg-[#4A3E3D] text-white hover:bg-[#C79A4A] transition-colors rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      {settingsLoading ? '설정 저장 중...' : '공방 대문 & 반려동물 배너 설정 저장하기'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

      </div>

    </div>
  );
}
