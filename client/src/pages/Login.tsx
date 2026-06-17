import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { Eyebrow } from '../ui/Eyebrow'

const inputCls = 'w-full rounded-2xl bg-paper-2/50 px-4 py-3.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md items-center px-5 py-24">
      <div className="w-full space-y-6">
        <div>
          <Eyebrow>Sign in</Eyebrow>
          <h1 className="mt-4 text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">
            No account?{' '}
            <Link to="/register" className="font-medium text-brand underline underline-offset-2">Register</Link>
          </p>
        </div>
        <Surface className="p-7">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p className="rounded-xl px-4 py-3 text-sm" style={{ color: '#A8321F', backgroundColor: '#A8321F12' }}>
                {error}
              </p>
            )}
            <input className={inputCls} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={inputCls} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          </form>
        </Surface>
        <p className="text-center text-xs text-muted">
          Demo: <span className="font-mono">citizen@demo.tn</span> / <span className="font-mono">demo1234</span>
        </p>
      </div>
    </main>
  )
}
