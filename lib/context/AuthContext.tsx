'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // 로그인 시 사용자를 public.users 테이블에 저장하는 클라이언트 동기화 함수
  const syncUserToDatabase = async (currUser: User) => {
    try {
      // 1. 이미 존재하는지 확인
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', currUser.id)
        .maybeSingle()

      if (selectError) {
        console.warn('Failed to select user from database during sync, skipping insertion:', selectError.message)
        return
      }

      // 2. 존재하지 않으면 삽입
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: currUser.id,
            email: currUser.email,
            raw_user_meta_data: currUser.user_metadata,
          })
        
        if (insertError) {
          console.error('Error inserting user to database:', insertError.message)
        } else {
          console.log('Successfully synced user to public.users table.')
        }
      }
    } catch (err) {
      console.error('Exception during user sync:', err)
    }
  }

  useEffect(() => {
    // 1. 초기 세션 조회
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        const currUser = initialSession?.user ?? null
        setUser(currUser)
        if (currUser) {
          await syncUserToDatabase(currUser)
        }
      } catch (err) {
        console.error('Error getting initial session:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 2. Auth 상태 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession)
      const currUser = currentSession?.user ?? null
      setUser(currUser)
      
      if (event === 'SIGNED_IN' && currUser) {
        await syncUserToDatabase(currUser)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 콜백 엔드포인트를 지정
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Google sign in error:', err)
      throw err
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
    } catch (err) {
      console.error('Sign out error:', err)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
