import React from 'react';
import { Mail, Phone, MapPin, Award, Shield, Compass } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#4A3E3D] text-[#FFF8F1]/90 pt-16 pb-12 px-6 md:px-12 border-t border-[#E8D5C4]/30 mt-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Core Sections */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#FFF8F1]/10">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-widest text-[#FFF8F1] block">
              PINO<span className="text-[#C79A4A]">공방</span>
            </span>
            <p className="text-xs text-[#FFF8F1]/75 leading-relaxed">
              따뜻한 손길로 빚어내는 세상 단 하나뿐인 펠트 인형과 소품 브랜드입니다. 천연 양모의 부드러움과 작가들의 정성 어린 스티치로 일상 속에 작은 감성 한 스푼을 전합니다.
            </p>
            <div className="flex gap-3 text-xs pt-1">
              <span className="flex items-center gap-1 bg-[#FFF8F1]/10 px-2.5 py-1 rounded-full text-[#C79A4A]">
                <Award size={12} />
                <span>100% 수작업</span>
              </span>
              <span className="flex items-center gap-1 bg-[#FFF8F1]/10 px-2.5 py-1 rounded-full text-[#BFD8C0]">
                <Shield size={12} />
                <span>안심인증 완료</span>
              </span>
            </div>
          </div>

          {/* Col 2: Customer Service */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-semibold text-[#C79A4A] tracking-wider uppercase">고객 행복 센터</h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-[#BFD8C0]" />
                <span className="font-bold text-sm">02-1234-1234</span>
              </p>
              <p className="text-[#FFF8F1]/70 leading-relaxed pl-6">
                상담시간: AM 09:00 ~ PM 06:00<br />
                점심시간: PM 12:00 ~ PM 02:00<br />
                (주말 및 공휴일 휴무 / Q&A 상시 대기)
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-[#BFD8C0]" />
                <span className="text-xs">support@pino-studio.com</span>
              </p>
            </div>
          </div>

          {/* Col 3: Bank Transfer Account Info */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-semibold text-[#C79A4A] tracking-wider">무통장 입금 안내</h4>
            <div className="space-y-2 text-xs leading-relaxed text-[#FFF8F1]/80">
              <p className="bg-[#FFF8F1]/10 p-3 rounded-xl border border-[#FFF8F1]/5">
                <span className="text-[10px] uppercase font-bold text-[#BFD8C0] block mb-0.5">국민은행 입금계좌</span>
                <span className="font-bold text-sm text-white">0000-000-000000</span>
                <span className="block mt-0.5 text-[#FFF8F1]/70">예금주: (주)PINO공방</span>
              </p>
              <p className="text-[11px] text-[#FFF8F1]/60">
                ※ 주문 시 기재하신 <b>입금자명</b>과 실제 입금자명이 정확히 일치해야 자동 입금 확인 처리가 완료됩니다.
              </p>
            </div>
          </div>

          {/* Col 4: Physical Workshop Location */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-semibold text-[#C79A4A] tracking-wider">제주 오프라인 공방</h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-start gap-2 leading-relaxed">
                <MapPin size={15} className="text-[#BFD8C0] shrink-0 mt-0.5" />
                <span>제주특별자치도 서귀포시 감귤읍 감귤동산로 7456, 1층 PINO공방 쇼룸</span>
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-[#BFD8C0] pl-6">
                <Compass size={13} />
                <span>방문 예약 및 클래스 문의 필수</span>
              </p>
            </div>
          </div>
        </div>

        {/* Corporate Legal Declarations */}
        <div className="pt-8 text-xs text-[#FFF8F1]/50 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="space-y-1.5 leading-relaxed">
            <p className="font-medium text-[#FFF8F1]/70">상호명: (주)PINO공방 | 대표이사: 홍길동 | 개인정보관리책임자: 홍길동</p>
            <p>사업자등록번호: 000-88-00002 | 통신판매업신고번호: 제 2026-제주불편-1355 호 [사업자정보확인]</p>
            <p>주소: 제주특별자치도 서귀포시 감귤읍 감귤동산로 7456 | 대표 이메일: template@imweb.me | 호스팅 제공자: (주)아임웹</p>
            <p className="text-[10px] text-[#FFF8F1]/40 mt-1">© 2026 PINO공방. All rights reserved. Crafted in premium felt & wool studio.</p>
          </div>
          
          {/* Quick Legal Links */}
          <div className="flex gap-4 text-xs font-semibold whitespace-nowrap">
            <a href="#terms" className="hover:text-white transition-colors">이용약관</a>
            <span className="text-[#FFF8F1]/20">|</span>
            <a href="#privacy" className="hover:text-white text-[#C79A4A] transition-colors">개인정보처리방침</a>
            <span className="text-[#FFF8F1]/20">|</span>
            <a href="#guide" className="hover:text-white transition-colors">이용가이드</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
