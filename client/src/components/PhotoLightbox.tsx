import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function PhotoLightbox({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    // Hide navbars while lightbox is open
    document.body.classList.add('lightbox-open')
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.classList.remove('lightbox-open')
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink shadow-lg transition hover:bg-paper-2"
        aria-label="Close"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>,
    document.body,
  )
}
