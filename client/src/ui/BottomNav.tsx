import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const active = (path: string) => location.pathname === path ? 'text-brand' : 'text-muted'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-card/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around pb-safe pt-2">
        <Link to="/" className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active('/')}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-xs">Home</span>
        </Link>

        <button
          onClick={() => { if (!user) { navigate('/login'); return } document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' }) }}
          className="flex flex-col items-center gap-1 px-4 py-2 text-muted transition-colors active:text-brand"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="text-xs">Report</span>
        </button>

        {user ? (
          <Link to="/my-reports" className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active('/my-reports')}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="text-xs">Mine</span>
          </Link>
        ) : (
          <Link to="/login" className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${active('/login')}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-xs">Sign in</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
