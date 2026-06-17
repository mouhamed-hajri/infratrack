import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../lib/api'
import { Surface } from '../ui/Surface'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setState('error'); setMessage('No verification token found in the link.'); return }
    verifyEmail(token)
      .then((r) => { setState('success'); setMessage(r.message) })
      .catch((e) => { setState('error'); setMessage(e instanceof Error ? e.message : 'Verification failed') })
  }, [token])

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md items-center px-5 py-24">
      <div className="w-full">
        <Surface className="p-8 text-center space-y-4">
          {state === 'loading' && (
            <>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              <p className="text-sm text-muted">Verifying your email…</p>
            </>
          )}
          {state === 'success' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3F7D5B12]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3F7D5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Email verified!</h2>
                <p className="mt-2 text-sm text-muted">{message}</p>
              </div>
              <Link to="/login" className="inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-brand-deep">
                Sign in now
              </Link>
            </>
          )}
          {state === 'error' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#A8321F12]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A8321F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Verification failed</h2>
                <p className="mt-2 text-sm text-muted">{message}</p>
              </div>
              <Link to="/register" className="text-sm font-medium text-brand underline underline-offset-2">
                Register again
              </Link>
            </>
          )}
        </Surface>
      </div>
    </main>
  )
}
