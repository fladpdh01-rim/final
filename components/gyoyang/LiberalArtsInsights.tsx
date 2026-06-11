'use client'

import React, { useMemo } from 'react'
import { Flame, TrendingUp, BarChart2, Star } from 'lucide-react'
import { CourseRawData } from '@/components/CourseDetailTable'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts'

interface LiberalArtsInsightsProps {
  courses: CourseRawData[]
  loading?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  기초교양: '#2563EB', // blue
  핵심교양: '#6366F1', // indigo
  심화교양: '#F59E0B', // amber yellow
}

const CollegeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill ?? p.color }}>
            {p.name}: {p.value.toFixed(1)}%
          </p>
        ))}
      </div>
    )
  }
  return null
}

const EnrollTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-800 truncate max-w-[200px]">{label}</p>
        <p className="text-blue-600 font-bold">수강인원: {payload[0].value}명</p>
      </div>
    )
  }
  return null
}

export default function LiberalArtsInsights({ courses, loading }: LiberalArtsInsightsProps) {
  // 가장 인기 있는 교양 강좌 TOP 5 (수강인원 기준)
  const top5Courses = useMemo(() => {
    return [...courses]
      .sort((a, b) => (b.enrolled || 0) - (a.enrolled || 0))
      .slice(0, 5)
  }, [courses])

  // 이수구분별 평균 수강률 비교
  const avgRateByType = useMemo(() => {
    return ['기초교양', '핵심교양', '심화교양'].map((type) => {
      const subset = courses.filter((c) => c.completion_type === type && c.capacity && c.capacity > 0)
      const avgRate =
        subset.length > 0
          ? subset.reduce((s, c) => s + ((c.enrolled || 0) / c.capacity) * 100, 0) / subset.length
          : 0
      return { name: type, value: parseFloat(avgRate.toFixed(1)), color: TYPE_COLORS[type] }
    })
  }, [courses])

  // 대학별 이수구분 분포 (레이더 차트용)
  const collegeTypeRate = useMemo(() => {
    // 교양 과목이 5개 이상인 상위 대학만 추출
    const collegeMap: Record<string, Record<string, number>> = {}
    courses.forEach((c) => {
      if (!c.college) return
      if (!collegeMap[c.college]) collegeMap[c.college] = { 기초교양: 0, 핵심교양: 0, 심화교양: 0, total: 0 }
      if (TYPE_COLORS[c.completion_type]) {
        collegeMap[c.college][c.completion_type]++
        collegeMap[c.college].total++
      }
    })

    return Object.entries(collegeMap)
      .filter(([, v]) => v.total >= 5)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([college, counts]) => ({
        college: college.replace('대학', '').replace('기초교육원', '기초교육'),
        기초교양: counts.total > 0 ? parseFloat(((counts['기초교양'] / counts.total) * 100).toFixed(1)) : 0,
        핵심교양: counts.total > 0 ? parseFloat(((counts['핵심교양'] / counts.total) * 100).toFixed(1)) : 0,
        심화교양: counts.total > 0 ? parseFloat(((counts['심화교양'] / counts.total) * 100).toFixed(1)) : 0,
        total: counts.total,
      }))
  }, [courses])

  // 전체 교양 평균 수강률
  const overallAvgRate = useMemo(() => {
    const valid = courses.filter((c) => c.capacity && c.capacity > 0)
    if (valid.length === 0) return 0
    return valid.reduce((s, c) => s + ((c.enrolled || 0) / c.capacity) * 100, 0) / valid.length
  }, [courses])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-64 border border-slate-100 shadow-sm" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* 섹션 라벨 */}
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          교양 특화 인사이트
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ① 인기 교양 강좌 TOP 5 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md flex flex-col gap-4 transition-all">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50">
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">인기 교양 강좌 TOP 5</h3>
            <span className="ml-auto text-[10px] text-slate-400 font-medium">수강인원 기준</span>
          </div>

          <div className="flex flex-col gap-2">
            {top5Courses.map((c, i) => {
              const rate = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0
              const typeColor = TYPE_COLORS[c.completion_type] ?? '#64748b'
              const medals = ['🥇', '🥈', '🥉', '4', '5']
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/50 hover:bg-slate-100/65 transition-all group"
                >
                  <span className="text-sm w-5 shrink-0 text-center font-bold text-slate-400">
                    {medals[i]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={c.course_name}>
                      {c.course_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: typeColor, background: `${typeColor}15` }}
                      >
                        {c.completion_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{c.college}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">{c.enrolled.toLocaleString()}명</p>
                    <p className="text-[10px] font-semibold" style={{ color: rate >= 90 ? '#10B981' : '#64748B' }}>
                      {rate.toFixed(0)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ② 이수구분별 평균 수강률 비교 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md flex flex-col gap-4 transition-all">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">교양 평균 수강률</h3>
          </div>

          {/* 전체 평균 강조 */}
          <div className="text-center py-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 font-bold">교양 전체 평균</p>
            <p className="text-4xl font-black text-slate-800">{overallAvgRate.toFixed(1)}<span className="text-xl text-slate-400 font-medium">%</span></p>
          </div>

          {/* 유형별 막대 */}
          <div className="flex flex-col gap-3">
            {avgRateByType.map(({ name, value, color }) => (
              <div key={name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold" style={{ color }}>{name}</span>
                  <span className="font-bold text-slate-700">{value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(value, 100)}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 인사이트 메모 */}
          <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 leading-relaxed">
            💡 <span className="text-slate-700 font-semibold">심화교양</span>은 대형 강의 특성상 평균 수강인원이 높고, 수강률이 타 유형보다 높은 경향이 있습니다.
          </div>
        </div>

        {/* ③ 대학별 교양 이수구분 분포 */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md flex flex-col gap-4 transition-all">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">대학별 교양 분포</h3>
            <span className="ml-auto text-[10px] text-slate-400 font-medium">상위 8개 대학</span>
          </div>

          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={collegeTypeRate}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                barSize={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={true} horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <YAxis
                  dataKey="college"
                  type="category"
                  stroke="#64748B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip content={<CollegeTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="기초교양" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} name="기초교양" />
                <Bar dataKey="핵심교양" stackId="a" fill="#6366F1" name="핵심교양" />
                <Bar dataKey="심화교양" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} name="심화교양" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-4 justify-center">
            {Object.entries(TYPE_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] text-slate-500 font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
