'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, GraduationCap, Building2, Check, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'
import { getAllDepartments, departmentToSlug } from '@/lib/utils/departmentSlug'

export default function LoginRedirectModal() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'notice' | 'select'>('notice')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. 로그인 상태 감지 및 모달 표시 여부 결정
  useEffect(() => {
    if (user) {
      const shown = localStorage.getItem('login-redirect-shown')
      if (!shown) {
        setIsOpen(true)
        setStep('notice')
      }
    } else {
      setIsOpen(false)
    }
  }, [user])

  // 2. 전체 학과 목록 로드
  const departments = useMemo(() => {
    return getAllDepartments().filter(d => d.college !== '교양')
  }, [])

  // 3. 학과 검색 필터링
  const filteredDepartments = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    if (!query) return departments
    return departments.filter(
      d => d.college.toLowerCase().includes(query) || d.department.toLowerCase().includes(query)
    )
  }, [departments, searchTerm])

  const handleNoticeConfirm = () => {
    setStep('select')
  }

  const handleSelectDepartment = (departmentName: string) => {
    const slug = departmentToSlug(departmentName)
    localStorage.setItem('login-redirect-shown', 'true')
    setIsOpen(false)
    router.push(`/dashboard/departments/${slug}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      {step === 'notice' ? (
        /* 1단계: "학과를 선택하세요." 알림 팝업 */
        <div className="w-full max-w-[380px] bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-scale-up">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-blue-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-1">로그인 완료</h3>
          <p className="text-sm text-slate-500 font-semibold mb-6">
            학과를 선택하세요.
          </p>
          
          <button
            onClick={handleNoticeConfirm}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>확인</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* 2단계: 학과 목록 표 팝업 */
        <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xl flex flex-col animate-scale-up max-h-[90vh]">
          {/* 헤더 */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">학과 선택</h3>
              <p className="text-xs text-slate-400 font-medium">대시보드로 이동할 학과를 선택해주세요.</p>
            </div>
          </div>

          {/* 검색 바 */}
          <div className="my-4 flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="대학명 또는 학과명을 입력하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
            />
          </div>

          {/* 학과 리스트 표 */}
          <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl max-h-[300px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-150 sticky top-0 backdrop-blur-sm">
                  <th className="py-2.5 px-4 font-bold text-slate-500 w-[40%]">대학</th>
                  <th className="py-2.5 px-4 font-bold text-slate-500 w-[45%]">학과</th>
                  <th className="py-2.5 px-4 text-center font-bold text-slate-500 w-[15%]">선택</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((d, index) => (
                    <tr
                      key={`${d.college}-${d.department}`}
                      onClick={() => handleSelectDepartment(d.department)}
                      className="border-b border-slate-100 last:border-0 hover:bg-blue-50/25 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-4 text-slate-600 font-semibold">{d.college}</td>
                      <td className="py-2.5 px-4 text-slate-800 font-extrabold">{d.department}</td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectDepartment(d.department)
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/60 rounded-md transition-colors cursor-pointer"
                        >
                          이동
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                      검색 조건에 맞는 학과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
