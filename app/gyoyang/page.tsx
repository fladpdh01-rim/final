import { redirect } from 'next/navigation'

/**
 * /gyoyang → /dashboard/liberal-arts 로 리다이렉트
 */
export default function GyoyangRedirect() {
  redirect('/dashboard/liberal-arts')
}
