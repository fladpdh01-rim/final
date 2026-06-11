'use client'

/**
 * useDashboardSelection
 *
 * 대시보드의 선택 상태(대학/학과)를 관리하며,
 * URL 쿼리 파라미터와 양방향 동기화합니다.
 *
 * URL 예시:
 *   /?college=공과대학&dept=컴퓨터공학과
 *   /dashboard/liberal-arts?college=자연과학대학
 *
 * 이를 통해 특정 필터 상태를 공유(링크 복사)할 수 있습니다.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export type SelectionLevel = 'all' | 'college' | 'department'

export interface DashboardSelection {
  /** 선택된 대학(학부) 이름. 미선택이면 '' */
  selectedCollege: string
  /** 선택된 학과 이름. 미선택이면 '' */
  selectedDept: string
  /** 현재 선택 레벨 */
  level: SelectionLevel
  /** 사이드바 onSelect 핸들러 */
  handleSelect: (college: string, department: string) => void
  /** 선택 초기화 */
  reset: () => void
}

export function useDashboardSelection(): DashboardSelection {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // URL에서 초기값 읽기
  const initialCollege = searchParams.get('college') ?? ''
  const initialDept = searchParams.get('dept') ?? ''

  const [selectedCollege, setSelectedCollege] = useState(initialCollege)
  const [selectedDept, setSelectedDept] = useState(initialDept)

  // ── URL 변경 → 상태 동기화 (브라우저 뒤로가기 대응) ───────────────
  useEffect(() => {
    const college = searchParams.get('college') ?? ''
    const dept = searchParams.get('dept') ?? ''
    setSelectedCollege(college)
    setSelectedDept(dept)
  }, [searchParams])

  // ── 상태 변경 → URL 동기화 ────────────────────────────────────────
  const syncUrl = useCallback(
    (college: string, dept: string) => {
      const params = new URLSearchParams()
      if (college) params.set('college', college)
      if (dept) params.set('dept', dept)
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [router, pathname]
  )

  // ── 사이드바 선택 핸들러 ──────────────────────────────────────────
  const handleSelect = useCallback(
    (college: string, department: string) => {
      setSelectedCollege(college)
      setSelectedDept(department)
      syncUrl(college, department)
    },
    [syncUrl]
  )

  // ── 초기화 ───────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setSelectedCollege('')
    setSelectedDept('')
    syncUrl('', '')
  }, [syncUrl])

  // ── 선택 레벨 ─────────────────────────────────────────────────────
  const level: SelectionLevel = useMemo(() => {
    if (selectedDept) return 'department'
    if (selectedCollege) return 'college'
    return 'all'
  }, [selectedCollege, selectedDept])

  return { selectedCollege, selectedDept, level, handleSelect, reset }
}
