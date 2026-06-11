'use client'

import React, { useMemo } from 'react'
import { BookOpen, TrendingUp, Users, Layers } from 'lucide-react'
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

interface LiberalArtsOverviewProps {
  courses: CourseRawData[]
  loading?: boolean
}

const LIBERAL_TYPES = [
  {
    key: '기초교양',
    label: '기초교양',
    desc: '학문의 기초 · 기초과학',
    color: '#2563EB', // blue-600
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  {
    key: '핵심교양',
    label: '핵심교양',
    desc: '인문 · 사회 · 자연 영역',
    color: '#6366F1', // indigo-500
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
  },
  {
    key: '심화교양',
    label: '심화교양',
    desc: '융합 · 심화 전공연계',
    color: '#F59E0B', // amber-500
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-blue-600 font-bold">
          평균 수강인원: {payload[0].value.toFixed(1)}명
        </p>
      </div>
    )
  }
  return null
}

export default function LiberalArtsOverview({ courses, loading }: LiberalArtsOverviewProps) {
  const stats = useMemo(() => {
    return LIBERAL_TYPES.map(({ key }) => {
      const subset = courses.filter((c) => c.completion_type === key)
      const count = subset.length
      const enrolled = subset.reduce((s, c) => s + (c.enrolled || 0), 0)
      const validRate = subset.filter((c) => c.capacity && c.capacity > 0)
      const avgRate =
        validRate.length > 0
          ? validRate.reduce((s, c) => s + ((c.enrolled || 0) / c.capacity) * 100, 0) /
            validRate.length
          : 0
      const avgEnrolled = count > 0 ? enrolled / count : 0
      return { key, count, enrolled, avgRate, avgEnrolled }
    })
  }, [courses])

  const totalCount = courses.length

  const chartData = useMemo(
    () =>
      LIBERAL_TYPES.map((t, i) => ({
        name: t.label,
        value: parseFloat((stats[i]?.avgEnrolled ?? 0).toFixed(1)),
        color: t.color,
      })),
    [stats]
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-32 border border-slate-100 shadow-sm" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 상단 타이틀 */}
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          교양 유형별 현황 개요
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── 3개 유형 카드 ── */}
        {LIBERAL_TYPES.map((type, i) => {
          const s = stats[i]
          const pct = totalCount > 0 ? ((s.count / totalCount) * 100).toFixed(1) : '0.0'
          return (
            <div
              key={type.key}
              className={`bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col gap-3 hover:translate-y-[-2px] transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${type.bg} ${type.text} border ${type.border}`}>
                  {type.label}
                </div>
                <span className="text-xs text-slate-400">{type.desc}</span>
              </div>

              {/* 강좌 수 */}
              <div className="flex flex-col gap-0.5">
                <span className="text-3xl font-extrabold text-slate-800">
                  {s.count.toLocaleString()}
                  <span className="text-base font-medium text-slate-400 ml-1">개</span>
                </span>
                <span className={`text-xs font-semibold ${type.text}`}>
                  전체 교양의 {pct}%
                </span>
              </div>

              {/* 메트릭 행 */}
              <div className="flex gap-4 pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">수강인원</span>
                  <span className="text-sm font-bold text-slate-700">
                    {s.enrolled.toLocaleString()}명
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">평균수강률</span>
                  <span className={`text-sm font-bold ${type.text}`}>
                    {s.avgRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">평균인원</span>
                  <span className="text-sm font-bold text-slate-700">
                    {s.avgEnrolled.toFixed(1)}명
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {/* ── 유형별 평균 수강인원 차트 카드 ── */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              유형별 평균 수강인원
            </span>
          </div>
          <div className="flex-1 min-h-[100px]">
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
