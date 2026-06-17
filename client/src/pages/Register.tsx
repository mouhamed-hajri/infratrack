import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { Eyebrow } from '../ui/Eyebrow'

const inputCls = 'w-full rounded-2xl bg-paper-2/50 px-4 py-3.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted">{label}</label>
      {children}
    </div>
  )
}

export function Register() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      await register(name, email, password, phone)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md items-center px-5 py-24">
        <div className="w-full space-y-6">
          <Surface className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3F7D5B12]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3F7D5B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Check your inbox</h2>
              <p className="mt-2 text-sm text-muted">
                We sent a verification link to <span className="font-medium text-ink">{email}</span>.
                Click it to activate your account.
              </p>
            </div>
            <p className="text-xs text-muted">
              Already verified?{' '}
              <Link to="/login" className="font-medium text-brand underline underline-offset-2">Sign in</Link>
            </p>
          </Surface>
        </div>
      </main>
    )
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
            <Field label="Full name">
              <input className={inputCls} placeholder="Amine Hajjour" autoComplete="name"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Email">
              <input className={inputCls} type="email" placeholder="you@example.com" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Phone number">
              <input className={inputCls} type="tel" placeholder="+216 XX XXX XXX" autoComplete="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </Field>
            <Field label="Password (min 8 characters)">
              <input className={inputCls} type="password" placeholder="••••••••" autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </Field>
            <Field label="Confirm password">
              <input className={inputCls} type="password" placeholder="••••••••" autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </Field>

            <p className="text-xs text-muted leading-relaxed pt-1">
              After registering, verify your email to sign in. To submit reports, you'll also need to verify your identity (selfie + CIN) from your profile.
            </p>

            <Button type="submit" disabled={busy} icon={false}>
              {busy ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Surface>
      </div>
    </main>
  )
}
