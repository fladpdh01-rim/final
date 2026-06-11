'use client'

import React, { useState, useMemo } from 'react'
import { ArrowUpDown, Award } from 'lucide-react'

export interface CollegeAnalysisData {
  collegeName: string
  courseCount: number
  totalEnrolled: number
  avgEnrollmentRate: number
}

interface CollegeAnalysisTableProps {
  data: CollegeAnalysisData[]
  onSelectCollege?: (collegeName: string) => void
  loading?: boolean
}

type SortKey = 'courseCount' | 'totalEnrolled' | 'avgEnrollmentRate'
type SortOrder = 'asc' | 'desc'

export default function CollegeAnalysisTable({
  data,
  onSelectCollege,
  loading = false,
}: CollegeAnalysisTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('courseCount')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let valA = a[sortKey]
      let valB = b[sortKey]

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0
      }
    })
    return sorted.slice(0, 10) // 상위 10개만 노출
  }, [data, sortKey, sortOrder])

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm w-full mt-6">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-800">대학(원)별 강좌 분석 요약 (TOP 10)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-lg">순위</th>
              <th className="py-3 px-4">대학(원)명</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => handleSort('courseCount')}
              >
                <div className="flex items-center gap-1.5">
                  강좌 수
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => handleSort('totalEnrolled')}
              >
                <div className="flex items-center gap-1.5">
                  총 수강인원
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors rounded-r-lg"
                onClick={() => handleSort('avgEnrollmentRate')}
              >
                <div className="flex items-center gap-1.5">
                  평균 수강률
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 w-6 bg-slate-100 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-14 bg-slate-100 rounded" /></td>
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => {
                const rank = index + 1
                return (
                  <tr
                    key={row.collegeName}
                    className="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 cursor-pointer transition-all duration-200 group"
                    style={{
                      animation: 'fadeInRow 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${index * 40}ms`,
                    }}
                    onClick={() => onSelectCollege?.(row.collegeName)}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                      {rank}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {row.collegeName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{row.courseCount.toLocaleString()}개</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{row.totalEnrolled.toLocaleString()}명</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {row.avgEnrollmentRate.toFixed(1)}%
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

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
