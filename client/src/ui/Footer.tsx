// CSS-glass strip — full-width and reliable (same reasoning as Nav).
export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#0a0f1e]/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-8 py-8 text-sm text-slate-400 sm:flex-row">
        <span className="font-semibold text-white">
          Infra<span className="text-[#4f8ef7]">Track</span>
        </span>
        <span className="font-light">Smarter cities, transparent streets — Tunisia 2026</span>
        <span className="font-light">Built for IEEE ISIMM</span>
      </div>
    </footer>
  )
}
