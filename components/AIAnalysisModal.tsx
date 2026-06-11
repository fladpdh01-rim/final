'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { X, Sparkles, Brain, Copy, Check, RefreshCw, Loader2, Database, FileText, BarChart2, Lightbulb } from 'lucide-react'

interface AIAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  courses: Record<string, unknown>[]
  college: string
  department: string
  dashboardType?: 'main' | 'liberal'
}

// 간단한 마크다운 → HTML 변환 (의존성 없이)
function renderMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (m) => `<pre class="ai-code">${m.replace(/```/g, '')}</pre>`)
    .replace(/^# (.+)$/gm, '<h1 class="ai-h1">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="ai-h2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="ai-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---+$/gm, '<hr class="ai-hr" />')
    .replace(/^\* (.+)$/gm, '<li class="ai-li">$1</li>')
    .replace(/^- (.+)$/gm, '<li class="ai-li">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="ai-ul">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="ai-p">')
    .replace(/^(?!<[a-z])(.+)$/gm, '<p class="ai-p">$1</p>')
}

// 로딩 단계 정의
const LOADING_STEPS = [
  { icon: Database,    label: '강좌 데이터 수집 중',     detail: '강좌·수강 인원·학점 정보 로딩', delay: 0    },
  { icon: BarChart2,  label: '통계 지표 계산 중',        detail: '이수구분·수업방식·시간대 집계',   delay: 2500 },
  { icon: Brain,      label: 'AI 보고서 생성 중',        detail: 'Gemini가 분석 보고서를 작성 중', delay: 5000 },
  { icon: FileText,   label: '결과를 정리하는 중',       detail: '항목별 분류 및 제언 도출',        delay: 8000 },
  { icon: Lightbulb,  label: '개선 아이디어 도출 중',    detail: '데이터 기반 인사이트 생성',       delay: 12000 },
]

/** 경과 시간을 "0:00" 포맷으로 변환 */
function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function AIAnalysisModal({
  isOpen,
  onClose,
  courses,
  college,
  department,
  dashboardType = 'main',
}: AIAnalysisModalProps) {
  const [copied, setCopied] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0)
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scopeLabel =
    department ? `${college} ${department}` : college ? college : '전체 (인천대학교 2026학년도 1학기)'

  const { completion, complete, isLoading, error, stop } = useCompletion({
    api: '/api/analyze',
    streamProtocol: 'text',
  })

  // ── 로딩 시작 시 단계 타이머 설정 ──────────────────────────────
  const startLoadingTimers = () => {
    startTimeRef.current = Date.now()
    setActiveStep(0)
    setElapsed(0)

    // 단계 타이머
    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = LOADING_STEPS.map((step, i) =>
      setTimeout(() => setActiveStep(i), step.delay)
    )

    // 경과 시간 인터벌
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    elapsedTimerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 500)
  }

  const clearLoadingTimers = () => {
    stepTimersRef.current.forEach(clearTimeout)
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
  }

  // 로딩 완료 시 인터벌 정리
  useEffect(() => {
    if (!isLoading) clearLoadingTimers()
  }, [isLoading])

  // 모달 열릴 때 자동 분석 시작
  useEffect(() => {
    if (isOpen && courses.length > 0) {
      startLoadingTimers()
      complete('', { body: { courses, college, department, dashboardType } })
    }
    return () => { if (!isOpen) clearLoadingTimers() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => () => clearLoadingTimers(), [])

  // 스크롤 자동 내리기
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [completion])

  const handleRetry = () => {
    startLoadingTimers()
    complete('', { body: { courses, college, department, dashboardType } })
  }

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(completion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [completion])

  // ESC 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const showLoader = isLoading && !completion

  return (
    <>
      <style>{`
        .ai-h1 { font-size: 1.35rem; font-weight: 900; color: #1e3a8a; margin: 1.2rem 0 0.5rem; line-height: 1.3; }
        .ai-h2 { font-size: 1.1rem; font-weight: 800; color: #2563eb; margin: 1rem 0 0.4rem; border-left: 3px solid #3b82f6; padding-left: 0.6rem; }
        .ai-h3 { font-size: 0.95rem; font-weight: 700; color: #1e40af; margin: 0.8rem 0 0.3rem; }
        .ai-p { margin: 0.3rem 0; line-height: 1.75; color: #334155; font-size: 0.9rem; }
        .ai-bold { color: #0f172a; font-weight: 700; }
        .ai-hr { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
        .ai-ul { margin: 0.4rem 0 0.4rem 1rem; padding: 0; list-style: none; }
        .ai-li { position: relative; padding-left: 1rem; margin: 0.3rem 0; color: #475569; font-size: 0.88rem; line-height: 1.7; }
        .ai-li::before { content: "▸"; position: absolute; left: 0; color: #2563eb; font-size: 0.75rem; top: 0.15rem; }
        .ai-code { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.8rem; font-size: 0.82rem; color: #1e293b; white-space: pre-wrap; margin: 0.5rem 0; }

        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .ai-cursor { display: inline-block; width: 2px; height: 1em; background: #2563eb; animation: cursor-blink 1s step-end infinite; margin-left: 2px; vertical-align: text-bottom; }

        /* 오비탈 스피너 */
        @keyframes orbit { from { transform: rotate(0deg) translateX(28px) rotate(0deg); } to { transform: rotate(360deg) translateX(28px) rotate(-360deg); } }
        @keyframes orbit2 { from { transform: rotate(120deg) translateX(28px) rotate(-120deg); } to { transform: rotate(480deg) translateX(28px) rotate(-480deg); } }
        @keyframes orbit3 { from { transform: rotate(240deg) translateX(28px) rotate(-240deg); } to { transform: rotate(600deg) translateX(28px) rotate(-600deg); } }
        .orb1 { animation: orbit 2s linear infinite; }
        .orb2 { animation: orbit2 2s linear infinite; }
        .orb3 { animation: orbit3 2s linear infinite; }

        /* 파동 링 */
        @keyframes ripple { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        .ripple1 { animation: ripple 2s ease-out infinite; }
        .ripple2 { animation: ripple 2s ease-out infinite 0.7s; }

        /* 단계 항목 */
        @keyframes step-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        .step-active { animation: step-in 0.35s ease forwards; }

        /* 진행 바 */
        @keyframes progress-fill { from{width:0%} to{width:var(--target-w)} }
        .progress-bar { animation: progress-fill 0.6s ease forwards; }

        /* 도트 점멸 */
        @keyframes dot-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        .dot1 { animation: dot-bounce 1.4s infinite 0s; }
        .dot2 { animation: dot-bounce 1.4s infinite 0.2s; }
        .dot3 { animation: dot-bounce 1.4s infinite 0.4s; }
      `}</style>

      {/* 딤 오버레이 */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* 모달 박스 */}
        <div
          className="relative flex flex-col w-full max-w-3xl rounded-2xl border shadow-2xl bg-white border-slate-200 overflow-hidden"
          style={{
            maxHeight: '85vh',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── 헤더 ── */}
          <div className="relative flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800 text-base">AI 강의 분석</h2>
                  {isLoading && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                      분석 중
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 text-slate-500">
                  분석 대상: <span className="text-blue-600 font-semibold">{scopeLabel}</span>
                  {' · '}총 {courses.length.toLocaleString()}개 강좌
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {completion && !isLoading && (
                <button onClick={handleCopy} title="클립보드에 복사"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                  style={{
                    color: copied ? '#059669' : undefined,
                    borderColor: copied ? '#a7f3d0' : undefined,
                    backgroundColor: copied ? '#ecfdf5' : undefined,
                  }}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '복사됨' : '복사'}
                </button>
              )}
              {!isLoading && (
                <button onClick={handleRetry} title="다시 분석"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5" />재분석
                </button>
              )}
              {isLoading && (
                <button onClick={stop}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700 shadow-sm">
                  중지
                </button>
              )}
              <button onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 transition-all hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 본문 ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 bg-white" style={{ minHeight: 0 }}>

            {/* ════════════════════ 로딩 UI ════════════════════ */}
            {showLoader && (
              <div className="flex flex-col items-center justify-center py-8 gap-8">

                {/* 오비탈 스피너 */}
                <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
                  {/* 파동 링 */}
                  <div className="absolute inset-0 rounded-full border border-blue-500/20 ripple1" />
                  <div className="absolute inset-0 rounded-full border border-blue-400/10 ripple2" />

                  {/* 중앙 아이콘 */}
                  <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 border border-blue-200">
                    <Sparkles className="w-7 h-7 text-blue-600" />
                  </div>

                  {/* 오비탈 점 3개 */}
                  {['orb1', 'orb2', 'orb3'].map((cls, i) => (
                    <div key={i} className={`absolute ${cls}`} style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}>
                      <div className="w-2 h-2 rounded-full"
                        style={{ background: i === 0 ? '#2563eb' : i === 1 ? '#3b82f6' : '#60a5fa' }} />
                    </div>
                  ))}
                </div>

                {/* 메인 텍스트 */}
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800 mb-1">
                    AI가 강의 데이터를 분석하고 있습니다
                    <span className="dot1 inline-block mx-0.5 text-blue-600">.</span>
                    <span className="dot2 inline-block mx-0.5 text-blue-600">.</span>
                    <span className="dot3 inline-block mx-0.5 text-blue-600">.</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {courses.length.toLocaleString()}개 강좌 · 예상 소요 시간 10~30초
                  </p>
                </div>

                {/* 단계 진행 패널 */}
                <div className="w-full max-w-sm flex flex-col gap-2">
                  {LOADING_STEPS.map((step, i) => {
                    const StepIcon = step.icon
                    const isDone = i < activeStep
                    const isActive = i === activeStep
                    return (
                      <div key={i}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-500 ${isActive ? 'step-active' : ''}`}
                        style={{
                          backgroundColor: isDone
                            ? '#ecfdf5'
                            : isActive
                            ? '#eff6ff'
                            : '#f8fafc',
                          borderColor: isDone
                            ? '#a7f3d0'
                            : isActive
                            ? '#bfdbfe'
                            : '#f1f5f9',
                          opacity: i > activeStep ? 0.4 : 1,
                        }}>
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                          style={{
                            backgroundColor: isDone
                              ? '#d1fae5'
                              : isActive
                              ? '#dbeafe'
                              : '#e2e8f0',
                          }}>
                          {isDone
                            ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                            : isActive
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            : <StepIcon className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: isDone ? '#065f46' : isActive ? '#1e40af' : '#64748b' }}>
                            {step.label}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: isDone ? '#047857' : '#94a3b8' }}>
                            {step.detail}
                          </p>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            진행 중
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            완료
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 경과 시간 + 진행 바 */}
                <div className="w-full max-w-sm">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
                    <span>경과 시간: <span className="text-blue-600 font-bold">{formatElapsed(elapsed)}</span></span>
                    <span>최대 30초</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100">
                    <div
                      className="h-full rounded-full progress-bar"
                      style={{
                        '--target-w': `${Math.min((elapsed / 30000) * 100, 95)}%`,
                        width: `${Math.min((elapsed / 30000) * 100, 95)}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #2563eb, #60a5fa)',
                        transition: 'width 0.5s ease',
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 에러 */}
            {error && (
              <div className="flex flex-col items-center gap-3 py-10 px-6 rounded-xl border text-center bg-rose-50 border-rose-200">
                <p className="font-semibold text-rose-600">분석 중 오류가 발생했습니다.</p>
                <p className="text-sm text-rose-500">{error.message}</p>
                <p className="text-xs text-slate-400">.env.local에 GOOGLE_GENERATIVE_AI_API_KEY가 설정되어 있는지 확인하세요.</p>
                <button onClick={handleRetry}
                  className="mt-2 flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-rose-300 text-rose-600 bg-white hover:bg-rose-50 transition-colors shadow-sm font-semibold">
                  <RefreshCw className="w-4 h-4" /> 다시 시도
                </button>
              </div>
            )}

            {/* 분석 결과 */}
            {completion && (
              <div className="ai-content">
                <div dangerouslySetInnerHTML={{
                  __html: renderMarkdown(completion) + (isLoading ? '<span class="ai-cursor"></span>' : ''),
                }} />
              </div>
            )}
          </div>

          {/* ── 푸터 ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t text-xs border-slate-200 text-slate-400 bg-slate-50">
            <span>Powered by Gemini 1.5 Flash-Lite</span>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin" />
                {completion ? '텍스트 스트리밍 중…' : `분석 중 (${formatElapsed(elapsed)})`}
              </span>
            )}
            {!isLoading && completion && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Check className="w-3 h-3" /> 분석 완료
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
