'use client'

import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts'

interface DistributionItem {
  name: string
  value: number // 실제 강좌 수
  percentage: number // 백분율
}

interface DistributionChartsProps {
  teachingMethodData: DistributionItem[]
  creditData: DistributionItem[]
  totalCourses: number
  loading?: boolean
}

// 커스텀 툴팁
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-sm font-semibold text-slate-800 mb-1">{data.name}</p>
        <p className="text-sm text-blue-600 font-bold">
          {data.value.toLocaleString()}개 ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    )
  }
  return null
}

// 커스텀 범례 렌더러 (오른쪽에 퍼센트와 함께 표시)
const renderCustomLegend = (value: string, entry: any) => {
  const { payload } = entry
  const percent = payload?.percentage ? `${payload.percentage.toFixed(1)}%` : ''
  return (
    <span className="text-sm font-semibold text-slate-700 ml-2">
      {value} <span className="text-slate-400 font-normal">({percent})</span>
    </span>
  )
}

export default function DistributionCharts({
  teachingMethodData,
  creditData,
  totalCourses,
  loading = false,
}: DistributionChartsProps) {
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

  // 파랑, 노랑, 보라, 청록 계열의 HSL 테일러드 컬러 팔레트
  const COLORS = ['#2563EB', '#F59E0B', '#6366F1', '#14B8A6', '#8B5CF6', '#10B981']

  const renderDonutChart = (
    data: DistributionItem[],
    title: string,
    totalLabel: string
  ) => {
    if (loading) {
      return (
        <div className="h-[300px] w-full flex items-center justify-center gap-8 py-4 px-2 select-none animate-pulse">
          {/* Donut circle skeleton */}
          <div className="relative w-40 h-40 rounded-full border-[18px] border-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-2 bg-slate-100 rounded mb-1" />
              <div className="w-12 h-3.5 bg-slate-100 rounded" />
            </div>
          </div>
          {/* Legend skeleton */}
          <div className="flex flex-col gap-3 w-32">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                <div className="flex-1 h-3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="relative h-[300px] w-full">
        {/* 중앙 텍스트 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ left: '-30%' }}>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {totalLabel}
          </span>
          <span className="text-2xl font-extrabold text-slate-800 mt-0.5">
            {totalCourses.toLocaleString()}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="35%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={animationsEnabled}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={renderCustomLegend}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ right: 10 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
      {/*  수업방법 유형 분포 */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-800 mb-6">수업방법 유형 분포</h3>
        {renderDonutChart(teachingMethodData, '수업방법 유형 분포', 'TOTAL')}
      </div>

      {/* 학점 구성 비율 */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-800 mb-6">학점 구성 비율</h3>
        {renderDonutChart(creditData, '학점 구성 비율', 'TOTAL')}
      </div>
    </div>
  )
}
