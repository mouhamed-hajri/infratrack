import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Footer() {
  const { user } = useAuth()
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:flex-row md:px-8">
        <span className="font-semibold text-ink">
          Infra<span className="text-brand">Track</span>
        </span>
        <span>Smarter cities, transparent streets — Tunisia 2026</span>
        <div className="flex items-center gap-4">
          {user && <Link to="/profile" className="transition-colors hover:text-ink">My account</Link>}
          <span>Built for IEEE ISIMM</span>
        </div>
      </div>
    </footer>
  )
}
