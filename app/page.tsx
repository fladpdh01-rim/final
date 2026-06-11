'use client'

import React, { useState, useMemo, Suspense } from 'react'
import { Sparkles } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import KPICards from '@/components/KPICards'
import CompletionTypeCharts from '@/components/CompletionTypeCharts'
import DistributionCharts from '@/components/DistributionCharts'
import TimeAnalysisCharts from '@/components/TimeAnalysisCharts'
import CollegeAnalysisTable from '@/components/CollegeAnalysisTable'
import CourseDetailTable from '@/components/CourseDetailTable'
import AIAnalysisModal from '@/components/AIAnalysisModal'
import ErrorBoundary, { ErrorType } from '@/components/ErrorBoundary'
import { useCourseData } from '@/lib/hooks/useCourseData'
import { useDashboardSelection } from '@/lib/hooks/useDashboardSelection'

function HomeContent() {
  const { courses, loading } = useCourseData()
  const { selectedCollege, selectedDept, handleSelect } = useDashboardSelection()
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [simulatedError, setSimulatedError] = useState<ErrorType | undefined>(undefined)
  const [showSimulator, setShowSimulator] = useState(false)

  // 대학/학과 필터링된 교과목 목록
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (selectedCollege && c.college !== selectedCollege) return false
      if (selectedDept && c.department !== selectedDept) return false
      return true
    })
  }, [courses, selectedCollege, selectedDept])

  // --- 1. KPI 카드 데이터 집계 ---
  const kpiData = useMemo(() => {
    const total = filteredCourses.length
    if (total === 0) {
      return { totalCourses: 0, totalEnrolled: 0, avgEnrollmentRate: 0, foreignLanguageRatio: 0 }
    }

    let enrolledSum = 0
    let validRateCount = 0
    let rateSum = 0
    let foreignCount = 0

    filteredCourses.forEach((c) => {
      enrolledSum += c.enrolled || 0
      if (c.capacity && c.capacity > 0) {
        rateSum += ((c.enrolled || 0) / c.capacity) * 100
        validRateCount++
      }
      if (c.is_foreign_language) {
        foreignCount++
      }
    })

    return {
      totalCourses: total,
      totalEnrolled: enrolledSum,
      avgEnrollmentRate: validRateCount > 0 ? rateSum / validRateCount : 0,
      foreignLanguageRatio: (foreignCount / total) * 100,
    }
  }, [filteredCourses])

  // --- 2. 이수구분별 강좌 수 & 평균 수강인원 ---
  const completionData = useMemo(() => {
    const counts: { [key: string]: number } = {}
    const enrolledSums: { [key: string]: number } = {}

    filteredCourses.forEach((c) => {
      const type = c.completion_type || '기타'
      counts[type] = (counts[type] || 0) + 1
      enrolledSums[type] = (enrolledSums[type] || 0) + (c.enrolled || 0)
    })

    const countList = Object.keys(counts).map((name) => ({
      name,
      value: counts[name],
    })).sort((a, b) => b.value - a.value)

    const avgList = Object.keys(counts).map((name) => ({
      name,
      value: counts[name] > 0 ? enrolledSums[name] / counts[name] : 0,
    })).sort((a, b) => b.value - a.value)

    return { courseCountData: countList, avgEnrolledData: avgList }
  }, [filteredCourses])

  // --- 3. 수업방법 유형 분포 & 학점 구성 비율 ---
  const distributionData = useMemo(() => {
    const methodCounts: { [key: string]: number } = {}
    const creditCounts: { [key: string]: number } = {}
    const total = filteredCourses.length

    filteredCourses.forEach((c) => {
      const method = c.teaching_method || '기타'
      const creditLabel = `${c.credits}학점`
      methodCounts[method] = (methodCounts[method] || 0) + 1
      creditCounts[creditLabel] = (creditCounts[creditLabel] || 0) + 1
    })

    const methodList = Object.keys(methodCounts).map((name) => ({
      name,
      value: methodCounts[name],
      percentage: total > 0 ? (methodCounts[name] / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value)

    const creditList = Object.keys(creditCounts).map((name) => ({
      name,
      value: creditCounts[name],
      percentage: total > 0 ? (creditCounts[name] / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value)

    return { teachingMethodData: methodList, creditData: creditList }
  }, [filteredCourses])

  // --- 4. 요일별 & 수업 시간별 강좌 수 ---
  const timeData = useMemo(() => {
    const days = ['월', '화', '수', '목', '금', '토']
    const dayCounts: { [key: string]: number } = { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0, tot: 0 }
    const dayOfWeekData = days.map(d => ({ name: d, value: 0 }))
    
    // 1교시 ~ 10교시 설정
    const periodCounts: { [key: string]: number } = {}
    for (let p = 1; p <= 10; p++) {
      periodCounts[`${p}교시`] = 0
    }

    filteredCourses.forEach((c) => {
      const timeStr = c.timetable_period || ''
      
      // 요일 체크
      days.forEach((day, dIdx) => {
        if (timeStr.includes(day)) {
          dayOfWeekData[dIdx].value++
        }
      })

      // 교시 체크 (숫자 형태 및 야간/주간 1~10교시 분류)
      // 정규식으로 괄호 속의 교시 매칭 예: "월(1-3)" 이면 1, 2, 3교시에 카운트 추가
      const matches = timeStr.match(/\(([^)]+)\)/g)
      if (matches) {
        matches.forEach((m) => {
          // 괄호 제거
          const inner = m.slice(1, -1)
          
          // 숫자 1-10 범위 내의 값 추출
          for (let p = 1; p <= 10; p++) {
            // 야간 교시(야1, 야2 등) 또는 일반 숫자 매칭
            const regex = new RegExp(`(야)?${p}(?!\\d)`)
            if (regex.test(inner)) {
              periodCounts[`${p}교시`] = (periodCounts[`${p}교시`] || 0) + 1
            }
          }
        })
      }
    });

    const periodList = Object.keys(periodCounts).map((name) => ({
      name,
      value: periodCounts[name],
    }))

    return { dayOfWeekData, periodData: periodList }
  }, [filteredCourses])

  // --- 5. 대학(원)별 강좌 분석 요약 ---
  const collegeAnalysisData = useMemo(() => {
    const map: { [key: string]: { count: number; enrolled: number; rateSum: number; rateCount: number } } = {}

    filteredCourses.forEach((c) => {
      if (!c.college) return
      if (!map[c.college]) {
        map[c.college] = { count: 0, enrolled: 0, rateSum: 0, rateCount: 0 }
      }
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

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-800">
      {/* 사이드바 */}
      <Sidebar
        courses={courses}
        selectedCollege={selectedCollege}
        selectedDept={selectedDept}
        onSelect={handleSelect}
      />

      {/* 메인 콘텐츠 컨테이너 */}
      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto max-h-screen">
        {/* 상단 브레드크럼 */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-6 select-none bg-white border border-slate-200 px-4 py-2.5 rounded-xl w-fit shadow-sm">
          <span className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => handleSelect('', '')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            인천대학교
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
          <span className={selectedCollege ? 'hover:text-blue-600 transition-colors cursor-pointer' : 'text-blue-600 font-bold'} onClick={() => handleSelect('', '')}>대시보드</span>
          {selectedCollege && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
              <span className={selectedDept ? 'hover:text-blue-600 transition-colors cursor-pointer' : 'text-blue-600 font-bold'} onClick={() => handleSelect(selectedCollege, '')}>{selectedCollege}</span>
            </>
          )}
          {selectedDept && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polyline points="9 18 15 12 9 6"/></svg>
              <span className="text-blue-600 font-bold">{selectedDept}</span>
            </>
          )}
        </div>

        {/* 에러 시뮬레이터 패널 */}
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowSimulator(!showSimulator)}>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-650">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>에러 시뮬레이션 설정 (테스트 및 평가용)</span>
              {simulatedError && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 animate-pulse font-bold">
                  활성화됨: {simulatedError}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-bold hover:text-slate-700 transition-colors">
              {showSimulator ? '접기' : '펼치기'}
            </span>
          </div>

          {showSimulator && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setSimulatedError(undefined)}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  simulatedError === undefined
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                정상 상태 (Normal)
              </button>
              <button
                onClick={() => setSimulatedError('network')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  simulatedError === 'network'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                네트워크 오류 (Network Error)
              </button>
              <button
                onClick={() => setSimulatedError('permission')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  simulatedError === 'permission'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/10'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                권한 오류 (Permission Error)
              </button>
              <button
                onClick={() => setSimulatedError('server')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  simulatedError === 'server'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-600/10'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                서버 오류 (Server Error)
              </button>
              <button
                onClick={() => setSimulatedError('empty')}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  simulatedError === 'empty'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/10'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                데이터 없음 (No Data)
              </button>
            </div>
          )}
        </div>

        {/* 대시보드 타이틀 + AI 버튼 */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
              {selectedDept || selectedCollege || '전체 교과목'} 현황 대시보드
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {selectedDept
                ? `${selectedCollege} ${selectedDept}의 교과목 통계 정보를 제공합니다.`
                : selectedCollege
                ? `${selectedCollege} 소속 학과들의 교육 운영 통계입니다.`
                : '인천대학교 2026학년도 1학기 전체 교과목 통계 현황판입니다.'}
            </p>
          </div>

          {/* AI 강의 분석 버튼 */}
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
          dashboardType="main"
        />

        {/* 첫 번째 행: KPI 카드 */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <KPICards
            totalCourses={kpiData.totalCourses}
            totalEnrolled={kpiData.totalEnrolled}
            avgEnrollmentRate={kpiData.avgEnrollmentRate}
            foreignLanguageRatio={kpiData.foreignLanguageRatio}
            loading={loading}
          />
        </ErrorBoundary>

        {/* 두 번째 행: 이수구분별 차트 */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <CompletionTypeCharts
            courseCountData={completionData.courseCountData}
            avgEnrolledData={completionData.avgEnrolledData}
            loading={loading}
          />
        </ErrorBoundary>

        {/* 세 번째 행: 유형 분포 / 학점 구성 비율 */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <DistributionCharts
            teachingMethodData={distributionData.teachingMethodData}
            creditData={distributionData.creditData}
            totalCourses={kpiData.totalCourses}
            loading={loading}
          />
        </ErrorBoundary>

        {/* 네 번째 행: 요일 / 교시별 분석 */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <TimeAnalysisCharts
            dayOfWeekData={timeData.dayOfWeekData}
            periodData={timeData.periodData}
            loading={loading}
          />
        </ErrorBoundary>

        {/* 다섯 번째 행: 대학(원)별 요약 테이블 */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <CollegeAnalysisTable
            data={collegeAnalysisData}
            onSelectCollege={(college) => handleSelect(college, '')}
            loading={loading}
          />
        </ErrorBoundary>

        {/* 여섯 번째 행: 상세 교과목 목록 */}
        <ErrorBoundary errorType={simulatedError} onRetry={() => setSimulatedError(undefined)}>
          <CourseDetailTable
            courses={filteredCourses}
            loading={loading}
          />
        </ErrorBoundary>

        {/* 푸터 영역 */}
        <footer className="mt-16 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium font-sans">
          <div>
            <span className="font-bold text-slate-600">제작자: 오예림</span>
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
          </div>
        </footer>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex w-full min-h-screen bg-slate-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-blue-600 animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
