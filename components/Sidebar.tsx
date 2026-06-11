'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap,
  Layers,
  BookMarked,
  Building2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { departmentToSlug } from '@/lib/utils/departmentSlug'

interface SidebarProps {
  courses: { college: string; department: string }[]
  selectedCollege: string
  selectedDept: string
  onSelect: (college: string, department: string) => void
}

const COLLEGE_ORDER = [
  '기초교육원',
  '인문대학',
  '자연과학대학',
  '사회과학대학',
  '글로벌정경대학',
  '공과대학',
  '정보기술대학',
  '경영대학',
  '예술체육대학',
  '사범대학',
  '도시과학대학',
  '생명과학기술대학',
  '동북아국제통상물류학부',
  '법학부',
]

// 대학별 아이콘 색상
const COLLEGE_ACCENT: Record<string, string> = {
  기초교육원: '#3ECF8E',
  인문대학: '#F4A261',
  자연과학대학: '#5B8DEF',
  사회과학대학: '#A8DADC',
  글로벌정경대학: '#C77DFF',
  공과대학: '#FFD166',
  정보기술대학: '#06D6A0',
  경영대학: '#EF476F',
  예술체육대학: '#FF9E7A',
  사범대학: '#80B9F5',
  도시과학대학: '#74C69D',
  생명과학기술대학: '#52B788',
  동북아국제통상물류학부: '#F77F00',
  법학부: '#B9A7FF',
}

