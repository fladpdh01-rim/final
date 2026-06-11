/**
 * 교양 과목 필터링 유틸리티
 *
 * 교양 과목 판단 기준:
 * 1. completion_type 이 '기초교양', '핵심교양', '심화교양' 중 하나
 * 2. 또는 college 가 '교양'
 */

export const LIBERAL_ARTS_COMPLETION_TYPES = ['기초교양', '핵심교양', '심화교양'] as const
export const LIBERAL_ARTS_COLLEGES = ['교양'] as const

export type LiberalArtsCompletionType = (typeof LIBERAL_ARTS_COMPLETION_TYPES)[number]

/**
 * 주어진 과목이 교양 과목인지 확인합니다.
 */
export function isLiberalArtsCourse(course: {
  completion_type?: string
  college?: string
}): boolean {
  if (!course) return false

  // 1. completion_type 기준
  if (
    course.completion_type &&
    (LIBERAL_ARTS_COMPLETION_TYPES as readonly string[]).includes(course.completion_type)
  ) {
    return true
  }

  // 2. college 기준 (college 자체가 '교양'인 경우)
  if (
    course.college &&
    (LIBERAL_ARTS_COLLEGES as readonly string[]).includes(course.college)
  ) {
    return true
  }

  return false
}

/**
 * 교양 이수구분의 한글 레이블 매핑 (차트/뱃지 표시용)
 */
export const COMPLETION_TYPE_LABEL: Record<string, string> = {
  기초교양: '기초교양',
  핵심교양: '핵심교양',
  심화교양: '심화교양',
}

/**
 * 이수구분별 강조 색상
 */
export const COMPLETION_TYPE_COLOR: Record<string, string> = {
  기초교양: '#3ECF8E',
  핵심교양: '#5B8DEF',
  심화교양: '#F4A261',
}
