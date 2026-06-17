import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from './Button'

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export function Nav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/') }

  return (
    <header className="fixed inset-x-0 top-4 z-50 hidden md:flex justify-center">
      <nav className="flex items-center gap-6 rounded-full bg-card/80 px-6 py-2.5 backdrop-blur-md ring-1 ring-ink/10 shadow-[0_1px_2px_rgba(40,30,15,.04),0_12px_32px_-12px_rgba(40,30,15,.12)]">
        <Link to="/" className="text-base font-semibold tracking-tight text-ink">
          Infra<span className="text-brand">Track</span>
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted">
          <button onClick={() => scrollTo('how')} className="transition-colors duration-200 hover:text-ink">How it works</button>
          <button onClick={() => scrollTo('issues')} className="transition-colors duration-200 hover:text-ink">Issues</button>
          {user && <Link to="/my-reports" className="transition-colors duration-200 hover:text-ink">My reports</Link>}
          {(user?.role === 'AUTHORITY' || user?.role === 'ADMIN') && (
            <Link to="/dashboard" className="transition-colors duration-200 hover:text-ink">Dashboard</Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="transition-colors duration-200 hover:text-ink">Admin</Link>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <Link to="/profile" className="text-sm text-muted transition-colors hover:text-ink">{user.name}</Link>
            <Button variant="ghost" onClick={handleLogout} icon={false}>Sign out</Button>
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
