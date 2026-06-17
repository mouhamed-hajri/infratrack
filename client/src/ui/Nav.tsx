import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from './Button'
import { useEffect, useRef, useState } from 'react'

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export function Nav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const active = (path: string) =>
    location.pathname === path
      ? 'text-ink font-medium after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-brand'
      : 'hover:text-ink'

  function handleLogout() { logout(); navigate('/'); setOpen(false) }

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-4 z-50 hidden md:flex justify-center">
      <nav className="flex items-center gap-6 rounded-full bg-card/80 px-6 py-2.5 backdrop-blur-md ring-1 ring-ink/10 shadow-[0_1px_2px_rgba(40,30,15,.04),0_12px_32px_-12px_rgba(40,30,15,.12)]">
        {/* Logo */}
        <Link to="/" className="text-base font-semibold tracking-tight text-ink shrink-0">
          Infra<span className="text-brand">Track</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5 text-sm text-muted">
          <button onClick={() => scrollTo('how')} className="relative transition-colors duration-200 hover:text-ink">
            How it works
          </button>
          <button onClick={() => scrollTo('issues')} className="relative transition-colors duration-200 hover:text-ink">
            Issues
          </button>
          {user && (
            <Link to="/my-reports" className={`relative transition-colors duration-200 ${active('/my-reports')}`}>
              My reports
            </Link>
          )}
          {(user?.role === 'AUTHORITY' || user?.role === 'ADMIN') && (
            <Link to="/dashboard" className={`relative transition-colors duration-200 ${active('/dashboard')}`}>
              Dashboard
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className={`relative transition-colors duration-200 ${active('/admin')}`}>
              Admin
            </Link>
          )}
        </div>

        {/* Auth area */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-full bg-paper-2/60 pl-1.5 pr-3.5 py-1.5 text-sm ring-1 ring-ink/10 transition hover:ring-ink/20"
            >
              {/* Avatar */}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-paper">
                {(user.name || '?').charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[120px] truncate text-ink">{user.name}</span>
              {/* Chevron */}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-card/95 p-1.5 shadow-lg ring-1 ring-ink/10 backdrop-blur-md">
                <div className="px-3 py-2 border-b border-ink/8 mb-1">
                  <p className="text-xs font-medium text-ink truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
                <DropItem to="/profile" onClick={() => setOpen(false)} icon={
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                }>My profile</DropItem>
                <DropItem to="/my-reports" onClick={() => setOpen(false)} icon={
                  <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>
                }>My reports</DropItem>
                {(user.role === 'AUTHORITY' || user.role === 'ADMIN') && (
                  <DropItem to="/dashboard" onClick={() => setOpen(false)} icon={
                    <><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></>
                  }>Dashboard</DropItem>
                )}
                {user.role === 'ADMIN' && (
                  <DropItem to="/admin" onClick={() => setOpen(false)} icon={
                    <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>
                  }>Admin</DropItem>
                )}
                <div className="mt-1 border-t border-ink/8 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-clay transition hover:bg-clay/8"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/login')} icon={false}>Sign in</Button>
            <Button onClick={() => navigate('/register')} icon={false}>Register</Button>
          </div>
        )}
      </nav>
    </header>
  )
}

function DropItem({ to, onClick, icon, children }: { to: string; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-ink/4 hover:text-ink"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {children}
    </Link>
  )
}
