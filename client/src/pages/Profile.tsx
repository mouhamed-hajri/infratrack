import { useState, useRef, type FormEvent } from 'react'
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
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()

  // Info section
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [infoMsg, setInfoMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [infobusy, setInfoBusy] = useState(false)

  // Password section
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  // CIN section
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [cinCardFile, setCinCardFile] = useState<File | null>(null)
  const [cinCardPreview, setCinCardPreview] = useState<string | null>(null)
  const [cinMsg, setCinMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [cinBusy, setCinBusy] = useState(false)
  const selfieRef = useRef<HTMLInputElement>(null)
  const cinCardRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  async function saveInfo(e: FormEvent) {
    e.preventDefault()
    setInfoMsg(null)
    setInfoBusy(true)
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() })
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

  function pickPhoto(file: File, setFile: (f: File) => void, setPreview: (s: string) => void) {
    setFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function resizeToBase64(file: File, maxDim = 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = url
    })
  }

  async function submitCin(e: FormEvent) {
    e.preventDefault()
    setCinMsg(null)
    if (!selfieFile || !cinCardFile) {
      setCinMsg({ type: 'error', text: 'Please take both a selfie and a photo of your CIN card.' })
      return
    }
    setCinBusy(true)
    try {
      const [selfieBase64, cinPhotoBase64] = await Promise.all([
        resizeToBase64(selfieFile),
        resizeToBase64(cinCardFile),
      ])
      const updated = await verifyCin(selfieBase64, cinPhotoBase64)
      updateUser(updated)
      setCinMsg({ type: 'success', text: `Identity confirmed! CIN ${updated.cin} verified.` })
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
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Phone number</label>
                  <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                Take a selfie and a photo of your Tunisian CIN card. Our AI will read your ID number and confirm it's really you.
              </p>
              <form onSubmit={submitCin} className="space-y-5">
                {cinMsg && <StatusMsg type={cinMsg.type} msg={cinMsg.text} />}

                {/* Selfie */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">Selfie</label>
                  <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) pickPhoto(f, setSelfieFile, setSelfiePreview) }} />
                  {selfiePreview ? (
                    <div className="relative w-fit">
                      <img src={selfiePreview} alt="selfie preview" className="h-32 w-32 rounded-2xl object-cover ring-1 ring-ink/10" />
                      <button type="button" onClick={() => { setSelfieFile(null); setSelfiePreview(null) }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-clay text-paper text-xs shadow">✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => selfieRef.current?.click()}
                      className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 text-muted transition hover:border-brand/40 hover:text-brand">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span className="text-xs">Take selfie</span>
                    </button>
                  )}
                </div>

                {/* CIN card photo */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">CIN card photo</label>
                  <input ref={cinCardRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) pickPhoto(f, setCinCardFile, setCinCardPreview) }} />
                  {cinCardPreview ? (
                    <div className="relative w-fit">
                      <img src={cinCardPreview} alt="CIN card preview" className="h-28 w-48 rounded-2xl object-cover ring-1 ring-ink/10" />
                      <button type="button" onClick={() => { setCinCardFile(null); setCinCardPreview(null) }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-clay text-paper text-xs shadow">✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => cinCardRef.current?.click()}
                      className="flex h-28 w-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 text-muted transition hover:border-brand/40 hover:text-brand">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                      <span className="text-xs">Photo of CIN card</span>
                    </button>
                  )}
                </div>

                <Button type="submit" disabled={cinBusy || user.cinVerified || !selfieFile || !cinCardFile} icon={false}>
                  {cinBusy ? 'Analysing with AI…' : user.cinVerified ? 'Identity confirmed' : 'Verify identity'}
                </Button>
              </form>
            </Surface>

          </div>
        </div>
      </Reveal>
    </main>
  )
}
