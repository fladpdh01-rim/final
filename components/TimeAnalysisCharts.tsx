'use client'

import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  LabelList,
} from 'recharts'

interface ChartDataItem {
  name: string
  value: number
}

interface TimeAnalysisChartsProps {
  dayOfWeekData: ChartDataItem[]
  periodData: ChartDataItem[]
  loading?: boolean
}

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-sm font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-sm text-blue-600 font-bold">
          {payload[0].value.toLocaleString()}개 강좌
        </p>
      </div>
    )
  }
  return null
}

export default function TimeAnalysisCharts({
  dayOfWeekData,
  periodData,
  loading = false,
}: TimeAnalysisChartsProps) {
  const [animationsEnabled, setAnimationsEnabled] = React.useState(true)

  React.useEffect(() => {
    const checkAnimations = () => {
      const disabled = typeof document !== 'undefined' && document.body.classList.contains('no-animations')
      setAnimationsEnabled(!disabled)
    }
    checkAnimations()
    window.addEventListener('animations-toggle', checkAnimations)
    return () => window.removeEventListener('animations-toggle', checkAnimations)
  }, [])

  // 요일별 고유 색상 매핑 (파랑, 노랑 등 디자인 테마 반영)
  const dayColors: { [key: string]: string } = {
    월: '#3B82F6', // 파랑
    화: '#2563EB', // 진한 파랑
    수: '#F59E0B', // 노랑/황색
    목: '#6366F1', // 남색
    금: '#14B8A6', // 청록
    토: '#8B5CF6', // 보라
    일: '#EF4444', // 빨강
  }

  // 가장 많은 시간대 찾기 (강조용)
  const maxPeriodValue = periodData.length > 0 ? Math.max(...periodData.map((d) => d.value)) : 0

  const renderDayChart = () => {
    if (loading) {
      return (
        <div className="h-[300px] w-full flex flex-col justify-between py-4 px-2 select-none animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 w-full">
              <div className="w-10 h-3 bg-slate-100 rounded shrink-0" />
              <div
                className="h-3.5 bg-slate-100 rounded-r"
                style={{
                  width: `${[55, 75, 80, 70, 45, 10][idx]}%`,
                  opacity: 1 - idx * 0.12,
                }}
              />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dayOfWeekData}
            layout="vertical"
            margin={{ top: 15, right: 40, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
            <XAxis type="number" stroke="#64748B" fontSize={12} tickLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={animationsEnabled}>
              {dayOfWeekData.map((entry, index) => {
                const color = dayColors[entry.name] || '#3B82F6'
                return <Cell key={`cell-${index}`} fill={color} />
              })}
              <LabelList dataKey="value" position="right" fill="#475569" fontSize={11} offset={8} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderPeriodChart = () => {
    if (loading) {
      return (
        <div className="h-[300px] w-full flex flex-col justify-between py-4 px-2 select-none animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 w-full">
              <div className="w-12 h-3 bg-slate-100 rounded shrink-0" />
              <div
                className="h-3.5 bg-slate-100 rounded-r"
                style={{
                  width: `${[40, 60, 85, 75, 45, 20][idx]}%`,
                  opacity: 1 - idx * 0.12,
                }}
              />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={periodData}
            layout="vertical"
            margin={{ top: 15, right: 40, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
            <XAxis type="number" stroke="#64748B" fontSize={12} tickLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={animationsEnabled}>
              {periodData.map((entry, index) => {
                const isMax = entry.value === maxPeriodValue && maxPeriodValue > 0
                return <Cell key={`cell-${index}`} fill={isMax ? '#F59E0B' : '#3B82F6'} opacity={isMax ? 1 : 0.4} />
              })}
              <LabelList dataKey="value" position="right" fill="#475569" fontSize={11} offset={8} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
      {/* 요일별 수업 강좌 수 */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-800 mb-6">요일별 수업 강좌 수</h3>
        {renderDayChart()}
      </div>

      {/* 수업 시간별 강좌 수 */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-800 mb-6">수업 시간별 강좌 수</h3>
        {renderPeriodChart()}
      </div>
    </div>
  )
}
