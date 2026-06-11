'use client'

import React, { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

export interface CourseRawData {
  id: number
  course_name: string
  completion_type: string
  credits: number
  professor: string
  enrolled: number
  capacity: number
  teaching_method: string
  timetable_period: string
  college: string
  department: string
  is_foreign_language: boolean
}

interface CourseDetailTableProps {
  courses: CourseRawData[]
  loading?: boolean
}

export default function CourseDetailTable({
  courses,
  loading = false,
}: CourseDetailTableProps) {
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'course_name' | 'professor'>('all')
  const [selectedCompletion, setSelectedCompletion] = useState('전체')
  const [selectedCollege, setSelectedCollege] = useState('전체')
  const [selectedCredit, setSelectedCredit] = useState('전체')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 필터 목록 추출용
  const filterOptions = useMemo(() => {
    const completions = new Set<string>()
    const colleges = new Set<string>()
    const credits = new Set<number>()

    courses.forEach((c) => {
      if (c.completion_type) completions.add(c.completion_type)
      if (c.college) colleges.add(c.college)
      if (c.credits !== undefined) credits.add(c.credits)
    })

    return {
      completions: ['전체', ...Array.from(completions).sort()],
      colleges: ['전체', ...Array.from(colleges).sort()],
      credits: ['전체', ...Array.from(credits).sort((a, b) => a - b).map(String)],
    }
  }, [courses])

  // 필터링 및 검색된 데이터 계산
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // 1. 검색어 필터
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase()
        const matchName = c.course_name?.toLowerCase().includes(query)
        const matchProf = c.professor?.toLowerCase().includes(query)

        if (searchType === 'course_name' && !matchName) return false
        if (searchType === 'professor' && !matchProf) return false
        if (searchType === 'all' && !matchName && !matchProf) return false
      }

      // 2. 이수구분 필터
      if (selectedCompletion !== '전체' && c.completion_type !== selectedCompletion) {
        return false
      }

      // 3. 대학 필터
      if (selectedCollege !== '전체' && c.college !== selectedCollege) {
        return false
      }

      // 4. 학점 필터
      if (selectedCredit !== '전체' && String(c.credits) !== selectedCredit) {
        return false
      }

      return true
    })
  }, [courses, searchTerm, searchType, selectedCompletion, selectedCollege, selectedCredit])

  // 페이지네이션 처리
  const totalItems = filteredCourses.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // 필터 변경 시 첫 페이지로 리셋
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val)
    setCurrentPage(1)
  }

  const paginatedCourses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredCourses.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredCourses, currentPage])

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm w-full mt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-6">상세 교과목 정보</h3>

      {/* 검색 및 필터 컨트롤 바 */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        {/* 검색 필드 */}
        <div className="flex w-full md:w-auto items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <select
            value={searchType}
            onChange={(e: any) => setSearchType(e.target.value)}
            className="bg-transparent text-slate-600 text-sm focus:outline-none border-r border-slate-200 pr-2 cursor-pointer"
          >
            <option value="all">전체 검색</option>
            <option value="course_name">강좌명</option>
            <option value="professor">교수명</option>
          </select>
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="검색어를 입력하세요..."
            value={searchTerm}
            onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            className="bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none w-full md:w-64"
          />
        </div>

        {/* 필터 그룹 */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* 이수구분 필터 */}
          <div className="flex flex-col gap-1">
            <select
              value={selectedCompletion}
              onChange={(e) => handleFilterChange(setSelectedCompletion, e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="전체">이수구분 (전체)</option>
              {filterOptions.completions.filter(opt => opt !== '전체').map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 대학 필터 */}
          <div className="flex flex-col gap-1">
            <select
              value={selectedCollege}
              onChange={(e) => handleFilterChange(setSelectedCollege, e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="전체">대학 (전체)</option>
              {filterOptions.colleges.filter(opt => opt !== '전체').map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 학점 필터 */}
          <div className="flex flex-col gap-1">
            <select
              value={selectedCredit}
              onChange={(e) => handleFilterChange(setSelectedCredit, e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="전체">학점 (전체)</option>
              {filterOptions.credits.filter(opt => opt !== '전체').map((opt) => (
                <option key={opt} value={opt}>{opt}학점</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
              <th className="py-3.5 px-4 rounded-l-lg">강좌명</th>
              <th className="py-3.5 px-4">이수구분</th>
              <th className="py-3.5 px-4">학점</th>
              <th className="py-3.5 px-4">담당교수</th>
              <th className="py-3.5 px-4">수업시간</th>
              <th className="py-3.5 px-4">수강인원</th>
              <th className="py-3.5 px-4 rounded-r-lg">수강률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b border-slate-100 last:border-0">
                  <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-3/4" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-14" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-10" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                </tr>
              ))
            ) : paginatedCourses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  조건에 해당하는 강좌 정보가 존재하지 않습니다.
                </td>
              </tr>
            ) : (
              paginatedCourses.map((c, index) => {
                const enrollmentRate = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors"
                    style={{
                      animation: 'fadeInRow 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-[200px] truncate" title={c.course_name}>
                      {c.course_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      <span className="bg-slate-100 border border-slate-200 rounded px-2.5 py-0.5 text-slate-600">
                        {c.completion_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-400">{c.credits}학점</td>
                    <td className="py-3.5 px-4 text-slate-700">{c.professor || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[150px] truncate" title={c.timetable_period}>
                      {c.timetable_period || '미지정'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {c.enrolled} / {c.capacity}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {enrollmentRate.toFixed(1)}%
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 페이지네이션 UI */}
      {!loading && totalItems > 0 && (
        <div className="flex items-center justify-between mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>
            총 <strong className="text-slate-800 font-bold">{totalItems.toLocaleString()}</strong>개 중{' '}
            {((currentPage - 1) * itemsPerPage + 1).toLocaleString()} -{' '}
            {Math.min(currentPage * itemsPerPage, totalItems).toLocaleString()}번째 표시
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-mono text-slate-800 font-bold">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
