import React, { useState, useEffect } from 'react';
import { 
  fetchProducts, 
  fetchAllOrders, 
  fetchAllCustomOrders, 
  updateOrderStatus, 
  updateCustomOrderStatus, 
  addProduct, 
  removeProduct,
  addNotice,
  fetchEventLogs,
  fetchClasses,
  addClass,
  removeClass,
  fetchClassBookings,
  updateClassBookingStatus,
  updateClassBookingAttendance,
  updateClassBookingMemo,
  db 
} from '../lib/firebase';
import { Product, Order, CustomOrder, Notice, EventLog, Class, ClassBooking } from '../types';
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
  Upload
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'products' | 'orders' | 'custom' | 'notices' | 'logs' | 'classes' | 'bookings'>('stats');

  // Class & Booking lists
  const [classes, setClasses] = useState<Class[]>([]);
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([]);

  // Class register states
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassImage, setNewClassImage] = useState('https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600');
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
  const [newProdImg, setNewProdImg] = useState('https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600');
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdSuccess, setNewProdSuccess] = useState('');

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

  const reloadAllData = async () => {
    try {
      setLoading(true);
      const [p, o, c, l, cls, bks] = await Promise.all([
        fetchProducts(),
        fetchAllOrders(),
        fetchAllCustomOrders(),
        fetchEventLogs(),
        fetchClasses(),
        fetchClassBookings()
      ]);
      setProducts(p);
      setOrders(o);
      setCustomOrders(c);
      setEventLogs(l);
      setClasses(cls);
      setClassBookings(bks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      setNewProdImg('https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600');
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

  // Delete Product
  const handleDeleteProduct = async (pId: string) => {
    if (!window.confirm('정말 이 상품을 데이터베이스에서 영구 삭제하시겠습니까?')) return;
    try {
      await removeProduct(pId);
      reloadAllData();
    } catch (err) {
      console.error(err);
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
          룰렛/출석 로그
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
                {/* Add product form (5 cols) */}
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
                            { name: '아기곰 브라운', url: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600' },
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
                        <th className="py-2 text-right">제거</th>
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
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
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
            {activeSubTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-[#4A3E3D] pb-1 border-b border-[#E8D5C4]/30">스토어 출석체크 & 룰렛 보상 히스토리 로그</h3>
                
                {eventLogs.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-10">이벤트 참여 이력이 없습니다.</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {eventLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-gray-400 text-[10px] block">{new Date(log.createdAt).toLocaleString()}</span>
                          <span className="font-bold text-[#4A3E3D]">{log.userEmail}</span>
                          <span className="ml-2 bg-[#E8D5C4]/30 text-[#4A3E3D] px-1.5 py-0.5 rounded text-[10px]">
                            {log.eventType === 'roulette' ? '룰렛' : log.eventType === 'attendance' ? '출석' : '가입'}
                          </span>
                        </div>
                        <span className="font-extrabold text-[#C79A4A]">{log.reward}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Class Registration Subtab */}
            {activeSubTab === 'classes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="admin-subtab-classes">
                {/* Left: Add Class form (5 cols) */}
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
                            { name: '아기곰 브라운', url: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600' },
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

                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
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
          </>
        )}

      </div>

    </div>
  );
}
