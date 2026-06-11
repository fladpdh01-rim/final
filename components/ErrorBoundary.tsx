'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { WifiOff, ShieldAlert, Server, Database, AlertTriangle, RefreshCw } from 'lucide-react'

export type ErrorType = 'network' | 'permission' | 'server' | 'empty' | 'general'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
  errorType?: ErrorType
  errorMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorType?: ErrorType
}

export function ErrorPanel({
  type = 'general',
  message,
  onRetry,
}: {
  type?: ErrorType
  message?: string
  onRetry?: () => void
}) {
  const configs = {
    network: {
      title: '네트워크 오류',
      description: '인터넷 연결이 불안정하거나 서버에 연결할 수 없습니다.',
      icon: WifiOff,
      color: 'text-amber-500',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/50',
    },
    permission: {
      title: '권한 오류',
      description: '데이터를 조회할 수 있는 접근 권한이 없습니다. 관리자에게 문의하세요.',
      icon: ShieldAlert,
      color: 'text-rose-500',
      borderColor: 'border-rose-200',
      bgColor: 'bg-rose-50/50',
    },
    server: {
      title: '서버 오류',
      description: '데이터베이스 서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      icon: Server,
      color: 'text-red-500',
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50/50',
    },
    empty: {
      title: '데이터 없음',
      description: '선택한 조건에 일치하는 교과목 데이터가 존재하지 않습니다.',
      icon: Database,
      color: 'text-sky-500',
      borderColor: 'border-sky-200',
      bgColor: 'bg-sky-50/50',
    },
    general: {
      title: '일시적인 오류 발생',
      description: '데이터를 로딩하는 중 알 수 없는 문제가 발생했습니다.',
      icon: AlertTriangle,
      color: 'text-violet-500',
      borderColor: 'border-violet-200',
      bgColor: 'bg-violet-50/50',
    },
  }

  const current = configs[type] || configs.general
  const Icon = current.icon

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-xl border text-center transition-all duration-300 ${current.borderColor} ${current.bgColor} w-full min-h-[200px]`}
    >
      <div className={`p-4 rounded-full bg-slate-100 mb-4`}>
        <Icon className={`w-10 h-10 ${current.color} animate-pulse`} />
      </div>
      <h4 className="text-lg font-bold text-slate-800 mb-2">{current.title}</h4>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {message || current.description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      )}
    </div>
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  public render() {
    // 1. Explicit error state passed as props (e.g. simulated dashboard errors)
    if (this.props.errorType && this.props.errorType !== 'general') {
      return (
        <ErrorPanel
          type={this.props.errorType}
          message={this.props.errorMessage}
          onRetry={this.props.onRetry}
        />
      )
    }

    // 2. React JS rendering error caught
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <ErrorPanel
          type="general"
          message={this.state.error?.message}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}
