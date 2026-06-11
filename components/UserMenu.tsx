'use client'

import React, { useEffect, useState, useRef } from 'react'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'

export default function UserMenu() {
  const { user, loading, signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'supabase-auth-success') {
        // AuthContext의 onAuthStateChange가 자동으로 상태를 업데이트합니다.
        console.log('Login successful in popup window, state will auto-refresh.')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const openLoginPopup = () => {
    const width = 500
    const height = 650
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    
    window.open(
      '/auth',
      'Supabase Google Login',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=no,resizable=no`
    )
  }

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsDropdownOpen(false)
    }, 5000)
  }

  const handleSignOut = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsDropdownOpen(false)
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center animate-pulse">
        <div className="w-4 h-4 rounded-full border border-t-transparent border-slate-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <button
        onClick={openLoginPopup}
        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow hover:bg-slate-50 transition-all select-none cursor-pointer"
      >
        로그인
      </button>
    )
  }

  const avatarUrl = user.user_metadata?.avatar_url
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const email = user.email || ''

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center cursor-pointer select-none py-1"
    >
      {/* 사용자 프로필 사진 또는 이니셜 */}
      <div className="w-8 h-8 rounded-full border border-slate-200/80 bg-blue-50/50 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-200 shadow-sm">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon className="w-4 h-4 text-blue-600" />
        )}
      </div>

      {/* 마우스 호버 시 표시되는 프로필 팝오버 (5초 딜레이) */}
      <div
        className={`absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-3 px-4 transition-all duration-300 origin-top-right z-50 ${
          isDropdownOpen
            ? 'opacity-100 visible scale-100 pointer-events-auto'
            : 'opacity-0 invisible scale-95 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-0.5 mb-2.5">
          <span className="text-xs font-bold text-slate-800 truncate" title={fullName}>
            {fullName}
          </span>
          <span className="text-[10px] text-slate-400 font-medium truncate" title={email}>
            {email}
          </span>
        </div>
        <div className="h-px bg-slate-100 mb-2.5" />
        
        {/* Sign out 버튼 */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50/40 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
