const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

// CSS-glass strip (not LiquidGlass): guarantees a clean full-width bar and lets it
// hold a button — a LiquidGlass strip can't reliably stretch or nest a glass button.
export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0f1e]/50 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-8">
        <span className="text-lg font-semibold tracking-tight text-white">
          Infra<span className="text-[#4f8ef7]">Track</span>
        </span>
        <div className="hidden items-center gap-8 text-sm font-light text-slate-300 md:flex">
          <button onClick={() => scrollTo('how')} className="transition hover:text-white">How it works</button>
          <button onClick={() => scrollTo('report')} className="transition hover:text-white">Report</button>
          <button onClick={() => scrollTo('issues')} className="transition hover:text-white">Issues</button>
        </div>
        <button onClick={() => scrollTo('report')} className="glass-btn px-5 py-2 text-sm font-medium">
          Report an issue
        </button>
      </nav>
    </header>
  )
}
