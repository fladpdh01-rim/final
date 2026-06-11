'use client'

import React, { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookMarked, Sparkles, GraduationCap } from 'lucide-react'

import Sidebar from '@/components/Sidebar'
import KPICards from '@/components/KPICards'
import CompletionTypeCharts from '@/components/CompletionTypeCharts'
import DistributionCharts from '@/components/DistributionCharts'
import TimeAnalysisCharts from '@/components/TimeAnalysisCharts'
import CollegeAnalysisTable from '@/components/CollegeAnalysisTable'
import CourseDetailTable from '@/components/CourseDetailTable'
import LiberalArtsOverview from '@/components/gyoyang/LiberalArtsOverview'
import LiberalArtsInsights from '@/components/gyoyang/LiberalArtsInsights'
import AIAnalysisModal from '@/components/AIAnalysisModal'
import UserMenu from '@/components/UserMenu'
import ErrorBoundary, { ErrorType } from '@/components/ErrorBoundary'
import { useCourseData } from '@/lib/hooks/useCourseData'
import { isLiberalArtsCourse } from '@/lib/utils/liberalArtsFilter'
import { useDashboardSelection } from '@/lib/hooks/useDashboardSelection'

// 교양 이수구분 전용 색상 (CompletionTypeCharts의 Cell 색상 오버라이드용)
export const LIBERAL_TYPE_COLORS: Record<string, string> = {
  기초교양: '#3ECF8E',
  핵심교양: '#5B8DEF',
  심화교양: '#F4A261',
}