export default function Sidebar({
  courses,
  selectedCollege,
  selectedDept,
  onSelect,
}: SidebarProps) {
  const pathname = usePathname()
  const isLiberalArts = pathname === '/dashboard/liberal-arts'
  const isDepartmentPage = pathname?.startsWith('/dashboard/departments/')

  // ── 대학별 학과 목록 그룹화 ────────────────────────────────────────────
  const hierarchy = useMemo(() => {
    const map = new Map<string, Set<string>>()

    courses.forEach((c) => {
      if (!c.college || c.college === '교양') return
      if (!map.has(c.college)) map.set(c.college, new Set())
      if (c.department) map.get(c.college)!.add(c.department)
    })

    const orderedList: { college: string; departments: string[] }[] = []

    COLLEGE_ORDER.forEach((college) => {
      if (map.has(college)) {
        let depts = Array.from(map.get(college)!).sort((a, b) =>
          a.localeCompare(b, 'ko')
        )
        if (college === '인문대학' && depts.includes('영어영문학과')) {
          const rest = depts.filter((d) => d !== '영어영문학과')
          depts = [rest[0], '영어영문학과', ...rest.slice(1)]
        } else if (college === '자연과학대학') {
          const customOrder = ['수학과', '물리학과', '화학과', '패션산업학과', '해양학과']
          depts.sort((a, b) => {
            const idxA = customOrder.indexOf(a)
            const idxB = customOrder.indexOf(b)
            if (idxA !== -1 && idxB !== -1) return idxA - idxB
            if (idxA !== -1) return -1
            if (idxB !== -1) return 1
            return a.localeCompare(b, 'ko')
          })
        } else if (college === '사회과학대학') {
          const customOrder = ['사회복지학과', '미디어커뮤니케이션학과', '문헌정보학과', '창의인재개발학과']
          depts.sort((a, b) => {
            const idxA = customOrder.indexOf(a)
            const idxB = customOrder.indexOf(b)
            if (idxA !== -1 && idxB !== -1) return idxA - idxB
            if (idxA !== -1) return -1
            if (idxB !== -1) return 1
            return a.localeCompare(b, 'ko')
          })
        }
        orderedList.push({
          college,
          departments: depts,
        })
      }
    })

    map.forEach((depts, college) => {
      if (!COLLEGE_ORDER.includes(college)) {
        orderedList.push({
          college,
          departments: Array.from(depts).sort((a, b) => a.localeCompare(b, 'ko')),
        })
      }
    })

    return orderedList
  }, [courses])

  // ── 아코디언 확장 상태 ────────────────────────────────────────────────
  // 모든 대학을 펼친 상태로 관리하기 위해 hierarchy를 기반으로 초기 설정합니다.
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (hierarchy.length > 0) {
      setExpandedColleges(new Set(hierarchy.map((h) => h.college)))
    }
  }, [hierarchy])

  const toggleCollege = (college: string) => {
    setExpandedColleges((prev) => {
      const next = new Set(prev)
      if (next.has(college)) next.delete(college)
      else next.add(college)
      return next
    })
  }

  // ── 색상 테마 결정 ───────────────────────────────────────────────────
  // ── 애니메이션 설정 ──────────────────────────────────────────────────
  const [animationsEnabled, setAnimationsEnabled] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('dashboard-animations-enabled')
    const enabled = stored === null ? true : stored === 'true'
    setAnimationsEnabled(enabled)
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('no-animations', !enabled)
    }
  }, [])

  const toggleAnimations = () => {
    const nextVal = !animationsEnabled
    setAnimationsEnabled(nextVal)
    localStorage.setItem('dashboard-animations-enabled', String(nextVal))
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('no-animations', !nextVal)
      window.dispatchEvent(new Event('animations-toggle'))
    }
  }

  const activeNavColor = isLiberalArts
    ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200/50'
    : isDepartmentPage
    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/50'
    : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/50'

  const ZapIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )

  const ZapOffIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.41 12.41 11 22l10-12h-9l1-8-3.08 3.7"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  )

  return (
    <aside className="w-[268px] min-w-[268px] h-screen bg-slate-50 border-r border-slate-200 flex flex-col select-none overflow-y-auto scrollbar-thin">
      {/* ── 로고 영역 ── */}
      <div className="px-5 py-5 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
          <GraduationCap className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 tracking-tight leading-tight">인천대학교</span>
          <span className="text-[11px] text-slate-500 leading-tight font-medium">교과목 현황 대시보드</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
            2026-1
          </span>
        </div>
      </div>

      {/* ── 대시보드 전환 네비게이션 ── */}
      <div className="px-3 pt-4 pb-3 border-b border-slate-200 space-y-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] px-2 block mb-2">
          대시보드
        </span>

        {/* 전체 교과목 */}
        <Link
          href="/"
          className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
            !isLiberalArts && !isDepartmentPage
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>전체 교과목</span>
          {!isLiberalArts && !isDepartmentPage && (
            <span className="ml-auto text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">
              ACTIVE
            </span>
          )}
        </Link>

        {/* 교양 대시보드 */}
        <Link
          href="/dashboard/liberal-arts"
          className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
            isLiberalArts
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span>교양 대시보드</span>
            <span className={`text-[10px] font-medium mt-0.5 transition-colors ${isLiberalArts ? 'text-blue-100' : 'text-slate-500'}`}>
              기초교육원
            </span>
          </div>
          {isLiberalArts && (
            <span className="ml-auto text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">
              ACTIVE
            </span>
          )}
        </Link>

        {/* 학과별 대시보드 — 학과 페이지일 때만 표시 */}
        {isDepartmentPage && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold bg-blue-600 text-white shadow-sm shadow-blue-500/10">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">학과 대시보드</span>
            <span className="ml-auto text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded-full shrink-0">
              ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* ── 대학/학과 아코디언 트리 ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* 전체 보기 */}
        <button
          onClick={() => onSelect('', '')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 mb-3 ${
            !selectedCollege && !selectedDept
              ? activeNavColor
              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isLiberalArts
              ? '전체 교양 보기'
              : isDepartmentPage
              ? '전체 학과 목록'
              : '전체 교과목 보기'}
          </span>
        </button>

        {/* 섹션 레이블 */}
        <div className="flex items-center gap-2 px-2 pb-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
            {isLiberalArts ? '교양 과목 보유 대학' : '대학 · 학과 목록'}
          </span>
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[9px] text-slate-400">{hierarchy.length}개 대학</span>
        </div>

        {/* 아코디언 대학 목록 */}
        <div className="space-y-0.5">
          {hierarchy.map(({ college, departments }) => {
            const isExpanded = expandedColleges.has(college)
            const isCollegeActive = selectedCollege === college
            const accent = COLLEGE_ACCENT[college] ?? '#2563EB'

            // 현재 pathname에서 활성 학과 확인
            const currentSlug = isDepartmentPage
              ? pathname?.split('/').pop() ?? ''
              : ''
            const hasActiveDept = departments.some(
              (dept) => departmentToSlug(dept) === currentSlug
            )

            return (
              <div key={college}>
                {/* ── 대학 헤더 (아코디언 토글) ── */}
                <button
                  onClick={() => {
                    toggleCollege(college)
                    if (!isDepartmentPage) onSelect(college, '')
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 group ${
                    isCollegeActive && !selectedDept
                      ? 'text-slate-900 bg-slate-200'
                      : hasActiveDept
                      ? 'text-slate-900 bg-slate-150'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                  }`}
                >
                  {/* 컬러 도트 */}
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200"
                    style={{
                      background:
                        isCollegeActive || hasActiveDept ? accent : '#CBD5E1',
                      boxShadow:
                        isCollegeActive || hasActiveDept
                          ? `0 0 6px ${accent}80`
                          : 'none',
                    }}
                  />

                  <span className="flex-1 text-left truncate">{college}</span>

                  {/* 학과 수 배지 */}
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded transition-all duration-200"
                    style={{
                      background:
                        isCollegeActive || hasActiveDept
                          ? `${accent}15`
                          : '#E2E8F0',
                      color:
                        isCollegeActive || hasActiveDept ? accent : '#64748B',
                    }}
                  >
                    {departments.length}
                  </span>

                  {/* chevron */}
                  <span className="shrink-0 transition-transform duration-300 text-slate-400 group-hover:text-slate-600">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>

                {/* ── 학과 목록 (아코디언 바디) ── */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isExpanded ? `${departments.length * 32 + 8}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 mt-0.5 mb-1">
                    {departments.map((dept) => {
                      const deptSlug = departmentToSlug(dept)
                      const deptHref = `/dashboard/departments/${deptSlug}`

                      // 현재 활성 여부
                      const isDeptActive = isDepartmentPage
                        ? pathname === deptHref
                        : selectedCollege === college && selectedDept === dept

                      const sharedCls = `w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11.5px] transition-all duration-200 truncate`

                      const activeCls = isDeptActive
                        ? 'font-bold text-slate-900 bg-slate-100'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/30 font-medium'

                      const activeStyle = isDeptActive
                        ? { background: `${accent}0D`, color: accent }
                        : {}

                      if (isDepartmentPage) {
                        return (
                          <Link
                            key={dept}
                            href={deptHref}
                            className={`${sharedCls} ${activeCls}`}
                            style={activeStyle}
                            title={dept}
                          >
                            {/* 활성 인디케이터 */}
                            <span
                              className="w-1 h-1 rounded-full shrink-0"
                              style={{
                                background: isDeptActive ? accent : 'transparent',
                              }}
                            />
                            <span className="truncate">{dept}</span>
                            {isDeptActive && (
                              <ChevronRight
                                className="w-2.5 h-2.5 ml-auto shrink-0"
                                style={{ color: accent }}
                              />
                            )}
                          </Link>
                        )
                      }

                      return (
                        <button
                          key={dept}
                          onClick={() => onSelect(college, dept)}
                          className={`${sharedCls} ${activeCls}`}
                          style={activeStyle}
                          title={dept}
                        >
                          <span
                            className="w-1 h-1 rounded-full shrink-0"
                            style={{
                              background: isDeptActive ? accent : 'transparent',
                            }}
                          />
                          <span className="truncate">{dept}</span>
                          {isDeptActive && (
                            <ChevronRight
                              className="w-2.5 h-2.5 ml-auto shrink-0"
                              style={{ color: accent }}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── 푸터 ── */}
      <div className="px-5 py-4 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
          인천대학교 2026학년도 1학기<br />
          교과목 편성 현황 데이터
        </p>
      </div>
    </aside>
  )
}
