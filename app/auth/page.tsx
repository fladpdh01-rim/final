'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'

export default function AuthPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 이미 로그인되어 있고 팝업이 아닌 일반 페이지인 경우 메인 페이지로 이동
    if (!loading && user) {
      const isPopup = window.opener !== null
      if (!isPopup) {
        router.push('/')
      }
    }
  }, [user, loading, router])

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Failed to initiate Google sign in:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-blue-600 animate-spin" />
      </div>
    )
  }

  // 팝업인 경우, 로그인 상태이면 팝업을 즉시 닫고 부모 창에 메시지 전송
  if (user && window.opener !== null) {
    return (
      <div className="flex min-h-screen bg-slate-50 flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-blue-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-semibold">로그인 성공! 창을 닫는 중입니다...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
        {/* 장식용 파란색/노란색 그라데이션 라인 */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-yellow-400" />

        <div className="flex flex-col items-center text-center">
          {/* 로고 */}
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100/60 mb-6 shadow-sm">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>

          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
            INCHEON NATIONAL UNIVERSITY
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight mb-2">
            교과목 현황 대시보드
          </h1>
          <p className="text-sm text-slate-500 font-medium mb-8 max-w-[300px]">
            대시보드 시스템에 접근하려면 구글 계정으로 로그인해주세요.
          </p>

          {/* 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 font-extrabold text-sm shadow-sm hover:shadow transition-all duration-200 group active:scale-[0.98]"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.74 14.96 1 12 1 7.35 1 3.4 3.65 1.44 7.53l3.85 2.99C6.2 7.22 8.87 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"
              />
              <path
                fill="#FBBC05"
                d="M5.29 14.51c-.25-.75-.39-1.56-.39-2.4s.14-1.65.39-2.4L1.44 6.72C.52 8.56 0 10.62 0 12.8s.52 4.24 1.44 6.08l3.85-3.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.1.74-2.5 1.18-4.23 1.18-3.13 0-5.8-2.18-6.71-5.48l-3.85 2.99C3.4 20.35 7.35 23 12 23z"
              />
            </svg>
            <span>Google 계정으로 로그인</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 하단 저작권 표시 */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>제작자: 오예림</span>
          <span>© 2026 Incheon Nat'l Univ.</span>
        </div>
      </div>
    </div>
  )
}