export function LiberalArtsDashboardContent() {
  const { courses, loading } = useCourseData()
  const { selectedCollege, selectedDept, handleSelect } = useDashboardSelection()
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [simulatedError, setSimulatedError] = useState<ErrorType | undefined>(undefined)

  // ── 1. 교양 과목 필터링 ──────────────────────────────────────────
  const liberalArtsCourses = useMemo(
    () => courses.filter(isLiberalArtsCourse),
    [courses]
  )

  // ── 2. 사이드바 2차 필터 ─────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return liberalArtsCourses.filter((c) => {
      if (selectedCollege && c.college !== selectedCollege) return false
      if (selectedDept && c.department !== selectedDept) return false
      return true
    })
  }, [liberalArtsCourses, selectedCollege, selectedDept])

  // ── 3. KPI ──────────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const total = filteredCourses.length
    if (total === 0) return { totalCourses: 0, totalEnrolled: 0, avgEnrollmentRate: 0, foreignLanguageRatio: 0 }
    let enrolledSum = 0, rateSum = 0, validRateCount = 0, foreignCount = 0
    filteredCourses.forEach((c) => {
      enrolledSum += c.enrolled || 0
      if (c.capacity && c.capacity > 0) { rateSum += ((c.enrolled || 0) / c.capacity) * 100; validRateCount++ }
      if (c.is_foreign_language) foreignCount++
    })
    return {
      totalCourses: total,
      totalEnrolled: enrolledSum,
      avgEnrollmentRate: validRateCount > 0 ? rateSum / validRateCount : 0,
      foreignLanguageRatio: (foreignCount / total) * 100,
    }
  }, [filteredCourses])

  // ── 4. 이수구분별 (교양 3종 강조) ────────────────────────────────
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
        .map((name) => ({ name, value: counts[name] > 0 ? enrolledSums[name] / counts[name] : 0 }))
        .sort((a, b) => b.value - a.value),
    }
  }, [filteredCourses])

  // ── 5. 수업방법 & 학점 ───────────────────────────────────────────
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
        .map((name) => ({ name, value: methodCounts[name], percentage: total > 0 ? (methodCounts[name] / total) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
      creditData: Object.keys(creditCounts)
        .map((name) => ({ name, value: creditCounts[name], percentage: total > 0 ? (creditCounts[name] / total) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
    }
  }, [filteredCourses])

  // ── 6. 요일 & 교시 ───────────────────────────────────────────────
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
          if (new RegExp(`(야)?${p}(?!\\d)`).test(inner)) periodCounts[`${p}교시`] = (periodCounts[`${p}교시`] || 0) + 1
        }
      })
    })
    return {
      dayOfWeekData: days.map((day) => ({ name: day, value: dayCounts[day] })),
      periodData: Object.keys(periodCounts).map((name) => ({ name, value: periodCounts[name] })),
    }
  }, [filteredCourses])

  // ── 7. 대학(원)별 요약 ───────────────────────────────────────────
  const collegeAnalysisData = useMemo(() => {
    const map: Record<string, { count: number; enrolled: number; rateSum: number; rateCount: number }> = {}
    filteredCourses.forEach((c) => {
      if (!c.college) return
      if (!map[c.college]) map[c.college] = { count: 0, enrolled: 0, rateSum: 0, rateCount: 0 }
      map[c.college].count++
      map[c.college].enrolled += c.enrolled || 0
      if (c.capacity && c.capacity > 0) {
        map[c.college].rateSum += ((c.enrolled || 0) / c.capacity) * 100
        map[c.college].rateCount++
      }
    })
    return Object.keys(map).map((name) => ({
      collegeName: name,
      courseCount: map[name].count,
      totalEnrolled: map[name].enrolled,
      avgEnrollmentRate: map[name].rateCount > 0 ? map[name].rateSum / map[name].rateCount : 0,
    }))
  }, [filteredCourses])

  const sidebarCourses = useMemo(
    () => courses.map((c) => ({ college: c.college, department: c.department })),
    [courses]
  )

  // 이수구분 뱃지 카운트
  const typeCounts = useMemo(() => ({
    기초교양: filteredCourses.filter((c) => c.completion_type === '기초교양').length,
    핵심교양: filteredCourses.filter((c) => c.completion_type === '핵심교양').length,
    심화교양: filteredCourses.filter((c) => c.completion_type === '심화교양').length,
  }), [filteredCourses])

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
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              <BookMarked className="w-3.5 h-3.5" />
              교양 교과목
            </span>
            {selectedCollege && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
                <span className={selectedDept ? 'text-slate-400 hover:text-blue-600 transition-colors cursor-pointer' : 'text-blue-600 font-bold'} onClick={() => handleSelect(selectedCollege, '')}>{selectedCollege}</span>
              </>
            )}
            {selectedDept && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="text-blue-600 font-bold">{selectedDept}</span>
              </>
            )}
          </div>

          <UserMenu />
        </div>


        {/* ══════════════════════════════════════════════════════════════
            히어로 배너 — "교양 교과목" 타이틀 강조
        ══════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-2xl overflow-hidden mb-8 border border-blue-200/50 shadow-sm bg-white">
          {/* 그라디언트 배경 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-slate-50/20 to-white" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-yellow-50/10" />

          {/* 장식 원 */}
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-blue-100/30 blur-3xl" />
          <div className="absolute -bottom-6 right-24 w-28 h-28 rounded-full bg-yellow-100/30 blur-2xl" />

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">

              {/* 아이콘 + 타이틀 */}
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-blue-600/70 uppercase tracking-widest">
                      인천대학교 2026-1학기
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      <Sparkles className="w-2.5 h-2.5 text-blue-500 animate-pulse" />
                      LIBERAL ARTS
                    </span>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                    교양 교과목{' '}
                    <span className="text-blue-600">현황 대시보드</span>
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-1.5">
                    {selectedDept
                      ? `${selectedCollege} ${selectedDept}의 교양 과목 현황`
                      : selectedCollege
                      ? `${selectedCollege}의 교양 과목 현황`
                      : '기초교양 · 핵심교양 · 심화교양 이수구분 과목을 분석한 교양 교육 전용 대시보드'}
                  </p>
                </div>
              </div>

              {/* 이수구분 뱃지 통계 */}
              <div className="lg:ml-auto flex flex-wrap gap-3">
                {[
                  { key: '기초교양', color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-100', desc: '학문의 기초' },
                  { key: '핵심교양', color: '#4F46E5', bg: 'bg-indigo-50', border: 'border-indigo-100', desc: '인문·사회·자연' },
                  { key: '심화교양', color: '#D97706', bg: 'bg-amber-50', border: 'border-amber-100', desc: '융합·심화' },
                ].map(({ key, color, bg, border, desc }) => (
                  <div
                    key={key}
                    className={`flex flex-col items-center px-4 py-3 rounded-xl border min-w-[90px] hover:scale-105 transition-transform duration-200 ${bg} ${border}`}
                  >
                    <span className="text-2xl font-black" style={{ color }}>
                      {loading ? '…' : typeCounts[key as keyof typeof typeCounts].toLocaleString()}
                    </span>
                    <span className="text-xs font-bold" style={{ color }}>{key}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI 강의 분석 버튼 (히어로 하단 오른쪽) */}
        <div className="flex justify-end mb-4 pr-1">
          <button
            onClick={() => setAiModalOpen(true)}
            disabled={(!selectedCollege && !selectedDept) || filteredCourses.length === 0}
            title={!selectedCollege ? '사이드바에서 대학 또는 학과를 선택하세요' : filteredCourses.length === 0 ? '선택한 조건에 해당하는 강좌가 없습니다' : 'AI 강의 분석 실행'}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-300 border ${
              selectedCollege
                ? 'bg-gradient-to-r from-blue-200 via-indigo-50 to-yellow-200 text-slate-800 border-blue-200/60 shadow-md hover:shadow-lg shadow-blue-100/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            AI 강의 분석
          </button>
        </div>

        {/* AI 분석 모달 */}
        <AIAnalysisModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          courses={filteredCourses as unknown as Record<string, unknown>[]}
          college={selectedCollege}
          department={selectedDept}
          dashboardType="liberal"
        />

        {/* ── ① 교양 유형별 개요 카드 ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <LiberalArtsOverview courses={filteredCourses} loading={loading} />
        </ErrorBoundary>

        {/* ── ② 교양 특화 인사이트 ── */}
        <div className="mt-6">
          <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
            <LiberalArtsInsights courses={filteredCourses} loading={loading} />
          </ErrorBoundary>
        </div>

        {/* ── ③ KPI 카드 (기존 컴포넌트 재사용) ── */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">핵심 지표</span>
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

        {/* ── ④ 이수구분별 차트 — 교양 3종 강조 (기존 컴포넌트 재사용) ── */}
        <div className="mt-2">
          {/* 강조 안내 레이블 */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">이수구분 분석</span>
            <div className="flex items-center gap-2">
              {[{ label: '기초교양', color: '#2563EB' }, { label: '핵심교양', color: '#4F46E5' }, { label: '심화교양', color: '#D97706' }].map(({ label, color }) => (
                <span key={label} className="text-[10px] font-bold px-2 py-0.5 rounded-full border animate-pulse" style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                  ● {label}
                </span>
              ))}
              <span className="text-[10px] text-slate-500">= 강조 표시</span>
            </div>
          </div>
          <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
            <CompletionTypeCharts
              courseCountData={completionData.courseCountData}
              avgEnrolledData={completionData.avgEnrolledData}
              loading={loading}
            />
          </ErrorBoundary>
        </div>

        {/* ── ⑤ 수업방법 & 학점 분포 (기존 컴포넌트 재사용) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <DistributionCharts
            teachingMethodData={distributionData.teachingMethodData}
            creditData={distributionData.creditData}
            totalCourses={kpiData.totalCourses}
            loading={loading}
          />
        </ErrorBoundary>

        {/* ── ⑥ 요일 & 교시별 분석 (기존 컴포넌트 재사용) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <TimeAnalysisCharts
            dayOfWeekData={timeData.dayOfWeekData}
            periodData={timeData.periodData}
            loading={loading}
          />
        </ErrorBoundary>

        {/* ── ⑦ 대학(원)별 요약 테이블 (기존 컴포넌트 재사용) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <CollegeAnalysisTable
            data={collegeAnalysisData}
            onSelectCollege={(college) => handleSelect(college, '')}
            loading={loading}
          />
        </ErrorBoundary>

        {/* ── ⑧ 상세 교과목 목록 (기존 컴포넌트 재사용) ── */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <CourseDetailTable courses={filteredCourses} loading={loading} />
        </ErrorBoundary>

        {/* 푸터 영역 */}
        <footer className="mt-16 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium font-sans">
          <div className="flex items-center gap-2">
            <BookMarked className="w-3.5 h-3.5 text-blue-600/60" />
            <span className="font-bold text-slate-650">제작자: 오예림 · 교양 교과목 대시보드</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              인천대학교 홈페이지
            </a>
            <a href="https://portal.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              INU 포털
            </a>
            <a href="https://cyber.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              이러닝
            </a>
            <Link href="/" className="hover:text-blue-600 transition-colors">← 전체 대시보드</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default function LiberalArtsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex w-full min-h-screen bg-slate-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-blue-600 animate-spin" />
      </div>
    }>
      <LiberalArtsDashboardContent />
    </Suspense>
  )
}
