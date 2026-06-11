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
} from 'recharts'

interface ChartDataItem {
  name: string
  value: number
}

interface CompletionTypeChartsProps {
  courseCountData: ChartDataItem[]
  avgEnrolledData: ChartDataItem[]
  loading?: boolean
}

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-sm font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-sm text-blue-600 font-bold">
          {payload[0].value.toLocaleString()}
          {unit}
        </p>
      </div>
    )
  }
  return null
}

// 교양 이수구분 전용 색상 매핑 (파란색, 노란색 계열 강조)
const LIBERAL_ARTS_COLORS: Record<string, string> = {
  기초교양: '#2563EB', // 진한 파랑
  핵심교양: '#3B82F6', // 밝은 파랑
  심화교양: '#F59E0B', // 노랑/황색
}

interface CompletionTypeChartsExtProps extends CompletionTypeChartsProps {
  /** 외부에서 색상 오버라이드 (이름 → 색상) */
  highlightColors?: Record<string, string>
}

export default function CompletionTypeCharts({
  courseCountData,
  avgEnrolledData,
  loading = false,
  highlightColors,
}: CompletionTypeChartsExtProps) {
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

  const defaultColors = ['#2563EB', '#3B82F6', '#F59E0B', '#1D4ED8', '#EAB308']

  const renderChart = (data: ChartDataItem[], title: string, unit: string) => {
    if (loading) {
      return (
        <div className="h-[300px] w-full flex flex-col justify-between py-4 px-2 select-none">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 w-full animate-pulse">
              <div className="w-14 h-3 bg-slate-100 rounded shrink-0" />
              <div
                className="h-3.5 bg-slate-100 rounded-r"
                style={{
                  width: `${[80, 60, 45, 30, 15][idx]}%`,
                  opacity: 1 - idx * 0.15,
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
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
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
              width={70}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={animationsEnabled}>
              {data.map((entry, index) => {
                // 1) 외부 오버라이드 → 2) 교양 3종 고유색 → 3) 기본 팔레트
                const color =
                  (highlightColors && highlightColors[entry.name]) ??
                  LIBERAL_ARTS_COLORS[entry.name] ??
                  defaultColors[index % defaultColors.length]
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
      {/* 왼쪽: 이수구분별 강좌 수 */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-800 mb-6">이수구분별 강좌 수</h3>
        {renderChart(courseCountData, '이수구분별 강좌 수', '개')}
      </div>

      {/* 오른쪽: 이수구분별 평균 수강인원 */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-800 mb-6">이수구분별 평균 수강인원</h3>
        {renderChart(avgEnrolledData, '이수구분별 평균 수강인원', '명')}
      </div>
    </div>
  )
}
