import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Session exchange error:', error.message)
      }
    } catch (err) {
      console.error('Failed to exchange code for session:', err)
    }
  }

  // 팝업 로그인의 경우, 성공 시 부모 창에 메시지를 전송하고 팝업 창을 닫는 HTML을 반환합니다.
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>인증 완료</title>
      </head>
      <body>
        <p>인증 성공! 로그인 완료 중입니다...</p>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'supabase-auth-success' }, window.location.origin);
              window.close();
            } else {
              window.location.href = '/';
            }
          } catch (err) {
            console.error('Callback communication error:', err);
            window.location.href = '/';
          }
        </script>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  )
}
