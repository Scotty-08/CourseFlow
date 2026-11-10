import { Link } from 'react-router-dom'

function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-espresso)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link to="/" className="text-2xl font-bold text-[var(--color-text)]">
          Course<span className="text-[var(--color-gold)]">Flow</span>
        </Link>
        <Link to="/" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
          Browse courses
        </Link>
      </div>
    </header>
  )
}

export default SiteHeader
