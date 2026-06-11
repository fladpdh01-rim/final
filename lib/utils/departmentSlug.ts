/**
 * 학과명 ↔ URL-safe slug 변환 유틸리티
 *
 * 전략: encodeURIComponent로 한글 인코딩 → URL 세그먼트에 안전하게 사용.
 * Next.js는 [slug] 라우팅에서 %XX 인코딩된 세그먼트를 디코딩하여 params로 전달하므로
 * decodeURIComponent만 하면 원래 학과명 복원 가능.
 */

import coursesJson from '@/lib/data/courses.json'

/** 학과명을 URL slug로 변환 */
export function departmentToSlug(department: string): string {
  return encodeURIComponent(department)
}

/** URL slug를 학과명으로 복원 */
export function slugToDepartment(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

/** courses.json에서 (college, department) 쌍의 고유 목록을 반환 */
export function getAllDepartments(): { college: string; department: string }[] {
  const seen = new Set<string>()
  const result: { college: string; department: string }[] = []

  ;(coursesJson as { college?: string; department?: string }[]).forEach((c) => {
    if (!c.college || !c.department) return
    const key = `${c.college}||${c.department}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ college: c.college, department: c.department })
    }
  })

  return result.sort((a, b) =>
    a.college.localeCompare(b.college, 'ko') || a.department.localeCompare(b.department, 'ko')
  )
}
