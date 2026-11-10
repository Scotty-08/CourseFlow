import { NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme.js'
import { usePlanner } from '../state/PlannerContext.jsx'

const links = [
  { to: '/', label: 'Courses', end: true },
  { to: '/cart', label: 'Cart', badge: 'cart' },
  { to: '/planner', label: 'Planner' },
]

function SiteHeader() {
  const { state } = usePlanner()
  const { theme, toggle } = useTheme()

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="brand" aria-label="CourseFlow home">
          <span className="brand__mark" aria-hidden="true">
            CF
          </span>
          <span className="brand__text glitch-hover">
            ~/course<span className="brand__flow">flow</span>
            <span className="brand__cursor" aria-hidden="true" />
          </span>
        </NavLink>
        <nav className="nav" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
            >
              {link.label}
              {link.badge === 'cart' && state.cart.length > 0 && (
                <span className="nav__badge" aria-label={`${state.cart.length} in cart`}>
                  {state.cart.length}
                </span>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            className="nav__theme"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
