'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CourseRawData } from '@/components/CourseDetailTable'
import fallbackCourses from '@/lib/data/courses.json'

export function useCourseData() {
  const [courses, setCourses] = useState<CourseRawData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Supabase URL & Anon Key check
        const hasUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const hasKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!hasUrl || !hasKey) {
          console.warn('Supabase credentials missing, falling back to local courses.json')
          // Filter out rows that might be headers/empty to match the expected ~2313 rows
          const filtered = (fallbackCourses as CourseRawData[]).filter(
            c => c.course_name && c.college && c.department
          ).map(c => {
            if (c.college === '단과대구분없음') {
              return { ...c, college: '동북아국제통상물류학부' }
            }
            return c
          })
          setCourses(filtered.slice(0, 2313)) // Exact number expected on Supabase import
          setLoading(false)
          return
        }

        const { data, error: sbError } = await supabase
          .from('courses')
          .select('*')

        if (sbError) {
          throw sbError
        }

        // 폴백 데이터 준비 함수
        const getFallbackCourses = () => {
          return (fallbackCourses as CourseRawData[]).filter(
            c => c.course_name && c.college && c.department
          ).map(c => {
            if (c.college === '단과대구분없음') {
              return { ...c, college: '동북아국제통상물류학부' }
            }
            return c
          }).slice(0, 2313)
        }

        if (data && data.length > 0) {
          const mapped = (data as CourseRawData[]).map(c => {
            if (c.college === '단과대구분없음') {
              return { ...c, college: '동북아국제통상물류학부' }
            }
            return c
          })
          setCourses(mapped)
        } else {
          // 콘솔 에러 없이 자연스럽게 폴백 처리
          setCourses(getFallbackCourses())
        }
      } catch (err: any) {
        console.error('Failed to fetch from Supabase:', err.message)
        setError(err.message)
        // 기타 통신 에러 발생 시에도 폴백 처리
        const filtered = (fallbackCourses as CourseRawData[]).filter(
          c => c.course_name && c.college && c.department
        ).map(c => {
          if (c.college === '단과대구분없음') {
            return { ...c, college: '동북아국제통상물류학부' }
          }
          return c
        })
        setCourses(filtered.slice(0, 2313))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { courses, loading, error }
}
