import { google } from '@ai-sdk/google'
import { streamText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const { courses, college, department, dashboardType } = await request.json()

  const scopeLabel =
    department
      ? `${college} ${department}`
      : college
      ? college
      : '전체 (인천대학교 2026학년도 1학기)'

  const isLiberal = dashboardType === 'liberal'

  // ── 집계 계산 ──────────────────────────────────────────────────────
  const total = courses.length
  const totalEnrolled = courses.reduce((s: number, c: { enrolled?: number }) => s + (c.enrolled || 0), 0)
  const validRateCourses = courses.filter((c: { capacity?: number }) => c.capacity && c.capacity > 0)
  const avgRate =
    validRateCourses.length > 0
      ? validRateCourses.reduce(
          (s: number, c: { enrolled?: number; capacity?: number }) =>
            s + ((c.enrolled || 0) / c.capacity!) * 100,
          0
        ) / validRateCourses.length
      : 0
  const foreignCount = courses.filter((c: { is_foreign_language?: boolean }) => c.is_foreign_language).length

  // 이수구분별 집계 (강좌 수 및 평균 수강인원)
  const typeAggs: Record<string, { count: number; enrolled: number }> = {}
  courses.forEach((c: { completion_type?: string; enrolled?: number }) => {
    const t = c.completion_type || '기타'
    if (!typeAggs[t]) typeAggs[t] = { count: 0, enrolled: 0 }
    typeAggs[t].count += 1
    typeAggs[t].enrolled += c.enrolled || 0
  })
  const typesSummary = Object.entries(typeAggs)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([k, v]) => `${k}: ${v.count}개 (평균 수강인원 ${v.count > 0 ? (v.enrolled / v.count).toFixed(1) : 0}명)`)
    .join(', ')

  // 수업방법별 집계
  const methodCounts: Record<string, number> = {}
  courses.forEach((c: { teaching_method?: string }) => {
    const m = c.teaching_method || '기타'
    methodCounts[m] = (methodCounts[m] || 0) + 1
  })
  const methodSummary = Object.entries(methodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}개`)
    .join(', ')

  // 학점별 집계
  const creditCounts: Record<number, number> = {}
  courses.forEach((c: { credit?: number }) => {
    const cr = c.credit || 0
    creditCounts[cr] = (creditCounts[cr] || 0) + 1
  })
  const creditSummary = Object.entries(creditCounts)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([k, v]) => `${k}학점: ${v}개`)
    .join(', ')

  // 요일별/시간대별 집계
  const dayCounts: Record<string, number> = {}
  const periodCounts: Record<string, number> = {}
  courses.forEach((c: { time_slots?: string[] }) => {
    if (Array.isArray(c.time_slots)) {
      c.time_slots.forEach((slot: string) => {
        const day = slot?.[0]
        const period = slot?.substring(1)
        if (day) dayCounts[day] = (dayCounts[day] || 0) + 1
        if (period) periodCounts[`${period}교시`] = (periodCounts[`${period}교시`] || 0) + 1
      })
    }
  })
  const daySummary = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}개`)
    .join(', ')
  const periodSummary = Object.entries(periodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}개`)
    .join(', ')

  const today = '2026년 6월 8일' // 예시와 동일한 날짜 고정 (필요시 new Date() 사용)
  
  const prompt = `당신은 대학 교육과정 데이터를 분석하는 전문 AI 분석가입니다.
아래는 인천대학교 2026학년도 1학기 강좌 데이터 집계 결과입니다.
분석 대상: ${scopeLabel}

【데이터 요약】
- 총 강좌 수: ${total.toLocaleString()}개
- 총 수강 인원: ${totalEnrolled.toLocaleString()}명
- 평균 수강률: ${avgRate.toFixed(1)}%
- 원어(외국어) 강의 수: ${foreignCount}개 (${total > 0 ? ((foreignCount / total) * 100).toFixed(1) : 0}%)
- 이수구분별 강좌 수: ${typesSummary || '데이터 없음'}
- 수업방식: ${methodSummary || '데이터 없음'}
- 학점 구성: ${creditSummary || '데이터 없음'}
- 요일별 강좌 배치: ${daySummary || '데이터 없음'}
- 시간대별 강좌 배치: ${periodSummary || '데이터 없음'}

위 데이터를 바탕으로 반드시 아래의 형식과 완전히 동일하게(마크다운 포함) 한국어 보고서를 작성해 주세요. 
중괄호 { }로 표시된 부분은 실제 분석한 내용과 데이터 수치로 채워주시고, 개선 아이디어 항목들의 내용은 데이터에 맞게 적절히 변형해도 됩니다. 단, 전체적인 구조와 볼드체 등 마크다운 양식은 그대로 유지해야 합니다.

=== AI 강의 데이터 분석 보고서 ===
분석 대상: ${scopeLabel}
일자: ${today}
작성 모델: Gemini 3.1 Flash-Lite

# [분석 보고서] ${scopeLabel} 교육과정 및 강좌 운영 분석

**작성일:** ${today}
**분석 대상:** 인천대학교 ${scopeLabel} 2026학년도 1학기 강좌 데이터

---

## 1. 데이터 요약
- **강좌 규모:** 총 {N}개 강좌 운영
- **수강 규모:** 총 {N}명 수강, **평균 수강율 {N}%**
- **글로벌 역량:** 원어(영어) 강의 비율 **{N}%**

---

## 2. 주요 특징 및 트렌드 분석

### 1) 이수구분 및 학점 구성 특성
- **이수구분별 불균형:** '{카테고리}' 강좌가 {N}개(전체 대비 약 {N}%)로 가장 높은 비중
- **평균 수강인원:** '{카테고리}'의 평균 수강인원이 {N}명으로 가장 높음
- **학점 구성:** {N}학점 강좌가 **{N}%**로 절대다수 차지

### 2) 수업방법 비중 및 시사점
- **대면수업 중심:** 전체 강좌의 **{N}%가 대면수업**으로 운영
- 하이브리드/온라인 수업 비중은 {N}%로 낮은 편

### 3) 요일 및 시간대별 강좌 배치 현황
- **요일 쏠림:** {요일}에 강좌가 가장 많이 배치({N}개), {요일}은 적음({N}개)
- **시간대 쏠림:** {시간대}에 강좌 수가 가장 많음

---

## 3. 문제점 및 개선 아이디어 제언

### [수강율 극대화 및 효율적 운영]
- 평균 수강인원이 높은 강좌는 분반 검토 필요
- 온·오프라인 혼합형(Blended Learning) 도입 고려

### [원어 강의 활성화]
- 현재 {N}% 수준의 원어 강의 비율을 단계적으로 상향
- 교원 인센티브 및 학생 수강 우선권 제공

### [요일/시간대 분산 전략]
- 특정 요일/시간대 쏠림 현상 완화
- 데이터 기반 시간표 최적화 시스템 도입

---
*본 보고서는 2026학년도 1학기 학사 운영의 효율성을 제고하고, 학생 중심의 최적화된 교육 환경을 마련하기 위한 기초 자료로 활용되길 바랍니다.*`

  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt,
  })

  return result.toTextStreamResponse()
}
