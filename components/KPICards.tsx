'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen, Users, Percent, Globe } from 'lucide-react'

interface KPICardsProps {
  totalCourses: number
  totalEnrolled: number
  avgEnrollmentRate: number
  foreignLanguageRatio: number
  loading?: boolean
}

// 카운트업 애니메이션 컴포넌트
function CountUp({
  value,
  duration = 1000,
  formatter,
}: {
  value: number
  duration?: number
  formatter: (v: number) => string
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // 애니메이션 끄기 옵션 감지
    const noAnimations =
      typeof document !== 'undefined' && document.body.classList.contains('no-animations')

    if (noAnimations) {
      setCount(value)
      return
    }

    let start = 0
    const end = value
    if (start === end) {
      setCount(end)
      return
    }

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // easeOutQuad
      const easeProgress = progress * (2 - progress)
      const currentVal = start + (end - start) * easeProgress
      setCount(currentVal)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{formatter(count)}</>
}

export default function KPICards({
  totalCourses,
  totalEnrolled,
  avgEnrollmentRate,
  foreignLanguageRatio,
  loading = false,
}: KPICardsProps) {
  // 애니메이션 수신 리스너 (설정 변경 시 즉시 리셋)
  const [animationKey, setAnimationKey] = useState(0)
  useEffect(() => {
    const handleToggle = () => setAnimationKey((k) => k + 1)
    window.addEventListener('animations-toggle', handleToggle)
    return () => window.removeEventListener('animations-toggle', handleToggle)
  }, [])

  const cards = [
    {
      label: '총 강좌 수',
      rawVal: totalCourses,
      formatter: (v: number) => `${Math.floor(v).toLocaleString()}개`,
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      borderColor: 'hover:border-blue-300',
      glow: 'shadow-blue-100/50',
      topBorder: 'border-t-blue-600',
    },
    {
      label: '총 수강인원',
      rawVal: totalEnrolled,
      formatter: (v: number) => `${Math.floor(v).toLocaleString()}명`,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      borderColor: 'hover:border-indigo-300',
      glow: 'shadow-indigo-100/50',
      topBorder: 'border-t-indigo-600',
    },
    {
      label: '평균 수강률',
      rawVal: avgEnrollmentRate,
      formatter: (v: number) => `${v.toFixed(1)}%`,
      icon: Percent,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
      glow: 'shadow-amber-100/50',
      topBorder: 'border-t-amber-500',
    },
    {
      label: '원어강의 비율',
      rawVal: foreignLanguageRatio,
      formatter: (v: number) => `${v.toFixed(1)}%`,
      icon: Globe,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      borderColor: 'hover:border-teal-300',
      glow: 'shadow-teal-100/50',
      topBorder: 'border-t-teal-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {cards.map((card, idx) => {
        const IconComponent = card.icon
        return (
          <div
            key={idx}
            className={`bg-white border border-slate-200/80 ${card.topBorder} border-t-4 rounded-xl p-6 flex items-center justify-between shadow-sm hover:translate-y-[-4px] hover:shadow-md transition-all duration-300 ease-out`}
            style={{
              animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
              animationDelay: `${idx * 80}ms`,
            }}
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                {card.label}
              </span>
              {loading ? (
                <div className="h-8 w-28 bg-slate-100 rounded animate-pulse mt-1" />
              ) : (
                <span className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
                  <CountUp
                    key={`${animationKey}-${card.rawVal}`}
                    value={card.rawVal}
                    formatter={card.formatter}
                  />
                </span>
              )}
            </div>
            <div
              className={`p-3.5 rounded-xl ${card.bg} transition-transform duration-300 hover:rotate-12`}
            >
              <IconComponent className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .no-animations * {
          animation: none !important;
          transition: none !important;
        }
      `}</style>
    </div>
  )
}
