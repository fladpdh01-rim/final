'use client'

import React, { useMemo, useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Trophy, Users, BookOpen, TrendingUp, Scale,
  GraduationCap, Star, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'
import { CourseRawData } from '@/components/CourseDetailTable'

// ── 타입 ──────────────────────────────────────────────────────────────────
interface DepartmentInsightsProps {
  /** 현재 학과 강좌 */
  deptCourses: CourseRawData[]
  /** 전체 강좌 (비교용) */
  allCourses: CourseRawData[]
  /** 같은 대학 강좌 (비교용) */
  collegeCourses: CourseRawData[]
  /** 학과명 */
  department: string
  /** 소속 대학명 */
  collegeName: string
  loading?: boolean
}

// ── 색상 팔레트 (파란색, 노란색, 회색 등 디자인 테마 적용) ────────────────
const COMPLETION_COLORS: Record<string, string> = {
  전공심화: '#2563EB', // 진한 파랑
  전공기초: '#6366F1', // 남색
  전공핵심: '#3B82F6', // 밝은 파랑
  기초교양: '#F59E0B', // 노랑
  핵심교양: '#EAB308', // 주황/노랑
  심화교양: '#FBBF24', // 연한 노랑
  교직: '#EC4899',
  일반선택: '#14B8A6',
  군사학: '#8B5CF6',
  기타: '#64748B',
}

const CREDIT_COLORS = ['#2563EB', '#3B82F6', '#6366F1', '#F59E0B', '#14B8A6']

// ── 커스텀 툴팁 ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-xl text-slate-800">
      <p className="text-slate-400 mb-1 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.fill ?? '#2563EB' }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          {p.name?.includes('률') || p.name?.includes('rate') ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

// ── 헬퍼: 평균 수강률 계산 ────────────────────────────────────────────────
function calcAvgRate(courses: CourseRawData[]): number {
  let sum = 0, count = 0
  courses.forEach((c) => {
    if (c.capacity && c.capacity > 0) {
      sum += (c.enrolled / c.capacity) * 100
      count++
    }
  })
  return count > 0 ? sum / count : 0
}

// ═══════════════════════════════════════════════════════════════════════════
export default function DepartmentInsights({
  deptCourses,
  allCourses,
  collegeCourses,
  department,
  collegeName,
  loading = false,
}: DepartmentInsightsProps) {

  // ── 비교 학과 선택 상태 ──────────────────────────────────────────────
  const [compareTarget, setCompareTarget] = useState<string>('')

  // ── 같은 대학 내 다른 학과 목록 ─────────────────────────────────────
  const siblingDepts = useMemo(() => {
    const set = new Set<string>()
    collegeCourses.forEach((c) => { if (c.department && c.department !== department) set.add(c.department) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
  }, [collegeCourses, department])

  // ── 비교 학과 강좌 ───────────────────────────────────────────────────
  const compareCourses = useMemo(
    () => (compareTarget ? collegeCourses.filter((c) => c.department === compareTarget) : []),
    [collegeCourses, compareTarget]
  )

  // ═══════════════════════════════════════════════════════════════════════
  // 1. 전공 이수구분 비율 (파이 차트)
  // ═══════════════════════════════════════════════════════════════════════
  const completionPieData = useMemo(() => {
    const counts: Record<string, number> = {}
    deptCourses.forEach((c) => {
      const type = c.completion_type || '기타'
      counts[type] = (counts[type] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [deptCourses])

  // 전공 vs 교양 vs 기타 요약
  const majorElectiveSummary = useMemo(() => {
    const majorRequired = deptCourses.filter(c =>
      ['전공심화', '전공핵심'].includes(c.completion_type)
    ).length
    const majorElective = deptCourses.filter(c =>
      c.completion_type === '전공기초'
    ).length
    const liberal = deptCourses.filter(c =>
      ['기초교양', '핵심교양', '심화교양'].includes(c.completion_type)
    ).length
    const general = deptCourses.filter(c =>
      c.completion_type === '일반선택'
    ).length
    const total = deptCourses.length || 1
    return [
      { label: '전공필수', count: majorRequired, pct: (majorRequired / total) * 100, color: '#2563EB' },
      { label: '전공기초', count: majorElective, pct: (majorElective / total) * 100, color: '#3B82F6' },
      { label: '교양', count: liberal, pct: (liberal / total) * 100, color: '#F59E0B' },
      { label: '일반선택', count: general, pct: (general / total) * 100, color: '#64748B' },
    ]
  }, [deptCourses])

  // ═══════════════════════════════════════════════════════════════════════
  // 2. 인기 강좌 TOP 5 (수강률 기준)
  // ═══════════════════════════════════════════════════════════════════════
  const top5Courses = useMemo(() => {
    return [...deptCourses]
      .filter((c) => c.capacity > 0)
      .map((c) => ({
        ...c,
        rate: (c.enrolled / c.capacity) * 100,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [deptCourses])

  // ═══════════════════════════════════════════════════════════════════════
  // 3. 수강률 비교: 이 학과 vs 전체 vs 같은 대학
  // ═══════════════════════════════════════════════════════════════════════
  const rateCompareData = useMemo(() => {
    const deptRate = calcAvgRate(deptCourses)
    const allRate = calcAvgRate(allCourses)
    const collegeRate = calcAvgRate(collegeCourses)
    const compareRate = compareCourses.length ? calcAvgRate(compareCourses) : null

    const base = [
      { name: department.length > 6 ? department.slice(0, 6) + '…' : department, value: deptRate, fill: '#2563EB' },
      { name: `${collegeName} 평균`, value: collegeRate, fill: '#3B82F6' },
      { name: '전체 평균', value: allRate, fill: '#F59E0B' },
    ]
    if (compareRate !== null && compareTarget) {
      base.push({
        name: compareTarget.length > 6 ? compareTarget.slice(0, 6) + '…' : compareTarget,
        value: compareRate,
        fill: '#8B5CF6',
      })
    }
    return { data: base, deptRate, allRate, diff: deptRate - allRate }
  }, [deptCourses, allCourses, collegeCourses, compareCourses, department, collegeName, compareTarget])

  // ═══════════════════════════════════════════════════════════════════════
  // 4. 담당 교수 현황
  // ═══════════════════════════════════════════════════════════════════════
  const professorData = useMemo(() => {
    const map: Record<string, { courses: number; enrolled: number; capacity: number }> = {}
    deptCourses.forEach((c) => {
      const name = c.professor || '미입력'
      if (!map[name]) map[name] = { courses: 0, enrolled: 0, capacity: 0 }
      map[name].courses++
      map[name].enrolled += c.enrolled || 0
      map[name].capacity += c.capacity || 0
    })
    const list = Object.entries(map).map(([name, v]) => ({
      name,
      courses: v.courses,
      avgRate: v.capacity > 0 ? (v.enrolled / v.capacity) * 100 : 0,
      enrolled: v.enrolled,
    })).sort((a, b) => b.courses - a.courses)

    return {
      totalProfessors: Object.keys(map).filter(n => n !== '미입력').length,
      avgCoursesPerProf: list.length > 0
        ? list.filter(p => p.name !== '미입력').reduce((s, p) => s + p.courses, 0) / Math.max(1, Object.keys(map).filter(n => n !== '미입력').length)
        : 0,
      top5: list.slice(0, 5),
    }
  }, [deptCourses])

  // ═══════════════════════════════════════════════════════════════════════
  // 5. 학점별 강좌 구성
  // ═══════════════════════════════════════════════════════════════════════
  const creditBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    const total = deptCourses.length || 1
    deptCourses.forEach((c) => {
      const label = `${c.credits}학점`
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, pct: (value / total) * 100 }))
      .sort((a, b) => b.value - a.value)
  }, [deptCourses])

  // ═══════════════════════════════════════════════════════════════════════
  // 6. 레이더 차트: 학과 프로필 (정규화된 5개 지표)
  // ═══════════════════════════════════════════════════════════════════════
  const radarData = useMemo(() => {
    const deptRate = calcAvgRate(deptCourses)
    const allRate = calcAvgRate(allCourses) || 1

    const deptForeign = deptCourses.filter(c => c.is_foreign_language).length / (deptCourses.length || 1) * 100
    const allForeign = allCourses.filter(c => c.is_foreign_language).length / (allCourses.length || 1) * 100 || 1

    // 3학점 비율
    const dept3credit = deptCourses.filter(c => c.credits === 3).length / (deptCourses.length || 1) * 100
    const all3credit = allCourses.filter(c => c.credits === 3).length / (allCourses.length || 1) * 100 || 1

    // 교수 1인당 강좌 수 (역수: 낮을수록 좋으므로 전체대비 역비율)
    const profMap: Record<string, number> = {}
    deptCourses.forEach(c => { if (c.professor) profMap[c.professor] = (profMap[c.professor] || 0) + 1 })
    const profCount = Object.keys(profMap).length || 1
    const coursesPerProf = deptCourses.length / profCount
    const allProfMap: Record<string, number> = {}
    allCourses.forEach(c => { if (c.professor) allProfMap[c.professor] = (allProfMap[c.professor] || 0) + 1 })
    const allProfCount = Object.keys(allProfMap).length || 1
    const allCoursesPerProf = allCourses.length / allProfCount || 1

    // 전공 집중도 (전공심화+전공핵심+전공기초 비율)
    const majorRatio = deptCourses.filter(c => ['전공심화','전공핵심','전공기초'].includes(c.completion_type)).length / (deptCourses.length || 1) * 100
    const allMajorRatio = allCourses.filter(c => ['전공심화','전공핵심','전공기초'].includes(c.completion_type)).length / (allCourses.length || 1) * 100 || 1

    const normalize = (val: number, ref: number) => Math.min(100, (val / ref) * 70)

    if (compareCourses.length) {
      const cmpRate = calcAvgRate(compareCourses)
      const cmpForeign = compareCourses.filter(c => c.is_foreign_language).length / (compareCourses.length || 1) * 100
      const cmp3credit = compareCourses.filter(c => c.credits === 3).length / (compareCourses.length || 1) * 100
      const cmpProfMap: Record<string, number> = {}
      compareCourses.forEach(c => { if (c.professor) cmpProfMap[c.professor] = (cmpProfMap[c.professor] || 0) + 1 })
      const cmpProfCount = Object.keys(cmpProfMap).length || 1
      const cmpCoursesPerProf = compareCourses.length / cmpProfCount
      const cmpMajorRatio = compareCourses.filter(c => ['전공심화','전공핵심','전공기초'].includes(c.completion_type)).length / (compareCourses.length || 1) * 100

      return [
        { metric: '수강률', dept: normalize(deptRate, allRate), compare: normalize(cmpRate, allRate) },
        { metric: '원어강의', dept: normalize(deptForeign, allForeign), compare: normalize(cmpForeign, allForeign) },
        { metric: '3학점 비율', dept: normalize(dept3credit, all3credit), compare: normalize(cmp3credit, all3credit) },
        { metric: '교수 집중도', dept: normalize(allCoursesPerProf, coursesPerProf), compare: normalize(allCoursesPerProf, cmpCoursesPerProf) },
        { metric: '전공 집중도', dept: normalize(majorRatio, allMajorRatio), compare: normalize(cmpMajorRatio, allMajorRatio) },
      ]
    }

    return [
      { metric: '수강률', dept: normalize(deptRate, allRate) },
      { metric: '원어강의', dept: normalize(deptForeign, allForeign) },
      { metric: '3학점 비율', dept: normalize(dept3credit, all3credit) },
      { metric: '교수 집중도', dept: normalize(allCoursesPerProf, coursesPerProf) },
      { metric: '전공 집중도', dept: normalize(majorRatio, allMajorRatio) },
    ]
  }, [deptCourses, allCourses, compareCourses])

  // ─────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
        ))}
      </div>
    )
  }

  if (deptCourses.length === 0) return null

  const diffIcon = rateCompareData.diff > 1
    ? <ArrowUpRight className="w-3.5 h-3.5" />
    : rateCompareData.diff < -1
    ? <ArrowDownRight className="w-3.5 h-3.5" />
    : <Minus className="w-3.5 h-3.5" />
  const diffColor = rateCompareData.diff > 1 ? '#10B981' : rateCompareData.diff < -1 ? '#F59E0B' : '#64748B'

  return (
    <div className="space-y-5">

      {/* ── 섹션 헤더 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-50">
            <Star className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800">학과 특화 인사이트</h2>
            <p className="text-[11px] text-slate-400 font-medium">{department} · {deptCourses.length}개 강좌 분석</p>
          </div>
        </div>

        {/* 비교 학과 선택 */}
        {siblingDepts.length > 0 && (
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-blue-500" />
            <select
              value={compareTarget}
              onChange={(e) => setCompareTarget(e.target.value)}
              className="bg-white border border-slate-200 text-slate-650 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors shadow-sm"
            >
              <option value="">비교 학과 선택…</option>
              {siblingDepts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ROW 1: 전공 이수구분 비율 + 수강률 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── 1A. 전공 이수구분 파이 차트 ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-700">이수구분 비율</h3>
          </div>

          {/* 전공 요약 배지 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {majorElectiveSummary.map(({ label, count, pct, color }) => (
              <div key={label}
                className="flex items-center justify-between px-3 py-2 rounded-xl border"
                style={{ borderColor: `${color}20`, backgroundColor: `${color}0A` }}
              >
                <div>
                  <p className="text-[10px] font-bold" style={{ color }}>{label}</p>
                  <p className="text-lg font-black text-slate-800 leading-tight">{count}<span className="text-xs font-medium text-slate-400 ml-0.5">개</span></p>
                </div>
                <p className="text-sm font-bold" style={{ color }}>{pct.toFixed(0)}%</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={completionPieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {completionPieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COMPLETION_COLORS[entry.name] ?? '#94a3b8'}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const { name, value } = payload[0].payload
                  const total = completionPieData.reduce((s, d) => s + d.value, 0)
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-xl text-slate-800">
                      <p className="text-slate-400 mb-0.5">{name}</p>
                      <p className="text-slate-800 font-bold">{value}개 ({((value / total) * 100).toFixed(1)}%)</p>
                    </div>
                  )
                }}
              />
              <Legend
                iconSize={8}
                iconType="circle"
                formatter={(v) => <span className="text-[10px] text-slate-500 font-medium">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ── 1B. 수강률 비교 바 차트 ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-700">평균 수강률 비교</h3>
            </div>
            {/* 전체 평균 대비 차이 뱃지 */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
              style={{ color: diffColor, backgroundColor: `${diffColor}12` }}
            >
              {diffIcon}
              {rateCompareData.diff > 0 ? '+' : ''}{rateCompareData.diff.toFixed(1)}%p
            </div>
          </div>

          {/* 수치 요약 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-0.5">이 학과</p>
              <p className="text-2xl font-black text-blue-600">{rateCompareData.deptRate.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">전체 평균</p>
              <p className="text-2xl font-black text-slate-700">{rateCompareData.allRate.toFixed(1)}%</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={rateCompareData.data} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                width={34}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="수강률">
                {rateCompareData.data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 2: 인기 강좌 TOP 5 + 담당 교수 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── 2A. 인기 강좌 TOP 5 ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700">인기 강좌 TOP 5</h3>
            <span className="ml-auto text-[10px] text-slate-400 font-medium">수강률 기준</span>
          </div>
          <div className="space-y-3">
            {top5Courses.map((c, i) => {
              const MEDALS = ['🥇', '🥈', '🥉', '4', '5']
              const isTop3 = i < 3
              const barColor = i === 0 ? '#2563EB' : i === 1 ? '#3B82F6' : i === 2 ? '#6366F1' : '#F59E0B'
              return (
                <div key={c.id} className="group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`text-sm shrink-0 ${isTop3 ? '' : 'text-slate-400 font-bold text-xs w-4 text-center'}`}>
                      {MEDALS[i]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate" title={c.course_name}>
                        {c.course_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{c.professor || '미입력'}</span>
                        <span className="text-[10px] text-slate-350">·</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium border border-slate-200/50">
                          {c.completion_type || '기타'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: barColor }}>
                        {c.rate.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{c.enrolled}/{c.capacity}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(c.rate, 100)}%`, background: barColor }}
                    />
                  </div>
                </div>
              )
            })}
            {top5Courses.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">수강률 데이터가 없습니다</p>
            )}
          </div>
        </div>

        {/* ── 2B. 담당 교수 현황 ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-700">담당 교수 현황</h3>
          </div>

          {/* 요약 수치 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-wide">전임 교수</p>
              <p className="text-2xl font-black text-blue-600">{professorData.totalProfessors}<span className="text-sm text-slate-400 font-medium ml-0.5">명</span></p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">1인당 강좌</p>
              <p className="text-2xl font-black text-slate-700">
                {professorData.avgCoursesPerProf.toFixed(1)}<span className="text-sm text-slate-400 font-medium ml-0.5">개</span>
              </p>
            </div>
          </div>

          {/* 교수별 강좌 수 목록 */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">강좌 수 상위 교수</p>
            {professorData.top5.map(({ name, courses: cnt, avgRate }, i) => (
              <div key={name} className="flex items-center gap-3">
                <GraduationCap
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: i === 0 ? '#2563eb' : '#94a3b8' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-700 font-semibold truncate">{name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-medium">{avgRate.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(cnt / (professorData.top5[0]?.courses || 1)) * 100}%`,
                        background: i === 0 ? '#2563eb' : '#3b82f660',
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 shrink-0 w-8 text-right">{cnt}강</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: 학점별 강좌 구성 + 레이더 차트 (학과 프로필) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── 3A. 학점별 강좌 구성 ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700">학점별 강좌 구성</h3>
          </div>

          {/* 학점 배지 가로 나열 */}
          <div className="flex flex-wrap gap-2 mb-5">
            {creditBreakdown.map(({ name, value, pct }, i) => (
              <div
                key={name}
                className="flex flex-col items-center px-4 py-2.5 rounded-xl border"
                style={{ borderColor: `${CREDIT_COLORS[i % CREDIT_COLORS.length]}20`, backgroundColor: `${CREDIT_COLORS[i % CREDIT_COLORS.length]}08` }}
              >
                <span className="text-xl font-black" style={{ color: CREDIT_COLORS[i % CREDIT_COLORS.length] }}>
                  {value}
                </span>
                <span className="text-[10px] font-bold" style={{ color: CREDIT_COLORS[i % CREDIT_COLORS.length] }}>{name}</span>
                <span className="text-[10px] text-slate-400 font-medium">{pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {/* 수평 바 차트 */}
          <div className="space-y-3">
            {creditBreakdown.map(({ name, value, pct }, i) => {
              const color = CREDIT_COLORS[i % CREDIT_COLORS.length]
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-10 shrink-0" style={{ color }}>{name}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-700 flex items-center"
                      style={{ width: `${pct}%`, background: color }}
                    >
                      {pct > 15 && (
                        <span className="text-[9px] font-black text-white ml-2">{pct.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right shrink-0">{value}개</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 3B. 레이더 차트 (학과 프로필) ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-700">학과 프로필 레이더</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">전체 평균 기준 정규화</span>
          </div>

          {compareTarget && (
            <div className="flex items-center gap-3 mb-2 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block" />{department}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" />{compareTarget}</span>
            </div>
          )}

          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
              />
              <Radar
                name={department}
                dataKey="dept"
                stroke="#2563EB"
                fill="#2563EB"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              {compareTarget && compareCourses.length > 0 && (
                <Radar
                  name={compareTarget}
                  dataKey="compare"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const metric = payload[0]?.payload?.metric
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-xl text-slate-800">
                      <p className="text-slate-400 mb-1 font-semibold">{metric}</p>
                      {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.stroke }} className="font-bold">
                          {p.name}: {Number(p.value).toFixed(0)}점
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
            </RadarChart>
          </ResponsiveContainer>

          <p className="text-[10px] text-slate-400 text-center -mt-2 font-medium">
            * 전체 평균 대비 상대적 위치를 0~100으로 표시
          </p>
        </div>
      </div>
    </div>
  )
}
