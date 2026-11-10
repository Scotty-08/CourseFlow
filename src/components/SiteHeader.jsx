import { NavLink } from 'react-router-dom'
import { usePlanner } from '../state/PlannerContext.jsx'

const links = [
  { to: '/', label: 'Courses', end: true },
  { to: '/cart', label: 'Cart', badge: 'cart' },
  { to: '/planner', label: 'Planner' },
]

function SiteHeader() {
  const { state } = usePlanner()

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="brand" aria-label="CourseFlow home">
          <span className="brand__mark" aria-hidden="true">
            CF
          </span>
          <span className="brand__text">
            Course<span className="brand__flow">Flow</span>
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
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
