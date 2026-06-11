'use client'

import React, { useState, useMemo } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Users, BookOpen, BarChart3 } from 'lucide-react'

import Sidebar from '@/components/Sidebar'
import KPICards from '@/components/KPICards'
import CompletionTypeCharts from '@/components/CompletionTypeCharts'
import DistributionCharts from '@/components/DistributionCharts'
import TimeAnalysisCharts from '@/components/TimeAnalysisCharts'
import CourseDetailTable from '@/components/CourseDetailTable'
import DepartmentInsights from '@/components/department/DepartmentInsights'
import UserMenu from '@/components/UserMenu'
import ErrorBoundary, { ErrorType } from '@/components/ErrorBoundary'
import { useCourseData } from '@/lib/hooks/useCourseData'
import { slugToDepartment } from '@/lib/utils/departmentSlug'

// ── 학과 대시보드 페이지 (Client Component) ────────────────────────────────
// Next.js 16: Client Component에서는 use(params)로 slug 접근
export default function DepartmentDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const department = slugToDepartment(slug)

  const { courses, loading } = useCourseData()
  const [selectedCollege, setSelectedCollege] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [simulatedError, setSimulatedError] = useState<ErrorType | undefined>(undefined)

  // ── 1. 해당 학과 강좌만 필터링 ────────────────────────────────────────
  const deptCourses = useMemo(
    () => courses.filter((c) => c.department === department),
    [courses, department]
  )

  // 소속 대학 추출 (첫 번째 강좌에서)
  const collegeName = useMemo(
    () => deptCourses[0]?.college ?? '',
    [deptCourses]
  )

  // 같은 대학 강좌 (비교용)
  const collegeCourses = useMemo(
    () => (collegeName ? courses.filter((c) => c.college === collegeName) : []),
    [courses, collegeName]
  )

  // ── 2. 사이드바 2차 필터 ───────────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return deptCourses.filter((c) => {
      if (selectedCollege && c.college !== selectedCollege) return false
      if (selectedDept && c.department !== selectedDept) return false
      return true
    })
  }, [deptCourses, selectedCollege, selectedDept])

  const handleSelect = (college: string, dept: string) => {
    setSelectedCollege(college)
    setSelectedDept(dept)
  }

  // ── 3. KPI ────────────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const total = filteredCourses.length
    if (total === 0)
      return { totalCourses: 0, totalEnrolled: 0, avgEnrollmentRate: 0, foreignLanguageRatio: 0 }
    let enrolledSum = 0, rateSum = 0, validRateCount = 0, foreignCount = 0
    filteredCourses.forEach((c) => {
      enrolledSum += c.enrolled || 0
      if (c.capacity && c.capacity > 0) {
        rateSum += ((c.enrolled || 0) / c.capacity) * 100
        validRateCount++
      }
      if (c.is_foreign_language) foreignCount++
    })
    return {
      totalCourses: total,
      totalEnrolled: enrolledSum,
      avgEnrollmentRate: validRateCount > 0 ? rateSum / validRateCount : 0,
      foreignLanguageRatio: (foreignCount / total) * 100,
    }
  }, [filteredCourses])

  // ── 4. 이수구분별 ─────────────────────────────────────────────────────
  const completionData = useMemo(() => {
    const counts: Record<string, number> = {}
    const enrolledSums: Record<string, number> = {}
    filteredCourses.forEach((c) => {
      const type = c.completion_type || '기타'
      counts[type] = (counts[type] || 0) + 1
      enrolledSums[type] = (enrolledSums[type] || 0) + (c.enrolled || 0)
    })
    return {
      courseCountData: Object.keys(counts)
        .map((name) => ({ name, value: counts[name] }))
        .sort((a, b) => b.value - a.value),
      avgEnrolledData: Object.keys(counts)
        .map((name) => ({
          name,
          value: counts[name] > 0 ? enrolledSums[name] / counts[name] : 0,
        }))
        .sort((a, b) => b.value - a.value),
    }
  }, [filteredCourses])

  // ── 5. 수업방법 & 학점 ────────────────────────────────────────────────
  const distributionData = useMemo(() => {
    const methodCounts: Record<string, number> = {}
    const creditCounts: Record<string, number> = {}
    const total = filteredCourses.length
    filteredCourses.forEach((c) => {
      const method = c.teaching_method || '기타'
      const creditLabel = `${c.credits}학점`
      methodCounts[method] = (methodCounts[method] || 0) + 1
      creditCounts[creditLabel] = (creditCounts[creditLabel] || 0) + 1
    })
    return {
      teachingMethodData: Object.keys(methodCounts)
        .map((name) => ({
          name,
          value: methodCounts[name],
          percentage: total > 0 ? (methodCounts[name] / total) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value),
      creditData: Object.keys(creditCounts)
        .map((name) => ({
          name,
          value: creditCounts[name],
          percentage: total > 0 ? (creditCounts[name] / total) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value),
    }
  }, [filteredCourses])

  // ── 6. 요일 & 교시 ───────────────────────────────────────────────────
  const timeData = useMemo(() => {
    const days = ['월', '화', '수', '목', '금', '토']
    const dayCounts: Record<string, number> = { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0, 토: 0 }
    const periodCounts: Record<string, number> = {}
    for (let p = 1; p <= 10; p++) periodCounts[`${p}교시`] = 0
    filteredCourses.forEach((c) => {
      const timeStr = c.timetable_period || ''
      days.forEach((day) => { if (timeStr.includes(day)) dayCounts[day]++ })
      const matches = timeStr.match(/\(([^)]+)\)/g)
      if (matches) matches.forEach((m) => {
        const inner = m.slice(1, -1)
        for (let p = 1; p <= 10; p++) {
          if (new RegExp(`(야)?${p}(?!\\d)`).test(inner))
            periodCounts[`${p}교시`] = (periodCounts[`${p}교시`] || 0) + 1
        }
      })
    })
    return {
      dayOfWeekData: days.map((day) => ({ name: day, value: dayCounts[day] })),
      periodData: Object.keys(periodCounts).map((name) => ({ name, value: periodCounts[name] })),
    }
  }, [filteredCourses])

  // 사이드바에 넘길 courses: 전체 대학 목록을 보여줘야 하므로 전체 courses 사용
  const sidebarCourses = useMemo(
    () => courses.map((c) => ({ college: c.college, department: c.department })),
    [courses]
  )

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-800">
      <Sidebar
        courses={sidebarCourses}
        selectedCollege={selectedCollege}
        selectedDept={selectedDept}
        onSelect={handleSelect}
      />

      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto max-h-screen">

        {/* 상단 헤더 영역 */}
        <div className="flex items-center justify-between w-full mb-6">
          {/* ── 브레드크럼 ── */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold flex-wrap select-none bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
            <Link href="/" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              인천대학교
            </Link>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
            <Link href="/" className="hover:text-blue-600 transition-colors">대시보드</Link>
            {collegeName && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-slate-400">{collegeName}</span>
              </>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="flex items-center gap-1 text-blue-600 font-bold">
              <Building2 className="w-3.5 h-3.5" />
              {department}
            </span>
          </div>

          <UserMenu />
        </div>


        {/* ── 히어로 배너 ── */}
        <div className="relative rounded-2xl overflow-hidden mb-8 border border-blue-200/50 shadow-sm bg-white">
          {/* 그라디언트 배경 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-slate-50/20 to-white" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-yellow-50/10" />

          {/* 장식 원 */}
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-blue-100/30 blur-3xl" />
          <div className="absolute -bottom-6 right-24 w-28 h-28 rounded-full bg-yellow-100/30 blur-2xl" />

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* 아이콘 + 타이틀 */}
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <Building2 className="w-9 h-9 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-blue-600/70 uppercase tracking-widest">
                      인천대학교 2026-1학기
                    </span>
                    {collegeName && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {collegeName}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                    {department}{' '}
                    <span className="text-blue-600">현황 대시보드</span>
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-1.5">
                    {loading
                      ? '데이터 로딩 중...'
                      : `총 ${kpiData.totalCourses}개 강좌 · ${kpiData.totalEnrolled.toLocaleString()}명 수강 중`}
                  </p>
                </div>
              </div>

              {/* 우측 통계 배지 */}
              <div className="lg:ml-auto flex flex-wrap gap-3">
                {[
                  {
                    icon: BookOpen,
                    label: '총 강좌',
                    value: loading ? '…' : `${kpiData.totalCourses}개`,
                    color: '#2563EB',
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                  },
                  {
                    icon: Users,
                    label: '수강인원',
                    value: loading ? '…' : `${kpiData.totalEnrolled.toLocaleString()}명`,
                    color: '#6366F1',
                    bg: 'bg-indigo-50',
                    border: 'border-indigo-100',
                  },
                  {
                    icon: BarChart3,
                    label: '평균수강률',
                    value: loading ? '…' : `${kpiData.avgEnrollmentRate.toFixed(1)}%`,
                    color: '#F59E0B',
                    bg: 'bg-amber-50',
                    border: 'border-amber-100',
                  },
                ].map(({ icon: Icon, label, value, color, bg, border }) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center px-4 py-3 rounded-xl border min-w-[90px] hover:scale-105 transition-transform duration-200 ${bg} ${border}`}
                  >
                    <Icon className="w-4 h-4 mb-1" style={{ color }} />
                    <span className="text-xl font-black" style={{ color }}>
                      {value}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── ① 학과 특화 인사이트 (신규) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <DepartmentInsights
            deptCourses={deptCourses}
            allCourses={courses}
            collegeCourses={collegeCourses}
            department={department}
            collegeName={collegeName}
            loading={loading}
          />
        </ErrorBoundary>

        {/* ── ② KPI 카드 (기존 컴포넌트 재사용) ── */}
        <div className="mt-8 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">핵심 지표</span>
          </div>
          <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
            <KPICards
              totalCourses={kpiData.totalCourses}
              totalEnrolled={kpiData.totalEnrolled}
              avgEnrollmentRate={kpiData.avgEnrollmentRate}
              foreignLanguageRatio={kpiData.foreignLanguageRatio}
              loading={loading}
            />
          </ErrorBoundary>
        </div>

        {/* ── ③ 이수구분별 차트 (기존 컴포넌트 재사용) ── */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">이수구분 분석</span>
          </div>
          <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
            <CompletionTypeCharts
              courseCountData={completionData.courseCountData}
              avgEnrolledData={completionData.avgEnrolledData}
              loading={loading}
            />
          </ErrorBoundary>
        </div>

        {/* ── ④ 수업방법 & 학점 분포 (기존 컴포넌트 재사용) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <DistributionCharts
            teachingMethodData={distributionData.teachingMethodData}
            creditData={distributionData.creditData}
            totalCourses={kpiData.totalCourses}
            loading={loading}
          />
        </ErrorBoundary>

        {/* ── ⑤ 요일 & 교시별 분석 (기존 컴포넌트 재사용) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <TimeAnalysisCharts
            dayOfWeekData={timeData.dayOfWeekData}
            periodData={timeData.periodData}
            loading={loading}
          />
        </ErrorBoundary>

        {/* ── ⑥ 상세 교과목 목록 (기존 컴포넌트 재사용) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <CourseDetailTable courses={filteredCourses} loading={loading} />
        </ErrorBoundary>

        {/* 푸터 영역 */}
        <footer className="mt-16 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium font-sans">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-600/60" />
            <span className="font-bold text-slate-650">제작자: 오예림 · {department} 교과목 대시보드</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://www.inu.ac.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              인천대학교 홈페이지
            </a>
            <a href="https://portal.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              INU 포털
            </a>
            <a href="https://cyber.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              이러닝
            </a>
            <Link href="/" className="hover:text-blue-600 transition-colors">
              ← 전체 대시보드
            </Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
