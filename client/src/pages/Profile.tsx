import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { updateProfile, verifyCin } from '../lib/api'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'

const inputCls = 'w-full rounded-2xl bg-paper-2/50 px-4 py-3.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

function StatusMsg({ type, msg }: { type: 'error' | 'success'; msg: string }) {
  const styles = type === 'error'
    ? { color: '#A8321F', backgroundColor: '#A8321F12' }
    : { color: '#3F7D5B', backgroundColor: '#3F7D5B12' }
  return <p className="rounded-xl px-4 py-3 text-sm" style={styles}>{msg}</p>
}

export function Profile() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  // Info section
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [infoMsg, setInfoMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [infobusy, setInfoBusy] = useState(false)

  // Password section
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  // CIN section
  const [cin, setCin] = useState(user?.cin ?? '')
  const [cinMsg, setCinMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [cinBusy, setCinBusy] = useState(false)

  if (!user) return null

  async function saveInfo(e: FormEvent) {
    e.preventDefault()
    setInfoMsg(null)
    setInfoBusy(true)
    try {
      await updateProfile({ name: name.trim(), email: email.trim() })
      setInfoMsg({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setInfoMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' })
    } finally {
      setInfoBusy(false)
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    setPwBusy(true)
    try {
      await updateProfile({ currentPassword: currentPw, newPassword: newPw })
      setPwMsg({ type: 'success', text: 'Password changed.' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' })
    } finally {
      setPwBusy(false)
    }
  }

  async function submitCin(e: FormEvent) {
    e.preventDefault()
    setCinMsg(null)
    setCinBusy(true)
    try {
      await verifyCin(cin.trim())
      setCinMsg({ type: 'success', text: 'Identity confirmed. CIN saved.' })
    } catch (err) {
      setCinMsg({ type: 'error', text: err instanceof Error ? err.message : 'Verification failed' })
    } finally {
      setCinBusy(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  const roleLabel: Record<string, string> = { CITIZEN: 'Citizen', AUTHORITY: 'Authority', ADMIN: 'Admin' }

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 md:px-8 md:pb-16 md:pt-32">
      <Reveal>
        <Eyebrow>Account</Eyebrow>
        <h1 className="mt-4 mb-10 text-3xl md:text-4xl">My profile</h1>

        <div className="grid gap-6 md:grid-cols-3">

          {/* Left — identity card */}
          <div className="md:col-span-1">
            <Surface className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-3xl font-display font-semibold text-paper">
                {(user.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-ink">{user.name}</p>
                <p className="text-sm text-muted">{user.email}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand">
                  {roleLabel[user.role] ?? user.role}
                </span>
              </div>
              {user.cinVerified && (
                <div className="flex items-center gap-2 rounded-xl bg-[#3F7D5B12] px-4 py-2 text-sm text-[#3F7D5B]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Identity verified
                </div>
              )}
              <button
                onClick={handleLogout}
                className="mt-2 w-full rounded-2xl bg-paper-2/60 px-4 py-3 text-sm font-medium text-clay ring-1 ring-clay/20 transition hover:bg-clay/10"
              >
                Sign out
              </button>
            </Surface>
          </div>

          {/* Right — forms */}
          <div className="space-y-6 md:col-span-2">

            {/* Account info */}
            <Surface className="p-6">
              <h2 className="mb-5 text-lg font-semibold text-ink">Account info</h2>
              <form onSubmit={saveInfo} className="space-y-4">
                {infoMsg && <StatusMsg type={infoMsg.type} msg={infoMsg.text} />}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Full name</label>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Email</label>
                  <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" disabled={infobusy} icon={false}>{infobusy ? 'Saving…' : 'Save changes'}</Button>
              </form>
            </Surface>

            {/* Change password */}
            <Surface className="p-6">
              <h2 className="mb-5 text-lg font-semibold text-ink">Change password</h2>
              <form onSubmit={savePassword} className="space-y-4">
                {pwMsg && <StatusMsg type={pwMsg.type} msg={pwMsg.text} />}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Current password</label>
                  <input className={inputCls} type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">New password</label>
                  <input className={inputCls} type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Confirm new password</label>
                  <input className={inputCls} type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
                </div>
                <Button type="submit" disabled={pwBusy} icon={false}>{pwBusy ? 'Saving…' : 'Change password'}</Button>
              </form>
            </Surface>

            {/* CIN identity */}
            <Surface className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-ink">Identity verification</h2>
                {user.cinVerified && (
                  <span className="rounded-full bg-[#3F7D5B12] px-2.5 py-0.5 text-xs font-semibold text-[#3F7D5B]">Verified</span>
                )}
              </div>
              <p className="mb-4 text-sm text-muted">
                Enter your Tunisian national ID number (CIN) to confirm your identity. This helps authorities trust your reports.
              </p>
              <form onSubmit={submitCin} className="space-y-4">
                {cinMsg && <StatusMsg type={cinMsg.type} msg={cinMsg.text} />}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">CIN number (8 digits)</label>
                  <input
                    className={`${inputCls} tabular-nums tracking-widest`}
                    placeholder="12345678"
                    maxLength={8}
                    value={cin}
                    onChange={(e) => setCin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <Button type="submit" disabled={cinBusy || user.cinVerified} icon={false}>
                  {cinBusy ? 'Verifying…' : user.cinVerified ? 'Identity confirmed' : 'Confirm identity'}
                </Button>
              </form>
            </Surface>

          </div>
        </div>
      </Reveal>
    </main>
  )
}
