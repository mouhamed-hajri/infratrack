import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { Eyebrow } from '../ui/Eyebrow'

const inputCls = 'w-full rounded-2xl bg-paper-2/50 px-4 py-3.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md items-center px-5 py-24">
      <div className="w-full space-y-6">
        <div>
          <Eyebrow>Create account</Eyebrow>
          <h1 className="mt-4 text-3xl">Join InfraTrack</h1>
          <p className="mt-2 text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand underline underline-offset-2">Sign in</Link>
          </p>
        </div>
        <Surface className="p-7">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p className="rounded-xl px-4 py-3 text-sm" style={{ color: '#A8321F', backgroundColor: '#A8321F12' }}>
                {error}
              </p>
            )}
            <input className={inputCls} placeholder="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className={inputCls} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={inputCls} type="password" placeholder="Password (min 6 characters)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
          </form>
        </Surface>
      </div>
    </main>
  )
}
